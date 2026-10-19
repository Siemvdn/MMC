import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageSections } from './PageSections';
import type { ContentSection, ListVariant } from '../../types/content';

function list(variant: ListVariant): ContentSection {
  return {
    type: 'list',
    background: 'light',
    variant,
    heading: 'Een lijst',
    intro: '',
    items: [
      { title: 'Eerste stap', text: 'Een korte uitleg.' },
      { title: 'Tweede stap', text: 'Nog een uitleg.' },
    ],
  };
}

/**
 * Dezelfde items, twee vormen. Het verschil zit niet alleen in de opmaak: bij
 * stappen is de volgorde de betekenis, en dat hoort in het element te zitten
 * en niet alleen in de cijfers die je ziet (CLAUDE.md §14).
 */
describe('de weergave van een lijst', () => {
  it('gebruikt een ongeordende lijst voor kaarten', () => {
    const { container } = render(<PageSections sections={[list('cards')]} />);

    expect(container.querySelector('ul')).not.toBeNull();
    expect(container.querySelector('ol')).toBeNull();
  });

  it('gebruikt een geordende lijst voor stappen', () => {
    const { container } = render(<PageSections sections={[list('steps')]} />);

    expect(container.querySelector('ol')).not.toBeNull();
    expect(container.querySelector('ul')).toBeNull();
  });

  it('gebruikt een geordende lijst voor de tijdlijn', () => {
    const { container } = render(<PageSections sections={[list('timeline')]} />);

    expect(container.querySelector('ol')).not.toBeNull();
    expect(container.querySelector('ul')).toBeNull();
  });

  /** Het bolletje is decoratief: het periode-label zegt al waar een punt in de tijd zit. */
  it('houdt de bolletjes van de tijdlijn buiten de voorleesvolgorde', () => {
    const { container } = render(<PageSections sections={[list('timeline')]} />);

    for (const item of container.querySelectorAll('li')) {
      expect(item.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('nummert de stappen zichtbaar vanaf één', () => {
    const { container } = render(<PageSections sections={[list('steps')]} />);

    const numbers = [...container.querySelectorAll('[aria-hidden="true"]')].map(
      (element) => element.textContent,
    );

    expect(numbers).toEqual(['1', '2']);
  });

  /** De cijfers zijn decoratief: de <ol> draagt de nummering al. */
  it('houdt de cijfers buiten de voorleesvolgorde', () => {
    const { container } = render(<PageSections sections={[list('steps')]} />);

    for (const item of container.querySelectorAll('li')) {
      expect(item.querySelector('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('toont in alle vormen dezelfde teksten', () => {
    for (const variant of ['cards', 'steps', 'timeline'] as const) {
      const { container } = render(<PageSections sections={[list(variant)]} />);

      expect(container.textContent).toContain('Eerste stap');
      expect(container.textContent).toContain('Nog een uitleg.');
    }
  });
});
