'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const baseRestaurantData = [
  { restaurant: 'Hounslow', totalSales: 4820.50, ingredientCost: 1205.12, grossProfit: 3615.38, grossMarginPct: 75.0, foodCostPct: 25.0, wastage: 42.50, orders: 312 },
  { restaurant: 'Reading', totalSales: 3640.20, ingredientCost: 1001.05, grossProfit: 2639.15, grossMarginPct: 72.5, foodCostPct: 27.5, wastage: 38.20, orders: 241 },
  { restaurant: 'Dartford', totalSales: 2980.75, ingredientCost: 864.42, grossProfit: 2116.33, grossMarginPct: 71.0, foodCostPct: 29.0, wastage: 55.10, orders: 198 },
  { restaurant: 'Leicester', totalSales: 3210.00, ingredientCost: 899.80, grossProfit: 2310.20, grossMarginPct: 72.0, foodCostPct: 28.0, wastage: 31.60, orders: 215 },
];

const newRestaurantData = NEW_RESTAURANTS.map((r) => {
  const totalSales = Number((4820.5 * r.scale).toFixed(2));
  const ingredientCost = Number((totalSales * (r.foodCostPct / 100)).toFixed(2));
  return {
    restaurant: r.name as string,
    totalSales,
    ingredientCost,
    grossProfit: Number((totalSales - ingredientCost).toFixed(2)),
    grossMarginPct: Number((100 - r.foodCostPct).toFixed(1)),
    foodCostPct: r.foodCostPct,
    wastage: Number((42.5 * r.scale).toFixed(2)),
    orders: Math.round(312 * r.scale),
  };
});

const allRestaurantData = [...baseRestaurantData, ...newRestaurantData];

const baseTrendData = [
  { week: 'W38', Hounslow: 74.2, Reading: 71.8, Dartford: 70.5, Leicester: 71.2 },
  { week: 'W39', Hounslow: 75.1, Reading: 72.0, Dartford: 70.8, Leicester: 71.8 },
  { week: 'W40', Hounslow: 74.8, Reading: 71.5, Dartford: 71.2, Leicester: 72.1 },
  { week: 'W41', Hounslow: 75.0, Reading: 72.5, Dartford: 71.0, Leicester: 72.0 },
];

const trendData: Record<string, string | number>[] = baseTrendData.map((row, i) => {
  const out: Record<string, string | number> = { ...row };
  NEW_RESTAURANTS.forEach((r, idx) => {
    const wobble = (((i * 3 + idx * 2) % 5) - 2) * 0.3;
    out[r.name] = Number((100 - r.foodCostPct + wobble).toFixed(1));
  });
  return out;
});

const topItems = [
  { item: 'Masala Dosa', sales: 383.52, cost: 20.16, margin: 94.7, qty: 48 },
  { item: 'Idly', sales: 294.50, cost: 19.84, margin: 93.3, qty: 62 },
  { item: 'Paneer Butter Masala', sales: 294.50, cost: 44.02, margin: 85.1, qty: 31 },
  { item: 'Plain Dosa', sales: 244.65, cost: 13.30, margin: 94.6, qty: 35 },
  { item: 'Vegetable Biryani', sales: 175.78, cost: 18.04, margin: 89.7, qty: 22 },
];

const COLORS: Record<string, string> = {
  Hounslow: '#ED1C24',
  Reading: '#F9B233',
  Dartford: '#168447',
  Leicester: '#6366F1',
  ...Object.fromEntries(NEW_RESTAURANTS.map((r) => [r.name, r.color])),
};

