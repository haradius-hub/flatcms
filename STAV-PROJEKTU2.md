> ⚠️ **ARCHIVNÍ DOKUMENT — NEŘÍDÍ SE PODLE NĚJ DALŠÍ VÝVOJ.**
>
> Aktuální cíle, priority a stav projektu jsou nově vedeny výhradně v [STAV-PROJEKTU.md](STAV-PROJEKTU.md). Tento dokument zachovává původní plán a historický kontext z 22. 10. 2026. Jeho procentuální odhad dokončení ani zaškrtnuté položky nejsou nezávisle ověřeným stavem aktuálního kódu.
>
> Při rozporu má vždy přednost STAV-PROJEKTU.md.

---

# FlatCMS — Stav projektu a plán

> **Verze:** 1.2.0 · **Aktualizováno:** 2026-10-22
> **Licence:** GPL-3.0-or-later
> **Stav:** Aktivní vývoj (~55 % hotovo)

---

## 1. Přehled

FlatCMS je moderní **flat-file CMS** bez databáze, postavený na Next.js 16, TypeScriptu a Tailwind CSS 4. Obsah i konfigurace žijí v souborech na disku. Cílem je **modulární systém**, kde jádro zůstává malé a hlavní tíhu rozšíření nesou **pluginy**.

**Cílová skupina:** Osobní weby, blogy, CV, malé firemní prezentace. Projekt míří k veřejnosti (GPLv3), není jen pro osobní potřebu.

---

## 2. Co je hotové (Etapa 1 + část Etapy 2)

### 2.1 Bezpečnost
- ✅ XSS sanitizace (DOMPurify) — veškerý výstup prochází `sanitizeHtml()`
- ✅ Scrypt hash hesel (ne MD5, ne SHA1)
- ✅ Rate limiting přihlášení
- ✅ CSP a bezpečnostní hlavičky
- ✅ Ochrana proti path traversal a symlink útokům
- ✅ Vynucený `FLATCMS_SECRET` — bez něj aplikace neběží

### 2.2 Obsah a struktura
- ✅ Flat-file úložiště (Markdown + YAML frontmatter)
- ✅ Neomezená stromová struktura (`blog/technologie/linux/servery/debian.md`)
- ✅ Automatické slugy bez diakritiky
- ✅ Naplánované publikování
- ✅ Koncepty a revize

### 2.3 Editory
- ✅ Markdown (live preview)
- ✅ Blokový editor (Gutenberg-style)
- ✅ HTML / Embed editor
- ❌ WYSIWYG (TinyMCE) — v plánu

### 2.4 Pluginy
- ✅ Modulární systém (`plugin.json` + `index.mjs`)
- ✅ 24 hooků
- ✅ Priority a timeouty
- ✅ Konfigurace v adminu
- ✅ Chybová izolace (chyba jednoho pluginu nezastaví ostatní)

### 2.5 Role a oprávnění
- ✅ Administrátor — vše
- ✅ Editor — veškerý obsah a média
- ✅ Autor — pouze vlastní články

### 2.6 Rozhraní
- ✅ Tmavý / světlý režim
- ✅ Vícejazyčné (CZ, EN, SK)
- ✅ Responzivní administrace i veřejný web
- ✅ Plná čeština od základu

### 2.7 Dokumentace
- ✅ `PLUGIN-API.md` — kompletní API pro pluginy
- ✅ `OPRAVY-BEZPECNOST.md` — bezpečnostní audit
- ✅ `README.md` — úvod a rychlý start

---

## 3. Co zbývá — plán etap

### Etapa 2D — Skryté stránky (priorita)

**Cíl:** Umožnit vytvářet stránky, které nejsou veřejně dostupné.

| Funkce | Popis |
|---|---|
| Token | Náhodný řetězec v URL (`/p/:token`) |
| Volitelné heslo | Dodatečná ochrana |
| Volitelná expirace | Stránka přestane být dostupná v daný čas |
| Neveřejná sekce `/private/*` | Za přihlášením (pro osobní dokumenty) |

**Použití:** CV — veřejná verze bez kontaktu, skrytá plná verze s tokenem.

