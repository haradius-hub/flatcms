# FlatCMS – Roadmap

**Živý dokument.** Aktualizuje se průběžně podle toho, co je hotové a co se plánuje.

**Poslední aktualizace:** 12. 10. 2026

---

## Jak číst tento dokument

| Legenda | Význam |
|---|---|
| ✅ | Hotovo |
| 🟡 | Rozpracováno |
| ⏳ | Naplánováno (brzy) |
| 💡 | Nápad (může, ale nemusí) |
| ❌ | Zamítnuto / odloženo |

**Priorita:** 1 = kritické, 2 = důležité, 3 = nice-to-have

---

## Přehled etap

| Etapa | Název | Stav | Priorita |
|---|---|---|---|
| 1 | Bezpečnostní audit | ✅ | 1 |
| 2A | Tmavý režim | ✅ | 2 |
| 2B | Internacionalizace | 🟡 | 2 |
| 2C | Rozšíření hooků | ✅ | 1 |
| 2D | Skryté stránky | ⏳ | 1 |
| 2E | LLDAP + neveřejná sekce | ⏳ | 2 |
| 3 | Moderní editor (TinyMCE) | ⏳ | 2 |
| 4 | Storage + testy + nasazení | ⏳ | 1 |
| 5 | AI plugin | 💡 | 3 |

---

## ✅ Etapa 1 – Bezpečnost (HOTOVO)

**Datum dokončení:** 28. 9. 2026

- [x] Výchozí účty a hesla odstraněny (`ensureInitialAdmin`)
- [x] Demo účty zmizely z přihlašovací stránky
- [x] Vynucený `FLATCMS_SECRET` (bez klíče aplikace nespustí)
- [x] Sanitizace HTML (DOMPurify) – ochrana proti XSS
- [x] Kontrola symlinků v `safeJoin`
- [x] Limit velikosti uploadů (20 MB / soubor)
- [x] Rate limiting na přihlášení (5 pokusů / 15 min)
- [x] CSP a bezpečnostní hlavičky
- [x] Race condition v `store.ts` (mutex)

**Výsledek:** Aplikace je bezpečná pustit na internet.

---

## ✅ Etapa 2A – Tmavý režim (HOTOVO)

**Datum dokončení:** 28. 9. 2026

- [x] CSS proměnné pro světlý a tmavý režim
- [x] ThemeProvider + localStorage
- [x] Inline skript (žádné blikání)
- [x] Přepínač v hlavičce (světlý / tmavý / podle systému)

---

## 🟡 Etapa 2B – Internacionalizace (ROZPRACOVÁNO)

**Stav:** ~60 % hotovo

### Hotovo
- [x] i18n systém (`src/lib/i18n.ts`)
- [x] Tři jazyky: CZ (výchozí), EN, SK
- [x] Překladové soubory (`src/messages/*.json`)
- [x] I18nProvider, `getT`, `useT`
- [x] Přepínač jazyka v hlavičce
- [x] Priorita jazyka: cookie → settings.language → "cs"
- [x] Vysvětlující box v nastavení
- [x] Tlačítko „Vymazat mou volbu"
- [x] Překlad: login, dashboard, navigace, layout, nastavení

### Zbývá
- [ ] Překlad seznamu obsahu (`/admin/content`)
- [ ] Překlad editoru článku (`/admin/content/edit`, `/new`)
- [ ] Překlad správce souborů (`/admin/files`)
- [ ] Překlad pluginů (`/admin/plugins`)
- [ ] Překlad uživatelů (`/admin/users`)
- [ ] Překlad veřejného webu (layout, homepage)
- [ ] Překlad globálních dat (siteTitle, popis, patička)
- [ ] Možnost přidat další jazyk (FR, DE, …)

**Postup:** viz `MIGRACE.md`

---

## ✅ Etapa 2C – Rozšíření hooků (HOTOVO)

**Datum dokončení:** 29. 9. 2026

