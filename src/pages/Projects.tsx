import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ios26/GlassCard';
import Button from '../components/ios26/Button';

interface Project {
  title: string;
  description: string;
  icon: string;
  technologies: string[];
  accent: string;
  liveDemo?: string;
}

const projects: Project[] = [
  {
    title: 'A2P Atlas',
    description:
      'Interactive world map of A2P SMS origination support by country — alphanumeric sender IDs, short codes, long codes, and toll-free numbers.',
    icon: '🌍',
    technologies: ['CPaaS', 'A2P SMS', 'Regulatory', 'Maps'],
    accent: 'var(--color-accent-teal)',
    liveDemo: '/a2p-atlas',
  },
  {
    title: 'Enterprise SMS and Email Platform',
    description:
      'Scalable messaging platform for enterprise clients, delivering high-volume SMS and email with analytics, routing, and reliability at scale.',
    icon: '📱',
    technologies: ['CPaaS', 'SMS', 'Email', 'Enterprise'],
    accent: 'var(--color-accent-blue)',
  },
  {
    title: 'Enterprise Grade URL Shortener',
    description:
      'URL shortening service with custom domains, click tracking, and enterprise-grade security for high-traffic link management.',
    icon: '🔗',
    technologies: ['URL Shortener', 'Analytics', 'Enterprise'],
    accent: 'var(--color-accent-indigo)',
  },
  {
    title: 'CRM Integration Framework',
    description:
      'Flexible integration layer connecting multiple CRM platforms with unified APIs, reducing integration time and improving data sync.',
    icon: '⚡',
    technologies: ['CRM', 'API Integration', 'Data Sync'],
    accent: 'var(--color-accent-teal)',
  },
  {
    title: 'AI Based Campaigner for CRM Platforms',
    description:
      'AI-powered campaign orchestration tool for CRM platforms, enabling intelligent audience targeting and automated outreach.',
    icon: '🤖',
    technologies: ['AI', 'CRM', 'Campaigns'],
    accent: 'var(--color-accent-purple)',
  },
  {
    title: 'Channel Engagement Analysis Tool',
    description:
      'Analytics platform for measuring and optimizing engagement across communication channels with actionable insights.',
    icon: '📊',
    technologies: ['Analytics', 'Engagement', 'CPaaS'],
    accent: 'var(--color-accent-cyan)',
  },
  {
    title: 'VFX Internal Management Tool',
    description:
      'Internal workflow and asset management system for VFX production teams, streamlining project tracking and collaboration.',
    icon: '🎬',
    technologies: ['VFX', 'Workflow', 'Internal Tools'],
    accent: 'var(--color-accent-orange)',
  },
];

const Projects = () => {
  return (
    <section id="projects" className="section">
      <div className="section-header">
        <h2 className="ios26-large-title">Projects</h2>
        <p className="ios26-subheadline">Products I've led and shipped</p>
      </div>

      <div className="projects-grid">
        {projects.map((project, index) => (
          <motion.div
            key={project.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-30px' }}
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <GlassCard size="la" className="project-card">
              <div
                className="project-card__icon"
                style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${project.accent} 25%, transparent), color-mix(in srgb, ${project.accent} 8%, transparent))` }}
              >
                <span role="img" aria-label={project.title}>{project.icon}</span>
              </div>
              <div className="project-card__body">
                <h3 className="ios26-title3">{project.title}</h3>
                <p className="ios26-footnote">{project.description}</p>
                <div className="project-tags">
                  {project.technologies.map((tag) => (
                    <span key={tag} className="project-tag">{tag}</span>
                  ))}
                </div>
                {project.liveDemo && (
                  <div className="project-card__actions">
                    <Button variant="filled" to={project.liveDemo}>
                      Live Demo
                    </Button>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default Projects;
