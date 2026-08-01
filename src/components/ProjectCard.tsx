import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from './ios26/GlassCard';
import Button from './ios26/Button';
import { trackEvent } from '../analytics/mixpanel';
import type { Project } from '../data/projects';

interface ProjectCardProps {
  project: Project;
  index?: number;
  animate?: boolean;
}

export default function ProjectCard({ project, index = 0, animate = true }: ProjectCardProps) {
  const card = (
    <GlassCard size="la" className="project-card">
      <div
        className="project-card__icon"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${project.accent} 25%, transparent), color-mix(in srgb, ${project.accent} 8%, transparent))`,
        }}
      >
        <span role="img" aria-label={project.title}>
          {project.icon}
        </span>
      </div>
      <div className="project-card__body">
        <h3 className="ios26-title3">{project.title}</h3>
        <p className="ios26-footnote">{project.description}</p>
        <div className="project-tags">
          {project.technologies.map((tag) => (
            <span key={tag} className="project-tag">
              {tag}
            </span>
          ))}
        </div>
        {project.liveDemo && (
          <div className="project-card__actions">
            <Button
              variant="filled"
              to={project.liveDemo}
              onClick={() =>
                trackEvent('Project Demo Click', {
                  project: project.title,
                  destination: project.liveDemo,
                })
              }
            >
              Live Demo
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );

  if (!animate) {
    return card;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {card}
    </motion.div>
  );
}
