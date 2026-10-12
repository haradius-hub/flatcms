import Link from "next/link";
import { requireAdminUser } from "@/lib/guard";
import { getAllArticles } from "@/lib/content";
import { getPublicUsers } from "@/lib/users";
import { loadPlugins } from "@/lib/plugins";
import { listMedia } from "@/lib/files";
import { ROLE_LABELS, canEditArticle } from "@/lib/permissions";
import { formatCzechDate } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const metadata = { title: "Přehled" };

export default async function AdminDashboard() {
  const user = await requireAdminUser();
  const [articles, users, plugins, media] = await Promise.all([
    getAllArticles(),
    getPublicUsers(),
    loadPlugins(),
    listMedia("", user).catch(() => []),
  ]);

  const visible = articles.filter((a) => canEditArticle(user, a) || user.role !== "author");
  const stats = [
    { label: "Články celkem", value: articles.length, icon: "📝" },
    { label: "Publikováno", value: articles.filter((a) => a.status === "published").length, icon: "✅" },
    { label: "Koncepty", value: articles.filter((a) => a.status === "draft").length, icon: "🗒" },
    { label: "Aktivní pluginy", value: plugins.filter((p) => p.state.enabled).length, icon: "🧩" },
    { label: "Uživatelé", value: users.length, icon: "👥" },
    { label: "Položky v uploads", value: media.length, icon: "🗂" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vítejte, {user.displayName}</h1>
        <p className="text-sm text-slate-500">
          Role: {ROLE_LABELS[user.role]} · data jsou uložena v souborech (content/, data/, public/uploads/)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-semibold text-slate-800">Naposledy upravený obsah</h2>
          <Link href="/admin/content" className="text-sm text-indigo-600">
            Zobrazit vše →
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {visible.slice(0, 6).map((a) => (
            <li key={a.path} className="flex items-center justify-between px-5 py-3">
              <div>
                <Link
                  href={`/admin/content/edit?path=${encodeURIComponent(a.path)}`}
                  className="font-medium text-slate-800 hover:text-indigo-600"
                >
                  {a.title}
                </Link>
                <p className="text-xs text-slate-400">/{a.path}</p>
              </div>
              <span className="text-xs text-slate-500">{formatCzechDate(a.modified ?? a.date)}</span>
            </li>
          ))}
          {visible.length === 0 && <li className="px-5 py-6 text-sm text-slate-400">Žádný obsah.</li>}
        </ul>
      </section>
    </div>
  );
}
