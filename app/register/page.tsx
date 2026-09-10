'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole, AuthorityLevel } from '@/lib/context/AuthContext';
import { hazardZonesData } from '@/data/hazardZones';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  BuildingOffice2Icon,
  KeyIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  MapPinIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { user, register, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>('community');
  
  // Common Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Community Specific
  const [assignedZoneId, setAssignedZoneId] = useState(hazardZonesData[0]?.id || 'zone_001');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('Delhi Eastern District');
  
  // Authority Specific
  const [authorityLevel, setAuthorityLevel] = useState<AuthorityLevel>('DistrictAdmin');
  const [department, setDepartment] = useState('District Disaster Management Authority (DDMA)');
  const [jurisdictionState, setJurisdictionState] = useState('Delhi NCT');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, route to appropriate dashboard
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'community') {
        router.replace('/community');
      } else {
        router.replace('/');
      }
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name,
        email,
        phone,
        password,
        role: activeTab,
        ...(activeTab === 'authority'
          ? {
              authorityLevel,
              location: {
                address: department,
                district,
                state: jurisdictionState,
              },
            }
          : {
              assignedZoneId,
              location: {
                address,
                district,
                state: 'Delhi NCT',
              },
            }),
      };

      const res = await register(payload);
      if (!res.success) {
        setError(res.error || 'Failed to create account. Please check your details.');
      }
    } catch (err: any) {
      setError(err.message || 'Error occurred while registering.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Demo Pre-fills
  const handleQuickPrefill = (role: UserRole) => {
    setActiveTab(role);
    setError(null);
    if (role === 'community') {
      setName('Pooja Verma');
      setEmail(`pooja.resident_${Math.floor(1000 + Math.random() * 9000)}@hazardshield.com`);
      setPhone('+919876543219');
      setPassword('citizen123');
      setConfirmPassword('citizen123');
      setAssignedZoneId('zone_001');
      setAddress('Yamuna Floodplain Sector 4B, Delhi');
      setDistrict('East Delhi');
    } else {
      setName('Dr. Neeraj Saxena');
      setEmail(`neeraj.officer_${Math.floor(1000 + Math.random() * 9000)}@ddma.gov.in`);
      setPhone('+919811002233');
      setPassword('district123');
      setConfirmPassword('district123');
      setAuthorityLevel('DistrictAdmin');
      setDepartment('District Emergency Operations Centre (DEOC)');
      setDistrict('East Delhi');
      setJurisdictionState('Delhi NCT');
    }
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
          Create HazardShield Account
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Register for Early Warning Alerts or Command Authorization
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-card sm:rounded-2xl sm:px-10 border border-gray-200">
          
          {/* Dual-Role Registration Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab('community');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'community'
                  ? 'bg-white text-accent shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <UserGroupIcon className="w-4 h-4" />
              <span>Community Citizen</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('authority');
                setError(null);
              }}
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'authority'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <BuildingOffice2Icon className="w-4 h-4" />
              <span>Disaster Authority</span>
            </button>
          </div>

          {/* Role Description Card */}
          <div className={`p-3.5 rounded-xl border mb-6 text-xs flex items-center gap-3 ${
            activeTab === 'community'
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
          }`}>
            <ShieldCheckIcon className={`w-6 h-6 flex-shrink-0 ${
              activeTab === 'community' ? 'text-accent' : 'text-indigo-600'
            }`} />
            <div>
              <p className="font-bold">
                {activeTab === 'community'
                  ? 'Resident Civil Protection Registration'
                  : 'Government Authority & Official Command Access'}
              </p>
              <p className="opacity-80 text-[11px] mt-0.5">
                {activeTab === 'community'
                  ? 'Receive real-time evacuation advisories, access safe shelter routing, and submit verified hazard reports.'
                  : 'Manage dynamic hazard zones, simulate carrying capacity limits, and authorize evacuation orders.'}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-700">
              <ExclamationCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                {activeTab === 'community' ? 'Full Name' : 'Officer / Official Name'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={activeTab === 'community' ? 'e.g., Rahul Sharma' : 'e.g., Dr. Rajesh Kumar'}
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                />
              </div>
            </div>

            {/* Email & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {activeTab === 'community' ? 'Email Address' : 'Official Gov Email'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <EnvelopeIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={activeTab === 'community' ? 'name@domain.com' : 'officer@ddma.gov.in'}
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Contact Mobile <span className="text-gray-400 font-normal">(SMS Alerts)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <PhoneIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Role-Specific Fields */}
            {activeTab === 'community' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Your Monitored Hazard Sector <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignedZoneId}
                    onChange={(e) => setAssignedZoneId(e.target.value)}
                    className="block w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                  >
                    {hazardZonesData.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — {z.hazardType.toUpperCase()} ({z.riskLevel.toUpperCase()} RISK)
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-500 mt-1">
                    You will receive automated telemetry alerts and designated safe shelter directions for this area.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Residential Street / Address
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Block C, Sector 12"
                      className="block w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      District / City
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. East Delhi"
                      className="block w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Authority Clearance Tier <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={authorityLevel}
                      onChange={(e) => setAuthorityLevel(e.target.value as AuthorityLevel)}
                      className="block w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                    >
                      <option value="DistrictAdmin">District Administration (DistrictAdmin)</option>
                      <option value="StateDMA">State Disaster Management (StateDMA)</option>
                      <option value="MHA">Ministry of Home Affairs / NDMA (MHA)</option>
                      <option value="Municipal">Municipal Corporation / Local Ward (Municipal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Jurisdiction State / UT <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={jurisdictionState}
                      onChange={(e) => setJurisdictionState(e.target.value)}
                      placeholder="e.g., Delhi NCT / Uttarakhand"
                      className="block w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Department / Operation Centre
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g., District Emergency Operations Centre (DEOC)"
                    className="block w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                  />
                </div>
              </>
            )}

            {/* Password & Confirmation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Create Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <KeyIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-accent focus:border-accent text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-soft text-sm font-bold text-white transition-colors disabled:opacity-50 ${
                  activeTab === 'community'
                    ? 'bg-accent hover:bg-blue-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span>
                    Complete Registration as {activeTab === 'community' ? 'Community Citizen' : `${authorityLevel} Official`}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Sign In */}
          <div className="mt-6 text-center text-xs text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-accent hover:text-blue-700 underline">
              Sign In here
            </Link>
          </div>

          {/* Quick Demo Pre-fill Buttons */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
              Quick Pre-fill Registration (for Testing):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickPrefill('community')}
                className="text-left p-2 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors"
              >
                <span className="text-xs font-bold text-blue-900 block">Prefill Citizen Form</span>
                <span className="text-[10px] text-blue-600">Pooja Verma • Yamuna Sector</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickPrefill('authority')}
                className="text-left p-2 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                <span className="text-xs font-bold text-indigo-900 block">Prefill Officer Form</span>
                <span className="text-[10px] text-indigo-600">Dr. Neeraj Saxena • DEOC</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
