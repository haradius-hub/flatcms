# AI Plugin — Technická specifikace

> **Status:** Návrh · **Verze:** 1.0 · **Datum:** 2026-10-22
> **Licence:** GPL-3.0-or-later (součást FlatCMS)

Plugin `ai-assistant` přidává do FlatCMS volitelnou AI podporu. **Jádro CMS o AI neví** — vše jde přes standardní plugin API a hooky. Plugin lze kdykoliv vypnout bez dopadu na obsah.

---

## 1. Filozofie

- **Plugin, ne jádro.** Žádná AI logika v `src/lib/`. Vše v `plugins/ai-assistant/`.
- **Tři režimy.** `local` (Ollama), `api` (cloud), `hybrid` (local → api fallback).
- **Tři úrovně oprávnění.** Autor, Editor, Admin — každý dostane jinou sadu funkcí.
- **AI výstup je nedůvěryhodný.** Vždy projde `sanitizeHtml()` před uložením.
- **Nulová závislost pro uživatele bez AI.** Pokud plugin není aktivní, FlatCMS funguje jako dřív.

---

## 2. Architektura

```

plugins/ai-assistant/
├── plugin.json                  # Metadata, konfigurační pole, UI deklarace
├── index.mjs                    # Server-side: hooky, orchestrace
├── lib/
│   ├── providers/
│   │   ├── ollama.mjs           # Local provider
│   │   ├── openai-compatible.mjs # DeepSeek, OpenAI, Groq, Mistral
│   │   └── anthropic.mjs        # Anthropic (jiné API schéma)
│   ├── router.mjs               # Výběr providera (local/api/hybrid)
│   ├── prompts.mjs              # Šablony promptů pro každý úkol
│   ├── sanitize.mjs             # Sanitizace AI výstupu (DOMPurify wrapper)
│   ├── crypto.mjs               # Šifrování API klíčů (AES-GCM přes FLATCMS_SECRET)
│   ├── quota.mjs                # Denní limity, per-user kvóty
│   └── cost.mjs                 # Sledování tokenů a nákladů
├── admin/
│   ├── settings.tsx             # Nastavení → AI
│   ├── dashboard.tsx            # Statistiky, spotřeba, náklady
│   └── sidebar.tsx              # Chat asistent (RAG nad dokumentací)
├── editor/
│   └── toolbar.tsx              # Tlačítka v editoru (dle role)
└── README.md                    # Uživatelská dokumentace

```

---

## 3. Konfigurace

### 3.1 plugin.json (schéma)

```json
{
  "id": "ai-assistant",
  "name": "AI Assistant",
  "version": "1.0.0",
  "description": "Lokální i cloudová AI pro psaní, korekturu a SEO.",
  "author": "FlatCMS",
  "license": "GPL-3.0-or-later",
  "requires": { "flatcms": ">=1.3.0", "pluginApi": ">=2.0" },
  "hooks": [
    "admin:menu",
    "admin:settings",
    "editor:toolbar",
    "article:beforeSave",
    "ai:providers",
    "ai:beforeRequest",
    "ai:afterResponse"
  ]
}
```

### 3.2 Nastavení (uloženo v `data/settings.json` pluginu)

```
{
  "enabled": true,
  "mode": "hybrid",
  "local": {
    "baseUrl": "http://localhost:11434",
    "model": "llama3.2:3b",
    "timeoutMs": 30000,
    "maxConcurrent": 1
  },
  "api": {
    "provider": "deepseek",
    "baseUrl": "https://api.deepseek.com/v1",
    "model": "deepseek-chat",
    "apiKeyEncrypted": "aes-gcm:...",
    "maxTokens": 2048,
    "temperature": 0.7
  },
  "fallback": {
    "enabled": true,
    "order": ["local", "api"],
    "localTimeoutMs": 5000
  },
  "limits": {
    "globalDailyTokens": 100000,
    "perUserDailyTokens": 20000,
    "maxRetries": 2
  },
  "roles": {
    "author": ["proofread", "grammar", "dictionary"],
    "editor": ["proofread", "grammar", "dictionary", "excerpt", "seo", "translate", "rewrite", "tags", "altText", "summary"],
    "admin": ["*"]
  },
  "privacy": {
    "warnOnCloud": true,
    "blockCloudForRoles": []
  }
}
```

