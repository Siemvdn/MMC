import { useId, useRef } from 'react';

import { Field } from '../../components/ui/Field';
import { useImageUpload } from '../../hooks/useImageUpload';
import styles from './EditorPage.module.css';

export interface ImageFieldProps {
  image: string | null;
  imageAlt: string;
  csrfToken: string;
  onChange: (image: string | null, imageAlt: string) => void;
}

/**
 * De afbeelding bij een sectie: kiezen, vervangen en verwijderen.
 *
 * De alt-tekst staat er niet voor de sier. Een betekenisvolle afbeelding
 * zonder beschrijving is onbruikbaar voor wie de site met een schermlezer
 * gebruikt, en de server weigert zo'n sectie op te slaan (CLAUDE.md §14). Dat
 * wordt hier dus meteen gemeld, in plaats van pas bij het opslaan.
 */
export function ImageField({ image, imageAlt, csrfToken, onChange }: ImageFieldProps) {
  const { busy, upload } = useImageUpload(csrfToken);
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldId = useId();

  const hasImage = image !== null && image !== '';
  const altIsMissing = hasImage && imageAlt.trim() === '';

  async function handleFile(file: File): Promise<void> {
    const path = await upload(file);

    if (path !== null) {
      // De alt-tekst blijft staan bij vervangen: meestal beschrijft hij nog
      // steeds waar de foto over gaat.
      onChange(path, imageAlt);
    }

    // Het invoerveld leegmaken, anders kun je hetzelfde bestand niet nog
    // eens kiezen na een mislukte poging.
    if (inputRef.current !== null) {
      inputRef.current.value = '';
    }
  }

  return (
    <div className={styles.imageBlock}>
      {hasImage && (
        <div className={styles.imagePreview}>
          {/* De alt is hier leeg: dit is een voorbeeldweergave binnen het
              beheer, en de echte beschrijving staat in het veld eronder. */}
          <img src={image} alt="" className={styles.thumbnail} />
          <span className={styles.imagePath}>{image}</span>
        </div>
      )}

      <div className={styles.imageActions}>
        <label className={styles.fileButton} htmlFor={`${fieldId}-bestand`}>
          {busy ? 'Bezig met verkleinen…' : hasImage ? 'Vervangen' : 'Foto kiezen'}
        </label>
        <input
          ref={inputRef}
          id={`${fieldId}-bestand`}
          className={styles.fileInput}
          type="file"
          accept="image/*"
          disabled={busy}
          onChange={(event) => {
            const chosen = event.target.files?.[0];

            if (chosen !== undefined) {
              void handleFile(chosen);
            }
          }}
        />

        {hasImage && (
          <button
            type="button"
            className={styles.toolButton}
            disabled={busy}
            onClick={() => {
              /*
               * Het bestand blijft op de server staan. Dat is met opzet: een
               * andere sectie kan dezelfde foto gebruiken, en een verwijdering
               * die je nog wilt terugdraaien mag geen bestand kosten. Het
               * opruimen van foto's waar niets meer naar verwijst komt later.
               */
              onChange(null, '');
            }}
          >
            Verwijderen
          </button>
        )}
      </div>

      {hasImage && (
        <Field
          id={`${fieldId}-alt`}
          label="Beschrijving van de foto (verplicht)"
          value={imageAlt}
          onChange={(value) => {
            onChange(image, value);
          }}
          error={
            altIsMissing
              ? 'Beschrijf kort wat er op de foto staat. Zonder beschrijving kan de pagina niet opgeslagen worden.'
              : undefined
          }
        />
      )}
    </div>
  );
}
