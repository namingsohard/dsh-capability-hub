import { registerCapabilityApi } from './host/api.js';
import { McpRuntime } from './host/mcp.js';
import { SessionRuntime } from './host/session.js';
import { CapabilityStore } from './host/store.js';

export const inject = [
  'agents',
  'skills',
  'tools',
  'systemPrompt',
  'workingDirectory',
  'loader',
  'connection',
];

export async function apply(ctx) {
  const store = new CapabilityStore(ctx);
  await store.init();
  if (store.migration) {
    ctx.logger?.info?.(
      `capability-hub: migrated library v${store.migration.from} → v${store.migration.to}` +
        (store.migration.backup ? ` (backup: ${store.migration.backup})` : ''),
    );
  }

  const mcp = new McpRuntime(ctx);
  const sessions = new SessionRuntime(ctx, store, mcp, ctx.skills);

  const onCreated = async ({ agent }) => {
    if (sessions.sessions.has(agent.id)) return;
    try {
      await sessions.onCreated(agent);
    } catch (error) {
      ctx.logger?.warn?.(`capability-hub: failed to initialize session ${agent.id}: ${String(error)}`);
    }
  };

  const onDisposed = ({ agent }) => {
    sessions.onDisposed(agent.id);
  };

  ctx.effect(
    () => ctx.on('agent/created', onCreated),
    'capability-hub: agent/created',
  );
  ctx.effect(
    () => ctx.on('agent/disposed', onDisposed),
    'capability-hub: agent/disposed',
  );

  registerCapabilityApi(ctx, { store, mcp, sessions });

  // The plugin can be enabled while sessions are already live. Adopt them
  // without waiting for a new creation event.
  for (const agent of ctx.agents.list()) {
    if (!sessions.sessions.has(agent.id)) {
      try {
        await sessions.onCreated(agent);
      } catch (error) {
        ctx.logger?.warn?.(`capability-hub: failed to adopt session ${agent.id}: ${String(error)}`);
      }
    }
  }

  ctx.effect(
    () => async () => {
      for (const [sessionId, record] of [...sessions.sessions]) {
        try {
          record.policyDispose?.();
          for (const fiber of record.providerFibers.values()) {
            await Promise.resolve(fiber?.dispose?.()).catch(() => {});
          }
          record.providerFibers.clear();
          await mcp.disposeSession(sessionId);
        } catch {
          // Best effort: the Agent scope remains the ultimate owner.
        }
      }
      sessions.sessions.clear();
    },
    'capability-hub: teardown',
  );
}
