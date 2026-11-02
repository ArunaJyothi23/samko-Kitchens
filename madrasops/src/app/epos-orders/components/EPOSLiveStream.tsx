'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, AlertTriangle, XCircle, ShieldCheck, Zap } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const codeByRestaurant: Record<string, string> = {
  ...Object.fromEntries(NEW_RESTAURANTS.map((r) => [r.name, r.code])),
};

const baseStream = [
  { id: 'stream-001', type: 'order', icon: <ShoppingCart size={12} />, title: 'SK-STH-10482 received', detail: 'Chicken Burger × 2, Caesar Salad (Add Chicken) × 1, French Fries × 1 · Stanhill Hotel Limited', sub: 'Webhook wh_evt_001sth', time: '13:17:32', color: 'var(--primary)', bg: '#FEE2E2' },
  { id: 'stream-002', type: 'fefo', icon: <CheckCircle size={12} />, title: 'Recipe consumption calculated', detail: 'Burger + salad recipes; Add Chicken deducts extra chicken only · Stanhill Hotel Limited', sub: 'Approved recipes only', time: '13:17:33', color: '#166534', bg: '#DCFCE7' },
  { id: 'stream-004', type: 'complete', icon: <Zap size={12} />, title: 'SK-STH-10482 complete', detail: 'Consumption recorded against order · Stanhill Hotel Limited', sub: 'Stock ledger updated once (idempotent)', time: '13:17:34', color: '#1E40AF', bg: '#DBEAFE' },
  { id: 'stream-005', type: 'order', icon: <ShoppingCart size={12} />, title: 'SK-STH-10481 received', detail: 'BLT (Brown Bread) × 2, Latte × 2 · Stanhill Hotel Limited', sub: 'Webhook wh_evt_002sth', time: '13:08:14', color: 'var(--primary)', bg: '#FEE2E2' },
  { id: 'stream-007', type: 'alert', icon: <AlertTriangle size={12} />, title: 'Low stock alert triggered', detail: 'Cheddar cheese at Stanhill Hotel Limited: 1.8 kg', sub: 'Below minimum 3 kg', time: '13:08:16', color: '#92400E', bg: '#FEF3C7' },
  { id: 'stream-008', type: 'duplicate', icon: <ShieldCheck size={12} />, title: 'Duplicate blocked: SK-WRH-6100', detail: 'Event wh_evt_010wrh rejected · Warren House Hotel Limited', sub: 'Idempotency key matched', time: '18:44:03', color: '#5B21B6', bg: '#EDE9FE' },
  { id: 'stream-009', type: 'unmapped', icon: <AlertTriangle size={12} />, title: 'Unmapped item: Chilli Paneer', detail: 'SK-STH-10479 · Not on current EPOS menu · Stanhill Hotel Limited', sub: 'Stock NOT deducted — action required', time: '12:28:56', color: '#991B1B', bg: '#FEE2E2' },
  { id: 'stream-010', type: 'cancel', icon: <XCircle size={12} />, title: 'SK-STH-10478 cancelled', detail: 'Stock reversal posted once · Stanhill Hotel Limited', sub: 'No net inventory impact', time: '12:14:23', color: '#6B7280', bg: '#F3F4F6' },
];

const newRestaurantStream = NEW_RESTAURANTS.flatMap((r, i) => [
  { id: `stream-${r.code.toLowerCase()}-1`, type: 'order', icon: <ShoppingCart size={12} />, title: `SK-${r.code}-${5200 + i * 11} received`, detail: `Healthy Flavour Bowl (Add Halloumi) × 1 · ${r.name}`, sub: `Webhook wh_evt_${r.code.toLowerCase()}1`, time: `13:${String(10 + i * 3).padStart(2, '0')}:10`, color: 'var(--primary)', bg: '#FEE2E2' },
]);

const initialStream = [...baseStream, ...newRestaurantStream];

export default function EPOSLiveStream() {
  const scope = useScopedRestaurant();
  const [events, setEvents] = useState(initialStream);
  const [newCount, setNewCount] = useState(0);
  const code = scope ? codeByRestaurant[scope] : null;
  const visibleEvents = scope
    ? events.filter((e) => `${e.title} ${e.detail}`.includes(scope as string) || (code ? `${e.title} ${e.detail}`.includes(`SK-${code}-`) : false))
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