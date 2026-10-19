import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageSections } from './PageSections';
import type { ContentSection, ImagePosition } from '../../types/content';

function prose(
  imagePosition: ImagePosition,
  image: string | null = '/uploads/foto.jpg',
): ContentSection {
  return {
    type: 'prose',
    background: 'light',
    heading: 'Een kop',
    text: 'Tekst.',
    image,
    imageAlt: image === null ? '' : 'Alt-tekst',
    imagePosition,
  };
}

/** De grid-div van het tekstblok: direct kind van Container, direct kind van de sectie. */
function proseGrid(container: HTMLElement): Element | null {
  return container.querySelector('section > div > div');
}

/**
 * De beheerder kiest per tekstblok aan welke kant de foto staat. De
 * brontekst-volgorde (tekst vóór foto) blijft ongeacht deze keuze gelijk —
 * alleen de opmaak wisselt via CSS — zodat een schermlezer altijd eerst de
 * tekst hoort (CLAUDE.md §14).
 */
describe('de plaats van de foto in een tekstblok', () => {
  it('houdt de tekst als eerste kind in de brontekst, ook met de foto links', () => {
    const { container } = render(<PageSections sections={[prose('left')]} />);

    const grid = proseGrid(container);

    expect(grid?.children[0]?.tagName).not.toBe('FIGURE');
    expect(grid?.children[1]?.tagName).toBe('FIGURE');
  });

  it('zet de omkeer-opmaak niet aan zonder foto, ook niet bij "left"', () => {
    const { container } = render(<PageSections sections={[prose('left', null)]} />);

    expect(proseGrid(container)?.className).not.toContain('proseImageLeft');
  });

  it('zet de omkeer-opmaak aan wanneer de foto links moet staan', () => {
    const { container } = render(<PageSections sections={[prose('left')]} />);

    expect(proseGrid(container)?.className).toContain('proseImageLeft');
  });

  it('laat de standaardopmaak staan wanneer de foto rechts moet staan', () => {
    const { container } = render(<PageSections sections={[prose('right')]} />);

    expect(proseGrid(container)?.className).not.toContain('proseImageLeft');
  });
});
