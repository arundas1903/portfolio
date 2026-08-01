import React from 'react';
import Button from '../components/ios26/Button';
import ProjectCard from '../components/ProjectCard';
import { trackEvent } from '../analytics/mixpanel';
import { FEATURED_PROJECT_COUNT, projects } from '../data/projects';

const featuredProjects = projects.slice(0, FEATURED_PROJECT_COUNT);
const remainingCount = projects.length - FEATURED_PROJECT_COUNT;

const Projects = () => {
  return (
    <section id="projects" className="section">
      <div className="section-header">
        <h2 className="ios26-large-title">Projects</h2>
        <p className="ios26-subheadline">Products I've led and shipped</p>
      </div>

      <div className="projects-grid">
        {featuredProjects.map((project, index) => (
          <ProjectCard key={project.title} project={project} index={index} />
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="projects-more">
          <Button
            variant="tinted"
            to="/projects"
            onClick={() => trackEvent('Project More Click', { remaining: remainingCount })}
          >
            View all projects ({projects.length})
          </Button>
        </div>
      )}
    </section>
  );
};

export default Projects;