**Odhad:** 1–2 týdny.

---

### Etapa 3 — Vylepšení použitelnosti

| Úkol | Popis | Odhad |
|---|---|---|
| WYSIWYG editor | TinyMCE — moderní vizuální editor | 1–2 týdny |
| LLDAP integrace | LDAP autentizace (centrální přihlášení) | 1 týden |
| Rozšíření hooků | Z 24 na ~30 (pro AI plugin a storage) | 1 týden |

---

### Etapa 4 — Storage abstrakce a modularita

**Cíl:** Umožnit volbu storage backendu bez zásahu do jádra. Hlavní tíha rozšíření na pluginech.

#### 4.1 Strategie

| Backend | Role | Závislost | Kdy |
|---|---|---|---|
| **flat-file** | Výchozí, vždy | `fs/promises`, `gray-matter` | Vždy |
| **SQLite** | Volitelný | `better-sqlite3` (optional) | 1000+ stránek |
| **PostgreSQL** | Plugin | `pg` (optional) | 10 000+ stránek, tým |
| **MariaDB / MySQL** | Plugin | `mysql2` (optional) | Alternativa k Postgres |

**Klíčové rozhodnutí:** Jádro **nezná** konkrétní backend. Zná jen rozhraní `StorageBackend`. Každý backend je **implementace** tohoto rozhraní. Plugin může přinést **vlastní backend** (Redis, MongoDB, cokoli).

#### 4.2 Rozhraní `StorageBackend`

```typescript
// src/lib/storage/types.ts
export interface StorageBackend {
  // Články
  getArticle(path: string): Promise<Article | null>;
  saveArticle(path: string, article: Article): Promise<void>;
  deleteArticle(path: string): Promise<void>;
  listArticles(filter?: ArticleFilter): Promise<Article[]>;
  getContentTree(): Promise<ContentNode[]>;

  // Uživatelé
  getUsers(): Promise<User[]>;
  saveUser(user: User): Promise<void>;

  // Nastavení
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;

  // Pluginy
  getPluginConfig(pluginId: string): Promise<PluginConfig | null>;
  savePluginConfig(pluginId: string, config: PluginConfig): Promise<void>;

  // Metadata
  readonly name: string;      // "flat-file" | "sqlite" | "postgres" | ...
  readonly version: string;
  init(): Promise<void>;      // inicializace (migrace, připojení)
  healthCheck(): Promise<boolean>;
}
```

#### 4.3 Fáze Etapy 4

| Fáze | Co obsahuje | Odhad |
|---|---|---|
| **4A — Abstrakce** | StorageBackend rozhraní, refaktor content/users/settings, flat-file jako první implementace, hook `storage:register`, migrační nástroje | 2–3 týdny |
| **4B — SQLite** | `better-sqlite3` jako optional dependency, implementace, admin přepínač | 1–2 týdny |
| **4C — Postgres/MariaDB** | Pluginy `plugins/postgres-storage/`, `plugins/mariadb-storage/`, migrace | 2–3 týdny |
| **4D — Ekosystém** | Šablona `example-storage`, `STORAGE-API.md`, testy | 1 týden |

#### 4.4 Konfigurace storage

```
{
  "storage": {
    "backend": "flat-file",
    "options": {}
  }
}
```

Přepnutí backendu = **explicitní akce s potvrzením** v adminu (Nastavení → Storage). Migrace flat-file → SQLite přečte soubory a zapíše do DB.

---

### Etapa 5 — AI plugin (jako plugin, ne v jádru)

**Cíl:** Volitelná AI podpora pro psaní, korekturu a SEO. Jádro o AI neví.

