import { estimateTokens } from './util.js';
import {
  buildSessionState,
  effectiveSkillState,
  normalizePlugins,
  presetDrift,
  resolvePreset,
  sameMcp,
  sameSkills,
  skillDefaultFor,
} from './presets.js';
import { classifyMountError, desiredProviderIds, mountAtOf, providerView, sameProviders } from './providers.js';
import { CapabilityCatalog } from './capability-catalog.js';

const POLICY_PROVIDER = 'capability-policy';
const SCOPE_PACKAGE = '@deepseek-ai/dsh-scope';
const MOUNT_TIMEOUT_MS = 10000;
const DISPOSE_TIMEOUT_MS = 2500;

/** The error text for a plugin that owns a process-wide resource. */
function globalResourceError(holder) {
  return holder === undefined
    ? 'This plugin registers process-wide resources (HTTP routes or a port), so only one instance can run at a time. Release it to run profile-wide, or keep it in a single Session.'
    : `Already mounted in session ${holder}: this plugin registers process-wide resources, so only one Session can have it at a time. Release it to run profile-wide.`;
}

/**
 * Race a promise against a timer without rejecting on timeout.
 * @returns the promise value, or the string `'timeout'`.
 */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function invocationFor(state, base) {
  if (state === 'manual') {
    return { modelInvocable: false, userInvocable: base?.userInvocable === true };
  }
  if (state === 'off') return { modelInvocable: false, userInvocable: false };
  return base ?? { modelInvocable: true, userInvocable: true };
}

function shadowCandidate(skill, state) {
  return {
    name: skill.name,
    description: skill.description,
    ...(skill.whenToUse === undefined ? {} : { whenToUse: skill.whenToUse }),
    invocation: invocationFor(state, skill.invocation),
    source: skill.source,
    provider: POLICY_PROVIDER,
    rank: 100,
    locator: { name: skill.name },
    ...(skill.path === undefined ? {} : { path: skill.path }),
    ...(skill.resourceBase === undefined ? {} : { resourceBase: skill.resourceBase }),
  };
}

function isMcpTool(name) {
  return typeof name === 'string' && name.startsWith('mcp__');
}

function mcpServerOf(name) {
  if (!isMcpTool(name)) return undefined;
  const rest = name.slice('mcp__'.length);
  const index = rest.indexOf('__');
  return index === -1 ? rest : rest.slice(0, index);
}

const MCP_RESOURCE_TOOLS = new Set([
  'list_mcp_resources',
  'list_mcp_resource_templates',
  'read_mcp_resource',
]);

export class SessionRuntime {
  constructor(ctx, store, mcp, skills) {
    this.ctx = ctx;
    this.store = store;
    this.mcp = mcp;
    this.skills = skills;
    this.catalog = new CapabilityCatalog(ctx, store);
    this.sessions = new Map();
  }

  cwdOf(agent) {
    const cwd = agent?.session?.header?.cwd;
    return typeof cwd === 'string' && cwd.length > 0 ? cwd : process.cwd();
  }

  async onCreated(agent) {
    const cwd = this.cwdOf(agent);
    const header = agent.session?.header;
    let state;
    if (header?.origin === 'subagent' && typeof header.parentSession === 'string') {
      try {
        state = await this.store.copySession(header.parentSession, agent.id, cwd);
      } catch {
        state = await this.store.getSession(agent.id, cwd);
      }
    } else {
      state = await this.store.getSession(agent.id, cwd);
    }

    const record = {
      agent,
      cwd,
      state,
      stateRef: { state },
      // The preset the Session's Skill defaults come from. Refreshed on every
      // update; a Session never re-follows a changed preset on its own.
      preset: this.store.resolvePresetFor(cwd, state.presetId),
      policyControl: null,
      policyDispose: null,
      // The read-back verdict for the Skill policy (`off`/`manual` shadows):
      // `{ok, visible, leaked}` once checked, so the panel can say whether the
      // model really stops seeing a hidden Skill.
      policyStatus: null,
      // `started` becomes true once the first turn can run: a `session-start`
      // provider may not change after that, because its prompt contribution has
      // already been folded into the conversation.
      started: false,
      providerFibers: new Map(),
      providers: new Map(),
    };
    this.sessions.set(agent.id, record);
    await this.installPolicy(agent, record);
    try {
      await this.mcp.apply(agent, state, this.store.library);
    } catch (error) {
      this.ctx.logger?.warn?.(`capability-hub: MCP mount failed for session ${agent.id}: ${String(error)}`);
    }
    try {
      await this.applyProviders(agent, record, { initial: true });
    } catch (error) {
      this.ctx.logger?.warn?.(
        `capability-hub: capability provider mount failed for session ${agent.id}: ${String(error)}`,
      );
    }
    record.started = true;
  }

