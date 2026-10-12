import crypto from "node:crypto";
import type { PublicUser, User, UserRole, EditorType } from "./types";
import { readJson, writeJson } from "./store";

const FILE = "users.json";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function defaultUsers(): User[] {
  const now = new Date().toISOString();
  return [
    {
      id: "admin",
      username: "admin",
      passwordHash: hashPassword("admin123"),
      displayName: "Hlavní administrátor",
      email: "admin@example.cz",
      role: "administrator",
      createdAt: now,
      preferredEditor: "markdown",
    },
    {
      id: "editor",
      username: "editor",
      passwordHash: hashPassword("editor123"),
      displayName: "Jana Editorová",
      email: "editor@example.cz",
      role: "editor",
      createdAt: now,
      preferredEditor: "wysiwyg",
    },
    {
      id: "autor",
      username: "autor",
      passwordHash: hashPassword("autor123"),
      displayName: "Petr Autor",
      email: "autor@example.cz",
      role: "author",
      createdAt: now,
      preferredEditor: "block",
    },
  ];
}

export async function getUsers(): Promise<User[]> {
  const users = await readJson<User[]>(FILE, defaultUsers());
  if (!Array.isArray(users) || users.length === 0) {
    const fresh = defaultUsers();
    await writeJson(FILE, fresh);
    return fresh;
  }
  return users;
}

export function toPublic(user: User): PublicUser {
  const { passwordHash: _p, ...rest } = user;
  void _p;
  return rest;
}

export async function getPublicUsers(): Promise<PublicUser[]> {
  return (await getUsers()).map(toPublic);
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  return (await getUsers()).find((u) => u.id === id);
}

export interface CreateUserInput {
  username: string;
  password: string;
  displayName: string;
  email: string;
  role: UserRole;
  preferredEditor?: EditorType;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const users = await getUsers();
  const username = input.username.trim().toLowerCase();
  if (!username || !input.password) throw new Error("Uživatelské jméno a heslo jsou povinné.");
  if (users.some((u) => u.username.toLowerCase() === username)) {
    throw new Error("Uživatel s tímto jménem již existuje.");
  }
  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(input.password),
    displayName: input.displayName || username,
    email: input.email || "",
    role: input.role,
    createdAt: new Date().toISOString(),
    preferredEditor: input.preferredEditor ?? "markdown",
  };
  users.push(user);
  await writeJson(FILE, users);
  return toPublic(user);
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<User, "id" | "passwordHash">> & { password?: string },
): Promise<void> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("Uživatel nenalezen.");
  const { password, ...rest } = patch;
  users[idx] = { ...users[idx], ...rest };
  if (password) users[idx].passwordHash = hashPassword(password);
  await writeJson(FILE, users);
}

export async function deleteUser(id: string): Promise<void> {
  const users = await getUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return;
  if (target.role === "administrator" && users.filter((u) => u.role === "administrator").length <= 1) {
    throw new Error("Nelze smazat posledního administrátora.");
  }
  await writeJson(FILE, users.filter((u) => u.id !== id));
}