📄 **Detailní specifikace:** [`AI-PLUGIN-SPEC.md`](https://./AI-PLUGIN-SPEC.md)

#### 5.1 Režimy

| Režim | Kdy použít | Chování |
|---|---|---|
| `local` | Ollama na serveru | Vše lokálně, žádné náklady |
| `api` | Nemáš HW / chceš kvalitu | Cloud API, platíš tokeny |
| `hybrid` | Chceš obojí | Local pro lehké, API pro těžké + fallback |

#### 5.2 Funkce podle role

| Funkce ↕▾ | Autor ↕▾ | Editor ↕▾ | Admin ↕▾ |
|---|---|---|---|
| −Korektura (`proofread`) | ✅ | ✅ | ✅ |
| −Gramatika (`grammar`) | ✅ | ✅ | ✅ |
| −Slovník (`dictionary`) | ✅ | ✅ | ✅ |
| Stylistika (`styleHint`) | ✅ | ✅ | ✅ |
| Perex (`excerpt`) | ❌ | ✅ | ✅ |
| Shrnutí (`summary`) | ❌ | ✅ | ✅ |
| SEO titulek (`seoTitle`) | ❌ | ✅ | ✅ |
| Meta popis (`seoMeta`) | ❌ | ✅ | ✅ |
| Tagy (`tags`) | ❌ | ✅ | ✅ |
| Alt texty (`altText`) | ❌ | ✅ | ✅ |
| Překlad (`translate`) | ❌ | ✅ | ✅ |
| Vylepšení stylu (`rewrite`) | ❌ | ✅ | ✅ |
| Zkrátit/rozšířit (`resize`) | ❌ | ✅ | ✅ |
| Interní odkazy (`internalLinks`) | ❌ | ✅ | ✅ |
| Generování z osnovy | ❌ | ❌ | ✅ |
| Generování z promptu | ❌ | ❌ | ✅ |
| Chat asistent (`chat`) | ❌ | ❌ | ✅ |
| Analýza webu | ❌ | ❌ | ✅ |
| Konfigurace AI | ❌ | ❌ | ✅ |
| Dashboard (cost tracking) | ❌ | ❌ | ✅ |
⚙

**Poznámka:** Matice je výchozí, admin ji může přebít.

#### 5.3 Fáze AI pluginu

| Fáze ↕▾ | Co ↕▾ | Odhad ↕▾ |
|---|---|---|
| −**AI-1** | Ollama + OpenAI-compatible provider, nastavení, šifrování klíčů | 1–2 týdny |
| **AI-2** | Autor: korektura, gramatika, slovník, stylistika | 1 týden |
| **AI-3** | Editor: perex, SEO, překlad, rewrite, tagy | 2 týdny |
| **AI-4** | Admin: generování, chat asistent (RAG) | 2 týdny |
| **AI-5** | Cost tracking, kvóty, dashboard | 1 týden |
| **AI-6** | Vision (alt texty), případně generování obrázků | 1–2 týdny |
| **AI-7** | Testy (unit, integrační, Playwright) | 1 týden |
⚙

**Celkem:** ~8–10 týdnů postupně po Etapě 2D a Etapě 3.

#### 5.4 Bezpečnost AI

- 🔐 API klíče šifrované přes `FLATCMS_SECRET` (AES-GCM)
- 🛡️ AI výstup vždy projde `sanitizeHtml()` před uložením
- 👤 Role-based přístup (autor nemůže generovat obsah)
- ⚠️ Varování při odesílání obsahu do cloudu
- ⏱️ Rate limiting a timeouty (per-user i globální)
- 📊 Cost tracking s upozorněním při 80 % kvóty

---

### Etapa 6 — Testy a ekosystém

| Úkol | Popis |
|---|---|
| Playwright smoke + e2e | Základní scénáře (přihlášení, vytvoření článku, publikace) |
| Unit testy | `render.ts`, `auth.ts`, `storage/*`, `ai/*` |
| CI/CD | GitHub Actions — lint, typecheck, testy |
| Migrace z Bluditu | Import Markdown souborů z existujícího Bluditu |

---

## 4. Časová osa (orientační)
This diagram is empty.<svg id="mermaid-svg-16" width="100%" xmlns="http://www.w3.org/2000/svg" viewBox="-15.8 -15.8 979.0999999999999 347.6" style="max-width: 100%; display: block; transform-origin: 0px 0px 0px; user-select: none;" role="graphics-document document" height="100%" class="undefined mermaid-svg"><style>#mermaid-svg-16{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;fill:#ccc;}@keyframes edge-animation-frame{from{stroke-dashoffset:0;}}@keyframes dash{to{stroke-dashoffset:0;}}#mermaid-svg-16 .edge-animation-slow{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 50s linear infinite;stroke-linecap:round;}#mermaid-svg-16 .edge-animation-fast{stroke-dasharray:9,5!important;stroke-dashoffset:900;animation:dash 20s linear infinite;stroke-linecap:round;}#mermaid-svg-16 .error-icon{fill:#a44141;}#mermaid-svg-16 .error-text{fill:#ddd;stroke:#ddd;}#mermaid-svg-16 .edge-thickness-normal{stroke-width:1px;}#mermaid-svg-16 .edge-thickness-thick{stroke-width:3.5px;}#mermaid-svg-16 .edge-pattern-solid{stroke-dasharray:0;}#mermaid-svg-16 .edge-thickness-invisible{stroke-width:0;fill:none;}#mermaid-svg-16 .edge-pattern-dashed{stroke-dasharray:3;}#mermaid-svg-16 .edge-pattern-dotted{stroke-dasharray:2;}#mermaid-svg-16 .marker{fill:lightgrey;stroke:lightgrey;}#mermaid-svg-16 .marker.cross{stroke:lightgrey;}#mermaid-svg-16 svg{font-family:"trebuchet ms",verdana,arial,sans-serif;font-size:16px;}#mermaid-svg-16 p{margin:0;}#mermaid-svg-16 .mermaid-main-font{font-family:"trebuchet ms",verdana,arial,sans-serif;}#mermaid-svg-16 .exclude-range{fill:hsl(52.9411764706, 28.813559322%, 48.431372549%);}#mermaid-svg-16 .section{stroke:none;opacity:0.2;}#mermaid-svg-16 .section0{fill:hsl(52.9411764706, 28.813559322%, 58.431372549%);}#mermaid-svg-16 .section2{fill:#EAE8D9;}#mermaid-svg-16 .section1,#mermaid-svg-16 .section3{fill:#333;opacity:0.2;}#mermaid-svg-16 .sectionTitle0{fill:#F9FFFE;}#mermaid-svg-16 .sectionTitle1{fill:#F9FFFE;}#mermaid-svg-16 .sectionTitle2{fill:#F9FFFE;}#mermaid-svg-16 .sectionTitle3{fill:#F9FFFE;}#mermaid-svg-16 .sectionTitle{text-anchor:start;font-family:"trebuchet ms",verdana,arial,sans-serif;}#mermaid-svg-16 .grid .tick{stroke:lightgrey;opacity:0.8;shape-rendering:crispEdges;}#mermaid-svg-16 .grid .tick text{font-family:"trebuchet ms",verdana,arial,sans-serif;fill:#ccc;}#mermaid-svg-16 .grid path{stroke-width:0;}#mermaid-svg-16 .today{fill:none;stroke:#DB5757;stroke-width:2px;}#mermaid-svg-16 .task{stroke-width:2;}#mermaid-svg-16 .taskText{text-anchor:middle;font-family:"trebuchet ms",verdana,arial,sans-serif;}#mermaid-svg-16 .taskTextOutsideRight{fill:hsl(28.5714285714, 17.3553719008%, 86.2745098039%);text-anchor:start;font-family:"trebuchet ms",verdana,arial,sans-serif;}#mermaid-svg-16 .taskTextOutsideLeft{fill:hsl(28.5714285714, 17.3553719008%, 86.2745098039%);text-anchor:end;}#mermaid-svg-16 .task.clickable{cursor:pointer;}#mermaid-svg-16 .taskText.clickable{cursor:pointer;fill:#003163!important;font-weight:bold;}#mermaid-svg-16 .taskTextOutsideLeft.clickable{cursor:pointer;fill:#003163!important;font-weight:bold;}#mermaid-svg-16 .taskTextOutsideRight.clickable{cursor:pointer;fill:#003163!important;font-weight:bold;}#mermaid-svg-16 .taskText0,#mermaid-svg-16 .taskText1,#mermaid-svg-16 .taskText2,#mermaid-svg-16 .taskText3{fill:hsl(28.5714285714, 17.3553719008%, 86.2745098039%);}#mermaid-svg-16 .task0,#mermaid-svg-16 .task1,#mermaid-svg-16 .task2,#mermaid-svg-16 .task3{fill:hsl(180, 1.5873015873%, 35.3529411765%);stroke:#ffffff;}#mermaid-svg-16 .taskTextOutside0,#mermaid-svg-16 .taskTextOutside2{fill:lightgrey;}#mermaid-svg-16 .taskTextOutside1,#mermaid-svg-16 .taskTextOutside3{fill:lightgrey;}#mermaid-svg-16 .active0,#mermaid-svg-16 .active1,#mermaid-svg-16 .active2,#mermaid-svg-16 .active3{fill:#81B1DB;stroke:#ffffff;}#mermaid-svg-16 .activeText0,#mermaid-svg-16 .activeText1,#mermaid-svg-16 .activeText2,#mermaid-svg-16 .activeText3{fill:hsl(28.5714285714, 17.3553719008%, 86.2745098039%)!important;}#mermaid-svg-16 .done0,#mermaid-svg-16 .done1,#mermaid-svg-16 .done2,#mermaid-svg-16 .done3{stroke:grey;fill:lightgrey;stroke-width:2;}#mermaid-svg-16 .doneText0,#mermaid-svg-16 .doneText1,#mermaid-svg-16 .doneText2,#mermaid-svg-16 .doneText3{fill:hsl(28.5714285714, 17.3553719008%, 86.2745098039%)!important;}#mermaid-svg-16 .crit0,#mermaid-svg-16 .crit1,#mermaid-svg-16 .crit2,#mermaid-svg-16 .crit3{stroke:#E83737;fill:#E83737;stroke-width:2;}#mermaid-svg-16 .activeCrit0,#mermaid-svg-16 .activeCrit1,#mermaid-svg-16 .activeCrit2,#mermaid-svg-16 .activeCrit3{stroke:#E83737;fill:#81B1DB;stroke-width:2;}#mermaid-svg-16 .doneCrit0,#mermaid-svg-16 .doneCrit1,#mermaid-svg-16 .doneCrit2,#mermaid-svg-16 .doneCrit3{stroke:#E83737;fill:lightgrey;stroke-width:2;cursor:pointer;shape-rendering:crispEdges;}#mermaid-svg-16 .milestone{transform:rotate(45deg) scale(0.8,0.8);}#mermaid-svg-16 .milestoneText{font-style:italic;}#mermaid-svg-16 .doneCritText0,#mermaid-svg-16 .doneCritText1,#mermaid-svg-16 .doneCritText2,#mermaid-svg-16 .doneCritText3{fill:hsl(28.5714285714, 17.3553719008%, 86.2745098039%)!important;}#mermaid-svg-16 .vert{stroke:#00BFFF;}#mermaid-svg-16 .vertText{font-size:15px;text-anchor:middle;fill:#00BFFF!important;}#mermaid-svg-16 .activeCritText0,#mermaid-svg-16 .activeCritText1,#mermaid-svg-16 .activeCritText2,#mermaid-svg-16 .activeCritText3{fill:hsl(28.5714285714, 17.3553719008%, 86.2745098039%)!important;}#mermaid-svg-16 .titleText{text-anchor:middle;font-size:18px;fill:#F9FFFE;font-family:"trebuchet ms",verdana,arial,sans-serif;}#mermaid-svg-16 :root{--mermaid-font-family:"trebuchet ms",verdana,arial,sans-serif;}</style><g></g><g class="grid" transform="translate(75, 266)" fill="none" font-size="10" font-family="sans-serif" text-anchor="middle"><path class="domain" stroke="currentColor" d="M0,-231V0H835V-231"></path><g class="tick" opacity="1" transform="translate(0,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2026-08-01</text></g><g class="tick" opacity="1" transform="translate(90,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2026-09-01</text></g><g class="tick" opacity="1" transform="translate(177,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2026-10-01</text></g><g class="tick" opacity="1" transform="translate(268,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2026-11-01</text></g><g class="tick" opacity="1" transform="translate(355,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2026-12-01</text></g><g class="tick" opacity="1" transform="translate(445,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2027-01-01</text></g><g class="tick" opacity="1" transform="translate(535,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2027-02-01</text></g><g class="tick" opacity="1" transform="translate(617,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2027-03-01</text></g><g class="tick" opacity="1" transform="translate(707,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2027-04-01</text></g><g class="tick" opacity="1" transform="translate(794,0)"><line stroke="currentColor" y2="-231"></line><text fill="#000" y="3" dy="1em" style="text-anchor: middle;" stroke="none" font-size="10">2027-05-01</text></g></g><g><rect x="0" y="48" width="947.5" height="24" class="section section0"></rect><rect x="0" y="72" width="947.5" height="24" class="section section0"></rect><rect x="0" y="96" width="947.5" height="24" class="section section1"></rect><rect x="0" y="120" width="947.5" height="24" class="section section2"></rect><rect x="0" y="144" width="947.5" height="24" class="section section2"></rect><rect x="0" y="168" width="947.5" height="24" class="section section2"></rect><rect x="0" y="192" width="947.5" height="24" class="section section2"></rect><rect x="0" y="216" width="947.5" height="24" class="section section2"></rect><rect x="0" y="240" width="947.5" height="24" class="section section2"></rect></g><g><rect id="e1" rx="3" ry="3" x="75" y="50" width="177" height="20" transform-origin="163.5px 60px" class="task done0"></rect><rect id="e2" rx="3" ry="3" x="165" y="74" width="143" height="20" transform-origin="236.5px 84px" class="task done0"></rect><rect id="e2d" rx="3" ry="3" x="314" y="98" width="40" height="20" transform-origin="334px 108px" class="task active1"></rect><rect id="e3" rx="3" ry="3" x="354" y="122" width="82" height="20" transform-origin="395px 132px" class="task task2"></rect><rect id="e4a" rx="3" ry="3" x="436" y="146" width="61" height="20" transform-origin="466.5px 156px" class="task task2"></rect><rect id="e4b" rx="3" ry="3" x="520" y="170" width="41" height="20" transform-origin="540.5px 180px" class="task task2"></rect><rect id="e4c" rx="3" ry="3" x="561" y="194" width="61" height="20" transform-origin="591.5px 204px" class="task task2"></rect><rect id="e5" rx="3" ry="3" x="622" y="218" width="201" height="20" transform-origin="722.5px 228px" class="task task2"></rect><rect id="e6" rx="3" ry="3" x="823" y="242" width="87" height="20" transform-origin="866.5px 252px" class="task task2"></rect><text id="e1-text" font-size="11" x="163.5" y="63.5" class="taskText taskText0  doneText0 width-146.5329132080078">Etapa 1 (bezpečnost, základ)     </text><text id="e2-text" font-size="11" x="236.5" y="87.5" class="taskText taskText0  doneText0 width-135.59588623046875">Etapa 2A-2C (pluginy, role)      </text><text id="e2d-text" font-size="11" x="359" y="111.5" class="taskTextOutsideRight taskTextOutside1 activeText1 width-127.79324340820312">Etapa 2D (skryté stránky)        </text><text id="e3-text" font-size="11" x="441" y="135.5" class="taskTextOutsideRight taskTextOutside2  width-170.6910858154297">Etapa 3 (WYSIWYG, LLDAP, hooky)  </text><text id="e4a-text" font-size="11" x="502" y="159.5" class="taskTextOutsideRight taskTextOutside2  width-145.09910583496094">Etapa 4A (storage abstrakce)     </text><text id="e4b-text" font-size="11" x="566" y="183.5" class="taskTextOutsideRight taskTextOutside2  width-89.79705810546875">Etapa 4B (SQLite)                </text><text id="e4c-text" font-size="11" x="627" y="207.5" class="taskTextOutsideRight taskTextOutside2  width-144.49888610839844">Etapa 4C (Postgres/MariaDB)      </text><text id="e5-text" font-size="11" x="722.5" y="231.5" class="taskText taskText2  width-94.71538543701172">Etapa 5 (AI plugin)              </text><text id="e6-text" font-size="11" x="818" y="255.5" class="taskTextOutsideLeft taskTextOutside2">Etapa 6 (testy, migrace)         </text></g><g><text dy="0em" x="10" y="74" font-size="11" class="sectionTitle sectionTitle0"><tspan alignment-baseline="central" x="10">Hotovo</tspan></text><text dy="0em" x="10" y="110" font-size="11" class="sectionTitle sectionTitle1"><tspan alignment-baseline="central" x="10">Aktuální</tspan></text><text dy="0em" x="10" y="194" font-size="11" class="sectionTitle sectionTitle2"><tspan alignment-baseline="central" x="10">Plán</tspan></text></g><g class="today"><line x1="316" x2="316" y1="25" y2="291" class="today"></line></g><text x="492.5" y="25" class="titleText">FlatCMS — plán etap</text></svg>
---

## 5. Architektonické principy

1. **Jádro malé, pluginy velké.** AI, storage backendy, SEO, analytics — vše jako pluginy.
2. **Flat-file výchozí.** Kdo chce DB, nainstaluje plugin nebo přepne v adminu.
3. **Bezpečnost první.** XSS, path traversal, rate limiting, CSP — součást jádra, ne plugin.
4. **Žádná CDN.** Všechny závislosti lokálně hostované.
5. **Jedna instance.** FlatCMS používá souborový zámek pro synchronizaci zápisů v jednom Node procesu. Není určen pro cluster.
6. **Trvalý zapisovatelný disk.** Nefunguje na serverless (Vercel, Netlify).

---

## 6. Technologický stack

| Vrstva ↕▾ | Technologie ↕▾ |
|---|---|
| −Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19, Tailwind CSS 4 |
| Jazyk | TypeScript 5 |
| Flat-file | Node.js `fs/promises`, `gray-matter` |
| Markdown | `marked` |
| Sanitizace | `isomorphic-dompurify` |
| Volitelně | `better-sqlite3`, `pg`, `mysql2` (optional dependencies) |
⚙

---

## 7. Rizika a omezení

| Riziko | Dopad | Mitigace |
|---|---|---|
| **Rozsah Etapy 4 exploduje** | Zpoždění dalších etap | Držet se fází 4A → 4B → 4C, nedělat najednou |
| **Migrace mezi backendy je peklo** | Ztráta dat | Postavit migraci hned v 4A, testovat |
| **Optional dependencies komplikují build** | Chyby při `npm install` | Testovat bez `pg` i s ním |
| **Pluginy rozbijí jádro** | Nestabilita | Verzovat Plugin API (`pluginApiVersion`) |
| **AI náklady** | Neočekávané výdaje | Kvóty, cost tracking, varování |
| **Pomalý disk (F:)** | Turbopack crash | Přesunout projekt na C: (dlouhodobě) |

---

## 8. Otevřené otázky

1. **Název projektu** — „FlatCMS" je pracovní. Finální název bude oznámen po dokončení vývoje.
2. **Ikony a branding** — zatím žádné.
3. **Landing page** — bude potřeba pro veřejné vydání.
4. **Distribuce** — npm balíček? Docker image? ZIP archiv?
5. **Překlady** — CZ, EN, SK hotové. Další jazyky podle zájmu.

---

## 9. Odkazy

- [`README.md`](https://./README.md) — úvod a rychlý start
- [`PLUGIN-API.md`](https://./PLUGIN-API.md) — kompletní API pro pluginy
- [`AI-PLUGIN-SPEC.md`](https://./AI-PLUGIN-SPEC.md) — specifikace AI pluginu
- [`OPRAVY-BEZPECNOST.md`](https://./OPRAVY-BEZPECNOST.md) — bezpečnostní audit
- [`ROADMAP.md`](https://./ROADMAP.md) — detailní plán (pokud existuje)

---

**Autor:** Jan Hošek
**AI spoluautoři:** Claude Opus 5 Medium (původní kód), Better DeepSeek (audit, rozšíření, dokumentace)
**Licence:** GPL-3.0-or-later

