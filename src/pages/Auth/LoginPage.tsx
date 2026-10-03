import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NestRoleItem, NestLoginData } from '../../types';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  MapPin,
  ChevronDown,
  Check,
  Search
} from 'lucide-react';
import loginBg from '../../assets/login 1.png';
import logoImg from '../../assets/Logo.png';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, selectRoleAndArea, isAuthenticated, isLoading } = useAuth();

  // Screen flow: 'credentials' -> 'role-area'
  const [step, setStep] = useState<'credentials' | 'role-area'>('credentials');

  // Step 1: Credentials State
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentialsError, setCredentialsError] = useState<string | null>(null);

  // Step 2: Role & Area Selection State
  const [loginData, setLoginData] = useState<{
    userId: string;
    roles: NestRoleItem[];
    email: string;
  } | null>(null);

  const [selectedRoleName, setSelectedRoleName] = useState<string>('');
  const [selectedAreaName, setSelectedAreaName] = useState<string>('');
  const [roleTouched, setRoleTouched] = useState(false);
  const [areaTouched, setAreaTouched] = useState(false);
  const [roleAreaError, setRoleAreaError] = useState<string | null>(null);

  // Custom Dropdown States & Refs for Role & Area selection
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isAreaDropdownOpen, setIsAreaDropdownOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const areaDropdownRef = useRef<HTMLDivElement>(null);

  // If already authenticated with active permissions, redirect to dashboard
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
    if (credentialsError) {
      setCredentialsError(null);
    }
  };

  const isInputValid = validateInput(email);
  const showEmailError = email.length > 0 && emailTouched && !isInputValid;
  const isPasswordFilled = password.trim().length > 0;
  const canSubmitCredentials = isInputValid && isPasswordFilled && !isLoading;

  // Handle Step 1: Credentials Submit
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);

    if (!isInputValid || !password) {
      return;
    }

    setCredentialsError(null);

    const result = await login({
      email: email.trim(),
      password,
    });

    if (result.success && result.data) {
      const roles = result.data.roles || [];
      if (roles.length === 0) {
        setCredentialsError('No roles or locations assigned to this account. Please contact an administrator.');
        return;
      }

      setLoginData({
        userId: result.data.userId,
        roles,
        email: email.trim(),
        ...(result.data as any),
      });

      // Advance to Step 2
      setStep('role-area');
      setCredentialsError(null);
      setRoleAreaError(null);
    } else {
      setCredentialsError(
        result.error || 'Invalid credentials. Please check your Email / Username and Password.'
      );
    }
  };

  // Deduplicate Roles for Step 2
  const uniqueRoles = useMemo(() => {
    if (!loginData?.roles) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    loginData.roles.forEach((r) => {
      const trimmed = (r.roleName || '').trim();
      if (trimmed && !seen.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        list.push(trimmed);
      }
    });
    return list;
  }, [loginData]);

  // Available Areas for the currently selected role
  const availableAreas = useMemo(() => {
    if (!loginData?.roles || !selectedRoleName) return [];
    const seen = new Set<string>();
    const list: string[] = [];
    loginData.roles
      .filter((r) => (r.roleName || '').trim().toLowerCase() === selectedRoleName.trim().toLowerCase())
      .forEach((r) => {
        const trimmed = (r.areaName || '').trim();
        if (trimmed && !seen.has(trimmed.toLowerCase())) {
          seen.add(trimmed.toLowerCase());
          list.push(trimmed);
        }
      });
    return list;
  }, [loginData, selectedRoleName]);

  // Auto-select if only 1 option available
  useEffect(() => {
    if (step === 'role-area' && uniqueRoles.length === 1 && !selectedRoleName) {
      setSelectedRoleName(uniqueRoles[0]);
    }
  }, [step, uniqueRoles, selectedRoleName]);

  useEffect(() => {
    if (step === 'role-area' && availableAreas.length === 1 && !selectedAreaName) {
      setSelectedAreaName(availableAreas[0]);
    }
  }, [step, availableAreas, selectedAreaName]);

  // Close custom dropdowns on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(e.target as Node)) {
        setIsAreaDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRoleDropdownOpen(false);
        setIsAreaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filtered unique roles for search
  const filteredRoles = useMemo(() => {
    if (!roleSearch.trim()) return uniqueRoles;
    const q = roleSearch.toLowerCase().trim();
    return uniqueRoles.filter((r) => r.toLowerCase().includes(q));
  }, [uniqueRoles, roleSearch]);

  // Filtered available areas for search
  const filteredAreas = useMemo(() => {
    if (!areaSearch.trim()) return availableAreas;
    const q = areaSearch.toLowerCase().trim();
    return availableAreas.filter((a) => a.toLowerCase().includes(q));
  }, [availableAreas, areaSearch]);

  // Handle Step 2: Role & Area Submit
  const handleRoleAreaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRoleTouched(true);
    setAreaTouched(true);
    setRoleAreaError(null);

    if (!selectedRoleName) {
      setRoleAreaError('Please select a role.');
      return;
    }

    if (!selectedAreaName) {
      setRoleAreaError('Please select an area.');
      return;
    }

    if (!loginData) {
      setRoleAreaError('Session expired. Please sign in again.');
      setStep('credentials');
      return;
    }

    // Connect to the actual role object from API response
    const matchedRole = loginData.roles.find(
      (r) =>
        (r.roleName || '').trim().toLowerCase() === selectedRoleName.trim().toLowerCase() &&
        (r.areaName || '').trim().toLowerCase() === selectedAreaName.trim().toLowerCase()
    );

    if (!matchedRole) {
      setRoleAreaError('Selected role and area combination is invalid. Please select again.');
      return;
    }

    // Call roleModules API and save authorized session with centralized areas
    const result = await selectRoleAndArea({
      userId: loginData.userId,
      email: loginData.email,
      role: matchedRole,
      allRoles: loginData.roles,
      loginData: loginData as any,
    });

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setRoleAreaError(result.error || 'Failed to retrieve permissions for this role and area. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center lg:justify-end bg-[#FAF9FC] overflow-y-auto py-6 sm:py-10">
      {/* Background Graphic Image */}
      <img
        src={loginBg}
        alt="Haatza Nest Operations"
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
      />

      {/* Mobile/Tablet readability overlay */}
      <div className="lg:hidden absolute inset-0 bg-white/70 backdrop-blur-[2px] pointer-events-none" />

      {/* Main Login Card Section */}
      <div className="relative z-20 w-full max-w-[500px] px-3 sm:px-6 lg:px-0 lg:mr-16 xl:mr-24 2xl:mr-36 my-auto">
        <div className="rounded-2xl sm:rounded-[32px] bg-white px-4.5 sm:px-10 py-7 sm:py-12 shadow-[0_24px_70px_-10px_rgba(0,0,0,0.15)] border border-[#EEEEF2]/80">

          {/* Brand Header: Logo image */}
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

          {/* SCREEN 1: CREDENTIALS */}
          {step === 'credentials' && (
            <>
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
              {credentialsError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FEF2F2] p-3.5 text-sm text-[#B42318] animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{credentialsError}</div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-4" noValidate>
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
                      className={`w-full pl-11 pr-4 py-3.5 text-sm bg-white border rounded-xl text-[#1F1F1F] placeholder:text-[#9CA3AF] focus:border-[#4A2E80] focus:ring-2 focus:ring-[#4A2E80]/15 outline-none transition-all disabled:opacity-50 ${
                        showEmailError
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
                  disabled={!canSubmitCredentials}
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
            </>
          )}

          {/* SCREEN 2: ROLE + AREA SELECTION */}
          {step === 'role-area' && (
            <>
              {/* Header */}
              <div className="mt-7 mb-5 text-center">
                <h2 className="text-2xl font-extrabold text-[#1F1F1F] leading-tight">
                  Select Role & Area
                </h2>
                <p className="text-sm text-[#6B6B6B] mt-1.5">
                  Choose your operating role and assigned location to continue
                </p>
              </div>

              {/* Error Alert */}
              {roleAreaError && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-[#FEF2F2] p-3.5 text-sm text-[#B42318] animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium">{roleAreaError}</div>
                </div>
              )}

              {/* Role + Area Form */}
              <form onSubmit={handleRoleAreaSubmit} className="space-y-4" noValidate>
                {/* 1. Role Dropdown */}
                <div ref={roleDropdownRef} className="relative">
                  <label id="roleLabel" className="block text-xs font-semibold text-[#4A2E80] uppercase tracking-wider mb-1.5 pl-0.5">
                    Role
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      id="roleSelectBtn"
                      aria-labelledby="roleLabel"
                      aria-haspopup="listbox"
                      aria-expanded={isRoleDropdownOpen}
                      disabled={isLoading}
                      onClick={() => {
                        setIsRoleDropdownOpen((prev) => !prev);
                        setIsAreaDropdownOpen(false);
                        setRoleSearch('');
                      }}
                      className={`w-full min-w-0 flex items-center justify-between gap-2.5 pl-4 pr-3.5 py-3 text-sm rounded-xl border transition-all shadow-soft-xs cursor-pointer select-none text-left ${
                        roleTouched && !selectedRoleName
                          ? 'border-rose-400 bg-rose-50/40 text-[#1F1F1F] focus:ring-2 focus:ring-rose-500/20'
                          : isRoleDropdownOpen
                          ? 'border-[#4A2E80] bg-white ring-2 ring-[#4A2E80]/15 text-[#4A2E80]'
                          : 'border-[#E5E7EB] bg-[#FAF9FC] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Briefcase
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isRoleDropdownOpen || selectedRoleName ? 'text-[#4A2E80]' : 'text-[#9CA3AF]'
                          }`}
                        />
                        <span
                          className={`truncate text-sm ${
                            selectedRoleName ? 'font-bold text-[#1F1F1F]' : 'font-normal text-[#9CA3AF]'
                          }`}
                          title={selectedRoleName || 'Select Role'}
                        >
                          {selectedRoleName || 'Select Role'}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform duration-200 ${
                          isRoleDropdownOpen ? 'rotate-180 text-[#4A2E80]' : ''
                        }`}
                      />
                    </button>

                    {/* Role Options Floating Menu */}
                    {isRoleDropdownOpen && (
                      <div
                        role="listbox"
                        aria-labelledby="roleLabel"
                        className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-60 overflow-y-auto rounded-xl border border-[#EEEEF2] bg-white p-1.5 shadow-xl shadow-purple-950/10 animate-in fade-in zoom-in-95 duration-150"
                      >
                        {uniqueRoles.length > 5 && (
                          <div className="p-1.5 mb-1 border-b border-[#EEEEF2] bg-[#FAF9FC] rounded-lg">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
                              <input
                                type="text"
                                value={roleSearch}
                                onChange={(e) => setRoleSearch(e.target.value)}
                                placeholder="Search role..."
                                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-white border border-[#EEEEF2] text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#4A2E80]"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-0.5">
                          {filteredRoles.length === 0 ? (
                            <div className="py-2.5 px-3 text-center text-xs text-[#6B6B6B]">
                              No matching roles found
                            </div>
                          ) : (
                            filteredRoles.map((roleName) => {
                              const isSelected = selectedRoleName === roleName;
                              return (
                                <button
                                  key={roleName}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    setSelectedRoleName(roleName);
                                    setSelectedAreaName(''); // reset area when role changes
                                    setIsRoleDropdownOpen(false);
                                    setRoleTouched(true);
                                    setRoleAreaError(null);
                                  }}
                                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left ${
                                    isSelected
                                      ? 'bg-[#EDE9FE] text-[#4A2E80] font-bold shadow-soft-xs'
                                      : 'text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#4A2E80]'
                                  }`}
                                  title={roleName}
                                >
                                  <span className="truncate flex-1 min-w-0">{roleName}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-[#4A2E80] shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {roleTouched && !selectedRoleName && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium pl-1">
                      Please select a role.
                    </p>
                  )}
                </div>

                {/* 2. Area Dropdown */}
                <div ref={areaDropdownRef} className="relative">
                  <label id="areaLabel" className="block text-xs font-semibold text-[#4A2E80] uppercase tracking-wider mb-1.5 pl-0.5">
                    Area
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      id="areaSelectBtn"
                      aria-labelledby="areaLabel"
                      aria-haspopup="listbox"
                      aria-expanded={isAreaDropdownOpen}
                      disabled={isLoading || !selectedRoleName}
                      onClick={() => {
                        if (!selectedRoleName) return;
                        setIsAreaDropdownOpen((prev) => !prev);
                        setIsRoleDropdownOpen(false);
                        setAreaSearch('');
                      }}
                      className={`w-full min-w-0 flex items-center justify-between gap-2.5 pl-4 pr-3.5 py-3 text-sm rounded-xl border transition-all shadow-soft-xs cursor-pointer select-none text-left ${
                        areaTouched && !selectedAreaName
                          ? 'border-rose-400 bg-rose-50/40 text-[#1F1F1F] focus:ring-2 focus:ring-rose-500/20'
                          : isAreaDropdownOpen
                          ? 'border-[#4A2E80] bg-white ring-2 ring-[#4A2E80]/15 text-[#4A2E80]'
                          : 'border-[#E5E7EB] bg-[#FAF9FC] hover:bg-white hover:border-[#DDD6FE] text-[#1F1F1F]'
                      } disabled:bg-[#FAF9FC] disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <MapPin
                          className={`h-4 w-4 shrink-0 transition-colors ${
                            isAreaDropdownOpen || selectedAreaName ? 'text-[#4A2E80]' : 'text-[#9CA3AF]'
                          }`}
                        />
                        <span
                          className={`truncate text-sm ${
                            selectedAreaName ? 'font-bold text-[#1F1F1F]' : 'font-normal text-[#9CA3AF]'
                          }`}
                          title={selectedAreaName || (selectedRoleName ? 'Select Area' : 'Select a role first')}
                        >
                          {selectedAreaName || (selectedRoleName ? 'Select Area' : 'Select a role first')}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform duration-200 ${
                          isAreaDropdownOpen ? 'rotate-180 text-[#4A2E80]' : ''
                        }`}
                      />
                    </button>

                    {/* Area Options Floating Menu */}
                    {isAreaDropdownOpen && selectedRoleName && (
                      <div
                        role="listbox"
                        aria-labelledby="areaLabel"
                        className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-60 overflow-y-auto rounded-xl border border-[#EEEEF2] bg-white p-1.5 shadow-xl shadow-purple-950/10 animate-in fade-in zoom-in-95 duration-150"
                      >
                        {availableAreas.length > 5 && (
                          <div className="p-1.5 mb-1 border-b border-[#EEEEF2] bg-[#FAF9FC] rounded-lg">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B6B6B]" />
                              <input
                                type="text"
                                value={areaSearch}
                                onChange={(e) => setAreaSearch(e.target.value)}
                                placeholder="Search area..."
                                className="w-full pl-8 pr-2.5 py-1 text-xs rounded-md bg-white border border-[#EEEEF2] text-[#1F1F1F] placeholder:text-[#9E9E9E] focus:outline-none focus:border-[#4A2E80]"
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-0.5">
                          {filteredAreas.length === 0 ? (
                            <div className="py-2.5 px-3 text-center text-xs text-[#6B6B6B]">
                              No matching areas found
                            </div>
                          ) : (
                            filteredAreas.map((areaName) => {
                              const isSelected = selectedAreaName === areaName;
                              return (
                                <button
                                  key={areaName}
                                  type="button"
                                  role="option"
                                  aria-selected={isSelected}
                                  onClick={() => {
                                    setSelectedAreaName(areaName);
                                    setIsAreaDropdownOpen(false);
                                    setAreaTouched(true);
                                    setRoleAreaError(null);
                                  }}
                                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left ${
                                    isSelected
                                      ? 'bg-[#EDE9FE] text-[#4A2E80] font-bold shadow-soft-xs'
                                      : 'text-[#1F1F1F] hover:bg-[#F5F3FF] hover:text-[#4A2E80]'
                                  }`}
                                  title={areaName}
                                >
                                  <span className="truncate flex-1 min-w-0">{areaName}</span>
                                  {isSelected && (
                                    <Check className="h-4 w-4 text-[#4A2E80] shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {areaTouched && !selectedAreaName && (
                    <p className="mt-1.5 text-xs text-rose-600 font-medium pl-1">
                      Please select an area.
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !selectedRoleName || !selectedAreaName}
                  className="w-full mt-2 py-3.5 px-6 rounded-xl bg-[#4A2E80] hover:bg-[#3B1E7A] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verifying Permissions...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Back to credentials */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('credentials');
                    setRoleAreaError(null);
                    setCredentialsError(null);
                  }}
                  disabled={isLoading}
                  className="w-full text-center text-xs font-semibold text-[#6B6B6B] hover:text-[#4A2E80] transition-colors pt-2 pb-1 cursor-pointer disabled:opacity-50"
                >
                  ← Sign in with a different account
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};


