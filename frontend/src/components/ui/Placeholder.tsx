import styles from './Placeholder.module.css';

export interface PlaceholderProps {
  /** Wat er ontbreekt, in gewone taal: "bedrijfsnaam", "telefoonnummer". */
  label: string;
}

/**
 * Markeert zichtbaar dat hier nog iets van de klant moet komen.
 *
 * TODO — elke Placeholder op de site moet weg vóór livegang. Ze staan
 * één-op-één tegenover de `_todo`-punten in de content-JSON's: bedrijfsnaam,
 * telefoonnummer, e-mailadres, werkgebied. Zolang die leeg zijn zou de site
 * anders lege gaten tonen, en dat is moeilijker op te merken dan dit.
 *
 * Bewust opvallend vormgegeven, zodat het onmogelijk voor echte content
 * aangezien kan worden. Grep op `Placeholder` om ze allemaal te vinden.
 */
export function Placeholder({ label }: PlaceholderProps) {
  return <span className={styles.placeholder}>nog aan te leveren: {label}</span>;
}
