"use client";

import { useActionState } from "react";
import { createUserAction, type ActionState } from "@/app/actions";

export default function NewUserForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createUserAction, {});
  return (
    <form action={action} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-3">
      <h2 className="md:col-span-3 font-semibold text-slate-800">Nový uživatel</h2>
      <input name="username" placeholder="Uživatelské jméno" className="input" required />
      <input name="password" type="password" placeholder="Heslo" className="input" required />
      <input name="displayName" placeholder="Zobrazované jméno" className="input" />
      <input name="email" type="email" placeholder="E-mail" className="input" />
      <select name="role" className="input" defaultValue="author">
        <option value="administrator">Administrátor</option>
        <option value="editor">Editor</option>
        <option value="author">Autor</option>
      </select>
      <select name="preferredEditor" className="input" defaultValue="markdown">
        <option value="markdown">Markdown editor</option>
        <option value="wysiwyg">WYSIWYG editor</option>
        <option value="block">Blokový editor</option>
        <option value="html">HTML editor</option>
      </select>
      <div className="md:col-span-3 flex items-center gap-3">
        <button
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Vytvářím…" : "Vytvořit uživatele"}
        </button>
        {state.message && <span className="text-sm text-emerald-600">{state.message}</span>}
        {state.error && <span className="text-sm text-rose-600">{state.error}</span>}
      </div>
    </form>
  );
}
