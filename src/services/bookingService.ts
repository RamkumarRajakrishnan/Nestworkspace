import { Booking, BookingStatus } from '../types';
import { mockBookings } from '../data/mock/mockBookings';
import { getBookings } from './api';

/**
 * Service abstraction for Booking & Order Operations.
 * Connected to centralized api.js for live dispatch sync.
 */

export const formatDurationInHours = (durationMinutes?: string | number): string => {
  if (durationMinutes === undefined || durationMinutes === null || durationMinutes === '') return '—';
  const mins = typeof durationMinutes === 'string' ? parseFloat(durationMinutes) : durationMinutes;
  if (isNaN(mins) || mins <= 0) return '—';
  const hrs = mins / 60;
  if (hrs === 1) return '1 hr';
  if (hrs % 1 === 0) return `${hrs} hrs`;
  return `${parseFloat(hrs.toFixed(1))} hrs`;
};

export interface DynamicTimelineStage {
  key: 'created' | 'requested' | 'assigned' | 'started' | 'completed';
  title: 'Created' | 'Requested' | 'Assigned' | 'Started' | 'Completed';
  rawTime: string | null | undefined;
  timeDisplay: string;
  isCompleted: boolean;
  description: string;
  date?: Date;
}

export const formatTimelineTimestamp = (rawTime?: string | number | Date | null): { formatted: string; isValid: boolean; date?: Date } => {
  if (!rawTime || rawTime === 'null' || rawTime === 'undefined') {
    return { formatted: 'Pending', isValid: false };
  }

  try {
    let d: Date;
    if (rawTime instanceof Date) {
      d = rawTime;
    } else if (typeof rawTime === 'number') {
      d = new Date(rawTime);
    } else {
      const trimmed = String(rawTime).trim();
      if (!trimmed || trimmed === '—') return { formatted: 'Pending', isValid: false };
      if (/^\d+$/.test(trimmed)) {
        d = new Date(parseInt(trimmed, 10));
      } else {
        d = new Date(trimmed);
      }
    }

    if (isNaN(d.getTime())) {
      return { formatted: 'Pending', isValid: false };
    }

    const datePart = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return { formatted: `${datePart}, ${timePart}`, isValid: true, date: d };
  } catch {
    return { formatted: 'Pending', isValid: false };
  }
};

