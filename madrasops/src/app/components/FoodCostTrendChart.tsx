'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

const baseData = [
  { date: '28 Sep', hounslow: 29.8, reading: 31.2, dartford: 32.1, leicester: 30.4 },
  { date: '29 Sep', hounslow: 30.2, reading: 30.8, dartford: 31.8, leicester: 31.0 },
  { date: '30 Sep', hounslow: 31.5, reading: 29.9, dartford: 33.2, leicester: 30.1 },
  { date: '01 Oct', hounslow: 30.8, reading: 31.4, dartford: 32.8, leicester: 29.8 },
  { date: '02 Oct', hounslow: 29.4, reading: 30.2, dartford: 31.4, leicester: 31.2 },
  { date: '03 Oct', hounslow: 28.9, reading: 31.8, dartford: 30.9, leicester: 32.1 },
  { date: '04 Oct', hounslow: 31.2, reading: 32.4, dartford: 31.6, leicester: 30.8 },
  { date: '05 Oct', hounslow: 32.1, reading: 31.0, dartford: 33.4, leicester: 29.6 },
  { date: '06 Oct', hounslow: 30.4, reading: 30.6, dartford: 32.0, leicester: 31.4 },
  { date: '07 Oct', hounslow: 29.8, reading: 32.2, dartford: 31.2, leicester: 30.9 },
  { date: '08 Oct', hounslow: 31.8, reading: 31.6, dartford: 34.1, leicester: 31.8 },
  { date: '09 Oct', hounslow: 32.4, reading: 30.4, dartford: 33.8, leicester: 32.0 },
  { date: '10 Oct', hounslow: 31.0, reading: 31.2, dartford: 32.6, leicester: 31.1 },
  { date: '11 Oct', hounslow: 31.4, reading: 31.8, dartford: 33.0, leicester: 30.8 },
];

const data: Record<string, string | number>[] = baseData.map((row, i) => {
  const out: Record<string, string | number> = { ...row };
  NEW_RESTAURANTS.forEach((r, idx) => {
    const wobble = (((i * 7 + idx * 5) % 9) - 4) * 0.25;
    out[r.code.toLowerCase()] = Number((r.foodCostPct + wobble).toFixed(1));
  });
  return out;
});

const allSeries = [
  { key: 'hounslow', color: 'var(--primary)', name: 'Hounslow' },
  { key: 'reading', color: 'var(--secondary)', name: 'Reading' },
  { key: 'dartford', color: 'var(--accent)', name: 'Dartford' },
  { key: 'leicester', color: 'var(--transit)', name: 'Leicester' },
  ...NEW_RESTAURANTS.map((r) => ({ key: r.code.toLowerCase(), color: r.color, name: r.name as string })),
];

const seriesNameByKey: Record<string, string> = Object.fromEntries(allSeries.map((s) => [s.key, s.name]));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="card-elevated"
      style={{ padding: '10px 14px', minWidth: 180, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
    >
      <p className="font-semibold mb-2" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <div key={`tt-${entry.dataKey}`} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="rounded-full" style={{ width: 8, height: 8, background: entry.color }} />
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>
              {seriesNameByKey[entry.dataKey] ?? entry.dataKey}
            </span>
          </div>
          <span className="font-semibold tabular-nums" style={{ fontSize: 12, color: 'var(--foreground)' }}>
            {entry.value}%
          </span>
        </div>
      ))}
    </div>
  );
};

export default function FoodCostTrendChart() {
  const scope = useScopedRestaurant();
  const series = scope ? allSeries.filter((s) => s.name === scope) : allSeries;
  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {series.map((l) => (
          <div key={`legend-${l.key}`} className="flex items-center gap-1.5">
            <div className="rounded-full" style={{ width: 8, height: 8, background: l.color }} />
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)', textTransform: 'capitalize' }}>
              {l.name}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="rounded-sm" style={{ width: 16, height: 2, background: '#9CA3AF', borderTop: '1px dashed #9CA3AF' }} />
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Target 30%</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="gradHounslow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
          <YAxis domain={[28, 35]} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={30} stroke="#9CA3AF" strokeDasharray="4 4" strokeWidth={1.5} />
          {series.map((s, i) => (
            <Area
              key={`area-${s.key}`}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              fill={i === 0 ? 'url(#gradHounslow)' : 'none'}
              dot={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}