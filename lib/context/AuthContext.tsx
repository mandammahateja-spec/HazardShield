'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type UserRole = 'community' | 'authority';
export type AuthorityLevel = 'MHA' | 'StateDMA' | 'DistrictAdmin' | 'Municipal';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  authorityLevel?: AuthorityLevel;
  assignedZoneId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email?: string; phone?: string; password?: string; authorityLevel?: AuthorityLevel }, loginType: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('hazardshield_token');
      const storedUser = localStorage.getItem('hazardshield_user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Failed to load auth session:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (
    credentials: { email?: string; phone?: string; password?: string; authorityLevel?: AuthorityLevel },
    loginType: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          loginType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'Authentication failed. Please verify your credentials.',
        };
      }

      const receivedToken = data.data.token;
      const receivedUser: AuthUser = {
        id: data.data.user.id,
        name: data.data.user.name,
        email: data.data.user.email,
        phone: data.data.user.phone,
        role: data.data.user.role || loginType,
        authorityLevel: data.data.user.authorityLevel,
        assignedZoneId: data.data.user.assignedZoneId,
      };

      setToken(receivedToken);
      setUser(receivedUser);

      localStorage.setItem('hazardshield_token', receivedToken);
      localStorage.setItem('hazardshield_user', JSON.stringify(receivedUser));

      // Redirect to the appropriate destination
      if (receivedUser.role === 'community') {
        router.push('/community');
      } else {
        router.push('/');
      }

      return { success: true };
    } catch (err: any) {
      console.warn('Backend login request failed, checking offline demo fallback:', err);
      // Fallback demo accounts for local / offline verification
      const demoUsers: Record<string, { pass: string; user: AuthUser }> = {
        'citizen@hazardshield.com': {
          pass: 'citizen123',
          user: {
            id: 'demo_cit_01',
            name: 'Rahul Sharma (Citizen)',
            email: 'citizen@hazardshield.com',
            phone: '+919876543210',
            role: 'community',
            assignedZoneId: 'zone_001',
          },
        },
        'district@hazardshield.com': {
          pass: 'district123',
          user: {
            id: 'demo_auth_dist',
            name: 'Amit Verma (District DM)',
            email: 'district@hazardshield.com',
            role: 'authority',
            authorityLevel: 'DistrictAdmin',
          },
        },
        'state@hazardshield.com': {
          pass: 'state123',
          user: {
            id: 'demo_auth_state',
            name: 'Priya Nair (State DMA)',
            email: 'state@hazardshield.com',
            role: 'authority',
            authorityLevel: 'StateDMA',
          },
        },
        'admin@hazardshield.com': {
          pass: 'admin123',
          user: {
            id: 'demo_auth_mha',
            name: 'Rajesh Kumar (MHA)',
            email: 'admin@hazardshield.com',
            role: 'authority',
            authorityLevel: 'MHA',
          },
        },
        'municipal@hazardshield.com': {
          pass: 'muni123',
          user: {
            id: 'demo_auth_muni',
            name: 'Sunita Rao (Municipal Comm)',
            email: 'municipal@hazardshield.com',
            role: 'authority',
            authorityLevel: 'Municipal',
          },
        },
      };

      const emailKey = (credentials.email || '').toLowerCase().trim();
      const demo = demoUsers[emailKey];

      if (demo && demo.pass === credentials.password) {
        const dummyToken = `demo_jwt_fallback_${Date.now()}`;
        setToken(dummyToken);
        setUser(demo.user);
        localStorage.setItem('hazardshield_token', dummyToken);
        localStorage.setItem('hazardshield_user', JSON.stringify(demo.user));

        if (demo.user.role === 'community') {
          router.push('/community');
        } else {
          router.push('/');
        }
        return { success: true };
      }

      return {
        success: false,
        error: err.message || 'Network error connecting to backend authentication service.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    try {
      if (token) {
        fetch(`${API_BASE}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('hazardshield_token');
      localStorage.removeItem('hazardshield_user');
      router.push('/login');
    }
  }, [token, router]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Route protection hook
 */
export function useRequireAuth(allowedRoles?: UserRole[]) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!token || !user) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'community') {
          router.replace('/community');
        } else {
          router.replace('/');
        }
      }
    }
  }, [user, token, isLoading, router, pathname, allowedRoles]);

  return { user, token, isLoading, isAuthorized: !!user && (!allowedRoles || allowedRoles.includes(user.role)) };
}
