'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export type RestaurantName = 'Stanhill Hotel Limited' | 'Warren House Hotel Limited';

export type HotelFilter = RestaurantName | 'both';

export interface RestaurantProfile {
  name: RestaurantName;
  /** Full display name */
  fullName: string;
  /** Short display name */
  shortName: string;
  /** 3-letter code used in order / dispatch references */
  code: string;
  /** Free-text address line */
  address: string;
  /** Hotel user login details */
  managerName: string;
  managerInitials: string;
  email: string;
  color: string;
  /** Scale factor used for demo figures */
  scale: number;
  /** Demo food cost % */
  foodCostPct: number;
}

/** The only two active hotel entities in the system. */
export const HOTELS: RestaurantProfile[] = [
  {
    name: 'Stanhill Hotel Limited',
    fullName: 'Stanhill Hotel Limited',
    shortName: 'Stanhill',
    code: 'STH',
    address: 'Stanhill, UK',
    managerName: 'Stanhill Hotel User',
    managerInitials: 'SH',
    email: 'Stanhill@samkokitchens.co.uk',
    color: '#0D9488',
    scale: 1,
    foodCostPct: 29.6,
  },
  {
    name: 'Warren House Hotel Limited',
    fullName: 'Warren House Hotel Limited',
    shortName: 'Warren House',
    code: 'WRH',
    address: 'Warren House, UK',
    managerName: 'Warren House Hotel User',
    managerInitials: 'WH',
    email: 'WarrenHouse@samkokitchens.co.uk',
    color: '#7C3AED',
    scale: 0.82,
    foodCostPct: 31.2,
  },
];

/** Backwards-compatible aliases used across the app. */
export const NEW_RESTAURANTS: RestaurantProfile[] = HOTELS;
export const NEW_RESTAURANT_NAMES: RestaurantName[] = HOTELS.map((h) => h.name);
export const ALL_RESTAURANT_NAMES: RestaurantName[] = NEW_RESTAURANT_NAMES;
export const HOTEL_NAMES: RestaurantName[] = NEW_RESTAURANT_NAMES;

/** Label used for historical records belonging to removed locations. */
export const LEGACY_LABEL = 'Legacy (Archived)';

export function getRestaurantProfile(name: string | null | undefined): RestaurantProfile | undefined {
  return HOTELS.find((r) => r.name === name);
}

export type UserRole =
  | 'Stanhill Hotel User' |'Warren House Hotel User' |'Kitchen Manager' |'Business Owner' |'Finance / Auditor';

export interface SessionUser {
  id: string;
  role: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  /** null = access to both hotels; otherwise locked to a single hotel */
  restaurant: RestaurantName | null;
  /** true for kitchen manager accounts */
  isCentralKitchen?: boolean;
  /** true when the account may not modify data (Finance / Auditor) */
  readOnly?: boolean;
}

/**
 * Account directory. No passwords are stored in the application.
 * Authentication is performed against the identity provider; the entries below only
 * define the profile / hotel mapping applied after a successful sign-in.
 */
export const demoAccounts: SessionUser[] = [
  { id: 'cred-owner', role: 'Business Owner', name: 'Rajesh Kumar', email: 'owner@samkokitchens.co.uk', initials: 'RK', color: '#ED1C24', restaurant: null },
  { id: 'cred-kitchen', role: 'Kitchen Manager', name: 'Priya Sharma', email: 'kitchen@samkokitchens.co.uk', initials: 'PS', color: '#168447', restaurant: null, isCentralKitchen: true },
  { id: 'cred-finance', role: 'Finance / Auditor', name: 'Vikram Nair', email: 'finance@samkokitchens.co.uk', initials: 'VN', color: '#7C3AED', restaurant: null, readOnly: true },
  ...HOTELS.map((h) => ({
    id: `cred-${h.code.toLowerCase()}`,
    role: `${h.shortName} Hotel User`,
    name: h.managerName,
    email: h.email,
    initials: h.managerInitials,
    color: h.color,
    restaurant: h.name,
  })),
];