- [x] 24 hooků (z původních 8)
- [x] Priority pluginů (nižší = dřívější)
- [x] Timeouty (výchozí 5 s, konfigurovatelné)
- [x] Izolace chyb (jeden plugin nezastaví ostatní)
- [x] Collect hooky (`registerAdminMenu`, `registerEditorToolbar`, `registerSettings`)
- [x] 3 ukázkové pluginy (`seo-tools`, `custom-analytics`, `example-hooks`)
- [x] Dokumentace API (`PLUGIN-API.md`)

---

## ⏳ Etapa 2D – Skryté stránky (NÁSLEDUJÍCÍ)

**Priorita:** 1 (konkrétní potřeba – CV)
**Odhad:** 2 sezení

### Účel
Stránky, které nejsou veřejné, ale přístupné přes token v URL. Pro CV, osobní dokumenty, nabídky.

### Jádro (musí být v CMS)
- [ ] Nový typ stránky `hidden` (kromě `published`, `draft`, `scheduled`, `static`)
- [ ] Middleware pro kontrolu přístupu k `/p/*`
- [ ] Sekce „Skryté stránky" v admin
- [ ] Server action pro generování tokenů

### Plugin `hidden-pages`
- [ ] Token v URL (32 znaků, `crypto.randomBytes`)
- [ ] Token uložen jako SHA-256 hash (ne plaintext)
- [ ] Volitelné heslo (scrypt hash)
- [ ] Volitelná expirace (datum + automatické čištění)
- [ ] Access log (IP, čas, user-agent)
- [ ] Rate limiting na heslo (5 pokusů / 15 min)

### Admin UI
- [ ] Kopírovat odkaz
- [ ] Zneplatnit odkaz
- [ ] Nastavit / změnit heslo
- [ ] Nastavit / změnit expiraci
- [ ] Zobrazit access log
- [ ] Ikona 🔒 u skrytých stránek

### Použití
- [ ] Test s tvým CV (veřejná + skrytá verze)
- [ ] Migrace CV z Bluditu

---

## ⏳ Etapa 2E – LLDAP + neveřejná sekce

**Priorita:** 2
**Odhad:** 2–3 sezení
**Předpoklad:** běžící LLDAP server

### Neveřejná sekce
- [ ] Sekce `/private/*` za přihlášením
- [ ] Middleware pro kontrolu session
- [ ] Možnost vypnout / zapnout v nastavení

### LLDAP plugin
- [ ] `ldapts` klient pro LDAP bind
- [ ] GraphQL API pro správu uživatelů (volitelně)
- [ ] Mapování LLDAP skupin na role (`admins` → `administrator`, …)
- [ ] Fallback: lokální účty, když LLDAP nedostupný
- [ ] Hook `beforeLogin` (už existuje)

### Konfigurace
- [ ] Sekce LLDAP v nastavení (jen admin)
- [ ] URL, base DN, bind DN, heslo (z prostředí)
- [ ] Test připojení

---

## ⏳ Etapa 3 – Moderní editor (TinyMCE)

**Priorita:** 2
**Odhad:** 2 sezení

### Proč
Současný WYSIWYG používá `contentEditable` + `document.execCommand`, což je **zastaralé API** (deprecated). TinyMCE je průmyslový standard.

### Co udělat
- [ ] Vyřadit `document.execCommand`
- [ ] Nainstalovat TinyMCE (plná open-source verze, GPL)
- [ ] Lokálně hostovaný (žádné CDN)
- [ ] Česká lokalizace
- [ ] Vlastní toolbar (admin vidí víc, autor méně)
- [ ] Integrace s MediaPicker (výběr obrázků)
- [ ] Plugin systém TinyMCE pro budoucí rozšíření
- [ ] Otestovat 3 existující editory (Markdown, blokový, HTML)

### Licence
TinyMCE používá dual license (GPLv2 nebo komerční). Pro FlatCMS (GPLv3) je GPLv2 verze kompatibilní. V kódu se přihlásí přes `license_key: 'gpl'`.

