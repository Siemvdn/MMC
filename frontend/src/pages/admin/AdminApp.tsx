import { useState } from 'react';

import { StatusMessage } from '../../components/ui/StatusMessage';
import { useSession } from '../../hooks/useSession';
import { logout } from '../../services/adminApi';
import { EditorPage } from './EditorPage';
import { LoginPage } from './LoginPage';

/**
 * Bepaalt wat het admin-gedeelte laat zien: het inlogscherm of het beheer.
 *
 * De beslissing valt op basis van wat de server zegt, niet op basis van iets
 * dat in de browser is opgeslagen. Elk admin-endpoint controleert de sessie
 * server-side opnieuw, dus deze component bepaalt alleen wát er getoond wordt
 * — nooit wat er mag (CLAUDE.md §9, §11).
 */
export function AdminApp() {
  const { state, retry, replace } = useSession();
  const [busy, setBusy] = useState(false);

  if (state.status === 'idle' || state.status === 'loading') {
    return <StatusMessage heading="Even geduld" text="Bezig met controleren." />;
  }

  if (state.status === 'error') {
    return (
      <StatusMessage
        heading="Het beheer is niet bereikbaar"
        text={state.error}
        onRetry={retry}
        urgency="assertive"
      />
    );
  }

  const session = state.data;

  if (!session.loggedIn) {
    return <LoginPage csrfToken={session.csrfToken} onLoggedIn={replace} />;
  }

  const handleLogout = async (): Promise<void> => {
    setBusy(true);

    try {
      await logout(session.csrfToken);
    } finally {
      /*
       * Ook als het uitloggen een fout gaf: opnieuw ophalen wat de server van
       * de sessie vindt. Dat is betrouwbaarder dan hier aannemen hoe het
       * ervoor staat — en als de sessie tóch nog geldig blijkt, hoort de
       * beheerder dat te zien in plaats van uitgelogd te lijken.
       */
      setBusy(false);
      retry();
    }
  };

  return (
    <EditorPage
      username={session.username ?? ''}
      csrfToken={session.csrfToken}
      onLoggedOut={retry}
      onLogout={() => {
        if (!busy) {
          void handleLogout();
        }
      }}
    />
  );
}
