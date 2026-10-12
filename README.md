# FlatCMS

> **Pracovní název.** Finální název bude oznámen po dokončení vývoje.

Moderní **flat-file CMS** bez databáze, postavený na **Next.js**, **TypeScriptu** a **Tailwind CSS v4**. Obsah i konfigurace žijí v souborech na disku. Žádné SQL, žádné migrace, žádná závislost na cizích službách.

**Alternativa k Bludit**, ale s moderním stackem, důrazem na bezpečnost a plugin architekturou.

---

## Co FlatCMS umí

### Obsah a struktura
- **Flat-file úložiště** – články jako Markdown s YAML frontmatter
- **Neomezená stromová struktura** – `blog/technologie/linux/servery/debian.md`
- **Automatické slugy bez diakritiky** – *Můj článek* → `muj-clanek`
- **Naplánované publikování** – článek se zveřejní v zadaný čas
- **Koncepty a revize** – před publikováním vidíš jen ty

### Editory
- **Markdown** s živým náhledem
- **Blokový editor** (Gutenberg-style) pro skládání z bloků
- **HTML / Embed** pro vlastní kód, iframy, skripty
- **WYSIWYG** (v přípravě – TinyMCE)

### Pluginy
- **Modulární systém** – plugin = složka s `plugin.json` a `index.mjs`
- **24 hooků** pro napojení na životní cyklus CMS
- **Priority a timeouty** – pluginy se nehádají, chyba jednoho nezastaví ostatní
- **Konfigurace v admin** – každý plugin si definuje vlastní pole

### Bezpečnost
- **Sanitizace HTML** (DOMPurify) – ochrana proti XSS
- **Rate limiting** na přihlášení
- **CSP a bezpečnostní hlavičky**
- **Scrypt hash hesel** (ne MD5, ne SHA1)
- **Ochrana proti path traversal a symlink útokům**
- **Vynucený tajný klíč** – bez `FLATCMS_SECRET` aplikace neběží

### Role a oprávnění
- **Administrátor** – vše (obsah, média, pluginy, uživatelé, nastavení)
- **Editor** – veškerý obsah a média, bez nastavení a pluginů
- **Autor** – pouze vlastní články

### Rozhraní
- **Tmavý / světlý režim** s osobní volbou v prohlížeči
- **Vícejazyčné** (CZ, EN, SK) – snadné přidání dalšího jazyka
- **Responzivní** administrace i veřejný web
- **Plná čeština** od základu (ne překlad)

---

## Rychlý start

### Požadavky
- Node.js 20 nebo novější
- npm (nebo yarn/pnpm/bun)

### Instalace

```bash
git clone https://github.com/haradius-hub/flatcms.git
cd flatcms
npm install
```

### Konfigurace

Vytvoř soubor `.env.local` v kořeni projektu:

```
# Povinné – tajný klíč pro session cookies
# Vygeneruj: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
FLATCMS_SECRET=vas-vygenerovany-klic

# Volitelné – pouze při prvním spuštění
CMS_ADMIN_USERNAME=admin
CMS_ADMIN_EMAIL=vas@email.cz
CMS_ADMIN_PASSWORD=silne-heslo-min-12-znaku
```

### Spuštění

```
npm run dev
```

Otevři http://localhost:3000/admin a přihlas se.

### Produkční build

```
npm run build
npm run start
```

**⚠️ Důležité:** FlatCMS potřebuje **trvalý zapisovatelný disk**. Nefunguje na serverless platformách (Vercel, Netlify) bez perzistentního úložiště. Používej **jednu instanci** – souborový zámek synchronizuje zápisy v jednom Node procesu.

---

## Struktura projektu

```
content/               Články (Markdown + YAML frontmatter)
├── blog/
│   └── technologie/
│       └── nextjs-flat-file.md
└── o-nas/
    └── index.md

data/                  Konfigurace a uživatelé (JSON)
├── users.json         Scrypt hashe hesel
├── settings.json      Nastavení webu
├── plugins.json       Zapnutí a konfigurace pluginů
└── backups/           Předchozí verze článků (plugin auto-backup)

plugins/               Rozšiřující moduly
├── seo-tools/         Doplní popisky, meta tagy
├── custom-analytics/  Lokální analytika
└── example-hooks/     Ukázka všech typů hooků

public/uploads/        Nahrané soubory (obrázky, videa, dokumenty)

src/
├── app/               Next.js App Router
│   ├── (site)/        Veřejný web
│   ├── admin/         Administrace
│   └── api/           API endpointy
├── components/        React komponenty
│   ├── editors/       Markdown, HTML, blokový
│   ├── file-manager/  Správa médií
│   └── providers/     Theme, i18n
├── lib/               Serverová logika
│   ├── content.ts     Čtení/zápis článků
│   ├── plugins.ts     Plugin manager
│   ├── auth.ts        Autentizace
│   └── i18n.ts        Internacionalizace
└── messages/          Překladové soubory (CZ, EN, SK)
```

