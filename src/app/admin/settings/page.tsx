import { requireAdminUser } from "@/lib/guard";
import { getSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nastavení" };

export default async function SettingsPage() {
  await requireAdminUser("settings.manage");
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nastavení webu</h1>
        <p className="text-sm text-slate-500">
          Uloženo v souboru <code>data/settings.json</code>.
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
