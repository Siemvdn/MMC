import { Container } from '../ui/Container';
import type { SiteContent } from '../../types/content';
import { ContactDetails } from './ContactDetails';
import { ContactForm } from './ContactForm';
import styles from './ContactPanel.module.css';

export interface ContactPanelProps {
  /**
   * Voor de contactgegevens naast het formulier. Ontbreekt alleen in tests
   * die het formulier los bekijken; dan staat het formulier alleen.
   */
  site?: SiteContent;
}

/**
 * Het formulier met de directe contactgegevens ernaast.
 *
 * Wie liever belt of mailt, ziet zo meteen hoe dat kan, zonder eerst
 * naar de voettekst te hoeven zoeken.
 */
export function ContactPanel({ site }: ContactPanelProps) {
  return (
    <section className={styles.panel}>
      <Container>
        <div className={styles.grid}>
          {site !== undefined && (
            <div className={styles.details}>
              <ContactDetails contact={site.contact} showLabels />
            </div>
          )}

          <div className={styles.formCard}>
            <ContactForm />
          </div>
        </div>
      </Container>
    </section>
  );
}
