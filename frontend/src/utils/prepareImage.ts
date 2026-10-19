/**
 * Maakt een gekozen foto klaar om te uploaden: verkleinen en hercomprimeren.
 *
 * ## Waarom dit in de browser gebeurt en niet op de server
 *
 * De server kan het niet: er is geen GD en geen Imagick beschikbaar. Zonder
 * deze stap zou een foto rechtstreeks van een telefoon — al snel 10 tot 20 MB
 * — ongewijzigd naar elke bezoeker gaan. CLAUDE.md §12 stelt Core Web Vitals
 * als bouweis (LCP onder 2,5 seconden), en §13 vraagt om afbeeldingen te
 * comprimeren vóór gebruik. Dat gebeurt hier.
 *
 * Bijkomend voordeel: het origineel verlaat de computer van de klant nooit.
 * Wat er geüpload wordt is een verkleinde kopie van een paar honderd kilobyte.
 */

/**
 * De langste zijde na verkleinen.
 *
 * Nagerekend op de opmaak: de breedste plek waar beeld verschijnt is de hero,
 * en die komt op de leesbreedte van 1280 uit op ongeveer 560 pixels. Op een
 * scherm met dubbele pixeldichtheid is 1120 pixels dus genoeg; 1600 geeft daar
 * nog ruimte bovenop.
 *
 * Hoger heeft geen zin en kost wel wat: elke bezoeker haalt die bytes op, en
 * §12 stelt de laadtijd als bouweis. Wordt de opmaak ooit breder, dan hoort
 * dit getal mee te groeien.
 */
const MAX_EDGE = 1600;

/** WebP op deze kwaliteit is voor foto's met het blote oog niet van het origineel te onderscheiden. */
const QUALITY = 0.82;

/**
 * Een bestand dat al klein én klein genoeg van afmeting is, laten we met rust.
 * Opnieuw comprimeren zou alleen kwaliteit kosten zonder iets op te leveren.
 */
const ALREADY_SMALL_ENOUGH_BYTES = 800 * 1024;

export interface Size {
  width: number;
  height: number;
}

/**
 * De afmetingen na verkleinen, met de verhoudingen intact.
 *
 * Is de afbeelding al klein genoeg, dan komt hij ongewijzigd terug — nooit
 * vergroten, want dat voegt geen detail toe en kost alleen bytes.
 */
export function targetSize(width: number, height: number, maxEdge = MAX_EDGE): Size {
  const longest = Math.max(width, height);

  if (longest <= maxEdge || longest === 0) {
    return { width, height };
  }

  const factor = maxEdge / longest;

  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

/**
 * Verkleint en hercomprimeert een foto.
 *
 * Lukt dat niet — een formaat dat de browser niet kan uitpakken, bijvoorbeeld
 * — dan komt het originele bestand terug. De server beoordeelt het dan zelf en
 * geeft een begrijpelijke melding; dat is beter dan hier een fout opwerpen
 * over iets wat de gebruiker niet kan plaatsen.
 */
export async function prepareImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;

  try {
    // `from-image` past de draairichting uit de EXIF-gegevens toe. Zonder dat
    // komt een staande telefoonfoto liggend op de site terecht.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  try {
    const size = targetSize(bitmap.width, bitmap.height);
    const unchanged = size.width === bitmap.width && size.height === bitmap.height;

    if (unchanged && file.size <= ALREADY_SMALL_ENOUGH_BYTES) {
      return file;
    }

    const blob = await toBlob(bitmap, size);

    if (blob === null || blob.size >= file.size) {
      // Groter dan het origineel gebeurt bij afbeeldingen die al goed
      // gecomprimeerd zijn. Dan is het origineel gewoon beter.
      return file;
    }

    return new File([blob], nameFor(file.name, blob.type), { type: blob.type });
  } finally {
    bitmap.close();
  }
}

async function toBlob(bitmap: ImageBitmap, size: Size): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;

  const context = canvas.getContext('2d');

  if (context === null) {
    return null;
  }

  context.drawImage(bitmap, 0, 0, size.width, size.height);

  const webp = await encode(canvas, 'image/webp');

  // Kan de browser geen WebP maken, dan levert toBlob stilzwijgend PNG op.
  // Dan is JPEG voor een foto de betere keuze.
  return webp !== null && webp.type === 'image/webp' ? webp : encode(canvas, 'image/jpeg');
}

function encode(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, QUALITY);
  });
}

function nameFor(original: string, mimeType: string): string {
  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const base = original.replace(/\.[^.]+$/, '') || 'foto';

  return `${base}.${extension}`;
}
