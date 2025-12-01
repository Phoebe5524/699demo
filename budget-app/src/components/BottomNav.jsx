import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Calendar, User } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="bg-white border-t border-gray-100 px-8 py-4 flex justify-between items-end text-[10px] font-medium text-gray-400 h-20 pb-6 z-50 relative">
      <button 
        onClick={() => navigate('/')} 
        className={cn("flex flex-col items-center gap-1 transition-colors", path === '/' ? "text-black" : "hover:text-gray-600")}
      >
        <Home size={24} fill={path === '/' ? "black" : "none"} />
        Home
      </button>
      
      <button 
        onClick={() => navigate('/analysis')} 
        className={cn("flex flex-col items-center gap-1 transition-colors", path === '/analysis' ? "text-black" : "hover:text-gray-600")}
      >
        <Calendar size={24} fill={path === '/analysis' ? "black" : "none"} />
        Nov 10
      </button>
      
      <button 
        onClick={() => navigate('/envelope')} 
        className={cn("flex flex-col items-center gap-1 transition-colors", path === '/envelope' ? "text-black" : "hover:text-gray-600")}
      >
        <User size={24} fill={path === '/envelope' ? "black" : "none"} />
        My
      </button>
    </div>
  );
}