import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  MapPin,
  Clock,
  ChevronDown,
  Flame,
  LogOut,
  User,
  MoreVertical,
  Check
} from 'lucide-react';
import logoImg from '../../assets/Logo.png';
import { useOperations } from '../../context/OperationsContext';
import { useAuth } from '../../context/AuthContext';
import { SearchInput } from '../common/SearchInput';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { Modal } from '../common/Modal';
import { UserProfileModal } from './UserProfileModal';
import { useNavigate } from 'react-router-dom';

interface MarketSelectorDropdownProps {
  markets: any[];
  selectedMarketId: string;
  onSelectMarket: (id: string) => void;
  fullWidth?: boolean;
}

const MarketSelectorDropdown: React.FC<MarketSelectorDropdownProps> = ({
  markets,
  selectedMarketId,
  onSelectMarket,
  fullWidth = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentMarket = markets.find((m) => m.id === selectedMarketId);
  const displayLabel = selectedMarketId === 'ALL'
    ? 'All Nano Markets — Bangalore'
    : currentMarket
    ? `${currentMarket.name || currentMarket.id} (${currentMarket.capacity}%)`
    : 'All Nano Markets — Bangalore';

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'shrink-0'}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select Nano Market"
        aria-expanded={isOpen}
        className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all shadow-soft-xs cursor-pointer select-none ${
          fullWidth ? 'w-full' : 'min-w-[210px]'
        } ${
          isOpen
            ? 'border-[#7C3AED] bg-[#F5F3FF] text-[#5B21B6] ring-2 ring-[#7C3AED]/20'
            : 'border-[#EEEEF2] bg-[#FAF9FC] text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6] hover:border-[#DDD6FE]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="h-3.5 w-3.5 text-[#5B21B6] shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#6B6B6B] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#5B21B6]' : ''
          }`}
        />
      </button>

      {/* Styled Popover Dropdown */}
      {isOpen && (
        <div
          className={`absolute ${
            fullWidth ? 'left-0 right-0' : 'left-0 sm:left-auto sm:right-0 xl:left-0'
          } top-full mt-1.5 z-50 w-72 sm:w-80 max-h-80 flex flex-col rounded-2xl border border-[#EEEEF2] bg-white p-1.5 shadow-2xl shadow-purple-950/15 animate-in fade-in zoom-in-95 duration-150 overflow-hidden`}
        >
          {/* Header */}
          <div className="px-3 py-2 text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider border-b border-[#EEEEF2] flex items-center justify-between shrink-0 bg-white">
            <span>Select Nano-Market ({markets.length})</span>
            <span className="text-[#5B21B6] font-mono">Bangalore</span>
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-64 py-1 space-y-0.5">
            {/* All Nano-Markets Option */}
            <button
              type="button"
              onClick={() => {
                onSelectMarket('ALL');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                selectedMarketId === 'ALL'
                  ? 'bg-[#F5F3FF] text-[#5B21B6] font-bold'
                  : 'text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <MapPin className={`h-4 w-4 shrink-0 ${selectedMarketId === 'ALL' ? 'text-[#5B21B6]' : 'text-[#6B6B6B]'}`} />
                <div className="truncate">
                  <span className="block truncate font-semibold">All Nano Markets — Bangalore</span>
                  <span className="block text-[10px] text-[#6B6B6B] font-normal">Citywide Operations</span>
                </div>
              </div>
              {selectedMarketId === 'ALL' && <Check className="h-4 w-4 text-[#5B21B6] shrink-0" />}
            </button>

            {/* Individual Nano Markets */}
            {markets.map((m) => {
              const isSelected = selectedMarketId === m.id;
              const cap = m.capacity ?? 0;
              const capBadgeClass =
                cap >= 90
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : cap >= 70
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectMarket(m.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[#F5F3FF] text-[#5B21B6] font-bold'
                      : 'text-[#1F1F1F] hover:bg-[#EDE9FE] hover:text-[#5B21B6]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100/70 text-[#5B21B6] shrink-0">
                      {m.id}
                    </span>
                    <span className="truncate">{m.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full border ${capBadgeClass}`}>
                      {cap}%
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-[#5B21B6] shrink-0" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const Header: React.FC = () => {
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setIsMoreMenuOpen(false);
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

  const formatHeaderDate = (d: Date) => {
    const day = d.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const hours = String(d.getHours() % 12 || 12).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'pm' : 'am';
    return `${day} ${month},  ${hours}:${minutes}:${seconds}  ${ampm}`;
  };

  const initials = user?.fullName
    ? user.fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    : 'R';

  return (
    <>
      <header className="flex h-16 w-full items-center justify-between border-b border-purple-200 bg-purple-100 px-3 sm:px-4 md:px-6 shadow-soft-sm gap-2 sm:gap-3">
        {/* Left: Navbar Logo (slightly reduced for better responsive fitting across desktop, tablet, mobile) */}
        <div className="flex items-center shrink-0">
          <img
            src="/logo.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = logoImg;
            }}
            alt="Haatza Nest"
            className="h-7 sm:h-8 w-auto max-w-[110px] sm:max-w-[135px] object-contain shrink-0"
          />
        </div>

        {/* Right Section containing all header elements */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 shrink-0 ml-auto">
          {/* 1. Search Input - Responsive sizing */}
          <SearchInput
            value={searchQuery}
            onChange={handleSearchSubmit}
            placeholder="Search booking, expert..."
            className="w-24 sm:w-36 md:w-52 lg:w-60 shrink-0"
          />

          {/* 2. Desktop Secondary Elements: Market Selector, Scenario 1, Clock (Visible on desktop xl:) */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {/* Market Selector Dropdown */}
            <MarketSelectorDropdown
              markets={markets}
              selectedMarketId={selectedMarketId}
              onSelectMarket={setSelectedMarketId}
            />

            {/* Scenario 1: KOR-03 Crunch */}
            <button
              type="button"
              onClick={() => {
                runScenario1CapacityCrunch();
                navigate('/markets/KOR-03');
              }}
              className="flex items-center gap-1.5 rounded-xl border border-[#FECDCA] bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#B42318] hover:bg-[#FEE2E2] transition-all shadow-soft-sm active:scale-95 cursor-pointer shrink-0"
              title="Demonstrate Scenario 1: KOR-03 100% Capacity Crunch Escalation"
            >
              <Flame className="h-3.5 w-3.5 text-[#B42318] animate-pulse shrink-0" />
              <span className="whitespace-nowrap">Scenario 1: KOR-03 Crunch</span>
            </button>

            {/* Live IST Clock */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs text-[#6B6B6B] font-mono font-medium shrink-0 whitespace-nowrap">
              <Clock className="h-3.5 w-3.5 text-[#5B21B6]" />
              <span>{formatHeaderDate(currentTime)}</span>
            </div>
          </div>

          {/* 3. Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="relative rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors cursor-pointer shrink-0"
            title="Operational Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#5B21B6] text-[10px] font-bold text-white shadow-sm">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {/* 4. Admin Profile Dropdown Menu - Fully visible and properly aligned */}
          <div className="relative border-l border-purple-200 pl-1.5 sm:pl-3 shrink-0" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1 sm:gap-2 rounded-xl p-0.5 sm:p-1 hover:bg-purple-200/50 transition-all cursor-pointer focus:outline-none"
              aria-expanded={isProfileDropdownOpen}
              aria-haspopup="true"
              id="profile-dropdown-trigger"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-[#EDE9FE] text-[#5B21B6] font-bold text-xs shadow-soft-sm shrink-0 overflow-hidden">
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
              <div className="hidden sm:flex flex-col text-left shrink-0">
                <span className="text-xs font-bold text-[#1F1F1F] leading-tight whitespace-nowrap">
                  {user?.fullName || 'Ramkumar'}
                </span>
                <span className="text-[10px] text-[#5B21B6] font-semibold leading-tight mt-0.5 whitespace-nowrap">
                  {role?.roleCode || user?.employeeId || 'NEST_FIELD_EMPLOYEE'}
                </span>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-[#6B6B6B] transition-transform duration-200 shrink-0 ${
                  isProfileDropdownOpen ? 'rotate-180 text-[#5B21B6]' : ''
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
                    <div className="text-[10px] text-[#5B21B6] font-mono font-semibold mt-1">
                      ID: {user.employeeId}
                    </div>
                  )}
                </div>

                {/* Menu items */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsProfileModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors cursor-pointer"
                  >
                    <User className="h-4 w-4 text-[#5B21B6]" />
                    <span>My Profile & Security</span>
                  </button>

                  <div className="my-1 border-t border-[#EEEEF2]" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      setIsLogoutModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-[#B42318] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-[#B42318]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Three-Dot / More Menu - Moved to EXTREME RIGHT without square box background */}
          <div className="relative xl:hidden flex items-center shrink-0" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen((prev) => !prev)}
              className="flex items-center justify-center p-1 text-[#6B6B6B] hover:text-[#5B21B6] transition-colors cursor-pointer shrink-0"
              title="More operational controls"
              aria-label="More operational controls"
              aria-expanded={isMoreMenuOpen}
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[#EEEEF2] bg-white p-3 shadow-soft-lg z-50 space-y-2.5 animate-in fade-in zoom-in-95">
                <div className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider px-1">
                  Operational Controls
                </div>

                {/* 1. All Markets dropdown inside More Menu */}
                <MarketSelectorDropdown
                  markets={markets}
                  selectedMarketId={selectedMarketId}
                  onSelectMarket={(id) => {
                    setSelectedMarketId(id);
                    setIsMoreMenuOpen(false);
                  }}
                  fullWidth
                />

                {/* 2. Scenario Button inside More Menu */}
                <button
                  type="button"
                  onClick={() => {
                    runScenario1CapacityCrunch();
                    navigate('/markets/KOR-03');
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#FECDCA] bg-[#FEF2F2] px-3 py-2 text-xs font-bold text-[#B42318] hover:bg-[#FEE2E2] transition-all cursor-pointer"
                >
                  <Flame className="h-3.5 w-3.5 text-[#B42318] animate-pulse" />
                  <span>Scenario 1: KOR-03 Crunch</span>
                </button>
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
