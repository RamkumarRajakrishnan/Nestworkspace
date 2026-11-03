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
}

export const formatTimelineTimestamp = (rawTime?: string | number | null): { formatted: string; isValid: boolean } => {
  if (!rawTime || rawTime === 'null' || rawTime === 'undefined') {
    return { formatted: 'Pending', isValid: false };
  }

  try {
    let d: Date;
    if (typeof rawTime === 'number') {
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

    return { formatted: `${datePart}, ${timePart}`, isValid: true };
  } catch {
    return { formatted: 'Pending', isValid: false };
  }
};

export const getBookingTimelineStages = (booking: Partial<Booking> | any): DynamicTimelineStage[] => {
  if (!booking) return [];

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

  return [
    {
      key: 'created',
      title: 'Created',
      rawTime: createdTime,
      timeDisplay: createdInfo.formatted,
      isCompleted: createdInfo.isValid,
      description: createdInfo.isValid ? 'Booking successfully created in system' : 'Pending creation',
    },
    {
      key: 'requested',
      title: 'Requested',
      rawTime: requestedTime,
      timeDisplay: requestedInfo.formatted,
      isCompleted: requestedInfo.isValid,
      description: requestedInfo.isValid ? `Customer requested ${serviceDisplay} booking` : 'Pending request confirmation',
    },
    {
      key: 'assigned',
      title: 'Assigned',
      rawTime: assignedTime,
      timeDisplay: assignedInfo.formatted,
      isCompleted: assignedInfo.isValid,
      description: assignedInfo.isValid ? `${vendorDisplay} assigned to booking` : 'Awaiting expert assignment',
    },
    {
      key: 'started',
      title: 'Started',
      rawTime: startedTime,
      timeDisplay: startedInfo.formatted,
      isCompleted: startedInfo.isValid,
      description: startedInfo.isValid ? `Service job commenced by ${vendorDisplay}` : 'Service not yet started',
    },
    {
      key: 'completed',
      title: 'Completed',
      rawTime: completedTime,
      timeDisplay: completedInfo.formatted,
      isCompleted: completedInfo.isValid,
      description: completedInfo.isValid ? 'Order fulfillment completed successfully' : 'Pending completion',
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
      rating: 4.9,
    },
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
    lat: 12.8452,
    lng: 77.6602,
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
