import styles from './Choice.module.css';

export interface ChoiceProps {
  id: string;
  label: string;
  value: string;
  /** De toegestane waarden, zoals de server ze aanlevert. */
  options: string[];
  /** Wat de gebruiker per waarde te zien krijgt. */
  labels: Record<string, string>;
  onChange: (value: string) => void;
}

/**
 * Een keuzeveld met een gekoppeld label.
 *
 * De waarden komen van de server en de teksten uit deze applicatie. Zo kan het
 * keuzemenu nooit iets aanbieden dat bij het opslaan geweigerd wordt, terwijl
 * de bewoording Nederlands blijft — de server hoeft niet te weten hoe wij het
 * noemen.
 *
 * Kent de applicatie een waarde niet, dan toont hij hem onvertaald in plaats
 * van hem weg te laten. Een optie die stilzwijgend verdwijnt is lastiger te
 * vinden dan een die er lelijk bij staat.
 */
export function Choice({ id, label, value, options, labels, onChange }: ChoiceProps) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>

      <select
        id={id}
        className={styles.select}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}
