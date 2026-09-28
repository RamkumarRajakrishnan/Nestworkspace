import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in, redirect straight to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validate email standard format: local-part@domain.domain-extension
  const validateEmail = (val: string): boolean => {
    if (!val) return false;
    const trimmed = val.trim();
    // Standard email regex with domain extension (at least 2 letters)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) return false;
    // Reject double dots, leading/trailing dot in local part or domain
    if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.includes('@.') || trimmed.endsWith('.')) {
      return false;
    }
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;
    const [local, domain] = parts;
    if (!local || !domain) return false;
    if (domain.startsWith('.') || domain.endsWith('.')) return false;
    return true;
  };

  // Sanitization while typing:
  // Allow only: A-Z, a-z, 0-9, ., _, -, +, @
  // Strip spaces, emojis, and arbitrary symbols (!#$%^&*()={}[]<>?/\|~`)
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^a-zA-Z0-9._\-+@]/g, '');
    setEmail(sanitized);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const isEmailValid = validateEmail(email);
  const showEmailError = email.length > 0 && (emailTouched || email.includes('@')) && !isEmailValid;
  const isPasswordFilled = password.trim().length > 0;
  const canSubmit = isEmailValid && isPasswordFilled && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!isEmailValid || !password) {
      return;
    }

    setErrorMessage(null);

    const result = await login({
      email: email.trim(),
      password,
    });

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage(
        result.error || 'Invalid email or password. Please check your credentials and try again.'
      );
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#FAF9FC] px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-2xl border border-[#EEEEF2] bg-white p-6 sm:p-8 shadow-soft-md">
          {/* Brand Header */}
          <div className="text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B21B6] text-white shadow-soft-sm mb-3">
              <Zap className="h-6 w-6" />
            </div>
            <h2 className="text-sm font-bold tracking-widest uppercase text-[#5B21B6]">NEST</h2>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1F1F1F] mt-1">
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">
              Sign in to continue to work
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FEF2F2] p-3 text-xs text-[#B42318] animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-[#1F1F1F] mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => setEmailTouched(true)}
                placeholder="Enter your email"
                disabled={isLoading}
                required
                className={`w-full rounded-xl border bg-[#FAF9FC] px-3.5 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:bg-white focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                  showEmailError
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                    : 'border-[#EEEEF2] focus:border-[#5B21B6] focus:ring-[#5B21B6]/20'
                }`}
              />
              {showEmailError && (
                <p className="mt-1 text-xs text-rose-600 font-medium">
                  Please enter a valid email address.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-[#1F1F1F] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                  className="w-full rounded-xl border border-[#EEEEF2] bg-[#FAF9FC] px-3.5 py-2.5 pr-10 text-xs sm:text-sm text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:border-[#5B21B6] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B21B6]/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#9E9E9E] hover:text-[#5B21B6] p-0.5 rounded transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#5B21B6] hover:bg-[#4C1D95] text-white py-2.5 text-xs sm:text-sm font-bold shadow-soft-sm hover:shadow-soft-md transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-center text-[11px] text-[#9E9E9E]">
          Nest Operations Portal • Authorized Employee Access Only
        </p>
      </div>
    </div>
  );
};
