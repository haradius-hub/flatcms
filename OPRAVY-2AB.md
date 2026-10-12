# Etapa 2A + 2B — Tmavý režim a internacionalizace

**Datum:** 24. 9. 2026
**Projekt:** FlatCMS
**Autoři:** Jan Hošek + Better DeepSeek

---

## Co tato etapa řeší

Dvě věci, které ti vadily při používání:

1. **Tmavý režim nefungoval** — přepínač v administraci uložil hodnotu, ale kód ji nikde nečetl.
2. **CMS byl jen česky** — nebylo možné přepnout jazyk.

A ještě navíc jsme přidali:

3. **Přepínač jazyka a tématu v hlavičce** — pohodlné přepnutí kdykoliv.
4. **Systém pro snadné přidání dalšího jazyka** — stačí přeložit jeden JSON.

---

## Tmavý režim — jak to teď funguje

### Co bylo špatně

V původním kódu v `src/app/layout.tsx`:

```tsx
<body className="bg-slate-100 text-slate-900 antialiased">
```

Barvy byly **napevno** — světle šedá a tmavě modrá. Ať uživatel v administraci přepnul cokoliv, `<body>` měl vždy světlé pozadí.

### Jak to funguje teď

**Tři vrstvy:**

1. **CSS proměnné** (`globals.css`) — definují barvy pro světlý a tmavý režim.
2. **Inline skript** v `<head>` — přečte uživatelovu volbu z `localStorage` **ještě před prvním vykreslením stránky**, aby neblikalo.
3. **ThemeProvider** (React) — zpřístupní `setTheme()` pro přepínač.

### Kde se ukládá volba

| Místo ↕▾ | Co obsahuje ↕▾ | Kdy se použije ↕▾ |
|---|---|---|
| −`data/settings.json` | výchozí téma (light/dark) | Když uživatel nikdy nepřepnul |
| −`localStorage` (prohlížeč) | uživatelova volba | Vždy, když existuje |
| −Systémové nastavení OS | light/dark | Když je volba „podle systému" |
⚙

### Jak přepnout

- **Přepínač v hlavičce administrace** (ikona slunce/měsíc)
- Volby: **Světlý / Tmavý / Podle systému**
- Volba se uloží do prohlížeče → přežije zavření

### Vyzkoušej

1. Otevři administraci
2. Vpravo nahoře klikni na ikonu slunce/měsíce
3. Vyber „Tmavý"
4. **Celá stránka ztmavne** — a zůstane tmavá i po obnovení

---

## Internacionalizace — jak to teď funguje

### Co bylo špatně

Texty byly **zapečené v kódu**:

```
<h1>Přihlášení do FlatCMS</h1>
<button>Přihlásit se</button>
```

Nebylo jak to přeložit — text byl součástí komponenty.

### Jak to funguje teď

Texty jsou v **překladových souborech** a komponenty je volají přes funkci `t()`:

```
const t = useT();
<h1>{t("login.title")}</h1>
<button>{t("login.submit")}</button>
```

Soubor `messages/cs.json`:

```
{
  "login": {
    "title": "Přihlášení do FlatCMS",
    "submit": "Přihlásit se"
  }
}
```

Soubor `messages/en.json`:

```
{
  "login": {
    "title": "Sign in to FlatCMS",
    "submit": "Sign in"
  }
}
```

### Kde se ukládá volba jazyka

| Místo ↕▾ | Co obsahuje ↕▾ |
|---|---|
| −`data/settings.json` | výchozí jazyk (`language: "cs"`) |
| −Cookie `flatcms_locale` | uživatelova volba |
⚙

Server přečte cookie v root layoutu a pošle uživateli správné texty.

### Přepínání

- **Přepínač v hlavičce** (ikona zeměkoule)
- Klikneš → přepne se jazyk → **cookie se uloží** → příští návštěva si to pamatuje

### Jak přidat další jazyk

Tohle je ta část, na kterou ses ptal. **Postup pro přidání například němčiny:**

1. Zkopíruj `src/messages/cs.json` → `src/messages/de.json`
2. Přelož hodnoty v `de.json`
3. Otevři `src/lib/i18n.ts` a přidej `de` do `bundles`:

