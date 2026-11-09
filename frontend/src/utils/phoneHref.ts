/**
 * Het `tel:`-adres bij een telefoonnummer zoals een lid het intypt.
 *
 * Een telefoon belt alleen goed met cijfers en een `+`. De Nederlandse
 * notatie `+31 (0)6 …` heeft daarbij een valkuil: die `(0)` hoort niet
 * gekozen te worden na het landnummer, dus die gaat er eerst helemaal uit in
 * plaats van alleen de haakjes.
 */
export function phoneHref(phone: string): string {
  const dialable = phone.replace(/\(0\)/g, '').replace(/[^\d+]/g, '');

  return `tel:${dialable}`;
}
