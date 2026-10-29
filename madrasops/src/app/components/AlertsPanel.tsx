'use client';

import React from 'react';
import { AlertTriangle, Clock, Package, Zap } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const baseAlerts = [
  {
    id: 'alert-001',
    restaurant: 'Hounslow',
    type: 'expiry',
    severity: 'critical',
    icon: <Clock size={14} />,
    title: 'Dosa batter expiring',
    detail: 'Batch PB-2024-0108 · Hounslow · Expires 12 Oct',
    time: '12 hrs left',
    color: '#991B1B',
    bg: '#FEE2E2',
  },
  {
    id: 'alert-002',
    restaurant: 'Reading',
    type: 'expiry',
    severity: 'critical',
    icon: <Clock size={14} />,
    title: 'Sambar expiring',
    detail: 'Batch PB-2024-0109 · Reading · Expires 12 Oct',
    time: '14 hrs left',
    color: '#991B1B',
    bg: '#FEE2E2',
  },
  {
    id: 'alert-003',
    restaurant: 'Dartford',
    type: 'expiry',
    severity: 'critical',
    icon: <Clock size={14} />,
    title: 'White chutney expiring',
    detail: 'Batch PB-2024-0105 · Dartford · Expires 12 Oct',
    time: '18 hrs left',
    color: '#991B1B',
    bg: '#FEE2E2',
  },
  {
    id: 'alert-004',
    restaurant: 'Hounslow',
    type: 'low-stock',
    severity: 'warning',
    icon: <Package size={14} />,
    title: 'Dosa batter low stock',
    detail: 'Hounslow · 1.2 kg remaining · Reorder at 3 kg',
    time: 'Est. 2 hrs coverage',
    color: '#92400E',
    bg: '#FEF3C7',
  },
  {
    id: 'alert-005',
    restaurant: 'Leicester',
    type: 'low-stock',
    severity: 'warning',
    icon: <Package size={14} />,
    title: 'Red chutney low stock',
    detail: 'Leicester · 0.3 kg remaining',
    time: 'Est. 3 hrs coverage',
    color: '#92400E',
    bg: '#FEF3C7',
  },
  {
    id: 'alert-006',
    restaurant: 'Hounslow',
    type: 'unmapped',
    severity: 'warning',
    icon: <Zap size={14} />,
    title: 'Unmapped: Chilli Paneer',
    detail: 'Hounslow · 14 orders today · No recipe active',
    time: 'Stock not deducted',
    color: '#92400E',
    bg: '#FEF3C7',
  },
  {
    id: 'alert-007',
    restaurant: 'Reading',
    type: 'discrepancy',
    severity: 'warning',
    icon: <AlertTriangle size={14} />,
    title: 'GRN #GRN-0089 discrepancy',
    detail: 'Reading · Idly batter 2 kg short',
    time: 'Pending manager approval',
    color: '#92400E',
    bg: '#FEF3C7',
  },
];

const newRestaurantAlerts = NEW_RESTAURANTS.flatMap((r, i) => [
  {
    id: `alert-${r.code.toLowerCase()}-1`,
    restaurant: r.name as string,
    type: 'expiry',
    severity: 'critical',
    icon: <Clock size={14} />,
    title: i % 2 === 0 ? 'Dosa batter expiring' : 'Sambar expiring',
    detail: `Batch PB-2024-01${20 + i} · ${r.name} · Expires 12 Oct`,
    time: `${10 + i} hrs left`,
    color: '#991B1B',
    bg: '#FEE2E2',
  },
  {
    id: `alert-${r.code.toLowerCase()}-2`,
    restaurant: r.name as string,
    type: 'low-stock',
    severity: 'warning',
    icon: <Package size={14} />,
    title: i % 2 === 0 ? 'Red chutney low stock' : 'Idly batter low stock',
    detail: `${r.name} · ${(0.3 + i * 0.1).toFixed(1)} kg remaining`,
    time: 'Est. 3 hrs coverage',
    color: '#92400E',
    bg: '#FEF3C7',
  },
]);

const alerts = [...baseAlerts, ...newRestaurantAlerts];

export default function AlertsPanel() {
  const scope = useScopedRestaurant();
  const visibleAlerts = scope ? alerts?.filter((a) => a?.restaurant === scope) : alerts;
  return (
    <div className="card-elevated h-full" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header">Active Alerts</h2>
        <span
          className="rounded-full px-2.5 py-0.5 font-bold text-white"
          style={{ fontSize: 11, background: 'var(--primary)' }}
        >
          {visibleAlerts?.length}
        </span>
      </div>
      <div className="space-y-2">
        {visibleAlerts?.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', padding: '12px 4px' }}>
            No active alerts for this restaurant.
          </p>
        )}
        {visibleAlerts?.map((alert) => (
          <div
            key={alert?.id}
            className="rounded-lg p-3 flex items-start gap-3 cursor-pointer transition-opacity hover:opacity-80"
            style={{ background: alert?.bg }}
          >
            <div
              className="shrink-0 rounded-md flex items-center justify-center mt-0.5"
              style={{ width: 26, height: 26, background: alert?.color, color: '#fff' }}
            >
              {alert?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate" style={{ fontSize: 12.5, color: 'var(--foreground)' }}>
                {alert?.title}
              </p>
              <p className="truncate" style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                {alert?.detail}
              </p>
              <p className="font-semibold" style={{ fontSize: 11, color: alert?.color, marginTop: 2 }}>
                {alert?.time}
              </p>
            </div>
          </div>
        ))}
      </div>
      <button
        className="w-full mt-4 text-center py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted"
        style={{ fontSize: 12.5, color: 'var(--primary)', border: '1px solid var(--border)' }}
      >
        View all alerts →
      </button>
    </div>
  );
}