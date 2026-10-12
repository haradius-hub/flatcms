/**
 * Plugin: Vlastní analytika (v2)
 *
 * Ukázka hooků:
 *  - afterPageRender   – přidá HTML komentář do stránky
 *  - siteFooterRender  – přidá poznámku do patičky
 */

export default {
  id: "custom-analytics",
  name: "Vlastní analytika",
  version: "2.0.0",

  hooks: {
    afterPageRender(payload, ctx) {
      const id = ctx.config.trackingId || "";
      return {
        html: `${payload.html || ""}<!-- analytics:${id} -->`,
      };
    },

    siteFooterRender(_payload, ctx) {
      const note = ctx.config.footerNote || "";
      if (!note) return { html: "" };

      return {
        html: `<p class="text-xs text-slate-400">${note} (ID: ${
          ctx.config.trackingId || "n/a"
        })</p>`,
      };
    },
  },
};
