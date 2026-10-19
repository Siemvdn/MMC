/**
 * Draait vóór elk testbestand.
 *
 * jsdom kent `window.matchMedia` niet — geen enkele browser-engine hoeft dat
 * te doen, het is puur een DOM-API die jsdom nooit geïmplementeerd heeft.
 * Zonder deze polyfill crasht elke hook die ernaar vraagt (`useWideScreen`,
 * `usePrefersReducedMotion`) zodra een test hem daadwerkelijk rendert, in
 * plaats van netjes een testbare waarde terug te geven. Een test die zelf een
 * andere uitkomst nodig heeft, stubt `window.matchMedia` gewoon opnieuw.
 */
if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}
