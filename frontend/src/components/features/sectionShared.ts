import type { HeadingLevel } from '../ui/Heading';
import styles from './Sections.module.css';

/** Wat elk sectiecomponent van PageSections meekrijgt. */
export interface SectionComponentProps<T> {
  section: T;
  level: HeadingLevel;
  /**
   * Waarde voor `data-section-index`; `undefined` laat het attribuut helemaal
   * weg, want React slaat undefined-attributen over.
   */
  marker?: string;
  /** Of deze sectie het getinte vlak krijgt. Kiest de beheerder per sectie. */
  banded: boolean;
}

/** De opmaakklasse van een sectie, met of zonder getinte achtergrond. */
export function sectionClass(banded: boolean): string {
  return banded ? `${styles.section} ${styles.band}` : (styles.section ?? '');
}
