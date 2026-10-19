import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';

import { ToastContext, type ToastMessage, type ToastTone } from './toastContext';
import styles from './ToastProvider.module.css';

/** Hoe lang een geslaagde melding blijft staan. */
const SUCCESS_DURATION_MS = 4000;

/** Meer dan dit aantal punten wordt samengevat; anders bedekt de melding de pagina. */
const MAX_DETAILS = 4;

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toont meldingen rechtsonder in beeld, over de pagina heen.
 *
 * Staat om élke pagina heen via `mountPage`, dus ook om de publieke site — het
 * contactformulier gaat er in de volgende stap gebruik van maken.
 *
 * Foutmeldingen blijven staan tot ze weggeklikt worden. Dat is met opzet: een
 * fout die na een paar seconden vanzelf verdwijnt kun je missen, en dan sta je
 * met een niet-opgeslagen wijziging zonder te weten waarom.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);

  const add = useCallback(
    (tone: ToastTone, text: string, details?: string[]) => {
      const id = nextId.current++;

      setMessages((current) => [...current, { id, tone, text, details }]);

      if (tone === 'success') {
        setTimeout(() => {
          dismiss(id);
        }, SUCCESS_DURATION_MS);
      }
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      showError: (text: string, details?: string[]) => {
        add('error', text, details);
      },
      showSuccess: (text: string) => {
        add('success', text);
      },
      dismiss,
    }),
    [add, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/*
        `role="status"` met aria-live: een schermlezer meldt wat hier
        verschijnt, ook als de aandacht ergens anders is (CLAUDE.md §14).
        Bij een fout assertief, want die mag niet wachten.
      */}
      <div className={styles.stack} role="status" aria-live="polite">
        {messages.map((message) => (
          <Toast key={message.id} message={message} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ message, onClose }: { message: ToastMessage; onClose: (id: number) => void }) {
  const details = message.details ?? [];
  const shown = details.slice(0, MAX_DETAILS);
  const hidden = details.length - shown.length;

  return (
    <div
      className={`${styles.toast} ${message.tone === 'error' ? styles.error : styles.success}`}
      aria-live={message.tone === 'error' ? 'assertive' : 'polite'}
    >
      <div className={styles.body}>
        <p className={styles.text}>{message.text}</p>

        {shown.length > 0 && (
          <ul className={styles.details}>
            {shown.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}

        {hidden > 0 && (
          <p className={styles.more}>
            en nog {hidden} {hidden === 1 ? 'punt' : 'punten'}
          </p>
        )}
      </div>

      <button
        type="button"
        className={styles.close}
        onClick={() => {
          onClose(message.id);
        }}
        aria-label="Melding sluiten"
      >
        ×
      </button>
    </div>
  );
}