---

## Dokumentace

| Dokument ↕▾ | Co obsahuje ↕▾ |
|---|---|
| −[`PLUGIN-API.md`](https://./PLUGIN-API.md) | Kompletní API pro psaní pluginů |
| [`STAV-PROJEKTU.md`](https://./STAV-PROJEKTU.md) | Co je hotové, co zbývá |
| [`OPRAVY-BEZPECNOST.md`](https://./OPRAVY-BEZPECNOST.md) | Bezpečnostní audit a opravy |
⚙

---

## Technologický stack

- **Next.js 16** (App Router, Server Actions, Server Components)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **Node.js `fs/promises`** – souborové úložiště
- **gray-matter** – YAML frontmatter
- **marked** – Markdown → HTML
- **DOMPurify** – sanitizace HTML

Všechny závislosti jsou open-source a lokálně hostované. **Žádné CDN.**

---

## Autor

- **Jan Hošek**

- Web: hosekjan.cz
- GitHub: [@haradius-hub](https://github.com/haradius-hub)
- Fediverse: [@harad@social.hosekjan.cz](https://social.hosekjan.cz/@harad)
- XMPP/Jabber: `gogo@hosek-jan.duckdns.org`
- E-mail: `Jan.Hosek [zavináč] hosekjan.cz` *(komoleno proti robotům)*

Návrh projektu, zadání, testování, správa, kurátorství kódu.

## AI spoluautoři (kód)

- **Claude Opus 5 Medium** (Anthropic) — původní kód CMS, architektura flat-file úložiště, plugin systém
- **Better DeepSeek** — bezpečnostní audit a opravy, rozšíření hooků (8 → 24), internacionalizace, tmavý režim, dokumentace, plugin API

*AI nástroje byly použity jako nástroje pro generování a revizi kódu. Odpovědnost za výsledný produkt nese hlavní autor.*

## Poděkování

- **Bludit CMS** — inspirace pro flat-file architekturu a model rolí
- **Next.js tým** (Vercel) — framework a dokumentace
- **Komunity knihoven** — DOMPurify, marked, gray-matter, Tailwind CSS

---

## Licence

**GNU General Public License v3.0** — viz soubor [`LICENSE`](https://./LICENSE).

Stručně:

- ✅ Můžeš používat, studovat, upravovat, šířit
- ✅ Můžeš provozovat na svém serveru (i komerčně)
- ⚠️ Když šíříš upravenou verzi, musíš ji šířit pod stejnou licencí (copyleft)
- ⚠️ Musíš uvést autory

**Co nemusíš:** Zveřejňovat úpravy, když CMS používáš jen pro sebe nebo pro klienta.

---

## Stav projektu

**Aktivně ve vývoji.** Aktuální stav: ~55 % hotovo.

Viz [`STAV-PROJEKTU.md`](https://./STAV-PROJEKTU.md) pro detailní přehled etap.

### Plánováno

- **Skryté stránky** — token + heslo + expirace (pro CV, osobní dokumenty)
- **Neveřejná sekce** — `/private/*` za přihlášením
- **LLDAP integrace** — LDAP autentizace
- **TinyMCE** — moderní WYSIWYG editor
- **Hybridní storage** — volitelně SQLite/PostgreSQL
- **AI plugin** — lokální Ollama + cloud fallback
- **Testy** — Playwright smoke + e2e

---

## Přispívání

Projekt je ve fázi **aktivního vývoje**. Pull requesty a issues jsou vítány.

Před přispěním:

1. Přečti si [`PLUGIN-API.md`](https://./PLUGIN-API.md) (pokud přidáváš plugin)
2. Dodržuj stávající styl kódu (TypeScript, ESLint, Prettier)
3. Napiš testy, pokud přidáváš funkci

---

## Časté otázky

**Proč bez databáze?**
Flat-file je jednodušší, přenosnější, lépe zálohovatelný. Pro osobní weby do ~1000 stránek je ideální. Pro větší nasazení je v plánu volitelný SQLite/PostgreSQL backend.

**Funguje to na Vercelu?**
Ne bez perzistentního úložiště. FlatCMS potřebuje zapisovatelný disk. Doporučujeme VPS (Hetzner, DigitalOcean) nebo vlastní server.

**Můžu to použít komerčně?**
Ano. GPLv3 umožňuje komerční provoz. Pokud ale šíříš upravenou verzi, musíš ji šířit pod GPLv3.

**Jak migruju z Bluditu?**
Migrace je v plánu (Etapa 2D). Prozatím je potřeba ruční převod Markdown souborů.

---

**Vyvíjeno v Česku s 💚**

