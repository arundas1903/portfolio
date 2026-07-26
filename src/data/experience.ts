export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  highlights: string[];
}

export const experience: ExperienceItem[] = [
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
