'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingCart, FlaskConical, Truck, AlertTriangle, Package } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS, toHotel, rewriteLegacyText } from '@/contexts/AuthContext';

const baseEvents = [
  {
    id: 'evt-001',
    restaurant: 'Hounslow',
    type: 'epos',
    icon: <ShoppingCart size={13} />,
    title: 'Order #SK-HOU-10482',
    detail: 'Chicken Burger × 2, Caesar Salad (Add Chicken) · Hounslow',
    sub: 'Consumption posted from approved recipes',
    time: '06:17',
    color: 'var(--primary)',
    bg: '#FEE2E2',
  },
  {
    id: 'evt-002',
    restaurant: 'Central Kitchen',
    type: 'production',
    icon: <FlaskConical size={13} />,
    title: 'Batch PB-2024-0112 completed',
    detail: 'Tomato basil soup base · 48.4 kg · Yield 96.8%',
    sub: 'Central Kitchen',
    time: '06:14',
    color: '#1E40AF',
    bg: '#DBEAFE',
  },
  {
    id: 'evt-003',
    restaurant: 'Reading',
    type: 'dispatch',
    icon: <Truck size={13} />,
    title: 'Dispatch #DSP-0041 delivered',
    detail: 'Reading · 5 items · £182.40',
    sub: 'Accepted in full · GRN raised',
    time: '06:09',
    color: '#166534',
    bg: '#DCFCE7',
  },
  {
    id: 'evt-004',
    restaurant: 'Hounslow',
    type: 'epos',
    icon: <ShoppingCart size={13} />,
    title: 'Order #SK-HOU-10481',
    detail: 'BLT (Brown Bread) × 2, Latte × 2 · Hounslow',
    sub: 'Brown bread, bacon, coffee beans deducted',
    time: '06:08',
    color: 'var(--primary)',
    bg: '#FEE2E2',
  },
  {
    id: 'evt-005',
    restaurant: 'Hounslow',
    type: 'alert',
    icon: <AlertTriangle size={13} />,
    title: 'Low stock alert',
    detail: 'Cheddar cheese · Hounslow · 1.8 kg',
    sub: 'Below minimum stock (3 kg)',
    time: '06:05',
    color: '#92400E',
    bg: '#FEF3C7',
  },
  {
    id: 'evt-006',
    restaurant: 'Reading',
    type: 'epos',
    icon: <ShoppingCart size={13} />,
    title: 'Order #SK-REA-8821',
    detail: 'Pepperoni Pizza (Add Chicken), Pasta Carbonara · Reading',
    sub: 'Pizza base, pepperoni, extra chicken, linguine deducted',
    time: '06:02',
    color: 'var(--primary)',
    bg: '#FEE2E2',
  },
  {
    id: 'evt-007',
    restaurant: 'Dartford',
    type: 'stock',
    icon: <Package size={13} />,
    title: 'Wastage recorded',
    detail: 'Cos lettuce 0.5 kg · Dartford',
    sub: 'Reason: Expired stock · Approved',
    time: '05:58',
    color: '#5B21B6',
    bg: '#EDE9FE',
  },
  {
    id: 'evt-008',
    restaurant: 'Dartford',
    type: 'epos',
    icon: <ShoppingCart size={13} />,
    title: 'Order #SK-DAR-6102',
    detail: 'Ribeye Steak, Chunky Chips · Dartford',
    sub: 'Beef steak, potatoes, cooking oil deducted',
    time: '05:54',
    color: 'var(--primary)',
    bg: '#FEE2E2',
  },
];

const newRestaurantEvents = NEW_RESTAURANTS.flatMap((r, i) => [
  {
    id: `evt-${r.code.toLowerCase()}-1`,
    restaurant: r.name as string,
    type: 'epos',
    icon: <ShoppingCart size={13} />,
    title: `Order #SK-${r.code}-${4100 + i * 37}`,
    detail: `Caesar Salad × ${1 + (i % 3)} · ${r.name}`,
    sub: 'Cos lettuce, parmesan, croûtes deducted',
    time: `06:${String(10 + i).padStart(2, '0')}`,
    color: 'var(--primary)',
    bg: '#FEE2E2',
  },
  {
    id: `evt-${r.code.toLowerCase()}-2`,
    restaurant: r.name as string,
    type: 'dispatch',
    icon: <Truck size={13} />,
    title: `Dispatch delivered to ${r.name}`,
    detail: `${r.name} · 4 items · £${(96 + i * 11).toFixed(2)}`,
    sub: 'Accepted in full · GRN raised',
    time: `05:${String(40 + i).padStart(2, '0')}`,
    color: '#166534',
    bg: '#DCFCE7',
  },
]);

const initialEvents = [...baseEvents, ...newRestaurantEvents].map((e) => ({
  ...e,
  restaurant: e.restaurant === 'Central Kitchen' ? 'Kitchen (Both Hotels)' : toHotel(e.restaurant),
  title: rewriteLegacyText(e.title),
  detail: rewriteLegacyText(e.detail),
  sub: e.sub === 'Central Kitchen' ? 'Kitchen' : e.sub,
}));

export default function LiveActivityFeed() {
  const scope = useScopedRestaurant();
  const [events, setEvents] = useState(initialEvents);
  const [count, setCount] = useState(0);
  const visibleEvents = scope ? events?.filter((e) => e?.restaurant === scope) : events;

  useEffect(() => {
    // Backend integration point: replace with WebSocket/SSE subscription to real-time order events
    const interval = setInterval(() => {
      setCount((c) => c + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="card-elevated" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="section-header">Live Activity</h2>
          <span className="live-pulse" />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Real-time</span>
      </div>
      <div className="space-y-2 overflow-y-auto" style={{ maxHeight: 380 }}>
        {visibleEvents?.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', padding: '12px 4px' }}>
            No recent activity for this restaurant.
          </p>
        )}
        {visibleEvents?.map((evt) => (
          <div
            key={evt?.id}
            className="flex items-start gap-2.5 rounded-lg p-2.5 animate-fade-in"
            style={{ background: evt?.bg }}
          >
            <div
              className="shrink-0 rounded-md flex items-center justify-center mt-0.5"
              style={{ width: 24, height: 24, background: evt?.color, color: '#fff' }}
            >
              {evt?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ fontSize: 12, color: 'var(--foreground)' }}>
                {evt?.title}
              </p>
              <p className="truncate" style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1 }}>
                {evt?.detail}
              </p>
              <p className="truncate" style={{ fontSize: 10.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                {evt?.sub}
              </p>
            </div>
            <span className="shrink-0" style={{ fontSize: 10.5, color: 'var(--muted-foreground)' }}>
              {evt?.time}
            </span>
          </div>
        ))}
      </div>
      <button
        className="w-full mt-3 text-center py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted"
        style={{ fontSize: 12.5, color: 'var(--primary)', border: '1px solid var(--border)' }}
      >
        View full activity log →
      </button>
    </div>
  );
}