import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

import { ADMIN_ENTRY, ADMIN_HTML_FILE } from './src/constants/admin';
import { NOT_FOUND_ENTRY, NOT_FOUND_HTML_FILE } from './src/constants/notFound';
import { PREVIEW_ENTRY, PREVIEW_HTML_FILE } from './src/constants/preview';
import { ROUTES } from './src/constants/routes';
import { cleanUrls, contentMeta } from './vite-plugins';
import { seoTags } from './vite-seo';

/**
 * Waar de PHP-backend draait tijdens lokale ontwikkeling (`php -S`).
 * In productie staan frontend en backend op dezelfde host, dus daar is geen
 * proxy nodig — zie de toelichting bij `server.proxy` hieronder.
 */
const BACKEND_DEV_ORIGIN = 'http://localhost:8123';

export default defineConfig({
  plugins: [react(), cleanUrls(), contentMeta(), seoTags()],

  /**
   * Deze site is geen single-page app maar drie losse HTML-bestanden. Zonder
   * deze regel valt de dev-server bij een onbekend adres terug op index.html
   * en krijg je een 200 met de homepage, terwijl de .htaccess in productie
   * netjes een 404 geeft. Dat verschil zou pas ná een deploy opvallen.
   */
  appType: 'mpa',

  server: {
    /**
     * De Vite-dev-server en de PHP-server draaien op verschillende poorten,
     * dus een fetch naar /api zou een cross-origin-verzoek zijn en op CORS
     * stuklopen. Door /api door te sturen naar de PHP-server praat de
     * frontend lokaal met dezelfde relatieve paden als in productie — geen
     * omgevingsafhankelijke basis-URL in de code (CLAUDE.md §8: geen
     * hardcoded configuratie).
     */
    proxy: {
      '/api': {
        target: BACKEND_DEV_ORIGIN,
        changeOrigin: false,
      },
      /**
       * Geüploade foto's staan in backend/public/uploads/ en worden dus door
       * PHP geserveerd. Zonder deze regel zou een net geüploade foto in het
       * beheerscherm een gebroken plaatje zijn — alleen lokaal, wat het extra
       * verwarrend maakt.
       */
      '/uploads': {
        target: BACKEND_DEV_ORIGIN,
        changeOrigin: false,
      },
    },
  },

  test: {
    /**
     * React-componenten hebben een DOM nodig; jsdom levert die zonder dat er
     * een echte browser aan te pas komt.
     */
    environment: 'jsdom',

    /**
     * Aan omdat React Testing Library zijn opruimwerk na elke test op de
     * globale `afterEach` hangt. Zonder dit blijven componenten uit de ene
     * test in de volgende staan.
     */
    globals: true,

    setupFiles: ['./src/testSetup.ts'],

    include: ['src/**/*.test.{ts,tsx}'],
  },

  build: {
    outDir: 'dist',

    /**
     * Fonts nooit als base64 in de CSS inlinen. Vite doet dat standaard bij
     * bestanden onder 4 kB, maar dan verdwijnt juist het voordeel van de
     * `unicode-range` in fonts.css: een subset die de bezoeker niet nodig
     * heeft, wordt dan tóch bij elke pageload meegestuurd. Voor alle andere
     * assets blijft de standaarddrempel gelden (undefined = niet overrulen).
     */
    assetsInlineLimit: (filePath) => (filePath.endsWith('.woff2') ? false : undefined),

    /**
     * Geen sourcemaps in de productiebundel: die geven de volledige
     * broncode prijs aan iedere bezoeker (CLAUDE.md §11, minimale
     * data-exposure).
     */
    sourcemap: false,

    rollupOptions: {
      // Drie ingangen, dus drie HTML-bestanden in dist/. Elk draagt zijn eigen
      // <title> en meta description in de HTML, waar een crawler ze zonder
      // JavaScript leest (CLAUDE.md §12).
      input: {
        ...Object.fromEntries(ROUTES.map((route) => [route.slug, route.htmlFile])),
        // Het beheergedeelte is een vierde ingang, maar staat bewust niet in
        // ROUTES: die lijst voedt de navigatie en de sitemap.
        [ADMIN_ENTRY]: ADMIN_HTML_FILE,
        // Het voorbeeldvenster dat het beheer in een frame toont.
        [PREVIEW_ENTRY]: PREVIEW_HTML_FILE,
        // De pagina die Apache toont bij een onbekend adres (zie .htaccess).
        [NOT_FOUND_ENTRY]: NOT_FOUND_HTML_FILE,
      },
    },
  },
});
