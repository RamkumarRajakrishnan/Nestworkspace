import { WorkerPayout, PayoutStatus, LedgerItem } from '../types';
import { mockPayouts } from '../data/mockPayouts';

export const payoutService = {
  async getPayouts(): Promise<WorkerPayout[]> {
    return Promise.resolve([...mockPayouts]);
  },

  async updatePayoutStatus(id: string, status: PayoutStatus): Promise<boolean> {
    const payout = mockPayouts.find(p => p.id === id);
    if (payout) {
      payout.status = status;
      if (status === 'Approved') {
        payout.approvedAt = new Date().toISOString();
        payout.reviewedBy = 'Operations Manager (Admin)';
      }
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async addLedgerAdjustment(
    payoutId: string, 
    adjustment: Omit<LedgerItem, 'id' | 'date'>
  ): Promise<boolean> {
    const payout = mockPayouts.find(p => p.id === payoutId);
    if (payout) {
      const newItem: LedgerItem = {
        id: `ADJ-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...adjustment,
      };
      payout.ledger.push(newItem);
      if (adjustment.amount > 0) {
        payout.bonuses += adjustment.amount;
      } else {
        payout.deductions += Math.abs(adjustment.amount);
      }
      payout.gross = payout.baseEarnings + payout.bonuses;
      payout.netPayable = payout.gross - payout.deductions;
      payout.status = 'Adjusted';
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
};
