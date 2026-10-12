"use client";

import { useState } from "react";
import MediaPicker from "../file-manager/MediaPicker";
import type { MediaEntry } from "@/lib/types";

/** Přímé vkládání HTML / iframe / skriptů. */
export default function HtmlEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [picker, setPicker] = useState(false);
  const [preview, setPreview] = useState(true);

  const onSelect = (entry: MediaEntry) => {
    const html =
      entry.kind === "image"
        ? `<img src="${entry.url}" alt="${entry.name}" />`
        : `<a href="${entry.url}">${entry.name}</a>`;
    onChange(`${value}\n${html}`);
    setPicker(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-2 border-b border-slate-200 p-2">
        <button
          type="button"
          onClick={() => onChange(`${value}\n<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allowfullscreen></iframe>`)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
        >
          YouTube iframe
        </button>
        <button
          type="button"
          onClick={() => setPicker(true)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
        >
          🖼 Médium
        </button>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
        >
          {preview ? "Skrýt náhled" : "Zobrazit náhled"}
        </button>
      </div>
      <div className={preview ? "grid md:grid-cols-2" : ""}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[420px] w-full resize-y p-4 font-mono text-sm outline-none"
          placeholder="<section>Vlastní HTML, iframe nebo skripty…</section>"
        />
        {preview && (
          <div className="border-l border-slate-200 bg-slate-50 p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Náhled</p>
            <div className="prose-cms" dangerouslySetInnerHTML={{ __html: value }} />
          </div>
        )}
      </div>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={onSelect} />
    </div>
  );
}
