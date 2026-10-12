import { requireAdminUser } from "@/lib/guard";
import { listFolders } from "@/lib/content";
import { getPublicUsers } from "@/lib/users";
import { getSettings } from "@/lib/settings";
import { can } from "@/lib/permissions";
import ArticleForm from "@/components/editors/ArticleForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nový článek" };

export default async function NewArticlePage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const user = await requireAdminUser("content.create");
  const { folder } = await searchParams;
  const [folders, users, settings] = await Promise.all([listFolders(), getPublicUsers(), getSettings()]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Nový článek</h1>
      <ArticleForm
        article={
          folder
            ? {
                path: `${folder}/`,
                slug: "",
                title: "",
                description: "",
                authorId: user.id,
                status: "draft",
                date: new Date().toISOString(),
                tags: [],
                order: 0,
                editor: settings.defaultEditor,
                content: "",
              }
            : undefined
        }
        folders={folders}
        users={users}
        currentUser={user}
        canChangeAuthor={can(user, "content.editAny")}
        defaultEditor={user.preferredEditor ?? settings.defaultEditor}
      />
    </div>
  );
}