export const getBookingTimelineStages = (booking: Partial<Booking> | any): DynamicTimelineStage[] => {
  if (!booking) return [];

  const rawStatus = String(booking.bookingStatus || booking.status || '').trim().toLowerCase();
  const isCompletedStatus = rawStatus === 'completed';
  const isCancelledStatus = rawStatus === 'cancelled';
  const isOngoingOrStarted = rawStatus === 'ongoing' || rawStatus === 'in progress' || rawStatus === 'started';
  const isAssignedStatus = rawStatus === 'assigned';
  const hasAssignedVendor = Boolean(booking.vendorName || booking.vendorId);

  const createdTime = booking.createdTime || booking.createdAt || null;
  const requestedTime = booking.requestedTime || null;
  const assignedTime = booking.assignedTime || null;
  const startedTime = booking.startedTime || null;
  const completedTime = booking.completedTime || null;

  const createdInfo = formatTimelineTimestamp(createdTime);
  const requestedInfo = formatTimelineTimestamp(requestedTime);
  const assignedInfo = formatTimelineTimestamp(assignedTime);
  const startedInfo = formatTimelineTimestamp(startedTime);
  const completedInfo = formatTimelineTimestamp(completedTime);

  const vendorDisplay = booking.vendorName || booking.vendorId ? `Expert ${booking.vendorName || booking.vendorId}` : 'Expert';
  const serviceDisplay = booking.service || 'Service';

  // 1. Created stage
  const isCreatedCompleted = createdInfo.isValid;

  // 2. Requested stage
  const isRequestedCompleted = requestedInfo.isValid;

  // 3. Assigned stage
  const isAssignedCompleted = assignedInfo.isValid || hasAssignedVendor || isAssignedStatus || isOngoingOrStarted || isCompletedStatus;

  // 4. Started stage
  const isStartedCompleted = (isOngoingOrStarted || isCompletedStatus) && startedInfo.isValid;

  // 5. Completed stage:
  // Strictly requires bookingStatus to be 'completed' (and valid completion timestamp).
  // If the booking is ongoing, completedTime represents the estimated completion time (e.g. 5:16 pm), NOT a finished stage.
  const isCompletedCompleted = isCompletedStatus && completedInfo.isValid;

  // Dynamic descriptions
  const createdDescription = isCreatedCompleted
    ? 'Booking successfully created in system'
    : 'Pending creation';

  const requestedDescription = isRequestedCompleted
    ? `Customer requested ${serviceDisplay} booking`
    : 'Pending request confirmation';

  const assignedDescription = isAssignedCompleted
    ? `${vendorDisplay} assigned to booking`
    : 'Awaiting expert assignment';

  let startedDescription = 'Service not yet started';
  if (isStartedCompleted) {
    startedDescription = `Service job commenced by ${vendorDisplay}`;
  } else if (startedInfo.isValid) {
    const timeOnly = startedInfo.date
      ? startedInfo.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : startedInfo.formatted;
    startedDescription = `Scheduled start at ${timeOnly}`;
  }

  let completedDescription = 'Pending completion';
  if (isCompletedCompleted) {
    completedDescription = 'Order fulfillment completed successfully';
  } else if (isCancelledStatus) {
    completedDescription = 'Booking cancelled';
  } else if (completedInfo.isValid) {
    const timeOnly = completedInfo.date
      ? completedInfo.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
      : completedInfo.formatted;
    completedDescription = `Expected completion by ${timeOnly}`;
  }

  return [
    {
      key: 'created',
      title: 'Created',
      rawTime: createdTime,
      timeDisplay: createdInfo.formatted,
      isCompleted: isCreatedCompleted,
      description: createdDescription,
      date: createdInfo.date,
    },
    {
      key: 'requested',
      title: 'Requested',
      rawTime: requestedTime,
      timeDisplay: requestedInfo.formatted,
      isCompleted: isRequestedCompleted,
      description: requestedDescription,
      date: requestedInfo.date,
    },
    {
      key: 'assigned',
      title: 'Assigned',
      rawTime: assignedTime,
      timeDisplay: assignedInfo.formatted,
      isCompleted: isAssignedCompleted,
      description: assignedDescription,
      date: assignedInfo.date,
    },
    {
      key: 'started',
      title: 'Started',
      rawTime: startedTime,
      timeDisplay: startedInfo.formatted,
      isCompleted: isStartedCompleted,
      description: startedDescription,
      date: startedInfo.date,
    },
    {
      key: 'completed',
      title: 'Completed',
      rawTime: completedTime,
      timeDisplay: completedInfo.formatted,
      isCompleted: isCompletedCompleted,
      description: completedDescription,
      date: completedInfo.date,
    },
  ];
};