  /**
   * The `@deepseek-ai/dsh-scope` helpers, resolved through the host loader.
   *
   * The hub is installed as a `link:` package outside the profile, so a bare
   * static import would not resolve there; the loader resolves against the
   * running host, which is the only place these packages exist.
   */
  async scopeHelpers() {
    this.scopeHelpersPromise ??= (async () => {
      try {
        const module = await this.ctx.loader?.import?.(SCOPE_PACKAGE, () => []);
        if (typeof module?.scopeChainOf === 'function') return module;
      } catch (error) {
        this.ctx.logger?.warn?.(`capability-hub: ${SCOPE_PACKAGE} unavailable: ${String(error)}`);
      }
      try {
        const module = await import(SCOPE_PACKAGE);
        return typeof module?.scopeChainOf === 'function' ? module : null;
      } catch {
        return null;
      }
    })();
    return this.scopeHelpersPromise;
  }

  async installPolicy(agent, record) {
    if (!this.skills) return;
    const agentSkills = agent.ctx.get?.('skills');
    if (!agentSkills) {
      record.policyStatus = { ok: false, reason: 'no-agent-skills' };
      return;
    }
    const stateOf = (name) =>
      effectiveSkillState(record.preset, record.stateRef.state.skills, name);

    // The Skill PROVIDERS are composed inside each Agent preset's scope
    // (`dsh-web-app/presets/standard.patch.yml` mounts dsh-skill-filesystem and
    // dsh-tool-skill there) while the `skills` service itself is a root row. A
    // provider files its candidates into the preset's layer, so an unscoped
    // `list()` sees the global layer only and returns nothing — which is how a
    // Skill marked `off` stayed model-visible while the panel said 隐藏.
    //
    // Enumerate through the Agent's nearest enclosing scope instead: that keeps
    // every layer the Agent inherits and leaves out this provider's own layer,
    // so the read cannot re-enter itself.
    const helpers = await this.scopeHelpers();
    const baseScope = () => {
      try {
        const chain = helpers?.scopeChainOf?.(agent) ?? [];
        return chain.length > 1 ? chain[1] : undefined;
      } catch {
        return undefined;
      }
    };
    record.policyBaseScope = baseScope;

    try {
      record.policyDispose = agentSkills.registerProvider((control) => {
        record.policyControl = control;
        return {
          name: POLICY_PROVIDER,
          list: async (options) => {
            const cwd = options.cwd ?? record.cwd;
            const base = await this.skills.list({ cwd, scope: baseScope(), signal: options.signal });
            const result = [];
            for (const skill of base) {
              const state = stateOf(skill.name);
              if (state === 'auto') continue;
              result.push(shadowCandidate(skill, state));
            }
            return result;
          },
          get: async (candidate, options) => {
            const cwd = options.cwd ?? record.cwd;
            const definition = await this.skills.get(candidate.name, {
              cwd,
              scope: baseScope(),
              signal: options.signal,
            });
            if (!definition) return undefined;
            return { ...definition, invocation: invocationFor(stateOf(candidate.name), definition.invocation) };
          },
        };
      });
    } catch (error) {
      this.ctx.logger?.warn?.(`capability-hub: skill policy failed for session ${agent.id}: ${String(error)}`);
      record.policyStatus = { ok: false, reason: String(error) };
      return;
    }
    void this.checkPolicy(agent, record, stateOf);
  }

