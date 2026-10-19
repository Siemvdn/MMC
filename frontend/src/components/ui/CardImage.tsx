import styles from './CardImage.module.css';

/** Staand voor een portret, liggend voor een project, breed voor het uitgelichte project. */
export type CardImageShape = 'portrait' | 'landscape' | 'wide';

export interface CardImageProps {
  src: string | null;
  alt: string;
  shape: CardImageShape;
  /** Extra opmaak van de plek waar de foto staat, bijvoorbeeld zonder afronding. */
  className?: string;
}

/**
 * De foto bovenaan een kaart, altijd in dezelfde verhouding.
 *
 * Anders dan Figure toont dit zónder foto wél iets: een leeg vlak in de
 * houttint van het design. In een raster van leden zou een kaart zonder foto
 * anders korter zijn dan de rest, en dan loopt de hele rij scheef. Het vlak
 * is decoratief en dus onzichtbaar voor een schermlezer.
 *
 * Deze foto's staan altijd onder de vouw en laden dus lui (CLAUDE.md §12).
 */
export function CardImage({ src, alt, shape, className }: CardImageProps) {
  const frameClass = [styles.frame, styles[shape], className].filter(Boolean).join(' ');

  if (src === null || src === '') {
    return <div className={`${frameClass} ${styles.empty}`} aria-hidden="true" />;
  }

  return <img className={frameClass} src={src} alt={alt} loading="lazy" decoding="async" />;
}
