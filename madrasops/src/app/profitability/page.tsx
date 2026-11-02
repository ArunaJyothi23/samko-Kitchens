'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { TrendingUp, TrendingDown, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';
import { useHydratedEposOrders } from '@/data/useHydratedEposOrders';

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

const allRestaurantData = NEW_RESTAURANTS.map((r) => {
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

const trendData: Record<string, string | number>[] = ['W38', 'W39', 'W40', 'W41'].map((week, i) => {
  const out: Record<string, string | number> = { week };
  NEW_RESTAURANTS.forEach((r, idx) => {
    const wobble = (((i * 3 + idx * 2) % 5) - 2) * 0.3;
    out[r.name] = Number((100 - r.foodCostPct + wobble).toFixed(1));
  });
  return out;
});

const COLORS: Record<string, string> = {
  ...Object.fromEntries(NEW_RESTAURANTS.map((r) => [r.name, r.color])),
};

const matchesScope = (scope: string | null | undefined, restaurant: string): boolean => {
  return !scope || restaurant === scope;
};

export default function ProfitabilityPage() {
  const scope = useScopedRestaurant();
  const liveOrders = useHydratedEposOrders();
  const topItems = React.useMemo(() => {
    const map = new Map<string, { item: string; qty: number; sales: number; cost: number; costed: boolean }>();
    liveOrders
      .filter((o) => o.status === 'completed' && !o.isDuplicate && matchesScope(scope, o.restaurant))
      .forEach((o) => {
        o.lines.forEach((l) => {
          const cur = map.get(l.menuItem) ?? { item: l.menuItem, qty: 0, sales: 0, cost: 0, costed: true };
          cur.qty += l.quantity;
          cur.sales += l.totalPrice;
          const lineCost = l.consumption.reduce((s, c) => s + c.totalIngredientCost, 0);
          if (l.recipeStatus !== 'mapped' || lineCost <= 0) cur.costed = false;
          cur.cost += lineCost;
          map.set(l.menuItem, cur);
        });
      });
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 8);
  }, [liveOrders, scope]);
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
            {scope ? `Gross margin, food cost % and contribution at ${scope}` : 'Gross margin, food cost % and contribution across both hotels'}
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
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-left col-wide">Restaurant</th>
                <th className="col-right">Orders</th>
                <th className="col-right">Total Sales</th>
                <th className="col-right">Ingredient Cost</th>
                <th className="col-right">Gross Profit</th>
                <th className="col-left" style={{ minWidth: 170 }}>Gross Margin %</th>
                <th className="col-right">Food Cost %</th>
                <th className="col-right">Wastage</th>
              </tr>
            </thead>
            <tbody>
              {restaurantData.map((r) => (
                <tr key={r.restaurant}>
                  <td className="col-left col-wide" style={{ fontWeight: 600, fontSize: 13 }}>{r.restaurant}</td>
                  <td className="col-right" style={{ fontSize: 12 }}>{r.orders}</td>
                  <td className="col-right" style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>£{r.totalSales.toFixed(2)}</td>
                  <td className="col-right" style={{ fontSize: 12, color: '#991B1B' }}>£{r.ingredientCost.toFixed(2)}</td>
                  <td className="col-right" style={{ fontSize: 13, fontWeight: 600 }}>£{r.grossProfit.toFixed(2)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3 }}>
                        <div style={{ width: `${r.grossMarginPct}%`, height: '100%', background: '#168447', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#166534', minWidth: 40 }}>{r.grossMarginPct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="col-right" style={{ fontSize: 12, color: r.foodCostPct > 30 ? '#991B1B' : '#166534', fontWeight: 600 }}>{r.foodCostPct.toFixed(1)}%</td>
                  <td className="col-right" style={{ fontSize: 12, color: '#991B1B' }}>£{r.wastage.toFixed(2)}</td>
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
              {topItems.length === 0 && (
                <tr><td colSpan={5} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No completed EPOS orders yet.</td></tr>
              )}
              {topItems.map((item) => {
                const margin = item.costed && item.sales > 0 ? ((item.sales - item.cost) / item.sales) * 100 : null;
                return (
                  <tr key={item.item}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{item.item}</td>
                    <td style={{ fontSize: 12 }}>{item.qty}</td>
                    <td style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>£{item.sales.toFixed(2)}</td>
                    <td style={{ fontSize: 12, color: '#991B1B' }}>{item.costed ? `£${item.cost.toFixed(2)}` : 'Recipe pending'}</td>
                    <td>
                      {margin === null ? (
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>—</span>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: margin > 65 ? '#166534' : '#92400E' }}>
                          {margin > 65 ? <TrendingUp size={12} style={{ display: 'inline', marginRight: 3 }} /> : <TrendingDown size={12} style={{ display: 'inline', marginRight: 3 }} />}
                          {margin.toFixed(1)}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', fontSize: 11, color: '#92400E' }}>
          Sales and quantities come from EPOS orders. Cost and margin appear once the item&apos;s recipe is approved in Recipe Costing. Margin is ingredient-only contribution, not net profit after labour and overheads.
        </div>
      </div>
    </AppLayout>
  );
}
