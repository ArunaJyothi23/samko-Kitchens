'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, AlertTriangle, XCircle, ShieldCheck, Zap } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const codeByRestaurant: Record<string, string> = {
  Hounslow: 'HOU',
  Reading: 'REA',
  Dartford: 'DAR',
  Leicester: 'LEI',
  ...Object.fromEntries(NEW_RESTAURANTS.map((r) => [r.name, r.code])),
};

const baseStream = [
  { id: 'stream-001', type: 'order', icon: <ShoppingCart size={12} />, title: 'MF-HOU-10482 received', detail: 'Masala Dosa × 1', sub: 'Webhook wh_evt_a1b2c3d4', time: '06:17:32', color: 'var(--primary)', bg: '#FEE2E2' },
  { id: 'stream-002', type: 'fefo', icon: <CheckCircle size={12} />, title: 'FEFO allocation: Dosa Batter', detail: '100g from PB-2024-0111 (exp 13/10)', sub: 'Earliest eligible batch', time: '06:17:33', color: '#166534', bg: '#DCFCE7' },
  { id: 'stream-003', type: 'fefo', icon: <CheckCircle size={12} />, title: 'FEFO allocation: Red Chutney', detail: '10g from PB-2024-0109 (exp 12/10)', sub: 'Earliest eligible batch', time: '06:17:33', color: '#166534', bg: '#DCFCE7' },
  { id: 'stream-004', type: 'complete', icon: <Zap size={12} />, title: 'MF-HOU-10482 complete', detail: 'Total cost: £0.381 · Food cost: 4.77%', sub: 'Stock ledger updated', time: '06:17:34', color: '#1E40AF', bg: '#DBEAFE' },
  { id: 'stream-005', type: 'order', icon: <ShoppingCart size={12} />, title: 'MF-HOU-10481 received', detail: 'Plain Dosa × 2', sub: 'Webhook wh_evt_b2c3d4e5', time: '06:08:14', color: 'var(--primary)', bg: '#FEE2E2' },
  { id: 'stream-006', type: 'fefo', icon: <CheckCircle size={12} />, title: 'FEFO allocation: Dosa Batter', detail: '240g from PB-2024-0111 (exp 13/10)', sub: '2 portions allocated', time: '06:08:15', color: '#166534', bg: '#DCFCE7' },
  { id: 'stream-007', type: 'alert', icon: <AlertTriangle size={12} />, title: 'Low stock alert triggered', detail: 'Dosa Batter at Hounslow: 1.2 kg', sub: 'Below reorder point 3 kg', time: '06:08:16', color: '#92400E', bg: '#FEF3C7' },
  { id: 'stream-008', type: 'duplicate', icon: <ShieldCheck size={12} />, title: 'Duplicate blocked: MF-DAR-6100', detail: 'Event wh_evt_j0k1l2m3 rejected', sub: 'Idempotency key matched', time: '04:44:03', color: '#5B21B6', bg: '#EDE9FE' },
  { id: 'stream-009', type: 'unmapped', icon: <AlertTriangle size={12} />, title: 'Unmapped item: Chilli Paneer', detail: 'MF-HOU-10479 · No active recipe', sub: 'Stock NOT deducted — action required', time: '05:28:56', color: '#991B1B', bg: '#FEE2E2' },
  { id: 'stream-010', type: 'cancel', icon: <XCircle size={12} />, title: 'MF-HOU-10478 cancelled', detail: 'Stock reversal posted', sub: 'No net inventory impact', time: '05:14:23', color: '#6B7280', bg: '#F3F4F6' },
];

const newRestaurantStream = NEW_RESTAURANTS.flatMap((r, i) => [
  { id: `stream-${r.code.toLowerCase()}-1`, type: 'order', icon: <ShoppingCart size={12} />, title: `MF-${r.code}-${5200 + i * 11} received`, detail: `Masala Dosa × 1 · ${r.name}`, sub: `Webhook wh_evt_${r.code.toLowerCase()}1`, time: `06:${String(10 + i * 3).padStart(2, '0')}:10`, color: 'var(--primary)', bg: '#FEE2E2' },
  { id: `stream-${r.code.toLowerCase()}-2`, type: 'fefo', icon: <CheckCircle size={12} />, title: 'FEFO allocation: Dosa Batter', detail: `100g from PB-2024-0111 · MF-${r.code}-${5200 + i * 11}`, sub: 'Earliest eligible batch', time: `06:${String(10 + i * 3).padStart(2, '0')}:11`, color: '#166534', bg: '#DCFCE7' },
]);

const initialStream = [...baseStream, ...newRestaurantStream];

export default function EPOSLiveStream() {
  const scope = useScopedRestaurant();
  const [events, setEvents] = useState(initialStream);
  const [newCount, setNewCount] = useState(0);
  const code = scope ? codeByRestaurant[scope] : null;
  const visibleEvents = code
    ? events.filter((e) => `${e.title} ${e.detail}`.includes(`MF-${code}-`) || e.detail.includes(scope as string))
    : events;

  useEffect(() => {
    // Backend integration point: replace with WebSocket/SSE subscription to real-time EPOS events
    const interval = setInterval(() => {
      setNewCount((c) => c + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-elevated flex flex-col" style={{ height: 'fit-content', maxHeight: 680 }}>
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
            EPOS Event Stream
          </span>
          <span className="live-pulse" />
        </div>
        <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
          {visibleEvents?.length} events today
        </span>
      </div>

      <div className="overflow-y-auto flex-1 p-3 space-y-2">
        {visibleEvents?.map((evt) => (
          <div
            key={evt?.id}
            className="rounded-lg p-2.5 animate-fade-in"
            style={{ background: evt?.bg }}
          >
            <div className="flex items-start gap-2">
              <div
                className="shrink-0 rounded flex items-center justify-center mt-0.5"
                style={{ width: 20, height: 20, background: evt?.color, color: '#fff' }}
              >
                {evt?.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ fontSize: 11.5, color: 'var(--foreground)', lineHeight: 1.3 }}>
                  {evt?.title}
                </p>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>
                  {evt?.detail}
                </p>
                <p style={{ fontSize: 10.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                  {evt?.sub}
                </p>
              </div>
              <span className="shrink-0" style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>
                {evt?.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        className="px-4 py-3 border-t shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            FEFO allocation active · Duplicate detection on
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-semibold"
            style={{ fontSize: 10.5, background: '#DCFCE7', color: '#166534' }}
          >
            Healthy
          </span>
        </div>
      </div>
    </div>
  );
}