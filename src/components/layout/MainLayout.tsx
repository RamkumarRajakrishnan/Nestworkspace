import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '../common/ToastContainer';

export const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);

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
        <Header />
      </div>

      {/* 
        Sidebar is fixed directly below the navbar on the left side.
        Opening/closing does not blur, overlay, or block scrolling on desktop.
      */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed}
      />

      {/* 
        Main Content Area:
        - Sidebar and content behave as part of the same layout with ZERO overlap across mobile, tablet, and desktop.
        - Closed: pl-16 (sidebar is 64px, content expands across remaining space).
        - Open: pl-48 sm:pl-56 lg:pl-60 (content automatically compresses/adjusts to available width).
        - Horizontal scrolling is preserved within main (overflow-x-auto) so touch/mouse scrolling works seamlessly.
      */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 w-full pt-16 ${
          collapsed ? 'pl-16' : 'pl-48 sm:pl-56 lg:pl-60'
        }`}
      >
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full min-w-0 max-w-full overflow-x-auto">
          <Outlet />
        </main>

        {/* Global Toast Container */}
        <ToastContainer />
      </div>
    </div>
  );
};