### 3.3 Tři režimy

| Režim | Kdy použít | Chování |
|---|---|---|
| `local` | Máš Ollama na serveru | Vše přes local, žádné náklady, žádná data ven |
| `api` | Nemáš HW / chceš kvalitu | Vše přes API, platíš tokeny, obsah odchází poskytovateli |
| `hybrid` | Chceš obojí | Local pro lehké úkoly, API pro těžké; fallback při výpadku |

### 3.4 Výběr providera v hybrid režimu

```
1. Zkus local (timeout 5 s)
2. Úspěch → vrať výsledek
3. Timeout / chyba → zkus api (pokud je nakonfigurováno)
4. Úspěch → vrať výsledek, zaloguj fallback
5. Chyba → vrať srozumitelnou chybu uživateli
```

**Mapování úkolů na providera:**

| Úkol ↕▾ | Provider (hybrid) ↕▾ | Důvod ↕▾ |
|---|---|---|
| −`proofread` (korektura) | local | Krátký kontext, rychlé |
| `grammar` (gramatika) | local | Krátký kontext |
| `dictionary` (slovník) | local | Velmi krátké |
| `excerpt` (perex) | local | Krátké shrnutí |
| `summary` (shrnutí) | local | Střední kontext |
| `tags` (tagy) | local | Krátké |
| `seo` (meta, titulek) | local | Krátké |
| `altText` | api (vision) | Vyžaduje vision model |
| `rewrite` (vylepšení stylu) | api | Dlouhý kontext, kvalita |
| `translate` (překlad) | api | Kvalita |
| `generateArticle` | api | Kreativní, dlouhé |
| `chat` (asistent) | api | Kontext + RAG |
⚙

---

## 4. Funkce podle role

### 4.1 Autor (nejnižší role)

Autor píše vlastní články a potřebuje **pomoc s jazykem**, ne s obsahem. AI mu nesmí psát článek, ale může mu pomoct s tím, co napsal.

| Funkce | ID | Popis | Local/API |
|---|---|---|---|
| **Korektura** | `proofread` | Pravopis, interpunkce, překlepy | Local |
| **Gramatika** | `grammar` | Shoda podmětu s přísudkem, pády, časy | Local |
| **Slovník** | `dictionary` | Návrhy slov (synonyma, lepší volba), význam | Local |
| **Stylistika (lehká)** | `styleHint` | Upozornění na opakování, dlouhé věty, pasivum | Local |

**Zásady pro roli Autora:**

- ❌ Žádné generování nového obsahu.
- ❌ Žádné přepisování celého článku.
- ❌ Žádný chat asistent.
- ✅ Vždy jen **návrh změny**, autor schválí nebo odmítne.
- ✅ Každá akce je **explicitní** — žádná automatika na pozadí.

**UI v editoru pro autora:**

```
[Korektura]  [Gramatika]  [Slovník]
```

Kliknutí otevře panel s návrhy:

```
Návrh korektury (3 změny):
 1. řádek 4: "pes běžel" → "pes běžel"     [Přijmout] [Odmítnout]
 2. řádek 7: "studenti přišli" → "studenti přišli"  ...
 3. řádek 12: "v Mnichově" → "v Mnichově"
```

### 4.2 Editor

Editor spravuje obsah napříč autory a připravuje ho k publikaci. Dostane **vše od Autora** + obsahové a SEO nástroje.

