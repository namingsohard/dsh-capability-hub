import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { SKILLS_DIR, estimateTokens, isPathInside, moveToTrash, nowIso } from './util.js';

const IMPORT_ROOTS = [
  { id: 'codex', label: 'Codex', root: path.join(os.homedir(), '.codex', 'skills') },
  { id: 'claude', label: 'Claude Code', root: path.join(os.homedir(), '.claude', 'skills') },
  { id: 'agents', label: 'Agents', root: path.join(os.homedir(), '.agents', 'skills') },
];

const NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function unquote(value) {
  const text = value.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1);
  }
  return text;
}

function parseBoolean(value, fallback) {
  const text = String(value ?? '').trim().toLowerCase();
  if (['true', 'yes', 'on', '1'].includes(text)) return true;
  if (['false', 'no', 'off', '0'].includes(text)) return false;
  return fallback;
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};
  const lines = match[1].split(/\r?\n/);
  const result = {};
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '' || line.trimStart().startsWith('#')) continue;
    const keyMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;
    const key = keyMatch[1];
    let value = keyMatch[2].trim();
    if (value === '|' || value === '>' || value === '|-' || value === '>-') {
      const block = [];
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        block.push(lines[index + 1].replace(/^\s{1,2}/, ''));
        index += 1;
      }
      value = block.join(value.startsWith('|') ? '\n' : ' ');
    } else {
      value = unquote(value);
    }
    result[key] = value;
  }
  return result;
}

function invocationOf(frontmatter) {
  const modelInvocable = !parseBoolean(frontmatter['disable-model-invocation'], false);
  const userInvocable = parseBoolean(frontmatter['user-invocable'], true);
  return { modelInvocable, userInvocable };
}

function stateOf(invocation) {
  if (!invocation.modelInvocable && !invocation.userInvocable) return 'off';
  if (!invocation.modelInvocable && invocation.userInvocable) return 'manual';
  return 'auto';
}

async function readSkill(entryPath, source, root) {
  const stat = await fs.stat(entryPath);
  const isDirectory = stat.isDirectory();
  const file = isDirectory ? path.join(entryPath, 'SKILL.md') : entryPath;
  let content;
  try {
    content = await fs.readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
  const frontmatter = parseFrontmatter(content);
  const fallbackName = path.basename(isDirectory ? entryPath : entryPath, isDirectory ? '' : '.md');
  const name = String(frontmatter.name ?? fallbackName).trim();
  const description = String(frontmatter.description ?? '').trim();
  if (!name || !description) return null;
  const invocation = invocationOf(frontmatter);
  return {
    name,
    description,
    whenToUse: typeof frontmatter.whenToUse === 'string' ? frontmatter.whenToUse : undefined,
    invocation,
    state: stateOf(invocation),
    source,
    root,
    path: file,
    sourcePath: isDirectory ? entryPath : file,
    kind: isDirectory ? 'directory' : 'file',
    bytes: Buffer.byteLength(content),
    tokens: estimateTokens(content),
    updatedAt: nowIso(),
    validName: NAME_PATTERN.test(name),
  };
}

async function scanRoot(root, source) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const skills = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      const skill = await readSkill(full, source, root);
      if (skill) skills.push(skill);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      const skill = await readSkill(full, source, root);
      if (skill) skills.push(skill);
    }
  }
  return skills;
}

export function skillRoots(cwd) {
  const roots = [{ source: 'user', root: SKILLS_DIR }];
  if (typeof cwd === 'string' && cwd.length > 0) {
    roots.push({ source: 'project', root: path.join(cwd, '.dsh', 'skills') });
  }
  return roots;
}

