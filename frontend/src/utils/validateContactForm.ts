import type { ContactFormData } from '../services/contactApi';

export type ContactFormErrors = Partial<Record<keyof ContactFormData, string>>;

/**
 * Bewust ruim: precies vaststellen wat een geldig e-mailadres is, lukt met een
 * patroon toch niet. Deze controle vangt vergissingen af; of het adres écht
 * bestaat blijkt pas als er een antwoord op komt.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Controleert het aanvraagformulier en geeft per veld een foutmelding terug.
 *
 * Voor het gemak van de bezoeker, niet de beveiliging (CLAUDE.md §7): de
 * server controleert dezelfde regels opnieuw in `ContactValidator.php`.
 */
export function validateContactForm(values: ContactFormData): ContactFormErrors {
  const errors: ContactFormErrors = {};

  if (values.name.trim() === '') {
    errors.name = 'Vul uw naam in.';
  }

  if (values.email.trim() === '') {
    errors.email = 'Vul uw e-mailadres in.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Dit lijkt geen geldig e-mailadres.';
  }

  if (values.message.trim() === '') {
    errors.message = 'Vul uw bericht in.';
  }

  return errors;
}
