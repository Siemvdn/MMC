import { createContext } from 'react';

/**
 * De meldingen die rechtsonder in beeld verschijnen.
 *
 * Reden van bestaan: een foutmelding bovenaan de pagina wordt niet gezien als
 * je onderin aan het werk bent. Precies dat gebeurde bij het opslaan van een
 * te lange tekst — de melding stond er wel, maar buiten beeld.
 */

export type ToastTone = 'error' | 'success';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  text: string;
  /** Losse punten onder de melding, bijvoorbeeld een lijst validatiefouten. */
  details?: string[];
}

export interface ToastApi {
  /**
   * Blijft staan tot de gebruiker hem wegklikt. Een fout die vanzelf
   * verdwijnt kun je missen, en dan blijf je zonder uitleg achter.
   */
  showError: (text: string, details?: string[]) => void;
  /** Verdwijnt vanzelf: dat er iets gelukt is, zie je verder aan de pagina. */
  showSuccess: (text: string) => void;
  dismiss: (id: number) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);
