import type { ReactNode } from 'react';

import styles from './Container.module.css';

export interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Houdt inhoud binnen de leesbreedte van de site.
 *
 * Gebruikt door elke sectie, door het contactformulier en door de
 * laadmeldingen — overal waar tekst niet van rand tot rand mag lopen. De
 * achtergrond eromheen mag dat wél, en dat is precies waarom dit een eigen
 * component is in plaats van één begrenzing om de hele pagina.
 */
export function Container({ children, className }: ContainerProps) {
  return <div className={`${styles.container} ${className ?? ''}`}>{children}</div>;
}
