import styles from './BrandMark.module.css';

export interface BrandMarkProps {
  /** `inverted` voor een donkere ondergrond, zoals de voettekst. */
  tone?: 'default' | 'inverted';
}

/**
 * Het beeldmerk naast de naam: een vlinderzwaluw, de houten verbinding
 * waarmee een meubelmaker een scheur in een blad vastzet.
 *
 * Decoratief: de naam ernaast zegt al wie het is, dus een schermlezer slaat
 * dit over.
 */
export function BrandMark({ tone = 'default' }: BrandMarkProps) {
  return (
    <svg
      className={`${styles.mark} ${tone === 'inverted' ? styles.inverted : ''}`}
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <rect className={styles.tile} width="40" height="40" rx="6" />
      <path className={styles.key} d="M9 12L20 17L31 12V28L20 23L9 28Z" />
    </svg>
  );
}
