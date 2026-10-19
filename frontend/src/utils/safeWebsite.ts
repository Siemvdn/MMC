/** De enige schema's die als link op de site mogen komen. */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Het webadres van een lid, of `null` als er geen veilige link van te maken
 * is.
 *
 * De server laat al alleen http(s) door. Dit is de tweede controle, vlak
 * voordat het adres in een `href` belandt: React blokkeert een
 * `javascript:`-adres in een link niet, en dit is het enige vrij in te vullen
 * adres in de content (CLAUDE.md §11).
 */
export function safeWebsite(value: string): string | null {
  if (value.trim() === '') {
    return null;
  }

  try {
    const url = new URL(value);

    return ALLOWED_PROTOCOLS.includes(url.protocol) ? url.href : null;
  } catch {
    // Geen geldig absoluut adres, bijvoorbeeld "www.voorbeeld.nl".
    return null;
  }
}
