import { MailIcon, PhoneIcon, PinIcon } from '../ui/Icons';
import { Placeholder } from '../ui/Placeholder';
import type { SiteContent } from '../../types/content';
import styles from './ContactDetails.module.css';

export interface ContactDetailsProps {
  contact: SiteContent['contact'];
  /** Een label boven elk gegeven, zoals op de contactpagina. In de voettekst niet. */
  showLabels?: boolean;
}

/**
 * Werkgebied, telefoon en e-mail, uit site.json.
 *
 * Staat in de voettekst van elke pagina en op de contactpagina. Eén
 * component voor beide, zodat de gegevens op de site er overal hetzelfde
 * uitzien — en NAP-gegevens horen overal exact gelijk te zijn (CLAUDE.md §12).
 *
 * Telefoon en e-mail staan in een `tel:`- en `mailto:`-link: gewone tekst voor
 * een lezer én een herkenbaar gegeven voor een crawler. Zolang een gegeven
 * leeg is, staat er een opvallende plaatsvervanger.
 *
 * De kleuren komen van de plek waar het staat: licht op de pagina, donker in
 * de voettekst.
 */
export function ContactDetails({ contact, showLabels = false }: ContactDetailsProps) {
  return (
    <ul className={`${styles.list} ${showLabels ? styles.labelled : ''}`}>
      <li className={styles.line}>
        <PinIcon />
        <span>
          {showLabels && <span className={styles.label}>Werkgebied</span>}
          {contact.area === '' ? <Placeholder label="werkgebied" /> : contact.area}
        </span>
      </li>

      <li className={styles.line}>
        <PhoneIcon />
        <span>
          {showLabels && <span className={styles.label}>Telefoon</span>}
          {contact.phone === '' ? (
            <Placeholder label="telefoonnummer" />
          ) : (
            <a className={styles.link} href={`tel:${contact.phone.replace(/\s/g, '')}`}>
              {contact.phone}
            </a>
          )}
        </span>
      </li>

      <li className={styles.line}>
        <MailIcon />
        <span>
          {showLabels && <span className={styles.label}>E-mail</span>}
          {contact.email === '' ? (
            <Placeholder label="e-mailadres" />
          ) : (
            <a className={styles.link} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          )}
        </span>
      </li>
    </ul>
  );
}
