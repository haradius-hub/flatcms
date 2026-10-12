"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Uploader({ dir }: { dir: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const upload = async (files: FileList | File[]) => {
    const fd = new FormData();
    fd.append("dir", dir);
    Array.from(files).forEach((f) => fd.append("files", f));
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Nahrání selhalo");
      setMsg(`Nahráno souborů: ${data.uploaded.length}`);
      router.refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Chyba");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
      }}
      onClick={() => inputRef.current?.click()}
      className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
        drag ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-white hover:border-indigo-400"
      }`}
    >
      <p className="text-3xl">⬆️</p>
      <p className="mt-2 text-sm font-medium text-slate-700">
        {busy ? "Nahrávám…" : "Přetáhněte soubory sem nebo klikněte pro výběr"}
      </p>
      <p className="text-xs text-slate-400">Obrázky, videa, dokumenty i .html soubory</p>
      {msg && <p className="mt-2 text-xs text-indigo-600">{msg}</p>}
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => e.target.files && upload(e.target.files)}
      />
    </div>
  );
}
