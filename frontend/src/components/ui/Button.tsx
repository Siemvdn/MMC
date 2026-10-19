import type { ReactNode } from 'react';

import { buttonClassName, type ButtonSize, type ButtonVariant } from './buttonStyles';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Standaard `button`. Expliciet meegeven voorkomt de klassieke valkuil dat
   * een knop binnen een formulier ongewild het formulier verstuurt.
   */
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}

/** Een knop die iets op de pagina doet. Gaat het ergens heen, gebruik ButtonLink. */
export function Button({
  children,
  variant = 'primary',
  size = 'normal',
  type = 'button',
  disabled = false,
  onClick,
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, size)}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
