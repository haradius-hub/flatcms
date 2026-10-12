import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { can, type Capability } from "./permissions";
import type { PublicUser } from "./types";

/** Guard pro admin stránky – přesměruje nepřihlášené na login. */
export async function requireAdminUser(cap?: Capability): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (cap && !can(user, cap)) redirect("/admin");
  return user;
}
