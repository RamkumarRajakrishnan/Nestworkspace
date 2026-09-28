import { AuthSession } from '../types';

export interface LoginCredentials {
  email?: string;
  identifier?: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  data?: AuthSession;
  error?: string;
}

export interface RegisterEmployeePayload {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  profileImage: string | null;
  areaNames: string[];
  accessLevel: string;
}

export interface RegisterEmployeeResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface RawApiBooking {
  bookingId: string;
  tableId: string;
  duration?: string;
  vendorName?: string;
  vendorId?: string;
  vendorPhoto?: string;
  paymentStatus?: string;
  totalAmount?: string | number;
  address?: string;
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

export interface GetBookingsResult {
  success: boolean;
  data: RawApiBooking[];
  total?: number;
  error?: string;
}

export interface AvailableExpertItem {
  workerId: string;
  expertName: string;
  profileImage?: string;
}

export interface GetAvailableExpertsResult {
  success: boolean;
  data: AvailableExpertItem[];
  error?: string;
}

export interface ActiveAreaItem {
  areaName: string;
  city?: string;
  state?: string;
}

export interface GetActiveAreasResult {
  success: boolean;
  data: ActiveAreaItem[];
  pagination?: any;
  error?: string;
}

export interface GetBookingsFilterOptions {
  areaName?: string;
  bookingStatus?: string;
  slaAlert?: string;
  customerPhone?: string;
  bookingType?: string;
  bookingId?: string;
  duration?: string | number;
  page?: number;
  limit?: number;
}

export function loginEmployee(credentials: LoginCredentials): Promise<LoginResult>;
export function registerEmployee(payload: RegisterEmployeePayload): Promise<RegisterEmployeeResult>;
export function registerExpert(payload: RegisterEmployeePayload): Promise<RegisterEmployeeResult>;
export function getBookings(filtersOrArea?: string | GetBookingsFilterOptions, page?: number, limit?: number): Promise<GetBookingsResult>;
export function getAvailableExperts(tableId: string): Promise<GetAvailableExpertsResult>;
export function getActiveAreas(page?: number, pageSize?: number): Promise<GetActiveAreasResult>;
export function getAreas(page?: number, pageSize?: number): Promise<GetActiveAreasResult>;
export function getOrderDetails(tableId: string): Promise<{ success: boolean; data?: any; error?: string }>;
export interface ManualAssignPayload {
  tableId: string;
  vendorId: string;
  vendorName: string;
  vendorPhoto?: string;
  bookingStatus?: string;
}

export function manualAssignNestBooking(payload: ManualAssignPayload): Promise<{ success: boolean; data?: any; error?: string }>;
export function assignExpert(payload: ManualAssignPayload): Promise<{ success: boolean; data?: any; error?: string }>;
export function cancelBooking(tableId: string): Promise<{ success: boolean; data?: any; error?: string }>;

