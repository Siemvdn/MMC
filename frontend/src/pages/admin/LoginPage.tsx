import { useId, useState, type FormEvent } from 'react';

import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { useToast } from '../../hooks/useToast';
import { ApiError } from '../../services/apiClient';
import { login, type AdminSession } from '../../services/adminApi';
import styles from './LoginPage.module.css';

export interface LoginPageProps {
  /** Het CSRF-token uit de huidige sessie (CLAUDE.md §11). */
  csrfToken: string;
  onLoggedIn: (session: AdminSession) => void;
}

const GENERIC_ERROR = 'Inloggen lukte niet. Probeer het opnieuw.';

export function LoginPage({ csrfToken, onLoggedIn }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { showError } = useToast();

  const fieldId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (username.trim() === '' || password === '') {
      showError('Vul een gebruikersnaam en wachtwoord in.');

      return;
    }

    setBusy(true);

    try {
      onLoggedIn(await login(username.trim(), password, csrfToken));
    } catch (cause: unknown) {
      /*
       * De tekst komt van de server en is daar bewust neutraal gehouden: hij
       * maakt geen onderscheid tussen een onbekende gebruikersnaam en een fout
       * wachtwoord (§11). Hem hier vervangen of aanvullen zou dat ondermijnen.
       */
      showError(cause instanceof ApiError ? cause.message : GENERIC_ERROR);
      setPassword('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <span className={styles.brand}>Beheer</span>

      <form
        className={styles.card}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
      >
        <h1 className={styles.heading}>Inloggen</h1>

        <Field
          id={`${fieldId}-gebruikersnaam`}
          label="Gebruikersnaam"
          value={username}
          onChange={setUsername}
          autoComplete="username"
          required
        />

        <Field
          id={`${fieldId}-wachtwoord`}
          label="Wachtwoord"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
        />

        <Button type="submit" disabled={busy}>
          {busy ? 'Bezig…' : 'Inloggen'}
        </Button>

        <span className={styles.note}>
          Alleen via een beveiligde verbinding. De sessie verloopt na 30 minuten zonder activiteit.
        </span>
      </form>

      <a className={styles.back} href="/">
        Terug naar de site
      </a>
    </main>
  );
}
