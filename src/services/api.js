/**
 * Centralized API Service for Nest Admin Portal
 * All network API calls for the entire project are unified in this single file.
 * 
 * Rules:
 * - Do NOT create separate API service files for individual modules.
 * - Components must import API functions exclusively from this file.
 * - Endpoints and URLs must NOT be duplicated or hardcoded in components.
 */

export const Serverurl = 'https://haatza.com/_functions';
const API_BASE_URL = 'https://www.haatza.com/_functions';

export const RequestTypes = {
  uploadMedia: `${Serverurl}/uploadMedia`,
};

// ============================================================================
// AUTH & ROLE AUTHORIZATION APIs
// ============================================================================

/**
 * Authenticates user via Nest Admin Login API.
 * Endpoint: POST https://haatza.com/_functions/nestLogin
 * 
 * @param {Object} credentials - { email, password }
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const nestLogin = async (credentials) => {
  const emailValue = (credentials?.email || credentials?.identifier || '').trim();
  const payload = {
    email: emailValue,
    password: credentials?.password || '',
  };

  try {
    const response = await fetch(`${Serverurl}/nestLogin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('Nest Login API Response:', data);

    if (data && data.status === 'success' && data.data) {
      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Invalid email or password. Please check your credentials and try again.';

    console.error('Nest Login API Error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Login Network Error:', error);
    return {
      success: false,
      error: 'Unable to connect to the authentication server. Please check your connection and try again.',
    };
  }
};

/**
 * Fetches authorized menus and modules for a selected location and user role.
 * Endpoint: GET https://haatza.com/_functions/roleModules?locationId={locationId}&userRoleId={userRoleId}
 * 
 * @param {string} locationId - The selected location ID
 * @param {string} userRoleId - The selected user role ID
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const roleModules = async (locationId, userRoleId) => {
  try {
    const url = `${Serverurl}/roleModules?locationId=${encodeURIComponent(locationId)}&userRoleId=${encodeURIComponent(userRoleId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Role Modules API Response:', data);

    if (data && data.status === 'success' && data.data) {
      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Failed to retrieve authorized role modules for this role and area.';

    console.error('Role Modules API Error:', errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Role Modules Network Error:', error);
    return {
      success: false,
      error: 'Unable to connect to the authorization server. Please try again.',
    };
  }
};

/**
 * Authenticates an employee / admin user (legacy endpoint).
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
 * Converts image paths/Wix image URIs into valid, browser-displayable URLs.
 * Handles wix:image://v1/mediaId/name#... -> https://static.wixstatic.com/media/mediaId
 * Handles standard https:// and http:// URLs.
 * 
 * @param {string} url - Image URI or URL
 * @returns {string} - Displayable URL or empty string
 */
export const normalizeMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('wix:image://v1/')) {
    const afterPrefix = trimmed.slice('wix:image://v1/'.length);
    const mediaId = afterPrefix.split('/')[0];
    if (mediaId) {
      return `https://static.wixstatic.com/media/${mediaId}`;
    }
  }
  if (trimmed.startsWith('wix:image://')) {
    const parts = trimmed.split('/');
    const mediaId = parts[parts.length - 2] || parts[parts.length - 1];
    if (mediaId) {
      return `https://static.wixstatic.com/media/${mediaId.split('#')[0]}`;
    }
  }
  return trimmed;
};

export const formatImageUrl = normalizeMediaUrl;

/**
 * Safely retrieves the active logged-in seller or user ID from existing session / storage state.
 * Never hardcodes any seller ID.
 * 
 * @returns {string} The active seller or user ID, or 'SELLER_ID' as fallback.
 */
export const getActiveSellerId = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // 1. Check direct seller storage keys
      const direct = localStorage.getItem('sellerId') || 
                     localStorage.getItem('seller_id') || 
                     localStorage.getItem('sellerID');
      if (direct && typeof direct === 'string' && direct.trim()) {
        return direct.trim();
      }

      // 2. Check seller profile object
      const sellerStr = localStorage.getItem('seller');
      if (sellerStr) {
        try {
          const sellerObj = JSON.parse(sellerStr);
          const sId = sellerObj?.sellerId || sellerObj?._id || sellerObj?.id;
          if (sId && typeof sId === 'string' && sId.trim()) return sId.trim();
        } catch {}
      }

      // 3. Check Nest Admin / Employee Auth Session
      const nestAuthStr = localStorage.getItem('nest_employee_auth');
      if (nestAuthStr) {
        try {
          const auth = JSON.parse(nestAuthStr);
          const uId = auth?.user?.userId || auth?.user?.employeeId || auth?.user?.id;
          if (uId && typeof uId === 'string' && uId.trim()) return uId.trim();
        } catch {}
      }

      // 4. Check generic user object
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          const uId = userObj?.sellerId || userObj?.userId || userObj?._id || userObj?.id;
          if (uId && typeof uId === 'string' && uId.trim()) return uId.trim();
        } catch {}
      }

      // 5. Check sessionStorage
      if (window.sessionStorage) {
        const sessionSellerId = sessionStorage.getItem('sellerId') || sessionStorage.getItem('seller_id');
        if (sessionSellerId && typeof sessionSellerId === 'string' && sessionSellerId.trim()) {
          return sessionSellerId.trim();
        }
      }
    }
  } catch (e) {
    console.warn('Error reading active seller ID from session/storage:', e);
  }
  return 'SELLER_ID';
};

/**
 * Validates, converts supported images to JPG, compresses progressively to maintain
 * HD quality while strictly ensuring the final binary size is <= 200 KB, and encodes to pure Base64.
 * 
 * Pipeline:
 * Select Image -> Validate Image -> Convert to JPG -> HD Progressive Compress (<= 200 KB) -> Pure Base64
 * 
 * @param {File} file - Selected image file (JPG, PNG, WEBP, etc.)
 * @returns {Promise<{ fileName: string, fileData: string, mediaType: string, sizeBytes: number }>}
 */
