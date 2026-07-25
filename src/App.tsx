import React from 'react';
import '@ios26_design_system/tokens/css';
import '@ios26_design_system/tokens/css/typography';
import '@ios26_design_system/tokens/css/materials';
import '@ios26_design_system/tokens/css/animations';
import './styles/theme-overrides.css';
import Home from './pages/Home';
import About from './pages/About';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import TabBar from './components/ios26/TabBar';
import ThemeToggle from './components/ios26/ThemeToggle';
import { useScrollDirection, useActiveSection } from './hooks/useScroll';
import './styles/ios26-portfolio.css';

const SECTIONS = ['home', 'about', 'projects', 'contact'];

const tabs = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
      </svg>
    ),
  },
  {
    id: 'about',
    label: 'About',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
  },
  {
    id: 'projects',
    label: 'Work',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
      </svg>
    ),
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: (
      <svg viewBox="0 0 24 24">
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
      </svg>
    ),
  },
];

function App() {
  const tabBarHidden = useScrollDirection();
  const activeSection = useActiveSection(SECTIONS);

  const handleTabChange = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <div className="app-background" aria-hidden>
        <div className="app-background__orb app-background__orb--blue" />
        <div className="app-background__orb app-background__orb--purple" />
        <div className="app-background__orb app-background__orb--teal" />
      </div>

      <main className="page-content">
        <header className="toolbar">
          <ThemeToggle />
        </header>

        <Home />
        <About />
        <Projects />
        <Contact />
      </main>

      <TabBar
        tabs={tabs}
        activeTab={activeSection}
        onTabChange={handleTabChange}
        hidden={tabBarHidden}
      />
    </div>
  );
}

export default App;
