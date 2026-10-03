import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      {/* Backdrop covering full screen */}
      <div 
        className="fixed inset-0 bg-[#1F1F1F]/40 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Dialog box */}
      <div 
        className={`relative z-10 w-full ${widthClasses[maxWidth]} max-h-[85vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-2xl transition-all overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-5 shrink-0">
          <div className="min-w-0 flex-1 pr-2">
            <h3 className="text-base font-bold text-[#1F1F1F] truncate">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-[#6B6B6B] break-words">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-xl p-1.5 text-[#6B6B6B] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors cursor-pointer"
            title="Close"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 max-h-[65vh] overflow-y-auto p-4 sm:p-5 text-sm text-[#1F1F1F]">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-[#EEEEF2] bg-[#FAF9FC] p-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

