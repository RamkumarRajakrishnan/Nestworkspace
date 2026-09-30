import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Compass,
  ShieldCheck,
  ChevronDown,
  Search,
  Sparkles,
  Zap,
  Tag
} from 'lucide-react';
import {
  checkNestArea,
  createNestArea,
  CreateNestAreaPayload,
  CreateNestAreaDuration,
} from '../../services/api';
import { useOperations } from '../../context/OperationsContext';

interface CreateMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// 29 Official States of India (Union Territories excluded)
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

// Popular Indian Cities
const INDIAN_CITIES = [
  'Bangalore',
  'Mumbai',
  'Pune',
  'Hyderabad',
  'Chennai',
  'Delhi',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Noida',
  'Gurgaon',
  'Chandigarh',
  'Indore',
  'Kochi',
  'Coimbatore',
  'Lucknow',
];

// Working Hours presets
const WORKING_HOURS_OPTIONS = [
  '7:00 AM - 7:00 PM',
  '8:00 AM - 7:00 PM',
  '9:00 AM - 7:00 PM',
  '7:00 AM - 8:00 PM',
  '8:00 AM - 8:00 PM',
  '6:00 AM - 10:00 PM',
  '24 Hours',
];

// Supported Duration Presets: 30 Mins up to 4 Hours
const DURATION_PRESETS = [
  { label: '30 Mins', value: '30', displayTime: '30 Mins' },
  { label: '45 Mins', value: '45', displayTime: '45 Mins' },
  { label: '60 Mins', value: '60', displayTime: '60 Mins' },
  { label: '1.5 Hrs', value: '90', displayTime: '1.5 Hrs' },
  { label: '2 Hrs', value: '120', displayTime: '2 Hrs' },
  { label: '2.5 Hrs', value: '150', displayTime: '2.5 Hrs' },
  { label: '3 Hrs', value: '180', displayTime: '3 Hrs' },
  { label: '3.5 Hrs', value: '210', displayTime: '3.5 Hrs' },
  { label: '4 Hrs', value: '240', displayTime: '4 Hrs' },
];

const BADGE_OPTIONS = ['', 'Popular', 'New', 'Offer', 'Best Value'];

interface DurationFormItem {
  id: string; // local client key
  duration: string; // minute string "60"
  displayTime: string;
  price: string;
  originalPrice: string;
  firstTimeUser: string;
  secoundtimeuser: string;
  regularUser: string;
  badge: string;
  isActive: boolean;
}

