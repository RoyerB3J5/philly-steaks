// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";
import node from "@astrojs/node";
// Vercel define VERCEL=1 automáticamente durante el build
const isVercel = !!process.env.VERCEL;
// https://astro.build/config
export default defineConfig({
  site: "https://www.orlandophillysteak.com",
  adapter: isVercel ? vercel() : node({ mode: "standalone" }),
  vite: {
    plugins: [tailwindcss()],
  },

  i18n: {
    defaultLocale: "en",
    locales: ["es", "en"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },

  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          es: "es-ES",
        },
      },
    }),
  ],
});
