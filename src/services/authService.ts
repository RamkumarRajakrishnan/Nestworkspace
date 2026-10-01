import { AuthSession, NestLoginData, RoleModulesData } from '../types';
import { nestLogin as apiNestLogin, roleModules as apiRoleModules, loginEmployee } from './api';

export interface LoginCredentials {
  email?: string;
  identifier?: string; // Backward compatibility
  password: string;
}

export interface LoginResult {
  success: boolean;
  data?: AuthSession;
  error?: string;
}

export const authService = {
  async nestLogin(credentials: { email: string; password: string }): Promise<{ success: boolean; data?: NestLoginData; error?: string }> {
    return apiNestLogin(credentials);
  },

  async fetchRoleModules(locationId: string, userRoleId: string): Promise<{ success: boolean; data?: RoleModulesData; error?: string }> {
    return apiRoleModules(locationId, userRoleId);
  },

  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const res = await loginEmployee(credentials);
    return {
      success: res.success,
      data: res.data as AuthSession | undefined,
      error: res.error,
    };
  },
};


