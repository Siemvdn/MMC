import { safeWebsite } from './safeWebsite';
import { EMAIL_PATTERN } from './validateContactForm';

/** Cijfers, spaties, haakjes en streepjes, met eventueel een + vooraan. */
const PHONE_PATTERN = /^\+?[0-9 ()-]+$/;

/** Gelijk aan MemberContactValidator in de backend. */
const PHONE_MIN_DIGITS = 6;
const PHONE_MAX_DIGITS = 15;

export interface MemberContactErrors {
  phone?: string;
  email?: string;
  website?: string;
}

/**
 * Controleert telefoon, e-mail en website van een lid terwijl de beheerder
 * typt.
 *
 * Voor het gemak, niet de beveiliging (CLAUDE.md §7): de server controleert
 * dezelfde regels opnieuw in `MemberContactValidator.php` en weigert op te
 * slaan wat niet klopt. Leeg is altijd goed: dan toont de site die regel niet.
 */
export function validateMemberContact(contact: {
  phone: string;
  email: string;
  website: string;
}): MemberContactErrors {
  const errors: MemberContactErrors = {};
  const digits = contact.phone.replace(/\D/g, '').length;

  if (
    contact.phone !== '' &&
    (!PHONE_PATTERN.test(contact.phone) || digits < PHONE_MIN_DIGITS || digits > PHONE_MAX_DIGITS)
  ) {
    errors.phone =
      'Gebruik alleen cijfers, spaties, haakjes, streepjes en een + vooraan, bijvoorbeeld 06-12345678.';
  }

  if (contact.email !== '' && !EMAIL_PATTERN.test(contact.email)) {
    errors.email = 'Dit lijkt geen geldig e-mailadres.';
  }

  if (contact.website !== '' && safeWebsite(contact.website) === null) {
    errors.website =
      'Vul het volledige adres in, inclusief https:// — bijvoorbeeld https://www.voorbeeld.nl. Of laat het veld leeg.';
  }

  return errors;
}
