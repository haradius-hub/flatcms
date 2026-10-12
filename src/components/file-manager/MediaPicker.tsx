"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { MediaEntry } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (entry: MediaEntry) => void;
}

export default function MediaPicker({ open, onClose, onSelect }: Props) {
  const [dir, setDir] = useState("");
  const [entries, setEntries] = useState<MediaEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (target: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/media/list?dir=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Chyba načtení");
      setEntries(data.entries as MediaEntry[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chyba");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) void load(dir);
  }, [open, dir, load]);

  const upload = useCallback(
    async (files: FileList | File[]) => {
      const fd = new FormData();
      fd.append("dir", dir);
      Array.from(files).forEach((f) => fd.append("files", f));
      setLoading(true);
      try {
        const res = await fetch("/api/media/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Nahrání selhalo");
        await load(dir);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Chyba");
      } finally {
        setLoading(false);
      }
    },
    [dir, load],
  );

  if (!open) return null;

  const parent = dir.split("/").slice(0, -1).join("/");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Správce souborů</h2>
            <p className="text-xs text-slate-500">/uploads/{dir}</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Nahrát soubory
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Zavřít
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-2 text-sm">
          <button
            type="button"
            onClick={() => setDir("")}
            className="rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50"
          >
            Kořen
          </button>
          {dir && (
            <button
              type="button"
              onClick={() => setDir(parent)}
              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
            >
              ⬅ O úroveň výš
            </button>
          )}
          <button
            type="button"
            onClick={async () => {
              const name = window.prompt("Název nové složky");
              if (!name) return;
              await fetch("/api/media/folder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dir, name }),
              });
              void load(dir);
            }}
            className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100"
          >
            ＋ Nová složka
          </button>
          {loading && <span className="text-xs text-slate-400">Načítám…</span>}
          {error && <span className="text-xs text-rose-600">{error}</span>}
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
          }}
          className={`flex-1 overflow-auto p-5 ${dragOver ? "bg-indigo-50" : "bg-white"}`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {entries.map((entry) => (
              <button
                key={entry.path}
                type="button"
                onClick={() => (entry.type === "folder" ? setDir(entry.path) : onSelect(entry))}
                className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-3 text-center hover:border-indigo-400 hover:bg-indigo-50"
              >
                {entry.type === "folder" ? (
                  <span className="text-3xl">📁</span>
                ) : entry.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.url} alt={entry.name} className="h-16 w-full rounded object-cover" />
                ) : (
                  <span className="text-3xl">
                    {entry.kind === "video" ? "🎬" : entry.kind === "html" ? "🌐" : "📄"}
                  </span>
                )}
                <span className="line-clamp-2 break-all text-xs text-slate-600">{entry.name}</span>
              </button>
            ))}
          </div>
          {entries.length === 0 && !loading && (
            <p className="mt-10 text-center text-sm text-slate-400">
              Složka je prázdná. Přetáhněte sem soubory myší.
            </p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>
    </div>
  );
}
