import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ios26/GlassCard';
import { trackEvent } from '../analytics/mixpanel';

const TOPMATE_URL = 'https://topmate.io/arundas/';

const trackContactClick = (channel: string, url: string) => {
  trackEvent('Contact Link Click', { channel, url });
};

const Contact = () => {
  return (
    <section id="contact" className="section">
      <div className="section-header">
        <h2 className="ios26-large-title">Contact</h2>
        <p className="ios26-subheadline">Let's build something together</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard size="la">
          <h3 className="ios26-title3" style={{ margin: '0 0 8px' }}>Connect</h3>
          <p className="ios26-body" style={{ margin: '0 0 8px', color: 'var(--color-label-secondary)' }}>
            Open to discussing product strategy, CPaaS solutions, and collaborations.
          </p>
          <p className="ios26-callout" style={{ margin: '0 0 4px' }}>
            <a
              href="mailto:arundas1903@gmail.com"
              style={{ color: 'var(--color-accent-blue)', textDecoration: 'none' }}
              onClick={() => trackContactClick('email', 'mailto:arundas1903@gmail.com')}
            >
              arundas1903@gmail.com
            </a>
          </p>
          <p className="ios26-callout" style={{ margin: '0 0 4px' }}>
            <a
              href={TOPMATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent-blue)', textDecoration: 'none' }}
              onClick={() => trackContactClick('topmate', TOPMATE_URL)}
            >
              topmate.io/arundas
            </a>
          </p>
          <div className="social-links">
            <a
              className="social-link"
              href={TOPMATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Topmate"
              onClick={() => trackContactClick('topmate', TOPMATE_URL)}
            >
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z" />
              </svg>
            </a>
            <a
              className="social-link"
              href="https://www.linkedin.com/in/arundas-ramadasan-6489a8a5/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              onClick={() =>
                trackContactClick(
                  'linkedin',
                  'https://www.linkedin.com/in/arundas-ramadasan-6489a8a5/',
                )
              }
            >
              <svg viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            <a
              className="social-link"
              href="https://instagram.arundas.me"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              onClick={() => trackContactClick('instagram', 'https://instagram.arundas.me')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              className="social-link"
              href="mailto:arundas1903@gmail.com"
              aria-label="Email"
              onClick={() => trackContactClick('email', 'mailto:arundas1903@gmail.com')}
            >
              <svg viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </a>
          </div>
        </GlassCard>
      </motion.div>
    </section>
  );
};

export default Contact;
