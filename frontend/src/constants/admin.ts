/**
 * Het admin-gedeelte.
 *
 * Staat bewust NIET in `ROUTES`. Die lijst voedt de navigatie in de header,
 * de sitemap en de schone URL's van de publieke site — en het admin-gedeelte
 * hoort in geen van die drie thuis (§12).
 */
export const ADMIN_PATH = '/admin';

export const ADMIN_HTML_FILE = 'admin.html';

/** De sleutel waaronder Vite deze ingang bouwt. */
export const ADMIN_ENTRY = 'admin';

/**
 * Bij wie de beheerder terechtkan met vragen, zoals de handleiding het noemt.
 *
 * [TODO: contactpersoon] — de naam van de ontwikkelaar of de vaste
 * aanspreekpersoon voor het beheer.
 */
export const SUPPORT_CONTACT = '[TODO: contactpersoon]';
