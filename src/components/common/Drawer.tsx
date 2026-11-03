import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  actions?: React.ReactNode;
  layout?: 'drawer' | 'modal' | 'default' | string;
  lockBackgroundScroll?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = 'lg',
  actions,
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Freeze main page scrollbar whenever sidebar is open - only sidebar can scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalHtmlOverflowY = document.documentElement.style.overflowY;
    const originalBodyOverflowY = document.body.style.overflowY;

    // Freeze main page scrollbar
    document.documentElement.style.overflowY = 'hidden';
    document.body.style.overflowY = 'hidden';

    return () => {
      document.documentElement.style.overflowY = originalHtmlOverflowY;
      document.body.style.overflowY = originalBodyOverflowY;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  const widthClasses: Record<'sm' | 'md' | 'lg' | 'xl' | '2xl', string> = {
    sm: 'w-full sm:w-[380px] max-w-[100vw]',
    md: 'w-full sm:w-[460px] max-w-[100vw]',
    lg: 'w-full sm:w-[540px] md:w-[580px] max-w-[100vw]',
    xl: 'w-full sm:w-[620px] md:w-[660px] max-w-[100vw]',
    '2xl': 'w-full sm:w-[720px] md:w-[760px] max-w-[100vw]',
  };

  return createPortal(
    <div className="fixed inset-0 top-16 pointer-events-none z-[45]">
      {/* 1. Dimmed Backdrop: Covers the main page below the top header (clickable to close, blocks wheel & touch on background) */}
      <div 
        className="fixed inset-0 top-16 bg-[#1F1F1F]/40 backdrop-blur-[1px] transition-opacity animate-in fade-in duration-150 pointer-events-auto cursor-pointer touch-none"
        onClick={onClose}
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-label="Close details"
      />

      {/* 2. Right-Side Fixed Sidebar: Always fixed to the browser viewport on the right, independently scrollable */}
      <aside
        className={`fixed top-16 bottom-0 right-0 flex flex-col bg-white border-l border-[#EEEEF2] shadow-2xl pointer-events-auto animate-in slide-in-from-right duration-200 ease-out select-text ${widthClasses[width]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-panel-title"
      >
        {/* Pinned Drawer Header */}
        <div className="flex items-start justify-between border-b border-[#EEEEF2] p-4 sm:p-5 bg-[#FAF9FC] shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h2 id="drawer-panel-title" className="text-base font-bold text-[#1F1F1F] truncate">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#6B6B6B] font-mono truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actions}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-[#6B6B6B] hover:bg-[#EEF3FF] hover:text-[#1B2E79] transition-colors cursor-pointer shrink-0 focus:outline-none"
              title="Close details"
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Independent Scrollable Content Body - Only this scrolls when drawer is open */}
        <div 
          className="drawer-scroll-container flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 text-[#1F1F1F]"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {children}
        </div>
      </aside>
    </div>,
    document.body
  );
};
