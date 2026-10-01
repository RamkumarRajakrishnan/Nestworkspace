import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  ShoppingBag,
  Radio,
  Users,
  UserCheck,
  CalendarDays,
  CalendarOff,
  Store,
  MapPin,
  Clock,
  Sparkles,
  Ticket,
  History,
  User,
  CreditCard,
  TrendingUp,
  Receipt,
  RotateCcw,
  Wallet,
  Banknote,
  Megaphone,
  Tag,
  Gift,
  Flame,
  Bell,
  Star,
  AlertTriangle,
  FileCheck,
  BarChart3,
  LineChart,
  Sliders,
  DollarSign,
  CalendarClock,
  Shield,
  Key,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  LucideIcon
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen?: boolean;
  setMobileOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface NavChildItem {
  name: string;
  path: string;
  icon: LucideIcon;
  alias?: string[];
}

interface NavDirectItem {
  type: 'direct';
  id: string;
  name: string;
  path: string;
  icon: LucideIcon;
  alias?: string[];
}

interface NavGroupItem {
  type: 'group';
  id: string;
  name: string;
  icon: LucideIcon;
  children: NavChildItem[];
}

type NavMenuItem = NavDirectItem | NavGroupItem;

const MENU_ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  operations: ClipboardList,
  workforce: Users,
  market: Store,
  services: Sparkles,
  'pass management': Ticket,
  customers: User,
  finance: CreditCard,
  marketing: Megaphone,
  quality: Star,
  reports: BarChart3,
  masters: Sliders,
  administration: Shield,
};

const MODULE_REGISTRY: Record<
  string,
  { name: string; path: string; icon: LucideIcon; alias?: string[] }
> = {
  // Operations
  'operations:bookings': {
    name: 'Bookings',
    path: '/bookings',
    icon: ShoppingBag,
    alias: ['/orders'],
  },
  'operations:live operations': {
    name: 'Live Operations',
    path: '/live-operations',
    icon: Radio,
    alias: ['/dispatch'],
  },

  // Workforce
  'workforce:experts': {
    name: 'Experts',
    path: '/experts',
    icon: UserCheck,
    alias: ['/workers'],
  },
  'workforce:attendance': {
    name: 'Attendance',
    path: '/attendance',
    icon: CalendarDays,
    alias: ['/schedule', '/workforce/attendance'],
  },
  'workforce:leave': {
    name: 'Leave',
    path: '/workforce/leave',
    icon: CalendarOff,
  },

  // Market
  'market:area': {
    name: 'Area',
    path: '/area',
    icon: MapPin,
    alias: ['/markets', '/market/area'],
  },
  'market:durations & pricing': {
    name: 'Durations & Pricing',
    path: '/market/durations-pricing',
    icon: Clock,
  },

  // Services
  'services:services': {
    name: 'Services',
    path: '/services',
    icon: Sparkles,
  },

  // Pass Management
  'pass management:all passes': {
    name: 'All Passes',
    path: '/all-passes',
    icon: Ticket,
    alias: ['/nest-pass', '/pass-management/all-passes'],
  },
  'pass management:usage history': {
    name: 'Usage History',
    path: '/pass-management/usage-history',
    icon: History,
  },

  // Customers
  'customers:customers': {
    name: 'Customers',
    path: '/customers',
    icon: User,
  },

  // Finance
  'finance:revenue': {
    name: 'Revenue',
    path: '/finance/revenue',
    icon: TrendingUp,
  },
  'finance:payments': {
    name: 'Payments',
    path: '/finance/payments',
    icon: Receipt,
  },
  'finance:refunds': {
    name: 'Refunds',
    path: '/finance/refunds',
    icon: RotateCcw,
  },
  'finance:wallet': {
    name: 'Wallet',
    path: '/finance/wallet',
    icon: Wallet,
  },
  'finance:payroll': {
    name: 'Payroll',
    path: '/payroll',
    icon: Banknote,
    alias: ['/payouts', '/finance/payroll'],
  },

  // Marketing
  'marketing:offers': {
    name: 'Offers',
    path: '/marketing/offers',
    icon: Tag,
  },
  'marketing:coupons': {
    name: 'Coupons',
    path: '/marketing/coupons',
    icon: Gift,
  },
  'marketing:campaigns': {
    name: 'Campaigns',
    path: '/marketing/campaigns',
    icon: Flame,
  },
  'marketing:notifications': {
    name: 'Notifications',
    path: '/marketing/notifications',
    icon: Bell,
  },

  // Quality
  'quality:reviews & ratings': {
    name: 'Reviews & Ratings',
    path: '/quality/reviews',
    icon: Star,
  },
  'quality:complaints': {
    name: 'Complaints',
    path: '/quality/complaints',
    icon: AlertTriangle,
  },
  'quality:quality reports': {
    name: 'Quality Reports',
    path: '/quality/reports',
    icon: FileCheck,
  },

  // Reports
  'reports:operations': {
    name: 'Operations',
    path: '/reports/operations',
    icon: ClipboardList,
  },
  'reports:workforce': {
    name: 'Workforce',
    path: '/reports/workforce',
    icon: Users,
  },
  'reports:market': {
    name: 'Market',
    path: '/reports/market',
    icon: Store,
  },
  'reports:finance': {
    name: 'Finance',
    path: '/reports/finance',
    icon: CreditCard,
  },
  'reports:customers': {
    name: 'Customers',
    path: '/reports/customers',
    icon: User,
  },
  'reports:analytics': {
    name: 'Analytics',
    path: '/analytics',
    icon: LineChart,
    alias: ['/reports', '/reports/analytics'],
  },

  // Masters
  'masters:services': {
    name: 'Services',
    path: '/masters/services',
    icon: Sparkles,
  },
  'masters:master services': {
    name: 'Services',
    path: '/masters/services',
    icon: Sparkles,
  },
  'masters:pricing': {
    name: 'Pricing',
    path: '/masters/pricing',
    icon: DollarSign,
  },
  'masters:areas': {
    name: 'Areas',
    path: '/masters/areas',
    icon: MapPin,
  },
  'masters:durations': {
    name: 'Durations',
    path: '/masters/durations',
    icon: Clock,
  },
  'masters:shifts': {
    name: 'Shifts',
    path: '/masters/shifts',
    icon: CalendarClock,
  },

  // Administration
  'administration:users': {
    name: 'Users',
    path: '/users',
    icon: UserCheck,
    alias: ['/employees', '/administration/users'],
  },
  'administration:roles': {
    name: 'Roles',
    path: '/administration/roles',
    icon: Key,
  },
  'administration:permissions': {
    name: 'Permissions',
    path: '/administration/permissions',
    icon: CheckSquare,
  },
  'administration:system settings': {
    name: 'System Settings',
    path: '/settings',
    icon: Settings,
    alias: ['/administration/settings'],
  },
  'administration:settings': {
    name: 'System Settings',
    path: '/settings',
    icon: Settings,
    alias: ['/administration/settings'],
  },
};

