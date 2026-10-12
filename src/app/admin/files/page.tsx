import Link from "next/link";
import { requireAdminUser } from "@/lib/guard";
import { formatSize, listMedia } from "@/lib/files";
import { canUseFiles } from "@/lib/permissions";
import Uploader from "@/components/file-manager/Uploader";
import { createMediaFolderAction, deleteMediaAction, renameMediaAction } from "@/app/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Správce souborů" };

export default async function FilesPage({
  searchParams,
}: {
  searchParams: Promise<{ dir?: string }>;
}) {
  const user = await requireAdminUser("media.read");
  const { dir = "" } = await searchParams;
  const entries = await listMedia(dir, user).catch(() => []);
  const parent = dir.split("/").slice(0, -1).join("/");
  const crumbs = dir ? dir.split("/") : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Správce souborů</h1>
        <p className="text-sm text-slate-500">
          Namapováno na <code>public/uploads/</code>
        </p>
      </div>

      <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
        <Link href="/admin/files" className="rounded px-2 py-1 hover:bg-slate-100">
          uploads
        </Link>
        {crumbs.map((c, i) => (
          <span key={`${c}-${i}`} className="flex items-center gap-1">
            <span>/</span>
            <Link
              href={`/admin/files?dir=${encodeURIComponent(crumbs.slice(0, i + 1).join("/"))}`}
              className="rounded px-2 py-1 hover:bg-slate-100"
            >
              {c}
            </Link>
          </span>
        ))}
      </nav>

      <Uploader dir={dir} />

      <form
        action={createMediaFolderAction}
        className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4"
      >
        <input type="hidden" name="dir" value={dir} />
        <label className="space-y-1">
          <span className="block text-xs font-medium text-slate-600">Nová podsložka</span>
          <input name="name" placeholder="obrazky" className="input w-60" required />
        </label>
        <button className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-white">Vytvořit</button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-2">Název</th>
              <th className="px-4 py-2">Typ</th>
              <th className="px-4 py-2">Velikost</th>
              <th className="px-4 py-2">Akce</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dir && (
              <tr>
                <td className="px-4 py-2" colSpan={4}>
                  <Link href={`/admin/files?dir=${encodeURIComponent(parent)}`} className="text-indigo-600">
                    ⬅ O úroveň výš
                  </Link>
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.path}>
                <td className="px-4 py-2">
                  {entry.type === "folder" ? (
                    <Link
                      href={`/admin/files?dir=${encodeURIComponent(entry.path)}`}
                      className="font-medium text-slate-800"
                    >
                      📁 {entry.name}
                    </Link>
                  ) : (
                    <a href={entry.url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                      {entry.kind === "image" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={entry.url} alt="" className="h-8 w-8 rounded object-cover" />
                      ) : (
                        <span>{entry.kind === "video" ? "🎬" : entry.kind === "html" ? "🌐" : "📄"}</span>
                      )}
                      <span className="text-slate-700">{entry.name}</span>
                    </a>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-500">{entry.type === "folder" ? "složka" : entry.kind}</td>
                <td className="px-4 py-2 text-slate-500">
                  {entry.type === "folder" ? "—" : formatSize(entry.size)}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {canUseFiles(user, "write") && (
                      <form action={renameMediaAction} className="flex items-center gap-1">
                        <input type="hidden" name="dir" value={dir} />
                        <input type="hidden" name="path" value={entry.path} />
                        <input
                          name="newName"
                          defaultValue={entry.name}
                          className="w-36 rounded border border-slate-200 px-2 py-1 text-xs"
                        />
                        <button className="rounded bg-slate-100 px-2 py-1 text-xs">Přejmenovat</button>
                      </form>
                    )}
                    {canUseFiles(user, "delete") && (
                      <form action={deleteMediaAction}>
                        <input type="hidden" name="dir" value={dir} />
                        <input type="hidden" name="path" value={entry.path} />
                        <button className="rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">Smazat</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Složka je prázdná.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
