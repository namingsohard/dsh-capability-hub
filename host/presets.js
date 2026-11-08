/**
 * Capability presets.
 *
 * A preset is the complete desired capability set for one Session: which MCP
 * servers are mounted, which Skills are exposed and, reserved for v0.3, which
 * capability providers are mounted. A preset never holds live Session state —
 * a Session keeps its own copy so manual edits stay local to that Session.
 *
 * Skills are recorded in one of two modes:
 *
 *   sparse    A Skill the preset does not mention follows what is installed
 *             (`auto`). The default preset uses this, so the baseline keeps up
 *             with new installs and only exclusions are stored.
 *   explicit  A Skill the preset does not mention is not part of the preset, so
 *             it resolves to `off` and the UI marks it "未纳入". Presets captured
 *             from a Session use this so they stay reproducible.
 */

import { nowIso } from './util.js';

export const DEFAULT_PRESET_ID = 'default';

/** The three Session-visible Skill states, in increasing visibility. */
export const SKILL_STATES = new Set(['auto', 'manual', 'off']);

const SKILLS_MODES = new Set(['sparse', 'explicit']);

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** Keep only recognised Skill states; drops anything the policy could not read. */
export function cleanSkills(value) {
  const result = {};
  for (const [name, state] of Object.entries(asRecord(value))) {
    if (SKILL_STATES.has(state)) result[name] = state;
  }
  return result;
}

/**
 * The v0.3 capability-provider section of a preset.
 *
 * `desired` is the preset's wish list of provider ids; an entry with
 * `enabled: false` is kept as a record of a deliberate exclusion but never
 * mounted. Ids no longer registered are kept, exactly like MCP ids, so the
 * "missing" list stays truthful instead of silently shrinking the preset.
 */
export function normalizePlugins(value) {
  // v0.2's client wrote `plugins` as a bare array; accept it so an old export
  // still imports into the v0.3 shape.
  const record = Array.isArray(value) ? { desired: value } : asRecord(value);
  const desired = Array.isArray(record.desired) ? record.desired : [];
  const seen = new Set();
  const result = [];
  for (const item of desired) {
    if (item === null || typeof item !== 'object') continue;
    const providerId = asString(item.providerId);
    if (providerId.length === 0 || seen.has(providerId)) continue;
    seen.add(providerId);
    result.push({ providerId, enabled: item.enabled !== false });
  }
  return { desired: result };
}

/**
 * Coerce one stored preset into the current shape.
 * @returns The preset, or `undefined` when it has no usable id.
 */
export function normalizePreset(raw) {
  const value = asRecord(raw);
  const id = asString(value.id);
  if (id.length === 0) return undefined;
  const isDefault = id === DEFAULT_PRESET_ID;
  // The default preset is always sparse: it is the baseline, not a snapshot.
  const skillsMode = isDefault
    ? 'sparse'
    : SKILLS_MODES.has(value.skillsMode)
      ? value.skillsMode
      : 'sparse';
  return {
    id,
    name: asString(value.name, isDefault ? 'Default' : 'Preset'),
    isDefault,
    base: asString(value.base) || null,
    skillsMode,
    capturedAt: asString(value.capturedAt) || null,
    mcp: [...new Set(asStringArray(value.mcp))],
    skills: cleanSkills(value.skills),
    plugins: normalizePlugins(value.plugins),
    // v0.3 reserved: comma-separated capability bundle ids this preset composes.
    bundles: [...new Set(asStringArray(value.bundles))],
    createdAt: asString(value.createdAt, nowIso()),
    updatedAt: asString(value.updatedAt, nowIso()),
  };
}

export function clonePreset(preset) {
  return {
    ...preset,
    mcp: [...preset.mcp],
    skills: { ...preset.skills },
    plugins: { desired: preset.plugins.desired.map((item) => ({ ...item })) },
    bundles: [...preset.bundles],
  };
}

/** The state a Skill falls back to when the preset does not mention it. */
export function skillDefaultFor(preset) {
  return preset?.skillsMode === 'explicit' ? 'off' : 'auto';
}

/** The effective state of one Skill in a preset. */
export function effectiveSkillState(preset, skills, name) {
  const explicit = skills?.[name];
  if (SKILL_STATES.has(explicit)) return explicit;
  return skillDefaultFor(preset);
}

/** Whether the preset says anything about this Skill at all. */
export function isSkillIncluded(preset, skills, name) {
  if (SKILL_STATES.has(skills?.[name])) return true;
  return preset?.skillsMode === 'sparse';
}

/**
 * Build the stored Skills map for a preset.
 *
 * In `explicit` mode every known Skill is written out, so a Skill installed
 * later is visibly absent rather than silently enabled. In `sparse` mode only
 * non-`auto` overrides are kept.
 */
export function captureSkills(skills, knownSkillNames, mode) {
  const source = cleanSkills(skills);
  const result = {};
  if (mode === 'explicit') {
    for (const name of knownSkillNames) result[name] = source[name] ?? 'auto';
    // Keep overrides for Skills that are not installed right now: they are the
    // reason the preset can re-enable them after a reinstall.
    for (const [name, state] of Object.entries(source)) {
      if (result[name] === undefined) result[name] = state;
    }
    return result;
  }
  for (const [name, state] of Object.entries(source)) {
    if (state !== 'auto') result[name] = state;
  }
  return result;
}

