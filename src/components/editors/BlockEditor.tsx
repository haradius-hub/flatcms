"use client";

import { useMemo, useState } from "react";
import type { BlockData } from "@/lib/render";
import type { MediaEntry } from "@/lib/types";
import MediaPicker from "../file-manager/MediaPicker";

const BLOCK_LABELS: Record<BlockData["type"], string> = {
  heading: "Nadpis",
  paragraph: "Odstavec",
  image: "Obrázek",
  quote: "Citace",
  list: "Seznam",
  code: "Kód",
  embed: "Embed / iframe",
  html: "Vlastní HTML",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/** Blokový (Gutenberg-style) editor – obsah se ukládá jako JSON pole bloků. */
export default function BlockEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const blocks = useMemo<BlockData[]>(() => {
    try {
      const parsed = JSON.parse(value || "[]");
      return Array.isArray(parsed) ? (parsed as BlockData[]) : [];
    } catch {
      return value ? [{ id: uid(), type: "paragraph", text: value }] : [];
    }
  }, [value]);

  const [pickerFor, setPickerFor] = useState<string | null>(null);

  const commit = (next: BlockData[]) => onChange(JSON.stringify(next, null, 2));

  const update = (id: string, patch: Partial<BlockData>) =>
    commit(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const add = (type: BlockData["type"]) =>
    commit([...blocks, { id: uid(), type, text: "", level: 2, items: type === "list" ? ["Položka"] : undefined }]);

  const remove = (id: string) => commit(blocks.filter((b) => b.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[idx], next[target]] = [next[target], next[idx]];
    commit(next);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(BLOCK_LABELS) as BlockData["type"][]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => add(t)}
            className="rounded-lg border border-dashed border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
          >
            ＋ {BLOCK_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {blocks.map((block) => (
          <div key={block.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {BLOCK_LABELS[block.type]}
              </span>
              <div className="flex gap-1">
                <MiniBtn onClick={() => move(block.id!, -1)}>↑</MiniBtn>
                <MiniBtn onClick={() => move(block.id!, 1)}>↓</MiniBtn>
                <MiniBtn onClick={() => remove(block.id!)}>✕</MiniBtn>
              </div>
            </div>

            {block.type === "heading" && (
              <div className="flex gap-2">
                <select
                  value={block.level ?? 2}
                  onChange={(e) => update(block.id!, { level: Number(e.target.value) })}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                >
                  {[1, 2, 3, 4].map((l) => (
                    <option key={l} value={l}>
                      H{l}
                    </option>
                  ))}
                </select>
                <input
                  value={block.text ?? ""}
                  onChange={(e) => update(block.id!, { text: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  placeholder="Text nadpisu"
                />
              </div>
            )}

            {(block.type === "paragraph" || block.type === "quote" || block.type === "code" ||
              block.type === "embed" || block.type === "html") && (
              <textarea
                value={block.text ?? ""}
                onChange={(e) => update(block.id!, { text: e.target.value })}
                rows={block.type === "paragraph" ? 4 : 3}
                lang="cs"
                className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                placeholder={
                  block.type === "embed"
                    ? '<iframe src="https://www.youtube.com/embed/..." allowfullscreen></iframe>'
                    : "Obsah bloku"
                }
              />
            )}

            {block.type === "list" && (
              <textarea
                value={(block.items ?? []).join("\n")}
                onChange={(e) => update(block.id!, { items: e.target.value.split("\n") })}
                rows={4}
                className="w-full rounded-lg border border-slate-300 p-2 text-sm"
                placeholder="Každá položka na nový řádek"
              />
            )}

            {block.type === "image" && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={block.url ?? ""}
                    onChange={(e) => update(block.id!, { url: e.target.value })}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    placeholder="/uploads/obrazek.jpg"
                  />
                  <button
                    type="button"
                    onClick={() => setPickerFor(block.id!)}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white"
                  >
                    Vybrat
                  </button>
                </div>
                <input
                  value={block.caption ?? ""}
                  onChange={(e) => update(block.id!, { caption: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                  placeholder="Popisek obrázku"
                />
                {block.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={block.url} alt="" className="max-h-40 rounded-lg object-contain" />
                )}
              </div>
            )}
          </div>
        ))}
        {blocks.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
            Zatím žádné bloky – přidejte první blok výše.
          </p>
        )}
      </div>

      <MediaPicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        onSelect={(entry: MediaEntry) => {
          if (pickerFor) update(pickerFor, { url: entry.url });
          setPickerFor(null);
        }}
      />
    </div>
  );
}

function MiniBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-100"
    >
      {children}
    </button>
  );
}
