import React from 'react';
import GlassCard from '../components/ios26/GlassCard';
import SubpageNav from '../components/ios26/SubpageNav';
import { experience } from '../data/experience';

export default function ExperiencePage() {
  return (
    <div className="experience-page">
      <div className="experience-page-background" aria-hidden />

      <div className="experience-page-inner">
        <SubpageNav to="/#about" label="About" />

        <header className="experience-page-header">
          <h1 className="ios26-large-title ios26-large-title--emphasized">Experience</h1>
          <p className="ios26-subheadline" style={{ color: 'var(--color-label-secondary)', margin: 0 }}>
            12+ years across CPaaS product leadership, engineering management, and full-stack development.
          </p>
        </header>

        <div className="experience-list">
          {experience.map((item) => (
            <GlassCard key={`${item.company}-${item.period}`} size="la" className="experience-card">
              <div className="experience-card__header">
                <div>
                  <p className="ios26-headline" style={{ margin: '0 0 2px' }}>{item.role}</p>
                  <p className="ios26-subheadline" style={{ margin: 0, color: 'var(--color-accent-blue)' }}>
                    {item.company}
                  </p>
                </div>
                <span className="ios26-caption1 experience-card__period">{item.period}</span>
              </div>
              {item.highlights.length > 0 && (
                <ul className="experience-card__highlights">
                  {item.highlights.map((point) => (
                    <li key={point} className="ios26-footnote">{point}</li>
                  ))}
                </ul>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
