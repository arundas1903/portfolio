import React from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'filled' | 'tinted' | 'glass';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
  to?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = 'filled',
  href,
  to,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = `ios26-btn ios26-btn--${variant} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
