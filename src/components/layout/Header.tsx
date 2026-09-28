import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  MapPin,
  Clock,
  ChevronDown,
  Flame,
  Menu,
  LogOut,
  User
} from 'lucide-react';
import { useOperations } from '../../context/OperationsContext';
import { useAuth } from '../../context/AuthContext';
import { SearchInput } from '../common/SearchInput';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { Modal } from '../common/Modal';
import { UserProfileModal } from './UserProfileModal';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const {
    markets,
    selectedMarketId,
    setSelectedMarketId,
    notifications,
    runScenario1CapacityCrunch
  } = useOperations();
  const { user, role, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleSearchSubmit = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) return;
    if (val.toUpperCase().startsWith('BK-') || val.startsWith('10')) {
      navigate('/orders');
    } else if (val.toUpperCase().startsWith('WRK-')) {
      navigate('/workers');
    } else {
      navigate('/dispatch');
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate('/login', { replace: true });
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
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-purple-200 bg-purple-100 px-3 sm:px-6 shadow-soft-sm gap-2">
        {/* Left: Mobile Hamburger & Search & Market Filter */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 max-w-xl">
          {/* Hamburger button on mobile */}
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] p-2 text-[#6B6B6B] hover:text-[#5B21B6] hover:bg-[#EDE9FE] transition-colors shrink-0 cursor-pointer"
            aria-label="Open Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <SearchInput
            value={searchQuery}
            onChange={handleSearchSubmit}
            placeholder="Search booking, expert..."
            className="w-full max-w-[200px] sm:max-w-xs"
          />

          {/* Market Selector (hidden on small mobile to prevent squish) */}
          <div className="relative hidden md:flex items-center shrink-0">
            <MapPin className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#5B21B6]" />
            <select
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
              aria-label="Select Nano Market"
              className="appearance-none rounded-xl border border-[#EEEEF2] bg-[#F7F5FA] py-2 pl-8 pr-8 text-xs font-semibold text-[#1F1F1F] focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 cursor-pointer transition-all"
            >
              <option value="ALL">All Nano-Markets (Bengaluru)</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id} — {m.name} ({m.capacity}%)
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 h-3.5 w-3.5 text-[#6B6B6B]" />
          </div>
        </div>

        {/* Right: Quick Demos, Live Time, Notifications, Admin Profile Dropdown */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Scenario 1 Trigger Button */}
          <button
            onClick={() => {
              runScenario1CapacityCrunch();
              navigate('/markets/KOR-03');
            }}
            className="hidden lg:flex items-center gap-1.5 rounded-xl border border-[#FECDCA] bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#B42318] hover:bg-[#FEE2E2] transition-all shadow-soft-sm active:scale-95 cursor-pointer"
            title="Demonstrate Scenario 1: KOR-03 100% Capacity Crunch Escalation"
          >
            <Flame className="h-3.5 w-3.5 text-[#B42318] animate-pulse" />
            <span>Scenario 1: KOR-03 Crunch</span>
          </button>

          {/* Live IST Clock */}
          <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs text-[#6B6B6B] font-mono font-medium">
            <Clock className="h-3.5 w-3.5 text-[#5B21B6]" />
            <span>
              {currentTime.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })},{' '}
              {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>

          {/* Notifications Bell */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors cursor-pointer"
            title="Operational Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#5B21B6] text-[10px] font-bold text-white shadow-sm">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Admin Profile Dropdown Menu */}
          <div className="relative border-l border-purple-200 pl-2 sm:pl-3" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 sm:gap-2.5 rounded-xl p-1.5 hover:bg-[#FAF9FC] transition-all cursor-pointer focus:outline-none"
              aria-expanded={isProfileDropdownOpen}
              aria-haspopup="true"
              id="profile-dropdown-trigger"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#EDE9FE] text-[#5B21B6] font-bold text-xs shadow-soft-sm">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.fullName || 'User'}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#1F1F1F] leading-tight">
                  {user?.fullName || 'Operations User'}
                </span>
                <span className="text-[10px] text-[#5B21B6] font-semibold leading-tight mt-0.5">
                  {role?.roleCode || user?.employeeId || 'Operations Manager'}
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#6B6B6B] transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180 text-[#5B21B6]' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu Popup */}
            {isProfileDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[#EEEEF2] bg-white p-2 shadow-soft-lg z-50 animate-in fade-in zoom-in-95">
                {/* User Mini Summary Header */}
                <div className="border-b border-[#EEEEF2] px-3 py-2.5 bg-[#FAF9FC] rounded-xl mb-1.5">
                  <div className="text-xs font-bold text-[#1F1F1F] truncate">
                    {user?.fullName || 'Nest Employee'}
                  </div>
                  <div className="text-[11px] text-[#6B6B6B] truncate font-mono mt-0.5">
                    {user?.email || 'No email registered'}
                  </div>
                  {user?.employeeId && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold bg-[#EDE9FE] text-[#5B21B6] px-2 py-0.5 rounded-md border border-[#DDD6FE]">
                        {user.employeeId}
                      </span>
                      {role?.roleCode && (
                        <span className="text-[10px] font-semibold text-[#6B6B6B] truncate">
                          {role.roleCode}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropdown Options */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors cursor-pointer text-left"
                  >
                    <User className="h-4 w-4 text-[#5B21B6]" />
                    <span>Profile</span>
                  </button>

                  <div className="my-1 border-t border-[#EEEEF2]" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FEF2F2] transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="h-4 w-4 text-[#B42318]" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-out notification drawer */}
      <NotificationPanel isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />

      {/* Dynamic Profile Details Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Logout"
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(false)}
              className="rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] hover:bg-white text-[#1F1F1F] px-4 py-2 text-xs font-bold transition-all shadow-soft-sm cursor-pointer"
            >
              No, Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="rounded-xl bg-[#B42318] hover:bg-[#912018] text-white px-4 py-2 text-xs font-bold transition-all shadow-soft-sm active:scale-95 cursor-pointer"
            >
              Yes, Logout
            </button>
          </div>
        }
      >
        <div className="space-y-3 py-2 text-center sm:text-left">
          <div className="mx-auto sm:mx-0 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FEF2F2] text-[#B42318] border border-[#FECDCA]">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1F1F1F]">
              Are you sure you want to logout?
            </p>
            <p className="text-xs text-[#6B6B6B] mt-1">
              You will be signed out of your current Nest Admin Operations session and redirected to the login screen.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};
