import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'normal' | 'large';

/**
 * Stelt de klassenaam samen voor Button en ButtonLink.
 *
 * Staat in een eigen bestand en niet naast het component, omdat React Fast
 * Refresh alleen werkt als een bestand uitsluitend componenten exporteert.
 */
export function buttonClassName(variant: ButtonVariant, size: ButtonSize): string {
  return [styles.button, styles[variant], size === 'large' ? styles.large : '']
    .filter(Boolean)
    .join(' ');
}
