import Link from "next/link";
import { requireAdminUser } from "@/lib/guard";
import { getContentTree, listFolders } from "@/lib/content";
import { can, canDeleteArticle, canEditArticle } from "@/lib/permissions";
import { formatCzechDate } from "@/lib/slug";
import type { ContentNode, PublicUser } from "@/lib/types";
import { createFolderAction, deleteArticleAction, deleteFolderAction } from "@/app/actions";
import { getPublicUsers } from "@/lib/users";

export const dynamic = "force-dynamic";
export const metadata = { title: "Správa obsahu" };

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-700",
  draft: "bg-amber-100 text-amber-700",
  scheduled: "bg-sky-100 text-sky-700",
  static: "bg-violet-100 text-violet-700",
};

function Tree({
  nodes,
  depth,
  user,
  authorName,
}: {
  nodes: ContentNode[];
  depth: number;
  user: PublicUser;
  authorName: (id: string) => string;
}) {
  return (
    <ul className="space-y-1">
      {nodes.map((node) => (
        <li key={node.path}>
          {node.type === "folder" ? (
            <div className="rounded-xl">
              <div
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                style={{ marginLeft: depth * 16 }}
              >
                <span className="text-sm font-semibold text-slate-700">📁 {node.name}</span>
                <div className="flex items-center gap-3 text-xs">
                  <Link
                    href={`/admin/content/new?folder=${encodeURIComponent(node.path)}`}
                    className="text-indigo-600"
                  >
                    + článek
                  </Link>
                  {can(user, "content.deleteAny") && (
                    <form action={deleteFolderAction}>
                      <input type="hidden" name="path" value={node.path} />
                      <button className="text-rose-600">smazat</button>
                    </form>
                  )}
                </div>
              </div>
              {node.children.length > 0 && (
                <div className="mt-1">
                  <Tree nodes={node.children} depth={depth + 1} user={user} authorName={authorName} />
                </div>
              )}
            </div>
          ) : (
            <div
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              style={{ marginLeft: depth * 16 }}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">📄 {node.article?.title}</p>
                <p className="truncate text-xs text-slate-400">
                  /{node.path} · {authorName(node.article?.authorId ?? "")} ·{" "}
                  {formatCzechDate(node.article?.date ?? "")} · editor: {node.article?.editor}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`rounded-full px-2 py-0.5 ${STATUS_STYLE[node.article?.status ?? "draft"]}`}>
                  {node.article?.status}
                </span>
                <Link href={`/${node.path}`} className="text-slate-500 hover:text-slate-800">
                  náhled
                </Link>
                {node.article && canEditArticle(user, node.article) && (
                  <Link
                    href={`/admin/content/edit?path=${encodeURIComponent(node.path)}`}
                    className="rounded bg-indigo-50 px-2 py-1 font-medium text-indigo-700"
                  >
                    upravit
                  </Link>
                )}
                {node.article && canDeleteArticle(user, node.article) && (
                  <form action={deleteArticleAction}>
                    <input type="hidden" name="path" value={node.path} />
                    <button className="rounded bg-rose-50 px-2 py-1 font-medium text-rose-700">smazat</button>
                  </form>
                )}
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function ContentAdminPage() {
  const user = await requireAdminUser("content.view");
  const [tree, folders, users] = await Promise.all([getContentTree(), listFolders(), getPublicUsers()]);
  const authorName = (id: string) => users.find((u) => u.id === id)?.displayName ?? id;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Správa obsahu</h1>
          <p className="text-sm text-slate-500">
            Stromová struktura složky <code>content/</code> – neomezené vnořování kategorií.
          </p>
        </div>
        <Link
          href="/admin/content/new"
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
        >
          ＋ Nový článek
        </Link>
      </div>

      <form
        action={createFolderAction}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <label className="space-y-1">
          <span className="block text-xs font-medium text-slate-600">Nadřazená složka</span>
          <input name="parent" list="folders" placeholder="blog" className="input w-56" />
          <datalist id="folders">
            {folders.map((f) => (
              <option key={f} value={f} />
            ))}
          </datalist>
        </label>
        <label className="space-y-1">
          <span className="block text-xs font-medium text-slate-600">Název nové složky</span>
          <input name="name" placeholder="Nová kategorie" className="input w-56" required />
        </label>
        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white">
          Vytvořit složku
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {tree.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Zatím žádný obsah.</p>
        ) : (
          <Tree nodes={tree} depth={0} user={user} authorName={authorName} />
        )}
      </div>
    </div>
  );
}
