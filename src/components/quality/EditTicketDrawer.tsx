import React, { useState, useEffect, useRef } from 'react';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { CustomerTicketItem } from '../../types';
import { updateCustomerTicketStatus } from '../../services/api';
import { useOperations } from '../../context/OperationsContext';
import {
  Tag,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  User,
  Mail,
  ChevronDown,
  Check
} from 'lucide-react';

interface EditTicketDrawerProps {
  ticket: CustomerTicketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (tableId: string, newStatus: string) => void;
}

const DEFAULT_STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const EditTicketDrawer: React.FC<EditTicketDrawerProps> = ({
  ticket,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const { addToast } = useOperations();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Status dropdown open/closed state
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ticket) {
      setSelectedStatus(ticket.status || 'Open');
      setError(null);
      setIsDropdownOpen(false);
    }
  }, [ticket, isOpen]);

  // Click outside and escape key handling for status dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  if (!ticket) return null;

  const currentStatus = ticket.status || 'Open';
  const customerName = ticket.customerName?.trim() || '—';

  // Make sure currentStatus is included in the options list if not already present
  const statusOptionsList = [...DEFAULT_STATUS_OPTIONS];
  if (currentStatus && !statusOptionsList.some((o) => o.toLowerCase() === currentStatus.toLowerCase())) {
    statusOptionsList.unshift(currentStatus);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket.tableId) {
      setError('Missing ticket tableId.');
      return;
    }

    if (!selectedStatus) {
      setError('Please select a status.');
      return;
    }

    if (selectedStatus === currentStatus) {
      addToast('No Change', `Ticket is already marked as ${selectedStatus}.`, 'info');
      onClose();
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // Strictly pass tableId from the selected ticket to updateCustomerTicketStatus
      const res = await updateCustomerTicketStatus({
        tableId: ticket.tableId,
        status: selectedStatus,
      });

      if (res.success) {
        addToast('Ticket Updated', `Status successfully changed to ${selectedStatus}.`, 'success');
        onStatusUpdated?.(ticket.tableId, selectedStatus);
        onClose();
      } else {
        const errorMsg = res.error || 'Failed to update ticket status. Please try again.';
        setError(errorMsg);
        addToast('Update Failed', errorMsg, 'error');
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error while updating ticket status.';
      setError(errorMsg);
      addToast('Error', errorMsg, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Ticket"
      subtitle={ticket.subject || 'Update ticket status'}
      width="md"
    >
      <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4">
        {/* Ticket Context Info Card */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-2.5 shadow-soft-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">
              {ticket.category || 'Nest Booking'}
            </span>
            <StatusBadge status={currentStatus} size="sm" />
          </div>

          <h4 className="text-sm font-bold text-[#1F1F1F] leading-snug break-words">
            {ticket.subject || 'Support Ticket'}
          </h4>

          <div className="pt-2 border-t border-[#EEEEF2] space-y-1 text-xs text-[#6B6B6B]">
            <div className="flex items-center justify-between">
              <span>Customer:</span>
              <span className="font-semibold text-[#1F1F1F]">{customerName}</span>
            </div>
            {ticket.email && (
              <div className="flex items-center justify-between">
                <span>Email:</span>
                <span className="font-mono text-[#1F1F1F]">{ticket.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error notification if update fails */}
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-[#FEF2F2] p-3 text-xs text-[#B42318]">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Editable Status Field with Polished Custom Dropdown & Clear Chevron Down Arrow */}
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <label className="block text-xs font-bold text-[#1F1F1F]">
            Ticket Status <span className="text-rose-500">*</span>
          </label>

          <div className="relative">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className={`w-full flex items-center justify-between gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all shadow-soft-xs cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                isDropdownOpen
                  ? 'border-[#5B21B6] bg-white ring-2 ring-[#5B21B6]/15 text-[#5B21B6]'
                  : 'border-[#EEEEF2] bg-[#FAF9FC] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
              }`}
              aria-haspopup="listbox"
              aria-expanded={isDropdownOpen}
            >
              <div className="flex items-center min-w-0">
                <StatusBadge status={selectedStatus || currentStatus} size="sm" />
              </div>

              {/* Clear down-arrow/chevron icon indicating dropdown state */}
              <ChevronDown
                className={`h-4 w-4 text-[#6B6B6B] shrink-0 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-[#5B21B6]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu Popover */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-56 overflow-y-auto rounded-xl border border-[#EEEEF2] bg-white p-1.5 shadow-soft-lg animate-in fade-in zoom-in-95">
                <div className="space-y-0.5" role="listbox">
                  {statusOptionsList.map((st) => {
                    const isSelected = selectedStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedStatus(st);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                            : 'text-[#1F1F1F] hover:bg-[#FAF9FC]'
                        }`}
                      >
                        <div className="flex items-center min-w-0">
                          <StatusBadge status={st} size="sm" />
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-[#5B21B6] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#6B6B6B]">
            Change the current operational state of this ticket.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EEEEF2]">
          <button
            type="button"
            onClick={onClose}
            disabled={isUpdating}
            className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isUpdating}
            className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2 text-xs font-bold shadow-soft-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </Drawer>
  );
};
export default EditTicketDrawer;
