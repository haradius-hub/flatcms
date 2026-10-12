"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Article, EditorType, PublicUser } from "@/lib/types";
import { saveArticleAction, type ActionState } from "@/app/actions";
import MarkdownEditor from "./MarkdownEditor";
import WysiwygEditor from "./WysiwygEditor";
import BlockEditor from "./BlockEditor";
import HtmlEditor from "./HtmlEditor";
import MediaPicker from "../file-manager/MediaPicker";
import { slugify } from "@/lib/slug";

const EDITORS: { id: EditorType; label: string; hint: string }[] = [
  { id: "wysiwyg", label: "WYSIWYG", hint: "Vizuální editor s panelem nástrojů" },
  { id: "block", label: "Blokový", hint: "Gutenberg-style skládání z bloků" },
  { id: "markdown", label: "Markdown", hint: "Čistý Markdown s živým náhledem" },
  { id: "html", label: "HTML / Embed", hint: "Vlastní HTML, iframe a skripty" },
];

interface Props {
  article?: Article;
  folders: string[];
  users: PublicUser[];
  currentUser: PublicUser;
  canChangeAuthor: boolean;
  defaultEditor: EditorType;
}

export default function ArticleForm({
  article,
  folders,
  users,
  currentUser,
  canChangeAuthor,
  defaultEditor,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveArticleAction, {});
  const [editor, setEditor] = useState<EditorType>(article?.editor ?? defaultEditor);
  const [content, setContent] = useState(article?.content ?? "");
  const [title, setTitle] = useState(article?.title ?? "");
  const [slug, setSlug] = useState(article?.slug ?? "");
  const [cover, setCover] = useState(article?.coverImage ?? "");
  const [picker, setPicker] = useState(false);

  useEffect(() => {
    if (state.ok && state.redirectTo) router.replace(state.redirectTo);
  }, [state, router]);

  const folder = article?.path.split("/").slice(0, -1).join("/") ?? "";

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="originalPath" value={article?.path ?? ""} />
      <input type="hidden" name="content" value={content} />
      <input type="hidden" name="editor" value={editor} />

      {state.error && (
        <div className="rounded-lg bg-rose-50 px-4 py-2 text-sm text-rose-700">{state.error}</div>
      )}
      {state.ok && state.message && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{state.message}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <input
            name="title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!article) setSlug(slugify(e.target.value));
            }}
            placeholder="Titulek článku"
            lang="cs"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-2xl font-semibold outline-none focus:border-indigo-400"
            required
          />

          <div className="flex flex-wrap gap-2">
            {EDITORS.map((e) => (
              <button
                key={e.id}
                type="button"
                title={e.hint}
                onClick={() => setEditor(e.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  editor === e.id
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {e.label}
              </button>
            ))}
          </div>

          {editor === "markdown" && <MarkdownEditor value={content} onChange={setContent} />}
          {editor === "wysiwyg" && <WysiwygEditor value={content} onChange={setContent} />}
          {editor === "block" && <BlockEditor value={content} onChange={setContent} />}
          {editor === "html" && <HtmlEditor value={content} onChange={setContent} />}

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Vlastní HTML / skripty pod obsahem
            </label>
            <textarea
              name="customHtml"
              defaultValue={article?.customHtml ?? ""}
              rows={3}
              className="w-full rounded-lg border border-slate-200 p-2 font-mono text-xs"
              placeholder='<script>...</script> nebo <iframe src="..."></iframe>'
            />
          </div>
        </div>

        <aside className="space-y-4">
          <Panel title="Publikace">
            <Field label="Stav">
              <select name="status" defaultValue={article?.status ?? "draft"} className="input">
                <option value="published">Publikováno</option>
                <option value="draft">Koncept</option>
                <option value="scheduled">Naplánováno</option>
                <option value="static">Statická stránka</option>
              </select>
            </Field>
            <Field label="Datum">
              <input
                type="datetime-local"
                name="date"
                defaultValue={toLocalInput(article?.date)}
                className="input"
              />
            </Field>
            <Field label="Pořadí">
              <input type="number" name="order" defaultValue={article?.order ?? 0} className="input" />
            </Field>
            {canChangeAuthor ? (
              <Field label="Autor">
                <select name="authorId" defaultValue={article?.authorId ?? currentUser.id} className="input">
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.displayName} ({u.username})
                    </option>
                  ))}
                </select>
              </Field>
            ) : (
              <input type="hidden" name="authorId" value={currentUser.id} />
            )}
          </Panel>

          <Panel title="Umístění a URL">
            <Field label="Složka (kategorie)">
              <input
                name="folder"
                defaultValue={folder}
                list="folder-list"
                placeholder="blog/technologie"
                className="input"
              />
              <datalist id="folder-list">
                {folders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </Field>
            <Field label="Slug (bez diakritiky)">
              <input
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                onBlur={(e) => setSlug(slugify(e.target.value))}
                className="input"
              />
            </Field>
            <p className="text-xs text-slate-500">
              URL: /{[folder, slug].filter(Boolean).join("/")}
            </p>
          </Panel>

          <Panel title="Metadata">
            <Field label="Popis (SEO)">
              <textarea name="description" defaultValue={article?.description ?? ""} rows={3} className="input" />
            </Field>
            <Field label="Štítky (oddělené čárkou)">
              <input name="tags" defaultValue={(article?.tags ?? []).join(", ")} className="input" />
            </Field>
            <Field label="Náhledový obrázek">
              <div className="flex gap-2">
                <input name="coverImage" value={cover} onChange={(e) => setCover(e.target.value)} className="input" />
                <button
                  type="button"
                  onClick={() => setPicker(true)}
                  className="rounded-lg bg-slate-800 px-3 text-xs text-white"
                >
                  Vybrat
                </button>
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="noIndex" defaultChecked={article?.noIndex} />
              Zakázat indexaci (noindex)
            </label>
          </Panel>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {pending ? "Ukládám…" : "Uložit článek"}
          </button>
        </aside>
      </div>

      <MediaPicker
        open={picker}
        onClose={() => setPicker(false)}
        onSelect={(entry) => {
          setCover(entry.url ?? "");
          setPicker(false);
        }}
      />
    </form>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function toLocalInput(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
