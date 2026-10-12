import { requireAdminUser } from "@/lib/guard";
import { loadPlugins } from "@/lib/plugins";
import { togglePluginAction } from "@/app/actions";
import PluginConfigForm from "./PluginConfigForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pluginy" };

export default async function PluginsPage() {
  await requireAdminUser("plugins.manage");
  const plugins = await loadPlugins();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pluginy</h1>
        <p className="text-sm text-slate-500">
          Moduly ze složky <code>plugins/</code>; stav se ukládá do <code>data/plugins.json</code>.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plugins.map((p) => (
          <div key={p.manifest.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-slate-900">
                  🧩 {p.manifest.name}{" "}
                  <span className="text-xs font-normal text-slate-400">v{p.manifest.version}</span>
                </h2>
                <p className="mt-1 text-sm text-slate-600">{p.manifest.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  ID: {p.manifest.id} {p.manifest.author ? `· autor: ${p.manifest.author}` : ""}
                </p>
                {p.module && (
                  <p className="mt-1 text-xs text-indigo-500">
                    Hooky: {Object.keys(p.module.hooks ?? {}).join(", ") || "žádné"}
                  </p>
                )}
                {p.error && <p className="mt-1 text-xs text-rose-600">Chyba: {p.error}</p>}
              </div>
              <form action={togglePluginAction}>
                <input type="hidden" name="id" value={p.manifest.id} />
                <input type="hidden" name="enabled" value={p.state.enabled ? "0" : "1"} />
                <button
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    p.state.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {p.state.enabled ? "Zapnuto" : "Vypnuto"}
                </button>
              </form>
            </div>
            <PluginConfigForm plugin={p} />
          </div>
        ))}
        {plugins.length === 0 && (
          <p className="text-sm text-slate-500">Ve složce plugins/ nejsou žádné pluginy.</p>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
        <h3 className="font-semibold text-slate-800">Jak vytvořit plugin</h3>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">{`plugins/muj-plugin/
  ├── plugin.json   // { "id", "name", "version", "configFields": [...] }
  └── index.mjs     // export default { id, name, version, hooks: { beforePageSave(payload, ctx) {} } }

// Dostupné hooky:
// beforePageSave, afterPageSave, beforePageRender, afterPageRender,
// adminHeaderRender, siteHeadRender, siteFooterRender, beforeFileUpload`}</pre>
      </div>
    </div>
  );
}
