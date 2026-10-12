const MAP: Record<string, string> = {
  á: "a", č: "c", ď: "d", é: "e", ě: "e", í: "i", ň: "n", ó: "o", ř: "r",
  š: "s", ť: "t", ú: "u", ů: "u", ý: "y", ž: "z", ä: "a", ö: "o", ü: "u",
  ĺ: "l", ľ: "l", ŕ: "r", ô: "o",
};

/** Převede český text na URL slug bez diakritiky. */
export function slugify(input: string): string {
  const lower = (input || "").toLowerCase().trim();
  const replaced = Array.from(lower)
    .map((ch) => MAP[ch] ?? ch)
    .join("")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return replaced
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "clanek";
}

/** Slugifikuje celou cestu po segmentech (blog/Technologie/Můj Článek). */
export function slugifyPath(input: string): string {
  return (input || "")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(slugify)
    .join("/");
}

export function formatCzechDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
