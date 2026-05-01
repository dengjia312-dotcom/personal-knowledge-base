import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';
import Page4 from './pages/Page4';
import Page5 from './pages/Page5';
import { AppProvider } from './context/AppContext';
import { useTheme } from './hooks/useTheme';

const BrainView = React.lazy(() => import('./pages/BrainView'));

function BrainViewLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[680px] items-center justify-center bg-[#070b14] px-6 text-center text-sm font-medium text-cyan-100">
      正在加载知识脑图...
    </div>
  );
}

function ThemedApp() {
  useTheme();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/page3" replace />} />
          <Route path="page1" element={<Page1 />} />
          <Route path="page2" element={<Page2 />} />
          <Route path="page3" element={<Page3 />} />
          <Route path="page4" element={<Page4 />} />
          <Route path="page5" element={<Page5 />} />
          <Route
            path="brain"
            element={
              <React.Suspense fallback={<BrainViewLoading />}>
                <BrainView />
              </React.Suspense>
            }
          />
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
