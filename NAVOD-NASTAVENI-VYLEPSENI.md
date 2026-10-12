# Vylepšení nastavení – návod

**Datum:** 28. 9. 2026
**Co to řeší:** Matoucí nastavení vzhledu a jazyka

---

## Proč to bylo matoucí

V administraci byla **dvě místa** pro volbu vzhledu a jazyka:

1. **Přepínače vpravo nahoře** (vlajka + slunce) — osobní volba
2. **Nastavení webu** → pole „Jazyk" a „Vzhled" — výchozí hodnoty

Ale **nikde nebylo vysvětleno, jaký je mezi nimi rozdíl.** A protože osobní volba má vždy přednost, změna v nastavení se „nic nedělo".

## Co jsme přidali

### 1. Vysvětlující box nad formulářem

```

Výchozí hodnoty vs. osobní volba
Nastavení na této stránce jsou výchozí hodnoty pro všechny
návštěvníky. Přepínače v pravém horním rohu jsou osobní volba
konkrétního uživatele a ukládají se do jeho prohlížeče.

Pravidlo: osobní volba má vždy přednost před výchozí hodnotou.

```

### 2. Sekce „Vymazat mou volbu" pod formulářem

Tlačítko, které smaže:
- Cookie `flatcms_locale` (server action)
- `localStorage.flatcms_theme` (klient)
- Obnoví stránku → projeví se výchozí hodnoty

**Využití:** Admin si chce ověřit, co vidí nový návštěvník.

---

## Postup aplikace (2 minuty)

### 1. Zastav server
V terminálu `Ctrl + C`.

### 2. Zkopíruj soubory

**Přepiš:**
- `src/app/admin/settings/SettingsForm.tsx`
- `src/app/actions.ts`
- `src/messages/cs.json`
- `src/messages/en.json`
- `src/messages/sk.json`

### 3. Restartuj server
```bash
npm run dev
```

### 4. Otestuj

1. Jdi do **Nastavení** (`/admin/settings`)
2. Uvidíš nahoře **modrý box** s vysvětlením
3. Dole uvidíš **bílou sekci „Vymazat mou volbu"**
4. **Zkus to:**

- Přepni si vpravo nahoře jazyk na EN
- Jdi do nastavení, změň výchozí jazyk na SK, ulož
- Klikni na „Vymazat mou volbu"
- Stránka se obnoví → uvidíš **slovenštinu** (globální hodnota)

---

## Kdyby něco nešlo

**Box se nezobrazuje**
→ Zkontroluj, že `messages/cs.json` obsahuje klíč `settings.globalInfo`.

**Tlačítko „Vymazat mou volbu" nic nedělá**
→ Otevři F12 → Console → klikni na tlačítko → uvidíš chybu? Pošli mi ji.
→ Zkontroluj, že `actions.ts` obsahuje `clearUserPreferencesAction`.

**Po vymazání se stránka neobnoví**
→ Zkus ručně F5. Pokud to funguje, je problém v `router.refresh()` — dej vědět.

---

## Poučení

> **Dvě vrstvy nastavení (globální + osobní) jsou standard.** WordPress, Joomla, Drupal to mají stejně. Ale musí být **jasně vysvětlené**, jinak to mate.

Do budoucna: **každá volba v administraci by měla mít popisek, koho ovlivní.**

