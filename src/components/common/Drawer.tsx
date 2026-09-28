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
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10">
        <div className={`w-full sm:w-screen ${widthClasses[width]} border-l border-[#EEEEF2] bg-white shadow-soft-lg flex flex-col`}>
          {/* Drawer Header */}
          <div className="flex items-start justify-between border-b border-[#EEEEF2] p-5 bg-[#FAF9FC]">
            <div>
              <h2 className="text-base font-bold text-[#1F1F1F]">{title}</h2>
              {subtitle && <p className="mt-0.5 text-xs text-[#6B6B6B] font-mono">{subtitle}</p>}
            </div>
            <div className="flex items-center gap-2">
              {actions}
              <button
                onClick={onClose}
                className="rounded-xl p-1.5 text-[#6B6B6B] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 text-[#1F1F1F]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