  /**
   * Read back what the model will actually be offered.
   *
   * A shadow that never lands is invisible: the service swallows provider
   * errors and the panel would still say 隐藏. This compares the real catalog
   * with the Session's policy and records the verdict for the UI.
   */
  async checkPolicy(agent, record, stateOf) {
    try {
      const snapshot = await this.skills.snapshot({ cwd: record.cwd, scope: agent });
      const leaked = [];
      for (const skill of snapshot.skills) {
        if (stateOf(skill.name) === 'auto') continue;
        if (skill.invocation?.modelInvocable === true) leaked.push(skill.name);
      }
      record.policyStatus = { ok: leaked.length === 0, visible: snapshot.skills.length, leaked };
      if (leaked.length > 0) {
        this.ctx.logger?.warn?.(
          `capability-hub: skill policy did not take effect for session ${agent.id}: ${leaked.join(', ')}`,
        );
      }
    } catch (error) {
      record.policyStatus = { ok: null, reason: String(error) };
    }
  }

  // ── Capability providers ──────────────────────────────────────────────────

  /** Tool names and prompt-section names currently visible to this Agent. */
  async contributionSnapshot(agent, cwd) {
    const tools = [];
    try {
      for (const schema of this.ctx.tools.schemas(agent)) tools.push(schema.name);
    } catch {
      // A scope that cannot enumerate tools contributes nothing observable.
    }
    const sections = [];
    try {
      const assembly = await this.ctx.systemPrompt.assemble({ agent, scope: agent });
      for (const section of assembly.sections) sections.push(section.name);
    } catch {
      // Same: an unreadable assembly must not block the mount.
    }
    return { tools, sections };
  }

  /**
   * Make the Session's provider set match its preset and the provider records.
   *
   * Rules from the blueprint's §7.3:
   *   session-start  decides before the first turn. After that, wanted-but-not-
   *                  mounted is `deferred`, mounted-but-not-wanted is `locked`.
   *   any-time       mounted and disposed immediately, at the next turn boundary.
   *
   * `initial` is the session-creation pass, the only pass where a
   * `session-start` provider may still be mounted.
   */
  async applyProviders(agent, record, { initial = false } = {}) {
    // The Session's own selection decides, not the preset's: applying a preset
    // writes both, and a manual toggle is allowed to deviate (that is what the
    // `dirty` flag reports).
    const desired = new Set(desiredProviderIds({ plugins: record.state.plugins }));
    const started = record.started && !initial;
    const reachable = this.catalog.available();

    // The profile's entry states are read at most once per pass, and only when a
    // mount is actually attempted: mounting a provider whose entry is still
    // enabled globally would register its tools twice.
    let globals;
    const profileEntries = async () => {
      if (globals !== undefined) return globals;
      globals = null;
      if (!reachable) return globals;
      try {
        globals = await this.catalog.list({ agent });
      } catch (error) {
        this.ctx.logger?.warn?.(
          `capability-hub: could not read profile plugin state: ${String(error)}`,
        );
      }
      return globals;
    };

    for (const provider of this.store.library.providers) {
      const mounted = record.providerFibers.has(provider.id);
      const wanted = provider.enabled !== false && desired.has(provider.id);
      const mountAt = mountAtOf(provider);

      if (!wanted) {
        if (!mounted) {
          record.providers.set(provider.id, {
            status: 'off',
            error: null,
            contributions: { tools: [], sections: [] },
          });
          continue;
        }
        if (mountAt === 'session-start' && started) {
          const previous = record.providers.get(provider.id);
          record.providers.set(provider.id, {
            status: 'locked',
            error: null,
            contributions: previous?.contributions ?? { tools: [], sections: [] },
          });
          continue;
        }
        await this.unmountProvider(record, provider.id);
        continue;
      }

      if (mounted) {
        const previous = record.providers.get(provider.id);
        record.providers.set(provider.id, {
          status: 'mounted',
          error: null,
          contributions: previous?.contributions ?? { tools: [], sections: [] },
        });
        continue;
      }

      if (mountAt === 'session-start' && started) {
        record.providers.set(provider.id, {
          status: 'deferred',
          error: null,
          contributions: { tools: [], sections: [] },
        });
        continue;
      }

      // A plugin that owns a process-wide resource cannot be mounted twice in
      // the process. Once a failure has proved that, say who holds it instead of
      // letting the plugin throw a duplicate-route error again.
      if (provider.issue?.kind === 'global-resource') {
        const holder = this.providerHolder(agent.id, provider.id);
        if (holder !== undefined) {
          record.providers.set(provider.id, {
            status: 'failed',
            error: globalResourceError(holder),
            contributions: { tools: [], sections: [] },
          });
          continue;
        }
      }

      const entries = await profileEntries();
      if (entries !== null) {
        const row = entries.entries.find((item) => item.entryId === provider.entryId);
        if (row === undefined) {
          record.providers.set(provider.id, {
            status: 'failed',
            error: 'The plugin entry no longer exists in the profile. Register it again or release it.',
            contributions: { tools: [], sections: [] },
          });
          continue;
        }
        if (row.enabled === true) {
          record.providers.set(provider.id, {
            status: 'failed',
            error: 'Still enabled profile-wide. Take it over first, or its tools would be registered twice.',
            contributions: { tools: [], sections: [] },
          });
          continue;
        }
      }

      await this.mountProvider(agent, record, provider);
    }
  }

