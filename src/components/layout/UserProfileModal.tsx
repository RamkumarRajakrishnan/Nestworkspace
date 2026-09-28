import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Key, 
  CheckCircle2, 
  Copy, 
  Check 
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, role, locations } = useAuth();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return 'Not available';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'OP';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Profile Details"
      subtitle="Authenticated employee session & access entitlements"
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white px-5 py-2 text-xs font-bold transition-all shadow-soft-sm active:scale-95 cursor-pointer"
          >
            Close
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Top Header Identity Banner */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 rounded-2xl bg-gradient-to-br from-[#FAF9FC] to-[#F5F3FF] border border-[#DDD6FE]/60 p-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#5B21B6] text-white font-bold text-xl shadow-soft-md">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={user.fullName || 'User Profile'}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              initials
            )}
            <span
              className={`absolute -bottom-1 -right-1 flex h-4 w-4 rounded-full ring-2 ring-white ${
                user?.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'
              }`}
              title={`Status: ${user?.status || 'Unknown'}`}
            />
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-lg font-bold text-[#1F1F1F]">
                {user?.fullName || 'Nest Employee'}
              </h2>
              {user?.employeeId && (
                <span className="font-mono text-xs font-bold bg-[#EDE9FE] text-[#5B21B6] px-2.5 py-0.5 rounded-lg border border-[#DDD6FE]">
                  {user.employeeId}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-[#6B6B6B]">
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-[#5B21B6]" />
                {user?.email || 'No email registered'}
              </span>
              {user?.phone && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="h-3.5 w-3.5 text-[#5B21B6]" />
                    {user.phone}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Account: {user?.status || 'Active'}
              </span>
              {user?.verificationStatus && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B21B6]">
                  <ShieldCheck className="h-3 w-3" />
                  {user.verificationStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User Identity Details Grid */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#EEEEF2] pb-2">
            <User className="h-4 w-4 text-[#5B21B6]" />
            Employee Identity & Login Telemetry
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
              <span className="text-[#6B6B6B] text-[11px]">System User ID</span>
              <div className="flex items-center justify-between font-mono font-semibold text-[#1F1F1F]">
                <span className="truncate mr-2">{user?.userId || 'N/A'}</span>
                {user?.userId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(user.userId, 'userId')}
                    className="text-[#6B6B6B] hover:text-[#5B21B6] transition-colors p-1"
                    title="Copy User ID"
                  >
                    {copiedKey === 'userId' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
              <span className="text-[#6B6B6B] text-[11px]">Employee ID</span>
              <div className="flex items-center justify-between font-mono font-bold text-[#5B21B6]">
                <span>{user?.employeeId || 'N/A'}</span>
                {user?.employeeId && (
                  <button
                    type="button"
                    onClick={() => handleCopy(user.employeeId, 'empId')}
                    className="text-[#6B6B6B] hover:text-[#5B21B6] transition-colors p-1"
                    title="Copy Employee ID"
                  >
                    {copiedKey === 'empId' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1 sm:col-span-2">
              <span className="text-[#6B6B6B] text-[11px] flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#5B21B6]" /> Last Login Session
              </span>
              <div className="font-mono text-[#1F1F1F] font-medium text-xs">
                {formatDateTime(user?.lastLoginAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Role & Access Permissions */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3">
          <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-1.5 border-b border-[#EEEEF2] pb-2">
            <Key className="h-4 w-4 text-[#5B21B6]" />
            Role & Security Entitlements
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
              <span className="text-[#6B6B6B] text-[11px]">Role Code</span>
              <div className="font-mono font-bold text-[#5B21B6]">
                {role?.roleCode || 'NEST_FIELD_EMPLOYEE'}
              </div>
            </div>

            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
              <span className="text-[#6B6B6B] text-[11px]">Role ID</span>
              <div className="font-mono text-[#1F1F1F] truncate" title={role?.userRoleId}>
                {role?.userRoleId || 'N/A'}
              </div>
            </div>

            <div className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 space-y-1">
              <span className="text-[#6B6B6B] text-[11px]">Role Status</span>
              <div className="font-semibold text-emerald-700">
                {role?.status || 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Operational Locations / Clusters */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#EEEEF2] pb-2">
            <h3 className="text-xs font-bold text-[#1F1F1F] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#5B21B6]" />
              Assigned Operational Locations ({locations?.length || 0})
            </h3>
            <span className="text-[11px] text-[#6B6B6B]">Geo-Fenced Access</span>
          </div>

          {locations && locations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {locations.map((loc, idx) => (
                <div
                  key={loc.userLocationId || idx}
                  className="flex items-center justify-between rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-3 text-xs hover:border-[#DDD6FE] transition-colors"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-bold text-[#1F1F1F] capitalize truncate">
                      {loc.areaName ? loc.areaName.replace(/_/g, ' ') : 'General Area'}
                    </div>
                    <div className="font-mono text-[10px] text-[#6B6B6B] truncate">
                      {loc.userLocationId}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="rounded-lg bg-[#EDE9FE] px-2 py-0.5 text-[10px] font-bold text-[#5B21B6]">
                      {loc.accessLevel || 'FULL'}
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      {loc.status || 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-[#6B6B6B] bg-[#FAF9FC] rounded-xl border border-[#EEEEF2]">
              No location restrictions. Full organizational clearance.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
