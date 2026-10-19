import type { ReactNode } from 'react';

import styles from './Handleiding.module.css';

export interface ManualSectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

/** Eén hoofdstuk van de handleiding, met een anker voor de inhoudsopgave. */
export function ManualSection({ id, title, children }: ManualSectionProps) {
  return (
    <section id={id} className={styles.section}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/** Een handige aanwijzing. Het label staat er voor wie kleur niet ziet. */
export function Tip({ children }: { children: ReactNode }) {
  return (
    <p className={styles.tip}>
      <strong>Tip: </strong>
      {children}
    </p>
  );
}

/** Een waarschuwing voor iets wat misgaat als je het niet weet. */
export function Warning({ children }: { children: ReactNode }) {
  return (
    <p className={styles.warning}>
      <strong>Let op: </strong>
      {children}
    </p>
  );
}

export interface PartsTableProps {
  /** De rijen: eerst wat u in het beheer ziet, dan wat het op de website is. */
  rows: ReadonlyArray<readonly [string, string]>;
}

/** Welk blok in het beheer bij welk stuk van de website hoort. */
export function PartsTable({ rows }: PartsTableProps) {
  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th scope="col">In het beheer</th>
          <th scope="col">Op de website</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([adminName, onSite]) => (
          <tr key={adminName}>
            <th scope="row">{adminName}</th>
            <td>{onSite}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
