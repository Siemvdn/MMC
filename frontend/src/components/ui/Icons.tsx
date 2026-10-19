import type { ReactNode } from 'react';

import styles from './Icons.module.css';

/**
 * Lijniconen naast een tekst.
 *
 * Altijd decoratief: de tekst ernaast zegt al wat er bedoeld wordt, dus een
 * schermlezer slaat ze over. Ze nemen de tekstkleur over (`currentColor`),
 * zodat ze in elke link, knop en voettekst vanzelf goed staan.
 */
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function ArrowRightIcon() {
  return (
    <Icon>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

/** Voor een link die naar een andere site gaat. */
export function ExternalLinkIcon() {
  return (
    <Icon>
      <path d="M7 17L17 7M8 7h9v9" />
    </Icon>
  );
}

export function PinIcon() {
  return (
    <Icon>
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </Icon>
  );
}

export function PhoneIcon() {
  return (
    <Icon>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </Icon>
  );
}

export function MailIcon() {
  return (
    <Icon>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 6L2 7" />
    </Icon>
  );
}
