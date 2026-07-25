import React from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ios26/GlassCard';

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

const experience = [
  {
    company: 'Kaleyra / Tata Communications',
    role: 'Senior Product Manager',
    period: 'Jan 2024 – Present',
    highlights: [
      'Led product management for CPaaS offerings including SMS, URL Shortener, Numbers, Verify Workflow, and Plugins/Integrations.',
      'Collaborated with Engineering Managers and stakeholders to prioritize initiatives, define goals, and develop product roadmaps.',
      'Engaged clients in a co-creation model to deliver tailored solutions aligned with customer needs.',
      'Acted as Technical Product Manager, partnering with engineering to address technical challenges and build scalable solutions.',
      'Owned product lifecycle from ideation to launch, driving adoption with Marketing, Sales, and Customer Success.',
    ],
  },
  {
    company: 'Kaleyra',
    role: 'Engineering Manager',
    period: 'Jun 2021 – Jan 2024',
    highlights: [
      'Led development of Django and React applications integrating Kaleyra APIs with CRM platforms.',
      'Mentored team members and collaborated with QA to implement automated API testing frameworks.',
      'Acted as interim Product Owner, overseeing roadmap planning, prioritization, and product activities.',
      'Managed cross-functional collaboration between Product, Design, and QA to deliver features on time.',
    ],
  },
  {
    company: 'Fullcontact',
    role: 'Fullstack Engineer',
    period: 'Sep 2019 – Apr 2021',
    highlights: [
      'Built high-performance applications using Clojure and ClojureScript for backend and frontend.',
      'Rearchitected product architecture and reengineered microservices for modularity and scalability.',
      'Led migration of the frontend stack to React, modernizing the UI and developer experience.',
      'Managed and mentored a small team of developers.',
    ],
  },
  {
    company: 'QBurst Technologies',
    role: 'Senior Engineer',
    period: 'Mar 2018 – Aug 2019',
    highlights: [
      'Designed APIs for a property management application using Django.',
      'Led development of an NFL games mobile app in React Native under tight deadlines.',
      'Built applications with Node.js backend and React frontend.',
    ],
  },
  {
    company: 'Attinad Software, Kochi',
    role: 'Senior Software Engineer',
    period: 'Jul 2017 – May 2018',
    highlights: [
      'Built an analytics platform for an OTT application using Django and MongoDB, enabling data-driven insights and reporting.',
      'Developed applications for the Tizen TV OS using Angular as lead developer, ensuring timely delivery of high-quality features.',
      'Designed and led backend solutions using Django, delivering scalable and efficient applications.',
      'Collaborated with stakeholders to gather requirements, design architecture, and deploy robust solutions tailored to business needs.',
    ],
  },
  {
    company: 'Trace VFX',
    role: 'Software Engineer',
    period: 'Sep 2016 – Jul 2017',
    highlights: [
      'Developed in-house employee applications using Django and AngularJS.',
      'Built internal supervisor tools and a customer-facing video download application for VFX workflows.',
    ],
  },
  {
    company: 'QBurst Technologies',
    role: 'Software Engineer',
    period: 'May 2014 – Aug 2016',
    highlights: [
      'Started as a Python/Django developer building web applications and RESTful APIs with Django REST Framework.',
      'Built scalable backend services with Express.js and dynamic UIs with Marionette.js and Backbone.js.',
    ],
  },
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

        <h3 className="ios26-title2" style={{ margin: '32px 0 16px' }}>Experience</h3>
        <div className="experience-list">
          {experience.map((item) => (
            <GlassCard key={`${item.company}-${item.period}`} className="glass-card experience-card">
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
