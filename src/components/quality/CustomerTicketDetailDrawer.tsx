import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer } from '../common/Drawer';
import { StatusBadge } from '../common/StatusBadge';
import { CustomerTicketItem, CustomerTicketDetails } from '../../types';
import { getCustomerTicketDetails } from '../../services/api';
import {
  User,
  Mail,
  Phone,
  Tag,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

interface CustomerTicketDetailDrawerProps {
  tableId: string | null;
  ticketSummary: CustomerTicketItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: (tableId: string, newStatus: string) => void;
}

export const CustomerTicketDetailDrawer: React.FC<CustomerTicketDetailDrawerProps> = ({
  tableId,
  ticketSummary,
  isOpen,
  onClose,
  onStatusUpdated,
}) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState<CustomerTicketDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Pass tableId strictly to customerTicketdetails
      const res = await getCustomerTicketDetails(id);
      if (res.success && res.data) {
        setDetails(res.data);
      } else {
        setError(res.error || 'Failed to load ticket summary.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while loading ticket summary.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && tableId) {
      fetchDetails(tableId);
    } else {
      setDetails(null);
      setError(null);
    }
  }, [isOpen, tableId, fetchDetails]);

  if (!isOpen) return null;

  const currentStatus = details?.status || ticketSummary?.status || 'Open';
  const customerName = details?.firstName || details?.lastName
    ? [details.firstName, details.lastName].filter(Boolean).join(' ')
    : (ticketSummary?.customerName?.trim() || '—');
  const email = details?.email || ticketSummary?.email || '—';
  const phone = details?.phone || ticketSummary?.phone || ticketSummary?.customerPhone || '—';
  const subject = details?.subject || ticketSummary?.subject || 'Support Ticket';
  const category = details?.category || ticketSummary?.category || 'Nest Booking';
  const priority = details?.priority || 'Normal';
  const ticketId = details?.ticketId;

  const handleOpenFullDetails = () => {
    if (tableId) {
      navigate(`/quality/complaints/${tableId}`, {
        state: { ticket: ticketSummary, details },
      });
      onClose();
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Ticket Summary"
      subtitle={ticketId ? `Ticket #${ticketId}` : `Category: ${category}`}
      width="md"
      actions={
        <button
          type="button"
          onClick={handleOpenFullDetails}
          className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#F5F3FF] transition-colors shadow-soft-sm active:scale-95 cursor-pointer"
          title="Open Full Ticket Details Page"
        >
          <span>Ticket Details</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Loading skeleton */}
        {isLoading && !details && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 space-y-3 shadow-soft-sm">
              <div className="h-5 w-3/4 bg-[#EDE9FE] animate-pulse rounded-lg" />
              <div className="h-4 w-1/2 bg-[#FAF9FC] animate-pulse rounded-md" />
            </div>
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 space-y-2.5 shadow-soft-sm">
              <div className="h-4 w-1/3 bg-[#EDE9FE] animate-pulse rounded-md" />
              <div className="h-8 w-full bg-[#FAF9FC] animate-pulse rounded-xl" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="rounded-2xl border border-rose-200 bg-[#FEF2F2] p-5 text-center space-y-2.5 shadow-soft-sm">
            <AlertCircle className="h-6 w-6 text-[#B42318] mx-auto" />
            <h4 className="text-xs font-bold text-[#B42318]">{error}</h4>
            {tableId && (
              <button
                type="button"
                onClick={() => fetchDetails(tableId)}
                className="inline-flex items-center gap-1 rounded-xl bg-[#B42318] text-white px-3 py-1.5 text-xs font-semibold shadow-soft-sm"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Summary Content */}
        {(!isLoading || details) && !error && (
          <>
            {/* Header Ticket Card */}
            <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-5 shadow-soft-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">
                      {category}
                    </span>
                    {ticketId && (
                      <span className="font-mono text-xs font-bold text-[#1F1F1F]">
                        #{ticketId}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-[#1F1F1F] leading-snug break-words">
                    {subject}
                  </h3>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={currentStatus} size="sm" />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-[#6B6B6B] pt-2 border-t border-[#EEEEF2]">
                <span>Priority:</span>
                <span className="font-bold text-[#1F1F1F]">{priority}</span>
              </div>
            </div>

            {/* Customer Information (Clean Summary) */}
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 sm:p-5 shadow-soft-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-[#5B21B6]" />
                <h4 className="font-bold text-[#6B6B6B] uppercase font-mono text-[10px] tracking-wider">
                  Customer Details
                </h4>
              </div>

              <div className="space-y-2 pt-1 border-t border-[#F3F2F7] text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B6B6B]">Name</span>
                  <span className="font-bold text-[#1F1F1F] truncate max-w-[200px]">
                    {customerName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B6B6B]">Email</span>
                  <span className="font-mono text-[#1F1F1F] truncate max-w-[200px]">
                    {email}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B6B6B]">Phone</span>
                  <span className="font-mono text-[#1F1F1F]">
                    {phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Ticket Overview (Clean Summary) */}
            <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 sm:p-5 shadow-soft-sm space-y-2.5">
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-[#5B21B6]" />
                <h4 className="font-bold text-[#6B6B6B] uppercase font-mono text-[10px] tracking-wider">
                  Ticket Summary
                </h4>
              </div>

              <div className="space-y-2 pt-1 border-t border-[#F3F2F7] text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B6B6B]">Category</span>
                  <span className="font-semibold text-[#1F1F1F]">{category}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B6B6B]">Status</span>
                  <StatusBadge status={currentStatus} size="sm" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#6B6B6B]">Priority</span>
                  <span className="font-semibold text-[#1F1F1F]">{priority}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
};
export default CustomerTicketDetailDrawer;
