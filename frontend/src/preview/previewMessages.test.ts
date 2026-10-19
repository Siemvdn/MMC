import { describe, expect, it } from 'vitest';

import {
  contentMessage,
  highlightMessage,
  readFromPreview,
  readToPreview,
  selectMessage,
} from './previewMessages';
import type { SiteContent } from '../types/content';

/**
 * Het berichtcontract is de beveiliging van deze functie. `postMessage` is
 * standaard open: elk venster mag elk ander venster iets sturen. Wat hier
 * doorheen komt, bepaalt wat er in het voorbeeld verschijnt.
 */
describe('previewMessages', () => {
  const site: SiteContent = {
    businessName: 'Test',
    contact: { phone: '', email: '', area: '' },
    sameAs: [],
  };

  function event(data: unknown, origin = window.location.origin): MessageEvent {
    return { data, origin } as MessageEvent;
  }

  it('accepteert een eigen bericht van de eigen herkomst', () => {
    const message = readToPreview(event(contentMessage('home', [], site)));

    expect(message?.type).toBe('content');
  });

  /** De eigenlijke grendel: een andere site mag niets bepalen. */
  it('weigert een bericht van een andere herkomst', () => {
    const vreemd = event(contentMessage('home', [], site), 'https://kwaadaardig.example');

    expect(readToPreview(vreemd)).toBeNull();
    expect(readFromPreview(vreemd)).toBeNull();
  });

  /**
   * Browserextensies en ontwikkelgereedschap sturen ook berichten rond. Zonder
   * kenmerk zouden die als inhoud binnenkomen.
   */
  it('weigert een bericht zonder ons kenmerk', () => {
    expect(readToPreview(event({ type: 'content', sections: [] }))).toBeNull();
    expect(readToPreview(event({ source: 'iets-anders', type: 'content' }))).toBeNull();
  });

  it('weigert iets dat geen object is', () => {
    expect(readToPreview(event('gewoon tekst'))).toBeNull();
    expect(readToPreview(event(null))).toBeNull();
    expect(readToPreview(event(42))).toBeNull();
  });

  /** De twee richtingen mogen niet door elkaar lopen. */
  it('houdt de twee richtingen gescheiden', () => {
    expect(readFromPreview(event(contentMessage('home', [], site)))).toBeNull();
    expect(readToPreview(event(selectMessage(2)))).toBeNull();

    expect(readFromPreview(event(selectMessage(2)))?.type).toBe('select');
    expect(readToPreview(event(highlightMessage(1)))?.type).toBe('highlight');
  });

  it('draagt de sectie-index mee', () => {
    const message = readFromPreview(event(selectMessage(3)));

    expect(message).toEqual({ source: 'site-preview', type: 'select', index: 3 });
  });

  it('kan een markering ook weghalen', () => {
    const message = readToPreview(event(highlightMessage(null)));

    expect(message).toMatchObject({ type: 'highlight', index: null });
  });
});
