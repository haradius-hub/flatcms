"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaEntry } from "@/lib/types";
import MediaPicker from "../file-manager/MediaPicker";

/**
 * Lehký WYSIWYG editor (TinyMCE-like) postavený na contentEditable.
 * Obsahuje panel nástrojů a integraci se správcem médií.
 */
export default function WysiwygEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState(false);
  const [source, setSource] = useState(false);

  useEffect(() => {
    if (ref.current && !source && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value, source]);

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insert = (html: string) => {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const onSelectMedia = (entry: MediaEntry) => {
    const html =
      entry.kind === "image"
        ? `<img src="${entry.url}" alt="${entry.name}" />`
        : entry.kind === "video"
          ? `<video src="${entry.url}" controls></video>`
          : `<a href="${entry.url}">${entry.name}</a>`;
    insert(html);
    setPicker(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2">
        {[
          ["bold", "B"],
          ["italic", "I"],
          ["underline", "U"],
          ["strikeThrough", "S"],
        ].map(([cmd, label]) => (
          <Btn key={cmd} onClick={() => exec(cmd)}>
            {label}
          </Btn>
        ))}
        <Btn onClick={() => exec("formatBlock", "<h2>")}>H2</Btn>
        <Btn onClick={() => exec("formatBlock", "<h3>")}>H3</Btn>
        <Btn onClick={() => exec("formatBlock", "<p>")}>Odstavec</Btn>
        <Btn onClick={() => exec("insertUnorderedList")}>• Seznam</Btn>
        <Btn onClick={() => exec("insertOrderedList")}>1. Seznam</Btn>
        <Btn onClick={() => exec("formatBlock", "<blockquote>")}>Citace</Btn>
        <Btn
          onClick={() => {
            const url = window.prompt("Adresa odkazu", "https://");
            if (url) exec("createLink", url);
          }}
        >
          🔗 Odkaz
        </Btn>
        <Btn onClick={() => setPicker(true)}>🖼 Médium</Btn>
        <Btn
          onClick={() => {
            const code = window.prompt("Vložte HTML / iframe / embed kód", "<iframe src=\"\"></iframe>");
            if (code) insert(code);
          }}
        >
          &lt;/&gt; Embed
        </Btn>
        <Btn onClick={() => setSource((s) => !s)}>{source ? "Vizuálně" : "Zdroj HTML"}</Btn>
      </div>

      {source ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[420px] w-full resize-y p-4 font-mono text-sm outline-none"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          lang="cs"
          onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
          className="prose-cms min-h-[420px] w-full p-4 outline-none"
        />
      )}
      <MediaPicker open={picker} onClose={() => setPicker(false)} onSelect={onSelectMedia} />
    </div>
  );
}

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
    >
      {children}
    </button>
  );
}
