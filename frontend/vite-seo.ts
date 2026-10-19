import type { HtmlTagDescriptor, Plugin } from 'vite';

import contactContent from '../backend/storage/content/contact.json';
import homeContent from '../backend/storage/content/home.json';
import aboutContent from '../backend/storage/content/over-ons.json';
import privacyContent from '../backend/storage/content/privacy.json';
import siteContent from '../backend/storage/content/site.json';
import termsContent from '../backend/storage/content/terms.json';
import { SITE_LOCALE, SITE_ORIGIN, SOCIAL_IMAGE_PATH } from './src/constants/site';
import { buildLocalBusinessSchema } from './src/utils/localBusinessSchema';
import { ROUTES, type PageSlug, type RouteDefinition } from './src/constants/routes';

/**
 * SEO-tags die op elke publieke pagina horen, en het LocalBusiness-schema op
 * de homepage (CLAUDE.md §12).
 *
 * Alles komt hier bij het bouwen in de HTML, zodat een crawler het ziet zonder
 * JavaScript uit te voeren — om dezelfde reden als `contentMeta()`.
 */

const META_BY_SLUG: Record<PageSlug, { title: string; description: string }> = {
  home: homeContent.meta,
  'over-ons': aboutContent.meta,
  contact: contactContent.meta,
  privacy: privacyContent.meta,
  terms: termsContent.meta,
};

function metaTag(attribute: 'name' | 'property', key: string, content: string): HtmlTagDescriptor {
  return { tag: 'meta', attrs: { [attribute]: key, content }, injectTo: 'head' };
}

/** Een absoluut adres, want canonical en Open Graph horen dat te zijn. */
function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}

function buildPageTags(route: RouteDefinition): HtmlTagDescriptor[] {
  const { title, description } = META_BY_SLUG[route.slug];
  const url = absoluteUrl(route.path);

  const tags: HtmlTagDescriptor[] = [
    { tag: 'link', attrs: { rel: 'canonical', href: url }, injectTo: 'head' },
    metaTag('property', 'og:type', 'website'),
    metaTag('property', 'og:locale', SITE_LOCALE),
    metaTag('property', 'og:site_name', siteContent.businessName),
    metaTag('property', 'og:url', url),
    metaTag('property', 'og:image', absoluteUrl(SOCIAL_IMAGE_PATH)),
    metaTag('name', 'twitter:card', 'summary'),
  ];

  // Leeg betekent nog niet aangeleverd: dan liever geen tag dan een lege.
  if (title !== '') {
    tags.push(metaTag('property', 'og:title', title));
  }

  if (description !== '') {
    tags.push(metaTag('property', 'og:description', description));
  }

  return tags;
}

/**
 * JSON in een script-tag mag nooit `</script>` bevatten. De waarden komen uit
 * een bestand dat de klant via het beheer bewerkt, dus `<` wordt uitgeschreven.
 */
function toScriptJson(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function seoTags(): Plugin {
  return {
    name: 'site-seo-tags',
    transformIndexHtml: {
      order: 'pre',
      handler(html, context) {
        const route = ROUTES.find((candidate) =>
          context.path.replace(/^\//, '').startsWith(candidate.htmlFile),
        );

        if (route === undefined) {
          return { html, tags: [] };
        }

        const tags = buildPageTags(route);

        if (route.slug === 'home') {
          const schema = buildLocalBusinessSchema(siteContent);

          if (schema === null) {
            console.warn('[site] LocalBusiness-schema overgeslagen: site.json is onvolledig.');
          } else {
            tags.push({
              tag: 'script',
              attrs: { type: 'application/ld+json' },
              children: toScriptJson(schema),
              injectTo: 'head',
            });
          }
        }

        return { html, tags };
      },
    },
  };
}
