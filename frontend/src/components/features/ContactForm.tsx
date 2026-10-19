import { useId, useState, type FormEvent } from 'react';

import { useFetch } from '../../hooks/useFetch';
import { fetchContactToken, submitContact, type ContactFormData } from '../../services/contactApi';
import { validateContactForm, type ContactFormErrors } from '../../utils/validateContactForm';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Field } from '../ui/Field';
import styles from './ContactForm.module.css';

/**
 * Het aanvraagformulier.
 *
 * De validatie (`validateContactForm`) is er voor het gemak van de bezoeker,
 * niet de beveiliging (CLAUDE.md §7): `POST /api/contact` valideert alles opnieuw, en
 * een afwijzing van de server verschijnt hieronder als gewone foutmelding.
 *
 * Het CSRF-token komt van `GET /api/contact/token` en wordt bij het laden van
 * het formulier alvast opgehaald, zodat versturen niet op een extra
 * rondje hoeft te wachten.
 */

type FormValues = ContactFormData;

type SubmitState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success' }
  | { status: 'error'; message: string };

const EMPTY_VALUES: FormValues = {
  name: '',
  email: '',
  message: '',
};

const GENERIC_ERROR = 'Er ging iets mis. Probeer het opnieuw.';

const FORM_NOT_READY_ERROR =
  'Het formulier is nog niet klaar. Wacht heel even en probeer het opnieuw.';

export function ContactForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const tokenFetch = useFetch(fetchContactToken);

  // Unieke id's, zodat elk label aan het juiste veld gekoppeld is, ook als het
  // formulier ooit twee keer op een pagina zou staan (CLAUDE.md §14).
  const fieldId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const found = validateContactForm(values);
    setErrors(found);

    if (Object.keys(found).length > 0) {
      return;
    }

    if (tokenFetch.state.status !== 'success') {
      setSubmitState({ status: 'error', message: FORM_NOT_READY_ERROR });

      return;
    }

    setSubmitState({ status: 'loading' });

    try {
      await submitContact(values, tokenFetch.state.data.csrfToken);
      setSubmitState({ status: 'success' });
    } catch (cause) {
      setSubmitState({
        status: 'error',
        message: cause instanceof Error ? cause.message : GENERIC_ERROR,
      });
    }
  }

  function update(field: keyof FormValues, value: string): void {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  return (
    <Container>
      <form
        className={styles.form}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
      >
        <div className={styles.row}>
          <Field
            id={`${fieldId}-naam`}
            label="Naam"
            value={values.name}
            error={errors.name}
            onChange={(value) => {
              update('name', value);
            }}
            required
          />
          <Field
            id={`${fieldId}-email`}
            label="E-mailadres"
            type="email"
            value={values.email}
            error={errors.email}
            onChange={(value) => {
              update('email', value);
            }}
            required
          />
        </div>

        <Field
          id={`${fieldId}-bericht`}
          label="Bericht"
          value={values.message}
          error={errors.message}
          onChange={(value) => {
            update('message', value);
          }}
          multiline
          required
        />

        <div className={styles.actions}>
          <Button type="submit" disabled={submitState.status === 'loading'}>
            {submitState.status === 'loading' ? 'Bezig met versturen…' : 'Versturen'}
          </Button>
          <span className={styles.note}>
            Uw gegevens worden alleen gebruikt om op uw aanvraag te reageren en worden niet bewaard.
          </span>
        </div>

        {submitState.status === 'success' && (
          <p className={styles.feedback} role="status">
            Bedankt voor uw aanvraag. Er wordt zo snel mogelijk contact met u opgenomen.
          </p>
        )}

        {submitState.status === 'error' && (
          <p className={styles.feedbackError} role="alert">
            {submitState.message}
          </p>
        )}
      </form>
    </Container>
  );
}
