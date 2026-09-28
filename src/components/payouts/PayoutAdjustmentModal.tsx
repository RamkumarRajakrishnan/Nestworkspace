import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { WorkerPayout, LedgerItem } from '../../types';
import { useOperations } from '../../context/OperationsContext';

interface PayoutAdjustmentModalProps {
  payout: WorkerPayout | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayoutAdjustmentModal: React.FC<PayoutAdjustmentModalProps> = ({
  payout,
  isOpen,
  onClose,
}) => {
  const { addPayoutAdjustment } = useOperations();
  const [type, setType] = useState<LedgerItem['type']>('Adjustment Credit');
  const [amount, setAmount] = useState<string>('150');
  const [reason, setReason] = useState<string>('Peak Demand Exceptional Incentive');
  const [reference, setReference] = useState<string>('OPS-MANUAL-01');
  const [error, setError] = useState<string>('');

  if (!payout) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0) {
      setError('Please specify a positive adjustment amount.');
      return;
    }
    if (!reason.trim()) {
      setError('A justification reason is required.');
      return;
    }

    const finalAmount = type.includes('Debit') || type.includes('Deduction') ? -num : num;

    await addPayoutAdjustment(payout.id, {
      type,
      amount: finalAmount,
      reason,
      reference: reference || 'OPS-ADJ',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Payout Adjustment"
      subtitle={`Expert: ${payout.workerName} (${payout.workerId})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Adjustment Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1F1F1F]">Adjustment Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('Adjustment Credit')}
              className={`rounded-xl p-2.5 text-xs font-bold border text-center transition-all ${
                type === 'Adjustment Credit'
                  ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#5B21B6] shadow-soft-sm'
                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B]'
              }`}
            >
              + Credit / Incentive
            </button>
            <button
              type="button"
              onClick={() => setType('Adjustment Debit')}
              className={`rounded-xl p-2.5 text-xs font-bold border text-center transition-all ${
                type === 'Adjustment Debit'
                  ? 'border-[#FECDCA] bg-[#FEF2F2] text-[#B42318] shadow-soft-sm'
                  : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B]'
              }`}
            >
              - Debit / Deduction
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1F1F1F]">Amount (₹)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#6B6B6B]">₹</span>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] py-2 pl-8 pr-3 text-xs text-[#1F1F1F] font-bold font-mono focus:outline-none focus:border-[#7C3AED] focus:bg-white"
            />
          </div>
        </div>

        {/* Reason / Justification */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1F1F1F]">
            Justification Reason <span className="text-[#B42318]">*</span>
          </label>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="e.g. Overtime retention bonus, damaged uniform kit deduction, customer tipping bonus..."
            className="w-full rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] p-2.5 text-xs text-[#1F1F1F] placeholder-[#9CA3AF] focus:outline-none focus:border-[#7C3AED] focus:bg-white"
          />
        </div>

        {/* Reference */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#1F1F1F]">Reference / Ticket ID</label>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] py-2 px-3 text-xs text-[#1F1F1F] font-mono focus:outline-none focus:border-[#7C3AED] focus:bg-white"
          />
        </div>

        {error && <p className="text-xs text-[#B42318] font-semibold">{error}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#EEEEF2]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#EEEEF2] px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#5B21B6] px-4 py-2 text-xs font-bold text-white hover:bg-[#4C1D95] shadow-soft-sm active:scale-95"
          >
            Apply Adjustment
          </button>
        </div>
      </form>
    </Modal>
  );
};
