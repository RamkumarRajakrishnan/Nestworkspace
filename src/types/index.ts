export type WorkerStatus = 
  | 'Available' 
  | 'Assigned' 
  | 'Busy' 
  | 'Traveling' 
  | 'Unavailable' 
  | 'Offline' 
  | 'GPS Stale' 
  | 'Suspended';

export type ComplianceOverallStatus = 
  | 'Verified' 
  | 'Pending' 
  | 'Expiring Soon' 
  | 'Expired' 
  | 'Rejected';

export type ServiceType = 
  | 'House Cleaning'
  | 'Dusting & Wiping'
  | 'Bathroom Cleaning'
  | 'Laundry & Ironing'
  | 'Cleaning Dishes';

export const APPROVED_SERVICE_TYPES: ServiceType[] = [
  'House Cleaning',
  'Dusting & Wiping',
  'Bathroom Cleaning',
  'Laundry & Ironing',
  'Cleaning Dishes',
];

export interface Worker {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  areaId: string;
  status: WorkerStatus;
  skills: ServiceType[];
  rating: number;
  ratingCount: number;
  joinedDate: string;
  todayJobs: number;
  todayEarnings: number;
  weeklyEarnings: number;
  currentJobId: string | null;
  complianceStatus: ComplianceOverallStatus;
  lat: number;
  lng: number;
  lastGpsUpdate: string;
  gpsAccuracyMeters: number;
  completionRate: number;
  cancellationRate: number;
  avgResponseTimeSec: number;
}

export type BookingStatus = 
  | 'Booked'
  | 'Assigned' 
  | 'In Progress' 
  | 'Ongoing'
  | 'Completed' 
  | 'Cancelled' 
  | 'SLA Risk' 
  | 'New' 
  | 'Searching' 
  | 'En Route' 
  | 'Queued';

export interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface Booking {
  id: string;
  bookingId?: string;
  tableId?: string;
  customer: {
    name: string;
    phone: string;
    rating?: number;
    email?: string;
  };
  service: ServiceType | string;
  address: string;
  areaId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  duration?: string;
  requiredWorkers: number;
  assignedWorkerIds: string[];
  status: BookingStatus | string;
  priority: 'Normal' | 'High' | 'Critical (VIP)';
  slaSecondsRemaining: number;
  slaTargetMinutes: number;
  lat: number;
  lng: number;
  amount: number | string;
  timeline: TimelineEvent[];
  notes?: string;
  searchRadius?: number;
  searchStage?: number;

  // Raw API response fields
  vendorName?: string;
  vendorId?: string;
  vendorPhoto?: string;
  paymentStatus?: string;
  totalAmount?: string | number;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  bookingType?: string;
  areaName?: string;
  requestedTime?: string;
  startedTime?: string;
  completedTime?: string;
  bookingStatus?: string;
  slaTimer?: string;
  slaAlert?: string;
}

export type MarketStatus = 'Healthy' | 'Normal' | 'Tight' | 'Critical';

export interface Market {
  id: string;
  name: string;
  area: string;
  tableId?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: number;
  latitude?: number;
  longitude?: number;
  radius: number;
  maxRadius: number;
  availableWorkers: number;
  busyWorkers: number;
  activeOrders: number;
  queuedOrders: number;
  capacity: number; // percentage
  status: MarketStatus;
  neighboringMarkets: string[];
  center: { lat: number; lng: number };
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  instantBookingEnabled: boolean;
  surgeIncentiveActive: boolean;
  surgeMultiplier: number;
  paused?: boolean;
  rawArea?: any;
}

export interface Assignment {
  id: string;
  bookingId: string;
  workerId: string;
  startTime: string;
  endTime: string;
  status: 'Scheduled' | 'En Route' | 'In Progress' | 'Completed' | 'Reassigned' | 'Cancelled';
  assignedAt: string;
  assignedBy: string;
  reassignmentReason?: string;
  previousWorkerId?: string;
}

export type DocType = 'KYC' | 'ID Proof' | 'Background Verification' | 'Agreement' | 'Training' | 'Insurance';
export type DocStatus = 'Verified' | 'Pending' | 'Expiring Soon' | 'Expired' | 'Rejected';

export interface WorkerDocument {
  id: string;
  workerId: string;
  workerName: string;
  type: DocType;
  documentNumber: string;
  uploadedDate: string;
  expiryDate: string;
  status: DocStatus;
  rejectionReason?: string;
}

export type PayoutStatus = 'Draft' | 'Calculated' | 'Under Review' | 'Approved' | 'Paid' | 'Adjusted';

export interface LedgerItem {
  id: string;
  type: 'Base' | 'Peak Bonus' | 'Performance Bonus' | 'Attendance Bonus' | 'Kit Deduction' | 'Adjustment Credit' | 'Adjustment Debit';
  amount: number;
  reference: string;
  reason: string;
  date: string;
}

export interface WorkerPayout {
  id: string;
  workerId: string;
  workerName: string;
  areaId: string;
  date: string;
  jobsCompleted: number;
  baseEarnings: number;
  bonuses: number;
  deductions: number;
  gross: number;
  netPayable: number;
  status: PayoutStatus;
  ledger: LedgerItem[];
  reviewedBy?: string;
  approvedAt?: string;
}

export interface OperationalNotification {
  id: string;
  category: 'Dispatch' | 'Capacity' | 'Compliance' | 'Finance' | 'System';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export interface AuditLogEvent {
  id: string;
  timestamp: string;
  admin: string;
  actionType: 'ASSIGN' | 'REASSIGN' | 'STATUS_CHANGE' | 'CAPACITY_ESCALATION' | 'RADIUS_EXPAND' | 'DOC_APPROVAL' | 'PAYOUT_APPROVAL' | 'PAYOUT_ADJUSTMENT';
  targetId: string;
  details: string;
  reason?: string;
}

export interface NestRoleItem {
  userRoleId: string;
  locationId: string;
  roleName: string;
  areaName: string;
}

export interface NestLoginData {
  userId: string;
  roles: NestRoleItem[];
}

export interface RoleModuleItem {
  moduleId: string;
  moduleName: string;
  menuTitle: string;
  sortOrder: number;
}

export interface RoleMenuItem {
  menuTitle: string;
  sortOrder: number;
  modules: RoleModuleItem[];
}

export interface RoleModulesData {
  locationId: string;
  userRoleId: string;
  menus: RoleMenuItem[];
}

export interface AuthUser {
  userId: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  profileImage: string | null;
  status: string;
  verificationStatus: string;
  lastLoginAt: string;
}

export interface AuthRole {
  userRoleId: string;
  roleCode: string;
  status: string;
}

export interface AuthLocation {
  userLocationId: string;
  areaName: string;
  accessLevel: string;
  status: string;
}

export interface AuthSession {
  userId: string;
  userRoleId: string;
  locationId: string;
  roleName: string;
  areaName: string;
  email?: string;
  authorizedMenus: RoleMenuItem[];
  user: AuthUser;
  role: AuthRole;
  locations: AuthLocation[];
}

