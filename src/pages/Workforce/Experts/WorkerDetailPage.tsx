import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useOperations } from '../../../context/OperationsContext';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Drawer } from '../../../components/common/Drawer';
import { 
  getNestWorkerById, 
  updateNestExperts, 
  getNestWorkers, 
  getActiveAreas,
  ActiveAreaItem,
  RawApiExpertDetail 
} from '../../../services/api';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  AlertCircle,
  FileCheck,
  Pencil,
  Check,
  X,
  Loader2,
  CreditCard,
  User,
  Radio,
  ExternalLink
} from 'lucide-react';

export const WorkerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useOperations();

  // Check if URL has ?edit=true or state has edit: true
  const queryParams = new URLSearchParams(location.search);
  const initialEditMode = queryParams.get('edit') === 'true' || Boolean((location.state as any)?.edit);

  // Profile data states
  const [expert, setExpert] = useState<RawApiExpertDetail | null>(null);
  const [resolvedTableId, setResolvedTableId] = useState<string>((location.state as any)?.tableId || '');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Editable Form fields
  const [editAreaName, setEditAreaName] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editIfscCode, setEditIfscCode] = useState('');
  const [editAccountHolderName, setEditAccountHolderName] = useState('');
  const [editJoiningStatus, setEditJoiningStatus] = useState('Active');
  const [editReferredBy, setEditReferredBy] = useState('');
  const [editShiftTimeing, setEditShiftTimeing] = useState('9');
  const [editMonthlySalary, setEditMonthlySalary] = useState('20000');

  // Available Active Areas
  const [availableAreas, setAvailableAreas] = useState<string[]>([
    'Haatza_corp',
    'Neo_Town',
    'Prestiage',
    'neeladri_Nagar',
    'Electronic City',
  ]);

  useEffect(() => {
    getActiveAreas().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const areaNames = res.data.map((a: ActiveAreaItem) => a.areaName).filter(Boolean);
        if (areaNames.length > 0) {
          setAvailableAreas((prev) => Array.from(new Set([...areaNames, ...prev])));
        }
      }
    });
  }, []);

  // Sync edit form fields from loaded expert data
  const syncEditFields = (data: RawApiExpertDetail) => {
    setEditAreaName(data.areaName || '');
    setEditBankName(data.bankName || '');
    setEditAccountNumber(data.accountNumber || '');
    setEditIfscCode(data.ifscCode || '');
    setEditAccountHolderName(data.accountHolderName || data.fullName || '');
    setEditJoiningStatus((data.joiningStatus || 'Active').trim());
    setEditReferredBy(data.referredBy || '');
    setEditShiftTimeing(data.shiftTimeing !== undefined ? String(data.shiftTimeing) : '9');
    setEditMonthlySalary(data.monthlySalary !== undefined ? String(data.monthlySalary) : '20000');
  };

  // Fetch full expert data
  const fetchExpertData = useCallback(async () => {
    if (!id) return;

    setIsLoading(true);
    setApiError(null);
    setSaveError(null);

    let tableIdToUse = resolvedTableId;

    // If tableId is not yet resolved, determine if `id` is a UUID tableId or workerId
    if (!tableIdToUse) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        tableIdToUse = id;
      } else {
        // Assume `id` is workerId (e.g. HN-1034), look up its tableId
        const searchRes = await getNestWorkers({ workerId: id });
        if (searchRes.success && Array.isArray(searchRes.data) && searchRes.data.length > 0) {
          tableIdToUse = searchRes.data[0].tableId;
        }
      }
    }

    if (!tableIdToUse) {
      setIsLoading(false);
      setApiError(`Could not find expert record for identifier: ${id}`);
      return;
    }

    setResolvedTableId(tableIdToUse);

    const res = await getNestWorkerById(tableIdToUse);
    setIsLoading(false);

    if (res.success && res.data) {
      setExpert(res.data);
      syncEditFields(res.data);
    } else {
      setApiError(res.error || 'Unable to load expert details.');
    }
  }, [id, resolvedTableId]);

  useEffect(() => {
    fetchExpertData();
  }, [fetchExpertData]);

  // Handle Save / Submit of Update
  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedTableId) return;

    setIsSaving(true);
    setSaveError(null);

    const updatePayload = {
      tableId: resolvedTableId,
      areaName: editAreaName.trim(),
      bankName: editBankName.trim(),
      accountNumber: editAccountNumber.trim(),
      ifscCode: editIfscCode.trim(),
      accountHolderName: editAccountHolderName.trim(),
      joiningStatus: editJoiningStatus.trim(),
      referredBy: editReferredBy.trim(),
      shiftTimeing: editShiftTimeing.trim() ? (isNaN(Number(editShiftTimeing)) ? editShiftTimeing.trim() : Number(editShiftTimeing.trim())) : 10,
      monthlySalary: editMonthlySalary.trim() ? Number(editMonthlySalary.trim()) : 20000,
    };

    const res = await updateNestExperts(updatePayload);
    setIsSaving(false);

    if (res.success) {
      addToast('Expert Updated', 'Expert updated successfully.', 'success');
      setIsEditMode(false);
      // Refresh profile data from backend
      fetchExpertData();
    } else {
      setSaveError(res.error || 'Unable to update expert.');
    }
  };

  // Loading State
  if (isLoading && !expert) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/experts')}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-[#6B6B6B]">Loading Expert Profile...</span>
        </div>
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-12 text-center shadow-soft-sm space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#5B21B6] mx-auto" />
          <p className="text-xs text-[#6B6B6B]">Fetching complete expert information from server...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (apiError && !expert) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/experts')}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-[#6B6B6B]">Expert Profile</span>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-[#FEF2F2] p-8 text-center space-y-4 shadow-soft-sm">
          <AlertCircle className="h-8 w-8 text-[#B42318] mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-[#1F1F1F]">Unable to load expert</h3>
            <p className="text-xs text-[#6B6B6B] mt-1">{apiError}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchExpertData()}
              className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-4 py-2 text-xs font-bold transition-all shadow-soft-sm cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/experts')}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer"
            >
              Return to Experts Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!expert) return null;

  const fullName = expert.fullName || 'Expert Profile';
  const workerId = expert.workerId || id || '—';
  const avatarUrl = expert.profileImage || '';
  const joiningStatusClean = (expert.joiningStatus || 'Active').trim();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/experts')}
            className="rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] shadow-soft-sm transition-colors cursor-pointer"
            title="Return to Experts Directory"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-mono text-[#6B6B6B]">
            Expert Directory / <strong className="text-[#1F1F1F]">{workerId}</strong>
          </span>
        </div>
      </div>

      {/* Header Profile Hero Card */}
      <div className="rounded-2xl border border-[#EEEEF2] bg-white p-6 shadow-soft-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-[#EEEEF2] shadow-soft-sm bg-[#EDE9FE] flex items-center justify-center relative shrink-0">
              <span className="font-bold text-2xl text-[#5B21B6] select-none">
                {fullName ? fullName.charAt(0).toUpperCase() : <User className="h-8 w-8 text-[#5B21B6]" />}
              </span>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl font-bold text-[#1F1F1F]">{fullName}</h1>
                <span className="font-mono text-xs text-[#6B6B6B] font-semibold">{workerId}</span>
              </div>

              {/* Row 1: Active | Prestige | Verified */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge 
                  status={isEditMode ? editJoiningStatus : joiningStatusClean} 
                  size="sm" 
                  pulse={(isEditMode ? editJoiningStatus : joiningStatusClean) === 'Active'} 
                />
                <span className="text-[#D1D5DB] select-none font-light">|</span>
                <span className="inline-flex items-center gap-1 font-mono text-[#5B21B6] font-semibold bg-[#EDE9FE] px-2.5 py-0.5 rounded-lg text-xs">
                  <MapPin className="h-3.5 w-3.5 text-[#5B21B6]" />
                  {isEditMode ? (editAreaName || expert.areaName || '—') : (expert.areaName || '—')} Zone
                </span>
                <span className="text-[#D1D5DB] select-none font-light">|</span>
                <span className="inline-flex items-center gap-1 text-[#027A48] font-semibold bg-[#ECFDF3] px-2.5 py-0.5 rounded-lg text-xs">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#027A48]" />
                  {expert.verificationStatus || 'Verified'}
                </span>
              </div>

              {/* Row 2: Joined | Female | (Optional Service Category) */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#6B6B6B]">
                {expert.joinedDate ? (
                  <>
                    <span className="inline-flex items-center gap-1 bg-[#FAF9FC] border border-[#EEEEF2] px-2.5 py-0.5 rounded-lg text-[11px] font-medium text-[#4B5563]">
                      <Calendar className="h-3.5 w-3.5 text-[#6B6B6B]" />
                      Joined {new Date(expert.joinedDate).toLocaleDateString()}
                    </span>
                    {(expert.gender || expert.serviceCategory) && (
                      <span className="text-[#D1D5DB] select-none font-light">|</span>
                    )}
                  </>
                ) : null}
                {expert.gender && (
                  <>
                    <span className="inline-flex items-center rounded-lg bg-[#FAF9FC] border border-[#EEEEF2] px-2.5 py-0.5 text-[11px] font-semibold text-[#4B5563]">
                      {expert.gender}
                    </span>
                    {expert.serviceCategory && (
                      <span className="text-[#D1D5DB] select-none font-light">|</span>
                    )}
                  </>
                )}
                {expert.serviceCategory && (
                  <span className="inline-flex items-center rounded-lg bg-[#FAF9FC] border border-[#EEEEF2] px-2.5 py-0.5 text-[11px] font-semibold text-[#1F1F1F]">
                    {expert.serviceCategory}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Header Area */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                syncEditFields(expert);
                setIsEditMode(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2.5 text-xs font-bold transition-all shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Operational & Zone Details */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#5B21B6]" />
                Operational & Area Entitlements
              </h2>
              <StatusBadge status={joiningStatusClean} size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Base Nano-Market */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Base Area
                </span>
                <div className="font-mono text-sm font-bold text-[#5B21B6]">
                  {expert.areaName || '—'}
                </div>
              </div>

              {/* Joining Status */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Status
                </span>
                <div className="font-semibold text-xs text-[#1F1F1F]">
                  {expert.joiningStatus || '—'}
                </div>
              </div>

              {/* Shift Timing */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Shift Timing
                </span>
                <div className="font-mono text-xs font-bold text-[#1F1F1F]">
                  {expert.shiftTimeing !== undefined ? `${expert.shiftTimeing} hrs` : '—'}
                </div>
              </div>

              {/* Referred By */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Referred By
                </span>
                <div className="font-mono text-xs font-semibold text-[#7C3AED]">
                  {expert.referredBy || '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Identity & Compliance Verification Documents */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-3">
              <h2 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-[#5B21B6]" />
                Identity & KYC Documentation
              </h2>
              <StatusBadge status={expert.verificationStatus || 'Verified'} size="sm" />
            </div>

            <div className="space-y-3 text-xs">
              {/* Aadhaar Row */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1F1F1F]">Aadhaar Card</div>
                  <div className="font-mono text-[11px] text-[#6B6B6B] mt-0.5">
                    {expert.aadhaarNumber ? `Number: ${expert.aadhaarNumber}` : 'Number: Not Provided'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expert.aadhaarFront && (
                    <a
                      href={expert.aadhaarFront}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#EEEEF2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors"
                    >
                      <span>Front Doc</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {expert.aadhaarBack && (
                    <a
                      href={expert.aadhaarBack}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#EEEEF2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors"
                    >
                      <span>Back Doc</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!expert.aadhaarFront && !expert.aadhaarBack && (
                    <span className="text-[11px] text-[#6B6B6B]">No image uploaded</span>
                  )}
                </div>
              </div>

              {/* PAN Row */}
              <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#1F1F1F]">PAN Card</div>
                  <div className="font-mono text-[11px] text-[#6B6B6B] mt-0.5">
                    {expert.panNumber ? `Number: ${expert.panNumber}` : 'Number: Not Provided'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expert.panCard ? (
                    <a
                      href={expert.panCard}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-[#EEEEF2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors"
                    >
                      <span>View PAN Document</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-[#6B6B6B]">No image uploaded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Information & Banking */}
        <div className="space-y-6">
          {/* Card 3: Personal Information */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-3 text-xs">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-[#5B21B6]" />
              Personal Information
            </h3>

            <div className="space-y-2.5">
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">PHONE / MOBILE</span>
                <div className="font-mono text-[#1F1F1F] font-semibold mt-0.5 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-[#5B21B6]" />
                  {expert.mobileNumber || '—'}
                </div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">GENDER</span>
                <div className="text-[#1F1F1F] mt-0.5 font-medium">{expert.gender || '—'}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">DATE OF BIRTH</span>
                <div className="text-[#1F1F1F] mt-0.5">
                  {expert.dateOfBirth ? new Date(expert.dateOfBirth).toLocaleDateString() : '—'}
                </div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">REGISTERED ADDRESS</span>
                <div className="text-[#1F1F1F] mt-0.5">{expert.address || '—'}</div>
              </div>
              <div>
                <span className="text-[#6B6B6B] font-mono text-[10px]">GPS COORDINATES</span>
                <div className="font-mono text-[#1F1F1F] mt-0.5 flex items-center gap-1">
                  <Radio className="h-3 w-3 text-[#5B21B6]" />
                  {expert.latitude && expert.longitude
                    ? `${Number(expert.latitude).toFixed(4)}° N, ${Number(expert.longitude).toFixed(4)}° E`
                    : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Banking & Financials */}
          <div className="rounded-2xl border border-[#EEEEF2] bg-white p-5 shadow-soft-sm space-y-4 text-xs">
            <h3 className="text-sm font-bold text-[#1F1F1F] uppercase tracking-wider border-b border-[#EEEEF2] pb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#5B21B6]" />
              Banking & Salary Details
            </h3>

            <div className="space-y-2.5">
              {/* Monthly Salary */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Monthly Salary
                </span>
                <div className="font-mono text-base font-bold text-emerald-700 mt-0.5">
                  {expert.monthlySalary ? `₹${Number(expert.monthlySalary).toLocaleString('en-IN')}` : '—'}
                </div>
              </div>

              {/* Bank Name */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Bank Name
                </span>
                <div className="font-semibold text-xs text-[#1F1F1F] mt-0.5">{expert.bankName || '—'}</div>
              </div>

              {/* Account Number */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Account No.
                </span>
                <div className="font-mono text-xs text-[#1F1F1F] mt-0.5">{expert.accountNumber || '—'}</div>
              </div>

              {/* IFSC Code */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  IFSC Code
                </span>
                <div className="font-mono text-xs text-[#1F1F1F] mt-0.5">{expert.ifscCode || '—'}</div>
              </div>

              {/* Account Holder Name */}
              <div className="space-y-1">
                <span className="text-[11px] text-[#6B6B6B] font-mono uppercase font-semibold">
                  Holder Name
                </span>
                <div className="text-xs text-[#1F1F1F] font-semibold mt-0.5">
                  {expert.accountHolderName || expert.fullName || '—'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Responsive Drawer/Panel (Right-side drawer on Desktop, Popup/Card on Tablet & Mobile) */}
      <Drawer
        isOpen={isEditMode}
        onClose={() => {
          setIsEditMode(false);
          setSaveError(null);
        }}
        title="Edit Expert Profile"
        subtitle={`${fullName} • ID: ${workerId}`}
        width="lg"
        lockBackgroundScroll={true}
      >
        <form onSubmit={handleSaveUpdate} className="space-y-5 text-xs">
          {saveError && (
            <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-[#FEF2F2] p-3 text-xs text-[#B42318]">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="font-semibold">{saveError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="rounded-lg p-1 hover:bg-rose-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: Operational & Area Entitlements */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider border-b border-[#EEEEF2] pb-1.5 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-[#5B21B6]" />
              Operational & Area Entitlements
            </h4>

            {/* Base Area - Single row layout to prevent unnecessary wrapping */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Base Area
              </label>
              <select
                value={editAreaName}
                onChange={(e) => setEditAreaName(e.target.value)}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              >
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {/* Status - Single row layout */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Joining Status
              </label>
              <select
                value={editJoiningStatus}
                onChange={(e) => setEditJoiningStatus(e.target.value)}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Shift Timing - Single row layout */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Shift Timing
              </label>
              <input
                type="text"
                value={editShiftTimeing}
                onChange={(e) => setEditShiftTimeing(e.target.value)}
                placeholder="Enter shift hours"
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-mono font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              />
            </div>

            {/* Referred By - Single row layout */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Referred By
              </label>
              <input
                type="text"
                value={editReferredBy}
                onChange={(e) => setEditReferredBy(e.target.value)}
                placeholder="Enter referrer ID"
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-mono font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              />
            </div>
          </div>

          {/* Section 2: Banking & Compensation Details */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold text-[#6B6B6B] uppercase tracking-wider border-b border-[#EEEEF2] pb-1.5 flex items-center gap-1.5">
              <CreditCard className="h-3.5 w-3.5 text-[#5B21B6]" />
              Banking & Compensation
            </h4>

            {/* Monthly Salary */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Monthly Salary
              </label>
              <input
                type="number"
                value={editMonthlySalary}
                onChange={(e) => setEditMonthlySalary(e.target.value)}
                placeholder="Enter monthly salary"
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-mono font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              />
            </div>

            {/* Bank Name */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Bank Name
              </label>
              <input
                type="text"
                value={editBankName}
                onChange={(e) => setEditBankName(e.target.value)}
                placeholder="Enter bank name"
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              />
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Account No.
              </label>
              <input
                type="text"
                value={editAccountNumber}
                onChange={(e) => setEditAccountNumber(e.target.value)}
                placeholder="Enter account number"
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-mono font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              />
            </div>

            {/* IFSC Code */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                IFSC Code
              </label>
              <input
                type="text"
                value={editIfscCode}
                onChange={(e) => setEditIfscCode(e.target.value.toUpperCase())}
                placeholder="Enter IFSC code"
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-mono uppercase font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              />
            </div>

            {/* Account Holder Name */}
            <div className="flex items-center justify-between gap-3">
              <label className="text-[11px] font-semibold text-[#6B6B6B] shrink-0 w-28 whitespace-nowrap">
                Holder Name
              </label>
              <input
                type="text"
                value={editAccountHolderName}
                onChange={(e) => setEditAccountHolderName(e.target.value)}
                placeholder="Enter account holder name"
                disabled={isSaving}
                className="flex-1 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-1.5 text-xs font-medium text-[#1F1F1F] focus:bg-white focus:outline-none focus:border-[#5B21B6] focus:ring-1 focus:ring-[#5B21B6]/20 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#EEEEF2]">
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                setSaveError(null);
              }}
              disabled={isSaving}
              className="rounded-xl border border-[#EEEEF2] bg-white px-4 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#FAF9FC] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2 text-xs font-bold transition-all shadow-soft-sm active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Drawer>
    </div>
  );
};
