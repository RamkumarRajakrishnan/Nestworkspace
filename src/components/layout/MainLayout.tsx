import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div 
      className="min-h-screen w-full bg-[#FAF9FC] text-[#1F1F1F] flex flex-col relative overflow-x-hidden"
      style={{ '--sidebar-width': collapsed ? '4rem' : '15rem' } as React.CSSProperties}
    >
      {/* 
        Truly Fixed Navbar at the very top of the viewport.
        fixed top-0 left-0 right-0 guarantees it permanently stays locked to the top.
        It behaves like modern shopping websites and NEVER scrolls with the page.
      */}
      <div className="fixed top-0 left-0 right-0 z-50 w-full">
        <Header onOpenMobileSidebar={() => setMobileOpen(true)} />
      </div>

      {/* 
        Sidebar:
        - Mobile (< md): Off-canvas sliding drawer with dark backdrop
        - Tablet/Desktop (>= md): Fixed layout with collapse/expand toggle
      */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* 
        Main Content Area:
        - Mobile (< md): width 100%, pl-0, no compression or shifting when sidebar opens
        - Tablet/Desktop (>= md): existing padding (pl-16 when collapsed, pl-56/pl-60 when expanded)
      */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 w-full pt-16 ${
          collapsed ? 'pl-0 md:pl-16' : 'pl-0 md:pl-56 lg:pl-60'
        }`}
      >
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full min-w-0 max-w-full">
          <Outlet />
        </main>

        {/* Global Toast Container */}
        <ToastContainer />
      </div>
    </div>
  );
};

