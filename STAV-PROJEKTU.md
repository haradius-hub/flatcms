# FlatCMS — hlavní stav projektu a plán

> **Aktualizováno:** 10. 11. 2026  
> **Hlavní cíl:** připravit FlatCMS pro bezpečné nasazení na hosekjan.cz a následnou náhradu Bluditu.  
> **Výchozí režim:** flat-file. Databázové backendy jsou volitelné rozšíření, nikoli podmínka prvního nasazení.  
> **Stav:** aktivní vývoj — produkční připravenost zatím není ověřena.

Tento dokument je **jediným aktuálním zdrojem pravdy pro cíle, priority a stav projektu**. Starší plány a stavové dokumenty jsou archivní; jejich tvrzení o dokončení se nepovažují za ověřená, dokud nejsou potvrzena v aktuálním kódu a testech.

---

## 1. Co je FlatCMS a čeho chceme dosáhnout

FlatCMS je vlastní, modulární CMS postavený na Next.js, Reactu a TypeScriptu. Jeho hlavní předností má být jednoduché flat-file ukládání obsahu (Markdown + YAML frontmatter), přehledná administrace a možnost rozšiřování pomocí pluginů.

Projekt začal jako experiment spolupráce AI při vývoji softwaru. Nyní má i konkrétní praktický cíl: **Jan chce po dokončení a ověření převést svůj web hosekjan.cz z Bluditu na FlatCMS.**

Nejde o snahu konkurovat WordPressu ani o vytvoření univerzálního systému za každou cenu. Rozhodující je, aby FlatCMS spolehlivě obsloužil reálný web, jeho obsah a způsob práce jeho správce.

### Zásady projektu

1. **Nejdřív funkční a bezpečný CMS, potom nové funkce.**
2. **Flat-file je primární režim.** Obsah má zůstat čitelný, přenositelný a snadno zálohovatelný.
3. **Žádná zbytečná složitost.** SQLite může být pozdější volitelná možnost; PostgreSQL není podmínkou prvního nasazení.
4. **Zachovat obsah a adresy.** Migrace z Bluditu nesmí znamenat ruční přepisování webu ani zbytečné rozbití existujících URL.
5. **Bezpečnost se ověřuje testy.** Za hotovou nelze označit opravu jen proto, že ji popisuje dokumentace.
6. **Produkční změny až po záloze a ověření obnovy.** Bludit zůstává funkční zálohou až do úspěšného přepnutí a kontroly nového webu.
7. **Jedna instance aplikace.** Současný návrh flat-file úložiště počítá s jedním Node.js procesem a trvalým zapisovatelným diskem; provoz v clusteru není cílem první verze.

---

## 2. Role při vývoji

- **Jan — zadavatel, produktový vlastník a tester:** určuje požadované chování, rozhoduje o prioritách a ověřuje funkce v praxi. Nemusí programovat.
- **Implementační AI:** navrhuje a provádí změny v kódu, doplňuje testy a dokumentaci.
- **Nezávislá kontrolní AI:** reviduje návrhy a změny, hledá chyby, bezpečnostní slabiny a rozpory; navrhuje opravy a ověřovací scénáře.

Zásadní změny architektury, migrace dat, změny autentizace a produkční nasazení musí být předem vysvětleny a odsouhlaseny Janem.

---

## 3. Aktuální stav — co víme a co je nutné ověřit

Repozitář obsahuje implementaci základního CMS a dokumentace popisuje mimo jiné flat-file obsah, administraci, role, editory, pluginy, hooky, plánované publikování, revize a bezpečnostní opatření.

**Pozor:** položky níže jsou inventářem funkcí deklarovaných v README a starších dokumentech, nikoli nezávislým potvrzením, že jsou všechny správně implementované a připravené pro produkci.

| Oblast | Deklarovaný stav | Co je potřeba |
|---|---|---|
| Flat-file obsah (Markdown + YAML) | Implementováno | Ověřit CRUD, souběžné zápisy, obnovu a konzistenci |
| Administrace a editory | Implementováno částečně / více editorů | Projít běžné redakční scénáře |
| Uživatelé a role | Implementováno | Ověřit oprávnění na všech serverových cestách |
| Pluginy a hooky | Dokumentace uvádí 24 hooků | Ověřit registraci, timeouty, chybové stavy a důvěryhodnost pluginů |
| Bezpečnost | Starší dokumenty uvádějí dokončenou etapu | Provést nový audit kódu a automatické testy |
| Internacionalizace | CZ/EN/SK, částečné překlady | Dokončit jen v rozsahu potřebném pro stabilní administraci |
| Migrace z Bluditu | Není doložen hotový importér | Navrhnout a otestovat migrační postup |
| Produkční provoz | Není ověřen | Testovací instalace, zálohy, obnova, monitoring a nasazení |
| SQLite / PostgreSQL | Plán / návrh | Odložit do doby, kdy bude potřeba a bude stabilní storage rozhraní |

