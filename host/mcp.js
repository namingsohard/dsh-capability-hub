import { sanitizeServerName } from './util.js';

const CONNECT_TIMEOUT_MS = 8000;
const DISPOSE_TIMEOUT_MS = 2500;

function resolveTemplate(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name) => process.env[name] ?? '');
}

function resolveRecord(record) {
  const result = {};
  for (const [key, value] of Object.entries(record ?? {})) {
    if (typeof value === 'string') result[key] = resolveTemplate(value);
  }
  return result;
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve('timeout'), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class McpRuntime {
  constructor(ctx) {
    this.ctx = ctx;
    this.modulePromise = null;
    this.sessions = new Map();
  }

  getModule() {
    this.modulePromise ??= this.ctx.loader
      .import('@deepseek-ai/dsh-mcp-client', () => [])
      .catch((error) => {
        this.modulePromise = null;
        throw error;
      });
    return this.modulePromise;
  }

  ensure(agent) {
    let record = this.sessions.get(agent.id);
    if (!record) {
      record = { agent, mounts: new Map() };
      this.sessions.set(agent.id, record);
    }
    return record;
  }

  configFor(agent, definition) {
    const cwd =
      definition.cwd ||
      (typeof agent.session?.header?.cwd === 'string' ? agent.session.header.cwd : process.cwd());
    const shared = {
      serverName: sanitizeServerName(definition.serverName),
      toolCallTimeoutMs: 60000,
      maxInstructionBytes: 32768,
      failOnStartupError: true,
    };
    if (definition.transport === 'streamable-http') {
      return {
        ...shared,
        transport: 'streamable-http',
        url: definition.url,
        headers: resolveRecord(definition.headers),
      };
    }
    return {
      ...shared,
      transport: 'stdio',
      command: definition.command,
      args: Array.isArray(definition.args) ? definition.args : [],
      env: resolveRecord(definition.env),
      cwd,
    };
  }

  countTools(agent, definition) {
    const prefix = `mcp__${sanitizeServerName(definition.serverName)}__`;
    try {
      return this.ctx.tools.schemas(agent).filter((schema) => schema.name.startsWith(prefix)).length;
    } catch {
      return 0;
    }
  }

  async mount(agent, definition) {
    const session = this.ensure(agent);
    const existing = session.mounts.get(definition.id);
    if (existing && existing.status !== 'failed') return existing;

    const record = {
      definition,
      fiber: null,
      status: 'connecting',
      error: null,
      tools: 0,
      startedAt: Date.now(),
    };
    session.mounts.set(definition.id, record);

    try {
      const module = await this.getModule();
      const fiber = agent.ctx.plugin(module, this.configFor(agent, definition));
      record.fiber = fiber;
      const ready = Promise.resolve(fiber)
        .then(() => {
          record.status = 'ready';
          record.tools = this.countTools(agent, definition);
        })
        .catch((error) => {
          record.status = 'failed';
          record.error = String(error?.message ?? error);
          record.tools = 0;
        });
      const outcome = await withTimeout(ready, CONNECT_TIMEOUT_MS);
      if (outcome === 'timeout') {
        record.status = 'connecting';
      }
    } catch (error) {
      record.status = 'failed';
      record.error = String(error?.message ?? error);
    }
    return record;
  }

  async unmount(session, id) {
    const record = session.mounts.get(id);
    if (!record) return;
    session.mounts.delete(id);
    record.status = 'disposing';
    try {
      await withTimeout(Promise.resolve(record.fiber?.dispose?.()), DISPOSE_TIMEOUT_MS);
    } catch {
      // A slow connection may keep dispose pending; the agent scope still owns it.
    }
  }

  async apply(agent, state, library) {
    const session = this.ensure(agent);
    const byId = new Map(library.mcp.map((item) => [item.id, item]));
    const desired = new Set(state.mcp.filter((id) => byId.get(id)?.enabled !== false));

    for (const id of [...session.mounts.keys()]) {
      if (!desired.has(id)) await this.unmount(session, id);
    }

    const pending = [];
    for (const id of desired) {
      const definition = byId.get(id);
      if (!definition) continue;
      const existing = session.mounts.get(id);
      if (existing && existing.status !== 'failed' && existing.status !== 'disposing') continue;
      if (existing?.status === 'failed') await this.unmount(session, id);
      pending.push(this.mount(agent, definition));
    }
    await Promise.allSettled(pending);
  }

  async retry(agent, definition) {
    const session = this.ensure(agent);
    await this.unmount(session, definition.id);
    return this.mount(agent, definition);
  }

  status(agentId) {
    const session = this.sessions.get(agentId);
    if (!session) return [];
    return [...session.mounts.values()].map((record) => ({
      id: record.definition.id,
      name: record.definition.name,
      serverName: record.definition.serverName,
      status: record.status,
      error: record.error,
      tools: record.tools,
    }));
  }

  async disposeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    for (const id of [...session.mounts.keys()]) await this.unmount(session, id);
    this.sessions.delete(sessionId);
  }

  forgetSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}