  /** The other Session currently holding this provider, if any. */
  providerHolder(sessionId, providerId) {
    for (const [id, record] of this.sessions) {
      if (id === sessionId) continue;
      if (record.providerFibers.has(providerId)) return id;
    }
    return undefined;
  }

  async mountProvider(agent, record, provider) {
    const before = await this.contributionSnapshot(agent, record.cwd);
    let fiber = null;
    try {
      const module = await this.ctx.loader.import(provider.packageName, () => []);
      if (typeof module?.apply !== 'function') {
        record.providers.set(provider.id, {
          status: 'failed',
          error: 'The package has no apply(): it is a client-only bundle.',
          contributions: { tools: [], sections: [] },
        });
        return;
      }
      fiber = agent.ctx.plugin(module, provider.config ?? {});
      const outcome = await withTimeout(Promise.resolve(fiber), MOUNT_TIMEOUT_MS);
      if (outcome === 'timeout') {
        record.providers.set(provider.id, {
          status: 'failed',
          error: `Mounting did not finish within ${MOUNT_TIMEOUT_MS / 1000}s.`,
          contributions: { tools: [], sections: [] },
        });
        await this.disposeFiber(fiber);
        return;
      }
      // `await fiber` resolves even when the plugin never became active because
      // a declared service is missing, so the state is the real answer.
      if (fiber.state !== 2) {
        const injected = Array.isArray(module.inject)
          ? module.inject
          : Object.keys(fiber.inject ?? {});
        const { missing } = this.catalog.missingServices(injected, agent);
        record.providers.set(provider.id, {
          status: 'failed',
          error:
            missing.length > 0
              ? `Waiting for services the Session cannot provide: ${missing.join(', ')}.`
              : 'The plugin did not activate (no apply ran).',
          contributions: { tools: [], sections: [] },
        });
        await this.disposeFiber(fiber);
        return;
      }
      record.providerFibers.set(provider.id, fiber);
      const after = await this.contributionSnapshot(agent, record.cwd);
      const beforeTools = new Set(before.tools);
      const beforeSections = new Set(before.sections);
      record.providers.set(provider.id, {
        status: 'mounted',
        error: null,
        contributions: {
          tools: after.tools.filter((name) => !beforeTools.has(name)),
          sections: after.sections.filter((name) => !beforeSections.has(name)),
        },
      });
      // It mounted, so whatever a previous failure proved no longer holds.
      if (provider.issue !== undefined) await this.store.clearProviderIssue(provider.id);
    } catch (error) {
      if (fiber !== null) await this.disposeFiber(fiber);
      const kind = classifyMountError(error);
      if (kind === 'global-resource') {
        await this.store
          .setProviderIssue(provider.id, {
            kind,
            message: String(error?.message ?? error),
            at: new Date().toISOString(),
          })
          .catch(() => {});
        record.providers.set(provider.id, {
          status: 'failed',
          error: globalResourceError(undefined),
          contributions: { tools: [], sections: [] },
        });
        return;
      }
      record.providers.set(provider.id, {
        status: 'failed',
        error:
          kind === 'already-mounted'
            ? 'This Session already mounted this plugin; the hub refused to mount a second copy.'
            : String(error?.message ?? error),
        contributions: { tools: [], sections: [] },
      });
    }
  }

