import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import EnvelopePage from './pages/EnvelopePage';
import BottomNav from './components/BottomNav';

function AppContent() {
  return (
    <div className="min-h-screen flex justify-center bg-gray-200 py-8 font-sans select-none text-brand-dark">
      <div className="w-full max-w-[390px] bg-white h-[844px] rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-gray-100 box-content">
        
        {/* 路由视图 */}
        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/" element={<Home />} />
            <Route path="/envelope" element={<EnvelopePage />} />
          </Routes>
        </div>

        {/* 底部导航 (全局可见) */}
        <BottomNav />
        
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}