---

## ⏳ Etapa 4 – Storage, testy, nasazení, infrastruktura

**Priorita:** 1
**Odhad:** 4–6 sezení

### 4.1 Storage abstraction – HYBRIDNÍ DB

**Klíčová myšlenka:** FlatCMS zůstává **flat-file ve výchozím stavu**, ale architektura je připravená na volitelnou databázi. V nastavení (jen admin) bude **přepínač se třemi úrovněmi**:

| Úroveň | Backend | Kdy použít | Nároky |
|---|---|---|---|
| **1** | **File** (výchozí) | Osobní weby do ~1 000 stránek | Minimální |
| **2** | **SQLite** | Střední weby, 1 soubor DB | Malé |
| **3** | **PostgreSQL** (nebo jiná těžkotonážní DB) | 10 000+ stránek, multi-user | Větší |

**Filozofie:** Nezatěžovat uživatele komplexitou, dokud ji nepotřebuje. Ale navrhnout systém tak, aby komplexita mohla přijít později **bez přepisování**.

#### Architektura

```

┌─────────────────────────────────┐
│  1. Aplikace                    │
│  (admin, weby, editory)         │
│  Neví, kde jsou data.           │
└────────────┬────────────────────┘
│ volá
┌────────────▼────────────────────┐
│  2. Repository vrstva           │
│  ContentRepository,             │
│  UserRepository,                │
│  SettingsRepository             │
└────────────┬────────────────────┘
│ implementuje
┌───────┼───────┐
▼       ▼       ▼
┌────────┐┌────────┐┌────────┐
│ File   ││ SQLite ││ Postgre│
│ ✅     ││ ⏳     ││ ⏳     │
└────────┘└────────┘└────────┘

```

#### Konfigurace

```json
{
  "storage": {
    "backend": "file",     // "file" | "sqlite" | "postgres"
    "file": { "contentDir": "content", "dataDir": "data" },
    "sqlite": { "path": "data/cms.db" },
    "postgres": { "url": "${DATABASE_URL}" }
  }
}
```

#### Fáze implementace

**Fáze 1 – Příprava (~4 h)**

- □  
Formalizovat rozhraní `ContentRepository`, `UserRepository`, `SettingsRepository`
- □  
Vytvořit složku `src/lib/storage/`
- □  
Přesunout stávající kód do `src/lib/storage/file/`
- □  
Factory `getContentRepo()` čte konfiguraci
- □  
Přepínač v admin (vidí a mění jen admin)
- □  
Varování při změně + tlačítko „Migrovat data"

**Fáze 2 – SQLite backend (~10 h)**

- □  
`src/lib/storage/sqlite/` s implementací
- □  
Migrační skript z `.md` → SQLite
- □  
Rollback (SQLite → file)
- □  
Testy obou backendů

**Fáze 3 – PostgreSQL backend (~10 h)**

- □  
`src/lib/storage/postgres/`
- □  
Využít `drizzle-orm` (byl v původní šabloně)
- □  
Pro multi-user nasazení

#### Kdy přepnout na DB

| Kritérium ↕▾ | File ↕▾ | DB ↕▾ |
|---|---|---|
| −Počet stránek | < 1 000 | > 10 000 |
| −Souběžní autoři | 1–3 | 5+ |
| Fulltextové hledání | Plugin | Nativní |
| Relační data | Obtížné | Přirozené |
| Záloha | Kopie složky | `pg_dump` |
⚙

---

### 4.2 Testy

- □  
Playwright smoke testy (login, CRUD, upload)
- □  
E2E testy (sanitizace, oprávnění, rate limiting)
- □  
Testy obou storage backendů (file + DB)
- □  
CI/CD (GitHub Actions)

### 4.3 Provoz