  async disposeFiber(fiber) {
    try {
      await withTimeout(Promise.resolve(fiber?.dispose?.()), DISPOSE_TIMEOUT_MS);
    } catch {
      // A slow dispose still detaches with the Agent scope.
    }
  }

  async unmountProvider(record, providerId) {
    const fiber = record.providerFibers.get(providerId);
    record.providerFibers.delete(providerId);
    if (fiber !== undefined) await this.disposeFiber(fiber);
    record.providers.set(providerId, {
      status: 'off',
      error: null,
      contributions: { tools: [], sections: [] },
    });
  }

  /**
   * Re-run the provider pass for a live Session.
   *
   * Needed after a takeover on a Session that was already running: it lost the
   * globally-mounted plugin, and a `session-start` provider would otherwise be
   * deferred until the next Session. The user asks for this explicitly.
   */
  async remountProviders(sessionId) {
    const record = this.sessions.get(sessionId);
    if (!record) throw new Error('Session is not active.');
    record.preset = this.store.resolvePresetFor(record.cwd, record.state.presetId);
    await this.applyProviders(record.agent, record, { initial: true });
    return this.providerRuntime(record);
  }

  /**
   * Detach one provider from a live Session without touching the rest.
   *
   * Used before releasing a provider back to the profile: the profile-wide
   * instance is about to come back, and a per-Session copy would register the
   * same tools twice.
   */
  async dropProvider(sessionId, providerId) {
    const record = this.sessions.get(sessionId);
    if (!record) return;
    await this.unmountProvider(record, providerId);
    record.providers.delete(providerId);
  }

  /**
   * The live part of the provider view, keyed by provider id.
   * @param record - the live Session record, if any.
   * @param state - the Session state that decides which providers are wanted.
   */
  providerRuntime(record, state = record?.state) {
    const desired = new Set(desiredProviderIds({ plugins: state?.plugins }));
    const result = [];
    for (const provider of this.store.library.providers) {
      const runtime = record?.providers.get(provider.id);
      result.push(
        providerView(provider, {
          name: provider.packageName,
          status: runtime?.status ?? 'off',
          error: runtime?.error ?? null,
          desired: desired.has(provider.id),
          contributions: runtime?.contributions,
        }),
      );
    }
    return result;
  }

  onDisposed(sessionId) {
    const record = this.sessions.get(sessionId);
    if (!record) return;
    this.sessions.delete(sessionId);
    this.mcp.forgetSession?.(sessionId);
    for (const fiber of record.providerFibers.values()) {
      Promise.resolve(fiber?.dispose?.()).catch(() => {});
    }
    record.providerFibers.clear();
  }

  /**
   * Update a Session's capability selection.
   *
   * `patch.presetId` **applies** a preset: the Session's whole selection is
   * replaced by the preset's, which is what "选方案" means everywhere in the
   * UI. `null` means follow the workspace default. A patch without `presetId`
   * is a manual tweak and keeps the Session's own copy.
   */
  async update(sessionId, patch, cwd) {
    const live = this.sessions.get(sessionId);
    const effectiveCwd = cwd ?? live?.cwd ?? process.cwd();
    const current = live?.state ?? (await this.store.getSession(sessionId, effectiveCwd));
    let next = { ...current };

    if (patch !== null && typeof patch === 'object' && 'presetId' in patch) {
      const presetId =
        patch.presetId === null || patch.presetId === '' ? null : String(patch.presetId);
      const preset = this.store.resolvePresetFor(effectiveCwd, presetId);
      const knownMcp = new Set(this.store.library.mcp.map((item) => item.id));
      next = {
        presetId,
        ...buildSessionState(preset, knownMcp, this.store.knownProviderIds()),
      };
    } else {
      if (Array.isArray(patch?.mcp)) next.mcp = patch.mcp.filter((id) => typeof id === 'string');
      if (patch?.skills && typeof patch.skills === 'object') {
        next.skills = { ...(next.skills ?? {}) };
        for (const [name, value] of Object.entries(patch.skills)) {
          if (value === 'auto' || value === 'manual' || value === 'off') next.skills[name] = value;
        }
      }
      if (patch?.plugins !== undefined) {
        next.plugins = normalizePlugins(patch.plugins);
      }
    }

    const normalized = this.store.normalizeSession(next, effectiveCwd);
    normalized.presetId = next.presetId ?? null;
    await this.store.saveSession(sessionId, normalized);

    if (live) {
      live.state = normalized;
      live.stateRef.state = normalized;
      live.preset = this.store.resolvePresetFor(effectiveCwd, normalized.presetId);
      live.policyControl?.invalidate?.();
      const preset = live.preset;
      void this.checkPolicy(live.agent, live, (name) =>
        effectiveSkillState(preset, live.stateRef.state.skills, name),
      );
      await this.mcp.apply(live.agent, normalized, this.store.library);
      try {
        await this.applyProviders(live.agent, live);
      } catch (error) {
        this.ctx.logger?.warn?.(
          `capability-hub: capability provider update failed for session ${sessionId}: ${String(error)}`,
        );
      }
    }
    return normalized;
  }

