# FlatCMS – Plugin API

**Verze:** 2.0 (Etapa 2C)
**Datum:** 29. 9. 2026

---

## Co je plugin

Plugin je složka v `plugins/` s manifestem `plugin.json` a modulem `index.mjs`:

```

plugins/muj-plugin/
├── plugin.json    ← manifest
└── index.mjs      ← kód pluginu (ES modul)

```

**Bezpečnost:** Pluginy **nejsou sandboxované**. Jsou to **důvěryhodné moduly se stejnými právy jako CMS**. Neinstalují se uploadem uživatelů – adresář `plugins/` spravuje pouze provozovatel serveru.

---

## Manifest (`plugin.json`)

```json
{
  "id": "muj-plugin",
  "name": "Můj plugin",
  "version": "1.0.0",
  "author": "Jan Novák",
  "description": "Stručný popis pluginu",
  "priority": 100,
  "timeout": 5000,
  "hooks": ["beforePageSave", "adminHeaderRender"],
  "configFields": [
    { "key": "nastaveni1", "label": "Nastavení 1", "type": "text", "default": "" }
  ]
}
```

### Pole manifestu

| Pole ↕▾ | Povinné ↕▾ | Popis ↕▾ |
|---|---|---|
| −`id` | ✅ | Unikátní ID (bez mezer, malá písmena) |
| −`name` | ✅ | Lidský název |
| −`version` | ✅ | Verze (`major.minor.patch`) |
| −`author` | ❌ | Autor |
| −`description` | ❌ | Popis |
| −`priority` | ❌ | Nižší = dřívější spuštění. Výchozí `100`. |
| −`timeout` | ❌ | Max ms na jeden hook. Výchozí `5000`. |
| −`hooks` | ❌ | Seznam hooků (informativní, pomáhá v admin) |
| −`configFields` | ❌ | Pole pro admin (klíč, popisek, typ, výchozí hodnota) |
⚙

---

## Struktura modulu (`index.mjs`)

```
export default {
  id: "muj-plugin",
  name: "Můj plugin",
  version: "1.0.0",

  hooks: {
    beforePageSave(payload, ctx) { /* ... */ },
    adminHeaderRender(payload, ctx) { /* ... */ },
  },
};
```

---

## Hooky – přehled

### 1. Obsah (transform hooky)

| Hook ↕▾ | Payload ↕▾ | Co vrací ↕▾ | Kdy se volá ↕▾ |
|---|---|---|---|
| −`beforePageSave` | `{ article }` | `{ article }` | Před uložením článku |
| −`afterPageSave` | `{ article }` | – | Po uložení článku |
| −`beforePageDelete` | `{ article, path }` | `{ extra: { blocked } }` | Před smazáním |
| −`afterPageDelete` | `{ article, path }` | – | Po smazání |
| −`beforePageMove` | `{ path, newPath }` | `{ extra: { blocked } }` | Před přejmenováním |
| −`afterPageMove` | `{ path, newPath }` | – | Po přejmenování |
| −`beforePageRender` | `{ article }` | `{ article }` | Před renderem |
| −`afterPageRender` | `{ article, html }` | `{ html }` | Po renderu |
⚙

### 2. Uživatelé

| Hook ↕▾ | Payload ↕▾ | Co vrací ↕▾ | Kdy se volá ↕▾ |
|---|---|---|---|
| −`beforeUserCreate` | `{ extra: { input } }` | `{ extra: { blocked, reason } }` | Před vytvořením |
| −`afterUserCreate` | `{ extra: { user } }` | – | Po vytvoření |
| −`beforeUserDelete` | `{ extra: { userId } }` | `{ extra: { blocked } }` | Před smazáním |
| −`afterUserDelete` | `{ extra: { userId } }` | – | Po smazání |
⚙

### 3. Přihlášení

| Hook ↕▾ | Payload ↕▾ | Co vrací ↕▾ | Kdy se volá ↕▾ |
|---|---|---|---|
| −`beforeLogin` | `{ extra: { username, ip } }` | `{ extra: { blocked, reason } }` | Před ověřením |
| −`afterLogin` | `{ extra: { userId, username } }` | – | Po úspěchu |
| −`afterLoginFailed` | `{ extra: { username, ip, reason } }` | – | Po neúspěchu |
⚙

### 4. Média