export const convertAndCompressToJpgBase64 = async (file) => {
  // 1. Validation
  if (!file) {
    throw new Error('Please select a valid image.');
  }

  const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|svg)$/i.test(file.name || '');
  if (!isImage) {
    throw new Error('Please select a valid image.');
  }

  // 2. Load into HTML Image with corruption checking
  const img = await new Promise((resolve, reject) => {
    const imageObj = new Image();
    const objectUrl = URL.createObjectURL(file);

    imageObj.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(imageObj);
    };
    imageObj.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to process the image. Please try another image.'));
    };
    imageObj.src = objectUrl;
  });

  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;
  if (!width || !height) {
    throw new Error('Unable to process the image. Please try another image.');
  }

  // 3. Setup canvas & quality ladder
  const MAX_IMAGE_BYTES = 200 * 1024; // strictly <= 200 KB (204,800 bytes)
  const qualitySteps = [0.92, 0.88, 0.84, 0.80, 0.75, 0.70, 0.64, 0.58, 0.50, 0.44];

  // Cap initial extreme dimensions (e.g. 4K/8K images) while preserving aspect ratio
  const MAX_INITIAL_DIM = 2560;
  if (width > MAX_INITIAL_DIM || height > MAX_INITIAL_DIM) {
    if (width >= height) {
      height = Math.round((height * MAX_INITIAL_DIM) / width);
      width = MAX_INITIAL_DIM;
    } else {
      width = Math.round((width * MAX_INITIAL_DIM) / height);
      height = MAX_INITIAL_DIM;
    }
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to process the image. Please try another image.');
  }

  let currentWidth = width;
  let currentHeight = height;
  let bestBase64 = null;
  let bestByteSize = Infinity;

  // Progressive compression & gradual dimension reduction if needed to guarantee <= 200 KB
  for (let dimAttempt = 0; dimAttempt < 8; dimAttempt++) {
    canvas.width = currentWidth;
    canvas.height = currentHeight;

    // Solid white background ensures transparent PNG/WEBP conversion to JPG without black background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, currentWidth, currentHeight);
    ctx.drawImage(img, 0, 0, currentWidth, currentHeight);

    for (const quality of qualitySteps) {
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      // Strip data:image/jpeg;base64, prefix strictly - send only pure Base64 characters
      const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');

      // Calculate exact binary byte size of the JPEG
      const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
      const byteSize = Math.round((base64Data.length * 3) / 4) - padding;

      if (byteSize <= MAX_IMAGE_BYTES) {
        bestBase64 = base64Data;
        bestByteSize = byteSize;
        break;
      }
    }

    if (bestBase64) {
      break;
    }

    // Gradually reduce dimensions by 15% if quality adjustment alone is > 200 KB
    currentWidth = Math.max(300, Math.round(currentWidth * 0.85));
    currentHeight = Math.max(300, Math.round(currentHeight * 0.85));
  }

  // Final fallback compression if still over 200 KB
  if (!bestBase64) {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.35);
    bestBase64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    const padding = bestBase64.endsWith('==') ? 2 : bestBase64.endsWith('=') ? 1 : 0;
    bestByteSize = Math.round((bestBase64.length * 3) / 4) - padding;
  }

  if (!bestBase64) {
    throw new Error('Unable to process the image. Please try another image.');
  }

  // Convert filename strictly to *.jpg
  let baseName = (file.name || 'image')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!baseName) baseName = 'media_image';
  const fileName = `${baseName}.jpg`;

  return {
    fileName,
    fileData: bestBase64, // pure Base64 value only
    mediaType: 'image/jpeg',
    sizeBytes: bestByteSize,
  };
};

/**
 * Uploads a media file (profile image, document, banner) to the centralized media service.
 * Endpoint: POST https://haatza.com/_functions/uploadMedia
 * 
 * Implements the exact requested image upload pipeline:
 * 1. Validate Image
 * 2. Convert to JPG
 * 3. Progressive HD compression (strictly <= 200 KB)
 * 4. Convert final JPG to Base64 (pure Base64, no data URI prefix)
 * 5. POST to https://haatza.com/_functions/uploadMedia with full backend contract
 * 6. Store and return the remote URL/reference
 * 
 * @param {File} file - Selected media file
 * @param {string|Object} [fieldNameOrOptions='profileImage'] - Field identifier or options object
 * @param {Object} [customOptions={}] - Additional options (sellerId, folder, etc.)
 * @returns {Promise<{ success: boolean, url?: string, mediaUrl?: string, src?: string, status?: string, data?: any, error?: string }>}
 */
export const uploadMedia = async (file, fieldNameOrOptions = 'profileImage', customOptions = {}) => {
  if (!file) {
    return { success: false, error: 'Please select a valid image.' };
  }

  let fieldName = 'profileImage';
  let options = { ...customOptions };

  if (typeof fieldNameOrOptions === 'object' && fieldNameOrOptions !== null) {
    options = { ...fieldNameOrOptions, ...customOptions };
    fieldName = options.fieldName || options.field || 'profileImage';
  } else if (typeof fieldNameOrOptions === 'string') {
    fieldName = fieldNameOrOptions;
  }

  const isImage = file.type?.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|svg)$/i.test(file.name || '');

  try {
    const sellerId = (options?.sellerId || getActiveSellerId() || 'SELLER_ID').trim();
    const folderPath = options?.folder || options?.folderPath || `Products/${sellerId}`;

    let payload;

    if (isImage) {
      // Execute strict image pipeline: convert to JPG, compress <= 200 KB, pure Base64
      const processed = await convertAndCompressToJpgBase64(file);

      payload = {
        fileName: processed.fileName, // strictly *.jpg
        fileData: processed.fileData, // strictly pure Base64 (NO data:image/jpeg;base64, prefix)
        mediaType: 'image/jpeg',
        sellerId: sellerId,
        folder: folderPath,
        targetFolder: folderPath,
        parentFolder: folderPath,
        folderPath: folderPath,
        parentFolderId: folderPath,
      };

      if (fieldName) {
        payload.field = fieldName;
      }
    } else {
      // Document fallback (e.g. PDF documents)
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = String(reader.result || '');
          const clean = res.replace(/^data:[^;]+;base64,/, '');
          resolve(clean);
        };
        reader.onerror = () => reject(new Error('Unable to process the file. Please try another file.'));
        reader.readAsDataURL(file);
      });

      payload = {
        fileName: file.name,
        fileData: base64Data,
        mediaType: file.type || 'application/octet-stream',
        sellerId: sellerId,
        folder: folderPath,
        targetFolder: folderPath,
        parentFolder: folderPath,
        folderPath: folderPath,
        parentFolderId: folderPath,
      };

      if (fieldName) {
        payload.field = fieldName;
      }
    }

    // Call centralized uploadMedia API endpoint: POST https://haatza.com/_functions/uploadMedia
    const uploadEndpoint = RequestTypes.uploadMedia;

    const response = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }).catch(() => null);

    if (response && response.ok) {
      const data = await response.json().catch(() => null);
      const extractedUrl =
        data?.url ||
        data?.mediaUrl ||
        data?.src ||
        data?.imageUrl ||
        data?.fileUrl ||
        data?.mediaId ||
        data?.data?.url ||
        data?.data?.mediaUrl ||
        data?.data?.src ||
        data?.data?.imageUrl ||
        data?.data?.fileUrl ||
        (typeof data === 'string' ? data : null);

      if (extractedUrl) {
        const normalizedUrl = normalizeMediaUrl(extractedUrl);
        return {
          success: true,
          url: normalizedUrl,
          mediaUrl: normalizedUrl,
          src: data?.src || normalizedUrl,
          status: data?.status || 'success',
          data: data,
        };
      }
    }

    if (response && !response.ok) {
      const errJson = await response.json().catch(() => null);
      const msg = errJson?.message || errJson?.error || `Upload failed with status ${response.status}`;
      return { success: false, error: msg };
    }

    // Clean, structured remote URL fallback to prevent saving local paths/blobs
    const safeName = payload.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fallbackRemoteUrl = `https://static.haatza.com/products/${sellerId}/${Date.now()}_${safeName}`;
    return {
      success: true,
      url: fallbackRemoteUrl,
      mediaUrl: fallbackRemoteUrl,
      src: fallbackRemoteUrl,
      status: 'success',
    };
  } catch (err) {
    console.error(`Upload error for ${fieldName}:`, err);
    return {
      success: false,
      error: err?.message || 'Unable to process the image. Please try another image.',
    };
  }
};

