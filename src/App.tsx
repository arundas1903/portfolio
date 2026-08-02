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
import './styles/poc-bfsi-sms.css';
import './styles/poc-bfsi-sms-2.css';
import './styles/payment-poc-app.css';
import './styles/task-tracker.css';
import './styles/url-strength.css';
import './flow-builder/styles/flow-builder.css';
import PortfolioApp from './PortfolioApp';
import A2PAtlasPage from './a2p-atlas/A2PAtlasPage';
import A2PRegulatoryMcpPage from './pages/A2PRegulatoryMcpPage';
import BlogPostPage from './pages/BlogPostPage';
import ExperiencePage from './pages/ExperiencePage';
import BfsiSmsPage from './pages/poc-bfsi-sms/BfsiSmsPage';
import Bfsi2SmsPage from './pages/poc-bfsi-sms-2/Bfsi2SmsPage';
import PaymentPocApp from './pages/payment-poc-app/PaymentPocApp';
import TaskTrackerPage from './pages/task-tracker/TaskTrackerPage';
import UrlStrengthPage from './pages/url-strength/UrlStrengthPage';
import FlowConfigurationsPage from './flow-builder/FlowConfigurationsPage';
import FlowBuilderEditorPage from './flow-builder/FlowBuilderEditorPage';
import FlowBuilderLayout from './flow-builder/FlowBuilderLayout';
import AllProjectsPage from './pages/AllProjectsPage';
import AllBlogPage from './pages/AllBlogPage';
import ChatWidget from './components/ChatWidget';
import MixpanelPageTracker from './analytics/MixpanelPageTracker';

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

function AppRoutes() {
  const { pathname } = useLocation();
  const hideChat = pathname.startsWith('/payment-poc-app')
    || pathname.startsWith('/task-tracker')
    || pathname.startsWith('/url-strength');

  return (
    <>
      <Routes>
        <Route path="/" element={<PortfolioApp />} />
        <Route path="/experience" element={<ExperiencePage />} />
        <Route path="/blog" element={<AllBlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/a2p-atlas" element={<A2PAtlasPage />} />
        <Route path="/a2p-regulatory-mcp" element={<A2PRegulatoryMcpPage />} />
        <Route path="/poc-bfsi-sms" element={<BfsiSmsPage />} />
        <Route path="/poc-bfsi-sms-2" element={<Bfsi2SmsPage />} />
        <Route path="/payment-poc-app" element={<PaymentPocApp />} />
        <Route path="/task-tracker" element={<TaskTrackerPage />} />
        <Route path="/projects" element={<AllProjectsPage />} />
        <Route path="/url-strength" element={<UrlStrengthPage />} />
        <Route path="/flow-builder" element={<FlowBuilderLayout />}>
          <Route index element={<FlowConfigurationsPage />} />
          <Route path="new" element={<FlowBuilderEditorPage />} />
          <Route path=":configId" element={<FlowBuilderEditorPage />} />
        </Route>
      </Routes>
      {!hideChat && <ChatWidget />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <MixpanelPageTracker />
      <ScrollManager />
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
