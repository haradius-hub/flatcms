import type { ArticleMeta, PublicUser, UserRole } from "./types";

export type Capability =
  | "content.view"
  | "content.create"
  | "content.editAny"
  | "content.deleteAny"
  | "media.read"
  | "media.write"
  | "media.delete"
  | "plugins.manage"
  | "users.manage"
  | "settings.manage";

const MATRIX: Record<UserRole, Capability[]> = {
  administrator: [
    "content.view", "content.create", "content.editAny", "content.deleteAny",
    "media.read", "media.write", "media.delete",
    "plugins.manage", "users.manage", "settings.manage",
  ],
  editor: [
    "content.view", "content.create", "content.editAny", "content.deleteAny",
    "media.read", "media.write", "media.delete",
  ],
  author: ["content.view", "content.create", "media.read", "media.write"],
};

export function can(user: PublicUser | null | undefined, cap: Capability): boolean {
  if (!user) return false;
  return MATRIX[user.role]?.includes(cap) ?? false;
}

/** Kontrola práva k úpravě konkrétního článku (autor jen vlastní). */
export function canEditArticle(user: PublicUser | null | undefined, article: Pick<ArticleMeta, "authorId">): boolean {
  if (!user) return false;
  if (can(user, "content.editAny")) return true;
  return user.role === "author" && article.authorId === user.id;
}

export function canDeleteArticle(user: PublicUser | null | undefined, article: Pick<ArticleMeta, "authorId">): boolean {
  if (!user) return false;
  if (can(user, "content.deleteAny")) return true;
  return user.role === "author" && article.authorId === user.id;
}

/** Kontrola práv při práci se soubory ve správci souborů. */
export function canUseFiles(
  user: PublicUser | null | undefined,
  action: "read" | "write" | "delete",
): boolean {
  if (!user) return false;
  if (action === "read") return can(user, "media.read");
  if (action === "write") return can(user, "media.write");
  return can(user, "media.delete");
}

export function assert(condition: boolean, message = "Nemáte oprávnění k této akci."): asserts condition {
  if (!condition) throw new Error(message);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  administrator: "Administrátor",
  editor: "Editor",
  author: "Autor",
};
