import { marked } from "marked";
import type { Article } from "./types";

marked.setOptions({ gfm: true, breaks: true });

export interface BlockData {
  id?: string;
  type: "heading" | "paragraph" | "image" | "quote" | "list" | "code" | "embed" | "html";
  text?: string;
  level?: number;
  url?: string;
  caption?: string;
  items?: string[];
  ordered?: boolean;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderBlocks(blocks: BlockData[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `<h${b.level ?? 2}>${escapeHtml(b.text ?? "")}</h${b.level ?? 2}>`;
        case "paragraph":
          return `<p>${(b.text ?? "").replace(/\n/g, "<br/>")}</p>`;
        case "quote":
          return `<blockquote><p>${escapeHtml(b.text ?? "")}</p></blockquote>`;
        case "image":
          return `<figure><img src="${escapeHtml(b.url ?? "")}" alt="${escapeHtml(b.caption ?? "")}" />${
            b.caption ? `<figcaption>${escapeHtml(b.caption)}</figcaption>` : ""
          }</figure>`;
        case "list": {
          const tag = b.ordered ? "ol" : "ul";
          const items = (b.items ?? []).map((i) => `<li>${escapeHtml(i)}</li>`).join("");
          return `<${tag}>${items}</${tag}>`;
        }
        case "code":
          return `<pre><code>${escapeHtml(b.text ?? "")}</code></pre>`;
        case "embed":
          return `<div class="embed">${b.text ?? ""}</div>`;
        case "html":
          return b.text ?? "";
        default:
          return "";
      }
    })
    .join("\n");
}

export function parseBlocks(raw: string): BlockData[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as BlockData[];
    return [];
  } catch {
    return [];
  }
}

/** Převede obsah článku na HTML podle použitého editoru. */
export function renderArticleHtml(article: Pick<Article, "content" | "editor" | "customHtml">): string {
  let html: string;
  switch (article.editor) {
    case "markdown":
      html = marked.parse(article.content ?? "", { async: false }) as string;
      break;
    case "block":
      html = renderBlocks(parseBlocks(article.content ?? ""));
      break;
    case "wysiwyg":
    case "html":
    default:
      html = article.content ?? "";
  }
  if (article.customHtml && article.customHtml.trim()) {
    html += `\n<div class="custom-embed">${article.customHtml}</div>`;
  }
  return html;
}

export function excerpt(article: Pick<Article, "content" | "editor">, length = 180): string {
  let text = article.content ?? "";
  if (article.editor === "block") {
    text = parseBlocks(text)
      .map((b) => b.text ?? (b.items ?? []).join(" "))
      .join(" ");
  }
  const plain = text
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_`>\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > length ? `${plain.slice(0, length)}…` : plain;
}
