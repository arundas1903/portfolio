import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ios26/GlassCard';
import Button from '../components/ios26/Button';

const skills = [
  'Product Strategy',
  'CPaaS',
  'API Integration',
  'SMS Platforms',
  'URL Shorteners',
  'CRM Integration',
  'Cross-functional Leadership',
  'Backend Development',
  'Full-stack Development',
  'Client Solutions',
];

const About = () => {
  return (
    <section id="about" className="section">
      <div className="section-header">
        <h2 className="ios26-large-title">About</h2>
        <p className="ios26-subheadline">Engineering background, product mindset</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard size="la" className="glass-card">
          <p className="ios26-body" style={{ margin: '0 0 16px' }}>
            Seasoned Product Manager with over 12 years of experience in engineering and
            product leadership roles, specializing in CPaaS, API integrations, and
            client-focused solutions.
          </p>
          <p className="ios26-body" style={{ margin: 0, color: 'var(--color-label-secondary)' }}>
            Strong foundation in backend and full-stack development, successfully leading
            cross-functional teams to build innovative products like SMS platforms, URL
            shorteners, and CRM integrations. Proven track record of owning products from
            ideation to launch, driving product strategy, and delivering impactful solutions.
          </p>
        </GlassCard>

        <GlassCard size="la" className="glass-card about-experience-link">
          <div>
            <h3 className="ios26-title3" style={{ margin: '0 0 8px' }}>Experience</h3>
            <p className="ios26-footnote about-experience-link__text">
              From software engineer to Senior Product Manager at Kaleyra / Tata Communications —
              CPaaS, CRM integrations, and cross-functional leadership across different roles.
            </p>
          </div>
          <Button variant="tinted" to="/experience">
            View full experience
          </Button>
        </GlassCard>

        <h3 className="ios26-title2" style={{ margin: '32px 0 16px' }}>Skills & Expertise</h3>
        <div className="skills-grid">
          {skills.map((skill) => (
            <motion.div
              key={skill}
              className="skill-chip"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {skill}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default About;
