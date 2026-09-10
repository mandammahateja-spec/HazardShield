'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, UserRole, AuthorityLevel } from '@/lib/context/AuthContext';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  KeyIcon,
  PhoneIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>('community');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authorityLevel, setAuthorityLevel] = useState<AuthorityLevel>('DistrictAdmin');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to appropriate destination
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'community') {
        router.replace('/community');
      } else {
        const redirect = searchParams.get('redirect') || '/';
        router.replace(redirect);
      }
    }
  }, [user, authLoading, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const credentials = {
      email,
      password,
      ...(activeTab === 'authority' ? { authorityLevel } : {}),
    };

    const res = await login(credentials, activeTab);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Invalid credentials.');
    }
  };

  // Quick-fill presets for demonstration
  const handleQuickFill = (role: UserRole, presetEmail: string, presetPass: string, level?: AuthorityLevel) => {
    setActiveTab(role);
    setEmail(presetEmail);
    setPassword(presetPass);
    if (level) {
      setAuthorityLevel(level);
    }
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center items-center gap-2 mb-3">
          <img 
            src="/hazardshield-logo.png" 
            alt="HazardShield" 
            className="h-14 w-auto"
          />
        </div>
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          HazardShield Platform
        </h2>
        <p className="mt-2 text-sm text-gray-600 max-w">
          AI Geospatial Hazard Zone & Carrying Capacity Governance
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-2xl sm:px-10 border border-gray-200">
          
          {/* Dual-Role Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-8">
            <button
              type="button"
              onClick={() => {
                setActiveTab('community');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'community'
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserGroupIcon className="w-5 h-5" />
              <span>Community Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('authority');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                activeTab === 'authority'
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BuildingOffice2Icon className="w-5 h-5" />
              <span>Authority Login</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-700 font-medium">{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Input: Email or Phone */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                {activeTab === 'community' ? 'Email or Registered Phone Number' : 'Authority Official Email'}
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  {activeTab === 'community' ? (
                    <PhoneIcon className="w-5 h-5" />
                  ) : (
                    <EnvelopeIcon className="w-5 h-5" />
                  )}
                </div>
                <input
                  type={activeTab === 'community' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    activeTab === 'community'
                      ? 'citizen@hazardshield.com or +91...'
                      : 'officer@hazardshield.com'
                  }
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
                />
              </div>
            </div>

            {/* Input: Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <KeyIcon className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm"
                />
              </div>
            </div>

            {/* Authority Level Dropdown (Only for Authority Login) */}
            {activeTab === 'authority' && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                  Designated Authority Level
                </label>
                <select
                  value={authorityLevel}
                  onChange={(e) => setAuthorityLevel(e.target.value as AuthorityLevel)}
                  className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent text-sm font-medium"
                >
                  <option value="MHA">Ministry of Home Affairs (National Command)</option>
                  <option value="StateDMA">State Disaster Management Authority (StateDMA)</option>
                  <option value="DistrictAdmin">District Administration / DDMA (DistrictAdmin)</option>
                  <option value="Municipal">Municipal / Urban Local Body (Municipal)</option>
                </select>
                <p className="text-[11px] text-gray-500 mt-1">
                  Relocation approvals require StateDMA or MHA clearance; hazard verification requires DistrictAdmin or higher.
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-soft text-sm font-bold text-white bg-accent hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Authenticating...
                  </span>
                ) : (
                  <span>Sign In as {activeTab === 'community' ? 'Community Citizen' : `${authorityLevel} Official`}</span>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Register */}
          <div className="mt-5 text-center text-xs text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-bold text-accent hover:text-blue-700 underline">
              Create an Account (Citizen / Authority)
            </Link>
          </div>

          {/* Quick-Fill Presets Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              One-Click Credentials:
            </p>

            {activeTab === 'community' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('community', 'citizen@hazardshield.com', 'citizen123')}
                  className="w-full text-left p-2.5 rounded-lg border border-blue-100 bg-blue-50/60 hover:bg-blue-100/70 transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">Rahul Sharma (Resident Citizen)</span>
                    <span className="text-[11px] text-gray-600">citizen@hazardshield.com • Yamuna Bank Colony</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-200 text-blue-800">Auto-fill</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('authority', 'district@hazardshield.com', 'district123', 'DistrictAdmin')}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-900 block">District Magistrate</span>
                  <span className="text-[10px] text-gray-500">district@hazardshield.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('authority', 'state@hazardshield.com', 'state123', 'StateDMA')}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-900 block">State DMA Officer</span>
                  <span className="text-[10px] text-gray-500">state@hazardshield.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('authority', 'admin@hazardshield.com', 'admin123', 'MHA')}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-900 block">MHA National Admin</span>
                  <span className="text-[10px] text-gray-500">admin@hazardshield.com</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('authority', 'municipal@hazardshield.com', 'muni123', 'Municipal')}
                  className="text-left p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <span className="text-xs font-bold text-gray-900 block">Municipal Ward</span>
                  <span className="text-[10px] text-gray-500">municipal@hazardshield.com</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500 font-medium text-sm">
            <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading HazardShield Authentication...
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
