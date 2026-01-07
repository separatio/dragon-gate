/**
 * ChoiceButton Component
 * Reusable button for story choices and menu actions
 */

import { ButtonHTMLAttributes } from 'react';

interface ChoiceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
}

export function ChoiceButton({
  children,
  variant = 'secondary',
  fullWidth = false,
  disabled,
  className = '',
  ...props
}: ChoiceButtonProps) {
  const classes = [
    'choice-button',
    `choice-button--${variant}`,
    fullWidth && 'choice-button--full',
    disabled && 'choice-button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
