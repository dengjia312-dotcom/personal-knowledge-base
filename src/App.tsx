import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import Page4 from './pages/Page4';
import Page5 from './pages/Page5';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/page1" replace />} />
            <Route path="page1" element={<Page1 />} />
            <Route path="page2" element={<Page2 />} />
            <Route path="page3" element={<Page3 />} />
            <Route path="page4" element={<Page4 />} />
            <Route path="page5" element={<Page5 />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
