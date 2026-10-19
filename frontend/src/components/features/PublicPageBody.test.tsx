import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicPageBody } from './PublicPageBody';
import type { ContentSection } from '../../types/content';

/**
 * Dit component is de enige definitie van hoe een pagina eruitziet — de site
 * én het voorbeeldvenster van het beheer gebruiken hem allebei. Loopt hij
 * stuk, dan liegt het voorbeeld over wat de bezoeker straks ziet.
 */
describe('PublicPageBody', () => {
  const sections: ContentSection[] = [
    {
      type: 'prose',
      background: 'light',
      heading: 'Neem contact op',
      text: 'Een uitnodiging...',
      image: null,
      imageAlt: '',
      imagePosition: 'right',
    },
    {
      type: 'prose',
      background: 'light',
      heading: 'Uw gegevens',
      text: 'Alleen gebruikt...',
      image: null,
      imageAlt: '',
      imagePosition: 'right',
    },
  ];

  it('rendert de secties op volgorde', () => {
    render(<PublicPageBody slug="over-ons" sections={sections} />);

    const koppen = screen.getAllByRole('heading');

    expect(koppen.map((kop) => kop.textContent)).toEqual(['Neem contact op', 'Uw gegevens']);
  });

  it('zet op de homepage geen contactformulier neer', () => {
    render(<PublicPageBody slug="home" sections={sections} />);

    expect(screen.queryByRole('button', { name: 'Versturen' })).toBeNull();
  });

  /**
   * De uitleg over wat er met je gegevens gebeurt hoort ná het formulier waar
   * je ze invult, niet ervoor.
   */
  it('zet op de contactpagina het formulier tussen de eerste sectie en de rest', () => {
    const { container } = render(<PublicPageBody slug="contact" sections={sections} />);

    expect(screen.getByRole('button', { name: 'Versturen' })).toBeDefined();

    const tekst = container.textContent ?? '';
    const eerste = tekst.indexOf('Neem contact op');
    const formulier = tekst.indexOf('Bericht');
    const laatste = tekst.indexOf('Uw gegevens');

    expect(eerste).toBeLessThan(formulier);
    expect(formulier).toBeLessThan(laatste);
  });

  it('geeft secties pas een index mee als daar om gevraagd wordt', () => {
    const { container: zonder } = render(<PublicPageBody slug="home" sections={sections} />);
    expect(zonder.querySelectorAll('[data-section-index]')).toHaveLength(0);

    const { container: met } = render(<PublicPageBody slug="home" sections={sections} annotate />);
    expect(met.querySelectorAll('[data-section-index]')).toHaveLength(2);
  });

  /**
   * Op de contactpagina worden de secties in twee stukken gerenderd. Zonder
   * verschuiving zou het tweede stuk weer bij nul beginnen tellen, en dan
   * wijst een klik in het voorbeeld naar het verkeerde veld.
   */
  it('nummert de secties op de contactpagina door over het formulier heen', () => {
    const { container } = render(<PublicPageBody slug="contact" sections={sections} annotate />);

    const indices = [...container.querySelectorAll('[data-section-index]')].map((element) =>
      element.getAttribute('data-section-index'),
    );

    expect(indices).toEqual(['0', '1']);
  });
});
