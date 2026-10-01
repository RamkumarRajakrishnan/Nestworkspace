import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  AlertCircle, 
  Loader2, 
  User, 
  MapPin, 
  CreditCard, 
  FileText, 
  Briefcase, 
  Check, 
  Upload, 
  FileCheck, 
  Image as ImageIcon,
  RotateCw,
  ChevronDown,
  Clock,
  ShieldCheck,
  Search
} from 'lucide-react';
import { 
  registerNestExpert, 
  checkExpertRegistration,
  uploadMedia, 
  getActiveAreas, 
  ActiveAreaItem,
  getBankList,
  BankItem
} from '../../services/api';
import { getIfscPrefixForBank } from '../../data/bankToIfscPrefix';
import { useOperations } from '../../context/OperationsContext';

interface AddExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newWorkerId?: string) => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/* ==========================================================================
   Custom Modern Dropdown Component (Prevents Icon Overlap & Elevates UI)
   ========================================================================== */

interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  hasError?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  emptyText?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  icon,
  disabled = false,
  hasError = false,
  isLoading = false,
  loadingText = 'Loading options...',
  emptyText = 'No options available',
  searchable = false,
  searchPlaceholder = 'Search...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value) || (value ? { value, label: value } : undefined);

  const filteredOptions = searchable && searchTerm.trim()
    ? options.filter((opt) => {
        const term = searchTerm.toLowerCase();
        return (
          opt.label.toLowerCase().includes(term) ||
          opt.value.toLowerCase().includes(term)
        );
      })
    : options;

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Select Trigger Box */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition-all cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed ${
          hasError
            ? 'border-rose-400 bg-rose-50/50 text-[#1F1F1F] focus:ring-2 focus:ring-rose-500/20'
            : isOpen
            ? 'border-[#5B21B6] bg-white ring-2 ring-[#5B21B6]/20 shadow-soft-sm text-[#1F1F1F]'
            : 'border-[#EEEEF2] bg-[#FAF9FC] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
        }`}
      >
        {/* Left side: Icon + Label separated cleanly with flex gap (ZERO overlap) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#5B21B6] shrink-0" />
          ) : selectedOption?.icon ? (
            selectedOption.icon
          ) : icon ? (
            icon
          ) : null}

          <span className={`truncate ${!selectedOption && !isLoading ? 'text-[#9E9E9E]' : 'text-[#1F1F1F] font-semibold'}`}>
            {isLoading ? loadingText : selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Right side: Badge + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedOption?.badge}
          <ChevronDown
            className={`h-4 w-4 text-[#6B6B6B] transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#5B21B6]' : ''
            }`}
          />
        </div>
      </button>

      {/* Styled Floating Dropdown Popover */}
      {isOpen && !disabled && !isLoading && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg animate-in fade-in zoom-in-95 flex flex-col overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-[#EEEEF2] bg-[#FAF9FC] shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-[#EEEEF2] text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-3 px-3 text-center text-xs text-[#6B6B6B]">
                {searchTerm ? 'No matching options found' : emptyText}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    type="button"
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold'
                        : 'text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#5B21B6]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {option.badge}
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#5B21B6] stroke-[2.5]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   AddExpertModal Main Component
   ========================================================================== */

export const AddExpertModal: React.FC<AddExpertModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { addToast } = useOperations();

  // 1. Personal Details
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');

  // 1.1 Profile Image File & Upload State
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [uploadedProfileImageUrl, setUploadedProfileImageUrl] = useState<string>('');
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [profileImageError, setProfileImageError] = useState<string | null>(null);
  const profileImageInputRef = useRef<HTMLInputElement>(null);

  // 2. Location Details
  const [areaName, setAreaName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // Active Areas fetched from Active Area API
  const [availableAreas, setAvailableAreas] = useState<string[]>([]);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  const [areaFetchError, setAreaFetchError] = useState<string | null>(null);

  // 3. Aadhaar Details & File Uploads
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isCheckingAadhaar, setIsCheckingAadhaar] = useState(false);
  const [aadhaarRegisteredError, setAadhaarRegisteredError] = useState<string | null>(null);
  const [aadhaarCheckApiError, setAadhaarCheckApiError] = useState<string | null>(null);
  const lastCheckedAadhaarRef = useRef<string>('');
  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const aadhaarFrontInputRef = useRef<HTMLInputElement>(null);
  const aadhaarBackInputRef = useRef<HTMLInputElement>(null);

  // 4. PAN Details & File Upload
  const [panNumber, setPanNumber] = useState('');
  const [panCardFile, setPanCardFile] = useState<File | null>(null);
  const panCardInputRef = useRef<HTMLInputElement>(null);

  // 5. Bank Details
  const [bankName, setBankName] = useState('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  // Bank List fetched from centralized Bank API
  const [bankList, setBankList] = useState<BankItem[]>([]);
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);
  const [bankFetchError, setBankFetchError] = useState<string | null>(null);

  // 6. Operational Details
  const [referredBy, setReferredBy] = useState('');
  const [shiftTimeing, setShiftTimeing] = useState('');
  const [monthlySalary, setMonthlySalary] = useState('');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStepText, setUploadStepText] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch Active Areas from centralized API
  const fetchAreas = useCallback(async () => {
    setIsLoadingAreas(true);
    setAreaFetchError(null);
    try {
      const res = await getActiveAreas(1, 50);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const areaNames = res.data.map((a: ActiveAreaItem) => a.areaName?.trim()).filter(Boolean);
        const unique = Array.from(new Set(areaNames));
        if (unique.length > 0) {
          setAvailableAreas(unique);
          setAreaName((prev) => (prev && unique.includes(prev) ? prev : ''));
        } else {
          setAreaFetchError('No active areas returned from server.');
        }
      } else {
        setAreaFetchError(res.error || 'Unable to fetch active areas.');
      }
    } catch {
      setAreaFetchError('Network error loading active areas.');
    } finally {
      setIsLoadingAreas(false);
    }
  }, []);

  // Fetch Supported Bank List from centralized API
  const fetchBanks = useCallback(async () => {
    setIsLoadingBanks(true);
    setBankFetchError(null);
    try {
      const res = await getBankList();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setBankList(res.data);
      } else {
        setBankFetchError(res.error || 'Unable to fetch bank list.');
      }
    } catch {
      setBankFetchError('Network error loading bank list.');
    } finally {
      setIsLoadingBanks(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAreas();
      fetchBanks();
    }
  }, [isOpen, fetchAreas, fetchBanks]);

  // Check whether Aadhaar is already registered via centralized API
  const performAadhaarCheck = useCallback(async (numberToCheck: string) => {
    const clean = numberToCheck.trim();
    if (!/^\d{12}$/.test(clean)) {
      setAadhaarRegisteredError(null);
      setAadhaarCheckApiError(null);
      return;
    }

    if (lastCheckedAadhaarRef.current === clean) {
      return; // Already checked this 12-digit number
    }

    setIsCheckingAadhaar(true);
    setAadhaarRegisteredError(null);
    setAadhaarCheckApiError(null);

    try {
      const res = await checkExpertRegistration(clean);
      lastCheckedAadhaarRef.current = clean;

      if (res.success) {
        if (res.registered === true) {
          setAadhaarRegisteredError(res.message || 'User already registered');
          setAadhaarCheckApiError(null);
        } else {
          setAadhaarRegisteredError(null);
          setAadhaarCheckApiError(null);
        }
      } else {
        // If the API request itself fails, show generic error without assuming registered
        setAadhaarRegisteredError(null);
        setAadhaarCheckApiError('Unable to verify Aadhaar. Please try again.');
      }
    } catch {
      setAadhaarRegisteredError(null);
      setAadhaarCheckApiError('Unable to verify Aadhaar. Please try again.');
    } finally {
      setIsCheckingAadhaar(false);
    }
  }, []);

  // Debounced check triggered when Aadhaar is valid 12 digits
  useEffect(() => {
    const trimmed = aadhaarNumber.trim();
    if (trimmed.length === 12 && /^\d{12}$/.test(trimmed)) {
      const timer = setTimeout(() => {
        performAadhaarCheck(trimmed);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      lastCheckedAadhaarRef.current = '';
      if (aadhaarRegisteredError) setAadhaarRegisteredError(null);
      if (aadhaarCheckApiError) setAadhaarCheckApiError(null);
      if (isCheckingAadhaar) setIsCheckingAadhaar(false);
    }
  }, [aadhaarNumber, performAadhaarCheck, aadhaarRegisteredError, aadhaarCheckApiError, isCheckingAadhaar]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleClose();
      }
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
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  // Validation Logic per Requirement Specifications
  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};

    // 1. Full Name *
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      errs.fullName = 'Full Name is required.';
    } else if (!/^[a-zA-Z\s'-]{2,60}$/.test(trimmedName)) {
      errs.fullName = 'Full Name must contain English letters only (2-60 characters).';
    }

    // 2. Mobile Number *
    const trimmedMobile = mobileNumber.trim();
    if (!trimmedMobile) {
      errs.mobileNumber = 'Mobile Number is required.';
    } else if (!/^[6-9]\d{9}$/.test(trimmedMobile)) {
      errs.mobileNumber = 'Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
    }

    // 3. Gender *
    if (!gender || !gender.trim()) {
      errs.gender = 'Gender is required.';
    }

    // 4. Profile Image (Optional)
    if (isUploadingProfileImage) {
      errs.profileImage = 'Profile image is currently uploading. Please wait.';
    } else if (profileImageError) {
      errs.profileImage = profileImageError;
    }

    // 5. Area Name *
    if (!areaName || !areaName.trim()) {
      errs.areaName = 'Area Name is required. Please select an active area.';
    }

    // 6. Address *
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      errs.address = 'Address is required.';
    } else if (trimmedAddress.length < 5) {
      errs.address = 'Please enter a valid address (minimum 5 characters).';
    } else if (/[<>]/.test(trimmedAddress)) {
      errs.address = 'Address cannot contain HTML tags or script code.';
    }

    // 7. Aadhaar Number *
    const trimmedAadhaar = aadhaarNumber.trim();
    if (!trimmedAadhaar) {
      errs.aadhaarNumber = 'Aadhaar Number is required.';
    } else if (!/^\d{12}$/.test(trimmedAadhaar)) {
      errs.aadhaarNumber = 'Aadhaar number must contain exactly 12 digits.';
    } else if (aadhaarRegisteredError) {
      errs.aadhaarNumber = aadhaarRegisteredError;
    }

    // 8. PAN Number *
    const trimmedPan = panNumber.trim().toUpperCase();
    if (!trimmedPan) {
      errs.panNumber = 'PAN Number is required.';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(trimmedPan)) {
      errs.panNumber = 'Enter a valid 10-character PAN format (e.g. ABCDE1234F).';
    }

    // 9. Bank Details *
    // 9.1 Bank Name *
    const trimmedBankName = bankName.trim();
    if (!trimmedBankName) {
      errs.bankName = 'Bank Name is required.';
    } else if (!/^[a-zA-Z\s.-]{2,50}$/.test(trimmedBankName)) {
      errs.bankName = 'Enter a valid bank name (letters only).';
    }

    // 9.2 Account Number *
    const trimmedAccount = accountNumber.trim();
    if (!trimmedAccount) {
      errs.accountNumber = 'Account Number is required.';
    } else if (!/^\d{9,18}$/.test(trimmedAccount)) {
      errs.accountNumber = 'Account number must contain 9 to 18 digits.';
    }

    // 9.3 IFSC Code *
    const trimmedIfsc = ifscCode.trim().toUpperCase();
    if (!trimmedIfsc) {
      errs.ifscCode = 'IFSC Code is required.';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trimmedIfsc)) {
      errs.ifscCode = 'Enter a valid 11-character IFSC (e.g. SBIN0001234).';
    } else {
      const expectedPrefix = getIfscPrefixForBank(bankName, selectedBankCode);
      if (expectedPrefix && !trimmedIfsc.startsWith(expectedPrefix)) {
        errs.ifscCode = `IFSC Code must start with ${expectedPrefix} for ${bankName.trim()}.`;
      }
    }

    // 9.4 Account Holder Name *
    const trimmedHolder = accountHolderName.trim();
    if (!trimmedHolder) {
      errs.accountHolderName = 'Account Holder Name is required.';
    } else if (!/^[a-zA-Z\s'-]{2,60}$/.test(trimmedHolder)) {
      errs.accountHolderName = 'Enter a valid account holder name (letters only).';
    }

    // 10. Shifting Time Hours *
    const allowedHours = ['6', '8', '10', '12'];
    if (!shiftTimeing || !allowedHours.includes(String(shiftTimeing))) {
      errs.shiftTimeing = 'Please select 6, 8, 10, or 12 hours.';
    }

    // 12. Monthly Salary *
    const trimmedSalary = monthlySalary.trim();
    if (!trimmedSalary) {
      errs.monthlySalary = 'Monthly Salary is required.';
    } else if (!/^[1-9]\d*$/.test(trimmedSalary)) {
      errs.monthlySalary = 'Enter a valid monthly salary (positive digits only).';
    }

    return errs;
  };

  const errors = validate();

  const markTouched = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // Profile Image Selection & Immediate Upload via uploadMedia API
  const handleProfileImageSelection = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (apiError) setApiError(null);
    setProfileImageError(null);
    markTouched('profileImage');

    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // File size validation (<= 5MB)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setProfileImageError(`File "${file.name}" exceeds 5MB limit. Please choose a smaller image.`);
      e.target.value = '';
      return;
    }

    // File format validation: Verify that the selected file is a valid image
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|svg)$/i.test(file.name);
    if (!isImage) {
      setProfileImageError('Please select a valid image.');
      e.target.value = '';
      return;
    }

    setProfileImageFile(file);

    // Create instant local preview
    const previewUrl = URL.createObjectURL(file);
    setProfileImagePreview(previewUrl);

    // Upload immediately using centralized uploadMedia API (converts to JPG, compresses <= 200 KB, sends Base64)
    setIsUploadingProfileImage(true);
    setUploadStepText('Optimizing image & uploading...');

    try {
      const uploadRes = await uploadMedia(file, 'profileImage');
      setIsUploadingProfileImage(false);
      setUploadStepText(null);

      if (uploadRes.success && uploadRes.url) {
        setUploadedProfileImageUrl(uploadRes.url);
        setProfileImageError(null);
      } else {
        setUploadedProfileImageUrl('');
        setProfileImageError(uploadRes.error || 'Unable to process the image. Please try another image.');
      }
    } catch {
      setIsUploadingProfileImage(false);
      setUploadStepText(null);
      setUploadedProfileImageUrl('');
      setProfileImageError('Unable to process the image. Please try another image.');
    }
  };

  // Generic document file handler (Aadhaar, PAN)
  const handleDocFileSelection = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  ) => {
    if (apiError) setApiError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setApiError(`File "${file.name}" exceeds 5MB limit. Please choose a smaller file.`);
      e.target.value = '';
      return;
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)) {
      setApiError(`File "${file.name}" has unsupported format. Please select JPG, PNG, WebP, or PDF.`);
      e.target.value = '';
      return;
    }

    setFile(file);
  };

  const handleClose = () => {
    setFullName('');
    setMobileNumber('');
    setGender('');
    setDateOfBirth('');
    setProfileImageFile(null);
    if (profileImagePreview) {
      URL.revokeObjectURL(profileImagePreview);
      setProfileImagePreview(null);
    }
    setUploadedProfileImageUrl('');
    setIsUploadingProfileImage(false);
    setProfileImageError(null);
    setAadhaarFrontFile(null);
    setAadhaarBackFile(null);
    setPanCardFile(null);
    setAreaName('');
    setAddress('');
    setLatitude('');
    setLongitude('');
    setAadhaarNumber('');
    setAadhaarRegisteredError(null);
    setAadhaarCheckApiError(null);
    setIsCheckingAadhaar(false);
    lastCheckedAadhaarRef.current = '';
    setPanNumber('');
    setBankName('');
    setSelectedBankCode('');
    setBankFetchError(null);
    setAccountNumber('');
    setIfscCode('');
    setAccountHolderName('');
    setReferredBy('');
    setShiftTimeing('');
    setMonthlySalary('');
    setIsLoading(false);
    setUploadStepText(null);
    setApiError(null);
    setTouched({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all mandatory fields as touched to trigger inline error messages
    const allTouched: Record<string, boolean> = {
      fullName: true,
      mobileNumber: true,
      gender: true,
      profileImage: true,
      areaName: true,
      address: true,
      aadhaarNumber: true,
      panNumber: true,
      bankName: true,
      accountNumber: true,
      ifscCode: true,
      accountHolderName: true,
      shiftTimeing: true,
      monthlySalary: true,
    };
    setTouched(allTouched);

    const currentErrors = validate();
    if (Object.keys(currentErrors).length > 0) {
      const firstError = Object.values(currentErrors)[0];
      setApiError(firstError);
      return;
    }

    if (aadhaarRegisteredError) {
      setApiError(aadhaarRegisteredError);
      return;
    }

    if (isCheckingAadhaar) {
      setApiError('Please wait while Aadhaar registration is being verified.');
      return;
    }

    // Safety verification before submitting
    const trimmedAadhaar = aadhaarNumber.trim();
    if (trimmedAadhaar.length === 12 && lastCheckedAadhaarRef.current !== trimmedAadhaar) {
      setIsCheckingAadhaar(true);
      const checkRes = await checkExpertRegistration(trimmedAadhaar);
      setIsCheckingAadhaar(false);
      lastCheckedAadhaarRef.current = trimmedAadhaar;
      if (checkRes.success && checkRes.registered === true) {
        const msg = checkRes.message || 'User already registered';
        setAadhaarRegisteredError(msg);
        setApiError(msg);
        return;
      }
    }

    if (isUploadingProfileImage) {
      setApiError('Profile image is currently uploading. Please wait for completion.');
      return;
    }

    setIsLoading(true);
    setApiError(null);

    try {
      // Upload optional documents if provided
      let aadhaarFrontUrl = '';
      let aadhaarBackUrl = '';
      let panCardUrl = '';

      if (aadhaarFrontFile) {
        setUploadStepText('Uploading Aadhaar front document...');
        const upRes = await uploadMedia(aadhaarFrontFile, 'aadhaarFront');
        if (upRes.success && upRes.url) {
          aadhaarFrontUrl = upRes.url;
        }
      }

      if (aadhaarBackFile) {
        setUploadStepText('Uploading Aadhaar back document...');
        const upRes = await uploadMedia(aadhaarBackFile, 'aadhaarBack');
        if (upRes.success && upRes.url) {
          aadhaarBackUrl = upRes.url;
        }
      }

      if (panCardFile) {
        setUploadStepText('Uploading PAN card document...');
        const upRes = await uploadMedia(panCardFile, 'panCard');
        if (upRes.success && upRes.url) {
          panCardUrl = upRes.url;
        }
      }

      setUploadStepText('Creating expert record...');

      // Build payload matching backend contract exactly
      const payload = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        profileImage: uploadedProfileImageUrl, // Remote URL returned by uploadMedia
        gender: gender.trim(),
        dateOfBirth: dateOfBirth.trim(),
        areaName: areaName.trim(),
        address: address.trim(),
        latitude: latitude.trim() ? Number(latitude.trim()) : 0,
        longitude: longitude.trim() ? Number(longitude.trim()) : 0,
        aadhaarNumber: aadhaarNumber.trim(),
        aadhaarFront: aadhaarFrontUrl,
        aadhaarBack: aadhaarBackUrl,
        panNumber: panNumber.trim().toUpperCase(),
        panCard: panCardUrl,
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        accountHolderName: accountHolderName.trim(),
        verificationStatus: 'Verified',
        referredBy: referredBy.trim(),
        shiftTimeing: shiftTimeing.trim(),
        monthlySalary: Number(monthlySalary.trim()),
      };

      const result = await registerNestExpert(payload);
      setIsLoading(false);
      setUploadStepText(null);

      if (result.success) {
        addToast('Expert Created', 'Expert created successfully.', 'success');
        if (onSuccess) {
          onSuccess(result.workerId);
        }
        handleClose();
      } else {
        setApiError(result.error || 'Failed to create expert. Please check your information and try again.');
      }
    } catch {
      setIsLoading(false);
      setUploadStepText(null);
      setApiError('An unexpected error occurred during submission. Please try again.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /* ==========================================================================
     Dropdown Option Configurations
     ========================================================================== */

  // 1. Area Name Options
  const areaOptions: CustomSelectOption[] = availableAreas.map((area) => ({
    value: area,
    label: area,
    icon: <MapPin className="h-4 w-4 text-[#5B21B6] shrink-0" />,
  }));

  // 2. Gender Options
  const genderOptions: CustomSelectOption[] = [
    { 
      value: 'Male', 
      label: 'Male', 
      icon: <User className="h-4 w-4 text-[#5B21B6] shrink-0" /> 
    },
    { 
      value: 'Female', 
      label: 'Female', 
      icon: <User className="h-4 w-4 text-[#7C3AED] shrink-0" /> 
    },
    { 
      value: 'Other', 
      label: 'Other', 
      icon: <User className="h-4 w-4 text-[#6B6B6B] shrink-0" /> 
    },
  ];

  // 4. Shifting Time Hours (6, 8, 10, 12 Hours)
  const shiftOptions: CustomSelectOption[] = [6, 8, 10, 12].map((num) => ({
    value: String(num),
    label: `${num} Hours`,
    icon: <Clock className="h-4 w-4 text-[#5B21B6] shrink-0" />,
  }));

  // 5. Bank Name Options (from bankList API)
  const bankOptions: CustomSelectOption[] = bankList.map((bank) => {
    const prefix = getIfscPrefixForBank(bank.name, bank.code);
    return {
      value: bank.name,
      label: bank.name,
      icon: <CreditCard className="h-4 w-4 text-[#5B21B6] shrink-0" />,
      badge: prefix ? (
        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#F5F3FF] text-[#5B21B6] border border-[#DDD6FE]">
          {prefix}
        </span>
      ) : undefined,
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Background Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-[#1F1F1F]/50 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading) handleClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div className="relative z-10 w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl border border-[#EEEEF2] bg-white shadow-soft-lg transition-all overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEF2] bg-[#FAF9FC] px-5 py-4 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#1F1F1F]">New Expert Registration</h3>
            <p className="text-xs text-[#6B6B6B] mt-0.5">
              Enter complete details and upload KYC documents to onboard a new service expert.
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
          <div className="overflow-y-auto p-5 sm:p-6 space-y-6 max-h-[calc(92vh-140px)]">
            {/* API Error Alert */}
            {apiError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FEF2F2] p-3.5 text-xs text-[#B42318] animate-in fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{apiError}</div>
              </div>
            )}

            {/* SECTION 1: Personal Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[#EEEEF2] pb-2">
                <User className="h-4 w-4 text-[#5B21B6] shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">Personal Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Name * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => markTouched('fullName')}
                    placeholder="Enter full name"
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.fullName && errors.fullName
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                  {touched.fullName && errors.fullName && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.fullName}</p>
                  )}
                </div>

                {/* Mobile Number * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-mono font-semibold text-[#6B6B6B]">+91</span>
                    <input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setMobileNumber(raw);
                        if (apiError) setApiError(null);
                      }}
                      onBlur={() => markTouched('mobileNumber')}
                      placeholder="Enter phone number"
                      disabled={isLoading}
                      maxLength={10}
                      className={`w-full rounded-xl border bg-[#FAF9FC] pl-11 pr-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                        touched.mobileNumber && errors.mobileNumber
                          ? 'border-rose-400 focus:ring-rose-500/20'
                          : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                      }`}
                    />
                  </div>
                  {touched.mobileNumber && errors.mobileNumber && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.mobileNumber}</p>
                  )}
                </div>

                {/* Gender * (Custom Modern Select) */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Gender <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={gender}
                    onChange={(val) => {
                      setGender(val);
                      markTouched('gender');
                      if (apiError) setApiError(null);
                    }}
                    options={genderOptions}
                    placeholder="Select gender"
                    disabled={isLoading}
                    hasError={Boolean(touched.gender && errors.gender)}
                  />
                  {touched.gender && errors.gender && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.gender}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/20 transition-all disabled:opacity-50"
                  />
                </div>

                {/* Profile Image (Optional - Integrated with uploadMedia API) */}
                <div className="sm:col-span-2 space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Profile Image <span className="text-[#6B6B6B] text-[11px] font-normal">(Optional)</span>
                  </label>
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden"
                    onChange={handleProfileImageSelection}
                  />

                  {profileImageFile || uploadedProfileImageUrl ? (
                    <div className={`flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                      isUploadingProfileImage 
                        ? 'border-purple-300 bg-purple-50/50' 
                        : profileImageError 
                        ? 'border-rose-300 bg-rose-50' 
                        : 'border-[#DDD6FE] bg-[#F5F3FF]'
                    }`}>
                      <div className="flex items-center gap-3 min-w-0">
                        {profileImagePreview || uploadedProfileImageUrl ? (
                          <div className="relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-[#DDD6FE] shadow-soft-xs bg-white">
                            <img
                              src={profileImagePreview || uploadedProfileImageUrl}
                              alt="Profile Preview"
                              className="h-full w-full object-cover"
                            />
                            {isUploadingProfileImage && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin text-white" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <ImageIcon className="h-8 w-8 text-[#5B21B6] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#1F1F1F] truncate max-w-[220px] sm:max-w-sm">
                            {profileImageFile ? profileImageFile.name : 'Uploaded Profile Image'}
                          </div>
                          <div className="text-[10px] text-[#6B6B6B] font-mono flex items-center gap-1.5 mt-0.5">
                            {profileImageFile && <span>{formatFileSize(profileImageFile.size)}</span>}
                            {isUploadingProfileImage ? (
                              <span className="text-[#5B21B6] font-semibold flex items-center gap-1">
                                <Loader2 className="h-2.5 w-2.5 animate-spin" /> Uploading to server...
                              </span>
                            ) : uploadedProfileImageUrl ? (
                              <span className="text-[#027A48] font-semibold flex items-center gap-1">
                                <Check className="h-3 w-3" /> Uploaded successfully
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => profileImageInputRef.current?.click()}
                          disabled={isLoading || isUploadingProfileImage}
                          className="rounded-lg border border-[#EEEEF2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5B21B6] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileImageFile(null);
                            setUploadedProfileImageUrl('');
                            if (profileImagePreview) {
                              URL.revokeObjectURL(profileImagePreview);
                              setProfileImagePreview(null);
                            }
                            if (profileImageInputRef.current) profileImageInputRef.current.value = '';
                            setProfileImageError(null);
                          }}
                          disabled={isLoading || isUploadingProfileImage}
                          className="rounded-lg p-1 text-[#6B6B6B] hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        if (!isUploadingProfileImage && !isLoading) {
                          profileImageInputRef.current?.click();
                        }
                      }}
                      className={`flex flex-col sm:flex-row items-center justify-center gap-2 rounded-xl border border-dashed p-3.5 text-center cursor-pointer transition-all ${
                        touched.profileImage && errors.profileImage
                          ? 'border-rose-400 bg-rose-50/50'
                          : 'border-[#DDD6FE] bg-[#FAF9FC] hover:bg-[#F5F3FF] hover:border-[#5B21B6]'
                      }`}
                    >
                      <Upload className="h-4 w-4 text-[#5B21B6]" />
                      <span className="text-xs font-semibold text-[#5B21B6]">
                        Choose Profile Image (Optional - JPG, PNG, WebP)
                      </span>
                    </div>
                  )}

                  {/* Profile image validation error */}
                  {touched.profileImage && errors.profileImage && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.profileImage}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: Location Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[#EEEEF2] pb-2">
                <MapPin className="h-4 w-4 text-[#5B21B6] shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">Location Details</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Area Name * (Custom Modern Select with Zero Icon Overlap) */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#1F1F1F]">
                      Area Name <span className="text-rose-500">*</span>
                    </label>
                    {areaFetchError && (
                      <button
                        type="button"
                        onClick={fetchAreas}
                        className="text-[11px] text-[#5B21B6] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RotateCw className="h-2.5 w-2.5" /> Retry
                      </button>
                    )}
                  </div>

                  <CustomSelect
                    value={areaName}
                    onChange={(val) => {
                      setAreaName(val);
                      markTouched('areaName');
                      if (apiError) setApiError(null);
                    }}
                    options={areaOptions}
                    placeholder="Select active area"
                    icon={<MapPin className="h-4 w-4 text-[#5B21B6] shrink-0" />}
                    disabled={isLoading}
                    isLoading={isLoadingAreas}
                    loadingText="Loading active areas..."
                    emptyText="No active areas found"
                    hasError={Boolean(touched.areaName && errors.areaName)}
                  />

                  {touched.areaName && errors.areaName && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.areaName}</p>
                  )}
                </div>

                {/* Address * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => markTouched('address')}
                    placeholder="Enter address"
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.address && errors.address
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                  {touched.address && errors.address && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.address}</p>
                  )}
                </div>

                {/* Latitude */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="Enter latitude"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/20 transition-all disabled:opacity-50"
                  />
                </div>

                {/* Longitude */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="Enter longitude"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Identity & KYC Documents */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[#EEEEF2] pb-2">
                <FileText className="h-4 w-4 text-[#5B21B6] shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
                  Identity & Verification Documents
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Aadhaar Number * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Aadhaar Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={aadhaarNumber}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 12);
                        setAadhaarNumber(clean);
                        if (aadhaarRegisteredError) setAadhaarRegisteredError(null);
                        if (aadhaarCheckApiError) setAadhaarCheckApiError(null);
                        if (apiError) setApiError(null);
                      }}
                      onBlur={() => {
                        markTouched('aadhaarNumber');
                        const trimmed = aadhaarNumber.trim();
                        if (
                          trimmed.length === 12 &&
                          /^\d{12}$/.test(trimmed) &&
                          lastCheckedAadhaarRef.current !== trimmed &&
                          !isCheckingAadhaar
                        ) {
                          performAadhaarCheck(trimmed);
                        }
                      }}
                      placeholder="Enter Aadhaar number"
                      maxLength={12}
                      disabled={isLoading}
                      className={`w-full rounded-xl border bg-[#FAF9FC] pl-3.5 pr-9 py-2.5 text-xs text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                        aadhaarRegisteredError || (touched.aadhaarNumber && errors.aadhaarNumber)
                          ? 'border-rose-400 focus:ring-rose-500/20'
                          : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                      }`}
                    />
                    {isCheckingAadhaar && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <Loader2 className="h-4 w-4 animate-spin text-[#5B21B6]" />
                      </div>
                    )}
                  </div>

                  {/* Loading State */}
                  {isCheckingAadhaar && (
                    <p className="text-[11px] text-[#5B21B6] font-medium flex items-center gap-1.5 mt-1">
                      <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                      <span>Checking Aadhaar...</span>
                    </p>
                  )}

                  {/* Already Registered Error */}
                  {!isCheckingAadhaar && aadhaarRegisteredError && (
                    <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span>{aadhaarRegisteredError}</span>
                    </p>
                  )}

                  {/* API Failure Generic Error */}
                  {!isCheckingAadhaar && !aadhaarRegisteredError && aadhaarCheckApiError && (
                    <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span>{aadhaarCheckApiError}</span>
                    </p>
                  )}

                  {/* Standard Validation Error */}
                  {!isCheckingAadhaar && !aadhaarRegisteredError && !aadhaarCheckApiError && touched.aadhaarNumber && errors.aadhaarNumber && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1">{errors.aadhaarNumber}</p>
                  )}
                </div>

                {/* PAN Number * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    PAN Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={panNumber}
                    onChange={(e) => {
                      const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
                      setPanNumber(clean);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => markTouched('panNumber')}
                    placeholder="Enter PAN number"
                    maxLength={10}
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono uppercase placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.panNumber && errors.panNumber
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                  {touched.panNumber && errors.panNumber && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.panNumber}</p>
                  )}
                </div>

                {/* Aadhaar Front File Upload */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">Aadhaar Front Document</label>
                  <input
                    ref={aadhaarFrontInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleDocFileSelection(e, setAadhaarFrontFile)}
                  />
                  {aadhaarFrontFile ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="h-5 w-5 text-[#5B21B6] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#1F1F1F] truncate max-w-[150px]">
                            {aadhaarFrontFile.name}
                          </div>
                          <div className="text-[10px] text-[#6B6B6B] font-mono">
                            {formatFileSize(aadhaarFrontFile.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAadhaarFrontFile(null);
                          if (aadhaarFrontInputRef.current) aadhaarFrontInputRef.current.value = '';
                        }}
                        className="rounded-lg p-1 text-[#6B6B6B] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => aadhaarFrontInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF9FC] hover:bg-[#F5F3FF] hover:border-[#5B21B6] p-2.5 text-center cursor-pointer transition-all"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#5B21B6]" />
                      <span className="text-xs font-semibold text-[#5B21B6]">Upload Aadhaar Front</span>
                    </div>
                  )}
                </div>

                {/* Aadhaar Back File Upload */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">Aadhaar Back Document</label>
                  <input
                    ref={aadhaarBackInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleDocFileSelection(e, setAadhaarBackFile)}
                  />
                  {aadhaarBackFile ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="h-5 w-5 text-[#5B21B6] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#1F1F1F] truncate max-w-[150px]">
                            {aadhaarBackFile.name}
                          </div>
                          <div className="text-[10px] text-[#6B6B6B] font-mono">
                            {formatFileSize(aadhaarBackFile.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAadhaarBackFile(null);
                          if (aadhaarBackInputRef.current) aadhaarBackInputRef.current.value = '';
                        }}
                        className="rounded-lg p-1 text-[#6B6B6B] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => aadhaarBackInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF9FC] hover:bg-[#F5F3FF] hover:border-[#5B21B6] p-2.5 text-center cursor-pointer transition-all"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#5B21B6]" />
                      <span className="text-xs font-semibold text-[#5B21B6]">Upload Aadhaar Back</span>
                    </div>
                  )}
                </div>

                {/* PAN Card File Upload */}
                <div className="sm:col-span-2 space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">PAN Card Document</label>
                  <input
                    ref={panCardInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => handleDocFileSelection(e, setPanCardFile)}
                  />
                  {panCardFile ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] p-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileCheck className="h-5 w-5 text-[#5B21B6] shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-[#1F1F1F] truncate max-w-[200px]">
                            {panCardFile.name}
                          </div>
                          <div className="text-[10px] text-[#6B6B6B] font-mono">
                            {formatFileSize(panCardFile.size)}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPanCardFile(null);
                          if (panCardInputRef.current) panCardInputRef.current.value = '';
                        }}
                        className="rounded-lg p-1 text-[#6B6B6B] hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => panCardInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#DDD6FE] bg-[#FAF9FC] hover:bg-[#F5F3FF] hover:border-[#5B21B6] p-2.5 text-center cursor-pointer transition-all"
                    >
                      <Upload className="h-3.5 w-3.5 text-[#5B21B6]" />
                      <span className="text-xs font-semibold text-[#5B21B6]">Upload PAN Card Document (Optional)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 4: Bank Details * */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[#EEEEF2] pb-2">
                <CreditCard className="h-4 w-4 text-[#5B21B6] shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
                  Bank Details <span className="text-rose-500">*</span>
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Bank Name * (Searchable Dropdown from bankList API with IFSC prefix badges) */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#1F1F1F]">
                      Bank Name <span className="text-rose-500">*</span>
                    </label>
                    {bankFetchError && (
                      <button
                        type="button"
                        onClick={fetchBanks}
                        className="text-[11px] text-[#5B21B6] hover:underline flex items-center gap-1 font-semibold"
                      >
                        <RotateCw className="h-2.5 w-2.5" /> Retry
                      </button>
                    )}
                  </div>

                  <CustomSelect
                    value={bankName}
                    onChange={(val) => {
                      setBankName(val);
                      const found = bankList.find((b) => b.name === val);
                      const code = found?.code || '';
                      setSelectedBankCode(code);
                      markTouched('bankName');
                      if (apiError) setApiError(null);

                      const prefix = getIfscPrefixForBank(val, code);
                      if (prefix && (!ifscCode || ifscCode.length <= 4)) {
                        setIfscCode(prefix);
                      }
                    }}
                    options={bankOptions}
                    placeholder="Select bank"
                    searchable={true}
                    searchPlaceholder="Search bank name..."
                    icon={<CreditCard className="h-4 w-4 text-[#5B21B6] shrink-0" />}
                    disabled={isLoading}
                    isLoading={isLoadingBanks}
                    loadingText="Loading banks..."
                    emptyText="No banks available"
                    hasError={Boolean(touched.bankName && errors.bankName)}
                  />

                  {touched.bankName && errors.bankName && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.bankName}</p>
                  )}
                </div>

                {/* Account Number * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Account Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 18);
                      setAccountNumber(clean);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => markTouched('accountNumber')}
                    placeholder="Enter account number"
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.accountNumber && errors.accountNumber
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                  {touched.accountNumber && errors.accountNumber && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.accountNumber}</p>
                  )}
                </div>

                {/* IFSC Code * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    IFSC Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => {
                      const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
                      setIfscCode(clean);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => markTouched('ifscCode')}
                    placeholder="Enter IFSC code"
                    maxLength={11}
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono uppercase placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.ifscCode && errors.ifscCode
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                  {touched.ifscCode && errors.ifscCode && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.ifscCode}</p>
                  )}
                </div>

                {/* Account Holder Name * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Account Holder Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => {
                      setAccountHolderName(e.target.value);
                      if (apiError) setApiError(null);
                    }}
                    onBlur={() => markTouched('accountHolderName')}
                    placeholder="Enter account holder name"
                    disabled={isLoading}
                    className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      touched.accountHolderName && errors.accountHolderName
                        ? 'border-rose-400 focus:ring-rose-500/20'
                        : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                    }`}
                  />
                  {touched.accountHolderName && errors.accountHolderName && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.accountHolderName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 5: Operational & Other Details */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 border-b border-[#EEEEF2] pb-2">
                <Briefcase className="h-4 w-4 text-[#5B21B6] shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1F1F1F]">
                  Operational & Other Details
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Shifting Time Hours * (Custom Modern Select 1 to 12) */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Shifting Time Hours <span className="text-rose-500">*</span>
                  </label>
                  <CustomSelect
                    value={shiftTimeing}
                    onChange={(val) => {
                      setShiftTimeing(val);
                      markTouched('shiftTimeing');
                      if (apiError) setApiError(null);
                    }}
                    options={shiftOptions}
                    placeholder="Select shift hours"
                    icon={<Clock className="h-4 w-4 text-[#5B21B6] shrink-0" />}
                    disabled={isLoading}
                    hasError={Boolean(touched.shiftTimeing && errors.shiftTimeing)}
                  />
                  {touched.shiftTimeing && errors.shiftTimeing && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.shiftTimeing}</p>
                  )}
                </div>

                {/* Monthly Salary * */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">
                    Monthly Salary (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-mono font-bold text-[#6B6B6B]">₹</span>
                    <input
                      type="text"
                      value={monthlySalary}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '');
                        setMonthlySalary(clean);
                        if (apiError) setApiError(null);
                      }}
                      onBlur={() => markTouched('monthlySalary')}
                      placeholder="Enter monthly salary"
                      disabled={isLoading}
                      className={`w-full rounded-xl border bg-[#FAF9FC] pl-8 pr-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono font-semibold placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                        touched.monthlySalary && errors.monthlySalary
                          ? 'border-rose-400 focus:ring-rose-500/20'
                          : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                      }`}
                    />
                  </div>
                  {touched.monthlySalary && errors.monthlySalary && (
                    <p className="text-[11px] text-rose-600 font-medium">{errors.monthlySalary}</p>
                  )}
                </div>

                {/* Referred By */}
                <div className="space-y-1 min-w-0">
                  <label className="block text-xs font-semibold text-[#1F1F1F]">Referred By</label>
                  <input
                    type="text"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="Enter referrer ID"
                    disabled={isLoading}
                    className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2.5 text-xs text-[#1F1F1F] font-mono placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-2 focus:ring-[#5B21B6]/20 transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between border-t border-[#EEEEF2] bg-[#FAF9FC] px-5 py-3.5 shrink-0">
            <div className="text-xs text-[#6B6B6B] truncate">
              {uploadStepText ? (
                <span className="flex items-center gap-1.5 font-medium text-[#5B21B6]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {uploadStepText}
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading || isUploadingProfileImage}
                className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#6B6B6B] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingProfileImage}
                className="flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2 text-xs font-bold transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Register Expert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
