"use server";

/**
 * Server Actions pro FlatCMS.
 *
 * Nově volá rozšířené hooky:
 *  - Obsah: beforePageDelete, afterPageDelete
 *  - Uživatelé: beforeUserCreate, afterUserCreate, beforeUserDelete, afterUserDelete
 *  - Přihlášení: beforeLogin, afterLogin, afterLoginFailed
 *  - Média: beforeMediaDelete, afterMediaDelete, beforeFolderCreate, afterFolderCreate
 *  - Systém: onSettingsSave
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getCurrentUser, login, logout } from "@/lib/auth";
import { can, canDeleteArticle, canEditArticle } from "@/lib/permissions";
import {
  createFolder,
  deleteArticle,
  deleteFolder,
  readArticle,
  saveArticle,
} from "@/lib/content";
import { createMediaFolder, deleteMedia, renameMedia } from "@/lib/files";
import { runHook, setPluginState } from "@/lib/plugins";
import { saveSettings } from "@/lib/settings";
import { createUser, deleteUser, updateUser } from "@/lib/users";
import { slugifyPath } from "@/lib/slug";
import {
  checkLoginRateLimit,
  recordLoginFailure,
  recordLoginSuccess,
} from "@/lib/rate-limit";
import { isValidLocale, LOCALE_COOKIE } from "@/lib/i18n";
import type { Article, ArticleStatus, EditorType, Settings, UserRole } from "@/lib/types";

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
}

function fail(err: unknown): ActionState {
  return { ok: false, error: err instanceof Error ? err.message : "Neznámá chyba." };
}

/* ---------------- Jazyk a osobní volba ---------------- */

export async function setLocaleAction(locale: string): Promise<void> {
  if (!isValidLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function clearUserPreferencesAction(): Promise<void> {
  const store = await cookies();
  store.delete(LOCALE_COOKIE);
  revalidatePath("/", "layout");
}

/* ---------------- Auth ---------------- */

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = `${ip}:${username.toLowerCase()}`;

  const rl = checkLoginRateLimit(key);
  if (!rl.allowed) {
    return {
      ok: false,
      error: `Příliš mnoho neúspěšných pokusů. Zkuste to za ${rl.retryAfterSec} s.`,
    };
  }

  // Hook: beforeLogin (může přihlášení zablokovat)
  const before = await runHook("beforeLogin", { extra: { username, ip } }, null);
  if (before.extra?.blocked === true) {
    return { ok: false, error: String(before.extra.reason ?? "Přihlášení bylo zablokováno.") };
  }

  try {
    const user = await login(username, password);
    recordLoginSuccess(key);

    // Hook: afterLogin
    await runHook("afterLogin", { extra: { userId: user.id, username } }, user);
  } catch (err) {
    recordLoginFailure(key);

    // Hook: afterLoginFailed
    await runHook(
      "afterLoginFailed",
      {
        extra: {
          username,
          ip,
          reason: err instanceof Error ? err.message : "unknown",
        },
      },
      null,
    );

    return fail(err);
  }

  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await logout();
  redirect("/admin/login");
}

/* ---------------- Obsah ---------------- */

export async function saveArticleAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user) return { ok: false, error: "Nejste přihlášeni." };

    const originalPath = String(formData.get("originalPath") ?? "");
    const folder = String(formData.get("folder") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    if (!title) return { ok: false, error: "Titulek je povinný." };

    const slugInput = String(formData.get("slug") ?? "") || title;
    const slug = slugifyPath(slugInput).split("/").pop() ?? "clanek";
    const targetPath = [slugifyPath(folder), slug].filter(Boolean).join("/");

    if (originalPath) {
      const existing = await readArticle(originalPath);
      if (existing && !canEditArticle(user, existing)) {
        return { ok: false, error: "Nemáte oprávnění upravovat cizí článek." };
      }
    } else if (!can(user, "content.create")) {
      return { ok: false, error: "Nemáte oprávnění vytvářet obsah." };
    }

    const authorFromForm = String(formData.get("authorId") ?? "");
    const authorId = can(user, "content.editAny") && authorFromForm ? authorFromForm : user.id;

    let article: Article = {
      path: targetPath,
      slug,
      title,
      description: String(formData.get("description") ?? ""),
      authorId,
      status: String(formData.get("status") ?? "draft") as ArticleStatus,
      date: String(formData.get("date") ?? "") || new Date().toISOString(),
      tags: String(formData.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      order: Number(formData.get("order") ?? 0) || 0,
      editor: String(formData.get("editor") ?? "markdown") as EditorType,
      coverImage: String(formData.get("coverImage") ?? ""),
      customHtml: String(formData.get("customHtml") ?? ""),
      noIndex: formData.get("noIndex") === "on",
      content: String(formData.get("content") ?? ""),
    };

    const hooked = await runHook("beforePageSave", { article }, user);
    if (hooked.article) article = hooked.article;

    const saved = await saveArticle({ ...article, originalPath });
    await runHook("afterPageSave", { article: saved }, user);

    revalidatePath("/", "layout");
    return {
      ok: true,
      message: "Článek byl uložen.",
      redirectTo: `/admin/content/edit?path=${encodeURIComponent(saved.path)}`,
    };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const path = String(formData.get("path") ?? "");
  const article = await readArticle(path);

  if (user && article && canDeleteArticle(user, article)) {
    // Hook: beforePageDelete
    const before = await runHook("beforePageDelete", { article, path }, user);
    if (before.extra?.blocked === true) {
      redirect("/admin/content?error=delete_blocked");
    }

    await deleteArticle(path);

    // Hook: afterPageDelete
    await runHook("afterPageDelete", { article, path }, user);
  }

  revalidatePath("/", "layout");
  redirect("/admin/content");
}

export async function createFolderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (user && can(user, "content.create")) {
    const parent = String(formData.get("parent") ?? "");
    const name = String(formData.get("name") ?? "");
    await createFolder([parent, name].filter(Boolean).join("/"));
  }
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function deleteFolderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (user && can(user, "content.deleteAny")) {
    await deleteFolder(String(formData.get("path") ?? ""));
  }
  revalidatePath("/", "layout");
  redirect("/admin/content");
}