### První kontrola aktuálního kódu — 10. 11. 2026

Při kontrole souborů v aktuální větvi byly potvrzeny následující problémy. Jde o statickou kontrolu zdrojového kódu a stromu repozitáře; automatický build ani runtime testy zatím nebyly spuštěny.

| Závažnost | Nález | Důsledek / další krok |
|---|---|---|
| 🔴 Kritická | src/lib/auth.ts používá známý pevný fallback pro FLATCMS_SECRET | Bez nastaveného tajného klíče lze falšovat podpis session. Odstranit fallback a při chybějící/slabé konfiguraci odmítnout start. |
| 🔴 Kritická | src/lib/users.ts stále vytváří tři výchozí účty se známými hesly | Čistá instalace může být přístupná s veřejně známými přihlašovacími údaji. Nahradit bezpečným jednorázovým bootstrapem. |
| 🔴 Kritická | data/users.json je stále verzovaný soubor v repozitáři | Obsahuje záznamy účtů a password hashe; samotné přidání do .gitignore již zveřejněnou historii neodstraní. Vyřadit runtime data z Gitu a posoudit vyčištění historie. |
| 🔴 Kritická | actions.ts importuje src/lib/rate-limit, ale tento soubor v aktuálním stromu není | Pravděpodobná chyba TypeScript/build. Ověřit a doplnit nebo opravit import. |
| 🔴 Vysoká | src/app/api/media/upload/route.ts neobsahuje aplikační limit velikosti ani počtu souborů a načítá celý soubor do paměti | Riziko vyčerpání paměti a disku. Zavést limity ještě před načtením obsahu a ověřit i limity reverzní proxy. |
| 🔴 Vysoká | src/lib/paths.ts neprovádí kontrolu symlinků; segmenty '..' pouze odstraňuje | Ochrana cest není v souladu s dokumentací. Prověřit všechny operace se soubory a odmítat nebezpečné cesty. |
| 🔴 Vysoká | src/lib/store.ts používá společný .tmp soubor a nemá mutex | Paralelní zápisy mohou kolidovat; poškozený JSON se navíc tiše nahrazuje fallback hodnotou. |
| 🟠 Vysoká | data/users.json, data/settings.json a data/plugins.json jsou v repozitáři, přestože .gitignore obsahuje pravidlo pro data/*.json | Pravidlo ignoruje jen nové/nezařazené soubory; již trackované soubory zůstávají verzované. |
| 🟠 Vysoká | next.config.ts je prázdná konfigurace a ve stromu není middleware.ts | Bezpečnostní hlavičky/CSP deklarované v dokumentaci nejsou v aktuální podobě doloženy. Prověřit i konfiguraci reverzní proxy. |
| 🟠 Vysoká | src/db/index.ts importuje drizzle-orm a pg, ale tyto balíčky nejsou v package.json | Pravděpodobná chyba typechecku, i když databázový kód není zatím používán. Rozhodnout, zda odstranit nedokončený kód, nebo správně doplnit závislosti. |
| 🟡 Střední | package.json neobsahuje testovací skript a ve stromu není testovací adresář | Kritické chování zatím nemá doloženou automatickou regresní ochranu. |
| 🟡 Střední | pluginy se dynamicky načítají do stejného Node procesu; timeout pouze přestane čekat | Plugin je plně důvěryhodný kód, nikoli sandbox. Tuto hranici je nutné jasně dokumentovat a ověřit oprávnění k zapnutí pluginu. |

**Další bezpečnostní upozornění:** jeden historický dokument oprav obsahuje řetězec vypadající jako konkrétní heslo. Pokud je nebo někdy bylo používáno na skutečném účtu či jiné službě, považovat ho za kompromitované a změnit ho. Hesla ani tajné klíče se nesmějí ukládat do dokumentace nebo Gitu.

**Závěr první kontroly:** bezpečnostní etapa nemůže být považována za hotovou. FlatCMS v aktuálním stavu nesmí být nasazen jako veřejně dostupná produkční administrace, dokud nebudou odstraněny zejména výchozí účty, fallback tajný klíč, chybějící rate limiter, nezabezpečené uploady a problémy se souborovým úložištěm.

**Procento dokončení se zatím neuvádí.** Bez testovacího a akceptačního seznamu by šlo o zavádějící číslo.

---

### Doplnění auditu — autentizace, oprávnění a obsah

Kontrola dalších souborů potvrdila i následující nálezy:

| Závažnost | Nález | Důsledek / další krok |
|---|---|---|
| 🔴 Kritická | Přihlašovací formulář `src/app/admin/login/LoginForm.tsx` stále veřejně vypisuje demo účty a jejich známá hesla | Odstranit demo přihlašovací údaje z UI; současně odstranit automatické vytváření těchto účtů v backendu. |
| 🔴 Kritická | `saveArticleAction` dovoluje autorovi odeslat stav článku `published` a při založení článku neověřuje, zda cílová cesta už nepatří jinému článku | Autor může publikovat bez schválení a může přepsat obsah existujícího článku volbou stejné cesty. Ověřit vlastnictví, kolize cest a publikační oprávnění na serveru. |
| 🔴 Vysoká | `saveArticle` zapisuje přímo do cílového souboru a nemaže bezpečně původní soubor při práci se složkovým `index.md` | Hrozí přepsání obsahu a nekonzistentní přesun/mazání. Nutné transakčnější ukládání, kontrola kolizí a pokrytí testy. |
| 🔴 Vysoká | `listArticlePaths`, `getContentTree` a `listFolders` rekurzivně procházejí adresáře bez odmítání symlinků | Symlink ve stromu obsahu může způsobit průchod mimo content a vystavit obsah či zatížit server. |
| 🔴 Vysoká | `deleteArticleAction` a `deleteFolderAction` nemají jednotné explicitní chování při nepřihlášení; navíc se pracuje jen s cestou a neověřuje se vlastnictví obsahu u mazání složky | Sjednotit autorizaci a pravidla vlastnictví pro všechny serverové akce; odmítat neautorizované požadavky, ne pouze je tiše ignorovat. |
| 🟠 Vysoká | `renameMedia` používá `fs.rename` bez kontroly kolize cíle; `listMedia` používá `stat`, které následuje symlinky | Ověřit symlinky a kolize pro všechny operace se soubory, ne pouze upload. |
| 🟠 Vysoká | `sanitizeHtml` přidává a následně globálně odstraňuje DOMPurify hooky při každém volání | Sdílený stav hooků může při souběžném renderování ovlivnit sanitizaci jiného požadavku. Použít izolovanou instanci DOMPurify nebo bezstavovou konfiguraci a doplnit souběžné testy. |
| 🟠 Vysoká | `src/db/index.ts` importuje `drizzle-orm/node-postgres` a `pg`, které nejsou v `package.json` | Ověřit TypeScript build. Buď odstranit nedokončený PostgreSQL kód z první verze, nebo deklarovat závislosti až při skutečné implementaci. |
| 🟡 Střední | `data/settings.json` a `data/plugins.json` jsou také verzované runtime soubory | Z Gitu vyřadit veškerý runtime obsah `data/`; ponechat pouze bezpečné příklady/schema, pokud jsou potřeba. |

**Upřesnění k rate limitingu:** implementace `src/lib/rate-limit.ts` v aktuálním stromu chybí, přestože ji `src/app/actions.ts` importuje. To je konkrétní blokující problém pro build, nikoli jen chybějící ochrana. Stejně tak v aktuálním stromu není `src/middleware.ts` ani kořenový `middleware.ts`, přestože je popisuje historický bezpečnostní dokument.

**Upřesnění k datům v Gitu:** `.gitignore` již obsahuje pravidlo `/data/*.json`, ale soubory `data/users.json`, `data/settings.json` a `data/plugins.json` jsou již sledované Gitem. Samotné pravidlo je z indexu repozitáře neodstraní. `data/users.json` obsahuje scrypt hashe, nikoli čitelná hesla; vzhledem k tomu, že veřejný login formulář zároveň zveřejňuje demo hesla a backend je umí automaticky vytvořit, je nutné účty považovat za kompromitované a bezpečně je nahradit.

**Rozsah ověření:** jde o statickou kontrolu vybraných souborů aktuální větve GitHubu. Nebyl spuštěn `npm install`, lint, typecheck, build ani runtime test. Audit proto zatím není kompletní.

## 4. Nové pořadí práce

### Etapa 0 — Sjednocení dokumentace a technický výchozí stav
**Priorita: kritická · aktuální první krok**

- [ ] Používat tento dokument jako jediný aktuální plán.
- [ ] Označit staré stavové dokumenty a roadmapu jako archivní.
- [ ] Projít strukturu aktuální větve a porovnat deklarované funkce se skutečným kódem.
- [ ] Spustit a zaznamenat výchozí npm install, npm run lint, npm run typecheck a npm run build.
- [ ] Zjistit, které testy existují a které chybí.
- [ ] Založit seznam zjištěných chyb se závažností a odkazem na soubor.

**Výstup:** ověřený technický výchozí stav. Žádné tvrzení „hotovo“ bez důkazu.

### Etapa 1 — Stabilita a bezpečnost
**Priorita: kritická**

- [ ] Autentizace: bezpečné session cookies, expirace, odhlášení, změna hesla a ochrana tajných klíčů.
- [ ] Oprávnění: ověřit role na všech Server Actions, API routech a operacích se soubory.
- [ ] HTML/Markdown: ověřit sanitizaci všech cest vykreslení, včetně HTML a embed bloků.
- [ ] Uploady: limity velikosti a počtu, kontrola typu, bezpečné názvy a ochrana proti přístupu mimo upload adresář.
- [ ] Cesty a symlinky: ověřit ochranu proti path traversal a závodům při práci se soubory.
- [ ] Souběžné zápisy: ověřit mutex/locking a chování při chybě zápisu nebo pádu procesu.
- [ ] Rate limiting: ověřit limity v aplikaci a doplnění ochrany na reverzní proxy.
- [ ] Pluginy: zdokumentovat, že plugin je důvěryhodný kód se stejnými oprávněními jako proces CMS; timeout nepovažovat za sandbox.
- [ ] Zálohy: definovat zálohování obsahu, dat, médií a konfigurace a prakticky otestovat obnovu.
- [ ] Přidat automatické testy pro kritické bezpečnostní scénáře.

**Podmínka dokončení:** žádná známá kritická/vysoká chyba bez řešení nebo výslovně přijatého rizika; testy kritických cest procházejí.

### Etapa 2 — Funkční CMS pro běžný provoz
**Priorita: vysoká**

- [ ] Vytvořit a upravit stránku/článek, uložit koncept a publikovat.
- [ ] Stromová struktura, pořadí a vnořené stránky fungují předvídatelně.
- [ ] Slugy a URL lze bezpečně spravovat; změna URL má řešení přesměrování.
- [ ] Média lze nahrávat, vybírat v editoru, zobrazovat a mazat bez osiřelých odkazů.
- [ ] Náhled odpovídá publikované podobě.
- [ ] Plánované publikování a revize fungují i po restartu serveru.
- [ ] Role administrátor/editor/autor odpovídají skutečným oprávněním.
- [ ] Nastavení webu, navigace, hlavička a patička jsou spravovatelné bez ručních zásahů do souborů.
- [ ] Základní SEO: titulky, popisy, canonical URL, sitemap.xml a robots.txt.
- [ ] Administrace je použitelná na desktopu i mobilu.

**Poznámka:** TinyMCE, další editory a rozšiřování hooků nejsou automaticky podmínkou. Nejdřív ověřit, zda současné editory pokrývají reálnou práci na webu.

### Etapa 3 — Migrace z Bluditu
**Priorita: kritická pro přechod na hosekjan.cz**

- [ ] Zmapovat obsah Bluditu: stránky, články, kategorie, metadata, média a URL.
- [ ] Připravit importní nástroj nebo opakovatelný migrační postup.
- [ ] Zachovat texty, diakritiku, datumy, metadata, obrázky a vnitřní odkazy.
- [ ] Zachovat stávající URL, kde je to možné; pro změněné URL připravit 301 přesměrování.
- [ ] Import nejprve provést do testovací kopie FlatCMS.
- [ ] Vytvořit migrační report: importováno, přeskočeno, chybné položky, chybějící média a konflikty URL.
- [ ] Porovnat počet a obsah stránek mezi Bluditem a FlatCMS.
- [ ] Otestovat odkazy, obrázky, navigaci, vyhledávače a veřejné stránky.
- [ ] Připravit postup návratu na Bludit.

**Podmínka dokončení:** obsah je přenesen bez ztrát, veřejné URL jsou zachovány nebo přesměrovány a je ověřen návrat.

### Etapa 4 — Testovací a produkční nasazení
**Priorita: kritická**

- [ ] Zvolit cílový server a ověřit jeho Node.js verzi, disk a dostupné prostředky.
- [ ] Připravit samostatnou testovací instanci; neexperimentovat na živém webu.
- [ ] Produkční build a start ověřit mimo vývojový režim.
- [ ] Připravit systemd službu, proměnné prostředí a oprávnění souborů.
- [ ] Připravit Caddy/reverzní proxy, HTTPS a bezpečnostní hlavičky.
- [ ] Ověřit, že data a média leží na trvalém disku a nejsou součástí přepisovaného deploy adresáře.
- [ ] Zprovoznit pravidelné zálohy a ověřit obnovu na odděleném místě.
- [ ] Přidat logování, health check a základní monitoring.
- [ ] Provést akceptační testy na testovací kopii webu.

### Etapa 5 — Přechod hosekjan.cz
**Priorita: kritická · až po splnění předchozích etap**

- [ ] Udělat finální zálohu Bluditu a databáze/souborů, které používá.
- [ ] Zastavit nebo zmrazit úpravy obsahu během finální migrace.
- [ ] Provést finální import a kontrolu.
- [ ] Přepnout reverzní proxy/doménu na FlatCMS.
- [ ] Ověřit veřejný web, administraci, přihlášení, formuláře, média a URL.
- [ ] Sledovat logy a chyby po přepnutí.
- [ ] Bludit ponechat dostupný jako návratovou variantu po předem stanovenou dobu.
- [ ] Teprve po stabilním provozu rozhodnout o definitivním odstavení Bluditu.

**Definice úspěchu:** návštěvník může používat hosekjan.cz bez zjevných výpadků a správce dokáže běžně spravovat obsah ve FlatCMS.

---

## 5. Funkce odložené za první produkční nasazení

Tyto nápady nejsou zamítnuté. Jen nesmí blokovat první bezpečné nasazení:

| Funkce | Rozhodnutí |
|---|---|
| SQLite | Volitelný backend po stabilizaci a abstrakci úložiště |
| PostgreSQL | Pozdější možnost pro větší instalace; není cílem první verze |
| Přepínání backendu v administraci | Až bude existovat bezpečná migrace, záloha, validace a rollback |
| LLDAP | Až bude jasná potřeba centrální autentizace; lokální účty musí zůstat funkční |
| Skryté stránky / neveřejná sekce | Přidat podle konkrétní potřeby, nikoli na úkor stability |
| TinyMCE / Tiptap | Jen pokud současné editory nevyhoví při reálném používání |
| AI plugin | Bonus; nesmí být závislostí jádra CMS |
| Další jazyky | Po dokončení základní použitelnosti CZ/EN/SK |

---

## 6. Storage — dlouhodobý směr

- **Flat-file:** hlavní a výchozí způsob provozu. Data v souborech Markdown + YAML/JSON.
- **SQLite:** volitelná databáze v jednom souboru, pokud přinese praktický přínos.
- **PostgreSQL:** volitelný serverový backend pro větší instalace nebo více souběžných uživatelů.

Nejdřív je nutné stabilizovat současné ukládání dat. Potom lze navrhnout společné rozhraní úložiště. Přepnutí backendu nikdy nesmí být pouhá změna jedné položky v nastavení: musí zahrnovat kontrolu kompatibility, zálohu, migraci, ověření počtu a obsahu záznamů a možnost návratu.

---

## 7. Jak budeme označovat stav

- ⬜ **Neověřeno / nezačato** — nemáme důkaz, že funkce existuje a funguje.
- 🟡 **Rozpracováno** — část implementace nebo testů existuje.
- 🧪 **K ověření** — kód může existovat, ale chybí spolehlivý test.
- ✅ **Hotovo** — implementace je v aktuální větvi, relevantní testy procházejí a funkce byla ověřena.
- ⛔ **Blokováno** — čeká na rozhodnutí nebo závislost.

Samotný popis v README, roadmapě nebo komentáři v kódu není důkazem funkčnosti. Každá etapa má mít konkrétní výstup a akceptační kritéria.

---

## 8. Nejbližší konkrétní kroky

1. Projít aktuální strom repozitáře a zdrojové soubory.
2. Ověřit bezpečnostní opravy popsané v OPRAVY-BEZPECNOST.md.
3. Spustit lint, typecheck, produkční build a dostupné testy.
4. Vytvořit seznam rozdílů mezi dokumentací a kódem.
5. Teprve podle zjištění stanovit první implementační úkol.

**Aktuální pracovní priorita: Etapa 0 — technický audit a sjednocení skutečného stavu.**

---

## 9. Dokumentace

- [README.md](README.md) — úvod, instalace a rychlý start.
- [PLUGIN-API.md](PLUGIN-API.md) — dokumentace pluginů.
- [AI-PLUGIN-SPEC.md](AI-PLUGIN-SPEC.md) — odložená specifikace AI pluginu.
- [OPRAVY-BEZPECNOST.md](OPRAVY-BEZPECNOST.md) — historický popis bezpečnostních oprav; tvrzení je nutné ověřit proti aktuálnímu kódu.
- STAV-PROJEKTU2.md a ROADMAP.md — archivní dokumenty, nikoli aktuální plán.
