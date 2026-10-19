import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { HEADER_ACTION } from '../constants/routes';
import { Header } from './Header';

/**
 * Het hamburgermenu bestaat alleen voor mobiel — op een breed scherm staat
 * alles al uitgeklapt via CSS (`display: contents`). Deze tests controleren
 * daarom het gedrag van de knop en het menu zelf, niet de zichtbaarheid op
 * een bepaalde schermbreedte: dat is wat de CSS-media-query regelt, en jsdom
 * past geen CSS toe.
 */
describe('Header', () => {
  function renderHeader(): void {
    render(<Header businessName="Voorbeeldbedrijf" currentSlug="home" />);
  }

  it('toont de navigatielinks en de aanvraagknop', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Home' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Over ons' })).toBeDefined();
    expect(screen.getByRole('link', { name: HEADER_ACTION.label })).toBeDefined();
  });

  it('toont geen aparte Contact-link naast de aanvraagknop', () => {
    renderHeader();

    expect(screen.queryByRole('link', { name: 'Contact' })).toBeNull();
  });

  it('toont de bedrijfsnaam als link naar de homepage', () => {
    renderHeader();

    expect(screen.getByRole('link', { name: 'Voorbeeldbedrijf' }).getAttribute('href')).toBe('/');
  });

  it('begint dichtgeklapt', () => {
    renderHeader();

    const toggle = screen.getByRole('button', { name: /menu/i });

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('klapt open en weer dicht bij een klik op de knop', () => {
    renderHeader();

    const toggle = screen.getByRole('button', { name: 'Menu' });
    fireEvent.click(toggle);

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Sluiten' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Sluiten' }));

    expect(screen.getByRole('button', { name: 'Menu' }).getAttribute('aria-expanded')).toBe(
      'false',
    );
  });

  it('sluit met de Escape-toets', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('button', { name: 'Sluiten' })).toBeDefined();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined();
  });

  it('sluit bij een klik buiten het menu', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    expect(screen.getByRole('button', { name: 'Sluiten' })).toBeDefined();

    fireEvent.pointerDown(document.body);

    expect(screen.getByRole('button', { name: 'Menu' })).toBeDefined();
  });

  it('blijft open bij een klik binnen het menu zelf', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    fireEvent.pointerDown(screen.getByRole('link', { name: 'Over ons' }));

    expect(screen.getByRole('button', { name: 'Sluiten' })).toBeDefined();
  });
});
