import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ios26/GlassCard';
import Button from '../components/ios26/Button';

const Home = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="section">
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="hero-avatar ios26-liquid-glass-sm glass-surface">AR</div>
        <h1 className="ios26-large-title ios26-large-title--emphasized">
          Arundas Ramadasan
        </h1>
        <p className="ios26-title3">Product Builder</p>
        <p className="ios26-body">
          Seasoned Product Manager with over 12 years of experience in engineering and
          product leadership roles, specializing in CPaaS, API integrations, and
          client-focused solutions.
        </p>
        <div className="ios26-btn-group" style={{ justifyContent: 'center' }}>
          <Button variant="filled" onClick={() => scrollTo('projects')}>
            View My Work
          </Button>
          <Button variant="tinted" onClick={() => scrollTo('blog')}>
            Read Blog
          </Button>
          <Button variant="tinted" onClick={() => scrollTo('contact')}>
            Get in Touch
          </Button>
        </div>
      </motion.div>

      <GlassCard size="la">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center' }}>
          {[
            { value: '12+', label: 'Years Experience' },
            { value: '6+', label: 'Products Owned' },
            { value: '11+', label: 'Team Size Led' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="ios26-title2 ios26-title2--emphasized" style={{ margin: '0 0 4px', color: 'var(--color-accent-blue)' }}>
                {stat.value}
              </p>
              <p className="ios26-caption1" style={{ margin: 0, color: 'var(--color-label-secondary)' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  );
};

export default Home;