```
import de from "@/messages/de.json";
const bundles = { cs, en, sk, de };
```
4. Otevři `src/messages/cs.json` a přidej do `locale`:

```
"de": "Deutsch"
```
5. **Hotovo.** Přepínač ji automaticky nabídne.

**Doba práce:** 1–2 hodiny (hlavně překlad).

### Jazyky dodané v této etapě

- 🇨🇿 **Čeština** (výchozí) — kompletní
- 🇬🇧 **Angličtina** — kompletní pro administraci a login
- 🇸🇰 **Slovenština** — kompletní pro administraci a login

**Poznámka:** Přeložili jsme **jen ty nejdůležitější obrazovky** (login, navigace, dashboard). Ostatní stránky (editor článku, správa souborů, pluginy, nastavení) jsou stále v češtině. V souboru `MIGRACE.md` najdeš postup, jak je přeložit.

---

## Co je v této etapě hotové

### ✅ Tmavý režim

- CSS proměnné pro obě schémata
- Inline skript (žádné blikání)
- ThemeProvider s `setTheme()`
- Přepínač v hlavičce (slunce/měsíc)
- Volba: světlý / tmavý / podle systému
- Ukládá se do `localStorage`

### ✅ Internacionalizace

- I18n provider (server + client)
- 3 překladové soubory (cs, en, sk)
- Funkce `t("klíč", { proměnná: "hodnota" })`
- Server helper `getT(locale)` pro server components
- Client hook `useT()` pro client components
- Cookie `flatcms_locale` pro uložení volby
- Přepínač v hlavičce (zeměkoule)

### ✅ Přeložené obrazovky

- Přihlášení (`/admin/login`)
- Layout administrace (navigace, tlačítka)
- Dashboard (`/admin`)
- Veřejný web (layout — hlavička, patička)

### 📋 Zbývá přeložit (viz `MIGRACE.md`)

- Editor článku (ArticleForm)
- Správa obsahu (content/page.tsx)
- Správa souborů (files/page.tsx)
- Pluginy (plugins/page.tsx)
- Uživatelé (users/page.tsx)
- Nastavení (settings/page.tsx)

---

## Poučení z této etapy

### O tmavém režimu

> **Barvy nikdy nepiš napevno.** Vždy je dej do CSS proměnných. Pak stačí změnit jednu proměnnou a celý web se překlopí.

### O internacionalizaci

> **Texty nikdy nepiš přímo do komponent.** Vždy přes `t("klíč")`. Když to uděláš od začátku, překlad do dalšího jazyka je otázka hodin. Když to neuděláš, je to otázka měsíců.

### O pořadí prací

> **Tmavý režim a i18n mají být na začátku projektu, ne na konci.** Když je doděláváš do hotového kódu, musíš přepisovat všechny komponenty. Kdybys je měl od začátku, nic nepřepisuješ.

**Tyhle dvě věci dělá spousta projektů špatně.** My jsme je teď opravili včas.

---

## Co dál

Po aplikaci této etapy budeš mít:

- **Moderní CMS s tmavým režimem**
- **Trojazyčný** (CZ/EN/SK)
- **Připravený na další jazyky**
- **Systém, kde jsou překlady a barvy na jednom místě**

A pak hurá na **Etapu 2C — rozšíření hooků** (a nakonec **AI plugin**).

---

**Hodně štěstí s aplikací!**

</BDS:create_file>

<BDS:create_file fileName="src/app/globals.css">

