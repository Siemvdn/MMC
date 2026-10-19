import { useContext } from 'react';

import { ToastContext, type ToastApi } from '../components/ui/toastContext';

/**
 * Toont een melding rechtsonder in beeld.
 *
 * Werkt overal in de applicatie: ToastProvider staat om elke pagina heen, in
 * `mountPage`.
 */
export function useToast(): ToastApi {
  const api = useContext(ToastContext);

  if (api === null) {
    // Stil niets doen zou betekenen dat een foutmelding spoorloos verdwijnt —
    // precies wat dit systeem moet voorkomen.
    throw new Error('useToast gebruikt buiten een ToastProvider.');
  }

  return api;
}
