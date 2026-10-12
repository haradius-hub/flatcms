import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { getSettings } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { default: settings.siteTitle, template: `%s · ${settings.siteTitle}` },
    description: settings.siteDescription,
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="cs">
      <body className="bg-slate-100 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
