'use client';

import React from 'react';
import StatusBadge from '@/components/ui/StatusBadge';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const hotelRows = NEW_RESTAURANTS.map((r) => ({
  id: `rest-${r.code.toLowerCase()}`,
  name: r.name as string,
  todaySales: `£${Math.round(1248 * r.scale).toLocaleString('en-GB')}`,
  salesNum: 1248 * r.scale,
  foodCostPct: r.foodCostPct,
  grossMargin: `${(100 - r.foodCostPct).toFixed(1)}%`,
  stockVal: `£${Math.round(1842 * r.scale).toLocaleString('en-GB')}`,
  stockNum: 1842 * r.scale,
  wastage: `£${(34.2 * r.scale).toFixed(2)}`,
  wastageNum: 34.2 * r.scale,
  nearExpiry: 3,
  unmapped: 5,
  status: (r.foodCostPct > 31 ? 'alert' : 'completed') as 'alert' | 'completed',
  closingStatus: 'Open',
}));

const totalSales = hotelRows.reduce((s, r) => s + r.salesNum, 0);
const totalStock = hotelRows.reduce((s, r) => s + r.stockNum, 0);
const totalWastage = hotelRows.reduce((s, r) => s + r.wastageNum, 0);
const weightedFoodCost = hotelRows.reduce((s, r) => s + r.foodCostPct * r.salesNum, 0) / totalSales;

const combinedRow = {
  id: 'rest-combined',
  name: 'Combined (Both Hotels)',
  todaySales: `£${Math.round(totalSales).toLocaleString('en-GB')}`,
  foodCostPct: Number(weightedFoodCost.toFixed(1)),
  grossMargin: `${(100 - weightedFoodCost).toFixed(1)}%`,
  stockVal: `£${Math.round(totalStock).toLocaleString('en-GB')}`,
  wastage: `£${totalWastage.toFixed(2)}`,
  nearExpiry: hotelRows.reduce((s, r) => s + r.nearExpiry, 0),
  unmapped: hotelRows.reduce((s, r) => s + r.unmapped, 0),
  status: (weightedFoodCost > 31 ? 'alert' : 'completed') as 'alert' | 'completed',
  closingStatus: 'Open',
};

export default function RestaurantComparisonTable() {
  const scope = useScopedRestaurant();
  const rows = scope ? hotelRows.filter((r) => r.name === scope) : [...hotelRows, combinedRow];
  return (
    <div className="card-elevated" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-header">{scope ? `${scope} Performance` : 'Hotel Comparison'}</h2>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Today · 11 Oct 2026</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr>
              {[
                'Hotel',
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
                style={{
                  borderBottom: idx < rows.length - 1 ? '1px solid var(--border)' : 'none',
                  background: r.id === 'rest-combined' ? 'var(--muted)' : undefined,
                }}
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
                <td className="py-3 pr-4 tabular-nums" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                  {r.wastage}
                </td>
                <td className="py-3 pr-4 tabular-nums" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                  {r.nearExpiry}
                </td>
                <td className="py-3 pr-4 tabular-nums" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                  {r.unmapped}
                </td>
                <td className="py-3">
                  <StatusBadge variant={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}