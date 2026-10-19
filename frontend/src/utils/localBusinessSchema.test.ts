import { describe, expect, it } from 'vitest';

import { SCHEMA_BUSINESS_TYPE } from '../constants/site';
import type { SiteContent } from '../types/content';
import { buildLocalBusinessSchema } from './localBusinessSchema';

const COMPLETE_SITE: SiteContent = {
  businessName: 'Voorbeeldbedrijf',
  contact: { phone: '+31 6 12345678', email: 'info@example.com', area: 'Voorbeeldstad' },
  sameAs: [],
};

describe('buildLocalBusinessSchema', () => {
  it('maakt een schema van volledige gegevens, zonder verzonnen adres', () => {
    const schema = buildLocalBusinessSchema(COMPLETE_SITE);

    expect(schema).toMatchObject({
      '@type': SCHEMA_BUSINESS_TYPE,
      name: 'Voorbeeldbedrijf',
      telephone: '+31 6 12345678',
      email: 'info@example.com',
      areaServed: 'Voorbeeldstad',
    });
    expect(schema).not.toHaveProperty('address');
  });

  it('laat sameAs weg zolang er geen links zijn', () => {
    expect(buildLocalBusinessSchema(COMPLETE_SITE)).not.toHaveProperty('sameAs');
  });

  it('neemt sameAs mee zodra er links zijn', () => {
    const links = ['https://example.com/profiel'];

    expect(buildLocalBusinessSchema({ ...COMPLETE_SITE, sameAs: links })).toHaveProperty(
      'sameAs',
      links,
    );
  });

  it.each([
    ['de bedrijfsnaam', { ...COMPLETE_SITE, businessName: '' }],
    ['het telefoonnummer', { ...COMPLETE_SITE, contact: { ...COMPLETE_SITE.contact, phone: '' } }],
    ['het e-mailadres', { ...COMPLETE_SITE, contact: { ...COMPLETE_SITE.contact, email: '' } }],
    ['het werkgebied', { ...COMPLETE_SITE, contact: { ...COMPLETE_SITE.contact, area: '' } }],
  ])('maakt niets zolang %s ontbreekt', (_label, site) => {
    expect(buildLocalBusinessSchema(site)).toBeNull();
  });
});
