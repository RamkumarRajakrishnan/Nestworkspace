import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthRole, AuthLocation, AuthSession } from '../types';
import { authService, LoginCredentials, LoginResult } from '../services/authService';

const STORAGE_KEY = 'nest_employee_auth';

export interface AuthContextType {
  session: AuthSession | null;
  user: AuthUser | null;
  role: AuthRole | null;
  locations: AuthLocation[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
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

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    setIsLoading(true);
    try {
      const result = await authService.login(credentials);
      if (result.success && result.data) {
        setSession(result.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    role: session?.role ?? null,
    locations: session?.locations ?? [],
    isAuthenticated: Boolean(session?.user),
    isLoading,
    login,
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
