"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/app/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={action} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Přihlášení do FlatCMS</h1>
        <p className="mt-1 text-sm text-slate-500">Zadejte své přihlašovací údaje.</p>
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Uživatelské jméno</span>
        <input name="username" className="input" autoComplete="username" required />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Heslo</span>
        <input name="password" type="password" className="input" autoComplete="current-password" required />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Přihlašuji…" : "Přihlásit se"}
      </button>

      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        <p className="font-semibold text-slate-600">Demo účty:</p>
        <p>admin / admin123 — administrátor</p>
        <p>editor / editor123 — editor</p>
        <p>autor / autor123 — autor</p>
      </div>
    </form>
  );
}
