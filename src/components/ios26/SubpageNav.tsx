import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { trackEvent } from '../../analytics/mixpanel';
import '../../styles/subpage-nav.css';

interface SubpageNavProps {
  to: string;
  label: string;
}

export default function SubpageNav({ to, label }: SubpageNavProps) {
  return (
    <header className="subpage-nav">
      <Link
        to={to}
        className="subpage-nav__back ios26-liquid-glass-me glass-surface"
        onClick={() => trackEvent('Subpage Nav Back', { destination: to, label })}
      >
        <svg viewBox="0 0 24 24" aria-hidden className="subpage-nav__chevron">
          <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
        </svg>
        <span className="subpage-nav__label ios26-subheadline">{label}</span>
      </Link>
      <ThemeToggle />
    </header>
  );
}
