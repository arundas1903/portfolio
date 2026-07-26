import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import '@ios26_design_system/tokens/css';
import '@ios26_design_system/tokens/css/typography';
import '@ios26_design_system/tokens/css/materials';
import '@ios26_design_system/tokens/css/animations';
import './styles/theme-overrides.css';
import './styles/ios26-portfolio.css';
import PortfolioApp from './PortfolioApp';
import A2PAtlasPage from './a2p-atlas/A2PAtlasPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortfolioApp />} />
        <Route path="/a2p-atlas" element={<A2PAtlasPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
