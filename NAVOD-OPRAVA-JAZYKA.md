# Oprava priority jazyka

**Datum:** 28. 9. 2026
**Problém:** Globální nastavení jazyka se ignorovalo

---

## Co bylo špatně

V `layout.tsx` a `admin/layout.tsx` se jazyk četl **jen z cookie**:

```tsx
async function getLocaleFromCookie(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (value && isValidLocale(value)) return value;
  return DEFAULT_LOCALE;  // ← vždy "cs"
}
```

Když uživatel **neměl cookie** (nový prohlížeč, anonymní okno, po smazání cookie), funkce vrátila `"cs"` – **bez ohledu na to, co bylo v `settings.language`**.

**Důsledek:** V nastavení jsi přepnul jazyk na EN, ale aplikace se stejně zobrazila česky, protože:

1. Cookie neexistuje → `getLocaleFromCookie` vrátí „cs"
2. `settings.language` se **nikdy nepřečte**

---

## Jak jsme to opravili

V `src/lib/i18n.ts` je nová funkce `getPreferredLocale()`, která čte v tomto pořadí:

```
1. Cookie `flatcms_locale`   ← osobní volba uživatele (nejvyšší priorita)
2. settings.language          ← globální výchozí hodnota z administrace
3. "cs"                       ← poslední záchrana
```

**Tuto funkci nyní používají:**

- `src/app/layout.tsx` (root layout)
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx` (dashboard)
- `src/app/admin/settings/page.tsx`

---

## Postup aplikace (2 minuty)

### 1. Zastav server

`Ctrl + C` v terminálu.

### 2. Zkopíruj soubory

**Přepiš:**

- `src/lib/i18n.ts`
- `src/app/layout.tsx`
- `src/app/admin/layout.tsx`
- `src/app/admin/page.tsx`
- `src/app/admin/settings/page.tsx`

### 3. Restartuj server

```
npm run dev
```

### 4. Otestuj

**Test 1: Globální jazyk**

1. Otevři **anonymní okno** (Ctrl+Shift+N)
2. Jdi na http://localhost:3000/admin/settings
3. Přihlas se (`admin` / `H@rad82H@rad`)
4. Změň **Výchozí jazyk** na `English`
5. Uložit
6. Obnov stránku (F5)
7. **Celá administrace se přeloží do angličtiny** ✅

**Test 2: Osobní volba má přednost**

1. V anonymním okně klikni na 🇬🇧 vpravo nahoře → vyber **Slovenčina** 🇸🇰
2. Obnov stránku
3. **Administrace bude slovensky** (osobní volba přebila globální EN) ✅
4. Klikni na 🇸🇰 → vyber **English** 🇬🇧
5. **Administrace bude anglicky** ✅

**Test 3: Vymazat mou volbu**

1. V nastavení klikni na **Vymazat mou volbu**
2. **Administrace se vrátí k angličtině** (globální hodnota) ✅

---

## Kdyby něco nešlo

**Pořád je to česky**
→ Zkontroluj, že `src/lib/i18n.ts` obsahuje funkci `getPreferredLocale`.
→ Zkontroluj, že `src/app/layout.tsx` importuje `getPreferredLocale`, ne `DEFAULT_LOCALE`.

**V konzoli chyba `getPreferredLocale is not a function`**
→ Nezkopíroval jsi nový `i18n.ts`. Zkontroluj soubor.

**Změna jazyka v nastavení se neprojeví**
→ Máš v prohlížeči cookie `flatcms_locale` z dřívějška. Klikni na **Vymazat mou volbu** nebo otevři anonymní okno.

**Slovenština nefunguje, angličtina ano**
→ Zkontroluj, že `src/messages/sk.json` obsahuje klíč `settings.title` a další.
→ Pokud chybí překlady, ukáže se klíč místo textu (např. `settings.title`).

---

## Poučení

> **Vícevrstvé nastavení má vždy jasnou prioritu.** Když ji nemá, vzniká zmatek. Naše pravidlo: **osobní > globální > výchozí**. Toto pravidlo je nyní v kódu na jednom místě (`getPreferredLocale`), takže ho nelze omylem obejít.

> **Když přidáváš novou vrstvu nastavení, vždy zkontroluj, že se skutečně čte.** My jsme `settings.language` měli v JSONu, ale nikdo ho nečetl – to je klasická chyba.

