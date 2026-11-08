import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nowIso } from './util.js';

/**
 * Capability catalog — translates the plugin manager and the loader into the
 * "third-party plugin that could become a capability provider" rows the UI
 * shows.
 *
 * Everything that needs a live `ctx` lives here, so `host/providers.js` stays a
 * pure data layer and one file owns every `pluginManager` call.
 *
 * Mountability is judged in one pass of static checks:
 *
 *   apply present       A module without `apply` is a client-only bundle. It can
 *                       never be mounted on an Agent scope.
 *   addressable         `listPlugins()` must expose `patchId`; otherwise
 *                       `setPluginEnabled` refuses it and takeover is impossible.
 *   third party         DSH's own plugins are the Harness itself; managing them
 *                       here would let a Session switch off the model loop.
 *   inject resolvable   Every service the module declares must exist in an Agent
 *                       scope. A live Agent answers this exactly; without one the
 *                       check falls back to a known-good list and anything
 *                       unfamiliar downgrades the verdict to `review`.
 *
 * What this deliberately does **not** do: mount the plugin on a throwaway scope
 * to observe its contributions. A second `dsh-scope` instance would not share
 * the tool registry with the running Harness, so the observation would be wrong;
 * mounting on a real Session and disposing would race with that Session's own
 * turns. Contributions are observed at the real mount instead
 * (`SessionRuntime.mountProviders` diffs tool schemas and prompt sections around
 * the mount) and reported through the Session panel.
 */

/**
 * Services known to exist in an Agent scope, from `spike/plugin-mount-test.mjs`
 * and the hub's own needs. Unknown names are not fatal: they only mean the user
 * has to confirm the verdict.
 */
