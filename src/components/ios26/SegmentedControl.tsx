import React, { useEffect, useRef, useState } from 'react';
import '../../styles/segmented-control.css';

export interface Segment<T extends string = string> {
  value: T;
  label: string;
  ariaLabel?: string;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  'aria-label'?: string;
}

export default function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className = '',
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeIndex = segments.findIndex((segment) => segment.value === value);
    const el = itemRefs.current[activeIndex];
    const container = containerRef.current;
    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      left: elRect.left - containerRect.left,
      width: elRect.width,
    });
  }, [value, segments]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      const activeIndex = segments.findIndex((segment) => segment.value === value);
      const el = itemRefs.current[activeIndex];
      if (!el) return;

      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicator({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [value, segments]);

  return (
    <div
      className={`segmented-control ios26-liquid-glass-me glass-surface ${className}`.trim()}
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div
        className="segmented-control__indicator"
        style={{ left: indicator.left, width: indicator.width }}
        aria-hidden
      />
      {segments.map((segment, index) => {
        const isActive = segment.value === value;
        return (
          <button
            key={segment.value}
            ref={(el) => { itemRefs.current[index] = el; }}
            type="button"
            role="tab"
            className={`segmented-control__segment${isActive ? ' segmented-control__segment--active' : ''}`}
            aria-selected={isActive}
            aria-label={segment.ariaLabel ?? segment.label}
            onClick={() => onChange(segment.value)}
          >
            <span className="segmented-control__label ios26-footnote">{segment.label}</span>
          </button>
        );
      })}
    </div>
  );
}
