import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  Users,
  UserCheck,
  Briefcase,
  CalendarDays,
  Store,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X
} from 'lucide-react';
import logoImg from '../../assets/Logo.png';
import { useOperations } from '../../context/OperationsContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen
}) => {
  const { bookings, documents, payouts } = useOperations();
  const location = useLocation();

  const slaRiskCount = bookings.filter((b) => b.status === 'SLA Risk').length;
  const pendingDocsCount = documents.filter((d) => d.status === 'Pending' || d.status === 'Expiring Soon').length;
  const pendingPayoutsCount = payouts.filter((p) => p.status === 'Under Review' || p.status === 'Calculated').length;

  const isManageUsersRoute =
    location.pathname.startsWith('/workers') ||
    location.pathname.startsWith('/experts') ||
    location.pathname.startsWith('/employees');

  const [isManageUsersOpen, setIsManageUsersOpen] = useState(true);

  // Automatically keep expanded when on /experts, /workers, or /employees
  useEffect(() => {
    if (isManageUsersRoute) {
      setIsManageUsersOpen(true);
    }
  }, [isManageUsersRoute]);

  const navItemsTop = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Dispatch', path: '/dispatch', icon: MapPin, badge: slaRiskCount > 0 ? `${slaRiskCount} Risk` : undefined, badgeColor: 'bg-[#B42318]' },
    { name: 'Orders', path: '/orders', icon: ShoppingBag, badge: bookings.filter((b) => b.status === 'Searching' || b.status === 'New').length || undefined },
  ];

  const navItemsBottom = [
    { name: 'Assignments', path: '/assignments', icon: UserCheck },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays },
    { name: 'Markets', path: '/markets', icon: Store },
    { name: 'Compliance', path: '/compliance', icon: ShieldCheck, badge: pendingDocsCount || undefined, badgeColor: 'bg-[#C2410C]' },
    { name: 'Payouts', path: '/payouts', icon: CreditCard, badge: pendingPayoutsCount || undefined, badgeColor: 'bg-[#5B21B6]' },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleToggleManageUsers = () => {
    if (collapsed) {
      setCollapsed(false);
      setIsManageUsersOpen(true);
    } else {
      setIsManageUsersOpen((prev) => !prev);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-purple-900 bg-purple-800 transition-all duration-300 ${mobileOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full md:translate-x-0'
          } ${collapsed ? 'md:w-18' : 'md:w-60'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-purple-200 px-4 bg-purple-100">
          <div className="flex items-center overflow-hidden">
            {(!collapsed || mobileOpen) ? (
              <img
                src={logoImg}
                alt="Haatza Nest"
                className="h-8 w-auto max-w-[150px] object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-200/60 p-1">
                <img
                  src={logoImg}
                  alt="Haatza Nest"
                  className="h-full w-full object-cover object-left"
                />
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex rounded-lg p-1.5 text-[#5B21B6] hover:bg-purple-200 hover:text-[#5B21B6] transition-colors cursor-pointer"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="flex md:hidden rounded-lg p-1.5 text-white hover:bg-[#F5F3FF] hover:text-[#5B21B6] transition-colors cursor-pointer"
            title="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {/* Top Section Nav Items (Dashboard, Live Dispatch, Orders) */}
          {navItemsTop.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6]'
                    : 'text-white hover:bg-[#FAF9FC] hover:text-[#1F1F1F]'
                  }`
                }
                title={collapsed && !mobileOpen ? item.name : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}

                {/* Badges */}
                {item.badge && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${item.badgeColor || 'bg-[#5B21B6]'
                      } ${collapsed && !mobileOpen ? 'absolute top-1 right-1' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Manage Users Dropdown Section */}
          <div className="space-y-1 pt-0.5">
            <button
              type="button"
              onClick={handleToggleManageUsers}
              className={`group relative flex items-center justify-between w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${isManageUsersRoute
                ? 'text-[#5B21B6] bg-[#EDE9FE]/40 font-bold'
                : 'text-white hover:bg-[#FAF9FC] hover:text-[#1F1F1F]'
                }`}
              title={collapsed && !mobileOpen ? 'Manage Users' : undefined}
              aria-expanded={isManageUsersOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Users className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {(!collapsed || mobileOpen) && (
                  <span className="truncate">Manage Users</span>
                )}
              </div>
              {(!collapsed || mobileOpen) && (
                <ChevronDown
                  className={`h-3.5 w-3.5 text-white transition-transform duration-200 ${isManageUsersOpen ? 'rotate-180 text-[#5B21B6]' : ''
                    }`}
                />
              )}
            </button>

            {/* Collapsible Sub-menu: Experts & Employees */}
            {isManageUsersOpen && (!collapsed || mobileOpen) && (
              <div className="ml-4 pl-3 border-l-2 border-[#EEEEF2] space-y-1 my-1 animate-in fade-in slide-in-from-top-1">
                {/* 1. Experts */}
                <NavLink
                  to="/experts"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => {
                    const isExpertActive = isActive || location.pathname.startsWith('/workers') || location.pathname.startsWith('/experts');
                    return `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${isExpertActive
                      ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                      : 'text-white hover:bg-[#FAF9FC] hover:text-[#1F1F1F]'
                      }`;
                  }}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>Experts</span>
                </NavLink>

                {/* 2. Employees */}
                <NavLink
                  to="/employees"
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${isActive
                      ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                      : 'text-white hover:bg-[#FAF9FC] hover:text-[#1F1F1F]'
                    }`
                  }
                >
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Employees</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Bottom Section Nav Items (Assignments, Schedule, Markets, Compliance, Payouts, Reports, Settings) */}
          {navItemsBottom.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-150 ${isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6]'
                    : 'text-white hover:bg-[#FAF9FC] hover:text-[#1F1F1F]'
                  }`
                }
                title={collapsed && !mobileOpen ? item.name : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {(!collapsed || mobileOpen) && <span className="truncate">{item.name}</span>}

                {/* Badges */}
                {item.badge && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${item.badgeColor || 'bg-[#5B21B6]'
                      } ${collapsed && !mobileOpen ? 'absolute top-1 right-1' : ''}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Operations Telemetry Footer */}
        {(!collapsed || mobileOpen) && (
          <div className="border-t border-purple-800 p-3.5 bg-purple-800">
            <div className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 border border-[#EEEEF2] shadow-soft-sm">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-[#1F1F1F]">Dispatch Engine Live</span>
                <span className="text-[10px] text-white font-mono">Cluster: Bengaluru South</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
