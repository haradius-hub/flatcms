# Etapa 2A+2B – doplnění chybějících souborů

**Datum:** 28. 9. 2026
**Problém:** Přepínač jazyka a vzhledu nic nedělá

---

## Co chybělo

Máš providery (`theme-provider.tsx`, `i18n-provider.tsx`) a updatované layouty. Ale pravděpodobně nemáš:

1. **`src/app/globals.css`** — definice CSS proměnných a sémantických barev
2. **`src/app/actions.ts`** — funkce `setLocaleAction` (ukládání volby jazyka)
3. **`src/app/admin/login/LoginForm.tsx`** — s `useT` a přepínači
4. **`src/app/admin/page.tsx`** — s `getT` a překladem

Bez nich:
- `bg-background` a `text-foreground` se nevygenerují → barvy zůstanou výchozí
- Přepínač jazyka nemá kam uložit volbu → po refreshi se vrátí na CZ
- Login a dashboard zůstanou v češtině

---

## Postup (3 minuty)

### 1. Zastav server
V terminálu `Ctrl + C`.

### 2. Zkopíruj 4 soubory
- `src/app/globals.css` ← **přepiš** (kritické!)
- `src/app/actions.ts` ← **přepiš**
- `src/app/admin/login/LoginForm.tsx` ← **přepiš**
- `src/app/admin/page.tsx` ← **přepiš**

### 3. Restartuj server
```bash
npm run dev
```

### 4. Otestuj

**Tmavý režim:**

1. Otevři http://localhost:3000/admin
2. Klikni na ☀️ vpravo nahoře → vyber **Tmavý** 🌙
3. **Celá stránka ztmavne** ✅
4. Obnov stránku (F5) — zůstane tmavá ✅

**Jazyk:**

1. Klikni na 🇨🇿 vpravo nahoře → vyber **English** 🇬🇧
2. **Navigace, login, dashboard se přeloží** ✅
3. Obnov stránku — zůstane anglicky ✅

---

## Kdyby to nešlo

**Tmavý režim nic nedělá i po přepsání globals.css**
→ Zkontroluj, že v prohlížeči (F12 → Elements) má `<html>` atribut `data-theme="dark"`.
→ Pokud ano, ale barvy se nemění, může být problém v tom, že Next.js drží starou cache. Zkus:

```
rm -rf .next
npm run dev
```

**Jazyk se po refreshi vrátí na CZ**
→ Zkontroluj, že v `actions.ts` je funkce `setLocaleAction`.
→ Zkontroluj v prohlížeči (F12 → Application → Cookies), jestli existuje `flatcms_locale`.

**V konzoli chyba `useT must be used within I18nProvider`**
→ `I18nProvider` není v `layout.tsx`. Zkontroluj, že root layout má:

```
<I18nProvider locale={locale}>{children}</I18nProvider>
```

**V konzoli chyba `Cannot find module '@/lib/i18n'`**
→ Zkontroluj, že soubor `src/lib/i18n.ts` existuje a že `tsconfig.json` má `resolveJsonModule: true`.

