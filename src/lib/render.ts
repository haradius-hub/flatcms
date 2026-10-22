/**
 * FlatCMS – renderování obsahu
 *
 * Převádí Markdown / bloky / HTML článků na bezpečné HTML.
 * VEŠKERÝ VÝSTUP PROCHÁZÍ SANITIZACÍ – bez ní by mohl kdokoliv
 * s právem psát články spouštět libovolný JavaScript (stored XSS).
 *
 * Licence: GPLv3
 */

import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import type { Article } from "./types";

marked.setOptions({ gfm: true, breaks: true });

/* ---------------- Sanitizace ---------------- */

const ALLOWED_TAGS = [
  "p", "br", "hr", "div", "span", "section", "article",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "strong", "b", "em", "i", "u", "s", "del", "ins", "mark", "small", "sub", "sup",
  "blockquote", "pre", "code",
  "ul", "ol", "li", "dl", "dt", "dd",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "a", "img", "figure", "figcaption", "picture", "source",
  "video", "audio", "iframe",
];

const ALLOWED_ATTR = [
  "href", "title", "target", "rel",
  "src", "alt", "width", "height", "loading", "srcset", "sizes",
  "class", "id", "style",
  "controls", "autoplay", "loop", "muted", "poster", "preload",
  "allow", "allowfullscreen", "frameborder", "referrerpolicy",
  "colspan", "rowspan", "scope",
];

const ALLOWED_IFRAME_HOSTS = [
  "www.youtube.com",
  "youtube.com",
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
  "player.vimeo.com",
  "vimeo.com",
];

export function sanitizeHtml(dirty: string): string {
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName === "iframe") {
      const el = node as Element;
      const src = el.getAttribute?.("src") ?? "";
      try {
        const url = new URL(src, "https://example.invalid");
        if (!ALLOWED_IFRAME_HOSTS.includes(url.hostname)) {
          el.parentNode?.removeChild(el);
        }
      } catch {
        el.parentNode?.removeChild(el);
      }
    }
    if (data.tagName === "a") {
      const el = node as Element;
      const href = el.getAttribute?.("href") ?? "";
      if (href.trim().toLowerCase().startsWith("javascript:")) {
        el.parentNode?.removeChild(el);
      }
    }
  });

  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ["script", "style", "object", "embed", "form", "input", "button"],
    FORBID_ATTR: [
      "onerror", "onload", "onclick", "onmouseover", "onfocus",
      "onblur", "onchange", "onsubmit", "oninput", "onkeydown",
      "onkeyup", "onkeypress",
    ],
  });

  DOMPurify.removeAllHooks();
  return clean;
}

/* ---------------- Bloky ---------------- */

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
          return `<p>${escapeHtml(b.text ?? "").replace(/\n/g, "<br/>")}</p>`;
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

/* ---------------- Hlavní render ---------------- */

export function renderArticleHtml(
  article: Pick<Article, "content" | "editor" | "customHtml">,
): string {
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

  // KRITICKÉ: sanitizace PŘED vrácením
  return sanitizeHtml(html);
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