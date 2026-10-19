import type { Plugin } from 'vite';

import contactContent from '../backend/storage/content/contact.json';
import homeContent from '../backend/storage/content/home.json';
import aboutContent from '../backend/storage/content/over-ons.json';
import privacyContent from '../backend/storage/content/privacy.json';
import termsContent from '../backend/storage/content/terms.json';
import { ADMIN_HTML_FILE, ADMIN_PATH } from './src/constants/admin';
import { PREVIEW_HTML_FILE, PREVIEW_PATH } from './src/constants/preview';
import { ROUTES, type PageSlug } from './src/constants/routes';

/**
 * Bouwplugins. Staan los van `vite.config.ts` zodat dat bestand leesbaar
 * blijft als een opsomming van instellingen.
 */

/**
 * Laat de dev-server `/over-ons` serveren in plaats van `/over-ons.html`.
 *
 * De site bestaat uit drie losse HTML-bestanden. In productie zorgt de
 * `.htaccess` ervoor dat de schone URL bij het juiste bestand uitkomt; de
 * dev-server doet dat niet uit zichzelf. Zonder dit stukje zou je lokaal een
 * andere URL gebruiken dan op de server, en dat is precies het soort verschil
 * dat pas ná een deploy opvalt.
 */
export function cleanUrls(): Plugin {
  const htmlByPath = new Map<string, string>([
    ...ROUTES.map((route) => [route.path, `/${route.htmlFile}`] as const),
    [ADMIN_PATH, `/${ADMIN_HTML_FILE}`],
    [PREVIEW_PATH, `/${PREVIEW_HTML_FILE}`],
  ]);

  return {
    name: 'site-clean-urls',
    configureServer(server) {
      // Eigen parametertypes in plaats van die van Vite. Vite typeert de
      // request als Node's IncomingMessage, en dat type bestaat alleen als
      // @types/node geïnstalleerd is. We gebruiken hier maar één veld.
      server.middlewares.use((request: { url?: string }, _response: unknown, next: () => void) => {
        const url = request.url;

        if (url !== undefined) {
          const [path = ''] = url.split('?');
          const htmlFile = htmlByPath.get(path);

          // `/` wijst al naar index.html; alleen de andere hebben hulp nodig.
          if (htmlFile !== undefined && htmlFile !== '/index.html') {
            request.url = htmlFile + url.slice(path.length);
          }
        }

        next();
      });
    },
  };
}

/** De inhoud van de paginabestanden, op slug. */
const CONTENT_BY_SLUG: Record<PageSlug, { meta: { title: string; description: string } }> = {
  home: homeContent,
  'over-ons': aboutContent,
  contact: contactContent,
  privacy: privacyContent,
  terms: termsContent,
};

/**
 * Zet de `<title>` en de meta description uit de content-JSON in de HTML.
 *
 * ## Waarom dit bestaat
 *
 * De site bestaat uit drie statische HTML-bestanden, juist zodat een crawler
 * de titel ziet zonder JavaScript uit te voeren (CLAUDE.md §12). Maar de
 * titels stonden daarmee op twee plekken: in de HTML én in `meta` in de
 * content-JSON. Twee plekken die hetzelfde beweren, lopen vroeg of laat uit
 * elkaar.
 *
 * De JSON is nu de enige bron. Deze plugin schrijft de waarde bij het bouwen
 * in de HTML, dus de crawler ziet hem nog steeds zonder JavaScript.
 *
 * ## Wat dat betekent voor het CMS
 *
 * Het `meta`-blok is van de ontwikkelaar, niet van de klant: een wijziging
 * werkt pas na een nieuwe build en deploy. Het CMS moet daarom alleen
 * `sections` aanbieden. Zou het `meta` tonen, dan lijkt het te werken terwijl
 * er niets verandert op de site — en dat is erger dan het veld niet hebben.
 */
export function contentMeta(): Plugin {
  return {
    name: 'site-content-meta',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const route = ROUTES.find((candidate) =>
          context.path.replace(/^\//, '').startsWith(candidate.htmlFile),
        );

        if (route === undefined) {
          return html;
        }

        const { title, description } = CONTENT_BY_SLUG[route.slug].meta;

        warnWhenEmpty(route.htmlFile, title, description);

        return applyMeta(html, title, description);
      },
    },
  };
}

function applyMeta(html: string, title: string, description: string): string {
  let result = html;

  // Leeg betekent: nog niet aangeleverd. Dan blijft staan wat er in het
  // HTML-bestand stond, in plaats van dat we de tag leegmaken.
  if (title !== '') {
    result = replaceOutsideComments(
      result,
      /<title>[\s\S]*?<\/title>/,
      `<title>${escapeHtml(title)}</title>`,
    );
  }

  if (description !== '') {
    result = replaceOutsideComments(
      result,
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeHtml(description)}" />`,
    );
  }

  return result;
}

/** Herkent een HTML-commentaarblok. */
const HTML_COMMENT = /<!--[\s\S]*?-->/g;

/**
 * Het teken waarmee een weggehaald commentaar tijdelijk wordt aangeduid.
 * Een nulbyte komt in een HTML-bronbestand niet voor, dus deze sleutel kan
 * nooit met echte inhoud botsen.
 */
const MASK = '\u0000';

/**
 * Vervangt het eerste voorkomen buiten HTML-commentaar.
 *
 * Dit is geen overdreven voorzichtigheid maar een geleerde les. De
 * toelichting boven de titel in de HTML-bestanden noemde de titel-tag
 * letterlijk, tussen punthaken. Een gewone `replace` pakte dát voorkomen,
 * verving alles tot de échte sluittag, en liet een onafgesloten commentaar
 * achter — waarna de build afbrak met `eof-in-comment`.
 *
 * De aanpak: commentaren tijdelijk wegnemen, dan pas vervangen, dan de
 * commentaren terugzetten.
 */
function replaceOutsideComments(html: string, pattern: RegExp, replacement: string): string {
  const comments: string[] = [];

  const masked = html.replace(HTML_COMMENT, (comment) => {
    comments.push(comment);

    return `${MASK}${String(comments.length - 1)}${MASK}`;
  });

  const restore = new RegExp(`${MASK}(\\d+)${MASK}`, 'g');

  return masked
    .replace(pattern, replacement)
    .replace(restore, (_match, index: string) => comments[Number(index)] ?? '');
}

/**
 * Een luide waarschuwing bij elke build, zolang de teksten ontbreken.
 *
 * Dit is met opzet niet stil: een pagina zonder titel of description is een
 * concreet gebrek op de opleverchecklist (§21), en zoiets moet je tegenkomen
 * zonder ernaar te zoeken.
 */
function warnWhenEmpty(htmlFile: string, title: string, description: string): void {
  const missing: string[] = [];

  if (title === '') {
    missing.push('title');
  }

  if (description === '') {
    missing.push('description');
  }

  if (missing.length > 0) {
    console.warn(
      `[site] ${htmlFile}: meta.${missing.join(' en meta.')} ontbreekt nog in de content-JSON.`,
    );
  }
}

/**
 * De teksten komen uit een bestand dat de klant via het CMS gaat bewerken.
 * Ongefilterd in HTML plakken zou betekenen dat een punthaak in een titel de
 * pagina breekt — of erger (CLAUDE.md §11).
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
