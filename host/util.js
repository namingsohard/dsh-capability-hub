import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const DSH_HOME = process.env.DSH_HOME?.trim() || path.join(os.homedir(), '.dsh');
export const CAPABILITIES_DIR = path.join(DSH_HOME, 'capabilities');
export const SKILLS_DIR = path.join(DSH_HOME, 'skills');
export const TRASH_DIR = path.join(CAPABILITIES_DIR, 'trash');

/**
 * The API level the host implements. The client carries the same number and
 * says so when they differ.
 *
 * This exists because the client bundle is reloaded with the page while the
 * host only changes on a DSH restart (a `link:`ed plugin is not composed by
 * HMR). Without this check the symptom is `Unknown action "saveCatalog"` in a
 * dialog that looks like a plugin bug.
 */
export const HOST_API = 3;

const SESSION_DIR = path.join(CAPABILITIES_DIR, 'sessions');
const LIBRARY_FILE = path.join(CAPABILITIES_DIR, 'library.json');

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizePathKey(value) {
  if (typeof value !== 'string' || value.length === 0) return '';
  const resolved = path.resolve(value);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

export function sanitizeServerName(value) {
  const base = String(value ?? '')
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return base || 'mcp';
}

export function estimateTokens(text) {
  if (typeof text !== 'string' || text.length === 0) return 0;
  return Math.max(1, Math.ceil(text.length / 4));
}

export function isPathInside(parent, child) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

export async function ensureDirectories() {
  await Promise.all([
    fs.mkdir(CAPABILITIES_DIR, { recursive: true }),
    fs.mkdir(SKILLS_DIR, { recursive: true }),
    fs.mkdir(SESSION_DIR, { recursive: true }),
    fs.mkdir(TRASH_DIR, { recursive: true }),
  ]);
}

export async function readJson(file, fallback) {
  try {
    const text = await fs.readFile(file, 'utf8');
    return JSON.parse(text);
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  try {
    await fs.rename(temp, file);
  } catch (error) {
    if (process.platform !== 'win32') throw error;
    await fs.rm(file, { force: true });
    await fs.rename(temp, file);
  }
}

export function libraryPath() {
  return LIBRARY_FILE;
}

/** Where a library written by an older schema is backed up before migration. */
export function libraryBackupPath(version) {
  return path.join(CAPABILITIES_DIR, `library.v${version}.backup.json`);
}

export function sessionPath(sessionId) {
  const safe = encodeURIComponent(String(sessionId)).replaceAll('%', '_');
  return path.join(SESSION_DIR, `${safe}.json`);
}

export async function moveToTrash(target, label) {
  await fs.mkdir(TRASH_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const destination = path.join(TRASH_DIR, `${stamp}-${label}`);
  await fs.rename(target, destination);
  return destination;
}
