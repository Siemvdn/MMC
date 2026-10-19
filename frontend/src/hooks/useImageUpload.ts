import { useState } from 'react';

import { ApiError } from '../services/apiClient';
import { uploadImage } from '../services/adminApi';
import { prepareImage } from '../utils/prepareImage';
import { useToast } from './useToast';

const GENERIC_ERROR = 'Het uploaden is niet gelukt. Probeer het opnieuw.';

export interface UseImageUploadResult {
  /** Of er op dit moment een foto verkleind of geüpload wordt. */
  busy: boolean;
  /**
   * Verkleint en uploadt het bestand, en geeft het pad terug.
   *
   * `null` bij een mislukte poging — de foutmelding is dan al getoond, dus de
   * aanroeper hoeft alleen te beslissen wat er met een mislukking gebeurt
   * (meestal: niets, en het bestandsveld leegmaken).
   */
  upload: (file: File) => Promise<string | null>;
}

/**
 * De gedeelde stappen achter elke foto-upload in het beheer: verkleinen in de
 * browser, uploaden naar de server, en een foutmelding tonen als dat mislukt.
 *
 * Zat eerst alleen in `ImageField`. De carrousel bij een citaat heeft
 * dezelfde stappen nodig voor elke foto apart — CLAUDE.md §4: uitnemen zodra
 * iets écht een tweede keer voorkomt.
 */
export function useImageUpload(csrfToken: string): UseImageUploadResult {
  const [busy, setBusy] = useState(false);
  const { showError } = useToast();

  async function upload(file: File): Promise<string | null> {
    setBusy(true);

    try {
      /*
       * Eerst verkleinen in de browser. Zo kan de klant elke foto kiezen —
       * ook een van 20 MB rechtstreeks van een telefoon — terwijl er een
       * webklaar bestand van een paar honderd kilobyte naar de server gaat.
       * De server kan dit zelf niet: daar is geen GD of Imagick.
       */
      const { path } = await uploadImage(await prepareImage(file), csrfToken);

      return path;
    } catch (cause: unknown) {
      showError(cause instanceof ApiError ? cause.message : GENERIC_ERROR);

      return null;
    } finally {
      setBusy(false);
    }
  }

  return { busy, upload };
}
