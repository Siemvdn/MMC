import styles from './Figure.module.css';

export interface FigureProps {
  src: string | null;
  alt: string;
  /**
   * Alleen `false` voor beeld boven de vouw. Al het overige laadt lui
   * (CLAUDE.md §7, §12).
   */
  lazy?: boolean;
}

/**
 * Een inhoudelijke foto, met de opmaak uit de design tokens.
 *
 * Zonder `src` rendert dit niets. Dat is geen defensieve programmeerreflex
 * maar de normale toestand zolang de klant nog geen foto's heeft
 * aangeleverd, en een lege afbeelding met een gebroken-plaatje-icoon zou
 * slechter zijn dan geen afbeelding.
 */
export function Figure({ src, alt, lazy = true }: FigureProps) {
  if (src === null || src === '') {
    return null;
  }

  return (
    <figure className={styles.figure}>
      <img
        className={styles.image}
        src={src}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
    </figure>
  );
}
