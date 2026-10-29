'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const FoodCostTrendChart = dynamic(() => import('./FoodCostTrendChart'), { ssr: false });
const EPOSConsumptionChart = dynamic(() => import('./EPOSConsumptionChart'), { ssr: false });

export default function DashboardCharts() {
  const [activeChart, setActiveChart] = useState<'foodcost' | 'epos'>('foodcost');

  return (
    <div className="card-elevated" style={{ padding: 20 }}>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="section-header">Performance Trends</h2>
        <div
          className="flex rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          {[
            { id: 'foodcost', label: 'Food Cost %' },
            { id: 'epos', label: 'EPOS by Location' },
          ].map((tab) => (
            <button
              key={`chart-tab-${tab.id}`}
              onClick={() => setActiveChart(tab.id as 'foodcost' | 'epos')}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                fontSize: 12.5,
                background: activeChart === tab.id ? 'var(--primary)' : 'var(--card)',
                color: activeChart === tab.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {activeChart === 'foodcost' ? <FoodCostTrendChart /> : <EPOSConsumptionChart />}
    </div>
  );
}