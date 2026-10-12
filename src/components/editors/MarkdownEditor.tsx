"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import type { MediaEntry } from "@/lib/types";
import MediaPicker from "../file-manager/MediaPicker";

marked.setOptions({ gfm: true, breaks: true });

export default function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [picker, setPicker] = useState(false);
  const html = useMemo(() => marked.parse(value || "", { async: false }) as string, [value]);

  const wrap = (before: string, after = before) => onChange(`${value}${before}text${after}`);

  const insertMedia = (entry: MediaEntry) => {
    const snippet =
      entry.kind === "image"
        ? `\n![${entry.name}](${entry.url})\n`
        : `\n[${entry.name}](${entry.url})\n`;
    onChange(value + snippet);
    setPicker(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2 text-sm">
        <ToolBtn onClick={() => wrap("**")}>Tučné</ToolBtn>
        <ToolBtn onClick={() => wrap("*")}>Kurzíva</ToolBtn>
        <ToolBtn onClick={() => onChange(`${value}\n## Nadpis\n`)}>H2</ToolBtn>
        <ToolBtn onClick={() => onChange(`${value}\n- položka\n`)}>Seznam</ToolBtn>
        <ToolBtn onClick={() => onChange(`${value}\n> citace\n`)}>Citace</ToolBtn>
        <ToolBtn onClick={() => onChange(`${value}\n\n\`\`\`\nkód\n\`\`\`\n`)}>Kód</ToolBtn>
        <ToolBtn onClick={() => onChange(`${value}[odkaz](https://)`)}>Odkaz</ToolBtn>
        <ToolBtn onClick={() => setPicker(true)}>🖼 Médium</ToolBtn>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck
          lang="cs"
          className="min-h-[420px] w-full resize-y border-0 p-4 font-mono text-sm outline-none"
          placeholder="Pište v Markdownu… (podporována čeština i HTML)"
        />
        <div className="border-l border-slate-200 bg-slate-50 p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Živý náhled</p>
          <div className="prose-cms" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={insertMedia} />
    </div>
  );
}

function ToolBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
    >
      {children}
    </button>
  );
}
