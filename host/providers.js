/**
 * Capability providers — third-party DSH plugins mounted per Session.
 *
 * A provider is a third-party plugin *record*: which plugin entry it came from,
 * how it may be mounted, and whether it is still wanted. The live mount lives in
 * `host/session.js`; the plugin-manager and loader glue lives in
 * `host/capability-catalog.js`. This file stays pure so it is testable without a
 * running Harness.
 *
 * The flow, and why each step exists:
 *
 *   1. register  The user picks an installed third-party plugin entry. The hub
 *                reads `apply` / `inject` / `Config` from the module to judge
 *                mountability (a missing `apply` means a client-only bundle).
 *   2. takeover  `pluginManager.setPluginEnabled(entryId, false)` so the entry
 *                stops running profile-wide — "installed, not composed". The
 *                module stays importable through `loader.import(name)`.
 *   3. mount     In `agent/created`, when the Session's preset lists the
 *                provider and `mountAt` allows it, mount the module on
 *                `agent.ctx`. Capability plugins must never be composed
 *                globally, or two Sessions cannot differ.
 *
 * `mountAt`:
 *   session-start  Decide before the first turn. Anything that injects into the
 *                  system prompt (Project Memory) belongs here; changing it
 *                  mid-session would invalidate the prompt cache and give the
 *                  Session two different world views. Default.
 *   any-time       Tools-only contributions, safe to change at a turn boundary.
 */

export const MOUNT_AT = new Set(['session-start', 'any-time']);

/**
 * Mountability verdicts.
 *
 *   mountable     Static checks passed; mounting per Session should work.
 *   review        Static checks passed but something is unproven (an unknown
 *                 `inject`, or a probe that showed no contribution). Allowed,
 *                 labelled for the user to decide.
 *   profile-only  Cannot be mounted per Session; only viewable.
 */
export const VERDICT_LEVELS = new Set(['mountable', 'review', 'profile-only']);

/**
 * A permanent fact about a plugin, learned from a mount failure.
 *
 *   global-resource  The plugin registers something the process owns once:
 *                    an exact/prefix HTTP route, an upgrade route, a listening
 *                    port. Two instances cannot coexist in the process, so only
 *                    one Agent can mount it at a time. `dsh-llm-wiki` is one:
 *                    it registers `/wiki/tree`, `/wiki/page`, `/wiki/staged`
 *                    on the shared `webServer`, and `WebServer.register()`
 *                    keeps one process-wide table that throws on duplicates.
 *   already-mounted  The same Agent mounted it twice. Defensive only: the hub
 *                    checks before mounting, so this should stay unreachable.
 */
export const ISSUE_KINDS = new Set(['global-resource', 'already-mounted']);

/**
 * Classify an error raised while mounting a provider.
 * @returns `'global-resource'`, `'already-mounted'`, or `null` for an ordinary
 *   failure that says nothing permanent about the plugin.
 */
export function classifyMountError(value) {
  const text = typeof value === 'string' ? value : String(value?.message ?? value ?? '');
  if (/duplicate\s+(?:(?:exact|prefix)\s+)?route/i.test(text)) return 'global-resource';
  if (/duplicate\s+upgrade\s+route/i.test(text)) return 'global-resource';
  if (/EADDRINUSE|address already in use/i.test(text)) return 'global-resource';
  if (/already registered in this scope/i.test(text)) return 'already-mounted';
  return null;
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

/**
 * The recorded mountability judgement. Only a cache: recomputed on every
 * register / recheck, never trusted as truth for behaviour.
 */
export function normalizeVerdict(raw) {
  const value = asRecord(raw);
  if (!VERDICT_LEVELS.has(value.level)) return undefined;
  return {
    level: value.level,
    reasons: asStringArray(value.reasons),
    checkedAt: asString(value.checkedAt),
    dshVersion: asString(value.dshVersion),
  };
}

/** The stored classification of a mount failure, or `undefined`. */
export function normalizeIssue(raw) {
  const value = asRecord(raw);
  if (!ISSUE_KINDS.has(value.kind)) return undefined;
  return {
    kind: value.kind,
    message: asString(value.message),
    at: asString(value.at),
  };
}

/**
 * Coerce one stored provider record.
 * @returns The record, or `undefined` when it has no usable identity.
 */
export function normalizeProvider(raw) {
  const value = asRecord(raw);
  const id = asString(value.id);
  const entryId = asString(value.entryId);
  if (id.length === 0 || entryId.length === 0) return undefined;
  const verdict = normalizeVerdict(value.verdict);
  const issue = normalizeIssue(value.issue);
  return {
    id,
    entryId,
    packageName: asString(value.packageName, entryId),
    mountAt: MOUNT_AT.has(value.mountAt) ? value.mountAt : 'session-start',
    config: { ...asRecord(value.config) },
    enabled: value.enabled !== false,
    ...(verdict === undefined ? {} : { verdict }),
    ...(issue === undefined ? {} : { issue }),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
}

export function cloneProvider(provider) {
  return {
    ...provider,
    config: { ...provider.config },
    ...(provider.verdict === undefined
      ? {}
      : { verdict: { ...provider.verdict, reasons: [...provider.verdict.reasons] } }),
    ...(provider.issue === undefined ? {} : { issue: { ...provider.issue } }),
  };
}

/** The record's mount timing, defaulting the same way `normalizeProvider` does. */
export function mountAtOf(provider) {
  return MOUNT_AT.has(provider?.mountAt) ? provider.mountAt : 'session-start';
}

/** The provider ids a preset wants active (an entry marked `enabled: false` is not). */
export function desiredProviderIds(preset) {
  const desired = preset?.plugins?.desired;
  if (!Array.isArray(desired)) return [];
  return desired
    .filter((item) => item && typeof item.providerId === 'string' && item.enabled !== false)
    .map((item) => item.providerId);
}

/** Whether this preset wants the provider mounted. */
export function isProviderDesired(preset, providerId) {
  return desiredProviderIds(preset).includes(providerId);
}

/** Stable comparison of two `plugins.desired` lists, ignoring order and disabled rows. */
export function sameProviders(left, right) {
  const a = new Set(desiredProviderIds({ plugins: left }));
  const b = new Set(desiredProviderIds({ plugins: right }));
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}

/**
 * The shape the Session panel and the Settings list render.
 * @param provider - the stored record.
 * @param runtime - `{ status, error, desired, contributions, name }` from the
 *   live mount, if the Session has one.
 */
export function providerView(provider, runtime = {}) {
  return {
    providerId: provider.id,
    name: runtime.name ?? provider.packageName,
    packageName: provider.packageName,
    entryId: provider.entryId,
    mountAt: mountAtOf(provider),
    enabled: provider.enabled !== false,
    desired: runtime.desired === true,
    status: runtime.status ?? 'off',
    error: runtime.error ?? null,
    // A permanent fact learned from a failure (`global-resource`), shown so the
    // user can act on it instead of re-trying blindly.
    issue: provider.issue ?? null,
    contributions: runtime.contributions ?? { tools: [], sections: [] },
    verdict: provider.verdict ?? null,
  };
}