| Funkce ↕▾ | ID ↕▾ | Popis ↕▾ | Local/API ↕▾ |
|---|---|---|---|
| −*Vše z role Autor* |  | Korektura, gramatika, slovník, stylistika | Local |
| **Perex** | `excerpt` | 1–2 věty shrnutí (max 180 znaků) | Local |
| **Shrnutí** | `summary` | TL;DR blok na začátek/konec | Local |
| **SEO titulek** | `seoTitle` | 5 variant titulku, 50–60 znaků | Local |
| **Meta popis** | `seoMeta` | 155 znaků pro meta description | Local |
| **Tagy** | `tags` | 5–10 klíčových slov | Local |
| **Alt texty** | `altText` | Popis obrázků (vision model) | API |
| **Překlad** | `translate` | CZ ↔ EN ↔ SK (+ další jazyky) | API |
| **Vylepšení stylu** | `rewrite` | Přepis čtivěji, zachování významu | API |
| **Zkrácení / rozšíření** | `resize` | Podle cílové délky | API |
| **Návrh interních odkazů** | `internalLinks` | Které články propojit | Local |
⚙

**Zásady pro roli Editora:**

- ✅ Může použít AI na **cizí články** (nejen vlastní).
- ✅ Může **přepsat** článek AI (s potvrzením a uložením revize).
- ⚠️ AI výstup **vždy** projde sanitizací.
- ⚠️ Překlad/rewrite = **explicitní akce**, ne automatika.

### 4.3 Admin

Admin má **vše od Editora** + správu AI samotné.

| Funkce ↕▾ | ID ↕▾ | Popis ↕▾ | Local/API ↕▾ |
|---|---|---|---|
| −*Vše z role Editor* |  |  |  |
| **Generování článku z osnovy** | `generateFromOutline` | Z bodů vytvoří článek | API |
| **Generování článku z promptu** | `generateFromPrompt` | "Napiš o X, 500 slov, tón Y" | API |
| **Rozšíření poznámek** | `expandNotes` | Z krátkých bodů plnohodnotný text | API |
| **Chat asistent** | `chat` | Sidebar s RAG nad dokumentací | API |
| **Analýza webu** | `siteAnalysis` | "Co je nekonzistentní?" | API |
| **Návrh struktury** | `suggestStructure` | Doporučí kategorie | API |
| **Správa nastavení** | `config` | Konfigurace režimů, klíčů, kvót | — |
| **Dashboard** | `dashboard` | Statistiky, spotřeba, náklady | — |
⚙

**Zásady pro roli Admina:**

- ✅ Může **generovat** nový obsah.
- ✅ Může **konfigurovat** providery, klíče, kvóty.
- ✅ Vidí **cost tracking** všech uživatelů.
- ⚠️ Změna režimu `local` → `api` by měla vyžadovat potvrzení s varováním o odesílání dat.

---

## 5. Mapování rolí na funkce (matice)

| Funkce ↕▾ | Autor ↕▾ | Editor ↕▾ | Admin ↕▾ |
|---|---|---|---|
| −`proofread` (korektura) | ✅ | ✅ | ✅ |
| `grammar` (gramatika) | ✅ | ✅ | ✅ |
| `dictionary` (slovník) | ✅ | ✅ | ✅ |
| `styleHint` (stylistika) | ✅ | ✅ | ✅ |
| `excerpt` (perex) | ❌ | ✅ | ✅ |
| `summary` (shrnutí) | ❌ | ✅ | ✅ |
| `seoTitle` (SEO titulek) | ❌ | ✅ | ✅ |
| `seoMeta` (meta popis) | ❌ | ✅ | ✅ |
| `tags` (tagy) | ❌ | ✅ | ✅ |
| `altText` (alt texty) | ❌ | ✅ | ✅ |
| `translate` (překlad) | ❌ | ✅ | ✅ |
| `rewrite` (vylepšení stylu) | ❌ | ✅ | ✅ |
| `resize` (zkrátit/rozšířit) | ❌ | ✅ | ✅ |
| `internalLinks` (interní odkazy) | ❌ | ✅ | ✅ |
| `generateFromOutline` | ❌ | ❌ | ✅ |
| `generateFromPrompt` | ❌ | ❌ | ✅ |
| `expandNotes` | ❌ | ❌ | ✅ |
| `chat` (chat asistent) | ❌ | ❌ | ✅ |
| `siteAnalysis` | ❌ | ❌ | ✅ |
| `suggestStructure` | ❌ | ❌ | ✅ |
| `config` (správa AI) | ❌ | ❌ | ✅ |
| `dashboard` (statistiky) | ❌ | ❌ | ✅ |
⚙

