'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type RestaurantName =
  | 'Hounslow' |'Reading' |'Dartford' |'Leicester' |'Sangeetha Hounslow' |'Sangeetha Pinner' |'Sangeetha Langley' |'Sangeetha Bracknell' |'Dosa Company Tolworth' |'Dosa Company Milton Keynes';

export interface RestaurantProfile {
  name: RestaurantName;
  /** Full display name, e.g. "Samko Hounslow" */
  fullName: string;
  /** 3-letter code used in order / dispatch references */
  code: string;
  /** Free-text address line */
  address: string;
  /** Manager login details */
  managerName: string;
  managerInitials: string;
  email: string;
  password: string;
  color: string;
  /** Approximate scale factor vs. Hounslow flagship for demo figures */
  scale: number;
  /** Demo food cost % */
  foodCostPct: number;
}

export const NEW_RESTAURANTS: RestaurantProfile[] = [
  { name: 'Sangeetha Hounslow', fullName: 'Sangeetha Hounslow', code: 'SGH', address: 'Hounslow, London, UK', managerName: 'Lakshmi Narayanan', managerInitials: 'LN', email: 'sangeetha.hounslow@samkokitchens.co.uk', password: 'SK@SgHounslow2026', color: '#0D9488', scale: 0.85, foodCostPct: 30.6 },
  { name: 'Sangeetha Pinner', fullName: 'Sangeetha Pinner', code: 'SGP', address: 'Pinner, Middlesex, UK', managerName: 'Ramesh Iyer', managerInitials: 'RI', email: 'sangeetha.pinner@samkokitchens.co.uk', password: 'SK@SgPinner2026', color: '#7C3AED', scale: 0.7, foodCostPct: 29.4 },
  { name: 'Sangeetha Langley', fullName: 'Sangeetha Langley', code: 'SGL', address: 'Langley, Berkshire, UK', managerName: 'Deepa Krishnan', managerInitials: 'DK', email: 'sangeetha.langley@samkokitchens.co.uk', password: 'SK@SgLangley2026', color: '#EA580C', scale: 0.62, foodCostPct: 31.8 },
  { name: 'Sangeetha Bracknell', fullName: 'Sangeetha Bracknell', code: 'SGB', address: 'Bracknell, Berkshire, UK', managerName: 'Arun Venkat', managerInitials: 'AV', email: 'sangeetha.bracknell@samkokitchens.co.uk', password: 'SK@SgBracknell2026', color: '#65A30D', scale: 0.58, foodCostPct: 30.2 },
  { name: 'Dosa Company Tolworth', fullName: 'Dosa Company Tolworth', code: 'DCT', address: 'Tolworth, Surrey, UK', managerName: 'Bhavani Shankar', managerInitials: 'BS', email: 'dosa.tolworth@samkokitchens.co.uk', password: 'SK@DcTolworth2026', color: '#BE185D', scale: 0.66, foodCostPct: 32.4 },
  { name: 'Dosa Company Milton Keynes', fullName: 'Dosa Company Milton Keynes', code: 'DCM', address: 'Milton Keynes, Buckinghamshire, UK', managerName: 'Gopal Ramachandran', managerInitials: 'GR', email: 'dosa.miltonkeynes@samkokitchens.co.uk', password: 'SK@DcMK2026', color: '#0369A1', scale: 0.74, foodCostPct: 29.9 },
];

export const NEW_RESTAURANT_NAMES: RestaurantName[] = NEW_RESTAURANTS.map((r) => r.name);

/** All restaurant names usable in filters */
export const ALL_RESTAURANT_NAMES: RestaurantName[] = [
  'Hounslow',
  'Reading',
  'Dartford',
  'Leicester',
  ...NEW_RESTAURANT_NAMES,
];

export function getRestaurantProfile(name: string | null | undefined): RestaurantProfile | undefined {
  return NEW_RESTAURANTS.find((r) => r.name === name);
}

