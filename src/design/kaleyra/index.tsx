import React from 'react';
import './tokens.css';
import './kaleyra.css';

type KaleButtonVariant = 'primary' | 'ghost' | 'danger' | 'text';
type KaleButtonSize = 'sm' | 'md' | 'lg';

interface KaleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: KaleButtonVariant;
  size?: KaleButtonSize;
  fullWidth?: boolean;
}

export function KaleButton({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className = '',
  type = 'button',
  children,
  ...props
}: KaleButtonProps) {
  return (
    <button
      type={type}
      className={[
        'kale-btn',
        `kale-btn--${variant}`,
        `kale-btn--${size}`,
        fullWidth ? 'kale-btn--full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
}

interface KaleFieldProps {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
}

export function KaleField({ label, htmlFor, hint, children }: KaleFieldProps) {
  return (
    <label className="kale-field" htmlFor={htmlFor}>
      <span className="kale-label">{label}</span>
      {children}
      {hint && <span className="kale-text-300">{hint}</span>}
    </label>
  );
}

export function KaleInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="kale-input" {...props} />;
}

export function KaleTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="kale-textarea" {...props} />;
}

export function KaleSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="kale-select" {...props} />;
}

type KaleAlertVariant = 'info' | 'success' | 'warning' | 'error';

interface KaleAlertProps {
  variant?: KaleAlertVariant;
  title?: string;
  children: React.ReactNode;
}

export function KaleAlert({ variant = 'info', title, children }: KaleAlertProps) {
  return (
    <div className={`kale-alert kale-alert--${variant}`} role="alert">
      {title && <strong>{title}</strong>}
      <div>{children}</div>
    </div>
  );
}

interface KaleCardProps {
  className?: string;
  children: React.ReactNode;
}

export function KaleCard({ className = '', children }: KaleCardProps) {
  return <div className={`kale-card ${className}`.trim()}>{children}</div>;
}

type KaleBadgeVariant = 'primary' | 'muted' | 'warning';

export function KaleBadge({
  variant = 'muted',
  children,
}: {
  variant?: KaleBadgeVariant;
  children: React.ReactNode;
}) {
  return <span className={`kale-badge kale-badge--${variant}`}>{children}</span>;
}

interface KaleTabItem {
  id: string;
  label: string;
}

interface KaleTabsProps {
  tabs: KaleTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}

export function KaleTabs({ tabs, activeId, onChange, ariaLabel }: KaleTabsProps) {
  return (
    <nav className="kale-tabs" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`kale-tab${activeId === tab.id ? ' kale-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}

interface KaleTableProps {
  columns: { key: string; label: string }[];
  children: React.ReactNode;
}

export function KaleTable({ columns, children }: KaleTableProps) {
  return (
    <div className="kale-table-wrap">
      <table className="kale-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function KaleEmpty({ children }: { children: React.ReactNode }) {
  return <div className="kale-empty">{children}</div>;
}

interface KalePageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function KalePageHeader({ eyebrow, title, description, actions }: KalePageHeaderProps) {
  return (
    <header className="bfsi2-header">
      <div>
        {eyebrow && <p className="kale-eyebrow">{eyebrow}</p>}
        <h1 className="kale-title-600">{title}</h1>
        {description && <p className="kale-text-300">{description}</p>}
      </div>
      {actions && <div className="bfsi2-header__actions">{actions}</div>}
    </header>
  );
}
