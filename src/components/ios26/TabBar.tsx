import React, { useEffect, useRef, useState } from 'react';
import '../../styles/tab-bar.css';

export interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
  hidden?: boolean;
  embedded?: boolean;
}

export default function TabBar({
  tabs,
  activeTab,
  onTabChange,
  hidden = false,
  embedded = false,
}: TabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.id === activeTab);
    const el = itemRefs.current[activeIndex];
    const container = containerRef.current;
    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setIndicator({
      left: elRect.left - containerRect.left,
      width: elRect.width,
    });
  }, [activeTab, tabs]);

  const handleClick = (id: string) => {
    onTabChange(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className={[
        'tab-bar-container',
        embedded ? 'tab-bar-container--embedded' : '',
        hidden ? 'tab-bar-container--hidden' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <nav className="tab-bar ios26-liquid-glass-me glass-surface" ref={containerRef} aria-label="Main navigation">
        <div
          className="tab-bar__indicator"
          style={{ left: indicator.left, width: indicator.width }}
          aria-hidden
        />
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { itemRefs.current[i] = el; }}
            type="button"
            className={`tab-bar__item ${activeTab === tab.id ? 'tab-bar__item--active' : ''}`}
            onClick={() => handleClick(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className="tab-bar__icon">{tab.icon}</span>
            <span className="tab-bar__label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