/* ---------------- Média ---------------- */

export async function createMediaFolderAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const dir = String(formData.get("dir") ?? "");
  const name = String(formData.get("name") ?? "");

  try {
    await createMediaFolder(dir, name, user);
    await runHook("afterFolderCreate", { path: `${dir}/${name}`.replace(/^\//, "") }, user);
  } catch {
    /* ignore */
  }

  revalidatePath("/admin/files");
  redirect(`/admin/files?dir=${encodeURIComponent(dir)}`);
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const dir = String(formData.get("dir") ?? "");
  const mediaPath = String(formData.get("path") ?? "");

  // Hook: beforeMediaDelete
  const before = await runHook("beforeMediaDelete", { path: mediaPath }, user);
  if (before.extra?.blocked === true) {
    redirect(`/admin/files?dir=${encodeURIComponent(dir)}&error=delete_blocked`);
  }

  try {
    await deleteMedia(mediaPath, user);
    await runHook("afterMediaDelete", { path: mediaPath }, user);
  } catch {
    /* ignore */
  }

  revalidatePath("/admin/files");
  redirect(`/admin/files?dir=${encodeURIComponent(dir)}`);
}

export async function renameMediaAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const dir = String(formData.get("dir") ?? "");
  try {
    await renameMedia(String(formData.get("path") ?? ""), String(formData.get("newName") ?? ""), user);
  } catch {
    /* ignore */
  }
  revalidatePath("/admin/files");
  redirect(`/admin/files?dir=${encodeURIComponent(dir)}`);
}

/* ---------------- Pluginy ---------------- */

export async function togglePluginAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (user && can(user, "plugins.manage")) {
    await setPluginState(String(formData.get("id") ?? ""), {
      enabled: String(formData.get("enabled") ?? "") === "1",
    });
  }
  revalidatePath("/", "layout");
  redirect("/admin/plugins");
}

