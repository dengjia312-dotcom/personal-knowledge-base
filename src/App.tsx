import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import Page4 from './pages/Page4';
import Page5 from './pages/Page5';
import KnowledgeSpace from './pages/KnowledgeSpace';
import { AppProvider } from './context/AppContext';
import { useTheme } from './hooks/useTheme';

function ThemedApp() {
  useTheme();
  return (
    <BrowserRouter>
      <Routes>
        {/* Knowledge Space: full-screen, outside main Layout */}
        <Route path="/knowledge-space" element={<KnowledgeSpace />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/page3" replace />} />
          <Route path="page1" element={<Page1 />} />
          <Route path="page2" element={<Page2 />} />
          <Route path="page3" element={<Page3 />} />
          <Route path="page4" element={<Page4 />} />
          <Route path="page5" element={<Page5 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ThemedApp />
    </AppProvider>
  );
}
