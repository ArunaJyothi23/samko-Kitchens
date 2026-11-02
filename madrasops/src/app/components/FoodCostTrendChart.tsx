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

const dates = ['28 Sep', '29 Sep', '30 Sep', '01 Oct', '02 Oct', '03 Oct', '04 Oct', '05 Oct', '06 Oct', '07 Oct', '08 Oct', '09 Oct', '10 Oct', '11 Oct'];

const data: Record<string, string | number>[] = dates.map((date, i) => {
  const out: Record<string, string | number> = { date };
  NEW_RESTAURANTS.forEach((r, idx) => {
    const wobble = (((i * 7 + idx * 5) % 9) - 4) * 0.25;
    out[r.code.toLowerCase()] = Number((r.foodCostPct + wobble).toFixed(1));
  });
  return out;
});

const allSeries = NEW_RESTAURANTS.map((r) => ({ key: r.code.toLowerCase(), color: r.color, name: r.name as string }));

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