| Hook ↕▾ | Payload ↕▾ | Co vrací ↕▾ | Kdy se volá ↕▾ |
|---|---|---|---|
| −`beforeFileUpload` | `{ fileName }` | – | Před uložením souboru |
| −`afterFileUpload` | `{ fileName, path }` | – | Po uložení |
| −`beforeMediaDelete` | `{ path }` | `{ extra: { blocked } }` | Před smazáním média |
| −`afterMediaDelete` | `{ path }` | – | Po smazání |
| −`beforeFolderCreate` | `{ path }` | `{ extra: { blocked } }` | Před vytvořením složky |
| −`afterFolderCreate` | `{ path }` | – | Po vytvoření |
⚙

### 5. Systém

| Hook ↕▾ | Payload ↕▾ | Co vrací ↕▾ | Kdy se volá ↕▾ |
|---|---|---|---|
| −`onSettingsLoad` | `{}` | `{ extra: { settings } }` | Po načtení nastavení |
| −`onSettingsSave` | `{ extra: { patch } }` | `{ extra: { patch } }` | Před uložením nastavení |
⚙

### 6. Rendering (HTML)

Tyto hooky **vracejí `{ html: "..." }`** a jejich výsledky se vkládají do stránky.

| Hook ↕▾ | Kde se zobrazí ↕▾ |
|---|---|
| −`adminHeaderRender` | Hlavička administrace |
| −`adminFooterRender` | Patička administrace |
| −`siteHeadRender` | `<head>` veřejného webu |
| −`siteFooterRender` | Patička veřejného webu |
⚙

### 7. Collect hooky

Tyto hooky **vracejí strukturovaná data** (objekt nebo pole). Používají se pro rozšíření UI.

#### `registerAdminMenu`

Vrací položku menu:

```
registerAdminMenu() {
  return {
    href: "/admin/moje-stranka",
    label: "Moje stránka",
    icon: "🎓",
    position: 90,
  };
}
```

Nebo pole položek:

```
registerAdminMenu() {
  return [
    { href: "/admin/a", label: "A", icon: "🅰️", position: 10 },
    { href: "/admin/b", label: "B", icon: "🅱️", position: 20 },
  ];
}
```

#### `registerEditorToolbar`

Vrací položku toolbaru editoru:

```
registerEditorToolbar(payload, ctx) {
  // payload.extra.editorType = "markdown" | "wysiwyg" | "block" | "html"
  return {
    id: "emoji-picker",
    label: "Emoji",
    icon: "😀",
    action: "insertEmoji",   // string, klient si to namapuje
    position: 50,
  };
}
```

#### `registerSettings`

Vrací sekci v nastavení:

```
registerSettings() {
  return {
    id: "muj-plugin",
    title: "Nastavení mého pluginu",
    description: "Konfigurace pluginu",
    fields: [
      { key: "apiKey", label: "API klíč", type: "text", default: "" },
      { key: "enabled", label: "Zapnuto", type: "boolean", default: "true" },
    ],
  };
}
```

---

## Kontext pluginu (`ctx`)

Každý hook dostane jako druhý argument kontext:

```
interface PluginContext {
  settings: Settings;                     // globální nastavení webu
  config: Record<string, string>;         // konfigurace z manifest configFields
  user?: PublicUser | null;               // aktuální uživatel (pokud je přihlášen)
}
```

---

## Řetězení payloadu

**Transform hooky** se volají v pořadí podle priority. **Výstup jednoho je vstupem dalšího**:

```
beforePageSave(payload) →
  plugin A (priority 50):  { article: {...změny A...} }
  plugin B (priority 100): { article: {...změny B...} }
  plugin C (priority 200): { article: {...změny C...} }
→ finální { article }
```

**Důležité:** Pokud plugin vyhodí chybu, **zapíše se do konzole, ale řetězení pokračuje**. Chyba jednoho pluginu nezastaví ostatní.

---

## Timeouty

Každý hook má timeout (výchozí `5000 ms`, lze změnit v manifestu). Pokud hook nedoběhne včas, je **přerušen a zaznamenán**, ale řetězení pokračuje.

**Tip:** Pro pomalé operace (volání API, čtení velkých souborů) nastavte vyšší timeout:

```
{ "timeout": 30000 }
```

---

## Izolace chyb