export interface SessionUser {
  id: string;
  role: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  /** null = access to all locations; otherwise locked to a single restaurant */
  restaurant: RestaurantName | null;
  /** true for central kitchen accounts */
  isCentralKitchen?: boolean;
}

export const demoAccounts: (SessionUser & { password: string })[] = [
  { id: 'cred-owner', role: 'Business Owner', name: 'Rajesh Kumar', email: 'owner@samkokitchens.co.uk', password: 'SK@Owner2026', initials: 'RK', color: '#ED1C24', restaurant: null },
  { id: 'cred-kitchen', role: 'Kitchen Manager', name: 'Priya Sharma', email: 'kitchen@samkokitchens.co.uk', password: 'SK@Kitchen2026', initials: 'PS', color: '#168447', restaurant: null, isCentralKitchen: true },
  { id: 'cred-finance', role: 'Finance / Auditor', name: 'Vikram Nair', email: 'finance@samkokitchens.co.uk', password: 'SK@Finance2026', initials: 'VN', color: '#7C3AED', restaurant: null },
  { id: 'cred-hounslow', role: 'Restaurant Manager', name: 'Anita Menon', email: 'hounslow@samkokitchens.co.uk', password: 'SK@Hounslow2026', initials: 'AM', color: '#2563EB', restaurant: 'Hounslow' },
  { id: 'cred-reading', role: 'Restaurant Manager', name: 'Suresh Pillai', email: 'reading@samkokitchens.co.uk', password: 'SK@Reading2026', initials: 'SP', color: '#0EA5E9', restaurant: 'Reading' },
  { id: 'cred-dartford', role: 'Restaurant Manager', name: 'Kumar Rajan', email: 'dartford@samkokitchens.co.uk', password: 'SK@Dartford2026', initials: 'KR', color: '#D97706', restaurant: 'Dartford' },
  { id: 'cred-leicester', role: 'Restaurant Manager', name: 'Meena Lakshmi', email: 'leicester@samkokitchens.co.uk', password: 'SK@Leicester2026', initials: 'ML', color: '#DB2777', restaurant: 'Leicester' },
  ...NEW_RESTAURANTS.map((r) => ({
    id: `cred-${r.code.toLowerCase()}`,
    role: 'Restaurant Manager',
    name: r.managerName,
    email: r.email,
    password: r.password,
    initials: r.managerInitials,
    color: r.color,
    restaurant: r.name as RestaurantName,
  })),
];

const STORAGE_KEY = 'madrasops-session';

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  /** Restaurant the user is locked to, or null if they can see all */
  lockedRestaurant: RestaurantName | null;
  login: (user: SessionUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  lockedRestaurant: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionUser;
        const match = demoAccounts.find((a) => a.id === parsed.id);
        if (match) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password, ...safe } = match;
          setUser(safe);
        }
      }
    } catch {
      // ignore corrupted session
    }
    setReady(true);
  }, []);

  const login = useCallback((u: SessionUser) => {
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      // storage unavailable
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, ready, lockedRestaurant: user?.restaurant ?? null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Returns the restaurant the current session is scoped to (null = all).
 * Before the session is hydrated it returns null so SSR and first client render match.
 */
export function useScopedRestaurant(): RestaurantName | null {
  const { lockedRestaurant } = useAuth();
  return lockedRestaurant;
}

/**
 * Match helper: true if a record's restaurant string belongs to the scope (or no scope).
 * Legacy short names (e.g. "Hounslow") do not match longer names that contain them
 * (e.g. "Sangeetha Hounslow").
 */
export function matchesScope(scope: RestaurantName | null, value: string | undefined | null): boolean {
  if (!scope) return true;
  const v = (value ?? '').toLowerCase();
  const s = scope.toLowerCase();
  if (!v.includes(s)) return false;
  const longer = ALL_RESTAURANT_NAMES.filter(
    (n) => n.toLowerCase() !== s && n.toLowerCase().includes(s)
  );
  return !longer.some((n) => v.includes(n.toLowerCase()));
}
