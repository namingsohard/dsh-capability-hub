import os from 'node:os';
import { deleteSkill, importSkills, listInstalledSkills, scanImportSources } from './skills.js';
import { presetDrift, presetSummary, resolvePreset } from './presets.js';
import { resolveCatalogs, unfiledCapabilities } from './catalogs.js';
import { HOST_API } from './util.js';

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function requireString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

export function registerCapabilityApi(ctx, { store, mcp, sessions }) {
  const fetchService = ctx.connection?.fetch;
  if (!fetchService?.register) {
    ctx.logger?.warn?.('capability-hub: connection.fetch is unavailable; the management API is disabled.');
    return;
  }

  const workspaceCwd = () => ctx.workingDirectory?.defaultDirectory ?? os.homedir();

  /** The catalog is owned by the session runtime, which already has a ctx. */
  const catalog = sessions.catalog;

  /** A live Agent, when one exists, makes the `inject` check exact. */
  const liveAgent = (sessionId) => {
    if (typeof sessionId === 'string' && sessionId.length > 0) {
      return sessions.sessions.get(sessionId)?.agent;
    }
    for (const record of sessions.sessions.values()) return record.agent;
    return undefined;
  };

  /** Everything directory resolution needs, from one snapshot of the library. */
  const catalogLibrary = (skillNames) => ({
    mcpById: new Map(store.library.mcp.map((item) => [item.id, item])),
    skillNames: new Set(skillNames),
    providerById: new Map(store.library.providers.map((item) => [item.id, item])),
  });

  const catalogListing = (skillNames) => {
    const library = catalogLibrary(skillNames);
    const catalogs = store.listCatalogs();
    return {
      catalogs: resolveCatalogs(catalogs, library),
      unfiled: unfiledCapabilities(catalogs, library),
    };
  };

  /**
   * The registered providers as the Settings page needs them, plus the
   * candidate entries. A missing pluginManager degrades to "not supported"
   * instead of failing the whole Settings page.
   */  const providerListing = async (sessionId) => {
    const agent = liveAgent(sessionId);
    let catalogData = { available: false, entries: [], hidden: 0, profileDir: null };
    if (catalog.available()) {
      try {
        const listing = await catalog.list({ agent });
        catalogData = { available: true, ...listing };
      } catch (error) {
        ctx.logger?.warn?.(`capability-hub: could not list profile plugins: ${String(error)}`);
        catalogData = {
          available: false,
          error: String(error?.message ?? error),
          entries: [],
          hidden: 0,
          profileDir: null,
        };
      }
    }
    return {
      ...catalogData,
      providers: store.listProviders().map((provider) => ({
        ...provider,
        presets: store.presetsUsingProvider(provider.id),
        entry: catalogData.entries?.find((row) => row.entryId === provider.entryId) ?? null,
      })),
    };
  };

  /**
   * The whole library as the Settings page needs it: definitions, presets with
   * their resolved contents, and the drift against the default preset.
   */
  const settings = async () => {
    const cwd = ctx.workingDirectory?.defaultDirectory;
    const skills = await listInstalledSkills(ctx, cwd ?? os.homedir());
    const skillNames = skills.map((skill) => skill.name);
    const mcpById = new Map(store.library.mcp.map((item) => [item.id, item]));
    const knownProviders = store.knownProviderIds();
    const resolvedDefault = resolvePreset(
      store.defaultPreset(),
      mcpById,
      skillNames,
      knownProviders,
    );
    const presets = store.listPresets().map((preset) => {
      const resolved = resolvePreset(preset, mcpById, skillNames, knownProviders);
      return {
        ...presetSummary(resolved),
        base: preset.base,
        mcp: resolved.mcp,
        skills: resolved.skills,
        missing: {
          mcp: resolved.missingMcp,
          skills: resolved.missingSkills,
          providers: resolved.missingProviders,
        },
        drift: presetDrift(preset, resolved, resolvedDefault),
        plugins: resolved.plugins,
        bundles: resolved.bundles,
      };
    });
    return {
      cwd: cwd ?? null,
      workspacePresetId: store.workspaceDefaultFor(cwd),
      workspaceDefaults: { ...store.library.workspaceDefaults },
      hostApi: HOST_API,
      mcp: store.listMcp(),
      presets,
      skills,
      ...catalogListing(skillNames),
      capabilityPlugins: await providerListing(undefined),
      stats: {
        mcp: store.library.mcp.length,
        skills: skills.length,
        presets: store.library.presets.length,
        providers: store.library.providers.length,
        catalogs: store.library.catalogs.length,
      },
      // v0.2 reports a migrated library so the UI can say so once.
      migration: store.migration,
    };
  };

  const sessionView = async (sessionId) => {
    const agent = ctx.agents.get(sessionId);
    const cwd =
      agent?.session?.header?.cwd ??
      ctx.workingDirectory?.defaultDirectory ??
      process.cwd();
    const view = await sessions.view(sessionId, cwd);
    const mcpById = new Map(store.library.mcp.map((item) => [item.id, item]));
    const knownProviders = store.knownProviderIds();
    const skillNames = view.skills.map((skill) => skill.name);
    view.presets = store
      .listPresets()
      .map((preset) => presetSummary(resolvePreset(preset, mcpById, skillNames, knownProviders)));
    view.mcpDefinitions = store.listMcp();
    view.hostApi = HOST_API;
    const installed = await listInstalledSkills(ctx, cwd);
    Object.assign(view, catalogListing(installed.map((skill) => skill.name)));
    return view;
  };

  const removeMcpFromLiveSessions = async (id) => {
    for (const [sessionId, record] of sessions.sessions) {
      if (!record.state.mcp.includes(id)) continue;
      try {
        await sessions.update(sessionId, {
          mcp: record.state.mcp.filter((value) => value !== id),
        });
      } catch {
        // A session may be disposing; the stored state still drops the id.
      }
    }
  };

  /** Installed Skill names, for materialising a preset's explicit Skill map. */
  const knownSkills = async (cwd) =>
    (await listInstalledSkills(ctx, cwd ?? os.homedir())).map((skill) => skill.name);

  const actions = {
    async getSettings() {
      return settings();
    },

    async scanImports() {
      return { groups: await scanImportSources() };
    },

    async importSkills(payload) {
      const results = await importSkills(payload.items, { replace: payload.replace === true });
      return { results, settings: await settings() };
    },

    async deleteSkill(payload) {
      const name = requireString(payload.name, 'Skill name');
      const source = payload.source === 'project' ? 'project' : 'user';
      await deleteSkill({ name, source, cwd: payload.cwd });
      return { settings: await settings() };
    },

    async saveMcp(payload) {
      if (!payload.mcp || typeof payload.mcp !== 'object') throw new Error('MCP definition is required.');
      const saved = await store.upsertMcp(payload.mcp);
      const definition = store.getMcp(saved.id);
      for (const [, record] of sessions.sessions) {
        if (!record.state.mcp.includes(saved.id)) continue;
        try {
          if (definition?.enabled === false) {
            await mcp.apply(record.agent, record.state, store.library);
          } else if (definition) {
            await mcp.retry(record.agent, definition);
          }
        } catch (error) {
          ctx.logger?.warn?.(
            `capability-hub: failed to refresh MCP ${saved.id} for a live session: ${String(error)}`,
          );
        }
      }
      return { mcp: saved, settings: await settings() };
    },

    async deleteMcp(payload) {
      const id = requireString(payload.id, 'MCP id');
      await removeMcpFromLiveSessions(id);
      await store.deleteMcp(id);
      return { settings: await settings() };
    },

    // ── Presets ─────────────────────────────────────────────────────────────

    async savePreset(payload) {
      const input = payload.preset;
      if (!input || typeof input !== 'object') throw new Error('Preset is required.');
      const names = await knownSkills(workspaceCwd());
      const saved =
        payload.mode === 'create'
          ? await store.createPreset(input, {
              knownSkills: names,
              // The editor sends the mode; a request without one gets the
              // baseline, which is what "新建方案" means now.
              skillsMode: input.skillsMode === 'explicit' ? 'explicit' : 'sparse',
            })
          : await store.updatePreset(requireString(input.id, 'Preset id'), input, {
              knownSkills: names,
            });
      return { preset: saved, settings: await settings() };
    },

    async deletePreset(payload) {
      const id = requireString(payload.id, 'Preset id');
      await store.deletePreset(id);
      return { settings: await settings() };
    },

    async importPreset(payload) {
      const raw = payload.preset;
      const input = raw && typeof raw === 'object' && raw.preset ? raw.preset : raw;
      if (!input || typeof input !== 'object') throw new Error('Preset payload is required.');
      const names = await knownSkills(workspaceCwd());
      const saved = await store.createPreset(
        {
          name: requireString(input.name, 'Preset name'),
          base: input.base,
          mcp: input.mcp,
          skills: input.skills,
          capturedAt: input.capturedAt,
          plugins: input.plugins,
          bundles: input.bundles,
        },
        { knownSkills: names, skillsMode: input.skillsMode === 'sparse' ? 'sparse' : 'explicit' },
      );
      return { preset: saved, settings: await settings() };
    },

    async setWorkspaceDefault(payload) {
      const cwd = requireString(payload.cwd, 'Workspace directory');
      const presetId = requireString(payload.presetId, 'Preset');
      await store.setWorkspaceDefault(cwd, presetId);
      return { settings: await settings() };
    },

    async clearWorkspaceDefault(payload) {
      const cwd = requireString(payload.cwd, 'Workspace directory');
      await store.clearWorkspaceDefault(cwd);
      return { settings: await settings() };
    },

    // ── Sessions ────────────────────────────────────────────────────────────

    async getSession(payload) {
      const sessionId = requireString(payload.sessionId, 'Session id');
      return sessionView(sessionId);
    },

    async saveSession(payload) {
      const sessionId = requireString(payload.sessionId, 'Session id');
      const agent = ctx.agents.get(sessionId);
      const cwd =
        payload.cwd ??
        agent?.session?.header?.cwd ??
        ctx.workingDirectory?.defaultDirectory ??
        process.cwd();
      // Only forward what the caller actually sent: `presetId` present means
      // "apply this preset", absent means "manual tweak".
      const patch = {};
      if (Object.prototype.hasOwnProperty.call(payload, 'presetId')) patch.presetId = payload.presetId;
      if (Array.isArray(payload.mcp)) patch.mcp = payload.mcp;
      if (payload.skills && typeof payload.skills === 'object') patch.skills = payload.skills;
      if (payload.plugins && typeof payload.plugins === 'object') patch.plugins = payload.plugins;
      await sessions.update(sessionId, patch, cwd);
      return sessionView(sessionId);
    },

    async retryMcp(payload) {
      const sessionId = requireString(payload.sessionId, 'Session id');
      const id = requireString(payload.id, 'MCP id');
      const agent = ctx.agents.get(sessionId);
      if (!agent) throw new Error('Session is not active.');
      const definition = store.getMcp(id);
      if (!definition) throw new Error('MCP server not found.');
      await mcp.retry(agent, definition);
      return sessionView(sessionId);
    },

    // ── Capability directories ──────────────────────────────────────────────

    async listCatalogs() {
      const skills = await listInstalledSkills(ctx, workspaceCwd());
      return { ...catalogListing(skills.map((skill) => skill.name)), settings: await settings() };
    },

    async saveCatalog(payload) {
      if (!payload.catalog || typeof payload.catalog !== 'object') {
        throw new Error('Directory is required.');
      }
      const saved = await store.upsertCatalog(payload.catalog);
      const skills = await listInstalledSkills(ctx, workspaceCwd());
      return { catalog: saved, ...catalogListing(skills.map((skill) => skill.name)) };
    },

    async deleteCatalog(payload) {
      const id = requireString(payload.id, 'Directory id');
      await store.deleteCatalog(id);
      const skills = await listInstalledSkills(ctx, workspaceCwd());
      return catalogListing(skills.map((skill) => skill.name));
    },

    async setCatalogMembers(payload) {
      const id = requireString(payload.id, 'Directory id');
      const saved = await store.setCatalogMembers(id, payload.members);
      const skills = await listInstalledSkills(ctx, workspaceCwd());
      return { catalog: saved, ...catalogListing(skills.map((skill) => skill.name)) };
    },

    // ── Capability providers ────────────────────────────────────────────────

    async listCapabilityPlugins(payload) {
      return providerListing(payload?.sessionId);
    },

    async inspectCapabilityPlugin(payload) {
      const entryId = requireString(payload.entryId, 'Plugin entry');
      const agent = liveAgent(payload.sessionId);
      const row = await catalog.entry(entryId, { agent });
      const verdict = await catalog.judge(row, { agent });
      let inspected = null;
      try {
        inspected = await catalog.inspect(row.moduleName);
      } catch (error) {
        inspected = { error: String(error?.message ?? error) };
      }
      return { entry: row, verdict, inspected, agentScopeChecked: agent !== undefined };
    },

    /**
     * Register one plugin entry and hand it to the capability presets.
     *
     * This turns the plugin off profile-wide, which affects running Sessions
     * immediately; the response reports the outcome so the UI can say so.
     */
    async registerProvider(payload) {
      const entryId = requireString(payload.entryId, 'Plugin entry');
      const agent = liveAgent(payload.sessionId);
      const row = await catalog.entry(entryId, { agent });
      if (row.registered) {
        throw new Error('This plugin is already registered as a capability provider.');
      }
      const verdict = await catalog.judge(row, { agent });
      if (verdict.level === 'profile-only') {
        throw new Error(
          `This plugin cannot be mounted per Session: ${(verdict.reasons ?? []).join(' ')}`,
        );
      }
      const result = await catalog.takeover(row, {
        mountAt: payload.mountAt === 'any-time' ? 'any-time' : 'session-start',
        config: payload.config && typeof payload.config === 'object' ? payload.config : {},
      });
      await store.setProviderVerdict(result.provider.id, {
        level: verdict.level,
        reasons: verdict.reasons ?? [],
        checkedAt: verdict.checkedAt,
        dshVersion: '',
      });
      return {
        provider: store.getProvider(result.provider.id) ?? result.provider,
        created: result.created,
        application: result.application,
        alreadyDisabled: result.alreadyDisabled,
        affectedSessions: sessions.sessions.size,
        verdict,
        settings: await settings(),
      };
    },

    /** Give the plugin back to the profile and forget the record. */
    async unregisterProvider(payload) {
      const id = requireString(payload.id, 'Provider id');
      const provider = store.getProvider(id);
      if (!provider) throw new Error('Capability provider not found.');
      // Detach per-Session instances first: once the entry is enabled again the
      // profile-wide instance returns, and a second copy would double its tools.
      for (const [sessionId, record] of sessions.sessions) {
        if (record.providerFibers.has(id)) await sessions.dropProvider(sessionId, id);
      }
      const released = await catalog.release(provider);
      return {
        application: released.application,
        entryId: released.entryId,
        changedPresets: released.presets,
        settings: await settings(),
      };
    },

    async setProviderEnabled(payload) {
      const id = requireString(payload.id, 'Provider id');
      await store.setProviderEnabled(id, payload.enabled === true);
      for (const [, record] of sessions.sessions) {
        try {
          await sessions.applyProviders(record.agent, record);
        } catch (error) {
          ctx.logger?.warn?.(`capability-hub: provider toggle failed for a live session: ${String(error)}`);
        }
      }
      return { settings: await settings() };
    },

    async recheckProvider(payload) {
      const id = requireString(payload.id, 'Provider id');
      const provider = store.getProvider(id);
      if (!provider) throw new Error('Capability provider not found.');
      // A re-check is the user asking again: forget what a previous failure
      // proved, so a freed route or a closed Session can be retried.
      await store.clearProviderIssue(id);
      const agent = liveAgent(payload.sessionId);
      let verdict;
      try {
        const row = await catalog.entry(provider.entryId, { agent });
        verdict = await catalog.judge(row, { agent });
      } catch (error) {
        verdict = {
          level: 'review',
          reasons: [String(error?.message ?? error)],
          checkedAt: new Date().toISOString(),
        };
      }
      await store.setProviderVerdict(id, {
        level: verdict.level,
        reasons: verdict.reasons ?? [],
        checkedAt: verdict.checkedAt,
        dshVersion: '',
      });
      // Give the live Sessions one more chance now that the diagnosis is gone.
      for (const [, record] of sessions.sessions) {
        try {
          await sessions.applyProviders(record.agent, record);
        } catch (error) {
          ctx.logger?.warn?.(`capability-hub: provider recheck mount failed: ${String(error)}`);
        }
      }
      return { verdict, settings: await settings() };
    },

    /** Replace the Session's provider selection (a manual tweak, like MCP/Skills). */
    async setSessionProviders(payload) {
      const sessionId = requireString(payload.sessionId, 'Session id');
      const ids = Array.isArray(payload.providerIds)
        ? payload.providerIds.filter((value) => typeof value === 'string')
        : [];
      const known = store.knownProviderIds();
      await sessions.update(
        sessionId,
        { plugins: { desired: ids.filter((id) => known.has(id)).map((id) => ({ providerId: id, enabled: true })) } },
        payload.cwd,
      );
      return sessionView(sessionId);
    },

    /**
     * Re-run the provider pass for a Session that is already running. Used after
     * a takeover removed the plugin it was relying on globally.
     */
    async remountProviders(payload) {
      const sessionId = requireString(payload.sessionId, 'Session id');
      await sessions.remountProviders(sessionId);
      return sessionView(sessionId);
    },
  };

  const dispose = fetchService.register({
    path: '/api/capability-hub',
    methods: ['POST'],
    requestBody: 'buffered',
    fetch: async (request) => {
      try {
        const payload = await request.json();
        const action = typeof payload?.action === 'string' ? payload.action : '';
        const handler = actions[action];
        if (handler === undefined) throw new Error(`Unknown action "${action}".`);
        const data = await handler(payload);
        return jsonResponse({ ok: true, data });
      } catch (error) {
        ctx.logger?.warn?.(`capability-hub: API request failed: ${String(error)}`);
        return jsonResponse({ ok: false, error: String(error?.message ?? error) });
      }
    },
  });

  ctx.effect(() => dispose, 'capability-hub: API route');
}
