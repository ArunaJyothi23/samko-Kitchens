'use client';

import React, { useState } from 'react';
import { Search, Bell, ChevronDown, MapPin, RefreshCw, Lock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth, NEW_RESTAURANTS } from '@/contexts/AuthContext';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

const locations = [
  { id: 'loc-all', label: 'All Locations' },
  { id: 'loc-central', label: 'Central Kitchen' },
  { id: 'loc-hounslow', label: 'Hounslow' },
  { id: 'loc-reading', label: 'Reading' },
  { id: 'loc-dartford', label: 'Dartford' },
  { id: 'loc-leicester', label: 'Leicester' },
  ...NEW_RESTAURANTS.map((r) => ({ id: `loc-${r.code.toLowerCase()}`, label: r.name as string })),
];

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const router = useRouter();
  const { user, lockedRestaurant, logout } = useAuth();
  const [selectedLocation, setSelectedLocation] = useState('loc-all');
  const [locationOpen, setLocationOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const selectedLabel = lockedRestaurant
    ? (NEW_RESTAURANTS.some((r) => r.name === lockedRestaurant) ? lockedRestaurant : `Samko ${lockedRestaurant}`)
    : locations.find((l) => l.id === selectedLocation)?.label ?? 'All Locations';

  const handleLogout = () => {
    logout();
    router.push('/sign-up-login-screen');
  };

  const notifications = [
    { id: 'notif-001', type: 'alert', message: '3 batches expiring within 24 hours', time: '2m ago' },
    { id: 'notif-002', type: 'warning', message: 'Dosa batter stock low at Hounslow (1.2 kg)', time: '8m ago' },
    { id: 'notif-003', type: 'info', message: 'Dispatch #DSP-0041 delivered to Reading', time: '15m ago' },
    { id: 'notif-004', type: 'alert', message: 'GRN #GRN-0089 has a quantity discrepancy', time: '23m ago' },
    { id: 'notif-005', type: 'info', message: 'Production batch #PB-2024-0112 completed', time: '41m ago' },
  ];

  const notifTypeColor = (type: string) => {
    if (type === 'alert') return 'bg-red-500';
    if (type === 'warning') return 'bg-amber-400';
    return 'bg-blue-500';
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex items-center border-b"
      style={{
        left: sidebarCollapsed ? 64 : 240,
        height: 60,
        backgroundColor: 'var(--topbar-bg)',
        borderColor: 'var(--topbar-border)',
        paddingLeft: 20,
        paddingRight: 20,
        transition: 'left 300ms ease',
      }}
    >
      {/* Location Selector */}
      <div className="relative">
        {lockedRestaurant ? (
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', fontSize: 13, background: 'var(--muted)' }}
            title="Your account is limited to this restaurant"
          >
            <MapPin size={14} style={{ color: 'var(--primary)' }} />
            <span>{selectedLabel}</span>
            <Lock size={12} style={{ color: 'var(--muted-foreground)' }} />
          </div>
        ) : (
          <button
            onClick={() => { setLocationOpen(!locationOpen); setNotifOpen(false); setUserOpen(false); }}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)', fontSize: 13 }}
          >
            <MapPin size={14} style={{ color: 'var(--primary)' }} />
            <span>{selectedLabel}</span>
            <ChevronDown size={13} style={{ color: 'var(--muted-foreground)' }} />
          </button>
        )}
        {locationOpen && !lockedRestaurant && (
          <div
            className="absolute top-full left-0 mt-1 rounded-lg border shadow-lg z-50 animate-fade-in"
            style={{
              background: 'var(--card)',
              borderColor: 'var(--border)',
              minWidth: 180,
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
          >
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => { setSelectedLocation(loc.id); setLocationOpen(false); }}
                className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                style={{
                  fontSize: 13,
                  color: selectedLocation === loc.id ? 'var(--primary)' : 'var(--foreground)',
                  fontWeight: selectedLocation === loc.id ? 600 : 400,
                }}
              >
                {loc.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted-foreground)' }}
          />
          <input
            type="text"
            placeholder="Search batches, orders, ingredients… (⌘K)"
            className="w-full rounded-lg border py-2 pl-9 pr-4 text-sm"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--muted)',
              color: 'var(--foreground)',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Date */}
        <div
          className="hidden md:flex items-center gap-1 text-sm rounded-lg border px-3 py-2"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', fontSize: 12 }}
        >
          <RefreshCw size={12} />
          <span>11 Oct 2026 · 06:18</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setLocationOpen(false); setUserOpen(false); }}
            className="relative p-2 rounded-lg transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell size={18} style={{ color: 'var(--foreground)' }} />
            <span
              className="absolute top-1 right-1 rounded-full bg-primary text-white font-bold"
              style={{ width: 14, height: 14, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              4
            </span>
          </button>
          {notifOpen && (
            <div
              className="absolute top-full right-0 mt-1 rounded-lg border shadow-lg z-50 animate-fade-in"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--border)',
                width: 320,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="font-semibold" style={{ fontSize: 13 }}>Notifications</span>
                <span
                  className="text-xs font-medium cursor-pointer"
                  style={{ color: 'var(--primary)', fontSize: 12 }}
                >
                  Mark all read
                </span>
              </div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-muted cursor-pointer"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div
                    className={`mt-1 rounded-full shrink-0 ${notifTypeColor(n.type)}`}
                    style={{ width: 7, height: 7 }}
                  />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 12.5, color: 'var(--foreground)', lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{n.time}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5">
                <span className="text-xs font-medium cursor-pointer" style={{ color: 'var(--primary)', fontSize: 12 }}>
                  View all notifications →
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => { setUserOpen(!userOpen); setLocationOpen(false); setNotifOpen(false); }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted"
          >
            <div
              className="rounded-full flex items-center justify-center font-bold text-white"
              style={{ width: 30, height: 30, background: user?.color ?? 'var(--primary)', fontSize: 12 }}
            >
              {user?.initials ?? 'RK'}
            </div>
            <div className="hidden md:block text-left">
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--foreground)', lineHeight: 1.2 }}>
                {user?.name ?? 'Ravi Kumar'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                {user ? (lockedRestaurant ? `${user.role} · ${lockedRestaurant}` : user.role) : 'Kitchen Manager'}
              </div>
            </div>
            <ChevronDown size={13} style={{ color: 'var(--muted-foreground)' }} />
          </button>
          {userOpen && (
            <div
              className="absolute top-full right-0 mt-1 rounded-lg border shadow-lg z-50 animate-fade-in"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', minWidth: 200, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
            >
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{user?.name ?? 'Guest'}</div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{user?.email}</div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted"
                style={{ fontSize: 13, color: '#991B1B' }}
              >
                <LogOut size={14} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click outside */}
      {(locationOpen || notifOpen || userOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setLocationOpen(false); setNotifOpen(false); setUserOpen(false); }}
        />
      )}
    </header>
  );
}