**Poznámka:** Matice je **výchozí**. Admin ji může v nastavení **přebít** (např. povolit `translate` i autorům, nebo zakázat `proofread` editorům pro kontrolu).

---

## 6. Bezpečnost

### 6.1 Šifrování API klíčů

API klíč **nikdy neleží v plaintextu**. Ukládá se šifrovaně přes `FLATCMS_SECRET`:

```
// crypto.mjs
import { createCipheriv, createDecipheriv, scryptSync, randomBytes } from 'crypto';

const KEY = scryptSync(process.env.FLATCMS_SECRET, 'ai-plugin-salt', 32);

export function encryptApiKey(plain) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `aes-gcm:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}
```

**V `settings.json`** je jen ciphertext. V UI adminu je pole typu `password` s tlačítkem „Změnit klíč".

### 6.2 Sanitizace AI výstupu

AI výstup je **nedůvěryhodný vstup**. Před uložením nebo zobrazením vždy projde `sanitizeHtml()`:

```
// sanitize.mjs
import { sanitizeHtml } from '../../src/lib/render.js';

export function sanitizeAiOutput(text) {
  // Pokud AI vrátí HTML, projde DOMPurify
  // Pokud jen text, vrátí escaped
  return sanitizeHtml(text);
}
```

### 6.3 Omezení podle role

Plugin zkontroluje roli uživatele **před** voláním providera. Autor nemůže nikdy spustit `generateFromPrompt`, i kdyby obešel UI.

```
// index.mjs
async function runTask(task, ctx) {
  const allowed = ctx.settings.roles[ctx.user.role] ?? [];
  if (!allowed.includes('*') && !allowed.includes(task)) {
    throw new Error(`AI úkol '${task}' není povolen pro roli '${ctx.user.role}'.`);
  }
  // ... dál
}
```

### 6.4 Ochrana proti prompt injection

- **Uživatelský vstup** se escapuje před vložením do promptu.
- **AI výstup** nikdy nespouští kód, jen se zobrazí jako text/HTML po sanitizaci.
- **Systémový prompt** je fixní, uživatel ho nemůže změnit.

### 6.5 Varování při odesílání do cloudu

Pokud je režim `api` nebo `hybrid` s `api` fallbackem:

> ⚠️ **Upozornění:** Obsah článků bude odeslán poskytovateli AI (DeepSeek/OpenAI). Pro citlivý obsah použij **Local** režim s Ollamou. Toto nastavení může změnit jen administrátor.

Varování se zobrazí:

- V adminu při prvním zapnutí `api` režimu.
- V editoru při každém použití AI v `api` režimu (malá ikona 🔒 s tooltipem).

### 6.6 Rate limiting a timeouty

- **Per-user:** max 20 000 tokenů/den (konfigurovatelné).
- **Globální:** max 100 000 tokenů/den.
- **Timeout:** 30 s (local), 60 s (api).
- **Retry:** max 2× při 5xx chybě, 0× při 4xx (chyba na straně uživatele).

---

## 7. Sledování nákladů

### 7.1 Dashboard (admin)

| Metrika ↕▾ | Význam ↕▾ |
|---|---|
| −**Tokeny dnes** | Kolik se spotřebovalo (local + api zvlášť) |
| **Tokeny tento měsíc** | Kumulativně |
| **Odhad nákladů (Kč)** | Podle ceníku providera |
| **Per uživatel** | Kdo kolik utratil |
| **Per úkol** | Které funkce jsou nejdražší |
| **Fallback count** | Kolikrát local selhal → API |
| **Nejčastější chyby** | Timeouty, 4xx, 5xx |
⚙

### 7.2 Ceníky providerů

Ceníky jsou v konfiguraci (`lib/cost.mjs`), aby šly aktualizovat bez nasazení nové verze:

```
export const PRICING = {
  deepseek: {
    'deepseek-chat': { input: 0.14, output: 0.28, currency: 'USD', per: 1_000_000 }
  },
  openai: {
    'gpt-4o-mini': { input: 0.15, output: 0.60, currency: 'USD', per: 1_000_000 }
  },
  anthropic: {
    'claude-3-5-haiku': { input: 0.80, output: 4.00, currency: 'USD', per: 1_000_000 }
  }
};
```

### 7.3 Upozornění

- Při dosažení 80 % denní kvóty → upozornění v adminu.
- Při dosažení 100 % → AI úkoly se odmítnou s jasnou zprávou.
- Při překročení měsíčního rozpočtu (volitelné) → e-mail adminovi.

---

## 8. Fáze implementace

| Fáze | Co obsahuje | Odhad |
|---|---|---|
| **AI-1: Základ** | Ollama provider, OpenAI-compatible provider, nastavení v adminu, šifrování klíčů, role matice | 1–2 týdny |
| **AI-2: Autor** | `proofread`, `grammar`, `dictionary`, `styleHint`, panel návrhů v editoru | 1 týden |
| **AI-3: Editor** | `excerpt`, `summary`, `seoTitle`, `seoMeta`, `tags`, `translate`, `rewrite`, `resize`, `internalLinks` | 2 týdny |
| **AI-4: Admin** | `generateFromOutline`, `generateFromPrompt`, `expandNotes`, `chat` (RAG), `siteAnalysis`, `suggestStructure` | 2 týdny |
| **AI-5: Cost & limits** | Token tracking, kvóty, dashboard, ceníky, upozornění | 1 týden |
| **AI-6: Vision** | `altText` (vision model), případně generování obrázků | 1–2 týdny |
| **AI-7: Testy** | Unit testy providerů, integrační testy hooků, Playwright smoke | 1 týden |

**Celkem: ~8–10 týdnů** postupně po dokončení Etapy 2D a Etapy 3.

---

## 9. Nové hooky (rozšíření PLUGIN-API)

Plugin `ai-assistant` potřebuje tyto hooky. Jsou to **nové hooky**, které rozšíří stávající sadu 24 na ~30. Přidání hooků do jádra je **součást Etapy 2** (viz ROADMAP).

| Hook | Kdy | Parametry | Použití |
|---|---|---|---|
| `ai:providers` | Start | `{ registerProvider }` | Plugin zaregistruje providera (`ollama`, `openai-compatible`, …) |
| `ai:beforeRequest` | Před voláním | `{ task, prompt, role, user }` → `{ prompt }` | Modifikace promptu, výběr modelu podle úkolu |
| `ai:afterResponse` | Po odpovědi | `{ task, response, tokens, provider }` | Sanitizace, logování tokenů, post-processing |
| `editor:toolbar` | V editoru | `{ user, role }` → `Array<{ id, label, icon, onClick }>` | Přidá tlačítka do toolbaru |
| `admin:menu` | V adminu | `{ user, role }` → `Array<{ id, label, icon, href }>` | Přidá položky do menu |
| `admin:settings` | V nastavení | `{ user, role }` → `Array<{ id, label, component }>` | Přidá sekce do nastavení |

---

## 10. API providerů (interní rozhraní)

Každý provider implementuje společné rozhraní:

```
// lib/providers/types.ts
export interface AIProvider {
  readonly name: string;               // "ollama" | "openai-compatible" | "anthropic"
  readonly supports: {
    chat: boolean;
    vision: boolean;
    streaming: boolean;
    tools: boolean;
  };