**Chyba jednoho pluginu nezastaví ostatní.** Všechny chyby se zapisují do konzole serveru:

```
[plugin:seo-tools] hook 'beforePageSave' selhal: Nějaká chyba
```

Pokud chcete chybu vidět, sledujte terminál, kde běží `npm run dev`.

---

## Příklady

Viz `plugins/`:

- `seo-tools/` – 3 hooky (beforePageSave, siteHeadRender, adminHeaderRender)
- `custom-analytics/` – 2 hooky (afterPageRender, siteFooterRender)
- `example-hooks/` – 7 hooků (kompletní ukázka)

---

## Bezpečnostní pravidla

1. **Pluginy mají plná práva** – instalujte jen důvěryhodné.
2. **Konfigurace se ukládá do `data/plugins.json`** – pokud tam jsou hesla, chraňte soubor.
3. **Plugin nikdy neupravuje soubory mimo CMS** – pokud to nedělá záměrně.
4. **Nikdy nespouštějte plugin od neznámého autora.**

---

## Tipy a triky

### Jak zjistit, jaké hooky plugin používá

V manifestu uvedete `hooks: [...]` – FlatCMS to zobrazí v administraci.

### Jak debugovat plugin

Přidejte `console.log` do `index.mjs`. Uvidíte výstup v terminálu serveru.

### Jak zakázat plugin

V administraci → Pluginy → přepnout na Vypnuto. Nebo smazat `data/plugins.json`.

### Jak plugin vyzkoušet bez zapnutí

Přepište `enabled: false` v `data/plugins.json` a restartujte server.

---

## Co bude dál

V dalších etapách přibudou:

- **`registerEditorToolbar`** s vizuálním napojením na klienty (teď se předává jako data)
- **Hooky pro skryté stránky** (`beforeHiddenPageAccess`)
- **Hooky pro LLDAP** (`beforeLogin` už existuje)
- **Hooky pro AI** (např. `beforeAiPrompt`)

---

**Otázky?** Podívejte se na `plugins/example-hooks/index.mjs` – obsahuje kompletní ukázku všech typů hooků.

</BDS:create_file>

<BDS:create_file fileName="NAVOD-2C.md">

```markdown
# Etapa 2C – Rozšíření hooků

**Datum:** 29. 9. 2026
**Co to přináší:** Z 8 hooků na 24, izolace chyb, timeouty, priority, collect hooky

---

## Co je nového

### 1. Více hooků (8 → 24)

**Obsah:**
- `beforePageDelete`, `afterPageDelete` (smazání)
- `beforePageMove`, `afterPageMove` (přejmenování)

**Uživatelé:**
- `beforeUserCreate`, `afterUserCreate`
- `beforeUserDelete`, `afterUserDelete`

**Přihlášení:**
- `beforeLogin`, `afterLogin`, `afterLoginFailed`

**Média:**
- `afterFileUpload`, `beforeMediaDelete`, `afterMediaDelete`
- `beforeFolderCreate`, `afterFolderCreate`

**Systém:**
- `onSettingsLoad`, `onSettingsSave`

**Rendering:**
- `adminFooterRender`

### 2. Collect hooky (nová kategorie)

Pro rozšíření UI pluginy vrací **strukturovaná data**:
- `registerAdminMenu` – přidá položku do menu administrace
- `registerEditorToolbar` – přidá tlačítko do editoru
- `registerSettings` – přidá sekci do nastavení

### 3. Rozšířený plugin manager

- **Priority** – nižší číslo = dřívější spuštění
- **Timeouty** – každý hook max N ms (výchozí 5 s)
- **Izolace chyb** – chyba jednoho pluginu nezastaví ostatní

---

## Postup aplikace (5 minut)

### 1. Zastav server
`Ctrl + C` v terminálu.

### 2. Zkopíruj soubory

**Přepiš:**
- `src/lib/types.ts`
- `src/lib/plugins.ts`
- `src/app/actions.ts`

**Přidej (nové):**
- `plugins/example-hooks/plugin.json`
- `plugins/example-hooks/index.mjs`

**Aktualizuj (existující pluginy):**
- `plugins/seo-tools/plugin.json`
- `plugins/seo-tools/index.mjs`
- `plugins/custom-analytics/plugin.json`
- `plugins/custom-analytics/index.mjs`

**Dokumentace:**
- `PLUGIN-API.md` – kompletní dokumentace plugin API
- `NAVOD-2C.md` – tento soubor

### 3. Restartuj server
```bash
npm run dev

