import React from 'react';
import { useOperations } from '../../context/OperationsContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useOperations();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case 'success':
              return <CheckCircle2 className="h-4 w-4 text-[#027A48] shrink-0" />;
            case 'error':
              return <AlertCircle className="h-4 w-4 text-[#B42318] shrink-0" />;
            case 'warning':
              return <AlertTriangle className="h-4 w-4 text-[#C2410C] shrink-0" />;
            default:
              return <Info className="h-4 w-4 text-[#5B21B6] shrink-0" />;
          }
        };

        const getBorderAndBg = () => {
          switch (toast.type) {
            case 'success': return 'border-[#A6F4C5] bg-white';
            case 'error': return 'border-[#FECDCA] bg-white';
            case 'warning': return 'border-[#FED7AA] bg-white';
            default: return 'border-[#DDD6FE] bg-white';
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-soft-md transition-all animate-in fade-in slide-in-from-bottom-2 ${getBorderAndBg()}`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon()}</div>
              <div>
                <h4 className="text-xs font-bold text-[#1F1F1F]">{toast.title}</h4>
                <p className="mt-0.5 text-xs text-[#6B6B6B] leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#9CA3AF] hover:text-[#1F1F1F] p-0.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