  init(config: ProviderConfig): Promise<void>;

  chat(params: ChatParams): Promise<ChatResponse>;
  // volitelné:
  vision?(params: VisionParams): Promise<ChatResponse>;
  stream?(params: ChatParams, onChunk: (chunk: string) => void): Promise<ChatResponse>;
}

export interface ChatParams {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  temperature?: number;
  signal?: AbortSignal;
}

export interface ChatResponse {
  text: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  provider: string;
  model: string;
}
```

**Upozornění:** Provider `openai-compatible` pokrývá **DeepSeek, OpenAI, Groq, Mistral, Together, Perplexity** a jakéhokoli jiného poskytovatele s OpenAI-kompatibilním API. Není potřeba psát samostatné providery pro každého.

---

## 11. Chybové stavy

| Kód | Význam | Uživatelská zpráva |
|---|---|---|
| `AI_DISABLED` | Plugin není aktivní | „AI asistent není zapnutý." |
| `AI_NO_PROVIDER` | Žádný provider není nakonfigurován | „Nejprve nastav AI v administraci." |
| `AI_LOCAL_DOWN` | Ollama neodpovídá | „Lokální AI neodpovídá, zkouším cloud." |
| `AI_API_UNAUTHORIZED` | Špatný API klíč | „API klíč je neplatný, aktualizuj ho v nastavení." |
| `AI_API_RATE_LIMIT` | 429 od providera | „AI je momentálně přetížená, zkus to za chvíli." |
| `AI_QUOTA_EXCEEDED` | Překročen denní limit | „Denní limit AI je vyčerpán." |
| `AI_ROLE_FORBIDDEN` | Role nemá oprávnění | „Tato funkce není pro tvou roli povolená." |
| `AI_TIMEOUT` | Timeout | „AI neodpověděla včas, zkus to znovu." |
| `AI_INVALID_INPUT` | Prázdný vstup | „Není co zpracovat." |

---

## 12. Testování

### 12.1 Unit testy (Vitest)

- `router.mjs` — výběr providera v hybrid režimu
- `crypto.mjs` — šifrování/dešifrování klíčů
- `quota.mjs` — limity, reset denní kvóty
- `cost.mjs` — výpočet nákladů z tokenů
- `sanitize.mjs` — sanitizace XSS v AI výstupu

### 12.2 Integrační testy

- Mock Ollama server (MSW nebo vlastní HTTP server)
- Mock OpenAI-compatible API
- Fallback scénáře (local down → api)
- Role-based přístup (autor nemůže generovat)

### 12.3 Playwright smoke

- Přihlášení jako autor → korektura → panel návrhů
- Přihlášení jako editor → perex → zkopírování do článku
- Přihlášení jako admin → změna režimu → uložení

### 12.4 Bezpečnostní testy

- API klíč není v logech.
- AI výstup s `<script>` je zablokován.
- Autor nemůže spustit `generateFromPrompt` (ani přes přímé volání API).

---

## 13. Budoucí rozšíření (mimo rozsah 1.0)

- **Streaming odpovědí** v editoru (ChatGPT-like efekt).
- **AI generování obrázků** (DALL-E, Stable Diffusion, Flux) — placené API.
- **AI moderace komentářů** (pokud FlatCMS dostane komentáře).
- **AI sumarizace celého webu** (RAG nad všemi články).
- **AI návrh interních odkazů** na základě embeddings.
- **Fine-tuning** lokálního modelu na styl autora (pokročilé).
- **Multi-agent** (jeden agent píše, druhý kontroluje).

---

## 14. Odkazy

- [PLUGIN-API.md](https://./PLUGIN-API.md) — kompletní API pro psaní pluginů
- [STAV-PROJEKTU.md](https://./STAV-PROJEKTU.md) — co je hotové, co zbývá
- [ROADMAP.md](https://./ROADMAP.md) — plán etap
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [OpenAI API reference](https://platform.openai.com/docs/api-reference)
- [DeepSeek API](https://api-docs.deepseek.com/)

---

**Autor:** Jan Hošek · **AI spoluautoři:** Claude Opus 5 Medium, Better DeepSeek
**Licence:** GPL-3.0-or-later
</｜｜DSML｜｜ parameter>
</｜｜DSML｜｜ invoke>
</｜｜DSML｜｜ calls>
