import { AuthSession } from '../types';
import { loginEmployee } from './api';

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
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    const res = await loginEmployee(credentials);
    return {
      success: res.success,
      data: res.data as AuthSession | undefined,
      error: res.error,
    };
  },
};

