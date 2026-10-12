/**
 * FlatCMS – typové definice
 *
 * Licence: GPLv3
 */

export type UserRole = "administrator" | "editor" | "author";

export type ArticleStatus = "published" | "draft" | "scheduled" | "static";

export type EditorType = "wysiwyg" | "block" | "markdown" | "html";

export interface User {
  id: string;
  username: string;
  /** scrypt hash ve tvaru salt:hash */
  passwordHash: string;
  displayName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  preferredEditor: EditorType;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface Article {
  path: string;
  slug: string;
  title: string;
  description: string;
  authorId: string;
  status: ArticleStatus;
  date: string;
  modified?: string;
  tags: string[];
  category?: string;
  order: number;
  editor: EditorType;
  coverImage?: string;
  customHtml?: string;
  noIndex?: boolean;
  content: string;
}

export type ArticleMeta = Omit<Article, "content">;

export interface ContentNode {
  name: string;
  path: string;
  type: "folder" | "article";
  article?: ArticleMeta;
  children: ContentNode[];
}

export interface Settings {
  siteTitle: string;
  siteSlogan: string;
  siteDescription: string;
  language: string;
  itemsPerPage: number;
  defaultEditor: EditorType;
  footerText: string;
  homepagePath: string;
  theme: "light" | "dark" | "system";
}

/* ============================================================ */
/* Plugin systém                                                */
/* ============================================================ */

/**
 * Seznam všech dostupných hooků.
 *
 * Kategorie:
 *  1. Obsah (párové before/after)
 *  2. Uživatelé
 *  3. Přihlášení
 *  4. Média
 *  5. Systém (nastavení)
 *  6. Rendering (výstup do HTML)
 *  7. Collect (pluginy vrací data – menu, toolbary, nastavení)
 */
export type PluginHookName =
  /* --- 1. Obsah --- */
  | "beforePageSave"
  | "afterPageSave"
  | "beforePageDelete"
  | "afterPageDelete"
  | "beforePageMove"
  | "afterPageMove"
  | "beforePageRender"
  | "afterPageRender"
  /* --- 2. Uživatelé --- */
  | "beforeUserCreate"
  | "afterUserCreate"
  | "beforeUserDelete"
  | "afterUserDelete"
  /* --- 3. Přihlášení --- */
  | "beforeLogin"
  | "afterLogin"
  | "afterLoginFailed"
  /* --- 4. Média --- */
  | "beforeFileUpload"
  | "afterFileUpload"
  | "beforeMediaDelete"
  | "afterMediaDelete"
  | "beforeFolderCreate"
  | "afterFolderCreate"
  /* --- 5. Systém --- */
  | "onSettingsLoad"
  | "onSettingsSave"
  /* --- 6. Rendering (výstup do HTML) --- */
  | "adminHeaderRender"
  | "adminFooterRender"
  | "siteHeadRender"
  | "siteFooterRender";

/**
 * Collect hooky – pluginy vracejí strukturovaná data.
 * Používají se pro rozšíření UI (menu, toolbar, nastavení).
 */
export type PluginCollectHookName =
  | "registerAdminMenu"
  | "registerEditorToolbar"
  | "registerSettings";

export interface PluginContext {
  settings: Settings;
  config: Record<string, string>;
  user?: PublicUser | null;
}

export interface PluginHookPayload {
  article?: Article;
  html?: string;
  fileName?: string;
  path?: string;
  extra?: Record<string, unknown>;
}

/* ---------------- Collect hooky (typy návratových hodnot) ---------------- */

export interface AdminMenuItem {
  href: string;
  label: string;
  icon?: string;
  position?: number;
}

export interface EditorToolbarItem {
  id: string;
  label: string;
  icon?: string;
  /** Akce volaná v prohlížeči (string, který se přenese do klienta). */
  action: string;
  position?: number;
}

export interface SettingsSection {
  id: string;
  title: string;
  description?: string;
  /** Klíče konfigurace, které plugin očekává. */
  fields: {
    key: string;
    label: string;
    type: "text" | "textarea" | "number" | "boolean";
    default?: string;
  }[];
}

/* ---------------- Typy funkcí ---------------- */

export type PluginHook = (
  payload: PluginHookPayload,
  ctx: PluginContext,
) => Promise<PluginHookPayload | void> | PluginHookPayload | void;

export type PluginCollectHook<T = unknown> = (
  payload: PluginHookPayload,
  ctx: PluginContext,
) => Promise<T | void> | T | void;

/* ---------------- Manifest a modul ---------------- */

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  /** Nižší číslo = dřívější spuštění. Výchozí 100. */
  priority?: number;
  /** Maximální čas na jeden hook v ms. Výchozí 5000. */
  timeout?: number;
  /** Seznam hooků, které plugin používá (informativní). */
  hooks?: PluginHookName[];
  /** Konfigurační pole pro administraci. */
  configFields?: { key: string; label: string; type: "text" | "textarea"; default?: string }[];
}

export interface PluginModule extends PluginManifest {
  hooks: Partial<Record<PluginHookName, PluginHook>> &
    Partial<Record<PluginCollectHookName, PluginCollectHook>>;
}

export interface PluginState {
  enabled: boolean;
  config: Record<string, string>;
}

export interface PluginRegistryFile {
  [pluginId: string]: PluginState;
}

export interface LoadedPlugin {
  manifest: PluginManifest;
  module: PluginModule | null;
  state: PluginState;
  error?: string;
}

/* ---------------- Média ---------------- */

export interface MediaEntry {
  name: string;
  path: string;
  type: "folder" | "file";
  size: number;
  modified: string;
  url?: string;
  kind?: "image" | "video" | "document" | "html" | "other";
}
