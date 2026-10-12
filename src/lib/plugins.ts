/**
 * FlatCMS – plugin manager (rozšířená verze)
 *
 * Nově podporuje:
 *  - priority (nižší číslo = dřívější spuštění, výchozí 100)
 *  - timeout (max ms na hook, výchozí 5000)
 *  - izolace chyb (chyba jednoho pluginu nezastaví ostatní)
 *  - collect hooky (pluginy vrací strukturovaná data – menu, toolbar, nastavení)
 *
 * Licence: GPLv3
 */

import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { PLUGINS_DIR, ensureDir, exists } from "./paths";
import { readJson, writeJson } from "./store";
import { getSettings } from "./settings";
import type {
  AdminMenuItem,
  EditorToolbarItem,
  LoadedPlugin,
  PluginCollectHookName,
  PluginContext,
  PluginHookName,
  PluginHookPayload,
  PluginManifest,
  PluginModule,
  PluginRegistryFile,
  PluginState,
  PublicUser,
  SettingsSection,
} from "./types";

const REGISTRY = "plugins.json";

const DEFAULT_PRIORITY = 100;
const DEFAULT_TIMEOUT = 5000;

/* ---------------- Dynamický import ---------------- */

const dynamicImport: (specifier: string) => Promise<unknown> = new Function(
  "specifier",
  "return import(specifier)",
) as (specifier: string) => Promise<unknown>;

/* ---------------- Registry ---------------- */

export async function getRegistry(): Promise<PluginRegistryFile> {
  return readJson<PluginRegistryFile>(REGISTRY, {});
}

export async function setPluginState(id: string, state: Partial<PluginState>): Promise<void> {
  const registry = await getRegistry();
  const current = registry[id] ?? { enabled: false, config: {} };
  registry[id] = { ...current, ...state, config: { ...current.config, ...(state.config ?? {}) } };
  await writeJson(REGISTRY, registry);
}

/* ---------------- Načítání pluginů ---------------- */

async function readManifest(dir: string, id: string): Promise<PluginManifest | null> {
  const file = path.join(dir, "plugin.json");
  if (!(await exists(file))) return null;
  try {
    const parsed = JSON.parse(await fs.readFile(file, "utf8")) as PluginManifest;
    return { ...parsed, id: parsed.id || id };
  } catch {
    return null;
  }
}

export async function loadPlugins(): Promise<LoadedPlugin[]> {
  await ensureDir(PLUGINS_DIR);
  const registry = await getRegistry();

  let dirs: import("node:fs").Dirent[] = [];
  try {
    dirs = await fs.readdir(PLUGINS_DIR, { withFileTypes: true });
  } catch {
    return [];
  }

  const plugins: LoadedPlugin[] = [];

  for (const entry of dirs) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;

    const dir = path.join(PLUGINS_DIR, entry.name);
    const manifest = await readManifest(dir, entry.name);
    if (!manifest) continue;

    const state: PluginState = registry[manifest.id] ?? { enabled: false, config: {} };

    // Výchozí hodnoty konfigurace
    for (const field of manifest.configFields ?? []) {
      if (state.config[field.key] === undefined) state.config[field.key] = field.default ?? "";
    }

    let mod: PluginModule | null = null;
    let error: string | undefined;

    if (state.enabled) {
      const entryFile = path.join(dir, "index.mjs");
      if (await exists(entryFile)) {
        try {
          const imported = (await dynamicImport(
            `${pathToFileURL(entryFile).href}?v=${Date.now()}`,
          )) as { default?: PluginModule };
          mod = imported.default ?? null;
        } catch (err) {
          error = err instanceof Error ? err.message : "Chyba načtení pluginu";
        }
      } else {
        error = "Chybí soubor index.mjs";
      }
    }

    plugins.push({ manifest, module: mod, state, error });
  }

  // Řadit podle priority (nižší = dřív)
  return plugins.sort((a, b) => {
    const pa = a.manifest.priority ?? DEFAULT_PRIORITY;
    const pb = b.manifest.priority ?? DEFAULT_PRIORITY;
    if (pa !== pb) return pa - pb;
    return a.manifest.name.localeCompare(b.manifest.name, "cs");
  });
}

/* ---------------- Pomocné funkce ---------------- */

/**
 * Spustí promise s timeoutem. Pokud promise nedoběhne včas,
 * vyhodí chybu.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[${label}] timeout po ${ms} ms`));
    }, ms);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Filtruje aktivní pluginy, které mají daný hook a jsou zapnuté.
 */
function activePluginsWithHook(
  plugins: LoadedPlugin[],
  hook: string,
): LoadedPlugin[] {
  return plugins.filter((p) => p.state.enabled && typeof p.module?.hooks?.[hook] === "function");
}

/* ---------------- Transform hooky ---------------- */

/**
 * Spustí transform hook napříč všemi aktivními pluginy.
 * Payload se řetězí – výstup jednoho je vstupem dalšího.
 *
 * Chyba jednoho pluginu nezastaví ostatní – zapíše se do konzole
 * a pokračuje se dalším pluginem.
 */
