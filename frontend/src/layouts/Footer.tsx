import { Placeholder } from '../components/ui/Placeholder';
import { pathForSlug } from '../constants/routes';
import type { SiteContent } from '../types/content';
import styles from './Footer.module.css';

export interface FooterProps {
  site: SiteContent;
}

/**
 * De footer staat op elke pagina en draagt de contactgegevens.
 *
 * CLAUDE.md §12 wil die overal machineleesbaar hebben. De telefoon en het
 * e-mailadres staan daarom in een `tel:`- en `mailto:`-link: dat is gewone
 * tekst voor een lezer én een herkenbaar gegeven voor een crawler, zonder dat
 * er schema-opmaak voor nodig is.
 *
 * Het LocalBusiness-schema zelf komt er pas bij zodra de gegevens er echt
 * zijn. Halve of verzonnen NAP-gegevens zijn schadelijker dan geen schema,
 * omdat ze exact moeten matchen met het Google Business Profile.
 */
export function Footer({ site }: FooterProps) {
  const { businessName, contact } = site;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.column}>
          <span className={styles.brand}>
            {businessName === '' ? <Placeholder label="bedrijfsnaam" /> : businessName}
          </span>
          <span>
            {contact.area === '' ? (
              <Placeholder label="werkgebied" />
            ) : (
              `Werkgebied: ${contact.area}`
            )}
          </span>
        </div>

        <div className={`${styles.column} ${styles.details}`}>
          {contact.phone === '' ? (
            <Placeholder label="telefoonnummer" />
          ) : (
            <a className={styles.link} href={`tel:${contact.phone.replace(/\s/g, '')}`}>
              {contact.phone}
            </a>
          )}

          {contact.email === '' ? (
            <Placeholder label="e-mailadres" />
          ) : (
            <a className={styles.link} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          )}
        </div>

        <div className={styles.column}>
          <a className={styles.link} href={pathForSlug('privacy')}>
            Privacyverklaring
          </a>
          <a className={styles.link} href={pathForSlug('terms')}>
            Algemene voorwaarden
          </a>
        </div>
      </div>
    </footer>
  );
}