```css
@import "tailwindcss";

/*
 * FlatCMS – globální styly
 *
 * Barevné schéma je definované CSS proměnnými, které se mění
 * podle atributu [data-theme="dark"] na <html> elementu.
 *
 * NIKDY nepoužívej přímé barvy (bg-slate-100, text-slate-900) —
 * vždy používej sémantické třídy (bg-background, text-foreground).
 */

@theme {
  /* Světlý režim (výchozí) */
  --color-background: #f8fafc;
  --color-foreground: #0f172a;
  --color-card: #ffffff;
  --color-card-foreground: #0f172a;
  --color-muted: #f1f5f9;
  --color-muted-foreground: #64748b;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-input: #ffffff;

  --color-primary: #4f46e5;
  --color-primary-foreground: #ffffff;
  --color-primary-hover: #4338ca;
  --color-primary-soft: #eef2ff;

  --color-success: #059669;
  --color-success-soft: #ecfdf5;
  --color-warning: #d97706;
  --color-warning-soft: #fffbeb;
  --color-danger: #dc2626;
  --color-danger-soft: #fef2f2;
  --color-info: #0284c7;
  --color-info-soft: #f0f9ff;
}

/* Tmavý režim – přepíše proměnné */
[data-theme="dark"] {
  --color-background: #0b1120;
  --color-foreground: #e2e8f0;
  --color-card: #1e293b;
  --color-card-foreground: #e2e8f0;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
  --color-border: #334155;
  --color-border-strong: #475569;
  --color-input: #0f172a;

  --color-primary: #6366f1;
  --color-primary-foreground: #ffffff;
  --color-primary-hover: #818cf8;
  --color-primary-soft: #1e1b4b;

  --color-success: #34d399;
  --color-success-soft: #064e3b;
  --color-warning: #fbbf24;
  --color-warning-soft: #78350f;
  --color-danger: #f87171;
  --color-danger-soft: #7f1d1d;
  --color-info: #38bdf8;
  --color-info-soft: #0c4a6e;
}

/* Základní styly pro <body> */
body {
  font-family: ui-sans-serif, system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: var(--color-background);
  color: var(--color-foreground);
}

/* Plynulé přepnutí tématu */
html {
  transition: background-color 0.15s ease, color 0.15s ease;
}

/* ---------------- Komponentní třídy ---------------- */

@layer components {
  .input {
    width: 100%;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    background: var(--color-input);
    color: var(--color-foreground);
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }
  .input:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-primary) 20%, transparent);
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border-radius: 0.75rem;
    padding: 0.625rem 1rem;
    font-weight: 600;
    transition: background 0.15s ease;
  }
  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }
  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* ---------------- Typografie obsahu ---------------- */

.prose-cms {
  line-height: 1.75;
  color: var(--color-foreground);
  word-wrap: break-word;
}
.prose-cms h1, .prose-cms h2, .prose-cms h3, .prose-cms h4 {
  color: var(--color-foreground);
  font-weight: 700;
  line-height: 1.25;
  margin: 1.4em 0 0.6em;
}
.prose-cms h1 { font-size: 2rem; }
.prose-cms h2 { font-size: 1.5rem; }
.prose-cms h3 { font-size: 1.25rem; }
.prose-cms p { margin: 0.9em 0; }
.prose-cms a { color: var(--color-primary); text-decoration: underline; }
.prose-cms ul { list-style: disc; padding-left: 1.5rem; margin: 0.9em 0; }
.prose-cms ol { list-style: decimal; padding-left: 1.5rem; margin: 0.9em 0; }
.prose-cms blockquote {
  border-left: 4px solid var(--color-primary);
  background: var(--color-muted);
  padding: 0.5rem 1rem;
  margin: 1em 0;
  font-style: italic;
}
.prose-cms pre {
  background: var(--color-card);
  color: var(--color-foreground);
  padding: 1rem;
  border-radius: 0.75rem;
  overflow-x: auto;
  font-size: 0.85rem;
  margin: 1em 0;
  border: 1px solid var(--color-border);
}
.prose-cms code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.875em;
}
.prose-cms :not(pre) > code {
  background: var(--color-muted);
  padding: 0.15em 0.4em;
  border-radius: 0.35rem;
}
.prose-cms img, .prose-cms video, .prose-cms iframe {
  max-width: 100%;
  border-radius: 0.75rem;
  margin: 1em 0;
}
.prose-cms figure figcaption {
  font-size: 0.8rem;
  color: var(--color-muted-foreground);
  text-align: center;
}
.prose-cms table { width: 100%; border-collapse: collapse; margin: 1em 0; }
.prose-cms th, .prose-cms td {
  border: 1px solid var(--color-border);
  padding: 0.5rem;
}

