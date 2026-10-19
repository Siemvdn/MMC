import type { ReactNode } from 'react';

import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles';

export interface ButtonLinkProps {
  children: ReactNode;
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Ziet eruit als een knop, maar is een link.
 *
 * Het verschil is niet cosmetisch: schermlezers kondigen een link anders aan
 * dan een knop, en een link is te openen in een nieuw tabblad. Een `div` met
 * een klikafhandelaar zou geen van beide kunnen (CLAUDE.md §14).
 */
export function ButtonLink({
  children,
  href,
  variant = 'primary',
  size = 'normal',
}: ButtonLinkProps) {
  return (
    <a href={href} className={buttonClassName(variant, size)}>
      {children}
    </a>
  );
}