- □  
Activity log (kdo, kdy, co) → `data/activity.json`
- □  
Zálohy článků před změnou → `data/backups/`
- □  
Session storage (možnost odhlásit sessions)
- □  
Cache + index pro 10 000+ stránek
- □  
Healthcheck endpoint (už je)
- □  
Export obsahu do JSON (pro migraci)

### 4.4 Infrastruktura

- □  
**SFTPGo** – FTP/SFTP/WebDAV server

- □  
Přístup ke složkám CMS pro vývoj
- □  
WebDAV mount ve Windows
- □  
Zálohy mezi servery (rsync přes SFTP)
- □  
Sdílení velkých souborů (public share)
- □  
**Caddy** – reverzní proxy s automatickým HTTPS
- □  
**Systemd služby** – `flatcms.service`, `sftpgo.service`
- □  
**Let's Encrypt** certifikáty (Caddy to zvládne sám)
- □  
**Automatické zálohy** (cron + rsync)

### 4.5 Nasazení

- □  
Nasadit na **HP 260 G3 DM** (hlavní server)
- □  
**Futro S720** jako backup
- □  
Migrace z vývojového prostředí
- □  
Dokumentace nasazení (`DEPLOY.md`)

---

## 💡 Etapa 5 – AI plugin

**Priorita:** 3 (bonus)
**Odhad:** 2–3 sezení
**Předpoklad:** dokončená Etapa 2C (hooky)

### Koncept

Hybridní AI – stejný princip jako storage. Dvě vrstvy, uživatel volí.

| Úroveň ↕▾ | Backend ↕▾ | Kdy použít ↕▾ |
|---|---|---|
| −**Lokální** | Ollama | Soukromí, zdarma, offline |
| **Cloud** | DeepSeek API, OpenAI, … | Kvalita, rychlost |
| **Hybrid** | Ollama primárně, cloud jako fallback | Nejlepší z obojího |
⚙

### Funkce pluginu

**V editoru:**

- □  
AI panel (tlačítko v toolbaru)
- □  
„Napiš draft" (ze zadání vytvoří koncept)
- □  
„Dokonči odstavec"
- □  
„Přepiš text" (formálnější / přátelštější)
- □  
„Oprav gramatiku" (české skloňování, čárky)
- □  
„Přelož" (CZ ↔ EN)

**Automaticky:**

- □  
Vygenerovat perex (hook `beforePageSave`)
- □  
Navrhnout tagy
- □  
Alt text k obrázkům (hook `beforeFileUpload`)
- □  
Shrnout článek pro SEO

**Chat s obsahem:**

- □  
„O čem píšu na blogu?"
- □  
„Najdi články o Dockeru"

### Konfigurace (v nastavení, jen admin)

```
{
  "ai": {
    "provider": "ollama",     // "ollama" | "openai" | "deepseek" | "hybrid"
    "fallback": "deepseek",   // když Ollama neodpovídá
    "ollama": { "url": "http://localhost:11434", "model": "llama3.2:3b" },
    "deepseek": { "apiKey": "${DEEPSEEK_API_KEY}", "model": "deepseek-chat" }
  }
}
```

### Hardware požadavky

| Server | CPU | Zvládne |
|---|---|---|
| Futro S720 | GX-217GA | Malé modely (Phi-3 mini), 1–3 slov/s |
| HP 260 G3 DM | i3-7100T | Střední modely (Llama 3.2 3B), 5–15 slov/s |
| S GPU | – | Velké modely (až 50+ slov/s) |

**Alternativa:** Malá GPU (RTX 3050, 8 GB VRAM) ~6 000 Kč → výrazné zrychlení.

---

## 💡 Nápady do budoucna (nice-to-have)

### Obsah a UX

- □  
**RSS feed** pro blog
- □  
**Fulltextové hledání** (flexsearch, lokální)
- □  
**Sitemap.xml** (plugin, už je v example-hooks)
- □  
**Komentáře** (volitelné, možná přes Disqus/Isso)
- □  
**Kategorie a tagy** (rozšířené filtrování)
- □  
**Související články** (podle tagů)
- □  
**Šablony článků** (předpřipravené struktury)
- □  
**Kalendář publikování** (přehled naplánovaných)

