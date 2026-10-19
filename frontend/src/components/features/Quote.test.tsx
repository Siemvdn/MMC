import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageSections } from './PageSections';
import type { QuoteSection } from '../../types/content';

function quote(overrides: Partial<QuoteSection> = {}): QuoteSection {
  return {
    type: 'quote',
    background: 'light',
    text: 'Een citaat.',
    supportingText: 'Een korte toelichting.',
    images: [{ image: '/uploads/voorbeeld.jpg', imageAlt: 'Een beschrijving van de foto' }],
    imagePosition: 'right',
    ...overrides,
  };
}

/**
 * Het citaatblok deelt zijn opmaak met Prose (dezelfde links/rechts-keuze),
 * maar heeft geen kop: een citaat opent geen nieuw onderwerp op de pagina
 * (CLAUDE.md §14).
 */
describe('het citaatblok', () => {
  it('rendert het citaat als blockquote, zonder kop', () => {
    const { container } = render(<PageSections sections={[quote()]} />);

    expect(container.querySelector('blockquote')?.textContent).toContain('Een citaat.');
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('h2')).toBeNull();
  });

  it('toont de toelichting naast het citaat', () => {
    const { container } = render(<PageSections sections={[quote()]} />);

    expect(container.textContent).toContain('Een korte toelichting.');
  });

  it('zet de omkeer-opmaak aan wanneer de foto links moet staan', () => {
    const { container } = render(<PageSections sections={[quote({ imagePosition: 'left' })]} />);

    const grid = container.querySelector('section > div > div');

    expect(grid?.className).toContain('proseImageLeft');
  });

  it('werkt ook zonder foto', () => {
    const { container } = render(<PageSections sections={[quote({ images: [] })]} />);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('blockquote')).not.toBeNull();
  });
});