  async load(sessionId, cwd) {
    return this.sessions.get(sessionId)?.state ?? (await this.store.getSession(sessionId, cwd));
  }

  async view(sessionId, cwd) {
    const live = this.sessions.get(sessionId);
    const effectiveCwd = cwd ?? live?.cwd ?? process.cwd();
    const state = live?.state ?? (await this.store.getSession(sessionId, effectiveCwd));
    const agent = live?.agent;
    const result = {
      live: Boolean(live),
      sessionId,
      cwd: effectiveCwd,
      state,
      mcp: [],
      skills: [],
      tools: [],
      instructions: [],
      estimates: { tools: 0, skills: 0, instructions: 0, total: 0 },
      // What the read-back found: `null` until the policy is verified.
      skillsPolicy: live?.policyStatus ?? null,
    };

    if (agent) {
      // Which capability a tool comes from, so the Model View can explain it.
      const providerTools = new Map();
      if (live) {
        for (const [providerId, runtime] of live.providers) {
          const name = this.store.getProvider(providerId)?.packageName ?? providerId;
          for (const toolName of runtime?.contributions?.tools ?? []) providerTools.set(toolName, name);
        }
      }
      try {
        const schemas = this.ctx.tools.schemas(agent);
        result.tools = schemas.map((schema) => {
          const server = mcpServerOf(schema.name);
          const isResourceTool = MCP_RESOURCE_TOOLS.has(schema.name);
          const provider = providerTools.get(schema.name) ?? null;
          return {
            name: schema.name,
            description: schema.description,
            source: server
              ? `mcp:${server}`
              : isResourceTool
                ? 'mcp:resources'
                : provider !== null
                  ? 'provider'
                  : 'native',
            server,
            provider,
            tokens: estimateTokens(`${schema.name}${schema.description}${JSON.stringify(schema.parameters ?? {})}`),
          };
        });
      } catch {
        result.tools = [];
      }

      try {
        const skillService = agent.ctx.get?.('skills') ?? this.skills;
        const snapshot = await skillService.snapshot({ scope: agent, cwd: effectiveCwd });
        result.skills = snapshot.skills.map((skill) => {
          const stateValue = effectiveSkillState(
            this.store.resolvePresetFor(effectiveCwd, state.presetId),
            state.skills,
            skill.name,
          );
          return {
            name: skill.name,
            description: skill.description,
            state: stateValue,
            invocation: skill.invocation,
            source: skill.source,
            provider: skill.provider,
            path: skill.path,
            tokens: estimateTokens(`${skill.name}${skill.description}`),
          };
        });
      } catch {
        result.skills = [];
      }

      try {
        // `agent` is required: a provider that injects a prompt section reads
        // `assembleContext.agent` and silently skips when it is missing.
        const assembly = await this.ctx.systemPrompt.assemble({ agent, scope: agent });
        const providerSections = new Set();
        if (live) {
          for (const runtime of live.providers.values()) {
            for (const name of runtime?.contributions?.sections ?? []) providerSections.add(name);
          }
        }
        result.instructions = assembly.sections
          .filter(
            (section) =>
              section.name.startsWith('mcp:') ||
              section.name === 'mcp-resource-servers' ||
              providerSections.has(section.name),
          )
          .map((section) => ({
            name: section.name,
            text: section.text,
            tokens: estimateTokens(section.text),
            // Which capability a section belongs to, so the Model View can say
            // "this prompt text is here because of plugin X".
            provider: providerSections.has(section.name)
              ? this.providerNameOfSection(live, section.name)
              : null,
          }));
      } catch {
        result.instructions = [];
      }
    }

    const statusById = new Map(this.mcp.status(sessionId).map((item) => [item.id, item]));
    result.mcp = this.store.library.mcp.map((definition) => {
      const status = statusById.get(definition.id);
      return {
        ...this.store.publicMcp(definition),
        exposed: definition.enabled !== false && state.mcp.includes(definition.id),
        status: status?.status ?? 'idle',
        error: status?.error ?? null,
        tools: status?.tools ?? 0,
      };
    });

    result.estimates.tools = result.tools.reduce((sum, item) => sum + item.tokens, 0);
    result.estimates.skills = result.skills
      .filter((skill) => skill.invocation.modelInvocable)
      .reduce((sum, item) => sum + item.tokens, 0);
    result.estimates.instructions = result.instructions.reduce((sum, item) => sum + item.tokens, 0);
    result.estimates.total =
      result.estimates.tools + result.estimates.skills + result.estimates.instructions;

    result.providers = this.providerRuntime(live, state);

    result.preset = this.presetView(
      state,
      effectiveCwd,
      // Without a live agent the installed Skill list is unknown; passing null
      // keeps an inactive Session from reporting every Skill as missing.
      agent ? result.skills.map((skill) => skill.name) : null,
    );
    // A preset may reference providers that were unregistered afterwards. They
    // cannot be mounted, and the panel says so instead of silently dropping them.
    if (live !== undefined) {
      result.missingProviders = (result.preset?.missing?.providers ?? []).map((providerId) => ({
        providerId,
        name: providerId,
      }));
    }
    return result;
  }

