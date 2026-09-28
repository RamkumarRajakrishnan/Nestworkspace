import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  requireReason?: boolean;
  reasonPlaceholder?: string;
  reasonOptions?: string[];
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  requireReason = false,
  reasonPlaceholder = 'Please select or enter justification reason...',
  reasonOptions,
}) => {
  const [reason, setReason] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const finalReason = selectedPreset || reason;
    if (requireReason && !finalReason.trim()) {
      setError('A reason is required to perform this action.');
      return;
    }
    setError('');
    onConfirm(finalReason);
    onClose();
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-[#FEF2F2] text-[#B42318] border border-[#FECDCA] hover:bg-[#FEE2E2]';
      case 'warning':
        return 'bg-[#FFF7ED] text-[#C2410C] border border-[#FED7AA] hover:bg-[#FFEDD5]';
      case 'info':
        return 'bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-soft-sm';
      default:
        return 'bg-[#5B21B6] hover:bg-[#4C1D95] text-white shadow-soft-sm';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            onClick={onClose}
            className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all active:scale-95 ${getButtonStyles()}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFF7ED] text-[#C2410C]">
            {variant === 'danger' ? <AlertTriangle className="h-4 w-4 text-[#B42318]" /> : <Info className="h-4 w-4" />}
          </div>
          <p className="text-xs text-[#1F1F1F] leading-relaxed">{message}</p>
        </div>

        {requireReason && (
          <div className="space-y-2 pt-2 border-t border-[#EEEEF2]">
            <label className="text-xs font-semibold text-[#1F1F1F]">
              Operational Reason <span className="text-[#B42318]">*</span>
            </label>

            {reasonOptions && reasonOptions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-1">
                {reasonOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(opt);
                      setError('');
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                      selectedPreset === opt 
                        ? 'bg-[#EDE9FE] border-[#7C3AED] text-[#5B21B6]' 
                        : 'bg-[#F7F5FA] border-[#EEEEF2] text-[#6B6B6B] hover:text-[#1F1F1F]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            <textarea
              rows={2}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setSelectedPreset('');
                setError('');
              }}
              placeholder={reasonPlaceholder}
              className="w-full rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] p-2.5 text-xs text-[#1F1F1F] placeholder-[#9CA3AF] focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20"
            />

            {error && <p className="text-xs text-[#B42318] font-medium">{error}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
};
