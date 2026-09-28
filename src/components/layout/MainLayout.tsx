import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAF9FC] text-[#1F1F1F] flex w-full overflow-x-hidden">
      {/* Sidebar (Desktop fixed + Mobile slide-over drawer) */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 w-full ${
          collapsed ? 'pl-0 md:pl-18' : 'pl-0 md:pl-60'
        }`}
      >
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto w-full min-w-0">
          <Outlet />
        </main>

        {/* Global Toast Container */}
        <ToastContainer />
      </div>
    </div>
  );
};
