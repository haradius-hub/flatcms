import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllArticles, readArticle } from "@/lib/content";
import { renderArticleHtml } from "@/lib/render";
import { runHook } from "@/lib/plugins";
import { formatCzechDate } from "@/lib/slug";
import { getPublicUsers } from "@/lib/users";
import { cleanRelative } from "@/lib/paths";

export const dynamic = "force-dynamic";

type Params = { slug: string[] };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await readArticle(slug.join("/"));
  if (!article) return { title: "Nenalezeno" };
  return {
    title: article.title,
    description: article.description,
    robots: article.noIndex ? { index: false } : undefined,
  };
}

export default async function ContentPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const relPath = cleanRelative(slug.join("/"));
  const article = await readArticle(relPath);

  if (!article) {
    const all = await getAllArticles();
    const inFolder = all.filter((a) => a.path.startsWith(`${relPath}/`) && a.status === "published");
    if (inFolder.length === 0) notFound();
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold capitalize text-slate-900">{slug[slug.length - 1]}</h1>
        <p className="text-sm text-slate-500">Rubrika obsahuje {inFolder.length} příspěvků.</p>
        <ul className="space-y-3">
          {inFolder.map((a) => (
            <li key={a.path} className="rounded-2xl border border-slate-200 bg-white p-5">
              <Link href={`/${a.path}`} className="text-lg font-semibold text-slate-900 hover:text-indigo-600">
                {a.title}
              </Link>
              <p className="mt-1 text-sm text-slate-600">{a.description}</p>
              <p className="mt-2 text-xs text-slate-400">{formatCzechDate(a.date)}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (article.status === "draft") notFound();

  const users = await getPublicUsers();
  const author = users.find((u) => u.id === article.authorId);

  const before = await runHook("beforePageRender", { article });
  const baseHtml = renderArticleHtml(before.article ?? article);
  const after = await runHook("afterPageRender", { article, html: baseHtml });
  const html = after.html ?? baseHtml;

  const crumbs = article.path.split("/");

  return (
    <article className="mx-auto max-w-3xl">
      <nav className="mb-4 flex flex-wrap gap-1 text-xs text-slate-400">
        <Link href="/" className="hover:text-indigo-600">
          Domů
        </Link>
        {crumbs.slice(0, -1).map((c, i) => (
          <span key={`${c}-${i}`} className="flex gap-1">
            <span>/</span>
            <Link href={`/${crumbs.slice(0, i + 1).join("/")}`} className="capitalize hover:text-indigo-600">
              {c}
            </Link>
          </span>
        ))}
      </nav>

      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverImage} alt={article.title} className="mb-6 w-full rounded-2xl object-cover" />
      )}

      <h1 className="text-4xl font-bold tracking-tight text-slate-900">{article.title}</h1>
      <p className="mt-3 text-sm text-slate-500">
        {formatCzechDate(article.date)} · {author?.displayName ?? article.authorId}
      </p>
      {article.description && <p className="mt-4 text-lg text-slate-600">{article.description}</p>}

      <div className="prose-cms mt-8" dangerouslySetInnerHTML={{ __html: html }} />

      {article.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-slate-200 pt-6">
          {article.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              #{t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
