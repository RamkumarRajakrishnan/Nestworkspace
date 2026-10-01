import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { WorkerDocument } from '../../types';
import { useOperations } from '../../context/OperationsContext';
import { StatusBadge } from '../common/StatusBadge';
import { FileText, Check, X } from 'lucide-react';

interface DocumentReviewModalProps {
  document: WorkerDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  document,
  isOpen,
  onClose,
}) => {
  const { approveComplianceDoc, rejectComplianceDoc } = useOperations();
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState('');

  if (!document) return null;

  const handleApprove = async () => {
    await approveComplianceDoc(document.id);
    onClose();
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a mandatory reason for document rejection.');
      return;
    }
    await rejectComplianceDoc(document.id, rejectReason);
    setIsRejecting(false);
    setRejectReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compliance Document Verification"
      subtitle={`${document.type} • Expert: ${document.workerName}`}
      maxWidth="md"
      footer={
        isRejecting ? (
          <>
            <button
              onClick={() => setIsRejecting(false)}
              className="rounded-xl border border-[#EEEEF2] px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC]"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="rounded-xl bg-[#B42318] px-4 py-2 text-xs font-bold text-white hover:bg-[#991B1B] shadow-soft-sm"
            >
              Confirm Rejection
            </button>
          </>
        ) : (
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => setIsRejecting(true)}
              className="rounded-xl border border-[#FECDCA] bg-[#FEF2F2] px-3.5 py-2 text-xs font-bold text-[#B42318] hover:bg-[#FEE2E2] flex items-center gap-1.5 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Reject Document
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleApprove}
                className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4C1D95] flex items-center gap-1.5 shadow-soft-sm active:scale-95 transition-all"
              >
                <Check className="h-3.5 w-3.5" /> Approve & Verify
              </button>
            </div>
          </div>
        )
      }
    >
      <div className="space-y-4">
        {/* Document Metadata Card */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4.5 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-[#6B6B6B]">Expert Name & ID</div>
              <div className="text-sm font-bold text-[#1F1F1F] mt-0.5">{document.workerName}</div>
              <div className="text-xs font-mono text-[#5B21B6] font-semibold">{document.workerId}</div>
            </div>
            <StatusBadge status={document.status} size="md" />
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-t border-[#EEEEF2] pt-3 text-xs">
            <div>
              <span className="text-[#6B6B6B] font-mono text-[10px]">DOCUMENT TYPE</span>
              <div className="font-bold text-[#1F1F1F] mt-0.5">{document.type}</div>
            </div>
            <div>
              <span className="text-[#6B6B6B] font-mono text-[10px]">POLICY / REGISTRATION ID</span>
              <div className="font-mono text-[#5B21B6] font-bold mt-0.5">{document.documentNumber}</div>
            </div>
            <div className="pt-1">
              <span className="text-[#6B6B6B] font-mono text-[10px]">SUBMISSION DATE</span>
              <div className="text-[#1F1F1F] mt-0.5">{document.uploadedDate}</div>
            </div>
            <div className="pt-1">
              <span className="text-[#6B6B6B] font-mono text-[10px]">EXPIRATION DATE</span>
              <div className="text-[#C2410C] font-mono font-bold mt-0.5">{document.expiryDate}</div>
            </div>
          </div>
        </div>

        {/* Simulated Document Preview Area */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-6 text-center space-y-2 shadow-soft-sm">
          <FileText className="mx-auto h-10 w-10 text-[#5B21B6]" />
          <div className="text-xs font-bold text-[#1F1F1F]">
            {document.type} — {document.documentNumber}.pdf
          </div>
          <p className="text-[11px] text-[#6B6B6B] max-w-xs mx-auto">
            High-resolution encrypted KYC proof file stored in secure partner vault.
          </p>
        </div>

        {/* Rejection reason box if rejecting */}
        {isRejecting && (
          <div className="space-y-2 rounded-2xl border border-[#FECDCA] bg-[#FEF2F2] p-4">
            <label className="text-xs font-bold text-[#B42318]">
              Mandatory Rejection Justification <span className="text-[#B42318]">*</span>
            </label>
            <textarea
              rows={2}
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setError('');
              }}
              placeholder="e.g. Expired date stamped, blurry proof, name mismatch..."
              className="w-full rounded-xl border border-[#FECDCA] bg-white p-2.5 text-xs text-[#1F1F1F] placeholder-[#9CA3AF] focus:outline-none"
            />
            {error && <p className="text-[11px] text-[#B42318] font-semibold">{error}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
};
