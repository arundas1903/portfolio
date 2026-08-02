import React from 'react';
import type { ModuleDefinition } from '../types/flow';

interface NodePaletteProps {
  modules: ModuleDefinition[];
  onAdd: (module: ModuleDefinition) => void;
}

export default function NodePalette({ modules, onAdd }: NodePaletteProps) {
  const grouped = modules.reduce<Record<string, ModuleDefinition[]>>((acc, module) => {
    acc[module.category] = acc[module.category] || [];
    acc[module.category].push(module);
    return acc;
  }, {});

  return (
    <aside className="fb-palette ios26-liquid-glass-me glass-surface">
      <h2 className="ios26-headline fb-palette__title">Components</h2>
      <p className="ios26-footnote fb-muted">Drag onto the canvas or click to add.</p>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="fb-palette__section">
          <h3 className="ios26-caption2 fb-palette__category">{category}</h3>
          <div className="fb-palette__list">
            {items.map((module) => (
              <button
                key={module.type_id}
                type="button"
                className="fb-palette__item"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/flow-module', module.type_id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
                onClick={() => onAdd(module)}
                style={{ '--fb-node-color': module.color } as React.CSSProperties}
              >
                <span className="fb-palette__dot" aria-hidden />
                <span>
                  <strong className="ios26-footnote">{module.label}</strong>
                  <span className="ios26-caption2 fb-muted fb-palette__desc">{module.description}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
