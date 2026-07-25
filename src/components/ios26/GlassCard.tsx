import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'me' | 'la';
}

const sizeClass = {
  sm: 'ios26-liquid-glass-sm',
  me: 'ios26-liquid-glass-me',
  la: 'ios26-liquid-glass-la',
};

export default function GlassCard({ children, className = '', size = 'me' }: GlassCardProps) {
  return (
    <div className={`glass-surface glass-card ${sizeClass[size]} ${className}`.trim()}>
      {children}
    </div>
  );
}
