import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { PublicUser } from "./types";
import { findUserById, findUserByUsername, toPublic, verifyPassword } from "./users";

const COOKIE = "flatcms_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secret(): string {
  return process.env.FLATCMS_SECRET || "flatcms-dev-secret-change-me";
}

function sign(value: string): string {
  return crypto.createHmac("sha256", secret()).update(value).digest("hex");
}

function createToken(userId: string): string {
  const payload = `${userId}.${Date.now() + MAX_AGE * 1000}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

function parseToken(token: string): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  if (sign(payload) !== signature) return null;
  const [userId, expires] = payload.split(".");
  if (!userId || Number(expires) < Date.now()) return null;
  return userId;
}

export async function login(username: string, password: string): Promise<PublicUser> {
  const user = await findUserByUsername(username);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Nesprávné uživatelské jméno nebo heslo.");
  }
  const store = await cookies();
  store.set(COOKIE, createToken(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return toPublic(user);
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  try {
    const store = await cookies();
    const token = store.get(COOKIE)?.value;
    if (!token) return null;
    const userId = parseToken(token);
    if (!userId) return null;
    const user = await findUserById(userId);
    return user ? toPublic(user) : null;
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Přihlášení je vyžadováno.");
  return user;
}
