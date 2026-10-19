import { toParagraphs } from '../../utils/toParagraphs';
import styles from './TextBlock.module.css';

export interface TextBlockProps {
  text: string;
  /** De opmaakklasse van de plek waar de tekst staat. */
  className?: string;
}

/**
 * Tekst uit het beheer, met de alinea-indeling die de klant heeft ingetypt.
 *
 * Zonder dit component komt een tekst met witregels als één blok op de site:
 * HTML voegt witruimte namelijk samen. De beheerder ziet in het tekstvak wél
 * zijn alinea's staan, en op de site niet — precies het soort verschil waar je
 * geen verklaring voor hebt als je het niet weet.
 *
 * Er wordt bewust geen HTML uit de tekst gelezen. Wat de klant intypt is tekst
 * en blijft tekst; React ontsmet dat vanzelf. `dangerouslySetInnerHTML` zou
 * hier de deur openzetten naar XSS (CLAUDE.md §11).
 */
export function TextBlock({ text, className }: TextBlockProps) {
  const paragraphs = toParagraphs(text);

  if (paragraphs.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.block} ${className ?? ''}`}>
      {paragraphs.map((paragraph, index) => (
        // De index als sleutel mag hier: de alinea's hebben geen eigen
        // identiteit en worden altijd als geheel opnieuw opgebouwd.
        <p key={index} className={styles.paragraph}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