const STORAGE_KEY = 'madrasops-session';
const HOTEL_KEY = 'madrasops-active-hotel';

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  /** Hotel the user is locked to, or null if they can see both */
  lockedRestaurant: RestaurantName | null;
  /** Hotel currently in view: locked hotel, or selected hotel for multi-hotel roles, or null for both */
  activeScope: RestaurantName | null;
  /** Current filter value for multi-hotel users */
  hotelFilter: HotelFilter;
  setHotelFilter: (f: HotelFilter) => void;
  /** True when the account may only view data */
  readOnly: boolean;
  login: (user: SessionUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  ready: false,
  lockedRestaurant: null,
  activeScope: null,
  hotelFilter: 'both',
  setHotelFilter: () => {},
  readOnly: false,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [hotelFilter, setHotelFilterState] = useState<HotelFilter>('both');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SessionUser;
        const match = demoAccounts.find((a) => a.id === parsed.id);
        if (match) setUser(match);
      }
      const savedHotel = localStorage.getItem(HOTEL_KEY);
      if (savedHotel && (savedHotel === 'both' || NEW_RESTAURANT_NAMES.includes(savedHotel as RestaurantName))) {
        setHotelFilterState(savedHotel as HotelFilter);
      }
    } catch {
      // ignore corrupted session
    }
    setReady(true);
  }, []);

  const login = useCallback((u: SessionUser) => {
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: u.id }));
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

  const setHotelFilter = useCallback((f: HotelFilter) => {
    setHotelFilterState(f);
    try {
      localStorage.setItem(HOTEL_KEY, f);
    } catch {
      // storage unavailable
    }
  }, []);

  const lockedRestaurant = user?.restaurant ?? null;
  const activeScope: RestaurantName | null = lockedRestaurant ?? (hotelFilter === 'both' ? null : hotelFilter);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      lockedRestaurant,
      activeScope,
      hotelFilter,
      setHotelFilter,
      readOnly: !!user?.readOnly,
      login,
      logout,
    }),
    [user, ready, lockedRestaurant, activeScope, hotelFilter, setHotelFilter, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/**
 * Returns the hotel the current view is scoped to (null = both hotels consolidated).
 * Hotel users are always locked to their own hotel; Kitchen Manager, Business Owner
 * and Finance/Auditor follow the hotel filter in the top bar.
 */
export function useScopedRestaurant(): RestaurantName | null {
  const { activeScope } = useAuth();
  return activeScope;
}

/**
 * Normalises any record's location string to an active hotel name.
 * Anything that does not belong to one of the two hotels (historical locations)
 * returns null and is treated as archived legacy data.
 */
export function resolveHotel(value: string | undefined | null): RestaurantName | null {
  const v = (value ?? '').toLowerCase();
  if (!v) return null;
  if (v.includes('stanhill') || v.includes('sth')) return 'Stanhill Hotel Limited';
  if (v.includes('warren') || v.includes('wrh')) return 'Warren House Hotel Limited';
  return null;
}

/**
 * Maps a legacy location key (historical demo data) to one of the two active hotels.
 * Unknown values (e.g. "Central Kitchen") are returned unchanged.
 */
const LEGACY_TO_HOTEL: Record<string, RestaurantName> = {
  Hounslow: 'Stanhill Hotel Limited',
  Leicester: 'Stanhill Hotel Limited',
  Reading: 'Warren House Hotel Limited',
  Dartford: 'Warren House Hotel Limited',
};

export function toHotel(value: string): string {
  return LEGACY_TO_HOTEL[value] ?? value;
}

/** Rewrites legacy location names inside free text to the active hotel names. */
export function rewriteLegacyText(text: string): string {
  return text
    .replace(/Samko (Hounslow|Leicester)/g, 'Stanhill Hotel Limited')
    .replace(/Samko (Reading|Dartford)/g, 'Warren House Hotel Limited')
    .replace(/\b(Hounslow|Leicester)\b/g, 'Stanhill Hotel Limited')
    .replace(/\b(Reading|Dartford)\b/g, 'Warren House Hotel Limited')
    .replace(/SK-HOU-/g, 'SK-STH-')
    .replace(/SK-LEI-/g, 'SK-STH-')
    .replace(/SK-REA-/g, 'SK-WRH-')
    .replace(/SK-DAR-/g, 'SK-WRH-')
    .replace(/MF-HOU-/g, 'SK-STH-')
    .replace(/MF-REA-/g, 'SK-WRH-');
}

/** Recursively applies rewriteLegacyText to every string in a data structure. */
export function rewriteLegacyDeep<T>(input: T): T {
  if (typeof input === 'string') return rewriteLegacyText(input) as unknown as T;
  if (Array.isArray(input)) return input.map((v) => rewriteLegacyDeep(v)) as unknown as T;
  if (input && typeof input === 'object') {
    const out: Record<string, unknown> = {};
    Object.entries(input as Record<string, unknown>).forEach(([k, v]) => {
      out[k] = rewriteLegacyDeep(v);
    });
    return out as T;
  }
  return input;
}

/**
 * Match helper: true if a record belongs to the scope. With no scope (both hotels),
 * only records that belong to one of the two active hotels match — archived legacy
 * location records are never merged into either hotel.
 */
export function matchesScope(scope: RestaurantName | null, value: string | undefined | null): boolean {
  const hotel = resolveHotel(value);
  if (!scope) return hotel !== null;
  return hotel === scope;
}
