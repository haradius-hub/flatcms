import Link from "next/link";
import type { ReactNode } from "react";
import { getSettings } from "@/lib/settings";
import { getContentTree } from "@/lib/content";
import { collectHookHtml } from "@/lib/plugins";
import type { ContentNode } from "@/lib/types";

export const dynamic = "force-dynamic";

function topLevelLinks(tree: ContentNode[]) {
  return tree
    .map((node) => {
      if (node.type === "folder") return { href: `/${node.path}`, label: node.name };
      if (node.article && node.article.status !== "draft") {
        return { href: `/${node.path}`, label: node.article.title };
      }
      return null;
    })
    .filter((v): v is { href: string; label: string } => Boolean(v))
    .slice(0, 8);
}

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const [settings, tree, head, footerHtml] = await Promise.all([
    getSettings(),
    getContentTree(),
    collectHookHtml("siteHeadRender"),
    collectHookHtml("siteFooterRender"),
  ]);
  const links = topLevelLinks(tree);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {head.map((html, i) => (
        <div key={i} className="hidden" dangerouslySetInnerHTML={{ __html: html }} />
      ))}

      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link href="/" className="group">
            <span className="block text-xl font-bold tracking-tight text-slate-900">{settings.siteTitle}</span>
            <span className="block text-xs text-slate-500">{settings.siteSlogan}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-1.5 text-slate-600 capitalize hover:bg-slate-100"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="ml-2 rounded-lg bg-slate-900 px-3 py-1.5 font-medium text-white hover:bg-slate-700"
            >
              Administrace
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-5xl space-y-2 px-6 py-8 text-sm text-slate-500">
          <p>{settings.footerText}</p>
          {footerHtml.map((html, i) => (
            <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
          ))}
        </div>
      </footer>
    </div>
  );
}
