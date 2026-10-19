import styles from './Field.module.css';

export type FieldType = 'text' | 'email' | 'date' | 'number' | 'password';

export interface FieldProps {
  /** Moet uniek zijn op de pagina; gebruik `useId()` als basis. */
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: FieldType;
  error?: string;
  required?: boolean;
  multiline?: boolean;
  /**
   * Helpt de wachtwoordbeheerder van de browser. Zonder dit vult hij op de
   * inlogpagina soms het verkeerde veld in, of niets.
   */
  autoComplete?: string;
  /**
   * De maximale lengte in tekens. Toont een teller, zodat je aan ziet komen
   * dat je eroverheen gaat in plaats van het pas bij het opslaan te horen.
   */
  maxLength?: number;
  /** Onder- en bovengrens voor een getalveld (`type="number"`). */
  min?: number;
  max?: number;
}

/**
 * Eén formulierveld met een gekoppeld label.
 *
 * Zat eerst in ContactForm. Nu het inlogformulier hetzelfde nodig heeft staat
 * het hier — CLAUDE.md §4: uitnemen zodra iets écht een tweede keer voorkomt.
 *
 * De koppeling tussen label en veld via `htmlFor` is geen detail: zonder die
 * koppeling weet een schermlezer niet waar een veld over gaat, en werkt
 * klikken op het label niet (§14). De tests zoeken velden op via hun label,
 * juist zodat die koppeling bewaakt blijft.
 */
export function Field({
  id,
  label,
  value,
  onChange,
  type = 'text',
  error,
  required = false,
  multiline = false,
  autoComplete,
  maxLength,
  min,
  max,
}: FieldProps) {
  const errorId = `${id}-fout`;
  const className = [
    styles.input,
    multiline ? styles.textarea : '',
    error === undefined ? '' : styles.fieldError,
  ]
    .filter(Boolean)
    .join(' ');

  const shared = {
    id,
    value,
    className,
    required,
    autoComplete,
    // Verwijst naar de foutmelding, zodat een schermlezer hem voorleest bij
    // het veld waar hij bij hoort.
    'aria-describedby': error === undefined ? undefined : errorId,
    'aria-invalid': error === undefined ? undefined : true,
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
        {maxLength !== undefined && (
          <span
            className={value.length > maxLength ? styles.counterOver : styles.counter}
            /*
             * De teller loopt bij elke toetsaanslag mee. Zou een schermlezer
             * dat elke keer voorlezen, dan is het veld onbruikbaar; daarom
             * uitgesloten van de voorleesvolgorde. Gaat het mis, dan komt de
             * echte melding bij het veld te staan.
             */
            aria-hidden="true"
          >
            {value.length} / {maxLength}
          </span>
        )}
      </label>

      {multiline ? (
        <textarea
          {...shared}
          rows={4}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      ) : (
        <input
          {...shared}
          type={type}
          min={min}
          max={max}
          onChange={(event) => {
            onChange(event.target.value);
          }}
        />
      )}

      {error !== undefined && (
        <span id={errorId} className={styles.errorText}>
          {error}
        </span>
      )}
    </div>
  );
}
