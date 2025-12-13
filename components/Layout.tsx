import React from 'react';
import { Home, CalendarCheck, LogOut, CalendarDays } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'today' | 'calendar';
  onTabChange: (tab: 'dashboard' | 'today' | 'calendar') => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-brand-600">ClassTrack</h1>
            <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Live</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-500 hover:text-red-500">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2 text-xs text-yellow-800 text-center">
        ⚠️ Unofficial Tool. Data is stored locally on this device.
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-md mx-auto p-4">
          {children}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 pb-safe z-20">
        <div className="max-w-md mx-auto flex justify-around">
          <button 
            onClick={() => onTabChange('today')}
            className={`flex flex-col items-center p-3 w-1/3 ${activeTab === 'today' ? 'text-brand-600' : 'text-gray-400'}`}
          >
            <CalendarCheck size={24} />
            <span className="text-[10px] mt-1 font-medium">Today</span>
          </button>
          <button 
            onClick={() => onTabChange('calendar')}
            className={`flex flex-col items-center p-3 w-1/3 ${activeTab === 'calendar' ? 'text-brand-600' : 'text-gray-400'}`}
          >
            <CalendarDays size={24} />
            <span className="text-[10px] mt-1 font-medium">History</span>
          </button>
          <button 
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center p-3 w-1/3 ${activeTab === 'dashboard' ? 'text-brand-600' : 'text-gray-400'}`}
          >
            <Home size={24} />
            <span className="text-[10px] mt-1 font-medium">Stats</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Layout;