### Editor

- □  
**Vlastní blokový editor** (vylepšit)
- □  
**Markdown live preview s scroll sync**
- □  
**Verzování článků** (diff, vrátit se k verzi)
- □  
**Spolupráce v reálném čase** (jako Google Docs)

### Média

- □  
**Automatická optimalizace obrázků** (sharp, WebP)
- □  
**Lazy loading** obrázků
- □  
**Galerie** (lightbox, slideshow)
- □  
**AI generování obrázků** (Stable Diffusion)

### Bezpečnost

- □  
**2FA (TOTP)** pro přihlášení
- □  
**Magic link** přihlášení (bez hesla)
- □  
**Audit log** (kdo co dělal)
- □  
**Antivirová kontrola** uploadů (ClamAV)
- □  
**Magic bytes** validace uploadů

### Provoz

- □  
**Docker** image (pro snadné nasazení)
- □  
**Nginx/Caddy** konfigurace v repu
- □  
**Backup script** (rsync, šifrované zálohy)
- □  
**Monitoring** (Uptime Kuma, Prometheus)
- □  
**Analytika** (vlastní, bez cookies)

### Komunita

- □  
**Web pro plugin repository** (katalog pluginů)
- □  
**Dokumentace** pro vývojáře pluginů
- □  
**Šablony témat** (theme systém)
- □  
**CLI nástroj** (`flatcms new article`, `flatcms backup`, …)
- □  
**Migrační nástroje** (z Bluditu, WordPressu, Ghostu)

### Nápady k diskusi

- □  
**Multi-web** (jedna instance CMS, více webů)
- □  
**Multi-jazyk obsahu** (jeden článek v CZ i EN)
- □  
**Websockets** pro live updates
- □  
**PWA** (offline přístup k admin)
- □  
**Mobilní aplikace** (React Native)

---

## ❌ Zamítnuto / odloženo

### Ne v tomto projektu

- **Vlastní databáze od základu** – místo toho použijeme existující (SQLite/PostgreSQL)
- **Vlastní WYSIWYG od základu** – použijeme TinyMCE
- **Vlastní autentizace s OAuth** – stačí lokální + LLDAP

### Odloženo na neurčito

- **REST API** – Server Actions stačí
- **GraphQL API** – nadbytečné
- **Podpora Windows serveru** – cílíme na Linux
- **IE11 kompatibilita** – mrtvý prohlížeč

---

## Rozhodovací body (čekají na rozhodnutí)

| # ↕▾ | Otázka ↕▾ | Kdy ↕▾ | Poznámka ↕▾ |
|---|---|---|---|
| −1 | Finální název projektu | Po dokončení 2D | „FlatCMS" koliduje, návrhy: Lístek, Pergamen, Svitky, PinaxCMS (favorit) |
| 2 | Kde poběží produkce | V Etapě 4 | HP 260 G3 DM jako hlavní, Futro jako backup |
| 3 | Která DB jako výchozí alternativa | V Etapě 4 | SQLite (jednodušší) vs PostgreSQL (výkonnější) |
| 4 | AI provider v produkci | V Etapě 5 | Ollama lokálně vs DeepSeek cloud vs hybrid |
| 5 | Zapnout/zavřít veřejné komentáře | Po Etapě 3 | Možná plugin |
⚙

---

## Jak přispět

1. **Nápady** – přidej do sekce „Nápady do budoucna" jako `- [ ] nápad`
2. **Rozhodnutí** – zapiš do „Rozhodovacích bodů"
3. **Hotové věci** – přepiš `[ ]` na `[x]` a přidej datum
4. **Zamítnuté** – přesuň do „Zamítnuto" s odůvodněním

**Pravidlo:** Roadmap se aktualizuje při každém dokončení etapy nebo při změně priorit.

---

**Vyvíjeno v Česku s 💚**

