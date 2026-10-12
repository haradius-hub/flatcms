"use client";

import { useActionState } from "react";
import { savePluginConfigAction, type ActionState } from "@/app/actions";
import type { LoadedPlugin } from "@/lib/types";

export default function PluginConfigForm({ plugin }: { plugin: LoadedPlugin }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(savePluginConfigAction, {});
  const fields = plugin.manifest.configFields ?? [];
  if (fields.length === 0) return null;

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
      <input type="hidden" name="__pluginId" value={plugin.manifest.id} />
      {fields.map((f) => (
        <label key={f.key} className="block space-y-1">
          <span className="text-xs font-medium text-slate-600">{f.label}</span>
          {f.type === "textarea" ? (
            <textarea
              name={`cfg_${f.key}`}
              defaultValue={plugin.state.config[f.key] ?? f.default ?? ""}
              rows={2}
              className="input"
            />
          ) : (
            <input
              name={`cfg_${f.key}`}
              defaultValue={plugin.state.config[f.key] ?? f.default ?? ""}
              className="input"
            />
          )}
        </label>
      ))}
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {pending ? "Ukládám…" : "Uložit konfiguraci"}
        </button>
        {state.message && <span className="text-xs text-emerald-600">{state.message}</span>}
        {state.error && <span className="text-xs text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}
