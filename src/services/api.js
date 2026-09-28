/**
 * Centralized API Service for Nest Admin Portal
 * All network API calls for the entire project are unified in this single file.
 * 
 * Rules:
 * - Do NOT create separate API service files for individual modules.
 * - Components must import API functions exclusively from this file.
 * - Endpoints and URLs must NOT be duplicated or hardcoded in components.
 */

const API_BASE_URL = 'https://www.haatza.com/_functions';

// ============================================================================
// AUTH APIs
// ============================================================================

/**
 * Authenticates an employee / admin user.
 * Endpoint: POST https://www.haatza.com/_functions/nestemployeeLogin
 * 
 * @param {Object} credentials - { email, password } or legacy { identifier, password }
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const loginEmployee = async (credentials) => {
  const emailValue = (credentials?.email || credentials?.identifier || '').trim();
  const payload = {
    email: emailValue,
    password: credentials?.password || '',
  };

  try {
    const response = await fetch(`${API_BASE_URL}/nestemployeeLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Nest Employee Login Response:', data);

    if (data && data.status === 'success' && data.message) {
      return {
        success: true,
        data: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Invalid email or password. Please check your credentials and try again.';

    console.error('Nest Employee Login Error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Employee Login Network Error:', error);
    return {
      success: false,
      error: 'Unable to connect to the authentication server. Please check your connection and try again.',
    };
  }
};

// ============================================================================
// EMPLOYEE APIs
// ============================================================================

/**
 * Registers a new employee / expert in the system.
 * Endpoint: POST https://www.haatza.com/_functions/nestemployeeRegister
 * 
 * @param {Object} payload - Employee details
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const registerEmployee = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/nestemployeeRegister`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Nest Employee Register Response:', data);

    if (data && data.status === 'success') {
      return {
        success: true,
        data: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Failed to register new employee. Please check the entered details and try again.';

    console.error('Nest Employee Register Error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Employee Register Network Error:', error);
    return {
      success: false,
      error: 'Unable to connect to registration server. Please check your connection and try again.',
    };
  }
};

/**
 * Alias for registerEmployee to maintain backward compatibility where registerExpert was used
 */
export const registerExpert = registerEmployee;

// ============================================================================
// ORDER / BOOKING APIs
// ============================================================================

/**
 * Fetches bookings/orders with server-side query filters.
 * Supported query parameters:
 * - areaName (e.g. 'Pulikari', 'Haatza_corp', 'Neo_Town')
 * - bookingStatus (e.g. 'Assigned', 'Booked', 'Completed')
 * - slaAlert (e.g. 'SLA Risk', 'On Time')
 * - customerPhone (e.g. '9876543210')
 * - bookingType (e.g. 'instant', 'scheduled', 'Regular')
 * - duration (e.g. '60', '240')
 * - page (default 1)
 * - limit (default 20)
 * 
 * @param {string|Object} [filtersOrArea='Neo_Town'] - Filter object or areaName string
 * @param {number} [page=1] - Page number for pagination
 * @param {number} [limit=20] - Number of orders per page
 * @returns {Promise<{ success: boolean, data: Array, total?: number, message?: string, error?: string }>}
 */
