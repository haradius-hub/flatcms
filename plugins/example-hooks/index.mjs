/**
 * Plugin: Příklad nových hooků (v1)
 *
 * Demonstruje:
 *  - beforePageSave      – přidá do Article vlastní pole s odhadem času čtení
 *  - beforePageDelete    – může zablokovat smazání (např. pokud má článek tag "chráněno")
 *  - afterPageDelete     – zaloguje smazání do konzole
 *  - afterLogin          – zaloguje přihlášení
 *  - registerAdminMenu   – přidá položku do menu administrace
 *  - registerSettings    – přidá sekci do nastavení
 *  - adminHeaderRender   – zobrazí badge v hlavičce administrace
 */

export default {
  id: "example-hooks",
  name: "Příklad nových hooků",
  version: "1.0.0",

  hooks: {
    /* ----- Obsah ----- */

    beforePageSave(payload, ctx) {
      const article = payload.article;
      if (!article) return;

      const wpm = parseInt(ctx.config.readingWpm || "200", 10) || 200;
      const words = String(article.content || "")
        .replace(/<[^>]+>/g, " ")
        .split(/\s+/)
        .filter(Boolean).length;
      const minutes = Math.max(1, Math.ceil(words / wpm));

      // Přidáme vlastní metadata do extra (nezapisuje se do frontmatteru, jen pro další pluginy)
      return {
        article,
        extra: { readingTimeMinutes: minutes, wordCount: words },
      };
    },

    beforePageDelete(payload) {
      const article = payload.article;
      if (!article) return;

      // Blokovat smazání článku s tagem "chráněno"
      if (Array.isArray(article.tags) && article.tags.includes("chraneno")) {
        return {
          extra: { blocked: true, reason: "Článek je chráněný (tag 'chraneno')." },
        };
      }
    },

    afterPageDelete(payload) {
      // eslint-disable-next-line no-console
      console.log(`[example-hooks] Článek smazán: ${payload.path}`);
    },

    /* ----- Přihlášení ----- */

    afterLogin(payload) {
      // eslint-disable-next-line no-console
      console.log(`[example-hooks] Přihlášen uživatel: ${payload.extra?.username}`);
    },

    /* ----- Rendering ----- */

    adminHeaderRender(_payload, ctx) {
      if (ctx.config.showBadge === "false") return { html: "" };
      return {
        html: `<span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">Example-hooks aktivní</span>`,
      };
    },

    /* ----- Collect hooky ----- */

    registerAdminMenu() {
      return {
        href: "/admin/example",
        label: "Ukázkový plugin",
        icon: "🎓",
        position: 90,
      };
    },

    registerSettings() {
      return {
        id: "example-hooks",
        title: "Příklad pluginu",
        description: "Ukázková sekce nastavení registrovaná pluginem.",
        fields: [
          {
            key: "readingWpm",
            label: "Rychlost čtení (slov/min)",
            type: "text",
            default: "200",
          },
          {
            key: "showBadge",
            label: "Zobrazit badge v hlavičce",
            type: "text",
            default: "true",
          },
        ],
      };
    },
  },
};
