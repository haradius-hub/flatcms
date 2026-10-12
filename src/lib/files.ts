import fs from "node:fs/promises";
import path from "node:path";
import type { MediaEntry, PublicUser } from "./types";
import { UPLOADS_DIR, cleanRelative, ensureDir, exists, safeJoin } from "./paths";
import { canUseFiles, assert } from "./permissions";
import { slugify } from "./slug";

const IMAGE = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif", "bmp", "ico"];
const VIDEO = ["mp4", "webm", "ogg", "mov", "avi", "mkv"];
const DOC = ["pdf", "doc", "docx", "xls", "xlsx", "txt", "md", "csv", "zip", "odt"];
const HTMLF = ["html", "htm"];
const BLOCKED = ["php", "phtml", "exe", "sh", "bat", "cmd", "jsp", "asp", "aspx"];

export function kindOf(name: string): MediaEntry["kind"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE.includes(ext)) return "image";
  if (VIDEO.includes(ext)) return "video";
  if (HTMLF.includes(ext)) return "html";
  if (DOC.includes(ext)) return "document";
  return "other";
}

export function sanitizeFileName(name: string): string {
  const base = path.basename(name);
  const ext = (base.split(".").pop() ?? "").toLowerCase();
  const stem = base.includes(".") ? base.slice(0, base.lastIndexOf(".")) : base;
  if (BLOCKED.includes(ext)) throw new Error(`Přípona .${ext} není povolena.`);
  const safeStem = slugify(stem) || "soubor";
  return ext ? `${safeStem}.${ext.replace(/[^a-z0-9]/g, "")}` : safeStem;
}

export async function listMedia(relDir: string, user: PublicUser | null): Promise<MediaEntry[]> {
  assert(canUseFiles(user, "read"));
  const clean = cleanRelative(relDir);
  const dir = safeJoin(UPLOADS_DIR, clean);
  await ensureDir(dir);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out: MediaEntry[] = [];
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    const stat = await fs.stat(full);
    const rel = clean ? `${clean}/${e.name}` : e.name;
    out.push({
      name: e.name,
      path: rel,
      type: e.isDirectory() ? "folder" : "file",
      size: stat.size,
      modified: stat.mtime.toISOString(),
      url: e.isDirectory() ? undefined : `/uploads/${rel}`,
      kind: e.isDirectory() ? undefined : kindOf(e.name),
    });
  }
  return out.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "cs");
  });
}

export async function createMediaFolder(relDir: string, name: string, user: PublicUser | null): Promise<void> {
  assert(canUseFiles(user, "write"));
  const folder = slugify(name);
  if (!folder) throw new Error("Neplatný název složky.");
  const target = safeJoin(UPLOADS_DIR, path.posix.join(cleanRelative(relDir), folder));
  await ensureDir(target);
}

export async function saveUpload(
  relDir: string,
  fileName: string,
  data: Buffer,
  user: PublicUser | null,
): Promise<MediaEntry> {
  assert(canUseFiles(user, "write"));
  const clean = cleanRelative(relDir);
  const dir = safeJoin(UPLOADS_DIR, clean);
  await ensureDir(dir);
  let safeName = sanitizeFileName(fileName);
  let target = path.join(dir, safeName);
  let i = 1;
  while (await exists(target)) {
    const dot = safeName.lastIndexOf(".");
    const stem = dot > 0 ? safeName.slice(0, dot) : safeName;
    const ext = dot > 0 ? safeName.slice(dot) : "";
    const candidate = `${stem}-${i}${ext}`;
    target = path.join(dir, candidate);
    if (!(await exists(target))) {
      safeName = candidate;
      break;
    }
    i += 1;
  }
  await fs.writeFile(target, data);
  const stat = await fs.stat(target);
  const rel = clean ? `${clean}/${safeName}` : safeName;
  return {
    name: safeName,
    path: rel,
    type: "file",
    size: stat.size,
    modified: stat.mtime.toISOString(),
    url: `/uploads/${rel}`,
    kind: kindOf(safeName),
  };
}

export async function deleteMedia(rel: string, user: PublicUser | null): Promise<void> {
  assert(canUseFiles(user, "delete"));
  const target = safeJoin(UPLOADS_DIR, cleanRelative(rel));
  if (target === path.resolve(UPLOADS_DIR)) throw new Error("Kořenovou složku nelze smazat.");
  await fs.rm(target, { recursive: true, force: true });
}

export async function renameMedia(rel: string, newName: string, user: PublicUser | null): Promise<void> {
  assert(canUseFiles(user, "write"));
  const source = safeJoin(UPLOADS_DIR, cleanRelative(rel));
  const dir = path.dirname(source);
  const target = path.join(dir, sanitizeFileName(newName));
  await fs.rename(source, target);
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