export async function savePluginConfigAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user, "plugins.manage")) return { ok: false, error: "Nemáte oprávnění." };
    const id = String(formData.get("__pluginId") ?? "");
    const config: Record<string, string> = {};
    formData.forEach((value, key) => {
      if (key.startsWith("cfg_")) config[key.slice(4)] = String(value);
    });
    await setPluginState(id, { config });
    revalidatePath("/", "layout");
    return { ok: true, message: "Konfigurace pluginu uložena." };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------- Nastavení ---------------- */

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user, "settings.manage")) return { ok: false, error: "Nemáte oprávnění." };

    const patch: Partial<Settings> = {
      siteTitle: String(formData.get("siteTitle") ?? ""),
      siteSlogan: String(formData.get("siteSlogan") ?? ""),
      siteDescription: String(formData.get("siteDescription") ?? ""),
      language: String(formData.get("language") ?? "cs"),
      itemsPerPage: Number(formData.get("itemsPerPage") ?? 6) || 6,
      defaultEditor: String(formData.get("defaultEditor") ?? "markdown") as EditorType,
      footerText: String(formData.get("footerText") ?? ""),
      homepagePath: String(formData.get("homepagePath") ?? ""),
      theme: String(formData.get("theme") ?? "light") as Settings["theme"],
    };

    // Hook: before nastavení uloženo (může změnit hodnoty)
    const hooked = await runHook("onSettingsSave", { extra: { patch } }, user);
    if (hooked.extra?.patch && typeof hooked.extra.patch === "object") {
      Object.assign(patch, hooked.extra.patch);
    }

    await saveSettings(patch);
    revalidatePath("/", "layout");
    return { ok: true, message: "Nastavení bylo uloženo." };
  } catch (err) {
    return fail(err);
  }
}

/* ---------------- Uživatelé ---------------- */

export async function createUserAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const user = await getCurrentUser();
    if (!user || !can(user, "users.manage")) return { ok: false, error: "Nemáte oprávnění." };

    const input = {
      username: String(formData.get("username") ?? ""),
      password: String(formData.get("password") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "author") as UserRole,
      preferredEditor: String(formData.get("preferredEditor") ?? "markdown") as EditorType,
    };

    // Hook: beforeUserCreate
    const before = await runHook("beforeUserCreate", { extra: { input } }, user);
    if (before.extra?.blocked === true) {
      return { ok: false, error: String(before.extra.reason ?? "Vytvoření uživatele bylo zablokováno.") };
    }

    const created = await createUser(input);

    // Hook: afterUserCreate
    await runHook("afterUserCreate", { extra: { user: created } }, user);

    revalidatePath("/admin/users");
    return { ok: true, message: "Uživatel byl vytvořen." };
  } catch (err) {
    return fail(err);
  }
}

export async function updateUserAction(formData: FormData): Promise<void> {
  const current = await getCurrentUser();
  if (current && can(current, "users.manage")) {
    const id = String(formData.get("id") ?? "");
    const password = String(formData.get("password") ?? "");
    await updateUser(id, {
      displayName: String(formData.get("displayName") ?? ""),
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "author") as UserRole,
      ...(password ? { password } : {}),
    });
  }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const current = await getCurrentUser();
  if (current && can(current, "users.manage")) {
    const id = String(formData.get("id") ?? "");

    // Hook: beforeUserDelete
    const before = await runHook("beforeUserDelete", { extra: { userId: id } }, current);
    if (before.extra?.blocked === true) {
      redirect("/admin/users?error=delete_blocked");
    }

    try {
      await deleteUser(id);
      // Hook: afterUserDelete
      await runHook("afterUserDelete", { extra: { userId: id } }, current);
    } catch {
      /* ignore */
    }
  }
  revalidatePath("/admin/users");
  redirect("/admin/users");
}
