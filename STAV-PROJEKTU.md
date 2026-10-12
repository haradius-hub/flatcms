# FlatCMS – stav projektu

**Datum:** 28. 9. 2026 (aktualizováno)
**Celkový postup:** ~52 %

---

## Přehled etap

| Etapa | Název | Stav |
|---|---|---|
| **1** | Bezpečnost | ✅ Hotovo |
| **2A** | Tmavý režim | ✅ Hotovo |
| **2B** | Internacionalizace | ⚠️ Částečně |
| **2C** | Rozšíření hooků | 🎯 Další |
| **2D** | Skryté stránky | 📋 Plánováno |
| **2E** | Neveřejná sekce + LLDAP | 📋 Plánováno |
| **3** | Moderní editor (Tiptap + TinyMCE) | 📋 Plánováno |
| **4** | Testy a nasazení | 📋 Plánováno |
| **5** | AI plugin | 🎁 Bonus |

---

## ✅ Etapa 1 – Bezpečnost (HOTOVO)

- [x] Výchozí účty a hesla odstraněny (`ensureInitialAdmin`)
- [x] Demo účty zmizely z přihlašovací stránky
- [x] Vynucený `FLATCMS_SECRET`
- [x] Sanitizace HTML (DOMPurify)
- [x] Kontrola symlinků v `safeJoin`
- [x] Limit velikosti uploadů
- [x] Rate limiting na přihlášení
- [x] CSP a bezpečnostní hlavičky
- [x] Race condition v `store.ts` (mutex)

---

## ✅ Etapa 2A – Tmavý režim (HOTOVO)

- [x] CSS proměnné pro světlý a tmavý režim
- [x] ThemeProvider + localStorage
- [x] Inline skript (žádné blikání)
- [x] Přepínač v hlavičce (světlý / tmavý / podle systému)

---

## ⚠️ Etapa 2B – Internacionalizace (ČÁSTEČNĚ)

### Hotovo
- [x] i18n systém (`src/lib/i18n.ts`)
- [x] Tři jazyky: CZ (výchozí), EN, SK
- [x] Překladové soubory (`src/messages/*.json`)
- [x] I18nProvider, `getT`, `useT`
- [x] Přepínač jazyka v hlavičce
- [x] **Oprava priority jazyka: cookie → settings.language → "cs"**
- [x] Vysvětlující box v nastavení (výchozí vs. osobní)
- [x] Tlačítko „Vymazat mou volbu"
- [x] Překlad: login, dashboard, navigace, layout, nastavení

### Zbývá
- [ ] Překlad ostatních obrazovek:
  - [ ] Seznam obsahu (`/admin/content`)
  - [ ] Editor článku (`/admin/content/edit`, `/admin/content/new`)
  - [ ] Správce souborů (`/admin/files`)
  - [ ] Pluginy (`/admin/plugins`)
  - [ ] Uživatelé (`/admin/users`)
- [ ] Anglická verze veřejného webu
- [ ] Překlad globálních dat (siteTitle, popis, patička)

**Viz `MIGRACE.md` pro postup.**

---

## 🎯 Etapa 2C – Rozšíření hooků (DALŠÍ)

### Hotovo (z Claude verze)
- [x] 8 hooků: `beforePageSave`, `afterPageSave`, `beforePageRender`, `afterPageRender`, `adminHeaderRender`, `siteHeadRender`, `siteFooterRender`, `beforeFileUpload`

### Plánováno – celkem ~24 hooků
- [ ] **Obsah:** `beforePageDelete`, `afterPageDelete`, `beforePageMove`
- [ ] **Uživatelé:** `beforeUserCreate`, `afterUserCreate`, `beforeUserDelete`, `afterUserDelete`
- [ ] **Přihlášení:** `beforeLogin`, `afterLogin` ← *pro LLDAP*
- [ ] **Média:** `beforeMediaDelete`, `afterMediaDelete`, `beforeFolderCreate`
- [ ] **Systém:** `onSettingsSave`, `registerAdminMenu`, `registerEditorToolbar`, `registerSettings`

### Doplňky
- [ ] Rozšířený plugin manager (priority, timeouty, izolace chyb)
- [ ] Dokumentace plugin API
- [ ] Ukázkové pluginy využívající nové hooky

---

## 📋 Etapa 2D – Skryté stránky (PLÁNOVÁNO)

