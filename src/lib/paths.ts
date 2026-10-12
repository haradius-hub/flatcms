import path from "node:path";
import fs from "node:fs/promises";

export const ROOT = process.cwd();
export const CONTENT_DIR = path.join(ROOT, "content");
export const DATA_DIR = path.join(ROOT, "data");
export const PLUGINS_DIR = path.join(ROOT, "plugins");
export const UPLOADS_DIR = path.join(ROOT, "public", "uploads");

/**
 * Bezpečné složení cesty – zabraňuje path traversal (../../etc/passwd).
 */
export function safeJoin(base: string, relative: string): string {
  const cleaned = (relative || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
  const target = path.resolve(base, cleaned);
  const normalizedBase = path.resolve(base);
  if (target !== normalizedBase && !target.startsWith(normalizedBase + path.sep)) {
    throw new Error("Neplatná cesta (path traversal).");
  }
  return target;
}

export function cleanRelative(relative: string): string {
  return (relative || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

export async function ensureCmsDirs(): Promise<void> {
  await Promise.all([
    ensureDir(CONTENT_DIR),
    ensureDir(DATA_DIR),
    ensureDir(PLUGINS_DIR),
    ensureDir(UPLOADS_DIR),
  ]);
}
