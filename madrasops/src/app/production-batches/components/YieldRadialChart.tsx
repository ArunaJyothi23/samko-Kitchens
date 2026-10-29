'use client';

import React from 'react';
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface YieldRadialChartProps {
  yieldPct: number;
}

export default function YieldRadialChart({ yieldPct }: YieldRadialChartProps) {
  const color = yieldPct >= 97 ? 'var(--accent)' : yieldPct >= 92 ? 'var(--secondary)' : 'var(--primary)';
  const data = [{ value: yieldPct, fill: color }];

  return (
    <div style={{ width: 120, height: 120, position: 'relative', flexShrink: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="65%"
          outerRadius="90%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'var(--muted)' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="font-bold tabular-nums" style={{ fontSize: 18, color, lineHeight: 1 }}>
          {yieldPct}%
        </span>
        <span style={{ fontSize: 9, color: 'var(--muted-foreground)', marginTop: 2 }}>Yield</span>
      </div>
    </div>
  );
}