'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const authorityLinks = [
    { href: '/', label: 'Command Dashboard' },
    { href: '/map', label: 'Map View' },
    { href: '/zones', label: 'Risk Zones' },
    { href: '/relocation', label: 'Relocation' },
    { href: '/reports', label: 'Reports' },
  ];

  const communityLinks = [
    { href: '/community', label: 'Safety Portal' },
  ];

  const navLinks = user?.role === 'community' ? communityLinks : authorityLinks;

  return (
    <nav className="bg-white border-b border-gray-200 shadow-card sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={user?.role === 'community' ? '/community' : '/'} className="flex items-center gap-2 group">
            <img 
              src="/hazardshield-logo.png" 
              alt="HazardShield" 
              className="h-11 w-auto hover:opacity-80 transition-opacity"
            />
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground leading-tight">HazardShield</h1>
              <p className="text-[10px] text-gray-500 font-medium">AI Geospatial Platform</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-accent font-bold'
                        : 'text-gray-700 hover:text-accent hover:bg-gray-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right Action Bar */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* User Badge */}
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs">
                  <UserCircleIcon className="w-4 h-4 text-gray-500" />
                  <span className="font-bold text-gray-800">{user.name}</span>
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                    user.role === 'community'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-indigo-200 text-indigo-900'
                  }`}>
                    {user.role === 'community' ? 'Citizen' : (user.authorityLevel || 'Authority')}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-semibold"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-accent hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-soft transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors text-gray-600"
          >
            {isOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100 space-y-2">
            {user ? (
              <>
                <div className="px-3 py-2 bg-gray-50 rounded-lg flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-gray-900">{user.name}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-accent">
                    {user.role === 'community' ? 'Citizen' : (user.authorityLevel || 'Authority')}
                  </span>
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-accent hover:bg-muted rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}

                <button
                  onClick={() => {
                    setIsOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="block w-full text-center px-4 py-2.5 bg-accent text-white font-bold text-sm rounded-lg"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
