# Návod – jak aplikovat Etapu 2A + 2B

**Předpoklad:** Máš aplikovanou Etapu 1 (bezpečnostní opravy).

**Odhadovaný čas:** 20 minut

---

## Krok 1 – Zkopíruj soubory

### Přepiš existující:

| Nový soubor | Nahrazuje |
|-------------|-----------|
| `src/app/globals.css` | `src/app/globals.css` |
| `src/app/layout.tsx` | `src/app/layout.tsx` |
| `src/app/admin/layout.tsx` | `src/app/admin/layout.tsx` |
| `src/app/admin/login/LoginForm.tsx` | stejné |
| `src/app/admin/page.tsx` | stejné |
| `src/app/actions.ts` | stejné |

### Přidej nové:

| Nový soubor | Kam |
|-------------|-----|
| `src/lib/i18n.ts` | nový |
| `src/messages/cs.json` | nová složka |
| `src/messages/en.json` | nová složka |
| `src/messages/sk.json` | nová složka |
| `src/components/providers/theme-provider.tsx` | nová složka |
| `src/components/providers/i18n-provider.tsx` | nová složka |
| `src/components/theme-switcher.tsx` | nový |
| `src/components/locale-switcher.tsx` | nový |

---

## Krok 2 – Zkontroluj tsconfig

Otevři `tsconfig.json` a ověř, že obsahuje:
```json
"resolveJsonModule": true
```

Pokud ne, přidej to do `compilerOptions`. (V původním projektu Claude to už je.)

---

## Krok 3 – Restartuj server

```
npm run dev
```

---

## Krok 4 – Otestuj tmavý režim

1. Otevři http://localhost:3000/admin/login
2. Vpravo nahoře uvidíš **dvě tlačítka**: vlajka 🇨🇿 a slunce ☀️
3. Klikni na slunce → vyber **Tmavý** 🌙
4. **Celá stránka ztmavne** ✅
5. Obnov stránku (F5) — zůstane tmavá ✅
6. Klikni na **Podle systému** 💻 — přepne se podle nastavení OS

---

## Krok 5 – Otestuj jazyk

1. Klikni na vlajku 🇨🇿
2. Vyber **English** 🇬🇧
3. **Celá stránka se přeloží do angličtiny** ✅
4. Přihlas se (login je anglicky)
5. V administraci uvidíš anglickou navigaci ✅
6. Klikni na 🇬🇧 → vyber **Slovenčina** 🇸🇰
7. Vše se přeloží do slovenštiny ✅

---

## Krok 6 – Zkontroluj, že ostatní funguje

- **Přihlášení** funguje (rate limiting je aktivní)
- **Dashboard** se zobrazuje
- **Tmavý režim** se aplikuje i na dashboard, ne jen login
- **Přepínače** jsou v hlavičce administrace, ne jen v login

---

## Krok 7 – Co dělat, když něco nefunguje

**Chyba: `Cannot find module '@/messages/cs.json'`**
→ Zkontroluj, že `tsconfig.json` má `"resolveJsonModule": true`.
→ Zkontroluj, že soubory jsou opravdu ve `src/messages/`.

**Chyba: `useT musí být použito uvnitř <I18nProvider>`**
→ Někde používáš `useT()` v komponentě, která není uvnitř provideru.
→ Provider je v `src/app/layout.tsx` — ověř, že je tam správně.

**Tmavý režim bliká při načtení**
→ Inline skript v `<head>` nefunguje. Ověř, že v `layout.tsx` je `<script dangerouslySetInnerHTML={{__html: themeBootstrapScript(defaultTheme)}} />`.

**Přepínač jazyka nic nedělá**
→ Cookie se neukládá. Zkontroluj, že `setLocaleAction` je v `actions.ts` a že ji `LocaleSwitcher` importuje.