### 4. Otestuj

**Test 1: Nový plugin `example-hooks`**

1. Jdi do **Pluginy** (`/admin/plugins`)
2. Uvidíš nový plugin **„Příklad nových hooků"**
3. Zapni ho
4. V hlavičce administrace se objeví modrý badge **„Example-hooks aktivní"** ✅
5. V menu administrace přibude **„Ukázkový plugin"** (🎓) ✅

**Test 2: Hook `beforePageDelete`**

1. Vytvoř článek a přidej mu tag **`chraneno`**
2. Zkus ho smazat
3. **Smazání se nezdaří** – plugin to zablokuje ✅
4. Smaž tag `chraneno`, ulož, zkus smazat znovu
5. **Smazání proběhne** ✅

**Test 3: Hook `afterLogin`**

1. Odhlas se
2. Přihlas se znovu
3. V terminálu uvidíš: `[example-hooks] Přihlášen uživatel: admin` ✅

**Test 4: Timeout**

V `plugins/example-hooks/plugin.json` změň `"timeout": 1`. Restartuj, zkus uložit článek. V konzoli uvidíš:

```
[plugin:example-hooks] hook 'beforePageSave' selhal: [plugin:example-hooks] timeout po 1 ms
```

Ale **uložení proběhne** – chyba je izolovaná. ✅

Vrať `timeout` na `3000`.

---

## Co teď můžeš dělat

### Psát vlastní pluginy

Viz `PLUGIN-API.md` – kompletní dokumentace.

**Nejjednodušší plugin (přidá patičku):**

```
// plugins/moje-paticka/index.mjs
export default {
  id: "moje-paticka",
  name: "Moje patička",
  version: "1.0.0",
  hooks: {
    siteFooterRender() {
      return { html: '<p>© 2026 Můj web</p>' };
    },
  },
};
```

A k tomu `plugin.json`:

```
{
  "id": "moje-paticka",
  "name": "Moje patička",
  "version": "1.0.0",
  "hooks": ["siteFooterRender"]
}
```

Zapni plugin v admin → hotovo.

### Použít existující pluginy jako referenci

- `plugins/seo-tools/` – transform hook + render hook
- `plugins/custom-analytics/` – render hook
- `plugins/example-hooks/` – **všechny typy hooků**

---

## Co je připraveno pro další etapy

| Etapa ↕▾ | Co potřebuje ↕▾ | Je v 2C? ↕▾ |
|---|---|---|
| −**2D** (skryté stránky) | `beforePageDelete`, `afterLogin` | ✅ |
| −**2E** (LLDAP) | `beforeLogin`, `afterLogin`, `afterLoginFailed` | ✅ |
| −**3** (editor) | `registerEditorToolbar` | ✅ |
| −**5** (AI) | `beforePageSave`, `registerEditorToolbar` | ✅ |
⚙

**Všechny budoucí pluginy mají teď potřebné hooky.**

---

## Kdyby něco nešlo

**Plugin se nezobrazí v admin**
→ Zkontroluj, že má platný `plugin.json` a `index.mjs`.
→ Podívej se do terminálu, jestli tam není chyba.

**Collect hook (registerAdminMenu) nic nedělá**
→ To je normální – v Etapě 2C se **data předávají, ale UI je ještě nezobrazuje**.
→ Napojení na admin menu proběhne v Etapě 3 (spolu s novým editorem).
→ Data ale můžeš použít ručně: `await collectAdminMenu(user)` v `admin/layout.tsx`.

**Timeout shazuje i jiné pluginy**
→ Neměl by. Zkontroluj, že máš aktuální `src/lib/plugins.ts`.

**Chyba `Cannot find module 'example-hooks'`**
→ Zkontroluj, že je plugin ve správné složce `plugins/example-hooks/`.
→ Restartuj server (`Ctrl+C`, `npm run dev`).

---

## Co dál

Teď jsi připraven na:

- **Etapa 2D** – skryté stránky (tokeny, heslo, expirace)
- **Etapa 2E** – LLDAP integrace
- **Etapa 3** – moderní editor (TinyMCE + napojení `registerEditorToolbar`)

**Doporučuji 2D**, protože máš konkrétní potřebu (CV).