### Jádro
- [ ] Typ stránky `hidden`
- [ ] Middleware pro `/p/*`
- [ ] UI sekce „Skryté stránky" v admin
- [ ] Server action pro tokeny

### Plugin `hidden-pages`
- [ ] Token v URL (32 znaků, crypto random)
- [ ] Volitelné heslo (scrypt)
- [ ] Volitelná expirace + čištění
- [ ] Access log

### Použití
- [ ] Test s tvým CV (veřejná + skrytá verze)
- [ ] Migrace z Bluditu

---

## 📋 Etapa 2E – Neveřejná sekce + LLDAP (PLÁNOVÁNO)

- [ ] Sekce `/private/*` za přihlášením
- [ ] LLDAP plugin (`ldapts` + GraphQL)
- [ ] Mapování skupin na role
- [ ] Konfigurace v nastavení
- [ ] Fallback: lokální účty

---

## 📋 Etapa 3 – Moderní editor (PLÁNOVÁNO)

### Vlastní editory (současný stav)
- [x] Markdown s živým náhledem
- [x] Blokový editor (vlastní)
- [x] HTML / Embed editor
- [x] WYSIWYG (contentEditable + execCommand) ← **zastaralé**

### Plánováno
- [ ] **Vyřadit `document.execCommand`** (deprecated API)
- [ ] **Nahradit vlastní WYSIWYG za TinyMCE (plná open-source verze)**
  - Lokálně hostovaný (žádné CDN)
  - Česká lokalizace
  - Vlastní konfigurace toolbaru
  - Media manager integrace (výběr obrázků ze správce souborů)
  - Plugin system TinyMCE pro budoucí rozšíření
- [ ] Alternativa: Tiptap (pro blokový editor jako náhrada vlastního)
- [ ] Zachovat vlastní blokový editor (funguje dobře) – nebo nahradit Tiptapem
- [ ] Markdown editor s živým náhledem (už máme)

### Proč TinyMCE
- **Zralá knihovna** – 20+ let vývoje, používaná v tisících aplikací
- **Plná open-source verze** (GPLv2+) je zdarma
- **Bohatý plugin systém** – tabulky, odkazy, média, šablony, atd.
- **Česká lokalizace** oficiálně dostupná
- **Vlastní toolbary** pro různé role (admin vidí víc, autor méně)
- **Přístupnost** (a11y) na vysoké úrovni

### Poznámka k licenci
TinyMCE používá **dual license**: GPLv2 (open-source) nebo komerční. Pro FlatCMS (GPLv3) je **GPLv2 verze kompatibilní** – můžeme ji používat zdarma. V kódu se přihlásí pomocí `license_key: 'gpl'`.

---

## 🧪 Etapa 4 – Testy a nasazení (PLÁNOVÁNO)

### Testy
- [ ] Playwright smoke testy
- [ ] E2E testy (login, CRUD, upload, sanitizace)

### Provoz
- [ ] Activity log
- [ ] Zálohy článků
- [ ] Session storage
- [ ] Cache + index pro 10 000+ stránek

### Storage abstraction
- [ ] Formalizovat rozhraní `ContentRepository`, `UserRepository`
- [ ] File backend
- [ ] Přepínač v nastavení (file / sqlite)

### Nasazení
- [ ] HTTPS + reverzní proxy
- [ ] Nginx/Caddy konfigurace
- [ ] Systemd služba
- [ ] Nasazení na Futro S720 / HP 260 G3 DM

---

## 🤖 Etapa 5 – AI plugin (BONUS)

### Hybridní AI
- [ ] Ollama plugin (lokální, preferováno)
- [ ] Cloud fallback (DeepSeek API)
- [ ] Konfigurace v nastavení

### Funkce
- [ ] AI panel v editoru
- [ ] Automatické perexy, tagy, alt texty
- [ ] Překlad CZ ↔ EN

---

## Doporučené pořadí

1. **Etapa 2C** (hooky) – bez nich nic dalšího nejde
2. **Etapa 2D** (skryté stránky) – konkrétní potřeba (CV)
3. **Etapa 2E** (LLDAP) – paralelně s 2D
4. **Etapa 3** (editor + TinyMCE) – UX zlepšení
5. **Etapa 4** (testy, nasazení)
6. **Etapa 5** (AI)