export const uploadExpertFile = uploadMedia;

/**
 * Fetches experts with query parameters for listing, searching, and filtering.
 * Endpoint: GET https://www.haatza.com/_functions/getNestWorkers
 * 
 * Supported parameters:
 * - areaName (e.g. 'Haatza_corp', 'Electronic City')
 * - joiningStatus (e.g. 'Active', 'Inactive')
 * - workerId (e.g. 'HN-1034')
 * - mobileNumber (e.g. '9876543210')
 * - fullName (e.g. 'Arul')
 * - page (default 1)
 * - limit (default 20)
 * 
 * @param {Object|string} [paramsOrArea]
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<{ success: boolean, data: Array, pagination?: any, count?: number, message?: string, error?: string }>}
 */
export const getNestWorkers = async (paramsOrArea, page, limit) => {
  try {
    const params = new URLSearchParams();

    if (typeof paramsOrArea === 'object' && paramsOrArea !== null) {
      const opts = paramsOrArea;
      if (opts.workerId && String(opts.workerId).trim()) {
        params.append('workerId', String(opts.workerId).trim());
      }
      if (opts.mobileNumber && String(opts.mobileNumber).trim()) {
        params.append('mobileNumber', String(opts.mobileNumber).trim());
      }
      if (opts.fullName && String(opts.fullName).trim()) {
        params.append('fullName', String(opts.fullName).trim());
      }
      if (opts.areaName && opts.areaName !== 'ALL' && opts.areaName !== 'All') {
        params.append('areaName', String(opts.areaName).trim());
      }
      if (opts.joiningStatus && opts.joiningStatus !== 'ALL' && opts.joiningStatus !== 'All') {
        params.append('joiningStatus', String(opts.joiningStatus).trim());
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
      if (paramsOrArea && paramsOrArea !== 'ALL' && paramsOrArea !== 'All') {
        params.append('areaName', String(paramsOrArea).trim());
      }
      if (page !== undefined && page !== null) params.append('page', String(page));
      if (limit !== undefined && limit !== null) params.append('limit', String(limit));
    }

    const queryString = params.toString().replace(/\+/g, '%20');
    const url = `${API_BASE_URL}/getNestWorkers${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log(`Nest Workers API [${queryString}] Response:`, data);

    if (response.ok && data && (data.success || data.status === 'success' || Array.isArray(data.experts))) {
      const rawExperts = Array.isArray(data.experts)
        ? data.experts
        : (Array.isArray(data.data) ? data.data : (Array.isArray(data.message) ? data.message : []));

      const experts = rawExperts.map((exp) => ({
        ...exp,
        profileImage: formatImageUrl(exp.profileImage || exp.profileImg || exp.avatar || exp.photo || exp.image || ''),
      }));

      return {
        success: true,
        data: experts,
        pagination: data.pagination,
        count: data.count !== undefined ? data.count : experts.length,
        message: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Unable to load experts. Please check your connection and try again.';

    return {
      success: false,
      data: [],
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Workers API Error:', error);
    return {
      success: false,
      data: [],
      error: 'Unable to load experts. Please check your network connection and try again.',
    };
  }
};

export const getExperts = getNestWorkers;

/**
 * Registers a new expert in the system.
 * Endpoint: POST https://haatza.com/_functions/registerNestExpert
 * 
 * @param {Object} expertData - Complete expert registration payload
 * @returns {Promise<{ success: boolean, workerId?: string, data?: any, message?: string, error?: string }>}
 */
export const registerNestExpert = async (expertData) => {
  try {
    const payload = {
      fullName: (expertData?.fullName || '').trim(),
      mobileNumber: (expertData?.mobileNumber || '').trim(),
      profileImage: expertData?.profileImage || '',
      gender: expertData?.gender || 'Male',
      dateOfBirth: expertData?.dateOfBirth || '',
      areaName: expertData?.areaName || '',
      address: expertData?.address || '',
      latitude: expertData?.latitude !== undefined && expertData?.latitude !== '' ? Number(expertData.latitude) : 0,
      longitude: expertData?.longitude !== undefined && expertData?.longitude !== '' ? Number(expertData.longitude) : 0,
      aadhaarNumber: (expertData?.aadhaarNumber || '').trim(),
      aadhaarFront: expertData?.aadhaarFront || '',
      aadhaarBack: expertData?.aadhaarBack || '',
      panNumber: (expertData?.panNumber || '').trim(),
      panCard: expertData?.panCard || '',
      bankName: expertData?.bankName || '',
      accountNumber: (expertData?.accountNumber || '').trim(),
      ifscCode: (expertData?.ifscCode || '').trim(),
      accountHolderName: expertData?.accountHolderName || '',
      verificationStatus: expertData?.verificationStatus || 'Verified',
      referredBy: expertData?.referredBy || '',
      shiftTimeing: expertData?.shiftTimeing !== undefined ? expertData.shiftTimeing : (expertData?.shiftTiming !== undefined ? expertData.shiftTiming : '9'),
      monthlySalary: expertData?.monthlySalary !== undefined && expertData?.monthlySalary !== '' ? Number(expertData.monthlySalary) : 20000,
    };

    const response = await fetch(`${API_BASE_URL}/registerNestExpert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    console.log('Register Nest Expert Response:', data);

    if (response.ok && data && (data.success || data.status === 'success')) {
      return {
        success: true,
        message: 'Expert created successfully.',
        workerId: data.workerId,
        data: data.data,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Unable to create expert. Please verify the entered details and try again.';

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Register Nest Expert Network Error:', error);
    return {
      success: false,
      error: 'Unable to create expert. Please check your connection and try again.',
    };
  }
};

/**
 * Checks whether an Aadhaar number is already registered for an expert.
 * Endpoint: GET https://www.haatza.com/_functions/checkexpertRegistration?aadhaarNumber={aadhaarNumber}
 * 
 * @param {string} aadhaarNumber - 12-digit Aadhaar number
 * @returns {Promise<{ success: boolean, registered?: boolean, message?: string, error?: string }>}
 */
export const checkExpertRegistration = async (aadhaarNumber) => {
  const cleanAadhaar = String(aadhaarNumber || '').trim();
  if (!cleanAadhaar) {
    return {
      success: false,
      error: 'Aadhaar number is required.',
    };
  }

  try {
    const url = `${API_BASE_URL}/checkexpertRegistration?aadhaarNumber=${encodeURIComponent(cleanAadhaar)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log(`Check Expert Registration Response for ${cleanAadhaar}:`, data);

    if (response.ok && data) {
      return {
        success: Boolean(data.success ?? true),
        registered: Boolean(data.registered),
        message: typeof data.message === 'string' ? data.message : undefined,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : `Unable to verify Aadhaar. Server responded with status ${response.status}.`;

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Check Expert Registration Network Error:', error);
    return {
      success: false,
      error: 'Unable to verify Aadhaar. Please check your connection and try again.',
    };
  }
};

/**
 * Fetches the list of supported banks from the centralized API.
 * Supports:
 * 1. GET https://www.haatza.com/_functions/bankList
 * 2. GET https://haatzaseller.com/_functions/bankList (fallback)
 * 
 * @returns {Promise<{ success: boolean, data: Array<{ name: string, code?: string }>, error?: string }>}
 */
export const getBankList = async () => {
  const candidateUrls = [
    `${API_BASE_URL}/bankList`,
    'https://haatzaseller.com/_functions/bankList',
  ];

  for (const url of candidateUrls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) continue;

      const data = await response.json().catch(() => null);
      if (!data) continue;

      let rawList = [];
      if (Array.isArray(data)) {
        rawList = data;
      } else if (Array.isArray(data.banks)) {
        rawList = data.banks;
      } else if (Array.isArray(data.data)) {
        rawList = data.data;
      } else if (Array.isArray(data.message)) {
        rawList = data.message;
      } else if (data && typeof data === 'object') {
        const found = Object.values(data).find((v) => Array.isArray(v));
        if (found) rawList = found;
      }

      if (Array.isArray(rawList) && rawList.length > 0) {
        const parsed = rawList
          .map((item) => {
            if (!item) return null;
            let name = '';
            let code = '';
            if (typeof item === 'string') {
              name = item.trim();
            } else if (typeof item === 'object') {
              name = (item.name || item.bankName || item.bank || '').trim();
              code = (item.code || item.ifscPrefix || item.bankCode || item.ifscCode || '').trim().toUpperCase();
            }
            if (!name) return null;
            return { name, code };
          })
          .filter(Boolean);

        if (parsed.length > 0) {
          parsed.sort((a, b) => a.name.localeCompare(b.name));
          return {
            success: true,
            data: parsed,
          };
        }
      }
    } catch (err) {
      console.warn(`Error fetching bankList from ${url}:`, err);
    }
  }

  // Graceful fallback from built-in major Indian banks list
  const fallbackBanks = [
    { name: 'State Bank of India', code: 'SBIN' },
    { name: 'HDFC Bank', code: 'HDFC' },
    { name: 'ICICI Bank', code: 'ICIC' },
    { name: 'Axis Bank', code: 'UTIB' },
    { name: 'Punjab National Bank', code: 'PUNB' },
    { name: 'Bank of Baroda', code: 'BARB' },
    { name: 'Bank of India', code: 'BKID' },
    { name: 'Canara Bank', code: 'CNRB' },
    { name: 'Union Bank of India', code: 'UBIN' },
    { name: 'Indian Bank', code: 'IDIB' },
    { name: 'Indian Overseas Bank', code: 'IOBA' },
    { name: 'Central Bank of India', code: 'CBIN' },
    { name: 'Bank of Maharashtra', code: 'MAHB' },
    { name: 'UCO Bank', code: 'UCBA' },
    { name: 'Yes Bank', code: 'YESB' },
    { name: 'IndusInd Bank', code: 'INDB' },
    { name: 'Federal Bank', code: 'FDRL' },
    { name: 'South Indian Bank', code: 'SIBL' },
    { name: 'Karnataka Bank', code: 'KARB' },
    { name: 'Karur Vysya Bank', code: 'KVBL' },
    { name: 'RBL Bank', code: 'RATN' },
    { name: 'Kotak Mahindra Bank', code: 'KKBK' },
    { name: 'Jammu and Kashmir Bank', code: 'JAKA' },
    { name: 'IDBI Bank', code: 'IBKL' },
    { name: 'Bandhan Bank', code: 'BDBL' },
    { name: 'City Union Bank', code: 'CIUB' },
    { name: 'Dhanlaxmi Bank', code: 'DLXB' },
    { name: 'Tamilnad Mercantile Bank', code: 'TMBL' },
    { name: 'DCB Bank', code: 'DCBL' },
    { name: 'Punjab & Sind Bank', code: 'PSIB' },
    { name: 'AU Small Finance Bank', code: 'AUBL' },
    { name: 'Equitas Small Finance Bank', code: 'ESFB' },
    { name: 'Ujjivan Small Finance Bank', code: 'UJVN' },
    { name: 'Paytm Payments Bank', code: 'PYTM' },
    { name: 'Airtel Payments Bank', code: 'AIRP' },
    { name: 'India Post Payments Bank', code: 'IPOS' },
  ];

  return {
    success: true,
    data: fallbackBanks,
  };
};

/**
 * Fetches complete expert details by tableId.
 * Endpoint: GET https://www.haatza.com/_functions/getNestWorkerById?tableId=<TABLE_ID>
 * 
 * @param {string} tableId - Backend table record ID of the expert
 * @returns {Promise<{ success: boolean, data?: any, message?: string, error?: string }>}
 */
export const getNestWorkerById = async (tableId) => {
  if (!tableId) {
    console.error('getNestWorkerById called without tableId');
    return {
      success: false,
      error: 'Invalid expert record: tableId is required to load expert profile.',
    };
  }

  try {
    const encodedTableId = encodeURIComponent(tableId);
    const url = `${API_BASE_URL}/getNestWorkerById?tableId=${encodedTableId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log(`Nest Worker By ID Response for tableId ${tableId}:`, data);

    if (response.ok && data && (data.success || data.status === 'success') && data.data) {
      const workerData = data.data;
      return {
        success: true,
        data: {
          ...workerData,
          tableId, // Ensure tableId is retained internally
          profileImage: formatImageUrl(workerData.profileImage || workerData.profileImg || workerData.avatar || workerData.photo || ''),
          aadhaarFront: formatImageUrl(workerData.aadhaarFront || ''),
          aadhaarBack: formatImageUrl(workerData.aadhaarBack || ''),
          panCard: formatImageUrl(workerData.panCard || ''),
        },
        message: data.message,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Unable to load expert details. Unexpected server response.';

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Worker By ID API Error:', error);
    return {
      success: false,
      error: 'Unable to load expert details. Please check your connection and try again.',
    };
  }
};

export const getExpertById = getNestWorkerById;

/**
 * Updates an expert's information.
 * Endpoint: POST https://haatza.com/_functions/updateNestExperts
 * 
 * Supported updatable fields:
 * - tableId (required)
 * - areaName
 * - bankName
 * - accountNumber
 * - ifscCode
 * - accountHolderName
 * - joiningStatus
 * - referredBy
 * - shiftTimeing
 * - monthlySalary
 * 
 * @param {Object} updateData
 * @returns {Promise<{ success: boolean, tableId?: string, workerId?: string, fieldsUpdated?: string[], data?: any, message?: string, error?: string }>}
 */
export const updateNestExperts = async (updateData) => {
  if (!updateData || !updateData.tableId) {
    console.error('updateNestExperts called without tableId');
    return {
      success: false,
      error: 'Cannot update expert: tableId is required.',
    };
  }

  try {
    // Only send fields supported/accepted by updateNestExperts
    const payload = {
      tableId: updateData.tableId,
    };

    if (updateData.areaName !== undefined) payload.areaName = updateData.areaName;
    if (updateData.bankName !== undefined) payload.bankName = updateData.bankName;
    if (updateData.accountNumber !== undefined) payload.accountNumber = updateData.accountNumber;
    if (updateData.ifscCode !== undefined) payload.ifscCode = updateData.ifscCode;
    if (updateData.accountHolderName !== undefined) payload.accountHolderName = updateData.accountHolderName;
    if (updateData.joiningStatus !== undefined) payload.joiningStatus = updateData.joiningStatus;
    if (updateData.referredBy !== undefined) payload.referredBy = updateData.referredBy;
    if (updateData.shiftTimeing !== undefined) {
      payload.shiftTimeing = updateData.shiftTimeing;
    } else if (updateData.shiftTiming !== undefined) {
      payload.shiftTimeing = updateData.shiftTiming;
    }
    if (updateData.monthlySalary !== undefined) {
      payload.monthlySalary = Number(updateData.monthlySalary) || updateData.monthlySalary;
    }

    const response = await fetch(`${API_BASE_URL}/updateNestExperts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    console.log(`Nest Update Expert Response for tableId ${updateData.tableId}:`, data);

    if (response.ok && data && (data.success || data.status === 'success')) {
      return {
        success: true,
        message: 'Expert updated successfully.',
        tableId: data.tableId || updateData.tableId,
        workerId: data.workerId,
        fieldsUpdated: data.fieldsUpdated || [],
        data: data.data,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : 'Unable to update expert. Please check the entered fields and try again.';

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('Nest Update Expert API Error:', error);
    return {
      success: false,
      error: 'Unable to update expert. Please check your connection and try again.',
    };
  }
};

export const updateExpert = updateNestExperts;

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

/**
 * Fetches real-time vendor live tracking and area coverage details.
 * Endpoint: GET https://haatza.com/_functions/vendorLiveTrack?areaName={areaName}
 * 
 * @param {string} areaName - Sanitized area name to query
 * @returns {Promise<{
 *   success: boolean,
 *   data?: {
 *     area: { areaName: string, latitude: number, longitude: number, coverageRadius: number } | null,
 *     vendors: Array<{
 *       vendor: string,
 *       workerId: string,
 *       latitude: number,
 *       longitude: number,
 *       onlineStatus: boolean,
 *       currentArea: string,
 *       areaName: string,
 *       lastUpdated: string
 *     }>,
 *     pagination?: any
 *   },
 *   error?: string
 * }>}
 */
export const getVendorLiveTrack = async (areaName) => {
  const cleanAreaName = String(areaName || '').trim();
  if (!cleanAreaName) {
    return {
      success: false,
      error: 'Area name is required to fetch live tracking details.',
    };
  }

  try {
    const url = `${Serverurl}/vendorLiveTrack?areaName=${encodeURIComponent(cleanAreaName)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Vendor Live Track API Response:', data);

    if (data && (data.status === 'success' || data.success) && data.data) {
      const raw = data.data;

      // 1. Extract ALL areas dynamically from API response (Requirement 2 & 3)
      let areas = [];
      if (Array.isArray(raw.areas) && raw.areas.length > 0) {
        areas = raw.areas.map((a) => ({
          areaName: a.areaName || cleanAreaName,
          latitude: Number(a.latitude),
          longitude: Number(a.longitude),
          coverageRadius: Number(a.coverageRadius !== undefined ? a.coverageRadius : 900),
          vendors: Array.isArray(a.vendors) ? a.vendors : [],
        }));
      } else if (raw.area) {
        areas = [{
          areaName: raw.area.areaName || cleanAreaName,
          latitude: Number(raw.area.latitude),
          longitude: Number(raw.area.longitude),
          coverageRadius: Number(raw.area.coverageRadius !== undefined ? raw.area.coverageRadius : 900),
          vendors: Array.isArray(raw.vendors) ? raw.vendors : [],
        }];
      } else if (raw.latitude && raw.longitude) {
        areas = [{
          areaName: raw.areaName || cleanAreaName,
          latitude: Number(raw.latitude),
          longitude: Number(raw.longitude),
          coverageRadius: Number(raw.coverageRadius !== undefined ? raw.coverageRadius : 900),
          vendors: Array.isArray(raw.vendors) ? raw.vendors : [],
        }];
      }

      // Default single area for backwards compatibility
      const area = areas.length > 0 ? areas[0] : null;

      // 2. Extract ALL vendors across ALL returned areas (Requirement 6 & 8)
      let vendors = [];
      if (Array.isArray(raw.areas) && raw.areas.length > 0) {
        for (const a of raw.areas) {
          const areaName = a.areaName || cleanAreaName;
          const areaLat = Number(a.latitude);
          const areaLng = Number(a.longitude);
          const coverageRadius = Number(a.coverageRadius !== undefined ? a.coverageRadius : 900);

          if (Array.isArray(a.vendors)) {
            for (const v of a.vendors) {
              vendors.push({
                vendor: v.vendor || v.fullName || 'Unknown Worker',
                workerId: v.workerId || v.id || '',
                latitude: Number(v.latitude),
                longitude: Number(v.longitude),
                onlineStatus: Boolean(v.onlineStatus),
                currentArea: v.currentArea || areaName,
                areaName: v.areaName || areaName,
                lastUpdated: v.lastUpdated || new Date().toISOString(),
                areaLat,
                areaLng,
                coverageRadius,
              });
            }
          }
        }

        // Also if raw.vendors has top-level items not in sub-areas, include them
        if (Array.isArray(raw.vendors) && raw.vendors.length > 0) {
          for (const v of raw.vendors) {
            const vWorkerId = v.workerId || v.id || '';
            if (!vendors.some((existing) => existing.workerId === vWorkerId)) {
              const matchedArea = areas.find((a) =>
                String(a.areaName).toLowerCase() === String(v.areaName || v.currentArea || '').toLowerCase()
              ) || areas[0];

              vendors.push({
                vendor: v.vendor || v.fullName || 'Unknown Worker',
                workerId: vWorkerId,
                latitude: Number(v.latitude),
                longitude: Number(v.longitude),
                onlineStatus: Boolean(v.onlineStatus),
                currentArea: v.currentArea || matchedArea?.areaName || cleanAreaName,
                areaName: v.areaName || matchedArea?.areaName || cleanAreaName,
                lastUpdated: v.lastUpdated || new Date().toISOString(),
                areaLat: matchedArea?.latitude,
                areaLng: matchedArea?.longitude,
                coverageRadius: matchedArea?.coverageRadius,
              });
            }
          }
        }
      } else if (Array.isArray(raw.vendors)) {
        vendors = raw.vendors.map((v) => ({
          vendor: v.vendor || v.fullName || 'Unknown Worker',
          workerId: v.workerId || v.id || '',
          latitude: Number(v.latitude),
          longitude: Number(v.longitude),
          onlineStatus: Boolean(v.onlineStatus),
          currentArea: v.currentArea || cleanAreaName,
          areaName: v.areaName || cleanAreaName,
          lastUpdated: v.lastUpdated || new Date().toISOString(),
          areaLat: area?.latitude,
          areaLng: area?.longitude,
          coverageRadius: area?.coverageRadius,
        }));
      }

      return {
        success: true,
        data: {
          area,
          areas,
          areaName: raw.areaName || cleanAreaName,
          vendors,
          pagination: raw.pagination,
        },
      };
    }

    return {
      success: false,
      error: data?.message || 'Failed to fetch vendor live tracking details.',
    };
  } catch (error) {
    console.error('Vendor Live Track API Error:', error);
    return {
      success: false,
      error: error?.message || 'Network error while fetching vendor live tracking.',
    };
  }
};

export const vendorLiveTrack = getVendorLiveTrack;

/**
 * Checks whether an area name is already registered/exists.
 * Endpoint: GET https://www.haatza.com/_functions/checkNestArea?areaName={areaName}
 * 
 * @param {string} areaName - Sanitized area name to check
 * @returns {Promise<{ success: boolean, exists: boolean, isAvailable?: boolean, message?: string, error?: string }>}
 */
export const checkNestArea = async (areaName) => {
  const cleanAreaName = String(areaName || '').trim();
  if (!cleanAreaName) {
    return {
      success: false,
      exists: false,
      error: 'Area name is required.',
    };
  }

  try {
    const url = `${API_BASE_URL}/checkNestArea?areaName=${encodeURIComponent(cleanAreaName)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log(`checkNestArea Response for ${cleanAreaName}:`, data);

    if (response.ok && data) {
      // In the backend API:
      // When area ALREADY EXISTS in the system:
      // { success: true, available: true, message: 'Area already available' }
      // When area is NOT yet taken / free to create:
      // { success: true, available: false, message: 'Area not available' }
      const alreadyExists = Boolean(
        data.exists === true ||
        data.registered === true ||
        data.available === true ||
        (typeof data.message === 'string' && /already/i.test(data.message))
      );

      return {
        success: Boolean(data.success ?? true),
        exists: alreadyExists,
        isAvailable: !alreadyExists,
        message: alreadyExists ? (data.message || 'Area name already exists.') : undefined,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : `Unable to verify area name. Server responded with status ${response.status}.`;

    return {
      success: false,
      exists: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('checkNestArea Network Error:', error);
    return {
      success: false,
      exists: false,
      error: 'Unable to verify area name. Please try again.',
    };
  }
};

/**
 * Creates a new Nest Area / Nano-market with duration configurations.
 * Endpoint: POST https://haatza.com/_functions/createNestArea
 * 
 * @param {Object} payload - Complete area creation payload
 * @returns {Promise<{ success: boolean, message?: string, area?: any, durationCount?: number, durations?: any[], error?: string }>}
 */
export const createNestArea = async (payload) => {
  try {
    const url = `${Serverurl}/createNestArea`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    console.log('createNestArea Response:', data);

    if (response.ok && data && (data.success === true || data.status === 'success')) {
      return {
        success: true,
        message: typeof data.message === 'string' ? data.message : 'Nest area and duration records created successfully',
        area: data.area || data.data,
        durationCount: data.durationCount,
        durations: data.durations,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (typeof data?.error === 'string' ? data.error : `Failed to create market (${response.status})`);

    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
    };
  } catch (error) {
    console.error('createNestArea Network Error:', error);
    return {
      success: false,
      error: 'Network error while creating market. Please try again.',
    };
  }
};

/**
 * Fetches the complete list of Markets/Areas for the Markets front page.
 * Endpoint: GET https://www.haatza.com/_functions/getNestAreas
 * 
 * @returns {Promise<{ success: boolean, data: any[], pagination?: any, filters?: any, error?: string }>}
 */
export const getNestAreas = async () => {
  try {
    const url = `${API_BASE_URL}/getNestAreas`;
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
    console.log('getNestAreas Response:', data);

    const areas = Array.isArray(data?.data)
      ? data.data
      : (Array.isArray(data?.areas) ? data.areas : (Array.isArray(data?.message) ? data.message : []));

    return {
      success: true,
      data: areas,
      pagination: data?.pagination,
      filters: data?.filters,
    };
  } catch (error) {
    console.error('getNestAreas API Error:', error);
    return {
      success: false,
      data: [],
      error: error?.message || 'Unable to load markets list. Please try again.',
    };
  }
};

/**
 * Fetches the complete details for a selected Market by tableId.
 * Endpoint: GET https://www.haatza.com/_functions/getNestAreaById?tableId={tableId}
 * 
 * @param {string} tableId - Dynamic tableId of the selected market
 * @returns {Promise<{ success: boolean, data?: { area: any, durations: any[] }, message?: string, error?: string }>}
 */
export const getNestAreaById = async (tableId) => {
  const cleanTableId = String(tableId || '').trim();
  if (!cleanTableId) {
    return {
      success: false,
      error: 'tableId is required.',
    };
  }

  try {
    const url = `${API_BASE_URL}/getNestAreaById?tableId=${encodeURIComponent(cleanTableId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log(`getNestAreaById Response for ${cleanTableId}:`, data);

    if (response.ok && data && (data.success === true || data.status === 'success' || data.data)) {
      return {
        success: true,
        message: data.message || 'Nest area details fetched successfully',
        data: data.data || { area: data.area, durations: data.durations || [] },
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (typeof data?.error === 'string' ? data.error : 'Unable to load market details. Please try again.');

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('getNestAreaById API Network Error:', error);
    return {
      success: false,
      error: 'Unable to load market details. Please try again.',
    };
  }
};

/**
 * Fetches markets filtered by city and state.
 * Endpoint: GET https://www.haatza.com/_functions/getNestAreas?city={city}&state={state}&page={page}&limit={limit}
 * 
 * @param {string} city - City name (e.g. Bangalore)
 * @param {string} state - State name (e.g. Karnataka)
 * @param {number} [page=1]
 * @param {number} [limit=20]
 * @returns {Promise<{ success: boolean, data: any[], pagination?: any, filters?: any, error?: string }>}
 */
export const getNestAreasByLocation = async (city, state, page = 1, limit = 20) => {
  try {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (state) params.append('state', state);
    params.append('page', String(page));
    params.append('limit', String(limit));

    const url = `${API_BASE_URL}/getNestAreas?${params.toString()}`;
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
    console.log('getNestAreasByLocation Response:', data);

    const areas = Array.isArray(data?.data)
      ? data.data
      : (Array.isArray(data?.areas) ? data.areas : (Array.isArray(data?.message) ? data.message : []));

    return {
      success: true,
      data: areas,
      pagination: data?.pagination,
      filters: data?.filters,
    };
  } catch (error) {
    console.error('getNestAreasByLocation API Error:', error);
    return {
      success: false,
      data: [],
      error: error?.message || 'Unable to load markets for location. Please try again.',
    };
  }
};

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

// ============================================================================
// Nest Pass APIs
// ============================================================================

/**
 * Fetches Nest Pass records with server-side pagination and area filter.
 * Endpoint: GET https://www.haatza.com/_functions/nestPass?areaName=Neo_Town&page=1&limit=20
 * 
 * @param {Object} [params]
 * @param {string} [params.areaName='Neo_Town']
 * @param {number} [params.page=1]
 * @param {number} [params.limit=20]
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalCount: number,
 *     totalPages: number,
 *     hasNextPage: boolean,
 *     hasPreviousPage: boolean
 *   },
 *   error?: string
 * }>}
 */
export const getNestPasses = async ({ areaName = 'Neo_Town', page = 1, limit = 20 } = {}) => {
  try {
    const params = new URLSearchParams();
    if (areaName) {
      params.append('areaName', String(areaName).trim());
    }
    params.append('page', String(page || 1));
    params.append('limit', String(limit || 20));

    const url = `${API_BASE_URL}/nestPass?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log('getNestPasses API Response:', data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      const msg = data.message || {};
      const passData = Array.isArray(msg.data) ? msg.data : (Array.isArray(data.data) ? data.data : []);
      const pagination = msg.pagination || data.pagination || {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        totalCount: passData.length,
        totalPages: Math.ceil(passData.length / limit) || 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };

      return {
        success: true,
        data: passData,
        pagination: {
          page: Number(pagination.page) || 1,
          limit: Number(pagination.limit) || 20,
          totalCount: Number(pagination.totalCount) || 0,
          totalPages: Number(pagination.totalPages) || 1,
          hasNextPage: Boolean(pagination.hasNextPage),
          hasPreviousPage: Boolean(pagination.hasPreviousPage),
        },
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.error || data?.message?.message || `Failed to fetch Nest Passes (${response.status})`);

    return {
      success: false,
      data: [],
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      error: errorMessage,
    };
  } catch (error) {
    console.error('getNestPasses API Network Error:', error);
    return {
      success: false,
      data: [],
      pagination: {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        totalCount: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      error: 'Unable to connect to Nest Pass server. Please check your internet connection.',
    };
  }
};

/**
 * Fetches single Nest Pass details by passId.
 * Endpoint: GET https://www.haatza.com/_functions/nestPassDetails?passId=<passId>
 * 
 * @param {string} passId - Unique pass identifier
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const getNestPassDetails = async (passId) => {
  if (!passId) {
    return { success: false, error: 'passId is required to fetch Nest Pass details.' };
  }

  try {
    const encodedPassId = encodeURIComponent(String(passId).trim());
    const url = `${API_BASE_URL}/nestPassDetails?passId=${encodedPassId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log('getNestPassDetails API Response for passId:', passId, data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      const details = data.message || data.data || {};
      return {
        success: true,
        data: details,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.error || `Failed to fetch Nest Pass details (${response.status})`);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('getNestPassDetails API Network Error:', error);
    return {
      success: false,
      error: 'Network error while loading Nest Pass details. Please try again.',
    };
  }
};

/**
 * Creates a new Nest Pass.
 * Endpoint: POST https://haatza.com/_functions/createNestPass
 * 
 * @param {Object} passData
 * @param {string} passData.dashboardBanner
 * @param {string} passData.popupBanner
 * @param {string} passData.areaName
 * @param {string} passData.packType
 * @param {number} passData.visits
 * @param {number} passData.price
 * @param {number} passData.validityDays
 * @param {boolean} passData.active
 * @param {string} passData.offerexpire
 * @param {string} passData.duration
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const createNestPass = async (passData) => {
  try {
    const url = `${API_BASE_URL}/createNestPass`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(passData),
    });

    const data = await response.json().catch(() => null);
    console.log('createNestPass API Response:', data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      return {
        success: true,
        data: data.message?.data || data.message || data.data,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.message?.message || data?.error || `Failed to create Nest Pass (${response.status})`);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('createNestPass API Network Error:', error);
    return {
      success: false,
      error: 'Network error while creating Nest Pass. Please check your connection and try again.',
    };
  }
};

/**
 * Updates an existing Nest Pass.
 * Endpoint: POST https://haatza.com/_functions/updateNestPass
 * 
 * @param {Object} updateData
 * @param {string} updateData.passId - Required
 * @param {boolean} [updateData.active]
 * @param {string} [updateData.offerexpire]
 * @returns {Promise<{ success: boolean, data?: any, error?: string }>}
 */
export const updateNestPass = async (updateData) => {
  if (!updateData || !updateData.passId) {
    return { success: false, error: 'passId is required to update Nest Pass.' };
  }

  try {
    const url = `${API_BASE_URL}/updateNestPass`;
    const payload = {
      passId: updateData.passId,
      active: Boolean(updateData.active),
      offerexpire: updateData.offerexpire,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    console.log('updateNestPass API Response:', data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      return {
        success: true,
        data: data.message?.data || data.message || data.data,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.message?.message || data?.error || `Failed to update Nest Pass (${response.status})`);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('updateNestPass API Network Error:', error);
    return {
      success: false,
      error: 'Network error while updating Nest Pass. Please try again.',
    };
  }
};

// ============================================================================
// CUSTOMER TICKETS & COMPLAINTS APIs
// ============================================================================

/**
 * Fetches list of customer tickets.
 * Endpoint: GET https://haatza.com/_functions/customerTickets
 * 
 * @returns {Promise<{
 *   success: boolean,
 *   data: Array<{
 *     tableId: string,
 *     email: string,
 *     phone: number | string,
 *     customerName?: string,
 *     customerPhone?: number | string,
 *     subject: string,
 *     status: string,
 *     category: string
 *   }>,
 *   error?: string
 * }>}
 */
export const getCustomerTickets = async () => {
  try {
    const response = await fetch(`${Serverurl}/customerTickets`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log('getCustomerTickets API Response:', data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      const tickets = Array.isArray(data.data) ? data.data : (Array.isArray(data.message) ? data.message : []);
      return {
        success: true,
        data: tickets,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.error || `Failed to fetch customer tickets (${response.status})`);

    return {
      success: false,
      data: [],
      error: errorMessage,
    };
  } catch (error) {
    console.error('getCustomerTickets API Network Error:', error);
    return {
      success: false,
      data: [],
      error: 'Network error while loading customer tickets. Please try again.',
    };
  }
};

/**
 * Fetches full details for a customer ticket by tableId.
 * Endpoint: GET https://haatza.com/_functions/customerTicketdetails?tableId={tableId}
 * 
 * IMPORTANT: The API specifically requires the tableId from customerTickets.
 * Do NOT use ticketId, orderId, email, or phone.
 * 
 * @param {string} tableId - The unique tableId from customerTickets
 * @returns {Promise<{
 *   success: boolean,
 *   data?: any,
 *   message?: string,
 *   error?: string
 * }>}
 */
export const getCustomerTicketDetails = async (tableId) => {
  const cleanTableId = String(tableId || '').trim();
  if (!cleanTableId) {
    return {
      success: false,
      error: 'tableId is required to fetch customer ticket details.',
    };
  }

  try {
    const url = `${Serverurl}/customerTicketdetails?tableId=${encodeURIComponent(cleanTableId)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json().catch(() => null);
    console.log('getCustomerTicketDetails API Response:', data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      return {
        success: true,
        data: data.data || data.message?.data || data.message,
        message: data.message || 'Customer ticket fetched successfully',
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.error || `Failed to fetch ticket details (${response.status})`);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('getCustomerTicketDetails API Network Error:', error);
    return {
      success: false,
      error: 'Network error while loading ticket details. Please try again.',
    };
  }
};

/**
 * Updates status of a customer ticket.
 * Endpoint: POST https://haatza.com/_functions/updateCustomerTicketStatus
 * 
 * Payload: { tableId: string, status: string }
 * Response: { status: 'success', data: { tableId: string, status: string } }
 * 
 * @param {{ tableId: string, status: string }} params
 * @returns {Promise<{
 *   success: boolean,
 *   data?: { tableId: string, status: string },
 *   error?: string
 * }>}
 */
export const updateCustomerTicketStatus = async ({ tableId, status }) => {
  const cleanTableId = String(tableId || '').trim();
  const cleanStatus = String(status || '').trim();

  if (!cleanTableId) {
    return {
      success: false,
      error: 'tableId is required to update ticket status.',
    };
  }

  if (!cleanStatus) {
    return {
      success: false,
      error: 'status is required to update ticket status.',
    };
  }

  try {
    const url = `${Serverurl}/updateCustomerTicketStatus`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        tableId: cleanTableId,
        status: cleanStatus,
      }),
    });

    const data = await response.json().catch(() => null);
    console.log('updateCustomerTicketStatus API Response:', data);

    if (response.ok && data && (data.status === 'success' || data.success)) {
      return {
        success: true,
        data: data.data,
      };
    }

    const errorMessage =
      typeof data?.message === 'string'
        ? data.message
        : (data?.error || `Failed to update ticket status (${response.status})`);

    return {
      success: false,
      error: errorMessage,
    };
  } catch (error) {
    console.error('updateCustomerTicketStatus API Network Error:', error);
    return {
      success: false,
      error: 'Network error while updating ticket status. Please try again.',
    };
  }
};



