'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const baseData = [
  { item: 'Chicken Burger', base: 48 },
  { item: 'Beef Cheeseburger', base: 36 },
  { item: 'Caesar Salad', base: 29 },
  { item: 'Pepperoni Pizza', base: 22 },
  { item: 'Chicken Tikka Masala', base: 19 },
  { item: 'French Fries', base: 17 },
  { item: 'Latte', base: 14 },
];

const extraFactors = [1.0, 0.9, 0.8, 0.85, 0.75, 0.95, 0.7];
const data: Record<string, string | number>[] = baseData.map((row, i) => {
  const out: Record<string, string | number> = { item: row.item };
  NEW_RESTAURANTS.forEach((r) => {
    out[r.code.toLowerCase()] = Math.max(3, Math.round(row.base * r.scale * (extraFactors[(i + r.code.length + r.code.charCodeAt(2)) % extraFactors.length])));
  });
  return out;
});

const allBars = NEW_RESTAURANTS.map((r) => ({ key: r.code.toLowerCase(), fill: r.color, name: r.name as string }));

const barNameByKey: Record<string, string> = Object.fromEntries(allBars.map((b) => [b.key, b.name]));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + p.value, 0);
  return (
    <div className="card-elevated" style={{ padding: '10px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
      <p className="font-semibold mb-2" style={{ fontSize: 12, color: 'var(--foreground)' }}>{label}</p>
      {payload.map((entry: any) => (
        <div key={`epos-tt-${entry.dataKey}`} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="rounded-sm" style={{ width: 8, height: 8, background: entry.fill }} />
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>{barNameByKey[entry.dataKey] ?? entry.dataKey}</span>
          </div>
          <span className="font-semibold tabular-nums" style={{ fontSize: 12 }}>{entry.value}</span>
        </div>
      ))}
      <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <span className="font-bold" style={{ fontSize: 12, color: 'var(--foreground)' }}>Total: {total} orders</span>
      </div>
    </div>
  );
};

export default function EPOSConsumptionChart() {
  const scope = useScopedRestaurant();
  const bars = scope ? allBars.filter((b) => b.name === scope) : allBars;
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="item" tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(val) => <span style={{ color: 'var(--muted-foreground)', textTransform: 'capitalize', fontSize: 12 }}>{val}</span>}
        />
        {bars.map((b) => (
          <Bar key={`bar-${b.key}`} dataKey={b.key} name={b.name} fill={b.fill} radius={[3, 3, 0, 0]} maxBarSize={scope ? 28 : 10} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}