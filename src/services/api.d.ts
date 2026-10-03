import { AuthSession, NestLoginData, RoleModulesData, CustomerTicketItem, CustomerTicketDetails } from '../types';

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

export interface VendorLiveTrackItem {
  vendor: string;
  workerId: string;
  latitude: number;
  longitude: number;
  onlineStatus: boolean;
  currentArea: string;
  areaName: string;
  lastUpdated: string;
  areaLat?: number;
  areaLng?: number;
  coverageRadius?: number;
}

export interface VendorLiveTrackArea {
  areaName: string;
  latitude: number;
  longitude: number;
  coverageRadius: number;
  vendors?: VendorLiveTrackItem[];
}

export interface VendorLiveTrackData {
  area: VendorLiveTrackArea | null;
  areas?: VendorLiveTrackArea[];
  areaName?: string;
  vendors: VendorLiveTrackItem[];
  pagination?: any;
}

export interface GetVendorLiveTrackResult {
  success: boolean;
  data?: VendorLiveTrackData;
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

export interface ExpertFilterOptions {
  areaName?: string;
  joiningStatus?: string;
  workerId?: string;
  mobileNumber?: string;
  fullName?: string;
  page?: number;
  limit?: number;
}

export interface RawApiExpert {
  tableId: string;
  workerId: string;
  fullName: string;
  mobileNumber: string;
  profileImage?: string;
  areaName?: string;
  joiningStatus?: string;
  gender?: string;
  verificationStatus?: string;
  monthlySalary?: number | string;
  shiftTimeing?: number | string;
  isAvailable?: boolean;
  workerStatus?: string;
}

export interface GetNestWorkersResult {
  success: boolean;
  data: RawApiExpert[];
  pagination?: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  count?: number;
  message?: string;
  error?: string;
}

export interface RegisterNestExpertPayload {
  fullName: string;
  mobileNumber: string;
  profileImage?: string;
  gender?: string;
  dateOfBirth?: string;
  areaName?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  aadhaarNumber?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  panNumber?: string;
  panCard?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  verificationStatus?: string;
  referredBy?: string;
  shiftTimeing?: string | number;
  shiftTiming?: string | number;
  monthlySalary?: number | string;
}

export interface RegisterNestExpertResult {
  success: boolean;
  workerId?: string;
  message?: string;
  data?: any;
  error?: string;
}

export interface RawApiExpertDetail {
  tableId?: string;
  workerId: string;
  fullName: string;
  mobileNumber: string;
  profileImage?: string;
  gender?: string;
  dateOfBirth?: string;
  serviceCategory?: string;
  areaName?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  aadhaarNumber?: string;
  aadhaarFront?: string;
  aadhaarBack?: string;
  panNumber?: string;
  panCard?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  verificationStatus?: string;
  referredBy?: string;
  shiftTimeing?: number | string;
  monthlySalary?: number | string;
  joiningStatus?: string;
  workerStatus?: string;
  isAvailable?: boolean;
  joinedDate?: string;
}

export interface GetNestWorkerByIdResult {
  success: boolean;
  data?: RawApiExpertDetail;
  message?: string;
  error?: string;
}

export interface UpdateNestExpertsPayload {
  tableId: string;
  areaName?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  accountHolderName?: string;
  joiningStatus?: string;
  referredBy?: string;
  shiftTimeing?: number | string;
  shiftTiming?: number | string;
  monthlySalary?: number | string;
}

export interface UpdateNestExpertsResult {
  success: boolean;
  tableId?: string;
  workerId?: string;
  fieldsUpdated?: string[];
  message?: string;
  data?: any;
  error?: string;
}

export const Serverurl: string;
export const RequestTypes: {
  uploadMedia: string;
  [key: string]: string;
};
export function getActiveSellerId(): string;
export function convertAndCompressToJpgBase64(file: File): Promise<{
  fileName: string;
  fileData: string;
  mediaType: string;
  sizeBytes: number;
}>;
export function normalizeMediaUrl(url?: string): string;
export function formatImageUrl(url?: string): string;
export function uploadMedia(
  file: File, 
  fieldNameOrOptions?: string | { sellerId?: string; folder?: string; field?: string; [key: string]: any },
  options?: { sellerId?: string; folder?: string; [key: string]: any }
): Promise<{ 
  success: boolean; 
  url?: string; 
  mediaUrl?: string; 
  src?: string; 
  status?: string; 
  data?: any; 
  error?: string 
}>;
export function uploadExpertFile(
  file: File, 
  fieldNameOrOptions?: string | { sellerId?: string; folder?: string; field?: string; [key: string]: any },
  options?: { sellerId?: string; folder?: string; [key: string]: any }
): Promise<{ 
  success: boolean; 
  url?: string; 
  mediaUrl?: string; 
  src?: string; 
  status?: string; 
  data?: any; 
  error?: string 
}>;
export function getNestWorkers(paramsOrArea?: string | ExpertFilterOptions, page?: number, limit?: number): Promise<GetNestWorkersResult>;
export function getExperts(paramsOrArea?: string | ExpertFilterOptions, page?: number, limit?: number): Promise<GetNestWorkersResult>;
export function registerNestExpert(expertData: RegisterNestExpertPayload): Promise<RegisterNestExpertResult>;
export interface BankItem {
  name: string;
  code?: string;
}

export interface GetBankListResult {
  success: boolean;
  data: BankItem[];
  error?: string;
}

export function checkExpertRegistration(aadhaarNumber: string): Promise<{ success: boolean; registered?: boolean; message?: string; error?: string }>;
export function getBankList(): Promise<GetBankListResult>;
export function getNestWorkerById(tableId: string): Promise<GetNestWorkerByIdResult>;
export function getExpertById(tableId: string): Promise<GetNestWorkerByIdResult>;
export function updateNestExperts(updateData: UpdateNestExpertsPayload): Promise<UpdateNestExpertsResult>;
export function updateExpert(updateData: UpdateNestExpertsPayload): Promise<UpdateNestExpertsResult>;
export function nestLogin(credentials: { email?: string; identifier?: string; password: string }): Promise<{ success: boolean; data?: NestLoginData; message?: string; error?: string }>;
export function roleModules(locationId: string, userRoleId: string): Promise<{ success: boolean; data?: RoleModulesData; message?: string; error?: string }>;
export function loginEmployee(credentials: LoginCredentials): Promise<LoginResult>;
export function registerEmployee(payload: RegisterEmployeePayload): Promise<RegisterEmployeeResult>;
export function registerExpert(payload: RegisterEmployeePayload | RegisterNestExpertPayload): Promise<RegisterEmployeeResult | RegisterNestExpertResult>;
export function getBookings(filtersOrArea?: string | GetBookingsFilterOptions, page?: number, limit?: number): Promise<GetBookingsResult>;
export function getAvailableExperts(tableId: string): Promise<GetAvailableExpertsResult>;
export function getActiveAreas(page?: number, pageSize?: number): Promise<GetActiveAreasResult>;
export function getAreas(page?: number, pageSize?: number): Promise<GetActiveAreasResult>;
export function getVendorLiveTrack(areaName: string): Promise<GetVendorLiveTrackResult>;
export function vendorLiveTrack(areaName: string): Promise<GetVendorLiveTrackResult>;

export interface CreateNestAreaDuration {
  duration: string;
  price: number;
  originalPrice: number;
  isActive: boolean;
  sequence: number;
  badge: string;
  displayTime: string;
  startTime: string;
  endTime: string;
  firstTimeUser: number;
  secoundtimeuser: number;
  regularUser: number;
}

export interface CreateNestAreaPayload {
  areaName: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  latitude: number;
  longitude: number;
  coverageRadius: number;
  surgePricing: number;
  priorityArea: boolean;
  isActive: boolean;
  workingHours: string;
  workersAvailable: boolean;
  estimatedTimeInMinutes: number;
  nearestWorkerDistanceMeters: number;
  durations: CreateNestAreaDuration[];
}

export interface CreateNestAreaResult {
  success: boolean;
  message?: string;
  area?: any;
  durationCount?: number;
  durations?: any[];
  error?: string;
}

export interface CheckNestAreaResult {
  success: boolean;
  exists: boolean;
  isAvailable?: boolean;
  message?: string;
  error?: string;
}

export function checkNestArea(areaName: string): Promise<CheckNestAreaResult>;
export function createNestArea(payload: CreateNestAreaPayload): Promise<CreateNestAreaResult>;
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

// Nest Pass Interfaces
export interface RawNestPassItem {
  packId: string;
  dashboardBanner?: string;
  popupBanner?: string;
  areaName: string;
  packType: string;
  visits: number;
  price: number;
  offerexpire: string;
  active: boolean;
  passId: string;
  validityDays?: number;
  duration?: string | number;
}

export interface RawNestPassDetail {
  packId: string;
  dashboardBanner?: string;
  popupBanner?: string;
  areaName: string;
  packType: string;
  visits: number;
  price: number;
  validityDays?: number;
  active: boolean;
  offerexpire: string;
  duration?: string | number;
}

export interface NestPassPagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetNestPassesParams {
  areaName?: string;
  page?: number;
  limit?: number;
}

export interface GetNestPassesResult {
  success: boolean;
  data: RawNestPassItem[];
  pagination: NestPassPagination;
  error?: string;
}

export interface GetNestPassDetailsResult {
  success: boolean;
  data?: RawNestPassDetail;
  error?: string;
}

export interface CreateNestPassPayload {
  dashboardBanner: string;
  popupBanner: string;
  areaName: string;
  packType: string;
  visits: number;
  price: number;
  validityDays: number;
  active: boolean;
  offerexpire: string;
  duration: string;
}

export interface CreateNestPassResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface UpdateNestPassPayload {
  passId: string;
  active?: boolean;
  offerexpire?: string;
}

export interface UpdateNestPassResult {
  success: boolean;
  data?: any;
  error?: string;
}

export function getNestPasses(params?: GetNestPassesParams): Promise<GetNestPassesResult>;
export function getNestPassDetails(passId: string): Promise<GetNestPassDetailsResult>;
export function createNestPass(passData: CreateNestPassPayload): Promise<CreateNestPassResult>;
export function updateNestPass(updateData: UpdateNestPassPayload): Promise<UpdateNestPassResult>;

export interface CreateNestAreaDuration {
  duration: string;
  price: number;
  originalPrice: number;
  isActive: boolean;
  sequence: number;
  badge: string;
  displayTime: string;
  startTime: string;
  endTime: string;
  firstTimeUser: number;
  secoundtimeuser: number;
  regularUser: number;
}

export interface CreateNestAreaPayload {
  areaName: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  latitude: number;
  longitude: number;
  coverageRadius: number;
  surgePricing: number;
  priorityArea: boolean;
  isActive: boolean;
  workingHours: string;
  workersAvailable: boolean;
  estimatedTimeInMinutes: number;
  nearestWorkerDistanceMeters: number;
  durations: CreateNestAreaDuration[];
}

export interface CreateNestAreaResult {
  success: boolean;
  message?: string;
  area?: any;
  durationCount?: number;
  durations?: any[];
  error?: string;
}

export interface CheckNestAreaResult {
  success: boolean;
  exists: boolean;
  message?: string;
  error?: string;
}

export function checkNestArea(areaName: string): Promise<CheckNestAreaResult>;
export function createNestArea(payload: CreateNestAreaPayload): Promise<CreateNestAreaResult>;

export interface RawNestAreaItem {
  tableId: string;
  areaName: string;
  city: string;
  state: string;
  country: string;
  serviceStatus?: boolean;
  coverageRadius?: number;
  priorityArea?: boolean;
  isActive?: boolean;
  workingHours?: string;
  Experts?: number;
  [key: string]: any;
}

export interface GetNestAreasResult {
  success: boolean;
  data: RawNestAreaItem[];
  pagination?: any;
  filters?: any;
  error?: string;
}

export interface RawNestAreaDurationItem {
  tableId?: string;
  duration: string;
  price: number;
  originalPrice: number;
  isActive: boolean;
  sequence?: number;
  badge?: string;
  areaName?: string;
  displayTime?: string;
  startTime?: string;
  endTime?: string;
  firstTimeUser?: number;
  secoundtimeuser?: number;
  regularUser?: number;
  [key: string]: any;
}

export interface RawNestAreaDetail {
  tableId: string;
  areaName: string;
  city: string;
  state: string;
  country: string;
  pincode?: number;
  latitude?: number;
  longitude?: number;
  serviceStatus?: boolean;
  coverageRadius?: number;
  surgePricing?: number;
  priorityArea?: boolean;
  isActive?: boolean;
  workingHours?: string;
  workersAvailable?: boolean | string;
  estimatedTimeInMinutes?: number | string;
  nearestWorkerDistanceMeters?: number | string;
  [key: string]: any;
}

export interface GetNestAreaByIdResult {
  success: boolean;
  data?: {
    area: RawNestAreaDetail;
    durations: RawNestAreaDurationItem[];
  };
  message?: string;
  error?: string;
}

export function getNestAreas(): Promise<GetNestAreasResult>;
export function getNestAreaById(tableId: string): Promise<GetNestAreaByIdResult>;
export function getNestAreasByLocation(city: string, state: string, page?: number, limit?: number): Promise<GetNestAreasResult>;

export interface GetCustomerTicketsResult {
  success: boolean;
  data: CustomerTicketItem[];
  error?: string;
}

export interface GetCustomerTicketDetailsResult {
  success: boolean;
  data?: CustomerTicketDetails;
  message?: string;
  error?: string;
}

export interface UpdateCustomerTicketStatusPayload {
  tableId: string;
  status: string;
}

export interface UpdateCustomerTicketStatusResult {
  success: boolean;
  data?: {
    tableId: string;
    status: string;
  };
  error?: string;
}

export function getCustomerTickets(): Promise<GetCustomerTicketsResult>;
export function getCustomerTicketDetails(tableId: string): Promise<GetCustomerTicketDetailsResult>;
export function updateCustomerTicketStatus(payload: UpdateCustomerTicketStatusPayload): Promise<UpdateCustomerTicketStatusResult>;




