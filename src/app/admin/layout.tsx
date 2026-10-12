import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import { can, ROLE_LABELS } from "@/lib/permissions";
import { collectHookHtml } from "@/lib/plugins";
import { getSettings } from "@/lib/settings";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const settings = await getSettings();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">{children}</div>
    );
  }

  const headerHtml = await collectHookHtml("adminHeaderRender", user);

  const nav = [
    { href: "/admin", label: "Přehled", icon: "📊", show: true },
    { href: "/admin/content", label: "Obsah", icon: "📝", show: can(user, "content.view") },
    { href: "/admin/files", label: "Správce souborů", icon: "🗂", show: can(user, "media.read") },
    { href: "/admin/plugins", label: "Pluginy", icon: "🧩", show: can(user, "plugins.manage") },
    { href: "/admin/users", label: "Uživatelé", icon: "👥", show: can(user, "users.manage") },
    { href: "/admin/settings", label: "Nastavení", icon: "⚙️", show: can(user, "settings.manage") },
  ].filter((n) => n.show);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="border-b border-slate-200 px-5 py-5">
          <p className="text-lg font-bold text-slate-900">{settings.siteTitle}</p>
          <p className="text-xs text-slate-500">Flat-file administrace</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-700">{user.displayName}</p>
          <p>{ROLE_LABELS[user.role]}</p>
          <form action={logoutAction} className="mt-3">
            <button className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-slate-600 hover:bg-slate-100">
              Odhlásit se
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {headerHtml.map((html, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="rounded-lg px-3 py-1.5 text-slate-600 hover:bg-slate-100">
              Zobrazit web ↗
            </Link>
            <Link
              href="/admin/content/new"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
            >
              ＋ Nový článek
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
}
