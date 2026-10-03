import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Clock,
  ChevronDown,
  LogOut,
  User,
  Menu
} from 'lucide-react';
import logoImg from '../../assets/Logo.png';
import { useOperations } from '../../context/OperationsContext';
import { useAuth } from '../../context/AuthContext';
import { SearchInput } from '../common/SearchInput';
import { NotificationPanel } from '../notifications/NotificationPanel';
import { Modal } from '../common/Modal';
import { UserProfileModal } from './UserProfileModal';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const { notifications } = useOperations();
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
      navigate('/bookings');
    } else if (val.toUpperCase().startsWith('WRK-')) {
      navigate('/experts');
    } else {
      navigate('/live-operations');
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
      <header className="flex h-16 w-full items-center justify-between border-b border-purple-200 bg-purple-100 px-2 sm:px-4 md:px-6 shadow-soft-sm gap-2 sm:gap-4">
        {/* Left: Mobile Hamburger (< md) & Navbar Logo */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
            className="inline-flex md:hidden items-center justify-center p-1.5 sm:p-2 rounded-xl text-[#5B21B6] hover:bg-purple-200/70 active:scale-95 transition-all cursor-pointer focus:outline-none"
          >
            <Menu className="h-5 w-5 stroke-[2.2]" />
          </button>
          <img
            src="/logo.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = logoImg;
            }}
            alt="Haatza Nest"
            className="h-7 sm:h-8 w-auto max-w-[80px] xs:max-w-[100px] sm:max-w-[135px] object-contain shrink-0"
          />
        </div>

        {/* Search Input - Balanced width & shifted right */}
        <div className="ml-1.5 sm:ml-6 md:ml-12 lg:ml-20 w-full max-w-[200px] xs:max-w-[240px] sm:max-w-[300px] md:max-w-[360px] lg:max-w-[420px] min-w-0 flex-1">
          <SearchInput
            value={searchQuery}
            onChange={handleSearchSubmit}
            placeholder="Search by ID, name, area..."
            className="w-full"
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 shrink-0 ml-auto">
          {/* Live IST Clock */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3 py-2 text-xs text-[#6B6B6B] font-mono font-medium shrink-0 whitespace-nowrap shadow-soft-xs">
            <Clock className="h-3.5 w-3.5 text-[#5B21B6]" />
            <span>{formatHeaderDate(currentTime)}</span>
          </div>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="relative rounded-xl border border-[#EEEEF2] bg-white p-2 text-[#6B6B6B] hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors cursor-pointer shrink-0 shadow-soft-xs"
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
              <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#EEEEF2] bg-white p-2 shadow-soft-lg z-50 animate-in fade-in zoom-in-95">
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