export const mapApiBookingToBooking = (item: any): Booking => {
  const durationNum = parseInt(item.duration, 10) || 60;
  const amountVal = item.totalAmount !== undefined && item.totalAmount !== '' ? item.totalAmount : '—';

  let dateStr = 'Today';
  let timeStr = '09:00 AM';
  if (item.requestedTime) {
    try {
      const d = new Date(item.requestedTime);
      if (!isNaN(d.getTime())) {
        dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
    } catch {
      // fallback
    }
  }

  let slaSec = 0;
  if (item.slaTimer && typeof item.slaTimer === 'string') {
    const minsMatch = item.slaTimer.match(/(\d+)\s*m/);
    const secsMatch = item.slaTimer.match(/(\d+)\s*s/);
    const m = minsMatch ? parseInt(minsMatch[1], 10) : 0;
    const s = secsMatch ? parseInt(secsMatch[1], 10) : 0;
    slaSec = m * 60 + s;
  }

  // Requirement: service type as instant or schedule fetch from api
  let serviceName = 'Instant';
  if (item.bookingType) {
    const t = String(item.bookingType).trim().toLowerCase();
    if (t === 'instant') serviceName = 'Instant';
    else if (t === 'scheduled' || t === 'schedule') serviceName = 'Scheduled';
    else serviceName = item.bookingType.charAt(0).toUpperCase() + item.bookingType.slice(1);
  } else if (item.service) {
    serviceName = item.service;
  }

  const assignedIds: string[] = item.vendorId ? [item.vendorId] : [];

  const rawCustomerRating = item.customeRating ?? item.customerRating ?? item.rating;
  const parsedCustomerRating =
    rawCustomerRating !== undefined && rawCustomerRating !== '' && rawCustomerRating !== null && !isNaN(Number(rawCustomerRating))
      ? Number(rawCustomerRating)
      : undefined;

  const dynamicTimeline = getBookingTimelineStages({ ...item, service: serviceName });
  const timelineEvents = dynamicTimeline.map((s) => ({
    time: s.timeDisplay,
    title: s.title,
    description: s.description,
    completed: s.isCompleted,
  }));

  return {
    id: item.bookingId || item.tableId,
    bookingId: item.bookingId,
    tableId: item.tableId,
    customer: {
      name: item.customerName || item.vendorName || '—',
      phone: item.customerPhone || '—',
      email: item.customerEmail || '',
      rating: parsedCustomerRating,
    },
    customerRating: parsedCustomerRating,
    customeRating: rawCustomerRating !== undefined ? rawCustomerRating : '',
    rating: parsedCustomerRating,
    service: serviceName,
    address: item.address || '—',
    areaId: item.areaName || 'Neo_Town',
    areaName: item.areaName || 'Neo_Town',
    date: dateStr,
    startTime: timeStr,
    durationMinutes: durationNum,
    duration: String(durationNum),
    requiredWorkers: 1,
    assignedWorkerIds: assignedIds,
    status: item.bookingStatus || 'New',
    bookingStatus: item.bookingStatus || 'New',
    priority: item.slaAlert === 'SLA Risk' ? 'High' : 'Normal',
    slaSecondsRemaining: slaSec,
    slaTargetMinutes: 30,
    lat: item.latitude !== undefined && item.latitude !== '' && !isNaN(Number(item.latitude)) ? Number(item.latitude) : 0,
    lng: item.longitude !== undefined && item.longitude !== '' && !isNaN(Number(item.longitude)) ? Number(item.longitude) : 0,
    amount: amountVal,
    totalAmount: amountVal,
    paymentStatus: item.paymentStatus || 'Success',
    bookingType: item.bookingType || 'instant',
    vendorName: item.vendorName || '',
    vendorId: item.vendorId || '',
    vendorPhoto: item.vendorPhoto || '',
    createdTime: item.createdTime || item.createdAt || '',
    requestedTime: item.requestedTime || '',
    assignedTime: item.assignedTime || '',
    startedTime: item.startedTime || '',
    completedTime: item.completedTime || '',
    slaTimer: item.slaTimer || '—',
    slaAlert: item.slaAlert || '—',
    customerName: item.customerName || item.vendorName || '—',
    customerPhone: item.customerPhone || '—',
    customerEmail: item.customerEmail || '',
    passbooking: item.passbooking ?? item.passBooking,
    passId: item.passId ?? item.passid,
    timeline: timelineEvents,
    rawMessage: typeof item === 'object' && item !== null ? item : {},
  };
};

export const bookingService = {
  async getBookings(filtersOrArea: string | any = 'Haatza_corp', page = 1, limit = 20): Promise<Booking[]> {
    try {
      const res = await getBookings(filtersOrArea, page, limit);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map(mapApiBookingToBooking);
      }
    } catch (e) {
      console.error('Error fetching live bookings:', e);
    }
    return Promise.resolve([...mockBookings]);
  },

  async getBookingById(id: string): Promise<Booking | undefined> {
    const list = await this.getBookings();
    return list.find(b => b.id === id || b.bookingId === id || b.tableId === id);
  },

  async updateBookingStatus(id: string, status: BookingStatus): Promise<boolean> {
    const booking = mockBookings.find(b => b.id === id || b.bookingId === id || b.tableId === id);
    if (booking) {
      booking.status = status;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  async assignWorkerToBooking(bookingId: string, workerId: string): Promise<boolean> {
    const booking = mockBookings.find(b => b.id === bookingId || b.bookingId === bookingId || b.tableId === bookingId);
    if (booking) {
      if (!booking.assignedWorkerIds.includes(workerId)) {
        booking.assignedWorkerIds.push(workerId);
      }
      if (booking.assignedWorkerIds.length >= booking.requiredWorkers) {
        booking.status = 'Assigned';
      }
      booking.timeline.push({
        time: 'Just now',
        title: 'Expert Assigned',
        description: `Expert ${workerId} dispatched to booking`,
        completed: true,
      });
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
};
