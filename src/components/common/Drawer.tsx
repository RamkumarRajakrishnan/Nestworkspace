import React, { useEffect } from 'react';
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
  lockBackgroundScroll = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open and lockBackgroundScroll is true
  useEffect(() => {
    if (!isOpen || !lockBackgroundScroll) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;

    // Prevent horizontal content shift on desktop when scrollbar disappears
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Prevent touchdrag on background elements on mobile / tablet (e.g. iOS Safari)
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      const isInsideScrollable = target?.closest('.drawer-scroll-container');
      if (!isInsideScrollable) {
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isOpen, lockBackgroundScroll]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm lg:max-w-sm',
    md: 'max-w-md lg:max-w-md',
    lg: 'max-w-lg lg:max-w-lg',
    xl: 'max-w-xl lg:max-w-xl',
    '2xl': 'max-w-2xl lg:max-w-2xl',
  };

  return (
    <div 
      className="fixed top-16 bottom-0 right-0 left-0 md:left-[var(--sidebar-width,15rem)] z-30 overflow-hidden flex items-center justify-center p-3 sm:p-4 lg:p-0 lg:block animate-in fade-in duration-150"
      onWheel={(e) => {
        if (lockBackgroundScroll && e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      {/* Dimmed backdrop covering main content area (Header and Sidebar remain visible above it) */}
      <div 
        className="absolute inset-0 bg-[#1F1F1F]/40 backdrop-blur-xs transition-opacity cursor-pointer touch-none"
        onClick={onClose}
        onWheel={(e) => {
          if (lockBackgroundScroll) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onTouchMove={(e) => {
          if (lockBackgroundScroll) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        aria-label="Close panel"
      />

      {/* 
        Responsive Panel:
        - Mobile & Tablet (< lg): Centered Popup / Card with rounded corners and max-height.
        - Desktop (lg+): Right-side Drawer / Side Panel attached to right edge, full height below header, border-l.
      */}
      <div 
        className={`relative z-10 w-full ${widthClasses[width]} flex flex-col bg-white overflow-hidden
          /* Mobile + Tablet: Centered Popup/Card */
          max-h-[85vh] rounded-2xl border border-[#EEEEF2] shadow-soft-lg
          /* Desktop (lg+): Right-Side Drawer matching reference */
          lg:absolute lg:inset-y-0 lg:right-0 lg:h-full lg:max-h-full lg:rounded-none lg:border-l lg:border-t-0 lg:border-r-0 lg:border-b-0 lg:border-[#EEEEF2] lg:shadow-2xl lg:animate-in lg:slide-in-from-right duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EEEEF2] p-4 sm:p-5 bg-[#FAF9FC] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#1F1F1F]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#6B6B6B] font-mono">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-[#6B6B6B] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors cursor-pointer"
              title="Close"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div 
          className="drawer-scroll-container flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 text-[#1F1F1F]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};


