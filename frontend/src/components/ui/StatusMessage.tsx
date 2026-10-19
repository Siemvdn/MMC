import { Button } from './Button';
import styles from './StatusMessage.module.css';

export interface StatusMessageProps {
  heading: string;
  text: string;
  /** Alleen meegeven als er iets te herhalen valt. */
  onRetry?: () => void;
  /**
   * `polite` bij laden, `assertive` bij een fout: een schermlezer meldt een
   * fout dan meteen in plaats van te wachten tot de bezoeker uitgesproken is.
   */
  urgency?: 'polite' | 'assertive';
}

/**
 * De laad- en fouttoestand van een pagina.
 *
 * CLAUDE.md §7: nooit een lege pagina zonder feedback. Dit component is dus
 * geen luxe maar de zichtbare kant van twee van de vier toestanden uit
 * `useFetch`.
 */
export function StatusMessage({ heading, text, onRetry, urgency = 'polite' }: StatusMessageProps) {
  return (
    <div className={styles.status} role="status" aria-live={urgency}>
      <h1 className={styles.heading}>{heading}</h1>
      <p className={styles.text}>{text}</p>
      {onRetry !== undefined && (
        <Button variant="secondary" onClick={onRetry}>
          Opnieuw proberen
        </Button>
      )}
    </div>
  );
}
