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
import PortfolioApp from './PortfolioApp';
import A2PAtlasPage from './a2p-atlas/A2PAtlasPage';
import BlogPostPage from './pages/BlogPostPage';

function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace('#', '');
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [pathname, hash]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<PortfolioApp />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/a2p-atlas" element={<A2PAtlasPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
