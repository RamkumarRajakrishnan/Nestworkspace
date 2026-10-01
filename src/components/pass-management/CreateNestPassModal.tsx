import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Ticket, 
  MapPin, 
  Calendar, 
  Clock, 
  Layers, 
  AlertCircle, 
  Loader2, 
  Check, 
  Image as ImageIcon,
  ChevronDown,
  Upload 
} from 'lucide-react';
import { createNestPass, getActiveAreas, uploadExpertFile, ActiveAreaItem } from '../../services/api';
import { useOperations } from '../../context/OperationsContext';

interface CreateNestPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateNestPassModal: React.FC<CreateNestPassModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addToast } = useOperations();

  // Form State
  const [areaName, setAreaName] = useState('');
  const [packType, setPackType] = useState('');
  const [visits, setVisits] = useState('');
  const [price, setPrice] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [duration, setDuration] = useState('');
  const [offerexpire, setOfferexpire] = useState('');
  const [active, setActive] = useState(true);

  // Promotional Banner Image Files
  const [dashboardBannerFile, setDashboardBannerFile] = useState<File | null>(null);
  const [dashboardBannerPreview, setDashboardBannerPreview] = useState<string | null>(null);
  const [popupBannerFile, setPopupBannerFile] = useState<File | null>(null);
  const [popupBannerPreview, setPopupBannerPreview] = useState<string | null>(null);

  // File input refs
  const dashboardBannerInputRef = useRef<HTMLInputElement>(null);
  const popupBannerInputRef = useRef<HTMLInputElement>(null);

  // Available Areas dynamically loaded from existing Active Area API
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStepText, setUploadStepText] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Helper to handle banner image file selection
  const handleBannerSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
    errorKey: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: 'Please select a valid image file (JPG, PNG, or WebP).',
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setValidationErrors((prev) => ({
        ...prev,
        [errorKey]: 'File size exceeds 5MB limit.',
      }));
      return;
    }

    setFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  };

  useEffect(() => {
    setIsLoadingAreas(true);
    getActiveAreas()
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const areaNames = res.data
            .map((a: ActiveAreaItem) => a.areaName)
            .filter(Boolean);
          setAvailableAreas(areaNames);
        }
      })
      .catch((err) => console.error('Failed to load active areas in Create Pass:', err))
      .finally(() => setIsLoadingAreas(false));
  }, []);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAreaName('');
      setPackType('');
      setVisits('');
      setPrice('');
      setValidityDays('');
      setDuration('');
      setOfferexpire('');
      setActive(true);
      setDashboardBannerFile(null);
      if (dashboardBannerPreview) URL.revokeObjectURL(dashboardBannerPreview);
      setDashboardBannerPreview(null);
      setPopupBannerFile(null);
      if (popupBannerPreview) URL.revokeObjectURL(popupBannerPreview);
      setPopupBannerPreview(null);
      if (dashboardBannerInputRef.current) dashboardBannerInputRef.current.value = '';
      if (popupBannerInputRef.current) popupBannerInputRef.current.value = '';
      setApiError(null);
      setValidationErrors({});
    }
  }, [isOpen]);

  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    const origBodyOverflow = document.body.style.overflow;
    const origHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origBodyOverflow;
      document.documentElement.style.overflow = origHtmlOverflow;
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!areaName.trim()) errors.areaName = 'Area is required.';
    if (!packType.trim()) errors.packType = 'Pack type is required.';

    const visitsNum = parseInt(visits, 10);
    if (isNaN(visitsNum) || visitsNum <= 0) {
      errors.visits = 'Visits must be a positive integer.';
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.price = 'Price cannot be negative.';
    }

    const validityNum = parseInt(validityDays, 10);
    if (isNaN(validityNum) || validityNum <= 0) {
      errors.validityDays = 'Validity days must be a positive integer.';
    }

    if (!duration.trim()) {
      errors.duration = 'Duration is required.';
    }

    if (!offerexpire.trim()) {
      errors.offerexpire = 'Offer expiry date is required.';
    }

    if (!dashboardBannerFile) {
      errors.dashboardBanner = 'Dashboard banner image is required. Please upload an image.';
    }

    if (!popupBannerFile) {
      errors.popupBanner = 'Popup banner image is required. Please upload an image.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      setUploadStepText('Uploading promotional banners...');

      const [dashUpload, popupUpload] = await Promise.all([
        uploadExpertFile(dashboardBannerFile!, 'dashboardBanner'),
        uploadExpertFile(popupBannerFile!, 'popupBanner'),
      ]);

      if (!dashUpload.success || !dashUpload.url) {
        setApiError(dashUpload.error || 'Failed to upload dashboard banner.');
        setIsSubmitting(false);
        setUploadStepText(null);
        return;
      }

      if (!popupUpload.success || !popupUpload.url) {
        setApiError(popupUpload.error || 'Failed to upload popup banner.');
        setIsSubmitting(false);
        setUploadStepText(null);
        return;
      }

      setUploadStepText('Creating Nest Pass...');
      const payload = {
        dashboardBanner: dashUpload.url,
        popupBanner: popupUpload.url,
        areaName: areaName.trim(),
        packType: packType.trim(),
        visits: parseInt(visits, 10),
        price: parseFloat(price),
        validityDays: parseInt(validityDays, 10),
        active: Boolean(active),
        offerexpire: offerexpire.trim(),
        duration: duration.trim(),
      };

      const res = await createNestPass(payload);
      if (res.success) {
        addToast('Success', 'Nest Pass created successfully', 'success');
        onSuccess();
        onClose();
      } else {
        setApiError(res.error || 'Failed to create Nest Pass. Please try again.');
      }
    } catch (err: any) {
      setApiError(err?.message || 'Network error while creating Nest Pass.');
    } finally {
      setIsSubmitting(false);
      setUploadStepText(null);
    }
  };

  return (
    <div className="fixed top-16 bottom-0 right-0 left-0 md:left-[var(--sidebar-width,15rem)] z-30 flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150">
      <div 
        className="absolute inset-0 bg-[#1F1F1F]/40 backdrop-blur-xs cursor-pointer" 
        onClick={isSubmitting ? undefined : onClose}
        aria-label="Close create pass modal" 
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg flex flex-col max-h-[82vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEF2] px-6 py-4 bg-[#FAF9FC] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6]">
              <Ticket className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F1F1F]">Create Nest Pass</h2>
              <p className="text-xs text-[#6B6B6B]">Add a new service package or promotional pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {apiError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 font-medium">
              <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#5B21B6] uppercase tracking-wider">
              1. Basic Package Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Area */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Nano-Market Area <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B] pointer-events-none z-10" />
                  <select
                    value={areaName}
                    onChange={(e) => setAreaName(e.target.value)}
                    disabled={isLoadingAreas}
                    className={`w-full rounded-xl border pl-9 pr-8 py-2 text-xs focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden appearance-none bg-white cursor-pointer ${
                      validationErrors.areaName ? 'border-rose-400 bg-rose-50' : 'border-[#EEEEF2]'
                    }`}
                  >
                    {isLoadingAreas ? (
                      <option value="">Loading active areas...</option>
                    ) : availableAreas.length === 0 ? (
                      <option value="">No active areas found</option>
                    ) : (
                      <>
                        <option value="">Select an Area</option>
                        {availableAreas.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-[#6B6B6B] pointer-events-none" />
                </div>
                {validationErrors.areaName && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.areaName}</p>
                )}
              </div>

              {/* Pack Type */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Pack Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B]" />
                  <input
                    type="text"
                    value={packType}
                    onChange={(e) => setPackType(e.target.value)}
                    placeholder="Enter pack type"
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden ${
                      validationErrors.packType ? 'border-rose-400 bg-rose-50' : 'border-[#EEEEF2] bg-white'
                    }`}
                  />
                </div>
                {validationErrors.packType && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.packType}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Visits */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Visits Included <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={visits}
                  onChange={(e) => setVisits(e.target.value)}
                  placeholder="Enter number of visits"
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden ${
                    validationErrors.visits ? 'border-rose-400 bg-rose-50' : 'border-[#EEEEF2] bg-white'
                  }`}
                />
                {validationErrors.visits && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.visits}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Price (INR ₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 font-mono text-xs font-bold text-[#6B6B6B]">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter price"
                    className={`w-full rounded-xl border pl-7 pr-3 py-2 text-xs font-mono font-bold text-[#1F1F1F] focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden ${
                      validationErrors.price ? 'border-rose-400 bg-rose-50' : 'border-[#EEEEF2] bg-white'
                    }`}
                  />
                </div>
                {validationErrors.price && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.price}</p>
                )}
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Duration (Minutes) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B]" />
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="Enter duration in minutes"
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden ${
                      validationErrors.duration ? 'border-rose-400 bg-rose-50' : 'border-[#EEEEF2] bg-white'
                    }`}
                  />
                </div>
                {validationErrors.duration && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.duration}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Validity & Status */}
          <div className="space-y-4 pt-2 border-t border-[#EEEEF2]">
            <h3 className="text-xs font-bold text-[#5B21B6] uppercase tracking-wider">
              2. Validity & Activation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
              {/* Validity Days */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Validity Period (Days) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={validityDays}
                  onChange={(e) => setValidityDays(e.target.value)}
                  placeholder="Enter validity days"
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden ${
                    validationErrors.validityDays ? 'border-rose-400 bg-rose-50' : 'border-[#EEEEF2] bg-white'
                  }`}
                />
                {validationErrors.validityDays && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.validityDays}</p>
                )}
              </div>

              {/* Offer Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Offer Expiry Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-[#6B6B6B]" />
                  <input
                    type="date"
                    value={offerexpire}
                    onChange={(e) => setOfferexpire(e.target.value)}
                    className={`w-full rounded-xl border pl-9 pr-3 py-2 text-xs font-mono focus:ring-2 focus:ring-[#7C3AED] focus:outline-hidden ${
                      validationErrors.offerexpire ? 'border-rose-400 bg-rose-50' : 'border-[#EEEEF2] bg-white'
                    }`}
                  />
                </div>
                {validationErrors.offerexpire && (
                  <p className="text-[11px] text-rose-600 mt-1">{validationErrors.offerexpire}</p>
                )}
              </div>

              {/* Active Toggle */}
              <div>
                <label className="block text-xs font-semibold text-[#1F1F1F] mb-1.5">
                  Initial Status
                </label>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className={`w-full flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    active 
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800' 
                      : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#6B6B6B]'
                  }`}
                >
                  <span>{active ? 'Active (Live)' : 'Inactive'}</span>
                  <div className={`h-5 w-9 rounded-full transition-colors relative ${active ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                    <div className={`h-4 w-4 rounded-full bg-white transition-transform absolute top-0.5 ${active ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Promotional Banners (Image Uploads) */}
          <div className="space-y-4 pt-2 border-t border-[#EEEEF2]">
            <h3 className="text-xs font-bold text-[#5B21B6] uppercase tracking-wider">
              3. Promotional Banners
            </h3>

            {/* Dashboard Banner Upload */}
            <div className="space-y-1.5 min-w-0">
              <label className="block text-xs font-semibold text-[#1F1F1F]">
                Dashboard Banner <span className="text-rose-500">*</span>
              </label>
              <input
                ref={dashboardBannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => handleBannerSelect(e, setDashboardBannerFile, setDashboardBannerPreview, 'dashboardBanner')}
              />

              {dashboardBannerFile ? (
                <div className="flex items-center justify-between rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {dashboardBannerPreview ? (
                      <img
                        src={dashboardBannerPreview}
                        alt="Dashboard Banner Preview"
                        className="h-12 w-20 rounded-lg object-cover border border-[#DDD6FE] bg-white shrink-0"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-[#5B21B6] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1F1F1F] truncate max-w-[180px] sm:max-w-xs">
                        {dashboardBannerFile.name}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B] font-mono mt-0.5">
                        {formatFileSize(dashboardBannerFile.size)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => dashboardBannerInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="rounded-lg border border-[#EEEEF2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5B21B6] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardBannerFile(null);
                        if (dashboardBannerPreview) URL.revokeObjectURL(dashboardBannerPreview);
                        setDashboardBannerPreview(null);
                        if (dashboardBannerInputRef.current) dashboardBannerInputRef.current.value = '';
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg p-1 text-[#6B6B6B] hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => dashboardBannerInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[#DDD6FE] bg-[#FAF9FC] hover:bg-[#F5F3FF] hover:border-[#5B21B6] py-3.5 px-3 text-center cursor-pointer transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6] group-hover:scale-105 transition-transform shrink-0">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#5B21B6] block">Upload Dashboard Banner</span>
                    <span className="text-[11px] text-[#6B6B6B]">JPG, PNG, or WebP</span>
                  </div>
                </button>
              )}
              {validationErrors.dashboardBanner && (
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.dashboardBanner}</p>
              )}
            </div>

            {/* Popup Banner Upload */}
            <div className="space-y-1.5 min-w-0">
              <label className="block text-xs font-semibold text-[#1F1F1F]">
                Popup Banner <span className="text-rose-500">*</span>
              </label>
              <input
                ref={popupBannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => handleBannerSelect(e, setPopupBannerFile, setPopupBannerPreview, 'popupBanner')}
              />

              {popupBannerFile ? (
                <div className="flex items-center justify-between rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {popupBannerPreview ? (
                      <img
                        src={popupBannerPreview}
                        alt="Popup Banner Preview"
                        className="h-12 w-16 rounded-lg object-cover border border-[#DDD6FE] bg-white shrink-0"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-[#5B21B6] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1F1F1F] truncate max-w-[180px] sm:max-w-xs">
                        {popupBannerFile.name}
                      </div>
                      <div className="text-[11px] text-[#6B6B6B] font-mono mt-0.5">
                        {formatFileSize(popupBannerFile.size)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => popupBannerInputRef.current?.click()}
                      disabled={isSubmitting}
                      className="rounded-lg border border-[#EEEEF2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5B21B6] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPopupBannerFile(null);
                        if (popupBannerPreview) URL.revokeObjectURL(popupBannerPreview);
                        setPopupBannerPreview(null);
                        if (popupBannerInputRef.current) popupBannerInputRef.current.value = '';
                      }}
                      disabled={isSubmitting}
                      className="rounded-lg p-1 text-[#6B6B6B] hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => popupBannerInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[#DDD6FE] bg-[#FAF9FC] hover:bg-[#F5F3FF] hover:border-[#5B21B6] py-3.5 px-3 text-center cursor-pointer transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-[#5B21B6] group-hover:scale-105 transition-transform shrink-0">
                    <Upload className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-[#5B21B6] block">Upload Popup Banner</span>
                    <span className="text-[11px] text-[#6B6B6B]">JPG, PNG, or WebP</span>
                  </div>
                </button>
              )}
              {validationErrors.popupBanner && (
                <p className="text-[11px] text-rose-600 mt-1">{validationErrors.popupBanner}</p>
              )}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="border-t border-[#EEEEF2] pt-4 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2.5 text-xs font-semibold text-[#6B6B6B] hover:text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-soft-sm active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{uploadStepText || 'Creating Pass...'}</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Create Nest Pass</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
