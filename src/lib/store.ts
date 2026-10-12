import fs from "node:fs/promises";
import path from "node:path";
import { DATA_DIR, ensureDir, exists } from "./paths";

/** Generický JSON storage nad data/ složkou. */
export async function readJson<T>(fileName: string, fallback: T): Promise<T> {
  await ensureDir(DATA_DIR);
  const file = path.join(DATA_DIR, fileName);
  if (!(await exists(file))) {
    await writeJson(fileName, fallback);
    return fallback;
  }
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson<T>(fileName: string, value: T): Promise<void> {
  await ensureDir(DATA_DIR);
  const file = path.join(DATA_DIR, fileName);
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(value, null, 2), "utf8");
  await fs.rename(tmp, file);
}
