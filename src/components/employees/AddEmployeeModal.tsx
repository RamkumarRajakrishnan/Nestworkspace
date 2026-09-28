import React, { useState, useRef, useEffect } from 'react';
import { X, Eye, EyeOff, MapPin, Check, AlertCircle, Loader2, ChevronDown } from 'lucide-react';
import { workerService, RegisterEmployeePayload } from '../../services/workerService';
import { getActiveAreas } from '../../services/api';
import { useOperations } from '../../context/OperationsContext';
import { Worker, APPROVED_SERVICE_TYPES } from '../../types';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newEmployee: Worker) => void;
}

const DEFAULT_LOCATIONS = [
  { id: 'Haatza_corp', label: 'Haatza_corp (Haatza Corporate)' },
  { id: 'Neo_Town', label: 'Neo_Town (Neo Town)' },
  { id: 'Prestiage', label: 'Prestiage (Prestige)' },
  { id: 'neeladri_Nagar', label: 'neeladri_Nagar (Neeladri Nagar)' },
];

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useOperations();

  // Form states
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(['Haatza_corp']);
  const [accessLevel, setAccessLevel] = useState('FULL');

  // UI interaction states
  const [showPassword, setShowPassword] = useState(false);
  const [isLocationsOpen, setIsLocationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [availableLocations, setAvailableLocations] = useState(DEFAULT_LOCATIONS);

  // Fetch real active areas from centralized API
  useEffect(() => {
    getActiveAreas().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setAvailableLocations(
          res.data.map((a) => ({
            id: a.areaName,
            label: `${a.areaName} (${a.city || 'Bangalore'})`,
          }))
        );
      }
    });
  }, []);

  // Field touched states for validation UX
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const locationsDropdownRef = useRef<HTMLDivElement>(null);

  // Close locations dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        locationsDropdownRef.current &&
        !locationsDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key closes modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  // Validation functions
  const validateEmail = (val: string): boolean => {
    if (!val) return false;
    const trimmed = val.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return false;
    if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.includes('@.') || trimmed.endsWith('.')) {
      return false;
    }
    return true;
  };

  const validatePhone = (val: string): boolean => {
    // 10-digit Indian mobile number
    return /^[6-9]\d{9}$/.test(val.trim());
  };

  const errors: Record<string, string> = {};
  if (!employeeId.trim()) {
    errors.employeeId = 'Employee ID is required.';
  }
  if (!fullName.trim()) {
    errors.fullName = 'Full name is required.';
  }
  if (!validateEmail(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!validatePhone(phone)) {
    errors.phone = 'Enter a valid 10-digit phone number.';
  }
  if (!password.trim()) {
    errors.password = 'Password is required.';
  }
  if (selectedLocations.length === 0) {
    errors.locations = 'Select at least one location.';
  }
  if (!accessLevel.trim()) {
    errors.accessLevel = 'Select an access level.';
  }

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhone(raw);
    if (apiError) setApiError(null);
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '');
    setFullName(clean);
    if (apiError) setApiError(null);
  };

  const handleLocationToggle = (locId: string) => {
    markTouched('locations');
    setSelectedLocations((prev) => {
      if (prev.includes(locId)) {
        return prev.filter((id) => id !== locId);
      } else {
        return [...prev, locId];
      }
    });
    if (apiError) setApiError(null);
  };

  const handleRemoveLocation = (locId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    markTouched('locations');
    setSelectedLocations((prev) => prev.filter((id) => id !== locId));
  };

  const handleClose = () => {
    // Reset all form states
    setEmployeeId('');
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setSelectedLocations(['Haatza_corp']);
    setAccessLevel('FULL');
    setShowPassword(false);
    setIsLocationsOpen(false);
    setIsLoading(false);
    setApiError(null);
    setTouched({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setTouched({
      employeeId: true,
      fullName: true,
      email: true,
      phone: true,
      password: true,
      locations: true,
      accessLevel: true,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);
    setApiError(null);

    const payload: RegisterEmployeePayload = {
      employeeId: employeeId.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      profileImage: null,
      areaNames: selectedLocations,
      accessLevel: accessLevel.trim(),
    };

    const result = await workerService.registerEmployee(payload);
    setIsLoading(false);

    if (result.success) {
      // 1. Log response
      console.log('Nest Employee Register Response:', result.data);

      // 2. Show toast
      addToast('Employee Created', 'Employee created successfully', 'success');

      // 3. Immediately update the Employees list state
      const createdUser = result.data?.user || {
        employeeId: payload.employeeId,
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        status: 'Active',
        verificationStatus: 'Verified',
      };

      const newEmployee: Worker = {
        id: createdUser.employeeId || payload.employeeId,
        name: createdUser.fullName || payload.fullName,
        email: createdUser.email || payload.email,
        phone: createdUser.phone || payload.phone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120',
        areaId: payload.areaNames[0] || 'Haatza_corp',
        status: 'Available',
        skills: [...APPROVED_SERVICE_TYPES],
        rating: 5.0,
        ratingCount: 0,
        joinedDate: 'Today',
        todayJobs: 0,
        todayEarnings: 0,
        weeklyEarnings: 0,
        currentJobId: null,
        complianceStatus: 'Verified',
        lat: 12.9279,
        lng: 77.6271,
        lastGpsUpdate: 'Just now',
        gpsAccuracyMeters: 10,
        completionRate: 100,
        cancellationRate: 0,
        avgResponseTimeSec: 18,
      };

      onSuccess(newEmployee);

      // 4. Close modal and reset form
      handleClose();
    } else {
      // Keep modal open, preserve entered data, display safe error message
      setApiError(result.error || 'Failed to register employee. Please check your information and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Background Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-[#1F1F1F]/50 backdrop-blur-md transition-opacity"
        onClick={() => {
          if (!isLoading) handleClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg transition-all overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEF2] bg-[#FAF9FC] px-5 py-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F]">Add New Employee</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Register an internal operations employee with geo-fenced cluster entitlements.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl p-1.5 text-[#6B6B6B] hover:bg-[#EDE9FE] hover:text-[#5B21B6] transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content / Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" noValidate>
          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 max-h-[calc(90vh-140px)]">
            {/* API Error Alert */}
            {apiError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FEF2F2] p-3.5 text-xs text-[#B42318] animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{apiError}</div>
              </div>
            )}

            {/* Grid Layout: 2 Columns on Desktop, 1 Column on Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Employee ID */}
              <div className="space-y-1.5">
                <label htmlFor="modal-employeeId" className="block text-xs font-semibold text-[#1F1F1F]">
                  Employee ID <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-employeeId"
                  type="text"
                  value={employeeId}
                  onChange={(e) => {
                    setEmployeeId(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => markTouched('employeeId')}
                  placeholder="e.g. HN-1028"
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] placeholder:font-sans focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                    touched.employeeId && errors.employeeId
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                  }`}
                />
                {touched.employeeId && errors.employeeId && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.employeeId}</p>
                )}
              </div>

              {/* 2. Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="modal-fullName" className="block text-xs font-semibold text-[#1F1F1F]">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-fullName"
                  type="text"
                  value={fullName}
                  onChange={handleFullNameChange}
                  onBlur={() => markTouched('fullName')}
                  placeholder="e.g. Arul Kumar"
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                    touched.fullName && errors.fullName
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                  }`}
                />
                {touched.fullName && errors.fullName && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.fullName}</p>
                )}
              </div>

              {/* 3. Email */}
              <div className="space-y-1.5">
                <label htmlFor="modal-email" className="block text-xs font-semibold text-[#1F1F1F]">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9._\-+@]/g, '');
                    setEmail(val);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => markTouched('email')}
                  placeholder="e.g. arul@haatza.in"
                  disabled={isLoading}
                  className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                    touched.email && errors.email
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                  }`}
                />
                {touched.email && errors.email && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.email}</p>
                )}
              </div>

              {/* 4. Phone Number */}
              <div className="space-y-1.5">
                <label htmlFor="modal-phone" className="block text-xs font-semibold text-[#1F1F1F]">
                  Phone Number (10 Digits) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-mono font-semibold text-[#6B6B6B]">
                    +91
                  </span>
                  <input
                    id="modal-phone"
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    onBlur={() => markTouched('phone')}
                    placeholder="9994998746"
                    disabled={isLoading}
                    maxLength={10}
                    className={`w-full rounded-xl border bg-[#FAF9FC] pl-11 pr-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] placeholder:font-sans focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.phone && errors.phone
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                </div>
                {touched.phone && errors.phone && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* 5. Password */}
              <div className="space-y-1.5">
                <label htmlFor="modal-password" className="block text-xs font-semibold text-[#1F1F1F]">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="modal-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\s/g, '');
                      setPassword(val);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => markTouched('password')}
                    placeholder="Enter account password"
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.password && errors.password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#9E9E9E] hover:text-[#5B21B6] p-0.5 rounded transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.password}</p>
                )}
              </div>

              {/* 6. Access Level */}
              <div className="space-y-1.5">
                <label htmlFor="modal-accessLevel" className="block text-xs font-semibold text-[#1F1F1F]">
                  Access Level <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-accessLevel"
                  value={accessLevel}
                  onChange={(e) => {
                    setAccessLevel(e.target.value);
                    if (apiError) setApiError(null);
                  }}
                  onBlur={() => markTouched('accessLevel')}
                  disabled={isLoading}
                  className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F1F] focus:border-[#5B21B6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  <option value="FULL">FULL — Full Access</option>
                  <option value="READ_ONLY">READ_ONLY — Read Only</option>
                </select>
                {touched.accessLevel && errors.accessLevel && (
                  <p className="text-[11px] text-rose-600 font-medium">{errors.accessLevel}</p>
                )}
              </div>
            </div>

            {/* 7. Locations Multi-Select Field (Full Width) */}
            <div className="space-y-1.5 pt-1" ref={locationsDropdownRef}>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#1F1F1F]">
                  Assigned Operational Locations (Multi-Select) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-[#6B6B6B]">
                  {selectedLocations.length} selected
                </span>
              </div>

              {/* Selected Location Chips */}
              <div className="flex flex-wrap gap-1.5 min-h-[38px] p-2 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] items-center">
                {selectedLocations.length > 0 ? (
                  selectedLocations.map((loc) => (
                    <span
                      key={loc}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-1 text-xs font-mono font-semibold text-[#5B21B6] animate-in fade-in"
                    >
                      <MapPin className="h-3 w-3" />
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveLocation(loc, e)}
                        className="rounded hover:bg-[#DDD6FE] p-0.5 text-[#5B21B6] transition-colors"
                        title={`Remove ${loc}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#9E9E9E] italic px-1">
                    No locations selected. Click dropdown below to add.
                  </span>
                )}
              </div>

              {/* Multi-select Dropdown Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLocationsOpen(!isLocationsOpen)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-between rounded-xl border bg-white px-3.5 py-2 text-xs font-semibold text-[#1F1F1F] transition-all cursor-pointer ${
                    touched.locations && errors.locations
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-500/20'
                      : 'border-[#EEEEF2] hover:border-[#5B21B6]'
                  }`}
                  aria-expanded={isLocationsOpen}
                >
                  <span className="flex items-center gap-2 text-[#6B6B6B]">
                    <MapPin className="h-4 w-4 text-[#5B21B6]" />
                    <span>Choose locations to dispatch / operate</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#6B6B6B] transition-transform duration-200 ${
                      isLocationsOpen ? 'rotate-180 text-[#5B21B6]' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isLocationsOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-30 max-h-52 overflow-y-auto rounded-xl border border-[#EEEEF2] bg-white p-1.5 shadow-soft-lg animate-in fade-in zoom-in-95">
                    <div className="space-y-0.5">
                      {availableLocations.map((loc) => {
                        const isSelected = selectedLocations.includes(loc.id);
                        return (
                          <div
                            key={loc.id}
                            onClick={() => handleLocationToggle(loc.id)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-[#F5F3FF] text-[#5B21B6] font-semibold'
                                : 'hover:bg-[#FAF9FC] text-[#1F1F1F]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                                  isSelected
                                    ? 'border-[#5B21B6] bg-[#5B21B6] text-white'
                                    : 'border-[#D1D5DB] bg-white'
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <span className="font-mono text-xs">{loc.label}</span>
                            </div>
                            <span className="text-[10px] text-[#6B6B6B] font-mono">
                              {isSelected ? 'Selected' : '+ Add'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              {touched.locations && errors.locations && (
                <p className="text-[11px] text-rose-600 font-medium">{errors.locations}</p>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-[#EEEEF2] bg-[#FAF9FC] px-5 py-4 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl border border-[#EEEEF2] bg-white hover:bg-[#F3F2F7] text-[#1F1F1F] px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all shadow-soft-sm cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Employee...</span>
                </>
              ) : (
                <span>Create Employee</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
