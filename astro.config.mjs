// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://www.allorafoundry.com",
  trailingSlash: "never",
  build: {
    format: "directory",
    // Keep CSS in external files so the Content Security Policy can stay strict (no inline styles).
    inlineStylesheets: "never",
  },
  devToolbar: { enabled: false },
  vite: {
    // Never inline scripts into HTML: the Content Security Policy only allows same-origin files.
    build: { assetsInlineLimit: 0 },
  },
  integrations: [sitemap({ filter: (page) => !page.includes("/404") })],
});
