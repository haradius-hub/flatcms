import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminUser } from "@/lib/guard";
import { listFolders, readArticle } from "@/lib/content";
import { getPublicUsers } from "@/lib/users";
import { getSettings } from "@/lib/settings";
import { can, canEditArticle } from "@/lib/permissions";
import ArticleForm from "@/components/editors/ArticleForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Úprava článku" };

export default async function EditArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string }>;
}) {
  const user = await requireAdminUser("content.view");
  const { path } = await searchParams;
  if (!path) notFound();
  const article = await readArticle(path);
  if (!article) notFound();

  if (!canEditArticle(user, article)) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <h1 className="text-lg font-semibold">Nemáte oprávnění upravovat tento článek</h1>
        <p className="mt-1 text-sm">Role „Autor“ může upravovat pouze vlastní obsah.</p>
        <Link href="/admin/content" className="mt-4 inline-block text-sm underline">
          Zpět na seznam
        </Link>
      </div>
    );
  }

  const [folders, users, settings] = await Promise.all([listFolders(), getPublicUsers(), getSettings()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Úprava: {article.title}</h1>
        <Link href={`/${article.path}`} className="text-sm text-indigo-600">
          Zobrazit na webu ↗
        </Link>
      </div>
      <ArticleForm
        article={article}
        folders={folders}
        users={users}
        currentUser={user}
        canChangeAuthor={can(user, "content.editAny")}
        defaultEditor={settings.defaultEditor}
      />
    </div>
  );
}
