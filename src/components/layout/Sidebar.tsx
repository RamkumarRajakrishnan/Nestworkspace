import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  ShoppingBag,
  // Users,
  UserCheck,
  // Briefcase,
  CalendarDays,
  Store,
  ShieldCheck,
  CreditCard,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  // ChevronDown,
  Ticket
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed
}) => {
  const location = useLocation();

  // --- Manage Users dropdown state (disabled for now; kept for future re-enabling) ---
  // const isManageUsersRoute =
  //   location.pathname.startsWith('/workers') ||
  //   location.pathname.startsWith('/experts') ||
  //   location.pathname.startsWith('/employees');
  //
  // const [isManageUsersOpen, setIsManageUsersOpen] = useState(true);
  //
  // // Automatically keep expanded when on /experts, /workers, or /employees
  // useEffect(() => {
  //   if (isManageUsersRoute) {
  //     setIsManageUsersOpen(true);
  //   }
  // }, [isManageUsersRoute]);

  const [activeTooltip, setActiveTooltip] = useState<{ text: string; top: number } | null>(null);

  // Clear tooltip whenever sidebar state changes
  useEffect(() => {
    setActiveTooltip(null);
  }, [collapsed]);

  const showTooltip = (text: string, e: React.MouseEvent<HTMLElement>) => {
    if (collapsed) {
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveTooltip({
        text,
        top: rect.top + rect.height / 2,
      });
    }
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const navItemsTop = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Dispatch', path: '/dispatch', icon: MapPin },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
  ];

  const navItemsBottom = [
    { name: 'Assignments', path: '/assignments', icon: UserCheck },
    { name: 'Schedule', path: '/schedule', icon: CalendarDays },
    { name: 'Markets', path: '/markets', icon: Store },
    { name: 'Compliance', path: '/compliance', icon: ShieldCheck },
    { name: 'Payouts', path: '/payouts', icon: CreditCard },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // const handleToggleManageUsers = () => {
  //   if (collapsed) {
  //     setCollapsed(false);
  //     setIsManageUsersOpen(true);
  //   } else {
  //     setIsManageUsersOpen((prev) => !prev);
  //   }
  // };

  return (
    <>
      {/* Sidebar Panel */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 flex flex-col border-r border-purple-900 bg-purple-800 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-48 sm:w-56 lg:w-60'
        }`}
      >
        {/* Compact Semicircular Toggle Attached to Sidebar Border */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute left-[calc(100%-1px)] top-3.5 z-40 flex h-7 w-4 items-center justify-center rounded-r-full rounded-l-none border-y border-r border-l-0 border-purple-300 bg-white text-[#5B21B6] shadow-sm hover:bg-[#F5F3FF] hover:text-[#4C1D95] active:scale-95 transition-all cursor-pointer select-none focus:outline-none"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5 stroke-[2.5] -ml-0.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 stroke-[2.5] -ml-0.5" />
          )}
        </button>

        {/* Nav Menu Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2 sm:px-2.5 pt-3 pb-3">
          {/* Top Section Nav Items (Dashboard, Live Dispatch, Orders) */}
          {navItemsTop.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onMouseEnter={(e) => showTooltip(item.name, e)}
                onMouseLeave={hideTooltip}
                className={({ isActive }) =>
                  `group relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                  } rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                    : 'text-white hover:bg-purple-700/60 hover:text-white'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}

          {/* Manage Users Dropdown Section (disabled for now; kept for future re-enabling)
              To re-enable: restore the commented state/handlers/imports above, and
              remove the  top-level link below.

          <div className="space-y-1 pt-0.5">
            <button
              type="button"
              onClick={handleToggleManageUsers}
              onMouseEnter={(e) => showTooltip('Manage Users', e)}
              onMouseLeave={hideTooltip}
              className={`group relative flex items-center ${
                collapsed ? 'justify-center px-2' : 'justify-between px-3.5'
              } w-full rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isManageUsersRoute
                  ? 'text-[#5B21B6] bg-[#EDE9FE] font-bold shadow-soft-xs'
                  : 'text-white hover:bg-purple-700/60 hover:text-white'
              }`}
              title={collapsed ? 'Manage Users' : undefined}
              aria-expanded={isManageUsersOpen}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} min-w-0`}>
                <Users className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && (
                  <span className="truncate">Manage Users</span>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 stroke-[2.5] ${
                    isManageUsersRoute ? 'text-[#5B21B6]' : 'text-[#DDD6FE]'
                  } ${isManageUsersOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {isManageUsersOpen && (
              <div
                className={
                  collapsed
                    ? 'space-y-1 my-1 flex flex-col items-center'
                    : 'ml-4 pl-3 border-l-2 border-purple-700/60 space-y-1 my-1 animate-in fade-in slide-in-from-top-1'
                }
              >
                <NavLink
                  to="/experts"
                  onMouseEnter={(e) => showTooltip('Experts', e)}
                  onMouseLeave={hideTooltip}
                  className={({ isActive }) => {
                    const isExpertActive =
                      isActive ||
                      location.pathname.startsWith('/workers') ||
                      location.pathname.startsWith('/experts');
                    return `flex items-center ${
                      collapsed ? 'justify-center px-2 w-full' : 'gap-2.5 px-3'
                    } py-2 rounded-lg text-xs font-semibold transition-all ${
                      isExpertActive
                        ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                        : 'text-white hover:bg-purple-700/60 hover:text-white'
                    }`;
                  }}
                  title={collapsed ? 'Experts' : undefined}
                >
                  <UserCheck className="h-3.5 w-3.5 shrink-0" />
                  {!collapsed && <span>Experts</span>}
                </NavLink>
              </div>
            )}
          </div>
          */}

          {/* Experts Top-level Item */}
          <NavLink
            to="/experts"
            onMouseEnter={(e) => showTooltip('Experts', e)}
            onMouseLeave={hideTooltip}
            className={({ isActive }) => {
              const isExpertActive =
                isActive ||
                location.pathname.startsWith('/workers') ||
                location.pathname.startsWith('/experts');
              return `group relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                } rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${isExpertActive
                  ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                  : 'text-white hover:bg-purple-700/60 hover:text-white'
                }`;
            }}
            title={collapsed ? 'Experts' : undefined}
          >
            <UserCheck className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="truncate">Manage Experts</span>}
          </NavLink>

          {/* Nest Pass Top-level Item */}
          <NavLink
            to="/nest-pass"
            onMouseEnter={(e) => showTooltip('Nest Pass', e)}
            onMouseLeave={hideTooltip}
            className={({ isActive }) =>
              `group relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
              } rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${isActive
                ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                : 'text-white hover:bg-purple-700/60 hover:text-white'
              }`
            }
            title={collapsed ? 'Nest Pass' : undefined}
          >
            <Ticket className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="truncate">Nest Pass</span>}
          </NavLink>

          {/* Bottom Section Nav Items (Assignments, Schedule, Markets, Compliance, Payouts, Reports, Settings) */}
          {navItemsBottom.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onMouseEnter={(e) => showTooltip(item.name, e)}
                onMouseLeave={hideTooltip}
                className={({ isActive }) =>
                  `group relative flex items-center ${collapsed ? 'justify-center px-2' : 'gap-3 px-3.5'
                  } rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${isActive
                    ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                    : 'text-white hover:bg-purple-700/60 hover:text-white'
                  }`
                }
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Operations Telemetry Footer (Visible when expanded) */}
        {!collapsed && (
          <div className="border-t border-purple-900/60 p-2.5 sm:p-3 bg-purple-800/80 shrink-0">
            <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-purple-900/50 p-2 sm:p-2.5 border border-purple-700/50 shadow-soft-sm">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white truncate">Dispatch Engine Live</span>
                <span className="text-[10px] text-purple-200 font-mono truncate">Cluster: Bengaluru South</span>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Floating Instant Tooltip when Collapsed (renders outside sidebar to prevent clipping) */}
      {collapsed && activeTooltip && (
        <div
          className="fixed z-50 pointer-events-none flex items-center transition-opacity animate-in fade-in zoom-in-95 duration-100"
          style={{
            left: '4.75rem',
            top: `${activeTooltip.top}px`,
            transform: 'translateY(-50%)',
          }}
        >
          <div className="relative rounded-lg bg-[#5B21B6] px-3 py-1.5 text-xs font-semibold text-white shadow-xl shadow-purple-950/40 border border-purple-400/30 whitespace-nowrap flex items-center">
            <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#5B21B6]" />
            {activeTooltip.text}
          </div>
        </div>
      )}
    </>
  );
};