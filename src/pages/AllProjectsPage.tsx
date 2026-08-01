import React from 'react';
import SubpageNav from '../components/ios26/SubpageNav';
import ProjectCard from '../components/ProjectCard';
import { projects } from '../data/projects';

export default function AllProjectsPage() {
  return (
    <div className="projects-page">
      <div className="projects-page__background" aria-hidden />

      <div className="projects-page__inner">
        <SubpageNav to="/#projects" label="Work" />

        <header className="projects-page__header">
          <h1 className="ios26-large-title ios26-large-title--emphasized">All projects</h1>
          <p className="ios26-subheadline projects-page__lead">
            Products I've led and shipped — demos, tools, and platform work.
          </p>
        </header>

        <div className="projects-grid">
          {projects.map((project, index) => (
            <ProjectCard key={project.title} project={project} index={index} animate={false} />
          ))}
        </div>
      </div>
    </div>
  );
}
