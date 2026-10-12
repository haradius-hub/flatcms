import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import type { Article, ArticleMeta, ArticleStatus, ContentNode, EditorType } from "./types";
import { CONTENT_DIR, cleanRelative, ensureDir, exists, safeJoin } from "./paths";
import { slugifyPath } from "./slug";

const MD_EXT = ".md";

function toMeta(relPath: string, data: Record<string, unknown>): ArticleMeta {
  const slug = relPath.split("/").pop() ?? relPath;
  const tagsRaw = data.tags;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.map(String)
    : typeof tagsRaw === "string"
      ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
  return {
    path: relPath,
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    description: typeof data.description === "string" ? data.description : "",
    authorId: typeof data.authorId === "string" ? data.authorId : "admin",
    status: (typeof data.status === "string" ? data.status : "published") as ArticleStatus,
    date: typeof data.date === "string" ? data.date : new Date().toISOString(),
    modified: typeof data.modified === "string" ? data.modified : undefined,
    tags,
    category: typeof data.category === "string" ? data.category : relPath.split("/").slice(0, -1).join("/"),
    order: typeof data.order === "number" ? data.order : Number(data.order ?? 0) || 0,
    editor: (typeof data.editor === "string" ? data.editor : "markdown") as EditorType,
    coverImage: typeof data.coverImage === "string" ? data.coverImage : undefined,
    customHtml: typeof data.customHtml === "string" ? data.customHtml : undefined,
    noIndex: Boolean(data.noIndex),
  };
}

/** Rekurzivně projde content/ a vrátí všechny .md soubory jako relativní cesty bez přípony. */
export async function listArticlePaths(dir = CONTENT_DIR, prefix = ""): Promise<string[]> {
  await ensureDir(CONTENT_DIR);
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await listArticlePaths(path.join(dir, entry.name), rel)));
    } else if (entry.name.endsWith(MD_EXT)) {
      out.push(rel.slice(0, -MD_EXT.length));
    }
  }
  return out;
}

export async function readArticle(relPath: string): Promise<Article | null> {
  const clean = cleanRelative(relPath);
  if (!clean) return null;
  let file = safeJoin(CONTENT_DIR, `${clean}${MD_EXT}`);
  if (!(await exists(file))) {
    // podpora složkových stránek: blog/index.md
    file = safeJoin(CONTENT_DIR, `${clean}/index${MD_EXT}`);
    if (!(await exists(file))) return null;
  }
  const raw = await fs.readFile(file, "utf8");
  const parsed = matter(raw);
  const usedRel = path.relative(CONTENT_DIR, file).replace(/\\/g, "/").slice(0, -MD_EXT.length);
  return { ...toMeta(usedRel, parsed.data as Record<string, unknown>), content: parsed.content.trim() };
}

export async function getAllArticles(): Promise<ArticleMeta[]> {
  const paths = await listArticlePaths();
  const metas: ArticleMeta[] = [];
  for (const p of paths) {
    const art = await readArticle(p);
    if (art) {
      const { content: _content, ...meta } = art;
      void _content;
      metas.push(meta);
    }
  }
  return metas.sort((a, b) => (b.order - a.order) || (b.date.localeCompare(a.date)));
}

export async function getPublishedArticles(): Promise<ArticleMeta[]> {
  const all = await getAllArticles();
  const now = Date.now();
  return all.filter(
    (a) => a.status === "published" && new Date(a.date).getTime() <= now,
  );
}

export interface SaveArticleInput extends Omit<Article, "slug"> {
  /** původní cesta při přejmenování */
  originalPath?: string;
}

export async function saveArticle(input: SaveArticleInput): Promise<Article> {
  const targetRel = slugifyPath(input.path);
  if (!targetRel) throw new Error("Chybí cesta článku.");
  const file = safeJoin(CONTENT_DIR, `${targetRel}${MD_EXT}`);
  await ensureDir(path.dirname(file));

  const frontmatter = {
    title: input.title,
    description: input.description ?? "",
    authorId: input.authorId,
    status: input.status,
    date: input.date,
    modified: new Date().toISOString(),
    tags: input.tags ?? [],
    category: targetRel.split("/").slice(0, -1).join("/"),
    order: input.order ?? 0,
    editor: input.editor,
    coverImage: input.coverImage ?? "",
    customHtml: input.customHtml ?? "",
    noIndex: Boolean(input.noIndex),
  };

  const output = matter.stringify(`${input.content ?? ""}\n`, frontmatter);
  await fs.writeFile(file, output, "utf8");

  const original = input.originalPath ? cleanRelative(input.originalPath) : "";
  if (original && original !== targetRel) {
    const oldFile = safeJoin(CONTENT_DIR, `${original}${MD_EXT}`);
    if (await exists(oldFile)) await fs.rm(oldFile);
  }

  const saved = await readArticle(targetRel);
  if (!saved) throw new Error("Článek se nepodařilo načíst po uložení.");
  return saved;
}

export async function deleteArticle(relPath: string): Promise<void> {
  const clean = cleanRelative(relPath);
  const file = safeJoin(CONTENT_DIR, `${clean}${MD_EXT}`);
  if (await exists(file)) await fs.rm(file);
}

export async function createFolder(relPath: string): Promise<void> {
  const clean = slugifyPath(relPath);
  if (!clean) throw new Error("Neplatný název složky.");
  await ensureDir(safeJoin(CONTENT_DIR, clean));
}

export async function deleteFolder(relPath: string): Promise<void> {
  const clean = cleanRelative(relPath);
  if (!clean) throw new Error("Neplatná složka.");
  await fs.rm(safeJoin(CONTENT_DIR, clean), { recursive: true, force: true });
}

/** Vrátí neomezeně vnořený strom obsahu. */
export async function getContentTree(dir = CONTENT_DIR, prefix = ""): Promise<ContentNode[]> {
  await ensureDir(CONTENT_DIR);
  let entries: import("node:fs").Dirent[] = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const nodes: ContentNode[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      nodes.push({
        name: entry.name,
        path: rel,
        type: "folder",
        children: await getContentTree(path.join(dir, entry.name), rel),
      });
    } else if (entry.name.endsWith(MD_EXT)) {
      const relNoExt = rel.slice(0, -MD_EXT.length);
      const art = await readArticle(relNoExt);
      if (!art) continue;
      const { content: _c, ...meta } = art;
      void _c;
      nodes.push({ name: entry.name, path: relNoExt, type: "article", article: meta, children: [] });
    }
  }
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name, "cs");
  });
}

export async function listFolders(): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string, prefix: string) => {
    let entries: import("node:fs").Dirent[] = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      if (!e.isDirectory() || e.name.startsWith(".")) continue;
      const rel = prefix ? `${prefix}/${e.name}` : e.name;
      out.push(rel);
      await walk(path.join(dir, e.name), rel);
    }
  };
  await ensureDir(CONTENT_DIR);
  await walk(CONTENT_DIR, "");
  return out.sort();
}
