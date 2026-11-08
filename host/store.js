import {
  ensureDirectories,
  libraryBackupPath,
  libraryPath,
  makeId,
  normalizePathKey,
  nowIso,
  readJson,
  sanitizeServerName,
  sessionPath,
  writeJson,
} from './util.js';
import {
  DEFAULT_PRESET_ID,
  buildSessionState,
  captureSkills,
  cleanSkills,
  clonePreset,
  normalizePlugins,
  normalizePreset,
  skillDefaultFor,
} from './presets.js';
import { cloneProvider, normalizeProvider } from './providers.js';
import { cloneCatalog, normalizeCatalog, normalizeMembers, sortCatalogs } from './catalogs.js';

const LIBRARY_VERSION = 2;

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export class CapabilityStore {
  constructor(ctx) {
    this.ctx = ctx;
    this.library = null;
    /** Set while initialising when a previous library schema was migrated. */
    this.migration = null;
  }

  async init() {
    await ensureDirectories();
    const raw = await readJson(libraryPath(), null);
    this.library = this.normalizeLibrary(raw);
    const previousVersion = Number(raw?.version ?? 1);
    if (raw !== null && previousVersion !== LIBRARY_VERSION) {
      this.migration = await this.backupLibrary(raw, previousVersion);
    }
    this.ensureDefaultPreset();
    await this.save();
  }

  /**
   * Keep the pre-migration file next to the new one. A failed backup must not
   * block startup: the migration is additive, so the risk is losing the old
   * shape, not the capability data itself.
   */
  async backupLibrary(raw, version) {
    try {
      const target = libraryBackupPath(version);
      await writeJson(target, raw);
      return { from: version, to: LIBRARY_VERSION, backup: target };
    } catch (error) {
      this.ctx.logger?.warn?.(`capability-hub: library backup failed: ${String(error)}`);
      return { from: version, to: LIBRARY_VERSION, backup: null };
    }
  }

  normalizeLibrary(raw) {
    const value = asRecord(raw);
    const mcp = Array.isArray(value.mcp) ? value.mcp.map((item) => this.normalizeMcp(item)) : [];

    // v1 called these "loadouts". They migrate as sparse presets, which is
    // exactly how v1 behaved: an unlisted Skill meant `auto`, not `off`.
    const sourcePresets = Array.isArray(value.presets)
      ? value.presets
      : Array.isArray(value.loadouts)
        ? value.loadouts.map((item) => ({ ...asRecord(item), skillsMode: 'sparse' }))
        : [];
    const seen = new Set();
    const presets = [];
    for (const item of sourcePresets) {
      const preset = normalizePreset(item);
      if (preset === undefined || seen.has(preset.id)) continue;
      seen.add(preset.id);
      presets.push(preset);
    }

    const providers = Array.isArray(value.providers)
      ? value.providers.map((item) => normalizeProvider(item)).filter(Boolean)
      : [];

    // Capability directories: a user-owned grouping of installed capabilities.
    // Additive, so a v0.2/v0.3 library loads with none.
    const catalogSeen = new Set();
    const catalogs = [];
    for (const item of Array.isArray(value.catalogs) ? value.catalogs : []) {
      const catalog = normalizeCatalog(item);
      if (catalog === undefined || catalogSeen.has(catalog.id)) continue;
      catalogSeen.add(catalog.id);
      catalogs.push(catalog);
    }

    return {
      version: LIBRARY_VERSION,
      mcp,
      presets,
      workspaceDefaults: { ...asRecord(value.workspaceDefaults) },
      providers,
      catalogs,
      // v0.3 reserved: installed capability bundles (directories of related
      // capabilities). Presets reference them by id in `preset.bundles`.
      bundles: asStringArray(value.bundles),
      createdAt: asString(value.createdAt, nowIso()),
      updatedAt: nowIso(),
    };
  }

  normalizeMcp(raw) {
    const value = asRecord(raw);
    const transport = value.transport === 'streamable-http' ? 'streamable-http' : 'stdio';
    return {
      id: asString(value.id, makeId('mcp')),
      name: asString(value.name, 'MCP server'),
      serverName: sanitizeServerName(value.serverName || value.name),
      transport,
      command: asString(value.command),
      args: asStringArray(value.args),
      cwd: asString(value.cwd),
      url: asString(value.url),
      env: asRecord(value.env),
      headers: asRecord(value.headers),
      enabled: value.enabled !== false,
      createdAt: asString(value.createdAt, nowIso()),
      updatedAt: asString(value.updatedAt, nowIso()),
    };
  }

  async save() {
    this.library.updatedAt = nowIso();
    await writeJson(libraryPath(), this.library);
  }

  // ── MCP library ───────────────────────────────────────────────────────────

  getMcp(id) {
    return this.library.mcp.find((item) => item.id === id);
  }

  listMcp() {
    return this.library.mcp.map((item) => this.publicMcp(item));
  }

  publicMcp(item) {
    return {
      id: item.id,
      name: item.name,
      serverName: item.serverName,
      transport: item.transport,
      command: item.command,
      args: item.args,
      cwd: item.cwd,
      url: item.url,
      envKeys: Object.keys(item.env),
      headerKeys: Object.keys(item.headers),
      enabled: item.enabled,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  uniqueServerName(base, exceptId) {
    const used = new Set(
      this.library.mcp
        .filter((item) => item.id !== exceptId)
        .map((item) => item.serverName.toLowerCase()),
    );
    const stem = sanitizeServerName(base);
    let candidate = stem;
    let index = 2;
    while (used.has(candidate.toLowerCase())) {
      const suffix = `_${index}`;
      candidate = `${stem.slice(0, 32 - suffix.length)}${suffix}`;
      index += 1;
    }
    return candidate;
  }

  async upsertMcp(input) {
    const value = asRecord(input);
    const id = asString(value.id);
    const existing = id ? this.getMcp(id) : undefined;
    const allBefore = this.library.mcp.length;
    const normalized = this.normalizeMcp({
      ...existing,
      ...value,
      id: existing?.id ?? makeId('mcp'),
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
      command: value.command === undefined ? existing?.command : value.command,
      args: value.args === undefined ? existing?.args : value.args,
      cwd: value.cwd === undefined ? existing?.cwd : value.cwd,
      url: value.url === undefined ? existing?.url : value.url,
      transport: value.transport === undefined ? existing?.transport : value.transport,
      enabled: value.enabled === undefined ? existing?.enabled : value.enabled,
      env: value.env === undefined ? existing?.env : value.env,
      headers: value.headers === undefined ? existing?.headers : value.headers,
    });
    normalized.serverName = this.uniqueServerName(
      value.serverName !== undefined
        ? value.serverName
        : existing?.serverName ?? value.name ?? normalized.name,
      normalized.id,
    );

    if (existing) {
      this.library.mcp = this.library.mcp.map((item) =>
        item.id === existing.id ? normalized : item,
      );
    } else {
      this.library.mcp.push(normalized);
    }

    // A baseline that already contained every server keeps doing so; one that
    // was curated stays curated.
    const defaultPreset = this.getPreset(DEFAULT_PRESET_ID);
    if (!existing && defaultPreset && defaultPreset.mcp.length >= allBefore) {
      defaultPreset.mcp = [...defaultPreset.mcp, normalized.id];
      defaultPreset.updatedAt = nowIso();
    }

    await this.save();
    return this.publicMcp(normalized);
  }

  async deleteMcp(id) {
    const existing = this.getMcp(id);
    if (!existing) return false;
    this.library.mcp = this.library.mcp.filter((item) => item.id !== id);
    // Presets keep the id on purpose: the UI reports it as a deleted server
    // instead of silently shrinking the preset.
    await this.save();
    return true;
  }

  // ── Capability providers ──────────────────────────────────────────────────

  listProviders() {
    return this.library.providers.map(cloneProvider);
  }

  getProvider(id) {
    return this.library.providers.find((item) => item.id === id);
  }

  /** The set of registered provider ids, for resolving presets and Sessions. */
  knownProviderIds() {
    return new Set(this.library.providers.map((item) => item.id));
  }

  getProviderByEntry(entryId) {
    return this.library.providers.find((item) => item.entryId === entryId);
  }

  /**
   * Register one plugin entry as a provider, or update the record that already
   * uses that entry. One entry can only be registered once: registering twice
   * would mount the same plugin twice on one Agent, which throws.
   * @param input - `{ entryId, packageName, mountAt, config, enabled, verdict }`.
   * @returns The stored record and whether it was created for this entry.
   */
  async upsertProvider(input) {
    const value = asRecord(input);
    const entryId = asString(value.entryId);
    if (entryId.length === 0) throw new Error('entryId is required.');
    const existing = this.getProviderByEntry(entryId);
    const allBefore = this.library.providers.length;
    const merged = normalizeProvider({
      ...existing,
      ...value,
      id: existing?.id ?? makeId('provider'),
      entryId,
      packageName: asString(value.packageName, existing?.packageName ?? entryId),
      mountAt: value.mountAt === undefined ? existing?.mountAt : value.mountAt,
      config: value.config === undefined ? existing?.config : value.config,
      enabled: value.enabled === undefined ? existing?.enabled : value.enabled,
      verdict: value.verdict === undefined ? existing?.verdict : value.verdict,
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    });
    if (existing === undefined) this.library.providers.push(merged);
    else {
      this.library.providers = this.library.providers.map((item) =>
        item.id === existing.id ? merged : item,
      );
    }

    // Installing a plugin is a statement that the user wants it: a newly
    // registered provider joins the baseline preset, so Sessions that follow the
    // default get it without anyone having to tick it. A baseline the user has
    // already curated (it does not contain every registered provider) is left
    // alone — the same rule `upsertMcp` uses.
    if (existing === undefined) {
      const defaultPreset = this.getPreset(DEFAULT_PRESET_ID);
      if (defaultPreset && defaultPreset.plugins.desired.length >= allBefore) {
        defaultPreset.plugins = normalizePlugins({
          desired: [...defaultPreset.plugins.desired, { providerId: merged.id, enabled: true }],
        });
        defaultPreset.updatedAt = nowIso();
      }
    }

    await this.save();
    return { provider: cloneProvider(merged), created: existing === undefined };
  }

  /**
   * Forget a provider and every preset reference to it.
   * @returns `{ removed, presets }` where `presets` names the presets that
   *   changed, so the UI can say which ones were edited.
   */
  async deleteProvider(id) {
    const existing = this.getProvider(id);
    if (!existing) return { removed: false, presets: [] };
    this.library.providers = this.library.providers.filter((item) => item.id !== id);
    const presets = [];
    for (const preset of this.library.presets) {
      const before = preset.plugins.desired.length;
      preset.plugins = normalizePlugins({
        desired: preset.plugins.desired.filter((item) => item.providerId !== id),
      });
      if (preset.plugins.desired.length !== before) {
        presets.push(preset.isDefault ? DEFAULT_PRESET_ID : preset.name);
        preset.updatedAt = nowIso();
      }
    }
    await this.save();
    return { removed: true, presets };
  }

  async setProviderEnabled(id, enabled) {
    const existing = this.getProvider(id);
    if (!existing) throw new Error('Capability provider not found.');
    existing.enabled = enabled === true;
    existing.updatedAt = nowIso();
    await this.save();
    return cloneProvider(existing);
  }

  async setProviderVerdict(id, verdict) {
    const existing = this.getProvider(id);
    if (!existing) throw new Error('Capability provider not found.');
    existing.verdict = verdict;
    existing.updatedAt = nowIso();
    await this.save();
    return cloneProvider(existing);
  }

  /**
   * Record what a mount failure proved about the plugin (for example that it
   * owns a process-wide HTTP route). Persisted so the explanation survives the
   * Session that discovered it, and so later mounts can be rejected with a real
   * reason instead of a raw stack message.
   */
  async setProviderIssue(id, issue) {
    const existing = this.getProvider(id);
    if (!existing) return undefined;
    existing.issue = issue;
    existing.updatedAt = nowIso();
    await this.save();
    return cloneProvider(existing);
  }

  async clearProviderIssue(id) {
    const existing = this.getProvider(id);
    if (!existing || existing.issue === undefined) return;
    delete existing.issue;
    existing.updatedAt = nowIso();
    await this.save();
  }

  /** Which presets want this provider mounted. */
  presetsUsingProvider(id) {
    return this.library.presets
      .filter((preset) => preset.plugins.desired.some((item) => item.providerId === id))
      .map((preset) => ({ id: preset.id, name: preset.name, isDefault: preset.isDefault }));
  }

  // ── Capability directories ────────────────────────────────────────────────

  listCatalogs() {
    return sortCatalogs(this.library.catalogs).map(cloneCatalog);
  }

  getCatalog(id) {
    return this.library.catalogs.find((item) => item.id === id);
  }

  uniqueCatalogName(base, exceptId) {
    const used = new Set(
      this.library.catalogs.filter((item) => item.id !== exceptId).map((item) => item.name.toLowerCase()),
    );
    const stem = asString(base, 'Directory').trim() || 'Directory';
    if (!used.has(stem.toLowerCase())) return stem;
    let index = 2;
    while (used.has(`${stem} ${index}`.toLowerCase())) index += 1;
    return `${stem} ${index}`;
  }

  nextCatalogOrder() {
    return this.library.catalogs.reduce((max, item) => Math.max(max, item.order + 1), 0);
  }

  /**
   * Create or update a directory. `members` replaces the whole member list, so
   * the client sends what it wants to end up with.
   */
  async upsertCatalog(input) {
    const value = asRecord(input);
    const id = asString(value.id);
    const existing = id.length > 0 ? this.getCatalog(id) : undefined;
    const requestedName = asString(value.name, existing?.name ?? '');
    const catalog = normalizeCatalog({
      id: existing?.id ?? makeId('catalog'),
      name:
        existing !== undefined && requestedName === existing.name
          ? existing.name
          : this.uniqueCatalogName(requestedName, existing?.id),
      order: value.order === undefined ? existing?.order ?? this.nextCatalogOrder() : value.order,
      members: value.members === undefined ? existing?.members : normalizeMembers(value.members),
      createdAt: existing?.createdAt ?? nowIso(),
      updatedAt: nowIso(),
    });
    if (existing === undefined) this.library.catalogs.push(catalog);
    else {
      this.library.catalogs = this.library.catalogs.map((item) =>
        item.id === existing.id ? catalog : item,
      );
    }
    await this.save();
    return cloneCatalog(catalog);
  }

  async setCatalogMembers(id, members) {
    const existing = this.getCatalog(id);
    if (!existing) throw new Error('Capability directory not found.');
    existing.members = normalizeMembers(members);
    existing.updatedAt = nowIso();
    await this.save();
    return cloneCatalog(existing);
  }

  /** Remove a directory. The capabilities themselves are untouched. */
  async deleteCatalog(id) {
    if (!this.getCatalog(id)) return false;
    this.library.catalogs = this.library.catalogs.filter((item) => item.id !== id);
    await this.save();
    return true;
  }

  // ── Presets ───────────────────────────────────────────────────────────────

  getPreset(id) {
    return this.library.presets.find((item) => item.id === id);
  }

  listPresets() {
    return this.library.presets.map(clonePreset);
  }

  defaultPreset() {
    return this.ensureDefaultPreset();
  }

  ensureDefaultPreset() {
    const existing = this.getPreset(DEFAULT_PRESET_ID);
    if (existing) return existing;
    const preset = normalizePreset({
      id: DEFAULT_PRESET_ID,
      name: 'Default',
      skillsMode: 'sparse',
      mcp: this.library.mcp.map((item) => item.id),
      skills: {},
    });
    this.library.presets.unshift(preset);
    return preset;
  }

  uniquePresetName(base, exceptId) {
    const used = new Set(
      this.library.presets.filter((item) => item.id !== exceptId).map((item) => item.name.toLowerCase()),
    );
    const stem = asString(base, 'Preset').trim() || 'Preset';
    if (!used.has(stem.toLowerCase())) return stem;
    let index = 2;
    while (used.has(`${stem} ${index}`.toLowerCase())) index += 1;
    return `${stem} ${index}`;
  }

  /**
   * Create a preset from a Session's current selection.
   * @param input - `{ name, mcp, skills, base, plugins, bundles }`.
   * @param options.knownSkills - every installed Skill name, so an explicit
   *   capture records the whole visible set instead of only the exceptions.
   */
  async createPreset(input, { knownSkills = [], skillsMode = 'explicit' } = {}) {
    const value = asRecord(input);
    const mode = skillsMode === 'sparse' ? 'sparse' : 'explicit';
    const preset = normalizePreset({
      id: makeId('preset'),
      name: this.uniquePresetName(asString(value.name, 'Preset')),
      base: asString(value.base) || null,
      skillsMode: mode,
      capturedAt: asString(value.capturedAt) || nowIso(),
      mcp: asStringArray(value.mcp),
      skills: captureSkills(value.skills, knownSkills, mode),
      plugins: value.plugins,
      bundles: value.bundles,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    this.library.presets.push(preset);
    await this.save();
    return clonePreset(preset);
  }

  /**
   * Update a stored preset. Omitted fields keep their current value, so the
   * store never rewrites a Skill map the caller did not intend to touch.
   */
  async updatePreset(id, input, { knownSkills = [] } = {}) {
    const existing = this.getPreset(id);
    if (!existing) throw new Error('Preset not found.');
    const value = asRecord(input);
    const skillsMode = existing.isDefault
      ? 'sparse'
      : value.skillsMode === undefined
        ? existing.skillsMode
        : value.skillsMode === 'explicit'
          ? 'explicit'
          : 'sparse';
    const requestedName = value.name === undefined ? existing.name : asString(value.name, existing.name);
    const preset = normalizePreset({
      ...existing,
      // The default preset's name is supplied by the UI's locale, not stored.
      name:
        existing.isDefault || requestedName === existing.name
          ? existing.name
          : this.uniquePresetName(requestedName, existing.id),
      mcp: value.mcp === undefined ? existing.mcp : asStringArray(value.mcp),
      skills:
        value.skills === undefined
          ? existing.skills
          : captureSkills(value.skills, knownSkills, skillsMode),
      skillsMode,
      capturedAt: value.capturedAt === undefined ? existing.capturedAt : value.capturedAt,
      plugins: value.plugins === undefined ? existing.plugins : value.plugins,
      bundles: value.bundles === undefined ? existing.bundles : value.bundles,
      updatedAt: nowIso(),
    });
    this.library.presets = this.library.presets.map((item) => (item.id === id ? preset : item));
    await this.save();
    return clonePreset(preset);
  }

  async deletePreset(id) {
    if (id === DEFAULT_PRESET_ID) throw new Error('The default preset cannot be deleted.');
    if (!this.getPreset(id)) return false;
    this.library.presets = this.library.presets.filter((item) => item.id !== id);
    for (const [key, value] of Object.entries(this.library.workspaceDefaults)) {
      if (value === id) this.library.workspaceDefaults[key] = DEFAULT_PRESET_ID;
    }
    await this.save();
    return true;
  }

  // ── Workspace defaults ────────────────────────────────────────────────────

  workspaceDefaultFor(cwd) {
    const key = normalizePathKey(cwd);
    const preferred = this.library.workspaceDefaults[key];
    return this.getPreset(preferred) ? preferred : DEFAULT_PRESET_ID;
  }

  async setWorkspaceDefault(cwd, presetId) {
    const key = normalizePathKey(cwd);
    if (!key) throw new Error('A workspace directory is required.');
    if (!this.getPreset(presetId)) throw new Error('Preset not found.');
    this.library.workspaceDefaults[key] = presetId;
    await this.save();
  }

  /** Clear a workspace default so the workspace follows the global baseline. */
  async clearWorkspaceDefault(cwd) {
    const key = normalizePathKey(cwd);
    if (!key || this.library.workspaceDefaults[key] === undefined) return false;
    delete this.library.workspaceDefaults[key];
    await this.save();
    return true;
  }

  /**
   * The preset a Session uses. `null` means "follow the workspace default",
   * which is also what an unknown or deleted id falls back to.
   */
  resolvePresetFor(cwd, presetId) {
    if (typeof presetId === 'string' && presetId.length > 0) {
      const explicit = this.getPreset(presetId);
      if (explicit) return explicit;
    }
    return this.getPreset(this.workspaceDefaultFor(cwd)) ?? this.ensureDefaultPreset();
  }

  /** The Skill state a Session sees when the preset does not mention it. */
  skillDefaultForSession(cwd, presetId) {
    return skillDefaultFor(this.resolvePresetFor(cwd, presetId));
  }

  // ── Sessions ──────────────────────────────────────────────────────────────

  normalizeSession(value, cwd) {
    const state = asRecord(value);
    const knownMcp = new Set(this.library.mcp.map((item) => item.id));
    let presetId = null;
    if (state.presetId === null || state.presetId === '') {
      presetId = null;
    } else if (typeof state.presetId === 'string') {
      presetId = state.presetId;
    } else if (typeof state.loadoutId === 'string' && state.loadoutId.length > 0) {
      // v1 Sessions always stored a concrete loadout id.
      presetId = state.loadoutId;
    }
    return {
      presetId,
      mcp: asStringArray(state.mcp).filter((id) => knownMcp.has(id)),
      skills: cleanSkills(state.skills),
      // Provider choices are kept even when the provider was unregistered: the
      // Session panel reports them as missing instead of silently dropping them.
      plugins: normalizePlugins(state.plugins),
      updatedAt: asString(state.updatedAt, nowIso()),
    };
  }

  async getSession(sessionId, cwd) {
    const stored = await readJson(sessionPath(sessionId), null);
    if (stored) return this.normalizeSession(stored, cwd);
    const preset = this.resolvePresetFor(cwd, null);
    const knownMcp = new Set(this.library.mcp.map((item) => item.id));
    const state = {
      presetId: null,
      ...buildSessionState(preset, knownMcp, this.knownProviderIds()),
      updatedAt: nowIso(),
    };
    await this.saveSession(sessionId, state);
    return state;
  }

  async saveSession(sessionId, value) {
    const state = {
      ...value,
      updatedAt: nowIso(),
    };
    await writeJson(sessionPath(sessionId), state);
    return state;
  }

  async copySession(parentId, childId, cwd) {
    const parent = await this.getSession(parentId, cwd);
    const state = {
      presetId: parent.presetId,
      mcp: [...parent.mcp],
      skills: { ...parent.skills },
      plugins: { desired: parent.plugins.desired.map((item) => ({ ...item })) },
      updatedAt: nowIso(),
    };
    await this.saveSession(childId, state);
    return state;
  }
}

export { LIBRARY_VERSION };
