import type { ReactNode } from 'react';

/** Alleen h1 en h2 — dieper gaat deze site niet binnen een sectie. */
export type HeadingLevel = 1 | 2;

export interface HeadingProps {
  level: HeadingLevel;
  className?: string;
  children: ReactNode;
}

/**
 * Kiest het juiste kopniveau.
 *
 * Bestaat zodat de kophiërarchie op één plek geregeld is in plaats van in
 * elk sectiecomponent opnieuw. CLAUDE.md §12 en §14 vragen om precies één h1
 * per pagina met daaronder een logische opbouw; de sectie op positie nul
 * krijgt daarom h1 en de rest h2.
 */
export function Heading({ level, className, children }: HeadingProps) {
  const Tag = level === 1 ? 'h1' : 'h2';

  return <Tag className={className}>{children}</Tag>;
}
