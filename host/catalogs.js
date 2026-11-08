/**
 * Capability directories (能力目录).
 *
 * A directory is a user-owned grouping of *installed* capabilities — a scene
 * ("浏览器", "长期记忆"), not a capability set. It never changes what a Session
 * runs: it is how the library is browsed and how a preset is ticked out.
 *
 * A capability may belong to several directories (the user asked for that):
 * the same seat can be useful in two scenes. Toggling it in one place toggles
 * the same Session selection everywhere, because membership is only a view.
 * Within one directory a capability appears at most once.
 *
 * Members are `{ kind, id }` with `kind ∈ mcp | skill | provider`. A member
 * whose capability disappeared stays in the directory and resolves to
 * `present: false`, exactly like a preset reference: the gap stays visible
 * instead of the directory silently shrinking.
 */

export const CATALOG_KINDS = ['mcp', 'skill', 'provider'];
const KIND_SET = new Set(CATALOG_KINDS);

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

/** The stable identity of one member slot. */
export function memberKey(member) {
  return `${member.kind}:${member.id}`;
}

/** Drop unknown kinds, empty ids and duplicates, keeping the first order. */
export function normalizeMembers(value) {
  const list = Array.isArray(value) ? value : [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const record = asRecord(item);
    const kind = asString(record.kind);
    const id = asString(record.id);
    if (!KIND_SET.has(kind) || id.length === 0) continue;
    const key = `${kind}:${id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ kind, id });
  }
  return result;
}

/**
 * Coerce one stored directory.
 * @returns The directory, or `undefined` when it has no usable identity.
 */
export function normalizeCatalog(raw) {
  const value = asRecord(raw);
  const id = asString(value.id);
  if (id.length === 0) return undefined;
  const name = asString(value.name).trim();
  return {
    id,
    name: name.length > 0 ? name : 'Directory',
    order: Number.isFinite(value.order) ? Number(value.order) : 0,
    members: normalizeMembers(value.members),
    createdAt: asString(value.createdAt),
    updatedAt: asString(value.updatedAt),
  };
}

export function cloneCatalog(catalog) {
  return { ...catalog, members: catalog.members.map((item) => ({ ...item })) };
}

/** Sort for display: explicit order first, then name. */
export function sortCatalogs(catalogs) {
  return [...catalogs].sort((left, right) => {
    if (left.order !== right.order) return left.order - right.order;
    return left.name.localeCompare(right.name);
  });
}

/**
 * Resolve one directory against the library.
 * @param library - `{ mcpById, skillNames, providerById }`.
 * @returns Per-kind groups in display order, with `present` per member and the
 *   catalog's totals.
 */
export function resolveCatalog(catalog, library = {}) {
  const mcpById = library.mcpById ?? new Map();
  const skillNames = library.skillNames instanceof Set ? library.skillNames : new Set();
  const providerById = library.providerById ?? new Map();

  const mcp = [];
  const skills = [];
  const providers = [];
  for (const member of catalog.members) {
    if (member.kind === 'mcp') {
      const definition = mcpById.get(member.id);
      mcp.push({
        kind: 'mcp',
        id: member.id,
        name: definition?.name ?? member.id,
        present: definition !== undefined,
        enabled: definition?.enabled !== false,
      });
    } else if (member.kind === 'skill') {
      skills.push({
        kind: 'skill',
        id: member.id,
        name: member.id,
        present: skillNames.has(member.id),
      });
    } else {
      const provider = providerById.get(member.id);
      providers.push({
        kind: 'provider',
        id: member.id,
        name: provider?.packageName ?? member.id,
        present: provider !== undefined,
        enabled: provider?.enabled !== false,
        mountAt: provider?.mountAt ?? null,
        verdict: provider?.verdict ?? null,
        issue: provider?.issue ?? null,
      });
    }
  }

  const groups = { mcp, skills, providers };
  const all = [...mcp, ...skills, ...providers];
  return {
    id: catalog.id,
    name: catalog.name,
    order: catalog.order,
    // The raw membership, so an editor can round-trip it without re-deriving
    // which capability was where.
    members: catalog.members.map((item) => ({ ...item })),
    ...groups,
    counts: {
      total: all.length,
      present: all.filter((item) => item.present).length,
      mcp: mcp.length,
      skills: skills.length,
      providers: providers.length,
    },
  };
}

/** Every directory resolved, in display order. */
export function resolveCatalogs(catalogs, library) {
  return sortCatalogs(catalogs).map((catalog) => resolveCatalog(catalog, library));
}

/**
 * The capabilities that are in no directory at all. Without this list a
 * capability could become unreachable from a directory-organised UI.
 */
export function unfiledCapabilities(catalogs, library = {}) {
  const mcpById = library.mcpById ?? new Map();
  const skillNames = library.skillNames instanceof Set ? library.skillNames : new Set();
  const providerById = library.providerById ?? new Map();
  const used = { mcp: new Set(), skill: new Set(), provider: new Set() };
  for (const catalog of catalogs) {
    for (const member of catalog.members) used[member.kind]?.add(member.id);
  }
  const mcp = [...mcpById.values()]
    .filter((definition) => !used.mcp.has(definition.id))
    .map((definition) => ({
      kind: 'mcp',
      id: definition.id,
      name: definition.name,
      present: true,
      enabled: definition.enabled !== false,
    }));
  const skills = [...skillNames]
    .filter((name) => !used.skill.has(name))
    .sort((left, right) => left.localeCompare(right))
    .map((name) => ({ kind: 'skill', id: name, name, present: true }));
  const providers = [...providerById.values()]
    .filter((provider) => !used.provider.has(provider.id))
    .map((provider) => ({
      kind: 'provider',
      id: provider.id,
      name: provider.packageName,
      present: true,
      enabled: provider.enabled !== false,
      mountAt: provider.mountAt ?? null,
      verdict: provider.verdict ?? null,
      issue: provider.issue ?? null,
    }));
  return {
    mcp,
    skills,
    providers,
    counts: {
      mcp: mcp.length,
      skills: skills.length,
      providers: providers.length,
      total: mcp.length + skills.length + providers.length,
    },
  };
}