export default function ProfitabilityPage() {
  const scope = useScopedRestaurant();
  const restaurantData = scope ? allRestaurantData.filter((r) => r.restaurant === scope) : allRestaurantData;
  const colorEntries = Object.entries(COLORS).filter(([key]) => !scope || key === scope);
  const [period, setPeriod] = useState('This Week');

  const totalSales = restaurantData.reduce((s, r) => s + r.totalSales, 0);
  const totalCost = restaurantData.reduce((s, r) => s + r.ingredientCost, 0);
  const totalProfit = restaurantData.reduce((s, r) => s + r.grossProfit, 0);
  const avgMargin = (totalProfit / totalSales * 100).toFixed(1);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Profitability</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {scope ? `Gross margin, food cost % and contribution at ${NEW_RESTAURANTS.some((r) => r.name === scope) ? scope : `Samko ${scope}`}` : 'Gross margin, food cost % and contribution across all locations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-field" style={{ width: 140 }} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {['Today', 'This Week', 'This Month', 'Last Month'].map(p => <option key={p}>{p}</option>)}
          </select>
          <button className="btn-secondary" style={{ padding: '8px 12px' }}><Download size={14} /> Export</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Total Sales</p>
          <p className="metric-value" style={{ color: '#166534' }}>£{totalSales.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Ingredient Cost</p>
          <p className="metric-value" style={{ color: '#991B1B' }}>£{totalCost.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Gross Profit</p>
          <p className="metric-value" style={{ color: '#166534' }}>£{totalProfit.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Avg Gross Margin</p>
          <p className="metric-value" style={{ color: '#166534' }}>{avgMargin}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Restaurant Comparison Bar Chart */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Sales vs Ingredient Cost by Location</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={restaurantData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="restaurant" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => `£${v.toFixed(2)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="totalSales" name="Total Sales" fill="#168447" radius={[3, 3, 0, 0]} />
              <Bar dataKey="ingredientCost" name="Ingredient Cost" fill="#ED1C24" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Margin Trend */}
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Gross Margin % Trend by Location</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trendData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[65, 80]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {colorEntries.map(([key, color]) => (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Restaurant Table */}
      <div className="card p-0 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Restaurant Profitability Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Orders</th>
                <th>Total Sales</th>
                <th>Ingredient Cost</th>
                <th>Gross Profit</th>
                <th>Gross Margin %</th>
                <th>Food Cost %</th>
                <th>Wastage</th>
              </tr>
            </thead>
            <tbody>
              {restaurantData.map((r) => (
                <tr key={r.restaurant}>
                  <td style={{ fontWeight: 600, fontSize: 13 }}>{r.restaurant}</td>
                  <td style={{ fontSize: 12 }}>{r.orders}</td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>£{r.totalSales.toFixed(2)}</td>
                  <td style={{ fontSize: 12, color: '#991B1B' }}>£{r.ingredientCost.toFixed(2)}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>£{r.grossProfit.toFixed(2)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                        <div style={{ width: `${r.grossMarginPct}%`, height: '100%', background: '#168447', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#166534', minWidth: 40 }}>{r.grossMarginPct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: r.foodCostPct > 30 ? '#991B1B' : '#166534', fontWeight: 600 }}>{r.foodCostPct.toFixed(1)}%</td>
                  <td style={{ fontSize: 12, color: '#991B1B' }}>£{r.wastage.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Menu Items */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Top Menu Items by Sales</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Menu Item</th>
                <th>Qty Sold</th>
                <th>Total Sales</th>
                <th>Ingredient Cost</th>
                <th>Gross Margin %</th>
              </tr>
            </thead>
            <tbody>
              {topItems.map((item) => (
                <tr key={item.item}>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{item.item}</td>
                  <td style={{ fontSize: 12 }}>{item.qty}</td>
                  <td style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>£{item.sales.toFixed(2)}</td>
                  <td style={{ fontSize: 12, color: '#991B1B' }}>£{item.cost.toFixed(2)}</td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 700, color: item.margin > 90 ? '#166534' : '#92400E' }}>
                      {item.margin > 90 ? <TrendingUp size={12} style={{ display: 'inline', marginRight: 3 }} /> : <TrendingDown size={12} style={{ display: 'inline', marginRight: 3 }} />}
                      {item.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', fontSize: 11, color: '#92400E' }}>
          ⚠ DEMO DATA — Ingredient costs are illustrative. Gross margin shown is ingredient-only contribution, not net profit after labour and overheads.
        </div>
      </div>
    </AppLayout>
  );
}