export async function scanSkills(cwd) {
  const skills = [];
  for (const { source, root } of skillRoots(cwd)) {
    const found = await scanRoot(root, source);
    for (const skill of found) skills.push(skill);
  }
  const seen = new Set();
  return skills
    .filter((skill) => {
      const key = `${skill.source}:${skill.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * Every Skill the harness can see — bundled/native ones included.
 *
 * The harness `skills` service is the authority: it aggregates the two managed
 * directories, the bundled Office/skill providers and plugin-provided Skills.
 * `scanSkills` alone sees only the managed roots, which is why a bundled Skill
 * used to read as "not installed" in Settings while the Session panel (reading
 * the same service) listed and could toggle it.
 *
 * `removable` marks what this plugin may physically delete: only a Skill whose
 * file lives in one of the two managed roots. Everything else is visible and
 * togglable for a preset, never deletable.
 *
 * @param ctx - the host context, for `skills`; omitted or service-less hosts
 *   fall back to the filesystem scan.
 */
export async function listInstalledSkills(ctx, cwd) {
  const managed = await scanSkills(cwd);
  const byName = new Map(
    managed.map((skill) => [skill.name, { ...skill, removable: true, builtin: false }]),
  );

  const service = ctx?.get?.('skills') ?? ctx?.skills;
  if (typeof service?.list === 'function') {
    let rows = [];
    try {
      rows = await service.list({ cwd });
    } catch {
      rows = [];
    }
    for (const row of Array.isArray(rows) ? rows : []) {
      if (row === null || typeof row !== 'object' || typeof row.name !== 'string') continue;
      const existing = byName.get(row.name);
      const invocation =
        row.invocation ?? existing?.invocation ?? { modelInvocable: true, userInvocable: true };
      const description = row.description ?? existing?.description ?? '';
      byName.set(row.name, {
        ...(existing ?? {}),
        name: row.name,
        description,
        ...(row.whenToUse === undefined && existing?.whenToUse === undefined
          ? {}
          : { whenToUse: row.whenToUse ?? existing?.whenToUse }),
        invocation,
        state: stateOf(invocation),
        source: row.source ?? existing?.source ?? 'bundled',
        provider: row.provider,
        path: row.path ?? existing?.path,
        tokens: existing?.tokens ?? estimateTokens(`${row.name}${description}`),
        // Only a file inside a managed root can be removed by this plugin.
        removable: existing !== undefined,
        builtin: existing === undefined,
      });
    }
  }

  return [...byName.values()].sort((left, right) => left.name.localeCompare(right.name));
}

export async function scanImportSources(cwd) {
  const installed = new Set((await scanRoot(SKILLS_DIR, 'user')).map((skill) => skill.name));
  const groups = [];
  for (const item of IMPORT_ROOTS) {
    const entries = await scanRoot(item.root, item.id);
    groups.push({
      id: item.id,
      label: item.label,
      root: item.root,
      entries: entries.map((entry) => ({
        ...entry,
        installed: installed.has(entry.name),
      })),
    });
  }
  return groups;
}

function sourceRootFor(source) {
  const item = IMPORT_ROOTS.find((entry) => entry.id === source);
  if (!item) throw new Error(`Unknown import source "${source}".`);
  return item.root;
}

export async function importSkills(items, { replace = false } = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Select at least one skill to import.');
  const results = [];
  for (const item of items) {
    const source = String(item?.source ?? '');
    const name = String(item?.name ?? '');
    if (!NAME_PATTERN.test(name)) {
      results.push({ name, ok: false, error: 'Invalid skill name.' });
      continue;
    }
    const root = sourceRootFor(source);
    const candidatePath = item?.sourcePath;
    if (typeof candidatePath !== 'string' || !isPathInside(root, candidatePath)) {
      results.push({ name, ok: false, error: 'Source is outside the import root.' });
      continue;
    }
    const skill = await readSkill(candidatePath, source, root);
    if (!skill) {
      results.push({ name, ok: false, error: 'SKILL.md is missing name or description.' });
      continue;
    }
    const target = skill.kind === 'directory' ? path.join(SKILLS_DIR, name) : path.join(SKILLS_DIR, `${name}.md`);
    try {
      await fs.mkdir(SKILLS_DIR, { recursive: true });
      if (!replace) {
        try {
          await fs.access(target);
          results.push({ name, ok: false, error: 'A skill with this name already exists.' });
          continue;
        } catch (error) {
          if (error?.code !== 'ENOENT') throw error;
        }
      } else {
        await fs.rm(target, { recursive: true, force: true });
      }
      if (skill.kind === 'directory') {
        await fs.cp(skill.sourcePath, target, { recursive: true, force: true, dereference: true });
      } else {
        await fs.copyFile(skill.sourcePath, target);
      }
      results.push({ name, ok: true, target });
    } catch (error) {
      results.push({ name, ok: false, error: String(error?.message ?? error) });
    }
  }
  return results;
}

export async function deleteSkill({ name, source, cwd }) {
  if (!NAME_PATTERN.test(name)) throw new Error('Invalid skill name.');
  const root =
    source === 'project' && typeof cwd === 'string'
      ? path.join(cwd, '.dsh', 'skills')
      : SKILLS_DIR;
  const candidates = [path.join(root, name), path.join(root, `${name}.md`)];
  for (const candidate of candidates) {
    if (!isPathInside(root, candidate)) continue;
    try {
      await fs.access(candidate);
      return moveToTrash(candidate, `${source ?? 'user'}-${name}`);
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  throw new Error('Skill not found in a managed root.');
}
