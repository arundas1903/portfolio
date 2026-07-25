import React from 'react';

type ButtonVariant = 'filled' | 'tinted' | 'glass';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
  children: React.ReactNode;
}

export default function Button({
  variant = 'filled',
  href,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const classes = `ios26-btn ios26-btn--${variant} ${className}`.trim();

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
