import { AuditLogEvent } from '../../types';

export const mockAuditLogs: AuditLogEvent[] = [
  {
    id: 'AUD-001',
    timestamp: '2026-09-23T11:10:00Z',
    admin: 'Operations Manager (Current User)',
    actionType: 'ASSIGN',
    targetId: 'BK-2007',
    details: 'Manually assigned Anand Murthy to Dusting & Wiping Job #BK-2007 due to customer urgency',
  },
  {
    id: 'AUD-002',
    timestamp: '2026-09-23T11:00:00Z',
    admin: 'Operations Manager (Current User)',
    actionType: 'PAYOUT_APPROVAL',
    targetId: 'PAY-2005',
    details: 'Approved daily payout ledger of ₹1,250 for Priya Sundaram',
  },
  {
    id: 'AUD-003',
    timestamp: '2026-09-23T10:35:00Z',
    admin: 'Dispatch Engine (Automated)',
    actionType: 'RADIUS_EXPAND',
    targetId: 'KOR-04',
    details: 'Auto-expanded search radius from 400m to 600m to fulfill high House Cleaning demand',
  },
];
