import { SCHEMA_BUSINESS_TYPE, SITE_ORIGIN, SOCIAL_IMAGE_PATH } from '../constants/site';
import type { SiteContent } from '../types/content';

/**
 * Het LocalBusiness-schema (CLAUDE.md §12), of `null` zolang de gegevens
 * onvolledig zijn.
 *
 * Onvolledige of verzonnen NAP-gegevens zijn schadelijker dan geen schema,
 * dus er wordt niets gegenereerd tenzij naam, telefoon, e-mail én werkgebied
 * er zijn.
 *
 * Er staat bewust geen `address` in: er is geen straatadres aangeleverd, en
 * het werkgebied staat in `areaServed`. [TODO: adres — komt er een openbaar
 * adres, dan hoort het hier, exact gelijk aan het Google Business Profile.]
 * `sameAs` verschijnt pas zodra `site.json` links bevat.
 */
export function buildLocalBusinessSchema(site: SiteContent): Record<string, unknown> | null {
  const { businessName, contact, sameAs } = site;

  if (businessName === '' || contact.phone === '' || contact.email === '' || contact.area === '') {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': SCHEMA_BUSINESS_TYPE,
    '@id': `${SITE_ORIGIN}/#business`,
    name: businessName,
    url: `${SITE_ORIGIN}/`,
    telephone: contact.phone,
    email: contact.email,
    image: `${SITE_ORIGIN}${SOCIAL_IMAGE_PATH}`,
    areaServed: contact.area,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}
