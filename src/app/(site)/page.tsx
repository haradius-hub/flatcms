import Link from "next/link";
import { getPublishedArticles, readArticle } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { excerpt } from "@/lib/render";
import { formatCzechDate } from "@/lib/slug";
import { getPublicUsers } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, articles, users] = await Promise.all([
    getSettings(),
    getPublishedArticles(),
    getPublicUsers(),
  ]);

  const list = articles.filter((a) => a.status === "published").slice(0, settings.itemsPerPage);
  const authorName = (id: string) => users.find((u) => u.id === id)?.displayName ?? id;

  const items = await Promise.all(
    list.map(async (meta) => {
      const full = await readArticle(meta.path);
      return { meta, text: full ? excerpt(full) : meta.description };
    }),
  );

  return (
    <div className="space-y-10">
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 px-8 py-14 text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.3em] text-indigo-100">Flat-file CMS · bez databáze</p>
        <h1 className="mt-3 text-4xl font-bold">{settings.siteTitle}</h1>
        <p className="mt-3 max-w-2xl text-indigo-50">{settings.siteDescription}</p>
        <div className="mt-6 flex gap-3">
          <Link href="/admin" className="rounded-xl bg-white px-5 py-2.5 font-semibold text-indigo-700">
            Vstoupit do administrace
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Nejnovější obsah</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ meta, text }) => (
            <article
              key={meta.path}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow"
            >
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>{formatCzechDate(meta.date)}</span>
                <span>·</span>
                <span>{authorName(meta.authorId)}</span>
              </div>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                <Link href={`/${meta.path}`}>{meta.title}</Link>
              </h3>
              <p className="mt-2 flex-1 text-sm text-slate-600">{meta.description || text}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {meta.tags.map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    #{t}
                  </span>
                ))}
              </div>
              <Link href={`/${meta.path}`} className="mt-4 text-sm font-medium text-indigo-600">
                Číst dál →
              </Link>
            </article>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-slate-500">Zatím není publikován žádný obsah.</p>
          )}
        </div>
      </section>
    </div>
  );
}