/**
 * The Session state a preset produces when applied to a workspace.
 * MCP ids the library no longer knows are dropped: they cannot be mounted, and
 * the preset keeps them so the "missing" list stays truthful. Provider ids
 * follow the same rule when the caller can supply the registered set.
 */
export function buildSessionState(preset, knownMcpIds, knownProviderIds) {
  const desired = preset.plugins.desired.filter(
    (item) => knownProviderIds === undefined || knownProviderIds.has(item.providerId),
  );
  return {
    mcp: preset.mcp.filter((id) => knownMcpIds.has(id)),
    skills: { ...preset.skills },
    plugins: { desired: desired.map((item) => ({ ...item })) },
  };
}

/**
 * Resolve a preset against the library and the installed Skills.
 * @param preset - the stored preset.
 * @param mcpById - Map of MCP id to definition.
 * @param installedSkillNames - every Skill name the Skills service can see.
 * @param knownProviderIds - optional Set of registered provider ids; when it is
 *   omitted the missing-provider list is empty rather than wrong.
 */
export function resolvePreset(preset, mcpById, installedSkillNames, knownProviderIds) {
  const mcp = preset.mcp.map((id) => {
    const definition = mcpById.get(id);
    return {
      id,
      name: definition?.name ?? id,
      present: definition !== undefined,
      enabled: definition?.enabled !== false,
    };
  });

  const installed = new Set(installedSkillNames);
  const names = new Set(installed);
  for (const name of Object.keys(preset.skills)) names.add(name);
  const skills = [...names]
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({
      name,
      state: effectiveSkillState(preset, preset.skills, name),
      explicit: SKILL_STATES.has(preset.skills[name]),
      included: isSkillIncluded(preset, preset.skills, name),
      installed: installed.has(name),
    }));

  const missingMcp = mcp.filter((item) => !item.present).map((item) => item.id);
  const missingSkills = skills.filter((item) => !item.installed).map((item) => item.name);
  const known = knownProviderIds instanceof Set ? knownProviderIds : undefined;
  const plugins = preset.plugins.desired.map((item) => ({
    providerId: item.providerId,
    enabled: item.enabled !== false,
    present: known === undefined ? undefined : known.has(item.providerId),
  }));
  const missingProviders =
    known === undefined
      ? []
      : plugins.filter((item) => item.present === false).map((item) => item.providerId);

  return {
    id: preset.id,
    name: preset.name,
    isDefault: preset.isDefault,
    base: preset.base,
    skillsMode: preset.skillsMode,
    capturedAt: preset.capturedAt,
    mcp,
    skills,
    missingMcp,
    missingSkills,
    missingProviders,
    plugins,
    bundles: [...preset.bundles],
    counts: {
      mcp: mcp.filter((item) => item.present).length,
      skills: skills.filter((item) => item.state !== 'off').length,
      plugins: plugins.filter((item) => item.enabled).length,
      bundles: preset.bundles.length,
    },
  };
}

/**
 * What the default preset has that this one does not.
 *
 * This is the "默认方案新增" signal: synchronising adds those items to the
 * Session. Items the user deliberately removed from a preset show up here too;
 * the UI labels them neutrally so syncing stays a choice.
 */
export function presetDrift(preset, resolvedPreset, resolvedDefault) {
  if (preset.isDefault || resolvedDefault === undefined) return { mcp: [], skills: [], plugins: [] };
  const presetMcp = new Set(resolvedPreset.mcp.filter((item) => item.present).map((item) => item.id));
  const presetSkills = new Set(
    resolvedPreset.skills.filter((item) => item.state !== 'off').map((item) => item.name),
  );
  const presetPlugins = new Set(
    resolvedPreset.plugins.filter((item) => item.enabled).map((item) => item.providerId),
  );
  return {
    mcp: resolvedDefault.mcp.filter((item) => item.present && !presetMcp.has(item.id)).map((item) => item.id),
    skills: resolvedDefault.skills
      .filter((item) => item.state !== 'off' && !presetSkills.has(item.name))
      .map((item) => item.name),
    plugins: resolvedDefault.plugins
      .filter((item) => item.enabled && !presetPlugins.has(item.providerId))
      .map((item) => item.providerId),
  };
}

/** The compact shape the preset pickers list. */
export function presetSummary(resolved) {
  return {
    id: resolved.id,
    name: resolved.name,
    isDefault: resolved.isDefault,
    skillsMode: resolved.skillsMode,
    capturedAt: resolved.capturedAt,
    counts: resolved.counts,
    missingCount: {
      mcp: resolved.missingMcp.length,
      skills: resolved.missingSkills.length,
      plugins: resolved.missingProviders.length,
    },
  };
}

/**
 * Stable comparison of two Skill maps, ignoring key order.
 * @param fallback - The state an omitted Skill resolves to in this comparison.
 */
export function sameSkills(left, right, fallback = 'auto') {
  const keys = new Set([...Object.keys(left ?? {}), ...Object.keys(right ?? {})]);
  for (const key of keys) {
    if ((left?.[key] ?? fallback) !== (right?.[key] ?? fallback)) return false;
  }
  return true;
}

/** Stable comparison of two MCP id lists, ignoring order and duplicates. */
export function sameMcp(left, right) {
  const a = new Set(asStringArray(left));
  const b = new Set(asStringArray(right));
  if (a.size !== b.size) return false;
  for (const id of a) if (!b.has(id)) return false;
  return true;
}