**Texty jsou stále česky, i když mám English**
→ Přeložili jsme jen login, layout a dashboard. Ostatní stránky jsou zatím jen česky. Postup pro jejich překlad najdeš v `MIGRACE.md`.

---

## Krok 8 – Co dál

Máš teď:

- ✅ Tmavý režim s přepínačem
- ✅ Tři jazyky (CZ/EN/SK)
- ✅ Snadné přidání dalšího jazyka
- ✅ Moderní architekturu s providery

**Zbývá přeložit:**

- Editor článku
- Správa obsahu
- Správa souborů
- Pluginy
- Uživatelé
- Nastavení

Postup najdeš v `MIGRACE.md`.

A pak hurá na **Etapu 2C – rozšíření hooků**! 🎉

---

**Hodně štěstí!**

</BDS:create_file>

<BDS:create_file fileName="MIGRACE.md">

```markdown
# Migrace – jak přeložit a přebarvit zbývající komponenty

Tento dokument je **pracovní checklist** pro překlad a tmavý režim zbývajících obrazovek. Nemusíš to udělat najednou — jde to postupně.

---

## Principy

### 1. Barvy — nahraď přímé Tailwind třídy sémantickými

| Místo (světlé) | Použij (sémantické) |
|---|---|
| `bg-slate-100` | `bg-background` |
| `bg-white` | `bg-card` |
| `text-slate-900` | `text-foreground` |
| `text-slate-500` | `text-muted-foreground` |
| `border-slate-200` | `border-border` |
| `bg-indigo-600 text-white` | `bg-primary text-primary-foreground` |
| `text-indigo-600` | `text-primary` |
| `bg-indigo-50` | `bg-primary-soft` |
| `bg-rose-50 text-rose-700` | `bg-danger-soft text-danger` |
| `bg-emerald-100 text-emerald-700` | `bg-success-soft text-success` |
| `bg-slate-50` | `bg-muted` |

### 2. Texty — přesuň do `messages/*.json` a použij `t("klíč")`

**Před:**
```tsx
<h1>Správa obsahu</h1>
<p>Stromová struktura složky content/</p>

**Po:**

```
const t = useT(); // nebo getT(locale) pro server komponenty
<h1>{t("content.title")}</h1>
<p>{t("content.subtitle")}</p>
```

A do `messages/cs.json`:

```
{
  "content": {
    "title": "Správa obsahu",
    "subtitle": "Stromová struktura složky content/"
  }
}
```

A do `messages/en.json`, `messages/sk.json` překlad.

---

## Checklist po souborech

### ✅ Hotové

- ☑  
`src/app/layout.tsx`
- ☑  
`src/app/admin/layout.tsx`
- ☑  
`src/app/admin/login/LoginForm.tsx`
- ☑  
`src/app/admin/page.tsx` (dashboard)
- ☑  
`src/app/actions.ts`

### 📝 Zbývá přeložit a přebarvit

#### Priorita 1 – viditelné často

- □  
`src/app/admin/content/page.tsx` — seznam obsahu
- □  
`src/app/admin/content/edit/page.tsx` — úprava článku
- □  
`src/app/admin/content/new/page.tsx` — nový článek
- □  
`src/components/editors/ArticleForm.tsx` — formulář článku

#### Priorita 2 – občas viditelné

- □  
`src/app/admin/files/page.tsx` — správce souborů
- □  
`src/app/admin/settings/page.tsx` — nastavení
- □  
`src/app/admin/users/page.tsx` — uživatelé

#### Priorita 3 – méně často

- □  
`src/app/admin/plugins/page.tsx` — pluginy
- □  
`src/components/file-manager/MediaPicker.tsx`
- □  
`src/components/file-manager/Uploader.tsx`

#### Priorita 4 – veřejný web

- □  
`src/app/(site)/layout.tsx`
- □  
`src/app/(site)/page.tsx`
- □  
`src/app/(site)/[...slug]/page.tsx`

---

## Jak přeložit server komponentu

Server komponenty (ty, co nemají `"use client"`) nemohou použít `useT()`.
Použij `getT()`:

```
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isValidLocale, getT, type Locale } from "@/lib/i18n";

async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const v = store.get(LOCALE_COOKIE)?.value;
  return v && isValidLocale(v) ? v : DEFAULT_LOCALE;
}

export default async function MyPage() {
  const locale = await getLocale();
  const t = getT(locale);
  return <h1>{t("muj.nadpis")}</h1>;
}
```

---

## Jak přeložit client komponentu

Client komponenty (s `"use client"`) použijí `useT()`:

```
"use client";
import { useT } from "@/components/providers/i18n-provider";

export default function MyComponent() {
  const t = useT();
  return <h1>{t("muj.nadpis")}</h1>;
}
```

---

## Jak přidat nový klíč do překladů

1. Otevři `src/messages/cs.json`
2. Přidej novou sekci nebo klíč:

```
"content": {
  "title": "Správa obsahu",
  "noContent": "Zatím žádný obsah."
}
```
3. Otevři `src/messages/en.json` a přidej stejnou strukturu:

```
"content": {
  "title": "Content management",
  "noContent": "No content yet."
}
```
4. Totéž pro `sk.json`.
5. V komponentě použij `t("content.title")`.

---

## Jak přidat úplně nový jazyk

Například francouzštinu (fr):

1. Zkopíruj `src/messages/cs.json` → `src/messages/fr.json`
2. Přelož hodnoty ve `fr.json`
3. Otevři `src/lib/i18n.ts`:

```
import fr from "@/messages/fr.json";
const bundles = { cs, en, sk, fr };
export const LOCALES: Locale[] = ["cs", "en", "sk", "fr"];
export const LOCALE_LABELS: Record<Locale, string> = {
  cs: "Čeština",
  en: "English",
  sk: "Slovenčina",
  fr: "Français",  // ← přidej
};
export const LOCALE_FLAGS: Record<Locale, string> = {
  cs: "🇨🇿",
  en: "🇬🇧",
  sk: "🇸🇰",
  fr: "🇫🇷",  // ← přidej
};
```
4. Otevři `src/components/providers/i18n-provider.tsx`:

```
import fr from "@/messages/fr.json";
const bundles = { cs, en, sk, fr };
```
5. **Hotovo.** Přepínač ji automaticky nabídne.

**Doba práce:** 1–3 hodiny podle délky překladu.

---

## Návrh dalšího klíče (pro rozšíření)

Až budeš přidávat nové překlady, drž se tohoto schématu:

```
{
  "common": { ... },           // Sdílené (Uložit, Zrušit, ...)
  "login": { ... },            // Přihlášení
  "admin": {
    "nav": { ... },            // Navigace
    "dashboard": { ... },      // Dashboard
    "content": { ... },        // Správa obsahu
    "files": { ... },          // Správa souborů
    "plugins": { ... },        // Pluginy
    "users": { ... },          // Uživatelé
    "settings": { ... }        // Nastavení
  },
  "editor": { ... },           // Editor článku
  "public": { ... },           // Veřejný web
  "role": { ... },             // Názvy rolí
  "theme": { ... },            // Témata
  "locale": { ... }            // Jazyky
}
```

Dodržováním tohoto schématu zůstane kód přehledný, i když bude překladů hodně.

---

## Závěr

**Nemusíš to dělat všechno najednou.** Stačí:

- Každý den přeložit jednu obrazovku
- Za týden máš hotovo
- A při každé další obrazovce to jde rychleji (protože znáš vzor)

**Tip:** Nejdřív si projdi jednu komponentu od začátku do konce (třeba `content/page.tsx`). Uvidíš celý proces. Pak už to bude rutina.

**Pamatuj:** Barvy a texty **nikdy nepiš napevno do komponent.** Když je budeš psát do JSON souborů, ušetříš si v budoucnu spoustu práce.

