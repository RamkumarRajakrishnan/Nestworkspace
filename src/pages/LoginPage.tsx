import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import loginBg from '../assets/login 1.png';
import logoImg from '../assets/Logo.png';

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

  // Validate email or username
  const validateInput = (val: string): boolean => {
    if (!val) return false;
    const trimmed = val.trim();
    if (trimmed.includes('@')) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(trimmed)) return false;
      if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.includes('@.') || trimmed.endsWith('.')) {
        return false;
      }
      return true;
    }
    return trimmed.length >= 2;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sanitized = raw.replace(/[^a-zA-Z0-9._\-+@]/g, '');
    setEmail(sanitized);
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const isInputValid = validateInput(email);
  const showEmailError = email.length > 0 && emailTouched && !isInputValid;
  const isPasswordFilled = password.trim().length > 0;
  const canSubmit = isInputValid && isPasswordFilled && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!isInputValid || !password) {
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
        result.error || 'Invalid credentials. Please check your Email / Username and Password.'
      );
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end bg-[#FAF9FC] overflow-hidden">
      {/* Background Graphic Image */}
      <img
        src={loginBg}
        alt="Haatza Nest Operations"
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
      />

      {/* Mobile/Tablet readability overlay */}
      <div className="lg:hidden absolute inset-0 bg-white/70 backdrop-blur-[2px] pointer-events-none" />



      {/* Main Login Card Section */}
      <div className="relative z-20 w-full max-w-[500px] px-4 py-6 sm:px-6 lg:px-0 lg:mr-16 xl:mr-24 2xl:mr-36">
        <div className="rounded-[32px] bg-white px-5 sm:px-10 py-10 sm:py-14 shadow-[0_24px_70px_-10px_rgba(0,0,0,0.15)] border border-[#EEEEF2]/80">

          {/* Brand Header: Logo.png image (the Haatza Nest wordmark) */}
          <div className="flex flex-col items-center text-center">
            <img
              src={logoImg}
              alt="Haatza Nest"
              className="h-12 w-auto max-w-[200px] object-contain"
            />



            {/* Tagline — centered */}
            <div className="mt-5 text-center w-full">
              <h2 className="text-base sm:text-xl font-black text-[#3B1E7A] leading-snug tracking-tight">
                Manage Your Operations, Effortlessly
              </h2>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mt-7 mb-5 text-center">
            <h2 className="text-2xl font-extrabold text-[#1F1F1F] leading-tight">
              Welcome Back!
            </h2>
            <p className="text-sm text-[#6B6B6B] mt-1.5">
              Sign in to your account to continue
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FEF2F2] p-3.5 text-sm text-[#B42318] animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4A2E80]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  type="text"
                  autoComplete="username email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="Email ID / Username"
                  disabled={isLoading}
                  required
                  className={`w-full pl-11 pr-4 py-3.5 text-sm bg-white border rounded-xl text-[#1F1F1F] placeholder:text-[#9CA3AF] focus:border-[#4A2E80] focus:ring-2 focus:ring-[#4A2E80]/15 outline-none transition-all disabled:opacity-50 ${showEmailError
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-[#E5E7EB] focus:border-[#4A2E80]'
                    }`}
                />
              </div>
              {showEmailError && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium pl-1">
                  Please enter a valid email or username.
                </p>
              )}
            </div>

            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#4A2E80]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  disabled={isLoading}
                  required
                  className="w-full pl-11 pr-11 py-3.5 text-sm bg-white border border-[#E5E7EB] rounded-xl text-[#1F1F1F] placeholder:text-[#9CA3AF] focus:border-[#4A2E80] focus:ring-2 focus:ring-[#4A2E80]/15 outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#9CA3AF] hover:text-[#4A2E80] transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#4A2E80] hover:bg-[#3B1E7A] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