const AGENT_SCOPE_SERVICES = new Set([
  'agents',
  'approval',
  'connection',
  'fs',
  'hmr',
  'loader',
  'session',
  'skills',
  'subagents',
  'systemPrompt',
  'tools',
  'userApproval',
  'userQuestions',
  'workingDirectory',
]);

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export class CapabilityCatalog {
  constructor(ctx, store) {
    this.ctx = ctx;
    this.store = store;
    this.profileCache = null;
  }

  manager() {
    const manager = this.ctx.get?.('pluginManager');
    if (!manager) throw new Error('pluginManager service is unavailable in this DSH version.');
    return manager;
  }

  available() {
    return Boolean(this.ctx.get?.('pluginManager'));
  }

  /**
   * The profile directory. `ctx.baseUrl` is the config file's directory (the
   * profile), which is also where the loader resolves bare package names; the
   * loader *service* has no `baseUrl` property of its own.
   */
  profileDir() {
    const baseUrl = this.ctx.baseUrl;
    if (typeof baseUrl !== 'string' || baseUrl.length === 0) return undefined;
    try {
      return fileURLToPath(baseUrl);
    } catch {
      return undefined; // not a file: URL, so not a profile on disk
    }
  }

  async profile() {
    if (this.profileCache !== null) return this.profileCache;
    const dir = this.profileDir();
    const result = { dir, dependencies: new Set(), bundles: [] };
    if (dir !== undefined) {
      try {
        const manifest = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
        for (const name of Object.keys(asRecord(manifest.dependencies))) result.dependencies.add(name);
        for (const name of Object.keys(asRecord(manifest.devDependencies))) result.dependencies.add(name);
      } catch {
        // A profile without a readable package.json still has a name-based check.
      }
    }
    this.profileCache = result;
    return result;
  }

  /** Removable bundle names, i.e. installed packages the user could uninstall. */
  async removableBundles(manager) {
    try {
      const bundles = await manager.listBundles();
      return new Set(
        (Array.isArray(bundles) ? bundles : [])
          .filter((bundle) => bundle?.removable === true)
          .map((bundle) => asString(bundle.name)),
      );
    } catch {
      return new Set();
    }
  }

  /**
   * Whether this entry belongs to the user rather than to DSH itself. Three
   * checks in decreasing reliability, as the blueprint asks; the first one that
   * answers wins.
   */
  thirdPartyOf(moduleName, removable) {
    const name = asString(moduleName);
    if (name.length === 0) return { thirdParty: true, reason: 'unknown-module' };
    const profile = this.profileCache;
    if (profile?.dependencies?.has(name)) return { thirdParty: true, reason: 'profile-dependency' };
    if (removable.has(name)) return { thirdParty: true, reason: 'removable-bundle' };
    if (!name.startsWith('@deepseek-ai/')) return { thirdParty: true, reason: 'name-prefix' };
    return { thirdParty: false, reason: 'core-plugin' };
  }

  /**
   * Every candidate row: third-party entries plus whatever is already
   * registered, annotated with addressability and registration state.
   * @param options.agent - a live Agent whose scope answers the `inject` check
   *   exactly. Omitted means the check uses the known-service list.
   */
  async list({ agent } = {}) {
    const manager = this.manager();
    const [rows, removable] = await Promise.all([
      manager.listPlugins(),
      this.removableBundles(manager),
    ]);
    await this.profile();
    const registered = new Map(
      this.store.library.providers.map((provider) => [provider.entryId, provider]),
    );
    const result = [];
    let hidden = 0;
    for (const row of Array.isArray(rows) ? rows : []) {
      const entryId = asString(row?.entryId);
      if (entryId.length === 0) continue;
      const moduleName = asString(row?.moduleName, entryId);
      const known = this.thirdPartyOf(moduleName, removable);
      const provider = registered.get(entryId);
      if (!known.thirdParty && provider === undefined) {
        hidden += 1;
        continue;
      }
      result.push({
        entryId,
        moduleName,
        name: moduleName,
        enabled: row.enabled !== false,
        fiberPhase: row.fiberPhase ?? null,
        patchId: asString(row.patchId) || null,
        readOnlyReason: asString(row.readOnlyReason) || null,
        thirdParty: known.thirdParty,
        thirdPartyReason: known.reason,
        addressable: asString(row.patchId).length > 0 && asString(row.readOnlyReason).length === 0,
        registered: provider !== undefined,
        providerId: provider?.id ?? null,
        mountAt: provider?.mountAt ?? null,
        config: provider?.config ?? {},
        verdict: provider?.verdict ?? null,
      });
    }
    result.sort((left, right) => {
      if (left.registered !== right.registered) return left.registered ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
    return {
      entries: result,
      hidden,
      profileDir: this.profileDir() ?? null,
      agentScopeChecked: agent !== undefined,
    };
  }

  /** One row by entry id, from `list()`. */
  async entry(entryId, options) {
    const listing = await this.list(options);
    const row = listing.entries.find((item) => item.entryId === entryId);
    if (!row) throw new Error(`Unknown plugin entry "${entryId}".`);
    return row;
  }

  /** Static read of the module behind a package name. */
  async inspect(packageName) {
    const name = asString(packageName);
    if (name.length === 0) throw new Error('packageName is required.');
    const module = await this.ctx.loader.import(name, () => []);
    return {
      packageName: name,
      moduleName: asString(module?.name, name),
      hasApply: typeof module?.apply === 'function',
      hasConfig: module?.Config !== undefined,
      inject: Array.isArray(module?.inject)
        ? module.inject.filter((item) => typeof item === 'string')
        : [],
    };
  }

  /**
   * Which declared services are missing from an Agent scope.
   * @returns `{ missing, checked }` — `checked` is false when no live Agent was
   *   available, in which case `missing` comes from the known-service list.
   */
  missingServices(inject, agent) {
    const scope = agent?.ctx;
    const missing = [];
    const unchecked = [];
    for (const name of inject) {
      if (scope?.get !== undefined) {
        let present = false;
        try {
          present = scope.get(name) !== undefined;
        } catch {
          present = false;
        }
        if (!present) missing.push(name);
        continue;
      }
      if (!AGENT_SCOPE_SERVICES.has(name)) unchecked.push(name);
    }
    return { missing, unchecked, checked: scope?.get !== undefined };
  }

  /**
   * The three-level mountability verdict, with reasons written for the user.
   * @returns `{ level, reasons, checkedAt }`
   */
  async judge(row, { agent } = {}) {
    const reasons = [];
    if (row.readOnlyReason) {
      return {
        level: 'profile-only',
        reasons: [
          row.readOnlyReason === 'management-required'
            ? 'The plugin manager itself cannot be managed from inside a Session.'
            : 'This entry is mounted dynamically and has no profile patch, so it cannot be taken over.',
        ],
        checkedAt: nowIso(),
      };
    }
    if (!row.thirdParty) {
      return {
        level: 'profile-only',
        reasons: ['This is a DSH native plugin, not a third-party capability.'],
        checkedAt: nowIso(),
      };
    }
    if (!row.addressable) {
      return {
        level: 'profile-only',
        reasons: ['No patchId: the plugin manager cannot disable this entry.'],
        checkedAt: nowIso(),
      };
    }

    let inspected;
    try {
      inspected = await this.inspect(row.moduleName);
    } catch (error) {
      return {
        level: 'profile-only',
        reasons: [`The module could not be loaded: ${String(error?.message ?? error)}`],
        checkedAt: nowIso(),
      };
    }
    if (!inspected.hasApply) {
      return {
        level: 'profile-only',
        reasons: ['The module exports no apply(), so it is a client-only bundle and cannot be mounted on an Agent.'],
        checkedAt: nowIso(),
      };
    }

    const { missing, unchecked, checked } = this.missingServices(inspected.inject, agent);
    if (missing.length > 0) {
      return {
        level: 'profile-only',
        reasons: [
          `Agent scope cannot provide: ${missing.join(', ')}.`,
          'Mounting would leave the plugin waiting forever.',
        ],
        checkedAt: nowIso(),
      };
    }
    if (checked) {
      reasons.push(`Agent scope provides every declared service: ${inspected.inject.join(', ') || 'none'}.`);
    } else if (unchecked.length > 0) {
      reasons.push(`Unverified services: ${unchecked.join(', ')}.`);
      return { level: 'review', reasons, checkedAt: nowIso(), inspected };
    } else {
      reasons.push('Inject list is empty or known; no live Session was available to confirm it.');
    }
    reasons.push(`Contributes through apply(); configuration schema ${inspected.hasConfig ? 'present' : 'absent'}.`);
    return { level: 'mountable', reasons, checkedAt: nowIso(), inspected };
  }

  /**
   * Register a plugin entry as a capability provider and stop it running
   * profile-wide.
   *
   * The profile write goes through `pluginManager.setPluginEnabled`, never by
   * hand. If the provider record cannot be written, the entry is switched back
   * on so the user is not left with a plugin that is neither global nor managed.
   */
  async takeover(row, { mountAt = 'session-start', config = {} } = {}) {
    const manager = this.manager();
    if (row.readOnlyReason) throw new Error(`This entry cannot be managed (${row.readOnlyReason}).`);
    if (row.addressable === false || !row.patchId) {
      throw new Error(
        'This entry has no profile patch, so the plugin manager cannot disable it. It can only run profile-wide.',
      );
    }
    let application = null;
    let alreadyDisabled = false;
    if (row.enabled !== false) {
      const change = await manager.setPluginEnabled(row.entryId, false);
      application = change?.application ?? 'applied';
      alreadyDisabled = false;
      if (application === 'failed') {
        throw new Error(
          `Disabling the profile entry failed: ${String(change?.error?.message ?? change?.error ?? 'unknown error')}`,
        );
      }
    } else {
      alreadyDisabled = true;
    }

    try {
      const { provider, created } = await this.store.upsertProvider({
        entryId: row.entryId,
        packageName: row.moduleName,
        mountAt,
        config,
      });
      return { provider, created, application, alreadyDisabled };
    } catch (error) {
      if (!alreadyDisabled) {
        try {
          await manager.setPluginEnabled(row.entryId, true);
        } catch (rollbackError) {
          this.ctx.logger?.warn?.(
            `capability-hub: rollback of ${row.entryId} failed: ${String(rollbackError)}`,
          );
        }
      }
      throw error;
    }
  }

  /** Give a provider back to the profile and drop the record. */
  async release(provider) {
    const manager = this.manager();
    let change;
    try {
      change = await manager.setPluginEnabled(provider.entryId, true);
    } catch (error) {
      throw new Error(
        `Could not re-enable ${provider.entryId}: ${String(error?.message ?? error)}. Nothing was released.`,
      );
    }
    const application = change?.application ?? 'applied';
    if (application === 'failed') {
      throw new Error(
        `Re-enabling ${provider.entryId} failed: ${String(change?.error?.message ?? change?.error ?? 'unknown error')}.`,
      );
    }
    const removed = await this.store.deleteProvider(provider.id);
    return { application, presets: removed.presets, entryId: provider.entryId };
  }
}
