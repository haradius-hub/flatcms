import { requireAdminUser } from "@/lib/guard";
import { getPublicUsers } from "@/lib/users";
import { ROLE_LABELS } from "@/lib/permissions";
import { deleteUserAction, updateUserAction } from "@/app/actions";
import NewUserForm from "./NewUserForm";
import { formatCzechDate } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const metadata = { title: "Uživatelé" };

export default async function UsersPage() {
  const current = await requireAdminUser("users.manage");
  const users = await getPublicUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Uživatelé a role</h1>
        <p className="text-sm text-slate-500">
          Uloženo v <code>data/users.json</code>, hesla jsou hashována algoritmem scrypt.
        </p>
      </div>

      <NewUserForm />

      <div className="space-y-3">
        {users.map((u) => (
          <form
            key={u.id}
            action={updateUserAction}
            className="grid items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-6"
          >
            <input type="hidden" name="id" value={u.id} />
            <div>
              <p className="text-xs text-slate-400">Jméno účtu</p>
              <p className="font-semibold text-slate-800">{u.username}</p>
              <p className="text-xs text-slate-400">od {formatCzechDate(u.createdAt)}</p>
            </div>
            <input name="displayName" defaultValue={u.displayName} className="input" />
            <input name="email" defaultValue={u.email} className="input" />
            <select name="role" defaultValue={u.role} className="input">
              {(Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <input name="password" type="password" placeholder="Nové heslo" className="input" />
            <div className="flex gap-2">
              <button className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">Uložit</button>
              {u.id !== current.id && (
                <button
                  formAction={deleteUserAction}
                  className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
                >
                  Smazat
                </button>
              )}
            </div>
          </form>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <h3 className="font-semibold text-slate-800">Model oprávnění (dle Bluditu)</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Administrátor</strong> – vše: nastavení, uživatelé, pluginy, soubory, obsah.</li>
          <li><strong>Editor</strong> – veškerý obsah a média, bez nastavení a pluginů.</li>
          <li><strong>Autor</strong> – pouze vlastní články (kontrola dle <code>authorId</code>) a nahrávání médií.</li>
        </ul>
      </div>
    </div>
  );
}