  /** The provider id that contributed a prompt section, for attribution. */
  providerNameOfSection(record, sectionName) {
    for (const [providerId, runtime] of record.providers) {
      if ((runtime?.contributions?.sections ?? []).includes(sectionName)) {
        return this.store.getProvider(providerId)?.packageName ?? providerId;
      }
    }
    return null;
  }

  /**
   * Provenance for the Session panel: which preset this Session came from,
   * whether it still matches it, and what the default preset has that this one
   * does not.
   */
  presetView(state, cwd, installedSkillNames) {
    const installed = Array.isArray(installedSkillNames) ? installedSkillNames : null;
    const names = installed ?? [];
    const preset = this.store.resolvePresetFor(cwd, state.presetId);
    const mcpById = new Map(this.store.library.mcp.map((item) => [item.id, item]));
    const knownProviders = this.store.knownProviderIds();
    const resolvedPr = resolvePreset(preset, mcpById, names, knownProviders);
    const resolvedDefault = resolvePreset(
      this.store.defaultPreset(),
      mcpById,
      names,
      knownProviders,
    );
    const drift = presetDrift(preset, resolvedPr, resolvedDefault);
    const dirty =
      !sameMcp(
        state.mcp,
        resolvedPr.mcp.filter((item) => item.present).map((item) => item.id),
      ) ||
      !sameSkills(state.skills, preset.skills, skillDefaultFor(preset)) ||
      !sameProviders(state.plugins ?? preset.plugins, preset.plugins);
    return {
      id: resolvedPr.id,
      name: resolvedPr.name,
      isDefault: resolvedPr.isDefault,
      skillsMode: resolvedPr.skillsMode,
      capturedAt: resolvedPr.capturedAt,
      followDefault: state.presetId === null,
      workspaceDefaultId: this.store.workspaceDefaultFor(cwd),
      dirty,
      counts: resolvedPr.counts,
      mcp: resolvedPr.mcp,
      skills: resolvedPr.skills,
      missing: {
        mcp: resolvedPr.missingMcp,
        skills: installed === null ? [] : resolvedPr.missingSkills,
        providers: resolvedPr.missingProviders,
      },
      drift,
      plugins: resolvedPr.plugins,
      bundles: resolvedPr.bundles,
    };
  }
}
