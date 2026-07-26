import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ios26/GlassCard';

const Home = () => {
  return (
    <section id="home" className="section">
      <motion.div
        className="hero"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="hero-avatar ios26-liquid-glass-sm glass-surface">
          <img
            src={`${process.env.PUBLIC_URL}/images/profile.jpg`}
            alt="Arundas Ramadasan"
            className="hero-avatar__photo"
          />
        </div>
        <h1 className="ios26-large-title ios26-large-title--emphasized">
          Arundas Ramadasan
        </h1>
        <p className="ios26-title3">Product Builder</p>
        <p className="ios26-body">
          Seasoned Product Manager with over 12 years of experience in engineering and
          product leadership roles, specializing in CPaaS, API integrations, and
          client-focused solutions.
        </p>
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