export const CreateMarketModal: React.FC<CreateMarketModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast, refreshMarkets } = useOperations();

  // Form State - ALL FIELDS START EMPTY BY DEFAULT
  const [areaName, setAreaName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [coverageRadius, setCoverageRadius] = useState('');
  const [surgePricing, setSurgePricing] = useState('');
  const [priorityArea, setPriorityArea] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [workingHours, setWorkingHours] = useState('');
  const [workersAvailable, setWorkersAvailable] = useState(true);
  const [estimatedTimeInMinutes, setEstimatedTimeInMinutes] = useState('');
  const [nearestWorkerDistanceMeters, setNearestWorkerDistanceMeters] = useState('');

  // Durations State - starts with one completely empty duration item
  const [durations, setDurations] = useState<DurationFormItem[]>([
    {
      id: 'dur-1',
      duration: '',
      displayTime: '',
      price: '',
      originalPrice: '',
      firstTimeUser: '',
      secoundtimeuser: '',
      regularUser: '',
      badge: '',
      isActive: true,
    },
  ]);

  // Validation & Area Check State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [areaNameStatus, setAreaNameStatus] = useState<'idle' | 'checking' | 'available' | 'duplicate' | 'error'>('idle');
  const [areaNameMessage, setAreaNameMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Dropdown UI States
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState(false);
  const [stateSearchTerm, setStateSearchTerm] = useState('');
  const [isHoursDropdownOpen, setIsHoursDropdownOpen] = useState(false);

  const cityDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const hoursDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target as Node)) {
        setIsStateDropdownOpen(false);
      }
      if (hoursDropdownRef.current && !hoursDropdownRef.current.contains(e.target as Node)) {
        setIsHoursDropdownOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Reset form when modal opens - ALL FIELDS MUST START EMPTY
  useEffect(() => {
    if (isOpen) {
      setAreaName('');
      setCity('');
      setState('');
      setCountry('');
      setPincode('');
      setLatitude('');
      setLongitude('');
      setCoverageRadius('');
      setSurgePricing('');
      setPriorityArea(true);
      setIsActive(true);
      setWorkingHours('');
      setWorkersAvailable(true);
      setEstimatedTimeInMinutes('');
      setNearestWorkerDistanceMeters('');
      setDurations([
        {
          id: `dur-${Date.now()}`,
          duration: '',
          displayTime: '',
          price: '',
          originalPrice: '',
          firstTimeUser: '',
          secoundtimeuser: '',
          regularUser: '',
          badge: '',
          isActive: true,
        },
      ]);
      setErrors({});
      setAreaNameStatus('idle');
      setAreaNameMessage('');
      setIsSubmitting(false);
      setGeneralError('');
      setCitySearchTerm('');
      setStateSearchTerm('');
      setIsCityDropdownOpen(false);
      setIsStateDropdownOpen(false);
      setIsHoursDropdownOpen(false);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  // Check Area Name API (Debounced & On Blur)
  const verifyAreaName = useCallback(async (nameToCheck: string) => {
    const trimmed = nameToCheck.trim();
    if (!trimmed) {
      setAreaNameStatus('idle');
      setAreaNameMessage('');
      return false;
    }

    setAreaNameStatus('checking');
    setAreaNameMessage('Checking availability...');

    try {
      const res = await checkNestArea(trimmed);
      if (res.success) {
        if (res.exists) {
          setAreaNameStatus('duplicate');
          const msg = res.message || 'Area name already exists.';
          setAreaNameMessage(msg);
          setErrors((prev) => ({ ...prev, areaName: msg }));
          return false;
        } else {
          setAreaNameStatus('available');
          setAreaNameMessage('Area name is available');
          setErrors((prev) => {
            const next = { ...prev };
            delete next.areaName;
            return next;
          });
          return true;
        }
      } else {
        setAreaNameStatus('error');
        const msg = res.error || 'Unable to verify area name. Please try again.';
        setAreaNameMessage(msg);
        setErrors((prev) => ({ ...prev, areaName: msg }));
        return false;
      }
    } catch {
      setAreaNameStatus('error');
      const msg = 'Unable to verify area name. Please try again.';
      setAreaNameMessage(msg);
      setErrors((prev) => ({ ...prev, areaName: msg }));
      return false;
    }
  }, []);

  // Debounced area name check when typing
  useEffect(() => {
    if (!areaName.trim()) {
      setAreaNameStatus('idle');
      setAreaNameMessage('');
      return;
    }

    const timer = setTimeout(() => {
      verifyAreaName(areaName);
    }, 550);

    return () => clearTimeout(timer);
  }, [areaName, verifyAreaName]);

  // Area Name Input Change with strict sanitization [A-Za-z0-9_]
  const handleAreaNameChange = (raw: string) => {
    // Only allow Letters, Numbers, and Underscore. No spaces, symbols, or emojis.
    const sanitized = raw.replace(/[^A-Za-z0-9_]/g, '');
    setAreaName(sanitized);

    // Clear previous duplicate/error while typing until debounce fires
    if (!sanitized) {
      setAreaNameStatus('idle');
      setAreaNameMessage('');
      setErrors((prev) => ({ ...prev, areaName: 'Area name is required' }));
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.areaName;
        return next;
      });
    }
  };

  // Pincode Input Handler: digits only, max 6
  const handlePincodeChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 6);
    setPincode(digitsOnly);
    if (digitsOnly.length === 6 && /^[1-9][0-9]{5}$/.test(digitsOnly)) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.pincode;
        return next;
      });
    }
  };

  // Coordinate sanitization (Latitude / Longitude) - allows digits, optional single leading '-', optional single '.'
  const sanitizeCoordinateInput = (raw: string) => {
    let clean = raw.replace(/[^0-9.-]/g, '');
    const isNegative = clean.startsWith('-');
    clean = clean.replace(/-/g, '');
    if (isNegative) clean = '-' + clean;
    const parts = clean.split('.');
    if (parts.length > 2) {
      clean = parts[0] + '.' + parts.slice(1).join('');
    }
    return clean;
  };

  // Whole Number / Integer sanitization (Coverage Radius, Surge Pricing, Estimated Time, Distance, Prices)
  const sanitizeIntegerInput = (raw: string) => {
    return raw.replace(/\D/g, '');
  };

  // Badge input sanitization (letters, numbers, spaces only - reject symbols/emojis)
  const sanitizeBadgeInput = (raw: string) => {
    return raw.replace(/[^A-Za-z0-9 ]/g, '');
  };

  // Duration helpers
  const handleAddDuration = (presetValue?: string) => {
    const preset = presetValue ? DURATION_PRESETS.find((p) => p.value === presetValue) : undefined;

    // Check if already added
    if (preset && durations.some((d) => d.duration === preset.value)) {
      addToast('Duration Exists', `${preset.label} is already added in duration list.`, 'warning');
      return;
    }

    const newItem: DurationFormItem = {
      id: `dur-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      duration: preset ? preset.value : '',
      displayTime: preset ? preset.displayTime : '',
      price: '',
      originalPrice: '',
      firstTimeUser: '',
      secoundtimeuser: '',
      regularUser: '',
      badge: '',
      isActive: true,
    };

    setDurations((prev) => [...prev, newItem]);
  };

  const handleRemoveDuration = (id: string) => {
    if (durations.length <= 1) {
      addToast('Required Field', 'At least one duration record must be configured.', 'warning');
      return;
    }
    setDurations((prev) => prev.filter((d) => d.id !== id));
  };

  const updateDurationItem = (id: string, updates: Partial<DurationFormItem>) => {
    setDurations((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
    );
  };

  // Validate entire form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // 1. Area Name
    if (!areaName.trim()) {
      newErrors.areaName = 'Area name is required';
    } else if (areaNameStatus === 'duplicate') {
      newErrors.areaName = areaNameMessage || 'Area name already exists.';
    } else if (areaNameStatus === 'error') {
      newErrors.areaName = 'Unable to verify area name. Please try again.';
    }

    // 2. City & State & Country
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors.state = 'State is required';
    if (!country.trim()) {
      newErrors.country = 'Country is required';
    } else if (country !== 'India') {
      newErrors.country = 'Country must be India';
    }

    // 3. Pincode: 6 digits, first digit 1-9
    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      newErrors.pincode = 'Please enter a valid 6-digit Indian pincode.';
    }

    // 4. Latitude: -90 to 90
    if (!latitude.trim()) {
      newErrors.latitude = 'Latitude is required';
    } else {
      const latNum = parseFloat(latitude);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        newErrors.latitude = 'Please enter a valid latitude between -90 and 90.';
      }
    }

    // 5. Longitude: -180 to 180
    if (!longitude.trim()) {
      newErrors.longitude = 'Longitude is required';
    } else {
      const lngNum = parseFloat(longitude);
      if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
        newErrors.longitude = 'Please enter a valid longitude between -180 and 180.';
      }
    }

    // 6. Coverage Radius: whole numbers, max 1000m
    if (!coverageRadius.trim()) {
      newErrors.coverageRadius = 'Coverage radius is required';
    } else {
      const radiusNum = parseInt(coverageRadius, 10);
      if (isNaN(radiusNum) || radiusNum <= 0) {
        newErrors.coverageRadius = 'Please enter a valid coverage radius in meters.';
      } else if (radiusNum > 1000) {
        newErrors.coverageRadius = 'Coverage radius cannot exceed 1000 meters.';
      }
    }

    // 7. Surge Pricing: whole numbers
    if (!surgePricing.trim()) {
      newErrors.surgePricing = 'Surge pricing is required';
    } else {
      const surgeNum = parseInt(surgePricing, 10);
      if (isNaN(surgeNum) || surgeNum <= 0) {
        newErrors.surgePricing = 'Please enter a valid surge pricing value.';
      }
    }

    // 8. Working Hours
    if (!workingHours.trim()) {
      newErrors.workingHours = 'Working hours is required';
    }

    // 9. Worker metrics
    if (!estimatedTimeInMinutes.trim()) {
      newErrors.estimatedTimeInMinutes = 'Estimated time is required';
    } else {
      const estNum = parseInt(estimatedTimeInMinutes, 10);
      if (isNaN(estNum) || estNum <= 0) {
        newErrors.estimatedTimeInMinutes = 'Please enter a valid estimated time in minutes.';
      }
    }

    if (!nearestWorkerDistanceMeters.trim()) {
      newErrors.nearestWorkerDistanceMeters = 'Nearest worker distance is required';
    } else {
      const distNum = parseInt(nearestWorkerDistanceMeters, 10);
      if (isNaN(distNum) || distNum <= 0) {
        newErrors.nearestWorkerDistanceMeters = 'Please enter a valid nearest worker distance.';
      }
    }

    // 10. Durations
    if (!durations || durations.length === 0) {
      newErrors.durations = 'At least one duration record must be added.';
    } else {
      const selectedDurations = durations.map((d) => d.duration).filter(Boolean);
      const duplicates = selectedDurations.filter((val, index) => selectedDurations.indexOf(val) !== index);
      if (duplicates.length > 0) {
        newErrors.durations = 'Duplicate durations are not allowed. Please choose unique durations.';
      }

      durations.forEach((d, idx) => {
        if (!d.duration) {
          newErrors[`dur_duration_${idx}`] = 'Duration is required';
        }
        if (!d.price.trim() || isNaN(parseInt(d.price, 10)) || parseInt(d.price, 10) < 0) {
          newErrors[`dur_price_${idx}`] = 'Valid price is required';
        }
        if (!d.originalPrice.trim() || isNaN(parseInt(d.originalPrice, 10)) || parseInt(d.originalPrice, 10) < 0) {
          newErrors[`dur_originalPrice_${idx}`] = 'Valid original price is required';
        }
        if (!d.firstTimeUser.trim() || isNaN(parseInt(d.firstTimeUser, 10)) || parseInt(d.firstTimeUser, 10) < 0) {
          newErrors[`dur_firstTimeUser_${idx}`] = 'Valid first-time user price is required';
        }
        if (!d.secoundtimeuser.trim() || isNaN(parseInt(d.secoundtimeuser, 10)) || parseInt(d.secoundtimeuser, 10) < 0) {
          newErrors[`dur_secoundtimeuser_${idx}`] = 'Valid second-time user price is required';
        }
        if (!d.regularUser.trim() || isNaN(parseInt(d.regularUser, 10)) || parseInt(d.regularUser, 10) < 0) {
          newErrors[`dur_regularUser_${idx}`] = 'Valid regular user price is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');

    // Pre-check area name verification if not done yet
    if (areaName.trim() && areaNameStatus !== 'available') {
      const isAvailable = await verifyAreaName(areaName);
      if (!isAvailable) {
        return;
      }
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Build duration records with exact property names (including "secoundtimeuser")
      const mappedDurations: CreateNestAreaDuration[] = durations.map((d, index) => {
        const priceInt = parseInt(d.price, 10);
        const originalPriceInt = parseInt(d.originalPrice, 10);
        const firstTimeUserInt = parseInt(d.firstTimeUser, 10);
        const secoundtimeuserInt = parseInt(d.secoundtimeuser, 10);
        const regularUserInt = parseInt(d.regularUser, 10);

        return {
          duration: d.duration,
          price: priceInt,
          originalPrice: originalPriceInt,
          isActive: Boolean(d.isActive),
          sequence: index + 1,
          badge: d.badge ? d.badge.trim() : '',
          displayTime: d.displayTime || `${d.duration} Mins`,
          startTime: '00:00.0',
          endTime: '00:00.0',
          firstTimeUser: firstTimeUserInt,
          secoundtimeuser: secoundtimeuserInt, // Preserved exact backend spelling!
          regularUser: regularUserInt,
        };
      });

      const payload: CreateNestAreaPayload = {
        areaName: areaName.trim(),
        city: city.trim(),
        state: state.trim(),
        country: country.trim(),
        pincode: parseInt(pincode, 10),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        coverageRadius: parseInt(coverageRadius, 10),
        surgePricing: parseInt(surgePricing, 10),
        priorityArea: Boolean(priorityArea),
        isActive: Boolean(isActive),
        workingHours: workingHours.trim(),
        workersAvailable: Boolean(workersAvailable),
        estimatedTimeInMinutes: parseInt(estimatedTimeInMinutes, 10),
        nearestWorkerDistanceMeters: parseInt(nearestWorkerDistanceMeters, 10),
        durations: mappedDurations,
      };

      const result = await createNestArea(payload);

      if (result.success) {
        addToast(
          'Market Created',
          result.message || `Nest Area "${areaName}" created successfully with ${mappedDurations.length} duration records.`,
          'success'
        );
        // Refresh markets list so newly created market appears immediately
        await refreshMarkets();
        if (onSuccess) onSuccess();
        onClose();
      } else {
        const errorMsg = result.message || result.error || 'Failed to create market. Please try again.';
        setGeneralError(errorMsg);
        addToast('Creation Failed', errorMsg, 'error');
      }
    } catch (err: any) {
      console.error('Error creating market:', err);
      const errorMsg = err?.message || 'Unexpected network error. Please try again.';
      setGeneralError(errorMsg);
      addToast('Error', errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filteredCities = citySearchTerm.trim()
    ? INDIAN_CITIES.filter((c) => c.toLowerCase().includes(citySearchTerm.toLowerCase()))
    : INDIAN_CITIES;

  const filteredStates = stateSearchTerm.trim()
    ? INDIAN_STATES.filter((s) => s.toLowerCase().includes(stateSearchTerm.toLowerCase()))
    : INDIAN_STATES;

  return (
    <div className="fixed top-16 bottom-0 right-0 left-0 md:left-[var(--sidebar-width,15rem)] z-30 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop inside content area */}
      <div
        className="absolute inset-0 bg-[#1F1F1F]/40 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-label="Close modal"
      />

      {/* Modal Dialog Box */}
      <div className="relative z-10 w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg transition-all overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#EEEEF2] bg-[#FAF9FC] p-4 sm:p-5 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#5B21B6]/10 text-[#5B21B6]">
                <MapPin className="h-4 w-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#1F1F1F]">Create New Market</h2>
            </div>
            <p className="mt-1 text-xs text-[#6B6B6B]">
              Configure a new nano-market, operational geographic boundaries, and customer duration pricing.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl p-1.5 text-[#6B6B6B] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors cursor-pointer disabled:opacity-50"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* General API error banner */}
          {generalError && (
            <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <div className="flex-1 font-medium">{generalError}</div>
            </div>
          )}

          {/* SECTION 1: Market Core Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B21B6]">
              <Compass className="h-3.5 w-3.5" />
              <span>1. Market Identity & Location</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Area Name Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  Area Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={areaName}
                    onChange={(e) => handleAreaNameChange(e.target.value)}
                    onBlur={() => {
                      if (areaName.trim()) verifyAreaName(areaName);
                    }}
                    placeholder="Enter area name"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] transition-all focus:outline-none ${
                      errors.areaName
                        ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                        : areaNameStatus === 'available'
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:bg-white focus:ring-2 focus:ring-[#5B21B6]/15'
                    }`}
                  />

                  {/* Indicator Icon */}
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                    {areaNameStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#5B21B6]" />
                    )}
                    {areaNameStatus === 'available' && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    {(areaNameStatus === 'duplicate' || areaNameStatus === 'error') && (
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                </div>

                {/* Inline Area Name Error or Success */}
                {errors.areaName ? (
                  <p className="text-[11px] font-medium text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{errors.areaName}</span>
                  </p>
                ) : areaNameStatus === 'available' ? (
                  <p className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>{areaNameMessage || 'Area name is available'}</span>
                  </p>
                ) : (
                  <p className="text-[10px] text-[#6B6B6B]">
                    Letters, numbers, and underscore only. Spaces and other symbols are not allowed.
                  </p>
                )}
              </div>

              {/* City Dropdown */}
              <div className="space-y-1.5" ref={cityDropdownRef}>
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  City <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs font-semibold transition-all text-left ${
                      errors.city
                        ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400 text-[#1F1F1F]'
                        : 'border-[#EEEEF2] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
                    }`}
                  >
                    <span className={city ? 'text-[#1F1F1F]' : 'text-[#9E9E9E]'}>
                      {city || 'Select city'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#6B6B6B] transition-transform ${
                        isCityDropdownOpen ? 'rotate-180 text-[#5B21B6]' : ''
                      }`}
                    />
                  </button>

                  {isCityDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-[#EEEEF2] bg-[#FAF9FC]">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
                          <input
                            type="text"
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                            placeholder="Search city..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#EEEEF2] text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#5B21B6]"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
                        {filteredCities.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCity(c);
                              setIsCityDropdownOpen(false);
                              setCitySearchTerm('');
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.city;
                                return next;
                              });
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                              city === c
                                ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#5B21B6]'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.city && <p className="text-[11px] text-rose-600">{errors.city}</p>}
              </div>

              {/* State Dropdown (All 29 States) */}
              <div className="space-y-1.5" ref={stateDropdownRef}>
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  State <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStateDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs font-semibold transition-all text-left ${
                      errors.state
                        ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400 text-[#1F1F1F]'
                        : 'border-[#EEEEF2] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
                    }`}
                  >
                    <span className={state ? 'text-[#1F1F1F]' : 'text-[#9E9E9E]'}>
                      {state || 'Select state'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-[#6B6B6B] transition-transform ${
                        isStateDropdownOpen ? 'rotate-180 text-[#5B21B6]' : ''
                      }`}
                    />
                  </button>

                  {isStateDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
                      <div className="p-2 border-b border-[#EEEEF2] bg-[#FAF9FC]">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
                          <input
                            type="text"
                            value={stateSearchTerm}
                            onChange={(e) => setStateSearchTerm(e.target.value)}
                            placeholder="Search state..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#EEEEF2] text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#5B21B6]"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
                        {filteredStates.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setState(s);
                              setIsStateDropdownOpen(false);
                              setStateSearchTerm('');
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next.state;
                                return next;
                              });
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                              state === s
                                ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                                : 'text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#5B21B6]'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {errors.state && <p className="text-[11px] text-rose-600">{errors.state}</p>}
              </div>

              {/* Country Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  Country <span className="text-rose-500">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => {
                    setCountry(e.target.value);
                    if (e.target.value) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.country;
                        return next;
                      });
                    }
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold bg-[#FAF9FC] transition-all focus:outline-none cursor-pointer ${
                    errors.country
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400 text-[#1F1F1F]'
                      : country
                      ? 'border-[#EEEEF2] text-[#1F1F1F] focus:border-[#5B21B6] focus:bg-white focus:ring-2 focus:ring-[#5B21B6]/15'
                      : 'border-[#EEEEF2] text-[#9E9E9E] focus:border-[#5B21B6] focus:bg-white focus:ring-2 focus:ring-[#5B21B6]/15'
                  }`}
                >
                  <option value="">Select country</option>
                  <option value="India">India</option>
                </select>
                {errors.country && <p className="text-[11px] text-rose-600">{errors.country}</p>}
                <p className="text-[10px] text-[#6B6B6B]">Operational scope is strictly within India.</p>
              </div>

              {/* Pincode Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  Pincode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => handlePincodeChange(e.target.value)}
                  placeholder="Enter pincode"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] transition-all focus:outline-none ${
                    errors.pincode
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                      : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:bg-white focus:ring-2 focus:ring-[#5B21B6]/15'
                  }`}
                />
                {errors.pincode && (
                  <p className="text-[11px] font-medium text-rose-600">{errors.pincode}</p>
                )}
              </div>

              {/* Working Hours Dropdown */}
              <div className="space-y-1.5" ref={hoursDropdownRef}>
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  Working Hours <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsHoursDropdownOpen((prev) => !prev)}
                    className={`w-full flex items-center justify-between rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs font-semibold transition-all text-left ${
                      errors.workingHours
                        ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400 text-[#1F1F1F]'
                        : 'border-[#EEEEF2] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#5B21B6]" />
                      <span className={workingHours ? 'text-[#1F1F1F]' : 'text-[#9E9E9E]'}>
                        {workingHours || 'Select working hours'}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 text-[#6B6B6B] transition-transform ${
                        isHoursDropdownOpen ? 'rotate-180 text-[#5B21B6]' : ''
                      }`}
                    />
                  </button>

                  {isHoursDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-40 rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg animate-in fade-in zoom-in-95 flex flex-col overflow-hidden p-1.5 space-y-0.5">
                      {WORKING_HOURS_OPTIONS.map((h) => (
                        <button
                          key={h}
                          type="button"
                          onClick={() => {
                            setWorkingHours(h);
                            setIsHoursDropdownOpen(false);
                            setErrors((prev) => {
                              const next = { ...prev };
                              delete next.workingHours;
                              return next;
                            });
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                            workingHours === h
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                              : 'text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#5B21B6]'
                          }`}
                        >
                          {h}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.workingHours && <p className="text-[11px] text-rose-600">{errors.workingHours}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 2: Geographic Coordinates & Dispatch Radius */}
          <div className="space-y-4 border-t border-[#EEEEF2] pt-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B21B6]">
              <MapPin className="h-3.5 w-3.5" />
              <span>2. Geography & Dispatch Telemetry</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Latitude */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  Latitude (-90 to 90) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => {
                    setLatitude(sanitizeCoordinateInput(e.target.value));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.latitude;
                      return next;
                    });
                  }}
                  placeholder="Enter latitude"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] transition-all focus:outline-none ${
                    errors.latitude
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                      : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:bg-white focus:ring-2 focus:ring-[#5B21B6]/15'
                  }`}
                />
                {errors.latitude && (
                  <p className="text-[11px] font-medium text-rose-600">{errors.latitude}</p>
                )}
              </div>

              {/* Longitude */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">
                  Longitude (-180 to 180) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => {
                    setLongitude(sanitizeCoordinateInput(e.target.value));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.longitude;
                      return next;
                    });
                  }}
                  placeholder="Enter longitude"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] transition-all focus:outline-none ${
                    errors.longitude
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                      : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:bg-white focus:ring-2 focus:ring-[#5B21B6]/15'
                  }`}
                />
                {errors.longitude && (
                  <p className="text-[11px] font-medium text-rose-600">{errors.longitude}</p>
                )}
              </div>

              {/* Coverage Radius */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1F1F1F]">
                    Coverage Radius (meters) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#6B6B6B] font-mono">Max 1000m</span>
                </div>
                <input
                  type="text"
                  value={coverageRadius}
                  onChange={(e) => {
                    setCoverageRadius(sanitizeIntegerInput(e.target.value));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.coverageRadius;
                      return next;
                    });
                  }}
                  placeholder="Enter coverage radius"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] transition-all focus:outline-none ${
                    errors.coverageRadius
                      ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
                      : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:bg-white focus:ring-2 focus:ring-[#5B21B6]/15'
                  }`}
                />
                {errors.coverageRadius && (
                  <p className="text-[11px] font-medium text-rose-600">{errors.coverageRadius}</p>
                )}
              </div>
            </div>

            {/* Operational Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Surge Pricing */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">Surge Pricing Multiplier</label>
                <input
                  type="text"
                  value={surgePricing}
                  onChange={(e) => {
                    setSurgePricing(sanitizeIntegerInput(e.target.value));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.surgePricing;
                      return next;
                    });
                  }}
                  placeholder="Enter surge pricing"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] focus:outline-none ${
                    errors.surgePricing ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400' : 'border-[#EEEEF2] focus:border-[#5B21B6]'
                  }`}
                />
                {errors.surgePricing && (
                  <p className="text-[11px] text-rose-600">{errors.surgePricing}</p>
                )}
              </div>

              {/* Estimated Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">Estimated Time (Minutes)</label>
                <input
                  type="text"
                  value={estimatedTimeInMinutes}
                  onChange={(e) => {
                    setEstimatedTimeInMinutes(sanitizeIntegerInput(e.target.value));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.estimatedTimeInMinutes;
                      return next;
                    });
                  }}
                  placeholder="Enter estimated time"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#5B21B6] ${
                    errors.estimatedTimeInMinutes ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400' : 'border-[#EEEEF2]'
                  }`}
                />
                {errors.estimatedTimeInMinutes && (
                  <p className="text-[11px] text-rose-600">{errors.estimatedTimeInMinutes}</p>
                )}
              </div>

              {/* Nearest Worker Distance */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#1F1F1F]">Nearest Worker Distance (meters)</label>
                <input
                  type="text"
                  value={nearestWorkerDistanceMeters}
                  onChange={(e) => {
                    setNearestWorkerDistanceMeters(sanitizeIntegerInput(e.target.value));
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.nearestWorkerDistanceMeters;
                      return next;
                    });
                  }}
                  placeholder="Enter nearest worker distance"
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono text-[#1F1F1F] bg-[#FAF9FC] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#5B21B6] ${
                    errors.nearestWorkerDistanceMeters ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400' : 'border-[#EEEEF2]'
                  }`}
                />
                {errors.nearestWorkerDistanceMeters && (
                  <p className="text-[11px] text-rose-600">{errors.nearestWorkerDistanceMeters}</p>
                )}
              </div>
            </div>

            {/* Boolean Toggles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC]">
                <div>
                  <div className="text-xs font-bold text-[#1F1F1F]">Active Status</div>
                  <div className="text-[10px] text-[#6B6B6B]">Accept bookings in this market</div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isActive ? 'bg-[#5B21B6]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Priority Area Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC]">
                <div>
                  <div className="text-xs font-bold text-[#1F1F1F]">Priority Area</div>
                  <div className="text-[10px] text-[#6B6B6B]">Prioritize in dispatch allocation</div>
                </div>
                <button
                  type="button"
                  onClick={() => setPriorityArea((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    priorityArea ? 'bg-[#5B21B6]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      priorityArea ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Workers Available Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC]">
                <div>
                  <div className="text-xs font-bold text-[#1F1F1F]">Workers Available</div>
                  <div className="text-[10px] text-[#6B6B6B]">Experts pool active for routing</div>
                </div>
                <button
                  type="button"
                  onClick={() => setWorkersAvailable((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    workersAvailable ? 'bg-[#5B21B6]' : 'bg-[#D1D5DB]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      workersAvailable ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Durations & Pricing Configuration */}
          <div className="space-y-4 border-t border-[#EEEEF2] pt-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5B21B6]">
                  <span className="font-bold text-sm leading-none font-mono text-[#5B21B6]">₹</span>
                  <span>3. Duration Tiers & User Pricing</span>
                </div>
                <p className="text-[11px] text-[#6B6B6B] mt-0.5">
                  Configure supported booking intervals and customer tier pricing for this market.
                </p>
              </div>

              {/* Add Duration Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6B6B6B]">Add Interval:</span>
                <div className="relative">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddDuration(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="rounded-xl border border-[#5B21B6]/30 bg-[#EDE9FE] px-3 py-1.5 text-xs font-semibold text-[#5B21B6] hover:bg-[#DDD6FE] transition-colors focus:outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      Select duration
                    </option>
                    {DURATION_PRESETS.map((preset) => (
                      <option
                        key={preset.value}
                        value={preset.value}
                        disabled={durations.some((d) => d.duration === preset.value)}
                      >
                        {preset.label} {durations.some((d) => d.duration === preset.value) ? '(Added)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {errors.durations && (
              <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{errors.durations}</span>
              </p>
            )}

            {/* Durations Cards List */}
            <div className="space-y-3">
              {durations.map((item, index) => {
                const durationError = errors[`dur_duration_${index}`];
                const priceError = errors[`dur_price_${index}`];
                const origPriceError = errors[`dur_originalPrice_${index}`];
                const firstUserError = errors[`dur_firstTimeUser_${index}`];
                const secoundUserError = errors[`dur_secoundtimeuser_${index}`];
                const regularUserError = errors[`dur_regularUser_${index}`];

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#EEEEF2] bg-[#FAF9FC] p-4 transition-all hover:border-[#DDD6FE] space-y-3"
                  >
                    {/* Duration Card Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEEEF2] pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#5B21B6] text-[11px] font-bold text-white font-mono">
                          #{index + 1}
                        </span>
                        <div className="text-sm font-bold text-[#1F1F1F] flex items-center gap-2">
                          <span>{item.displayTime || 'Duration'}</span>
                          {item.duration && (
                            <span className="text-[11px] font-mono text-[#6B6B6B]">({item.duration} Mins)</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Active Toggle for this Duration */}
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#1F1F1F]">
                          <span className="text-[11px] text-[#6B6B6B]">
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateDurationItem(item.id, { isActive: !item.isActive })}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              item.isActive ? 'bg-[#5B21B6]' : 'bg-[#D1D5DB]'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                item.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        {/* Remove Duration Button */}
                        {durations.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDuration(item.id)}
                            className="rounded-lg p-1 text-[#6B6B6B] hover:bg-rose-100 hover:text-rose-700 transition-colors"
                            title="Remove duration"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2-Row Aligned Inputs */}
                    <div className="space-y-4">
                      {/* Row 1: Duration, Standard Price, Original Price, Badge */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* Duration */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#1F1F1F]">
                            Duration <span className="text-rose-500">*</span>
                          </label>
                          <select
                            value={item.duration}
                            onChange={(e) => {
                              const val = e.target.value;
                              const preset = DURATION_PRESETS.find((p) => p.value === val);
                              updateDurationItem(item.id, {
                                duration: val,
                                displayTime: preset ? preset.displayTime : '',
                              });
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next[`dur_duration_${index}`];
                                delete next.durations;
                                return next;
                              });
                            }}
                            className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold bg-white focus:outline-none cursor-pointer ${
                              durationError
                                ? 'border-rose-400 bg-rose-50/40 text-[#1F1F1F]'
                                : item.duration
                                ? 'border-[#EEEEF2] text-[#1F1F1F] focus:border-[#5B21B6]'
                                : 'border-[#EEEEF2] text-[#9E9E9E] focus:border-[#5B21B6]'
                            }`}
                          >
                            <option value="">Select duration</option>
                            {DURATION_PRESETS.map((preset) => (
                              <option
                                key={preset.value}
                                value={preset.value}
                                disabled={durations.some((d) => d.id !== item.id && d.duration === preset.value)}
                              >
                                {preset.label}
                              </option>
                            ))}
                          </select>
                          {durationError && (
                            <p className="text-[10px] text-rose-600">{durationError}</p>
                          )}
                        </div>

                        {/* Price (Standard) */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#1F1F1F]">
                            Price (₹) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.price}
                            onChange={(e) => {
                              updateDurationItem(item.id, {
                                price: sanitizeIntegerInput(e.target.value),
                              });
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next[`dur_price_${index}`];
                                return next;
                              });
                            }}
                            placeholder="Enter price"
                            className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-[#1F1F1F] bg-white placeholder:text-[#9E9E9E] focus:outline-none ${
                              priceError ? 'border-rose-400 bg-rose-50/40' : 'border-[#EEEEF2] focus:border-[#5B21B6]'
                            }`}
                          />
                          {priceError && <p className="text-[10px] text-rose-600">{priceError}</p>}
                        </div>

                        {/* Original Price */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#1F1F1F]">
                            Original Price (₹) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.originalPrice}
                            onChange={(e) => {
                              updateDurationItem(item.id, {
                                originalPrice: sanitizeIntegerInput(e.target.value),
                              });
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next[`dur_originalPrice_${index}`];
                                return next;
                              });
                            }}
                            placeholder="Enter original price"
                            className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-[#1F1F1F] bg-white placeholder:text-[#9E9E9E] focus:outline-none ${
                              origPriceError ? 'border-rose-400 bg-rose-50/40' : 'border-[#EEEEF2] focus:border-[#5B21B6]'
                            }`}
                          />
                          {origPriceError && <p className="text-[10px] text-rose-600">{origPriceError}</p>}
                        </div>

                        {/* Badge */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#1F1F1F]">Badge</label>
                          <input
                            type="text"
                            value={item.badge}
                            onChange={(e) =>
                              updateDurationItem(item.id, {
                                badge: sanitizeBadgeInput(e.target.value),
                              })
                            }
                            placeholder="Enter badge"
                            className="w-full rounded-xl border border-[#EEEEF2] bg-white px-3 py-2 text-xs font-medium text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#5B21B6]"
                          />
                        </div>
                      </div>

                      {/* Row 2: Customer Tier Pricing (First-Time, Second-Time, Regular) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-[#EEEEF2]/80">
                        {/* First-Time User Price */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#1F1F1F]">
                            First-Time User Price (₹) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.firstTimeUser}
                            onChange={(e) => {
                              updateDurationItem(item.id, {
                                firstTimeUser: sanitizeIntegerInput(e.target.value),
                              });
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next[`dur_firstTimeUser_${index}`];
                                return next;
                              });
                            }}
                            placeholder="Enter first-time user price"
                            className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-[#1F1F1F] bg-white placeholder:text-[#9E9E9E] focus:outline-none ${
                              firstUserError ? 'border-rose-400 bg-rose-50/40' : 'border-[#EEEEF2] focus:border-[#5B21B6]'
                            }`}
                          />
                          {firstUserError && <p className="text-[10px] text-rose-600">{firstUserError}</p>}
                        </div>

                        {/* Second-Time User Price */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#1F1F1F]">
                            Second-Time User Price (₹) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.secoundtimeuser}
                            onChange={(e) => {
                              updateDurationItem(item.id, {
                                secoundtimeuser: sanitizeIntegerInput(e.target.value),
                              });
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next[`dur_secoundtimeuser_${index}`];
                                return next;
                              });
                            }}
                            placeholder="Enter second-time user price"
                            className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-[#1F1F1F] bg-white placeholder:text-[#9E9E9E] focus:outline-none ${
                              secoundUserError ? 'border-rose-400 bg-rose-50/40' : 'border-[#EEEEF2] focus:border-[#5B21B6]'
                            }`}
                          />
                          {secoundUserError && <p className="text-[10px] text-rose-600">{secoundUserError}</p>}
                        </div>

                        {/* Regular User Price */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-[#1F1F1F]">
                            Regular User Price (₹) <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={item.regularUser}
                            onChange={(e) => {
                              updateDurationItem(item.id, {
                                regularUser: sanitizeIntegerInput(e.target.value),
                              });
                              setErrors((prev) => {
                                const next = { ...prev };
                                delete next[`dur_regularUser_${index}`];
                                return next;
                              });
                            }}
                            placeholder="Enter regular user price"
                            className={`w-full rounded-xl border px-3 py-2 text-xs font-mono text-[#1F1F1F] bg-white placeholder:text-[#9E9E9E] focus:outline-none ${
                              regularUserError ? 'border-rose-400 bg-rose-50/40' : 'border-[#EEEEF2] focus:border-[#5B21B6]'
                            }`}
                          />
                          {regularUserError && <p className="text-[10px] text-rose-600">{regularUserError}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#EEEEF2] bg-[#FAF9FC] p-4 shrink-0">
          <div className="text-xs text-[#6B6B6B]">
            All fields marked with <span className="text-rose-500">*</span> are required.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#F5F3FF] hover:border-[#DDD6FE] transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || areaNameStatus === 'checking' || areaNameStatus === 'duplicate'}
              className="flex items-center gap-2 rounded-xl bg-[#5B21B6] px-5 py-2 text-xs font-semibold text-white shadow-soft-sm hover:bg-[#4C1D95] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Market...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Market</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
