# Oprava 2 – Store race condition + ověření users.ts

**Datum:** 28. 9. 2026
**Problém:** Dvě chyby po aplikaci Etapy 1

---

## Chyba A: Race condition v `store.ts`

### Co se dělo

V logu se objevovalo:

```

⨯ Error: ENOENT: no such file or directory,
rename 'data\settings.json.tmp' -> 'data\settings.json'

```

### Proč to bylo

Next.js spouštěl **paralelně** několik requestů:
- `src/app/layout.tsx` → `getSettings()`
- `src/app/admin/layout.tsx` → `getSettings()`
- `src/app/(site)/layout.tsx` → `getSettings()`

Každý z nich volal `readJson("settings.json", ...)`. Soubor neexistoval, takže každý zkusil `writeJson()`:

1. Request A: `writeFile("settings.json.tmp")` ✅
2. Request B: `writeFile("settings.json.tmp")` ✅ (přepíše)
3. Request A: `rename("settings.json.tmp", "settings.json")` ✅ (soubor zmizí)
4. Request B: `rename("settings.json.tmp", "settings.json")` ❌ **ENOENT** — soubor už neexistuje

### Jak jsme to opravili

Přidali jsme **mutex** (per-soubor zámek) do `src/lib/store.ts`:

- Každý zápis do stejného souboru se **zařadí do fronty** za předchozí
- Jméno `.tmp` souboru je **unikátní** (PID + timestamp + náhodný suffix)
- Při selhání `rename` se `.tmp` uklidí

### Co dělat

Nahraď `src/lib/store.ts` naším novým souborem.

---

## Chyba B: `src/lib/users.ts` je STARÝ

### Jak jsme to poznali

V `data/users.json` se po smazání vytvořily **tři účty**:
- `admin` s `admin@example.cz`
- `editor` s `editor@example.cz`
- `autor` s `autor@example.cz`

Náš opravený kód:
- Vytváří **jen jednoho admina**
- Bere email z `CMS_ADMIN_EMAIL` (máš `tvuj@email.cz`)
- **Nikdy** nevytváří účty `editor` a `autor`

Ty tři účty jsou z **původního Claude `defaultUsers()`** — soubor tedy není náš.

### Ověření

Otevři `src/lib/users.ts` v VSCodium a stiskni `Ctrl+F`:

| Hledáš | Znamená |
|---|---|
| `defaultUsers` | ❌ **Starý soubor** — nutno nahradit |
| `ensureInitialAdmin` | ✅ **Náš nový soubor** |

### Co dělat

Nahraď `src/lib/users.ts` naším novým souborem (v ZIPu).

---

## Postup opravy (5 minut)

### 1. Zastav server
V terminálu `Ctrl + C`.

### 2. Zkopíruj soubory
- `src/lib/store.ts` ← přepiš
- `src/lib/users.ts` ← přepiš

### 3. Smaž stará data
```powershell
Remove-Item data\users.json -Force
```

### 4. Restartuj server

```
npm run dev
```

### 5. Ověř, že admin je jen jeden

V konzoli uvidíš:

```
[FlatCMS] Vytvořen výchozí administrátor 'admin' s heslem z CMS_ADMIN_PASSWORD.
```

Otevři `data/users.json` a zkontroluj:

```
[
  {
    "username": "admin",
    "email": "tvuj@email.cz",   ← tvoje hodnota z .env.local
    "role": "administrator"
  }
]
```

**Měl by tam být JEN JEDEN záznam.**

### 6. Přihlas se

- Uživatel: `admin`
- Heslo: `H@rad82H@rad`

---

## Poučení

### O race condition

> **Když v Next.js píšeš do souboru, vždy předpokládej paralelní volání.** Layoutů je víc, requestů je víc, může se to potkat. Mutex (fronta) je nejjednodušší řešení.

### O kopírování souborů

> **Když dostaneš opravu, musíš zkopírovat VŠECHNY soubory.** Když vynecháš jeden (jako `users.ts`), projeví se to až za běhu — a to špatně.

### O datech

> **Oprava kódu nemění existující data.** Když měníš způsob bootstrapu, musíš smazat starý bootstrap soubor. To je správné chování — nikdy nemaž uživatelská data bez vědomí.

---

## Kontrolní seznam

Po opravě zkontroluj:

- □  
`src/lib/store.ts` — obsahuje `writeLocks`
- □  
`src/lib/users.ts` — obsahuje `ensureInitialAdmin` a **neobsahuje** `defaultUsers`
- □  
`data/users.json` — obsahuje **jen jeden záznam**
- □  
Konzole — žádné `ENOENT` chyby
- □  
Přihlášení — funguje s `admin` / `H@rad82H@rad`

