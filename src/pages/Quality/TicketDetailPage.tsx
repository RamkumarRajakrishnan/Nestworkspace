import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CustomerTicketDetails, CustomerTicketItem, CustomerTicketConversationItem } from '../../types';
import { getCustomerTicketDetails } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EditTicketDrawer } from '../../components/quality/EditTicketDrawer';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Tag,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  RefreshCw,
  ExternalLink,
  Pencil,
  Clock,
  FileCheck,
  MessageSquare,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Passed state from summary drawer if available
  const routeState = location.state as { ticket?: CustomerTicketItem; details?: CustomerTicketDetails } | undefined;
  const initialDetails = routeState?.details || null;
  const routeTicket = routeState?.ticket || null;

  const [details, setDetails] = useState<CustomerTicketDetails | null>(initialDetails);
  const [isLoading, setIsLoading] = useState<boolean>(!initialDetails);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Edit drawer state
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);

  const fetchFullDetails = useCallback(async (tableId: string, silent = false) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Strictly pass tableId to customerTicketdetails
      const res = await getCustomerTicketDetails(tableId);
      if (res.success && res.data) {
        setDetails(res.data);
      } else {
        setError(res.error || 'Unable to load ticket details.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error while loading ticket details.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchFullDetails(id, Boolean(initialDetails));
    }
  }, [id, fetchFullDetails]);

  // When status is updated from Edit drawer
  const handleStatusUpdated = (tableId: string, newStatus: string) => {
    setDetails((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  // Convert details or route summary to CustomerTicketItem for EditTicketDrawer
  const editTicketItem: CustomerTicketItem | null = id
    ? {
        tableId: id,
        email: details?.email || routeTicket?.email || '',
        phone: details?.phone || routeTicket?.phone || '',
        customerName: [details?.firstName, details?.lastName].filter(Boolean).join(' ') || routeTicket?.customerName || '',
        subject: details?.subject || routeTicket?.subject || '',
        status: details?.status || routeTicket?.status || 'Open',
        category: details?.category || routeTicket?.category || 'Nest Booking',
        ticketId: details?.ticketId,
      }
    : null;

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#5B21B6]" />
        <h2 className="text-sm font-semibold text-[#1F1F1F]">Loading Customer Ticket Details...</h2>
        <p className="text-xs text-[#6B6B6B]">Retrieving incident records from support engine</p>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="py-16 text-center space-y-3 max-w-md mx-auto">
        <AlertCircle className="h-10 w-10 text-[#B42318] mx-auto" />
        <h2 className="text-base font-bold text-[#1F1F1F]">Failed to Load Ticket Details</h2>
        <p className="text-xs text-[#6B6B6B]">{error}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate('/quality/complaints')}
            className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-all shadow-soft-sm cursor-pointer"
          >
            Back to Complaints
          </button>
          {id && (
            <button
              onClick={() => fetchFullDetails(id)}
              className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4C1D95] transition-all shadow-soft-sm cursor-pointer"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // Derive all ticket details
  const firstName = details?.firstName?.trim() || '—';
  const lastName = details?.lastName?.trim() || '—';
  const fullName = [details?.firstName, details?.lastName].filter(Boolean).join(' ').trim() || routeTicket?.customerName?.trim() || '—';
  const email = details?.email || routeTicket?.email || '—';
  const phone = details?.phone || routeTicket?.phone || routeTicket?.customerPhone || '—';

  const ticketId = details?.ticketId || '—';
  const subject = details?.subject || routeTicket?.subject || 'Support Ticket';
  const category = details?.category || routeTicket?.category || 'Nest Booking';
  const priority = details?.priority || 'Normal';
  const status = details?.status || routeTicket?.status || 'Open';
  const orderId = details?.orderId || '—';

  const resolution = details?.resolution?.trim() || '—';
  const remarks = details?.remarks?.trim() || '—';
  const assignedTo = details?.assignedTo?.trim() || '—';
  const closedDateDisplay = details?.closedDate
    ? new Date(details.closedDate).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

  // Parse conversations from description
  let conversations: CustomerTicketConversationItem[] = [];
  let rawDescriptionText: string | null = null;

  if (details?.description) {
    if (typeof details.description === 'object' && Array.isArray(details.description.conversation)) {
      conversations = details.description.conversation;
    } else if (typeof details.description === 'string') {
      try {
        const parsed = JSON.parse(details.description);
        if (parsed && Array.isArray(parsed.conversation)) {
          conversations = parsed.conversation;
        } else {
          rawDescriptionText = details.description;
        }
      } catch {
        rawDescriptionText = details.description;
      }
    }
  }

  const attachments = Array.isArray(details?.attachments) ? details.attachments : [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => navigate('/quality/complaints')}
            className="shrink-0 rounded-xl border border-[#EEEEF2] bg-white p-2.5 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors cursor-pointer"
            title="Back to Customer Tickets"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] truncate">
                Customer Ticket Details
              </h1>
              {ticketId !== '—' && (
                <span className="font-mono text-xs font-bold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">
                  #{ticketId}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-0.5 truncate">
              {subject}
            </p>
          </div>
        </div>

        {/* Action Buttons: Refresh + Edit Status */}
        <div className="flex items-center gap-2 shrink-0">
          {id && (
            <button
              type="button"
              onClick={() => fetchFullDetails(id, true)}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-white px-3.5 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-all shadow-soft-sm cursor-pointer disabled:opacity-50"
              title="Refresh ticket data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#5B21B6]' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-2 text-xs font-bold shadow-soft-sm transition-all active:scale-95 cursor-pointer"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit Status</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column (2 Cols on lg): Ticket Info & Conversation */}
        <div className="lg:col-span-2 space-y-5">
          {/* Ticket Information Card */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 sm:p-6 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEF2]">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#5B21B6]" />
                <h3 className="text-sm font-bold text-[#1F1F1F] uppercase font-mono tracking-wider">
                  Ticket Information
                </h3>
              </div>
              <StatusBadge status={status} size="md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Ticket ID</span>
                <span className="font-mono text-sm font-bold text-[#5B21B6] block">
                  {ticketId}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Order / Booking ID</span>
                <span className="font-mono text-sm font-bold text-[#1F1F1F] block">
                  {orderId}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Category</span>
                <span className="font-semibold text-xs text-[#1F1F1F] bg-[#FAF9FC] border border-[#EEEEF2] px-2.5 py-1 rounded-lg inline-block">
                  {category}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Priority</span>
                <span className="font-semibold text-xs text-[#1F1F1F] inline-block">
                  {priority}
                </span>
              </div>

              <div className="sm:col-span-2 space-y-1 pt-1 border-t border-[#F3F2F7]">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Subject</span>
                <p className="text-sm font-semibold text-[#1F1F1F] leading-snug break-words">
                  {subject}
                </p>
              </div>
            </div>
          </div>

          {/* Conversation History Card */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 sm:p-6 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEF2]">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#5B21B6]" />
                <h3 className="text-sm font-bold text-[#1F1F1F] uppercase font-mono tracking-wider">
                  Conversation Log
                </h3>
              </div>
              {conversations.length > 0 && (
                <span className="text-[11px] font-mono font-semibold text-[#5B21B6] bg-[#EDE9FE] px-2.5 py-0.5 rounded-full">
                  {conversations.length} {conversations.length === 1 ? 'Message' : 'Messages'}
                </span>
              )}
            </div>

            <div className="space-y-3">
              {conversations.length > 0 ? (
                conversations.map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 space-y-3 shadow-soft-xs"
                  >
                    {/* Question */}
                    {c.question && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#6B6B6B] uppercase font-mono tracking-wider">
                          <HelpCircle className="h-3 w-3 text-[#5B21B6]" />
                          <span>Question</span>
                        </div>
                        <p className="text-xs text-[#1F1F1F] bg-white rounded-lg p-3 border border-[#EEEEF2] leading-relaxed">
                          {c.question}
                        </p>
                      </div>
                    )}

                    {/* Answer */}
                    {c.answer && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#5B21B6] uppercase font-mono tracking-wider">
                          <MessageCircle className="h-3 w-3 text-[#10B981]" />
                          <span>Customer Response</span>
                        </div>
                        <p className="text-xs font-semibold text-[#1F1F1F] bg-[#EDE9FE]/50 rounded-lg p-3 border border-[#DDD6FE] leading-relaxed">
                          {c.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : rawDescriptionText ? (
                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 text-xs text-[#1F1F1F] leading-relaxed">
                  {rawDescriptionText}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#6B6B6B] rounded-xl bg-[#FAF9FC] border border-dashed border-[#EEEEF2]">
                  <MessageSquare className="h-6 w-6 text-[#6B6B6B] mx-auto mb-1 opacity-40" />
                  <p>No conversation history recorded for this ticket.</p>
                </div>
              )}
            </div>
          </div>

          {/* Resolution & Remarks Card */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 sm:p-6 shadow-soft-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#EEEEF2]">
              <FileCheck className="h-4 w-4 text-[#5B21B6]" />
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase font-mono tracking-wider">
                Resolution & Remarks
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Assigned To</span>
                <span className="font-semibold text-xs text-[#1F1F1F] block">
                  {assignedTo}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Closed Date</span>
                <span className="font-mono text-xs text-[#1F1F1F] block">
                  {closedDateDisplay}
                </span>
              </div>

              <div className="sm:col-span-2 space-y-1.5 pt-1 border-t border-[#F3F2F7]">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Resolution</span>
                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 text-xs text-[#1F1F1F] leading-relaxed break-words">
                  {resolution}
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <span className="text-[11px] font-semibold text-[#6B6B6B] block">Remarks</span>
                <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 text-xs text-[#1F1F1F] leading-relaxed break-words">
                  {remarks}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col on lg): Customer Info & Attachments */}
        <div className="space-y-5">
          {/* Customer Information Card */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 sm:p-6 shadow-soft-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#EEEEF2]">
              <User className="h-4 w-4 text-[#5B21B6]" />
              <h3 className="text-sm font-bold text-[#1F1F1F] uppercase font-mono tracking-wider">
                Customer Information
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Full Name</span>
                <span className="font-bold text-sm text-[#1F1F1F] block break-words">
                  {fullName}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F3F2F7]">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">First Name</span>
                  <span className="font-semibold text-xs text-[#1F1F1F] block break-words">
                    {firstName}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Last Name</span>
                  <span className="font-semibold text-xs text-[#1F1F1F] block break-words">
                    {lastName}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#F3F2F7]">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Email Address</span>
                <span className="font-mono text-xs text-[#1F1F1F] flex items-center gap-1.5 break-all">
                  <Mail className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" />
                  <span>{email}</span>
                </span>
              </div>

              <div className="space-y-0.5 pt-1 border-t border-[#F3F2F7]">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono">Phone Number</span>
                <span className="font-mono text-xs text-[#1F1F1F] flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#6B6B6B] shrink-0" />
                  <span>{phone}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Attachments Card */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 sm:p-6 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEEEF2]">
              <div className="flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-[#5B21B6]" />
                <h3 className="text-sm font-bold text-[#1F1F1F] uppercase font-mono tracking-wider">
                  Attachments
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[#5B21B6]">
                {attachments.length} {attachments.length === 1 ? 'File' : 'Files'}
              </span>
            </div>

            <div>
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((att: any, idx: number) => {
                    const fileUrl = typeof att === 'string' ? att : att?.url || att?.fileUrl || '';
                    const fileName = att?.name || `Attachment ${idx + 1}`;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
                          <span className="truncate font-medium text-[#1F1F1F]">{fileName}</span>
                        </div>
                        {fileUrl && (
                          <a
                            href={fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#5B21B6] hover:underline font-semibold text-xs shrink-0"
                          >
                            <span>Open</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center rounded-xl bg-[#FAF9FC] border border-dashed border-[#EEEEF2]">
                  <Paperclip className="h-6 w-6 text-[#6B6B6B] mx-auto mb-1 opacity-40" />
                  <p className="text-xs text-[#6B6B6B]">No attachments uploaded for this ticket.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Drawer Integration */}
      <EditTicketDrawer
        ticket={editTicketItem}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onStatusUpdated={handleStatusUpdated}
      />
    </div>
  );
};
export default TicketDetailPage;
