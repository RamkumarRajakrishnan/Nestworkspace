import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Worker, 
  Booking, 
  Market, 
  Assignment, 
  WorkerDocument, 
  WorkerPayout, 
  OperationalNotification, 
  AuditLogEvent,
  WorkerStatus,
  DocStatus,
  LedgerItem
} from '../types';
import { workerService } from '../services/workerService';
import { bookingService } from '../services/bookingService';
import { assignmentService } from '../services/assignmentService';
import { marketService } from '../services/marketService';
import { complianceService } from '../services/complianceService';
import { payoutService } from '../services/payoutService';
import { mockNotifications } from '../data/mockNotifications';
import { mockAuditLogs } from '../data/mockAuditLogs';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface OperationsContextType {
  workers: Worker[];
  bookings: Booking[];
  markets: Market[];
  assignments: Assignment[];
  documents: WorkerDocument[];
  payouts: WorkerPayout[];
  notifications: OperationalNotification[];
  auditLogs: AuditLogEvent[];
  selectedMarketId: string;
  setSelectedMarketId: (marketId: string) => void;
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;

  // Actions
  addWorker: (newWorker: Worker) => void;
  assignWorker: (bookingId: string, workerId: string) => Promise<boolean>;
  reassignWorker: (
    currentAssignmentId: string,
    targetBookingId: string, 
    workerId: string, 
    replacementWorkerId: string | null, 
    reason: string
  ) => Promise<boolean>;
  updateWorkerStatus: (workerId: string, status: WorkerStatus) => Promise<boolean>;
  expandMarketRadius: (marketId: string, radius: number) => Promise<boolean>;
  toggleMarketSurge: (marketId: string) => Promise<boolean>;
  toggleMarketPause: (marketId: string) => Promise<boolean>;
  approveComplianceDoc: (docId: string) => Promise<boolean>;
  rejectComplianceDoc: (docId: string, reason: string) => Promise<boolean>;
  approvePayout: (payoutId: string) => Promise<boolean>;
  addPayoutAdjustment: (payoutId: string, item: Omit<LedgerItem, 'id' | 'date'>) => Promise<boolean>;
  markNotificationRead: (notifId: string) => void;
  refreshMarkets: () => Promise<void>;

  // Scenario Triggers for testing/demonstration
  runScenario1CapacityCrunch: () => void;
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [documents, setDocuments] = useState<WorkerDocument[]>([]);
  const [payouts, setPayouts] = useState<WorkerPayout[]>([]);
  const [notifications, setNotifications] = useState<OperationalNotification[]>(mockNotifications);
  const [auditLogs, setAuditLogs] = useState<AuditLogEvent[]>(mockAuditLogs);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initial load via service layer
  useEffect(() => {
    async function loadData() {
      const [wList, bList, mList, aList, dList, pList] = await Promise.all([
        workerService.getWorkers(),
        bookingService.getBookings(),
        marketService.getMarkets(),
        assignmentService.getAssignments(),
        complianceService.getDocuments(),
        payoutService.getPayouts(),
      ]);
      setWorkers(wList);
      setBookings(bList);
      setMarkets(mList);
      setAssignments(aList);
      setDocuments(dList);
      setPayouts(pList);
    }
    loadData();
  }, []);

  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addWorker = (newWorker: Worker) => {
    setWorkers(prev => [newWorker, ...prev]);
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const refreshMarkets = async () => {
    try {
      const mList = await marketService.getMarkets();
      setMarkets(mList);
    } catch (err) {
      console.error('Failed to refresh markets:', err);
    }
  };

  const assignWorker = async (bookingId: string, workerId: string): Promise<boolean> => {
    const success = await bookingService.assignWorkerToBooking(bookingId, workerId);
    if (!success) return false;

    const worker = workers.find(w => w.id === workerId);
    const booking = bookings.find(b => b.id === bookingId);

    // Update worker status to Assigned
    setWorkers(prev => prev.map(w => {
      if (w.id === workerId) {
        return {
          ...w,
          status: 'Assigned',
          currentJobId: bookingId,
          todayJobs: w.todayJobs + 1,
        };
      }
      return w;
    }));

    // Update booking in state
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        const assignedIds = b.assignedWorkerIds.includes(workerId) 
          ? b.assignedWorkerIds 
          : [...b.assignedWorkerIds, workerId];
        const isComplete = assignedIds.length >= b.requiredWorkers;
        return {
          ...b,
          assignedWorkerIds: assignedIds,
          status: isComplete ? 'Assigned' : b.status,
          timeline: [
            ...b.timeline,
            {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: 'Expert Dispatched',
              description: `${worker ? worker.name : workerId} assigned to job`,
              completed: true,
            }
          ]
        };
      }
      return b;
    }));

    // Add assignment record
    const newAsg: Assignment = {
      id: `ASG-${Date.now()}`,
      bookingId,
      workerId,
      startTime: booking ? booking.startTime : 'Immediate',
      endTime: 'TBD',
      status: 'Scheduled',
      assignedAt: new Date().toISOString(),
      assignedBy: 'Operations Manager',
    };
    setAssignments(prev => [newAsg, ...prev]);

    // Add audit log
    const audit: AuditLogEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      admin: 'Operations Manager',
      actionType: 'ASSIGN',
      targetId: bookingId,
      details: `Assigned expert ${worker?.name || workerId} to Job #${bookingId}`,
    };
    setAuditLogs(prev => [audit, ...prev]);

    // Update Market Capacity
    if (booking) {
      setMarkets(prev => prev.map(m => {
        if (m.id === booking.areaId) {
          const avail = Math.max(0, m.availableWorkers - 1);
          const busy = m.busyWorkers + 1;
          const total = avail + busy;
          const cap = total > 0 ? Math.round((busy / total) * 100) : 100;
          return {
            ...m,
            availableWorkers: avail,
            busyWorkers: busy,
            capacity: cap,
            status: cap >= 90 ? 'Critical' : cap >= 70 ? 'Tight' : 'Normal'
          };
        }
        return m;
      }));
    }

    addToast('Expert Dispatched', `${worker ? worker.name : 'Expert'} has been assigned to #${bookingId}`);
    return true;
  };

  const reassignWorker = async (
    currentAssignmentId: string,
    targetBookingId: string,
    workerId: string,
    replacementWorkerId: string | null,
    reason: string
  ): Promise<boolean> => {
    const worker = workers.find(w => w.id === workerId);
    const replacementWorker = workers.find(w => w.id === replacementWorkerId);
    const targetBooking = bookings.find(b => b.id === targetBookingId);
    const currentAsg = assignments.find(a => a.id === currentAssignmentId);
    const sourceBookingId = currentAsg ? currentAsg.bookingId : null;

    // 1. If replacement worker is provided for the source job, assign replacement
    if (sourceBookingId && replacementWorkerId) {
      setBookings(prev => prev.map(b => {
        if (b.id === sourceBookingId) {
          return {
            ...b,
            assignedWorkerIds: b.assignedWorkerIds.map(id => id === workerId ? replacementWorkerId : id),
            timeline: [
              ...b.timeline,
              {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: 'Replacement Expert Assigned',
                description: `${replacementWorker?.name} replaced ${worker?.name}. Reason: ${reason}`,
                completed: true
              }
            ]
          };
        }
        return b;
      }));

      // Update replacement worker status
      setWorkers(prev => prev.map(w => {
        if (w.id === replacementWorkerId) {
          return { ...w, status: 'Assigned', currentJobId: sourceBookingId };
        }
        return w;
      }));
    } else if (sourceBookingId) {
      // Worker removed from source booking without replacement
      setBookings(prev => prev.map(b => {
        if (b.id === sourceBookingId) {
          const updatedIds = b.assignedWorkerIds.filter(id => id !== workerId);
          return {
            ...b,
            assignedWorkerIds: updatedIds,
            status: updatedIds.length === 0 ? 'Searching' : 'Assigned',
            timeline: [
              ...b.timeline,
              {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: 'Expert Reassigned Elsewhere',
                description: `${worker?.name} reassigned to #${targetBookingId}. Reason: ${reason}`,
                completed: true
              }
            ]
          };
        }
        return b;
      }));
    }

    // 2. Assign worker to target booking
    setBookings(prev => prev.map(b => {
      if (b.id === targetBookingId) {
        const assignedIds = b.assignedWorkerIds.includes(workerId) 
          ? b.assignedWorkerIds 
          : [...b.assignedWorkerIds, workerId];
        return {
          ...b,
          assignedWorkerIds: assignedIds,
          status: assignedIds.length >= b.requiredWorkers ? 'Assigned' : b.status,
          timeline: [
            ...b.timeline,
            {
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              title: 'Expert Reassigned In',
              description: `${worker?.name} reassigned from previous job. Reason: ${reason}`,
              completed: true
            }
          ]
        };
      }
      return b;
    }));

    // 3. Update worker currentJobId
    setWorkers(prev => prev.map(w => {
      if (w.id === workerId) {
        return { ...w, currentJobId: targetBookingId, status: 'Assigned' };
      }
      return w;
    }));

    // 4. Update assignment records
    setAssignments(prev => {
      const updated = prev.map(a => {
        if (a.id === currentAssignmentId) {
          return {
            ...a,
            status: 'Reassigned' as const,
            reassignmentReason: reason,
          };
        }
        return a;
      });
      // Add new assignment for target booking
      const newAsg: Assignment = {
        id: `ASG-${Date.now()}`,
        bookingId: targetBookingId,
        workerId,
        startTime: targetBooking?.startTime || 'Immediate',
        endTime: 'TBD',
        status: 'Scheduled',
        assignedAt: new Date().toISOString(),
        assignedBy: 'Operations Manager (Reassigned)',
        reassignmentReason: reason,
        previousWorkerId: sourceBookingId || undefined,
      };
      return [newAsg, ...updated];
    });

    // 5. Add Audit Log
    const audit: AuditLogEvent = {
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      admin: 'Operations Manager',
      actionType: 'REASSIGN',
      targetId: targetBookingId,
      details: `Reassigned ${worker?.name || workerId} from #${sourceBookingId || 'prev'} to #${targetBookingId}`,
      reason,
    };
    setAuditLogs(prev => [audit, ...prev]);

    addToast('Reassignment Completed', `${worker?.name} reassigned to Job #${targetBookingId} (${reason})`);
    return true;
  };

  const updateWorkerStatus = async (workerId: string, status: WorkerStatus): Promise<boolean> => {
    const success = await workerService.updateWorkerStatus(workerId, status);
    if (success) {
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, status } : w));
      addToast('Status Updated', `Expert status updated to ${status}`);
    }
    return success;
  };

  const expandMarketRadius = async (marketId: string, radius: number): Promise<boolean> => {
    const success = await marketService.updateMarketRadius(marketId, radius);
    if (success) {
      setMarkets(prev => prev.map(m => m.id === marketId ? { ...m, radius } : m));
      // Update bookings in that market to stage 2 or 3
      setBookings(prev => prev.map(b => {
        if (b.areaId === marketId && (b.status === 'Searching' || b.status === 'Queued')) {
          return {
            ...b,
            searchRadius: radius,
            searchStage: radius >= 1000 ? 3 : 2,
            timeline: [
              ...b.timeline,
              {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                title: 'Search Radius Expanded',
                description: `Ops expanded search boundary to ${radius}m`,
                completed: true
              }
            ]
          };
        }
        return b;
      }));
      addToast('Radius Expanded', `Dispatch search radius in ${marketId} expanded to ${radius}m`);
    }
    return success;
  };

  const toggleMarketSurge = async (marketId: string): Promise<boolean> => {
    const success = await marketService.toggleSurgeIncentive(marketId);
    if (success) {
      setMarkets(prev => prev.map(m => {
        if (m.id === marketId) {
          const active = !m.surgeIncentiveActive;
          return {
            ...m,
            surgeIncentiveActive: active,
            surgeMultiplier: active ? 1.35 : 1.0,
          };
        }
        return m;
      }));
      addToast('Surge Incentive Toggled', `Expert incentive in ${marketId} adjusted.`);
    }
    return success;
  };

  const toggleMarketPause = async (marketId: string): Promise<boolean> => {
    const success = await marketService.togglePauseMarket(marketId);
    if (success) {
      setMarkets(prev => prev.map(m => m.id === marketId ? { ...m, paused: !m.paused } : m));
      addToast('Market Status Changed', `Market ${marketId} operation state updated`);
    }
    return success;
  };

  const approveComplianceDoc = async (docId: string): Promise<boolean> => {
    const success = await complianceService.updateDocumentStatus(docId, 'Verified');
    if (success) {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'Verified' } : d));
      addToast('Document Approved', 'Expert document verified successfully');
    }
    return success;
  };

  const rejectComplianceDoc = async (docId: string, reason: string): Promise<boolean> => {
    const success = await complianceService.updateDocumentStatus(docId, 'Rejected', reason);
    if (success) {
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, status: 'Rejected', rejectionReason: reason } : d));
      addToast('Document Rejected', `Document marked rejected. Reason: ${reason}`, 'warning');
    }
    return success;
  };

  const approvePayout = async (payoutId: string): Promise<boolean> => {
    const success = await payoutService.updatePayoutStatus(payoutId, 'Approved');
    if (success) {
      setPayouts(prev => prev.map(p => p.id === payoutId ? { 
        ...p, 
        status: 'Approved', 
        approvedAt: new Date().toISOString(),
        reviewedBy: 'Operations Manager' 
      } : p));
      addToast('Payout Approved', 'Expert payout approved for bank disbursement');
    }
    return success;
  };

  const addPayoutAdjustment = async (payoutId: string, item: Omit<LedgerItem, 'id' | 'date'>): Promise<boolean> => {
    const success = await payoutService.addLedgerAdjustment(payoutId, item);
    if (success) {
      // Reload updated payouts
      const updated = await payoutService.getPayouts();
      setPayouts([...updated]);
      addToast('Ledger Adjusted', `Adjustment of ₹${item.amount} recorded.`);
    }
    return success;
  };

  const runScenario1CapacityCrunch = () => {
    // Reset KOR-03 to 100% capacity with 0 available workers and ensure BK-8821 is unassigned
    setBookings(prev => prev.map(b => {
      if (b.id === 'BK-8821') {
        return {
          ...b,
          assignedWorkerIds: [],
          status: 'Searching',
          searchRadius: 300,
          searchStage: 1,
        };
      }
      return b;
    }));
    setMarkets(prev => prev.map(m => {
      if (m.id === 'KOR-03') {
        return {
          ...m,
          availableWorkers: 0,
          busyWorkers: 10,
          capacity: 100,
          status: 'Critical',
          radius: 300,
        };
      }
      return m;
    }));
    addToast('Scenario 1 Reset', 'KOR-03 capacity set to 100% (Critical). 0 experts available for #BK-8821.', 'info');
  };

  return (
    <OperationsContext.Provider value={{
      workers,
      bookings,
      markets,
      assignments,
      documents,
      payouts,
      notifications,
      auditLogs,
      selectedMarketId,
      setSelectedMarketId,
      toasts,
      addToast,
      removeToast,
      addWorker,
      assignWorker,
      reassignWorker,
      updateWorkerStatus,
      expandMarketRadius,
      toggleMarketSurge,
      toggleMarketPause,
      approveComplianceDoc,
      rejectComplianceDoc,
      approvePayout,
      addPayoutAdjustment,
      markNotificationRead,
      refreshMarkets,
      runScenario1CapacityCrunch,
    }}>
      {children}
    </OperationsContext.Provider>
  );
};

export const useOperations = () => {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
};