export const getBookings = async (filtersOrArea = 'Neo_Town', page, limit) => {
  try {
    const params = new URLSearchParams();

    if (typeof filtersOrArea === 'object' && filtersOrArea !== null) {
      const opts = filtersOrArea;
      if (opts.areaName && opts.areaName !== 'ALL' && opts.areaName !== 'All') {
        params.append('areaName', opts.areaName);
      }
      if (opts.bookingStatus && opts.bookingStatus !== 'ALL' && opts.bookingStatus !== 'All') {
        params.append('bookingStatus', opts.bookingStatus);
      }
      if (opts.slaAlert && opts.slaAlert !== 'ALL' && opts.slaAlert !== 'All') {
        params.append('slaAlert', opts.slaAlert);
      }
      if (opts.customerPhone && String(opts.customerPhone).trim()) {
        params.append('customerPhone', String(opts.customerPhone).trim());
      }
      if (opts.bookingType && opts.bookingType !== 'ALL' && opts.bookingType !== 'All') {
        params.append('bookingType', opts.bookingType);
      }
      if (opts.bookingId && String(opts.bookingId).trim()) {
        params.append('bookingId', String(opts.bookingId).trim().replace(/^#/, ''));
      }
      if (opts.duration) {
        params.append('duration', String(opts.duration));
      }
      const pageNum = opts.page !== undefined ? opts.page : page;
      if (pageNum !== undefined && pageNum !== null) {
        params.append('page', String(pageNum));
      }
      const limitNum = opts.limit !== undefined ? opts.limit : limit;
      if (limitNum !== undefined && limitNum !== null) {
        params.append('limit', String(limitNum));
      }
    } else {
      if (filtersOrArea && filtersOrArea !== 'ALL' && filtersOrArea !== 'All') {
        params.append('areaName', filtersOrArea);
      }
      if (page !== undefined && page !== null) params.append('page', String(page));
      if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    }

    const queryString = params.toString().replace(/\+/g, '%20');
    const url = `${API_BASE_URL}/nestBookings${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Nest Bookings API [${queryString}] Response:`, data);

    if (data && (data.status === 'success' || Array.isArray(data.message) || Array.isArray(data.data))) {
      const orders = Array.isArray(data.message)
        ? data.message
        : (Array.isArray(data.data) ? data.data : []);
      return {
        success: true,
        data: orders,
        total: orders.length,
      };
    }

    // Handle "No bookings found" as an empty list (not a server failure)
    if (
      data &&
      (data.status === 'Failed' || data.status === 'failed') &&
      typeof data.message === 'string' &&
      data.message.toLowerCase().includes('no bookings found')
    ) {
      return {
        success: true,
        data: [],
        total: 0,
        message: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Unable to load orders. Unexpected server response.';

    return {
      success: false,
      data: [],
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Bookings API Error:', error);
    return {
      success: false,
      data: [],
      error: 'Unable to load orders. Please check your connection and try again.',
    };
  }
};

// ============================================================================
// EXPERT APIs
// ============================================================================

/**
 * Fetches available experts for a specific booking using its tableId.
 * Endpoint: GET https://www.haatza.com/_functions/nestAvailableExperts?tableId=<TABLE_ID>
 * 
 * @param {string} tableId - The backend record identifier of the booking (NOT bookingId, NOT userId)
 * @returns {Promise<{ success: boolean, data: Array, error?: string }>}
 */
export const getAvailableExperts = async (tableId) => {
  if (!tableId) {
    console.error('getAvailableExperts called without a valid tableId');
    return {
      success: false,
      data: [],
      error: 'Invalid order reference: tableId is required to find available experts.',
    };
  }

  try {
    const encodedTableId = encodeURIComponent(tableId);
    const url = `${API_BASE_URL}/nestAvailableExperts?tableId=${encodedTableId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Nest Available Experts Response for tableId ${tableId}:`, data);

    if (data && (data.status === 'success' || data.success || Array.isArray(data.message) || Array.isArray(data.data))) {
      const experts = Array.isArray(data.message) 
        ? data.message 
        : (Array.isArray(data.data) ? data.data : []);
      return {
        success: true,
        data: experts,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Unable to load available experts.';

    return {
      success: false,
      data: [],
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Available Experts API Error:', error);
    return {
      success: false,
      data: [],
      error: 'Unable to load available experts. Please try again.',
    };
  }
};

// ============================================================================
// AREA APIs
// ============================================================================

/**
 * Fetches active operating areas / nano-markets.
 * Endpoint: GET https://www.haatza.com/_functions/nestActiveAreas?page=1&pageSize=10
 * 
 * @param {number} [page=1]
 * @param {number} [pageSize=50]
 * @returns {Promise<{ success: boolean, data: Array<{ areaName: string, city: string, state: string }>, pagination?: any, error?: string }>}
 */
export const getActiveAreas = async (page = 1, pageSize = 10) => {
  try {
    const url = `${API_BASE_URL}/nestActiveAreas?page=${page}&pageSize=${pageSize}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Nest Active Areas API Response:', data);

    if (data && data.success && Array.isArray(data.data)) {
      return {
        success: true,
        data: data.data,
        pagination: data.pagination,
      };
    }

    // Fallback if data is in a different property
    const areas = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.message) ? data.message : []);
    return {
      success: true,
      data: areas,
      pagination: data?.pagination,
    };
  } catch (error) {
    console.error('Nest Active Areas API Error:', error);
    return {
      success: false,
      data: [
        { areaName: 'Neo_Town', city: 'Bangalore', state: 'Karnataka' },
        { areaName: 'Haatza_corp', city: 'Bangalore', state: 'Karnataka' },
        { areaName: 'Prestiage', city: 'Bangalore', state: 'Karnataka' },
        { areaName: 'neeladri_Nagar', city: 'Bangalore', state: 'Karnataka' },
      ],
      error: 'Unable to load active areas. Using cached active areas.',
    };
  }
};

/**
 * Alias for getActiveAreas
 */
export const getAreas = getActiveAreas;

// ============================================================================
// BOOKING CANCELLATION API
// ============================================================================

/**
 * Cancels a booking via the backend cancellation endpoint.
 * Endpoint: POST https://www.haatza.com/_functions/cancelNestBooking
 * 
 * @param {string} tableId - Dynamic tableId of the booking
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const cancelBooking = async (tableId) => {
  if (!tableId) {
    console.error('cancelBooking called without a valid tableId');
    return {
      success: false,
      error: 'Cannot cancel order: Table ID is missing.',
    };
  }

  try {
    const url = `${API_BASE_URL}/cancelNestBooking`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ tableId }),
    });

    const data = await response.json();
    console.log(`Nest Cancel Booking Response for tableId ${tableId}:`, data);

    if (data && (data.status === 'success' || data.success)) {
      return {
        success: true,
        data: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.message?.message || 'Unable to cancel booking. Please try again.');

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Cancel Booking API Error:', error);
    return {
      success: false,
      error: 'Network error while attempting to cancel booking. Please try again.',
    };
  }
};

// ============================================================================
// FUTURE APIs (Placeholders - To be connected when backend endpoints are ready)
// ============================================================================

/**
 * Fetches detailed booking/order info using the tableId.
 * Endpoint: GET https://www.haatza.com/_functions/nestBookingDetails?tableId=<TABLE_ID>
 * 
 * @param {string} tableId - The backend record identifier (tableId) of the booking
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const getOrderDetails = async (tableId) => {
  if (!tableId) {
    console.error('getOrderDetails called without a valid tableId');
    return {
      success: false,
      error: 'Invalid order reference: tableId is required.',
    };
  }

  try {
    const encodedTableId = encodeURIComponent(tableId);
    const url = `${API_BASE_URL}/nestBookingDetails?tableId=${encodedTableId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log(`Nest Booking Details Response for tableId ${tableId}:`, data);

    if (response.ok && data && (data.status === 'success' || data.message)) {
      return {
        success: true,
        data: data.message || data.data,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.error || `Unable to load order details (${response.status}).`);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Booking Details API Error:', error);
    return {
      success: false,
      error: 'Unable to load order details. Please try again.',
    };
  }
};

/**
 * Assigns or reassigns an expert to a booking using tableId.
 * Endpoint: POST https://haatza.com/_functions/manualAssignNestBooking
 * 
 * @param {Object} params
 * @param {string} params.tableId - The backend record identifier (tableId) of the booking
 * @param {string} params.vendorId - Selected expert's vendor ID
 * @param {string} params.vendorName - Selected expert's name
 * @param {string} [params.vendorPhoto] - Selected expert's photo URL
 * @param {string} [params.bookingStatus='Assigned']
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const manualAssignNestBooking = async ({
  tableId,
  vendorId,
  vendorName,
  vendorPhoto,
  bookingStatus = 'Assigned',
}) => {
  if (!tableId) {
    console.error('manualAssignNestBooking called without a valid tableId');
    return {
      success: false,
      error: 'Cannot assign expert: tableId is required.',
    };
  }

  try {
    const url = `${API_BASE_URL}/manualAssignNestBooking`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        tableId,
        vendorId,
        vendorName,
        vendorPhoto: vendorPhoto || '',
        bookingStatus,
      }),
    });

    const data = await response.json().catch(() => null);
    console.log(`manualAssignNestBooking Response for tableId ${tableId}:`, data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      return {
        success: true,
        data: data.message || data.data,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.message?.message || data?.error || `Unable to assign expert (${response.status}).`);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('manualAssignNestBooking API Error:', error);
    return {
      success: false,
      error: error?.message || 'Network error while assigning expert. Please try again.',
    };
  }
};

export const assignExpert = manualAssignNestBooking;

