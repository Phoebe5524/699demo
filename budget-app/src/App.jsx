import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import EnvelopePage from './pages/EnvelopePage';
import BottomNav from './components/BottomNav';
import { ChatProvider } from './context/ChatContext'; 
import ChatInterface from './components/ChatInterface'; 

function AppContent() {
  return (
    <div className="min-h-screen flex justify-center bg-gray-200 py-8 font-sans select-none text-brand-dark">
      <div className="w-full max-w-[390px] bg-white h-[844px] rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col border-[8px] border-gray-100 box-content">
        
        {/* Chat Interface (全局覆盖) */}
        <ChatInterface />

        <div className="flex-1 overflow-hidden relative">
          <Routes>
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/" element={<Home />} />
            <Route path="/envelope" element={<EnvelopePage />} />
          </Routes>
        </div>

        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <Router>
        <AppContent />
      </Router>
    </ChatProvider>
  );
}