/**
 * Plugin: SEO nástroje (v2)
 *
 * Ukázka napojení na životní cyklus CMS přes hooky:
 *  - beforePageSave     – doplní popisek, pokud autor žádný nevyplnil
 *  - siteHeadRender     – vloží meta značky do hlavičky webu
 *  - adminHeaderRender  – zobrazí info proužek v administraci
 */

export default {
  id: "seo-tools",
  name: "SEO nástroje",
  version: "2.0.0",

  hooks: {
    /** Doplní popisek, pokud autor žádný nevyplnil. */
    beforePageSave(payload) {
      const article = payload.article;
      if (!article) return;

      if (!article.description || !article.description.trim()) {
        const plain = String(article.content || "")
          .replace(/<[^>]+>/g, " ")
          .replace(/[#*_`>]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        article.description = plain.slice(0, 155);
      }

      return { article };
    },

    /** Vloží meta značky do hlavičky webu. */
    siteHeadRender(_payload, ctx) {
      const keywords = ctx.config.siteKeywords || "";
      const twitter = ctx.config.twitterHandle || "";

      const html =
        `<meta name="keywords" content="${keywords}" />` +
        (twitter ? `<meta name="twitter:site" content="${twitter}" />` : "");

      return { html };
    },

    /** Informační proužek v administraci. */
    adminHeaderRender(_payload, ctx) {
      return {
        html: `<span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">SEO plugin aktivní · ${
          ctx.config.siteKeywords || "bez klíčových slov"
        }</span>`,
      };
    },
  },
};
