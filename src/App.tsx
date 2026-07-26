import React, { useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import '@ios26_design_system/tokens/css';
import '@ios26_design_system/tokens/css/typography';
import '@ios26_design_system/tokens/css/materials';
import '@ios26_design_system/tokens/css/animations';
import './styles/theme-overrides.css';
import './styles/ios26-portfolio.css';
import './styles/blog.css';
import './styles/subpage-nav.css';
import './styles/experience-page.css';
import './styles/a2p-regulatory-mcp.css';
import PortfolioApp from './PortfolioApp';
import A2PAtlasPage from './a2p-atlas/A2PAtlasPage';
import A2PRegulatoryMcpPage from './pages/A2PRegulatoryMcpPage';
import BlogPostPage from './pages/BlogPostPage';
import ExperiencePage from './pages/ExperiencePage';
import ChatWidget from './components/ChatWidget';

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const scrollToHash = () => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return true;
        }
        return false;
      };

      if (!scrollToHash()) {
        window.setTimeout(() => {
          scrollToHash();
        }, 0);
      }
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<PortfolioApp />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/a2p-atlas" element={<A2PAtlasPage />} />
        <Route path="/a2p-regulatory-mcp" element={<A2PRegulatoryMcpPage />} />
      </Routes>
      <ChatWidget />
    </BrowserRouter>
  );
}

export default App;
