"use client";

import { useActionState } from "react";
import { saveSettingsAction, type ActionState } from "@/app/actions";
import type { Settings } from "@/lib/types";

export default function SettingsForm({ settings }: { settings: Settings }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettingsAction, {});

  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 md:grid-cols-2">
      <Field label="Název webu">
        <input name="siteTitle" defaultValue={settings.siteTitle} className="input" />
      </Field>
      <Field label="Slogan">
        <input name="siteSlogan" defaultValue={settings.siteSlogan} className="input" />
      </Field>
      <Field label="Popis webu (SEO)" wide>
        <textarea name="siteDescription" defaultValue={settings.siteDescription} rows={3} className="input" />
      </Field>
      <Field label="Jazyk">
        <select name="language" defaultValue={settings.language} className="input">
          <option value="cs">Čeština</option>
          <option value="sk">Slovenština</option>
          <option value="en">English</option>
        </select>
      </Field>
      <Field label="Počet článků na stránku">
        <input type="number" name="itemsPerPage" defaultValue={settings.itemsPerPage} className="input" />
      </Field>
      <Field label="Výchozí editor">
        <select name="defaultEditor" defaultValue={settings.defaultEditor} className="input">
          <option value="markdown">Markdown</option>
          <option value="wysiwyg">WYSIWYG</option>
          <option value="block">Blokový</option>
          <option value="html">HTML / Embed</option>
        </select>
      </Field>
      <Field label="Vzhled">
        <select name="theme" defaultValue={settings.theme} className="input">
          <option value="light">Světlý</option>
          <option value="dark">Tmavý</option>
        </select>
      </Field>
      <Field label="Cesta úvodní stránky (volitelné)">
        <input name="homepagePath" defaultValue={settings.homepagePath} className="input" placeholder="o-nas" />
      </Field>
      <Field label="Text patičky" wide>
        <input name="footerText" defaultValue={settings.footerText} className="input" />
      </Field>

      <div className="md:col-span-2 flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Ukládám…" : "Uložit nastavení"}
        </button>
        {state.message && <span className="text-sm text-emerald-600">{state.message}</span>}
        {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block space-y-1 ${wide ? "md:col-span-2" : ""}`}>
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
