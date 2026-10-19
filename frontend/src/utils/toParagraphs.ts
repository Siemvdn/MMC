/**
 * Splitst tekst in alinea's op elke lege regel.
 *
 * Eén enter blijft een regelafbreking binnen dezelfde alinea; een lege regel
 * ertussen begint een nieuwe. Dat is hoe vrijwel iedereen tekst intypt, en het
 * scheelt de klant een uitleg over het verschil.
 */
export function toParagraphs(text: string): string[] {
  return (
    text
      // Windows-regeleindes eerst gelijktrekken, anders blijft er een \r staan
      // die als zichtbare witruimte doorkomt.
      .replace(/\r\n?/g, '\n')
      .split(/\n[^\S\n]*\n\s*/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph !== '')
  );
}
