import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { WorkerPayout } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useOperations } from '../../context/OperationsContext';
import { 
  PlusCircle, 
  CheckCircle2, 
  Receipt
} from 'lucide-react';
import { PayoutAdjustmentModal } from './PayoutAdjustmentModal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface PayoutLedgerDrawerProps {
  payout: WorkerPayout | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PayoutLedgerDrawer: React.FC<PayoutLedgerDrawerProps> = ({
  payout,
  isOpen,
  onClose,
}) => {
  const { approvePayout } = useOperations();
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  if (!payout) return null;

  const handleConfirmApproval = async () => {
    await approvePayout(payout.id);
    setShowApproveConfirm(false);
  };

  const isApproved = payout.status === 'Approved' || payout.status === 'Paid';

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={`Earnings Ledger — ${payout.workerName}`}
        subtitle={`${payout.workerId} • Date: ${payout.date}`}
        width="lg"
        actions={
          <StatusBadge status={payout.status} size="md" />
        }
      >
        <div className="space-y-5">
          {/* Top Financial Breakdown Cards */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4.5 space-y-3.5 shadow-soft-sm">
            <div className="flex items-center justify-between text-xs text-[#6B6B6B]">
              <span>Completed Jobs: <strong className="text-[#1F1F1F]">{payout.jobsCompleted}</strong></span>
              <span className="font-mono text-[#5B21B6] font-semibold">Settlement: Daily T+0</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5 border-t border-[#EEEEF2] pt-3 text-center">
              <div className="rounded-xl bg-white p-2.5 border border-[#EEEEF2] shadow-soft-sm">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium">Gross Earnings</span>
                <div className="text-base font-bold font-mono text-[#1F1F1F] mt-0.5">₹{payout.gross}</div>
              </div>
              <div className="rounded-xl bg-white p-2.5 border border-[#EEEEF2] shadow-soft-sm">
                <span className="text-[10px] text-[#6B6B6B] uppercase font-mono font-medium">Deductions</span>
                <div className="text-base font-bold font-mono text-[#B42318] mt-0.5">
                  -₹{payout.deductions}
                </div>
              </div>
              <div className="rounded-xl bg-[#EDE9FE] border border-[#DDD6FE] p-2.5 shadow-soft-sm">
                <span className="text-[10px] text-[#5B21B6] uppercase font-mono font-bold">Net Payable</span>
                <div className="text-base font-bold font-mono text-[#5B21B6] mt-0.5">
                  ₹{payout.netPayable}
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setShowAdjustmentModal(true)}
              className="flex-1 rounded-xl border border-[#EEEEF2] bg-white px-4 py-2.5 text-xs font-bold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors flex items-center justify-center gap-1.5 shadow-soft-sm"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[#5B21B6]" />
              Add Ledger Adjustment
            </button>

            {!isApproved ? (
              <button
                onClick={() => setShowApproveConfirm(true)}
                className="flex-1 rounded-xl bg-[#5B21B6] px-4 py-2.5 text-xs font-bold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-colors flex items-center justify-center gap-1.5 active:scale-95"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve Daily Payout
              </button>
            ) : (
              <div className="flex-1 rounded-xl bg-[#ECFDF3] border border-[#A6F4C5] px-4 py-2 text-xs font-bold text-[#027A48] text-center shadow-soft-sm">
                ✓ Payout Approved ({payout.reviewedBy})
              </div>
            )}
          </div>

          {/* Itemized Ledger Table */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4.5 space-y-3 shadow-soft-sm">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-[#1F1F1F] uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-[#5B21B6]" />
                Itemized Line-Item Ledger
              </h4>
              <span className="text-[11px] text-[#6B6B6B] font-mono">
                {payout.ledger.length} entries
              </span>
            </div>

            <div className="divide-y divide-[#F3F2F7] text-xs">
              {payout.ledger.map((item) => {
                const isPositive = item.amount >= 0;
                return (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#1F1F1F]">{item.reason}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[#6B6B6B] font-mono">
                        <span className="rounded-full bg-[#F5F3FF] border border-[#DDD6FE] px-2 py-0.5 text-[#5B21B6] font-semibold">
                          {item.type}
                        </span>
                        <span>Ref: {item.reference}</span>
                        <span>{item.date}</span>
                      </div>
                    </div>

                    <div
                      className={`font-mono font-bold text-sm shrink-0 ${
                        isPositive ? 'text-[#027A48]' : 'text-[#B42318]'
                      }`}
                    >
                      {isPositive ? `+₹${item.amount}` : `-₹${Math.abs(item.amount)}`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Drawer>

      {/* Adjust Modal */}
      <PayoutAdjustmentModal
        payout={payout}
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
      />

      {/* Approval Confirmation */}
      <ConfirmDialog
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleConfirmApproval}
        title="Approve Daily Expert Payout"
        message={`Authorize payment disbursement of ₹${payout.netPayable} to ${payout.workerName} (${payout.workerId}) for ${payout.date}?`}
        variant="info"
        confirmText="Approve Payout"
      />
    </>
  );
};