const findModuleConfig = (menuTitle: string, moduleName: string) => {
  const cleanMenu = menuTitle.trim().toLowerCase();
  const cleanMod = moduleName.trim().toLowerCase();
  const exactKey = `${cleanMenu}:${cleanMod}`;

  if (MODULE_REGISTRY[exactKey]) {
    return MODULE_REGISTRY[exactKey];
  }

  // Handle prefix / partial variations (e.g. "All Passes " with trailing space)
  for (const [key, config] of Object.entries(MODULE_REGISTRY)) {
    const [regMenu, regMod] = key.split(':');
    if (regMenu === cleanMenu) {
      if (cleanMod.startsWith(regMod) || regMod.startsWith(cleanMod)) {
        return config;
      }
    }
  }

  return {
    name: moduleName.trim(),
    path: `/${cleanMenu.replace(/[^a-z0-9]+/g, '-')}/${cleanMod.replace(/[^a-z0-9]+/g, '-')}`,
    icon: Sparkles,
  };
};

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  setCollapsed,
  mobileOpen = false,
  setMobileOpen,
}) => {
  const location = useLocation();
  const { authorizedMenus } = useAuth();

  // Dynamic Navigation Menu Structure built from authorizedMenus API response
  const menuItems = useMemo<NavMenuItem[]>(() => {
    // 1. Dashboard is always the first item per Requirement 12
    const items: NavMenuItem[] = [
      {
        type: 'direct',
        id: 'dashboard',
        name: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
      },
    ];

    if (!authorizedMenus || authorizedMenus.length === 0) {
      return items;
    }

    // Sort menus by API menu.sortOrder (Requirement 15)
    const sortedMenus = [...authorizedMenus].sort((a, b) => {
      const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 999;
      const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 999;
      return orderA - orderB;
    });

    for (const menu of sortedMenus) {
      const cleanMenuTitle = menu.menuTitle.trim();
      const menuLower = cleanMenuTitle.toLowerCase();
      const MenuIcon = MENU_ICONS[menuLower] || Sparkles;

      // Sort modules inside menu by API module.sortOrder (Requirement 15)
      const sortedModules = [...(menu.modules || [])].sort((a, b) => {
        const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 999;
        const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 999;
        return orderA - orderB;
      });

      if (sortedModules.length === 0) {
        continue;
      }

      // If menu is 'Services' and has single module 'Services', render as direct item per original design
      if (
        menuLower === 'services' &&
        sortedModules.length === 1 &&
        sortedModules[0].moduleName.trim().toLowerCase() === 'services'
      ) {
        items.push({
          type: 'direct',
          id: 'services',
          name: 'Services',
          path: '/services',
          icon: Sparkles,
        });
        continue;
      }

      // Collapsible group with authorized child modules
      const children: NavChildItem[] = sortedModules.map((mod) => {
        const conf = findModuleConfig(menu.menuTitle, mod.moduleName);
        return {
          name: conf.name,
          path: conf.path,
          icon: conf.icon,
          alias: conf.alias,
        };
      });

      items.push({
        type: 'group',
        id: menuLower.replace(/[^a-z0-9]+/g, '-'),
        name: cleanMenuTitle,
        icon: MenuIcon,
        children,
      });
    }

    return items;
  }, [authorizedMenus]);

  // Helper to determine if a route is currently active
  const isChildActive = (item: NavChildItem, currentPath: string): boolean => {
    if (currentPath === item.path || currentPath.startsWith(`${item.path}/`)) {
      return true;
    }
    if (item.alias) {
      return item.alias.some(
        (alias) => currentPath === alias || currentPath.startsWith(`${alias}/`)
      );
    }
    return false;
  };

  const isDirectActive = (item: NavDirectItem, currentPath: string): boolean => {
    if (currentPath === item.path || currentPath.startsWith(`${item.path}/`)) {
      return true;
    }
    if (item.alias) {
      return item.alias.some(
        (alias) => currentPath === alias || currentPath.startsWith(`${alias}/`)
      );
    }
    return false;
  };

  // State to track expanded status for each collapsible group
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.type === 'group') {
        const hasActiveChild = item.children.some((c) => isChildActive(c, location.pathname));
        if (hasActiveChild) {
          initial[item.id] = true;
        }
      }
    });
    return initial;
  });

  // Automatically keep parent section expanded whenever route changes
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.type === 'group') {
        const hasActive = item.children.some((c) => isChildActive(c, location.pathname));
        if (hasActive) {
          setOpenSections((prev) => ({ ...prev, [item.id]: true }));
        }
      }
    });
  }, [location.pathname, menuItems]);

  const toggleSection = (sectionId: string) => {
    if (collapsed) {
      // If collapsed on desktop, clicking a section expands sidebar and opens that section
      setCollapsed(false);
      setOpenSections((prev) => ({ ...prev, [sectionId]: true }));
    } else {
      setOpenSections((prev) => ({
        ...prev,
        [sectionId]: !prev[sectionId],
      }));
    }
  };

  const [activeTooltip, setActiveTooltip] = useState<{ text: string; top: number } | null>(null);

  // Clear tooltip whenever sidebar collapsed state changes
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

  // Automatically close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && setMobileOpen) {
      setMobileOpen(false);
    }
  }, [location.pathname]);

  // Close mobile sidebar on Escape key press
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen?.(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen, setMobileOpen]);

  // Close mobile sidebar if window resizes to >= 768px (tablet/desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && mobileOpen) {
        setMobileOpen?.(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileOpen, setMobileOpen]);

  // Lock background page scrolling when mobile sidebar is open
  useEffect(() => {
    if (!mobileOpen) return;
    if (window.innerWidth >= 768) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile Dark Backdrop: strictly below md (< 768px), visible when mobileOpen is true */}
      {mobileOpen && (
        <div
          role="presentation"
          onClick={() => setMobileOpen?.(false)}
          onTouchMove={(e) => e.preventDefault()}
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200 transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed z-[60] md:z-40 flex flex-col border-r border-purple-900 bg-purple-800 transition-transform duration-300 ease-in-out md:transition-all ${
          /* Mobile Drawer: fixed off-canvas from left */
          mobileOpen
            ? 'top-0 bottom-0 left-0 translate-x-0 w-64 max-w-[80vw] shadow-2xl'
            : 'top-0 bottom-0 left-0 -translate-x-full w-64 max-w-[80vw]'
        } md:top-16 md:bottom-0 md:translate-x-0 md:shadow-none ${
          /* Tablet/Desktop width according to collapsed state */
          collapsed ? 'md:w-16' : 'md:w-56 lg:w-60'
        }`}
      >
        {/* Mobile Drawer Top Header: strictly visible below md (< 768px) */}
        <div className="flex md:hidden items-center justify-end px-3.5 py-3 border-b border-purple-900 bg-purple-900/60 shrink-0">
          <button
            type="button"
            onClick={() => setMobileOpen?.(false)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-950/40 hover:bg-purple-700/60 text-white transition-colors cursor-pointer focus:outline-none"
            title="Close navigation menu"
            aria-label="Close navigation menu"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Compact Semicircular Toggle Attached to Sidebar Border (Desktop & Tablet only) */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden md:flex absolute left-[calc(100%-1px)] top-3.5 z-40 h-7 w-4 items-center justify-center rounded-r-full rounded-l-none border-y border-r border-l-0 border-purple-300 bg-white text-[#5B21B6] shadow-sm hover:bg-[#F5F3FF] hover:text-[#4C1D95] active:scale-95 transition-all cursor-pointer select-none focus:outline-none"
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
        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 sm:px-2.5 pt-3 pb-3">
          {menuItems.map((item) => {
            if (item.type === 'direct') {
              const Icon = item.icon;
              const isActive = isDirectActive(item, location.pathname);

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileOpen?.(false)}
                  onMouseEnter={(e) => showTooltip(item.name, e)}
                  onMouseLeave={hideTooltip}
                  className={`group relative flex items-center ${
                    collapsed
                      ? 'justify-start gap-3 px-3.5 md:justify-center md:px-2 md:gap-0'
                      : 'gap-3 px-3.5'
                  } rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                      : 'text-white hover:bg-purple-700/60 hover:text-white'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                  <span className={`truncate ${collapsed ? 'block md:hidden' : 'block'}`}>
                    {item.name}
                  </span>
                </NavLink>
              );
            }

            // Collapsible Parent Group
            const GroupIcon = item.icon;
            const isExpanded = Boolean(openSections[item.id]);
            const isGroupActive = item.children.some((c) => isChildActive(c, location.pathname));

            return (
              <div key={item.id} className="space-y-0.5">
                <button
                  type="button"
                  onClick={() => toggleSection(item.id)}
                  onMouseEnter={(e) => showTooltip(item.name, e)}
                  onMouseLeave={hideTooltip}
                  className={`group relative flex w-full items-center ${
                    collapsed
                      ? 'justify-start gap-3 px-3.5 md:justify-center md:px-2 md:gap-0'
                      : 'justify-between px-3.5'
                  } rounded-xl py-2.5 text-xs font-semibold transition-all duration-150 cursor-pointer select-none ${
                    isGroupActive && !isExpanded
                      ? 'bg-purple-700/80 text-white font-bold'
                      : 'text-white hover:bg-purple-700/60 hover:text-white'
                  }`}
                  title={collapsed ? item.name : undefined}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GroupIcon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                    <span className={`truncate ${collapsed ? 'block md:hidden' : 'block'}`}>
                      {item.name}
                    </span>
                  </div>

                  {/* Dropdown Chevron */}
                  <ChevronDown
                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 text-purple-200 ${
                      isExpanded ? 'rotate-180 text-white' : ''
                    } ${collapsed ? 'block md:hidden' : 'block'}`}
                  />
                </button>

                {/* Sub-menu Child Items */}
                {isExpanded && (
                  <div
                    className={`mt-1 space-y-0.5 pl-4 pr-1 animate-in fade-in slide-in-from-top-1 duration-150 border-l border-purple-700/60 ml-4 ${
                      collapsed ? 'block md:hidden' : 'block'
                    }`}
                  >
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const active = isChildActive(child, location.pathname);

                      return (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          onClick={() => setMobileOpen?.(false)}
                          className={`group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 ${
                            active
                              ? 'bg-[#EDE9FE] text-[#5B21B6] font-bold shadow-soft-xs'
                              : 'text-purple-100 hover:bg-purple-700/60 hover:text-white'
                          }`}
                        >
                          <ChildIcon className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110" />
                          <span className="truncate">{child.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Operations Telemetry Footer */}
        <div
          className={`border-t border-purple-900/60 p-2.5 sm:p-3 bg-purple-800/80 shrink-0 ${
            collapsed ? 'block md:hidden' : 'block'
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-2.5 rounded-xl bg-purple-900/50 p-2 sm:p-2.5 border border-purple-700/50 shadow-soft-sm">
            <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] font-bold text-white truncate">Dispatch Engine Live</span>
              <span className="text-[10px] text-purple-200 font-mono truncate">Cluster: Bengaluru South</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Floating Instant Tooltip when Collapsed (Desktop & Tablet only) */}
      {collapsed && activeTooltip && (
        <div
          className="hidden md:flex fixed z-50 pointer-events-none items-center transition-opacity animate-in fade-in zoom-in-95 duration-100"
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