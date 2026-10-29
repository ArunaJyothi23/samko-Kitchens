'use client';

import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const baseRestaurants = [
  {
    id: 'rest-hounslow',
    name: 'Hounslow',
    todaySales: '£1,248',
    foodCostPct: 31.4,
    grossMargin: '68.6%',
    stockVal: '£1,842',
    wastage: '£34.20',
    nearExpiry: 3,
    unmapped: 5,
    status: 'alert' as const,
    closingStatus: 'Open',
  },
  {
    id: 'rest-reading',
    name: 'Reading',
    todaySales: '£892',
    foodCostPct: 29.8,
    grossMargin: '70.2%',
    stockVal: '£1,104',
    wastage: '£21.80',
    nearExpiry: 2,
    unmapped: 3,
    status: 'completed' as const,
    closingStatus: 'Open',
  },
  {
    id: 'rest-dartford',
    name: 'Dartford',
    todaySales: '£648',
    foodCostPct: 33.2,
    grossMargin: '66.8%',
    stockVal: '£982',
    wastage: '£18.40',
    nearExpiry: 1,
    unmapped: 2,
    status: 'alert' as const,
    closingStatus: 'Open',
  },
  {
    id: 'rest-leicester',
    name: 'Leicester',
    todaySales: '£460',
    foodCostPct: 30.1,
    grossMargin: '69.9%',
    stockVal: '£893',
    wastage: '£13.00',
    nearExpiry: 1,
    unmapped: 2,
    status: 'completed' as const,
    closingStatus: 'Open',
  },
];

const restaurants = [
  ...baseRestaurants,
  ...NEW_RESTAURANTS.map((r) => ({
    id: `rest-${r.code.toLowerCase()}`,
    name: r.name as string,
    todaySales: `£${Math.round(1248 * r.scale).toLocaleString('en-GB')}`,
    foodCostPct: r.foodCostPct,
    grossMargin: `${(100 - r.foodCostPct).toFixed(1)}%`,
    stockVal: `£${Math.round(1842 * r.scale).toLocaleString('en-GB')}`,
    wastage: `£${(34.2 * r.scale).toFixed(2)}`,
    nearExpiry: 2,
    unmapped: 3,
    status: (r.foodCostPct > 31 ? 'alert' : 'completed') as 'alert' | 'completed',
    closingStatus: 'Open',
  })),
];

export default function RestaurantComparisonTable() {
  const scope = useScopedRestaurant();
  const rows = scope ? restaurants.filter((r) => r.name === scope) : restaurants;
  return (
    <div className="card-elevated" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header">{scope ? `${scope} Performance` : 'Restaurant Comparison'}</h2>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Today · 11 Oct 2026</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {[
                'Location',
                "Today's Sales",
                'Food Cost %',
                'Gross Margin',
                'Stock Value',
                'Wastage',
                'Near Expiry',
                'Unmapped',
                'Status',
              ].map((h) => (
                <th
                  key={`rct-header-${h}`}
                  className="text-left label-text pb-3"
                  style={{ fontSize: 11, paddingRight: 16, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr
                key={r.id}
                className="table-row-hover"
                style={{ borderBottom: idx < rows.length - 1 ? '1px solid var(--border)' : 'none' }}
              >
                <td className="py-3 pr-4">
                  <span className="font-semibold" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                    {r.name}
                  </span>
                </td>
                <td className="py-3 pr-4 tabular-nums" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--foreground)' }}>
                  {r.todaySales}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className="font-bold tabular-nums"
                    style={{
                      fontSize: 13.5,
                      color: r.foodCostPct > 31 ? '#991B1B' : r.foodCostPct > 30 ? '#92400E' : '#166534',
                    }}
                  >
                    {r.foodCostPct}%
                  </span>
                </td>
                <td className="py-3 pr-4 tabular-nums" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                  {r.grossMargin}
                </td>
                <td className="py-3 pr-4 tabular-nums" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                  {r.stockVal}
                </td>
                <td className="py-3 pr-4 tabular-nums" style={{ fontSize: 13.5, color: '#991B1B', fontWeight: 500 }}>
                  {r.wastage}
                </td>
                <td className="py-3 pr-4">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: r.nearExpiry > 2 ? '#FEE2E2' : '#FEF3C7',
                      color: r.nearExpiry > 2 ? '#991B1B' : '#92400E',
                      fontSize: 11,
                    }}
                  >
                    {r.nearExpiry} batches
                  </span>
                </td>
                <td className="py-3 pr-4">
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: r.unmapped > 3 ? '#FEE2E2' : '#FEF3C7',
                      color: r.unmapped > 3 ? '#991B1B' : '#92400E',
                      fontSize: 11,
                    }}
                  >
                    {r.unmapped} items
                  </span>
                </td>
                <td className="py-3">
                  <StatusBadge
                    variant={r.foodCostPct > 31 ? 'alert' : 'completed'}
                    label={r.foodCostPct > 31 ? 'Above Target' : 'On Target'}
                    dot
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}