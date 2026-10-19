import type { ReactNode } from 'react';

import { moveItem } from './sectionTools';
import styles from './EditorPage.module.css';

export interface EntryListEditorProps<T> {
  entries: T[];
  /** Hoe één item heet in de knoppen en koppen: "Lid", "Project". */
  noun: string;
  /** Hoeveel er hoogstens mogen, gelijk aan wat de server afdwingt. */
  max: number;
  /** Een leeg nieuw item. */
  blank: () => T;
  /** Waaraan een item in zijn kop te herkennen is, meestal de naam of titel. */
  describe: (entry: T) => string;
  /** De velden van één item; `index` is er voor unieke veld-id's. */
  renderFields: (entry: T, update: (entry: T) => void, index: number) => ReactNode;
  /** Een unieke basis voor de sleutels, uit `useId()`. */
  fieldId: string;
  onChange: (entries: T[]) => void;
}

/**
 * Een lijst leden of projecten bewerken: toevoegen, verwijderen en de
 * volgorde aanpassen.
 *
 * De volgorde doet ertoe. Bij de leden bepaalt hij wie er in de vooruitblik
 * op de homepage staan, bij de projecten welk project uitgelicht wordt. Daarom
 * heeft elk item hier pijlknoppen, net als de secties zelf.
 */
export function EntryListEditor<T>({
  entries,
  noun,
  max,
  blank,
  describe,
  renderFields,
  fieldId,
  onChange,
}: EntryListEditorProps<T>) {
  function update(index: number, entry: T): void {
    onChange(entries.map((existing, position) => (position === index ? entry : existing)));
  }

  return (
    <>
      <ul className={styles.items}>
        {entries.map((entry, index) => {
          const label = `${noun} ${String(index + 1)}`;
          const description = describe(entry).trim();

          return (
            // De index als sleutel mag hier: items hebben geen eigen
            // identiteit buiten hun plek in de lijst.
            <li key={`${fieldId}-${String(index)}`} className={styles.item}>
              <div className={styles.itemHeader}>
                <span>
                  {label}
                  {description !== '' && ` — ${description}`}
                </span>

                <div className={styles.sectionTools}>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={() => {
                      onChange(moveItem(entries, index, -1));
                    }}
                    disabled={index === 0}
                    aria-label={`${label} omhoog`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={() => {
                      onChange(moveItem(entries, index, 1));
                    }}
                    disabled={index === entries.length - 1}
                    aria-label={`${label} omlaag`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={() => {
                      onChange(entries.filter((_entry, position) => position !== index));
                    }}
                    aria-label={`${label} verwijderen`}
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              {renderFields(
                entry,
                (changed) => {
                  update(index, changed);
                },
                index,
              )}
            </li>
          );
        })}
      </ul>

      {entries.length < max && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={() => {
            onChange([...entries, blank()]);
          }}
        >
          {noun} toevoegen
        </button>
      )}
    </>
  );
}
