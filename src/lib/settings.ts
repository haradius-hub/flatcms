import type { Settings } from "./types";
import { readJson, writeJson } from "./store";

export const DEFAULT_SETTINGS: Settings = {
  siteTitle: "FlatCMS",
  siteSlogan: "Moderní flat-file CMS bez databáze",
  siteDescription:
    "Publikační systém postavený na Next.js, který ukládá obsah do Markdown souborů s YAML frontmatter.",
  language: "cs",
  itemsPerPage: 6,
  defaultEditor: "markdown",
  footerText: "© FlatCMS – uvolněno pod licencí GPLv3.",
  homepagePath: "",
  theme: "light",
};

export async function getSettings(): Promise<Settings> {
  const s = await readJson<Settings>("settings.json", DEFAULT_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...s };
}

export async function saveSettings(partial: Partial<Settings>): Promise<Settings> {
  const current = await getSettings();
  const next = { ...current, ...partial };
  await writeJson("settings.json", next);
  return next;
}