export async function runHook(
  hook: PluginHookName,
  payload: PluginHookPayload,
  user?: PublicUser | null,
): Promise<PluginHookPayload> {
  let current = payload;

  try {
    const plugins = await loadPlugins();
    const settings = await getSettings();
    const active = activePluginsWithHook(plugins, hook);

    for (const plugin of active) {
      const fn = plugin.module!.hooks[hook];
      if (typeof fn !== "function") continue;

      const ctx: PluginContext = {
        settings,
        config: plugin.state.config,
        user,
      };

      const timeout = plugin.manifest.timeout ?? DEFAULT_TIMEOUT;

      try {
        const result = await withTimeout(
          Promise.resolve(fn(current, ctx)),
          timeout,
          `plugin:${plugin.manifest.id}`,
        );

        if (result && typeof result === "object") {
          current = { ...current, ...result };
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[plugin:${plugin.manifest.id}] hook '${hook}' selhal:`,
          err instanceof Error ? err.message : err,
        );
        // Pokračujeme dalším pluginem
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[plugins] runHook('${hook}') – chyba v plugin manageru:`, err);
  }

  return current;
}

/* ---------------- Rendering (HTML) hooky ---------------- */

/**
 * Sesbírá HTML fragmenty od pluginů pro daný render hook.
 * Používá se pro adminHeaderRender, siteHeadRender, siteFooterRender.
 */
export async function collectHookHtml(
  hook: PluginHookName,
  user?: PublicUser | null,
): Promise<string[]> {
  const out: string[] = [];

  try {
    const plugins = await loadPlugins();
    const settings = await getSettings();
    const active = activePluginsWithHook(plugins, hook);

    for (const plugin of active) {
      const fn = plugin.module!.hooks[hook];
      if (typeof fn !== "function") continue;

      const ctx: PluginContext = { settings, config: plugin.state.config, user };
      const timeout = plugin.manifest.timeout ?? DEFAULT_TIMEOUT;

      try {
        const res = await withTimeout(
          Promise.resolve(fn({}, ctx)),
          timeout,
          `plugin:${plugin.manifest.id}`,
        );
        if (res && typeof res === "object" && "html" in res && typeof res.html === "string") {
          if (res.html.trim()) out.push(res.html);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[plugin:${plugin.manifest.id}] render hook '${hook}' selhal:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  } catch {
    /* ignore */
  }

  return out;
}

/* ---------------- Collect hooky ---------------- */

/**
 * Sesbírá strukturovaná data od pluginů (menu, toolbar, nastavení).
 * Vrací pole výsledků v pořadí podle priority pluginů.
 */
export async function collectHook<T = unknown>(
  hook: PluginCollectHookName,
  payload: PluginHookPayload,
  user?: PublicUser | null,
): Promise<T[]> {
  const results: T[] = [];

  try {
    const plugins = await loadPlugins();
    const settings = await getSettings();
    const active = activePluginsWithHook(plugins, hook);

    for (const plugin of active) {
      const fn = plugin.module!.hooks[hook];
      if (typeof fn !== "function") continue;

      const ctx: PluginContext = { settings, config: plugin.state.config, user };
      const timeout = plugin.manifest.timeout ?? DEFAULT_TIMEOUT;

      try {
        const res = await withTimeout(
          Promise.resolve(fn(payload, ctx)),
          timeout,
          `plugin:${plugin.manifest.id}`,
        );
        if (res !== undefined && res !== null) {
          results.push(res as T);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `[plugin:${plugin.manifest.id}] collect hook '${hook}' selhal:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  } catch {
    /* ignore */
  }

  return results;
}

/* ---------------- Specializované collect funkce ---------------- */

/**
 * Sesbírá položky admin menu od pluginů.
 * Vrací seřazený seznam podle pole `position` (nižší = výš).
 */
export async function collectAdminMenu(user: PublicUser): Promise<AdminMenuItem[]> {
  const items = await collectHook<AdminMenuItem | AdminMenuItem[]>("registerAdminMenu", {}, user);

  const flat: AdminMenuItem[] = [];
  for (const it of items) {
    if (Array.isArray(it)) flat.push(...it);
    else flat.push(it);
  }

  return flat
    .filter((i) => i && typeof i.href === "string" && typeof i.label === "string")
    .sort((a, b) => (a.position ?? 100) - (b.position ?? 100));
}

/**
 * Sesbírá položky editor toolbaru.
 */
export async function collectEditorToolbar(
  user: PublicUser,
  editorType: string,
): Promise<EditorToolbarItem[]> {
  const items = await collectHook<EditorToolbarItem | EditorToolbarItem[]>(
    "registerEditorToolbar",
    { extra: { editorType } },
    user,
  );

  const flat: EditorToolbarItem[] = [];
  for (const it of items) {
    if (Array.isArray(it)) flat.push(...it);
    else flat.push(it);
  }

  return flat
    .filter((i) => i && typeof i.id === "string" && typeof i.label === "string")
    .sort((a, b) => (a.position ?? 100) - (b.position ?? 100));
}

/**
 * Sesbírá sekce nastavení od pluginů.
 */
export async function collectSettingsSections(user: PublicUser): Promise<SettingsSection[]> {
  const items = await collectHook<SettingsSection | SettingsSection[]>(
    "registerSettings",
    {},
    user,
  );

  const flat: SettingsSection[] = [];
  for (const it of items) {
    if (Array.isArray(it)) flat.push(...it);
    else flat.push(it);
  }

  return flat.filter((s) => s && typeof s.id === "string" && Array.isArray(s.fields));
}
