import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { AuthUser, AuthRole, AuthLocation, AuthSession, NestRoleItem, NestLoginData, RoleMenuItem } from '../types';
import { authService } from '../services/authService';

const STORAGE_KEY = 'nest_employee_auth';

export interface AuthContextType {
  session: AuthSession | null;
  user: AuthUser | null;
  role: AuthRole | null;
  locations: AuthLocation[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; data?: NestLoginData; error?: string }>;
  selectRoleAndArea: (params: { userId: string; email: string; role: NestRoleItem }) => Promise<{ success: boolean; error?: string }>;
  isAuthorized: (menuTitle: string, moduleName?: string) => boolean;
  authorizedMenus: RoleMenuItem[];
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as AuthSession;
      }
    } catch (e) {
      console.error('Failed to parse stored auth session:', e);
      localStorage.removeItem(STORAGE_KEY);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; data?: NestLoginData; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await authService.nestLogin(credentials);
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const selectRoleAndArea = async (params: {
    userId: string;
    email: string;
    role: NestRoleItem;
  }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await authService.fetchRoleModules(params.role.locationId, params.role.userRoleId);
      if (!res.success || !res.data) {
        return {
          success: false,
          error: res.error || 'Failed to fetch authorized role modules. Please try again.',
        };
      }

      const menus = res.data.menus || [];
      if (menus.length === 0) {
        return {
          success: false,
          error: 'No modules authorized for the selected role and area. Please contact your administrator.',
        };
      }

      const newSession: AuthSession = {
        userId: params.userId,
        userRoleId: params.role.userRoleId,
        locationId: params.role.locationId,
        roleName: params.role.roleName,
        areaName: params.role.areaName,
        email: params.email,
        authorizedMenus: menus,
        user: {
          userId: params.userId,
          employeeId: params.userId,
          fullName: `${params.role.roleName} (${params.role.areaName})`,
          email: params.email,
          phone: '',
          profileImage: null,
          status: 'Active',
          verificationStatus: 'VERIFIED',
          lastLoginAt: new Date().toISOString(),
        },
        role: {
          userRoleId: params.role.userRoleId,
          roleCode: params.role.roleName,
          status: 'Active',
        },
        locations: [
          {
            userLocationId: params.role.locationId,
            areaName: params.role.areaName,
            accessLevel: 'Full',
            status: 'Active',
          },
        ],
      };

      setSession(newSession);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'An unexpected error occurred while verifying role access.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthorized = useCallback(
    (menuTitle: string, moduleName?: string): boolean => {
      if (!session?.authorizedMenus || session.authorizedMenus.length === 0) {
        return false;
      }
      const cleanMenuTitle = menuTitle.trim().toLowerCase();
      const matchedMenu = session.authorizedMenus.find(
        (m) => m.menuTitle.trim().toLowerCase() === cleanMenuTitle
      );
      if (!matchedMenu) return false;
      if (!moduleName) return true;

      const cleanModuleName = moduleName.trim().toLowerCase();
      return matchedMenu.modules.some((mod) => {
        const apiName = mod.moduleName.trim().toLowerCase();
        if (apiName === cleanModuleName) return true;
        if (
          (cleanModuleName === 'master services' || cleanModuleName === 'services') &&
          (apiName === 'master services' || apiName === 'services')
        ) {
          return true;
        }
        if (
          (cleanModuleName === 'system settings' || cleanModuleName === 'settings') &&
          (apiName === 'system settings' || apiName === 'settings')
        ) {
          return true;
        }
        if (
          (cleanModuleName === 'users' || cleanModuleName === 'employees') &&
          (apiName === 'users' || apiName === 'employees')
        ) {
          return true;
        }
        if (
          cleanModuleName.startsWith('all pass') &&
          apiName.startsWith('all pass')
        ) {
          return true;
        }
        if (
          (cleanModuleName.includes('review') || cleanModuleName.includes('rating')) &&
          (apiName.includes('review') || apiName.includes('rating'))
        ) {
          return true;
        }
        return false;
      });
    },
    [session]
  );

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    role: session?.role ?? null,
    locations: session?.locations ?? [],
    isAuthenticated: Boolean(session?.userId && session?.authorizedMenus?.length),
    isLoading,
    login,
    selectRoleAndArea,
    isAuthorized,
    authorizedMenus: session?.authorizedMenus ?? [],
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

