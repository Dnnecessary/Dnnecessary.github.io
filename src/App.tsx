import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { CardProvider } from '@/contexts/CardContext';

import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <CardProvider>
        <div className="flex min-h-screen w-full">
          <main className="flex-1 min-w-0">
            {/* 全局兜底边界：任何页面级渲染错误不会白屏 */}
            <ErrorBoundary title="页面渲染出错" showDetail={import.meta.env.DEV}>
              <Routes>
              {routes.map((route, index) => (
                <Route
                  key={index}
                  path={route.path}
                  element={route.element}
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>
        <Toaster />
      </CardProvider>
    </Router>
  );
};

export default App;
