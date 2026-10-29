'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const salesByLocation = [
  { location: 'Hounslow', sales: 4820.50, orders: 312 },
  { location: 'Reading', sales: 3640.20, orders: 241 },
  { location: 'Dartford', sales: 2980.75, orders: 198 },
  { location: 'Leicester', sales: 3210.00, orders: 215 },
];

const wastageByReason = [
  { name: 'Expired Stock', value: 3.45, color: '#EF4444' },
  { name: 'Spoilage', value: 2.00, color: '#F97316' },
  { name: 'Overproduction', value: 0.95, color: '#EAB308' },
  { name: 'Prep Waste', value: 0.96, color: '#84CC16' },
  { name: 'Staff Meals', value: 0.44, color: '#06B6D4' },
  { name: 'Other', value: 1.50, color: '#8B5CF6' },
];

const topMenuItems = [
  { item: 'Masala Dosa', qty: 48, sales: 383.52, foodCostPct: 6.3 },
  { item: 'Idly', qty: 62, sales: 294.50, foodCostPct: 8.1 },
  { item: 'Paneer Butter Masala', qty: 31, sales: 294.50, foodCostPct: 17.9 },
  { item: 'Plain Dosa', qty: 35, sales: 244.65, foodCostPct: 6.5 },
  { item: 'Vegetable Biryani', qty: 22, sales: 175.78, foodCostPct: 12.3 },
  { item: 'Medhu Vada', qty: 28, sales: 154.00, foodCostPct: 8.3 },
];

const reports = [
  { id: 'R-001', name: 'Ingredient Stock Ledger', category: 'Inventory', description: 'Full movement ledger for all ingredients across locations', lastGenerated: '2026-10-11 06:00' },
  { id: 'R-002', name: 'Batch Stock Report', category: 'Inventory', description: 'Current batch quantities, costs and expiry status', lastGenerated: '2026-10-11 06:00' },
  { id: 'R-003', name: 'Goods Received Report', category: 'Procurement', description: 'All GRNs with accepted/rejected quantities and costs', lastGenerated: '2026-10-10 23:00' },
  { id: 'R-004', name: 'Production Batch Costing', category: 'Costing', description: 'Batch costs, yields and variances from central kitchen', lastGenerated: '2026-10-10 23:00' },
  { id: 'R-005', name: 'Dispatch Report', category: 'Logistics', description: 'All dispatches with transit status and delivery confirmations', lastGenerated: '2026-10-10 23:00' },
  { id: 'R-006', name: 'Restaurant Consumption Report', category: 'Operations', description: 'EPOS-driven ingredient consumption per restaurant', lastGenerated: '2026-10-11 06:00' },
  { id: 'R-007', name: 'Menu Item Profitability', category: 'Costing', description: 'Selling price, ingredient cost, margin and food cost % per item', lastGenerated: '2026-10-11 06:00' },
  { id: 'R-008', name: 'Wastage & Expiry Report', category: 'Operations', description: 'All wastage records with reasons, costs and approval status', lastGenerated: '2026-10-11 06:00' },
  { id: 'R-009', name: 'Stocktake Variance Report', category: 'Inventory', description: 'Physical count vs system stock with variance analysis', lastGenerated: '2026-10-09 22:00' },
  { id: 'R-010', name: 'EPOS Order Reconciliation', category: 'EPOS', description: 'All EPOS events matched to stock movements', lastGenerated: '2026-10-11 06:00' },
  { id: 'R-011', name: 'Traceability & Recall Report', category: 'Traceability', description: 'Batch genealogy and affected order trace for any ingredient', lastGenerated: '2026-10-10 23:00' },
  { id: 'R-012', name: 'Restaurant Comparison Report', category: 'Analytics', description: 'Side-by-side KPI comparison across all four restaurants', lastGenerated: '2026-10-11 06:00' },
];

const categoryColors: Record<string, string> = {
  Inventory: '#6366F1',
  Procurement: '#0EA5E9',
  Costing: '#168447',
  Logistics: '#F9B233',
  Operations: '#ED1C24',
  EPOS: '#8B5CF6',
  Traceability: '#06B6D4',
  Analytics: '#F97316',
};

export default function ReportsAnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports'>('dashboard');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(reports.map(r => r.category)))];
  const filteredReports = reports.filter(r => categoryFilter === 'All' || r.category === categoryFilter);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Business intelligence, operational reports and data exports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }}><RefreshCw size={14} /> Refresh</button>
          <button className="btn-primary" style={{ padding: '8px 12px' }}><Download size={14} /> Export All</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'var(--card)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {(['dashboard', 'reports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              background: activeTab === tab ? 'var(--primary)' : 'transparent',
              color: activeTab === tab ? 'white' : 'var(--muted-foreground)',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'dashboard' ? '📊 Analytics Dashboard' : '📄 Report Library'}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="metric-card">
              <p className="label-text">Total Sales (Week)</p>
              <p className="metric-value" style={{ color: '#166534' }}>£{salesByLocation.reduce((s, r) => s + r.sales, 0).toFixed(2)}</p>
            </div>
            <div className="metric-card">
              <p className="label-text">Total Orders</p>
              <p className="metric-value">{salesByLocation.reduce((s, r) => s + r.orders, 0)}</p>
            </div>
            <div className="metric-card">
              <p className="label-text">Avg Food Cost %</p>
              <p className="metric-value" style={{ color: '#166534' }}>9.6%</p>
            </div>
            <div className="metric-card-alert">
              <p className="label-text">Total Wastage Cost</p>
              <p className="metric-value" style={{ color: '#991B1B' }}>£{wastageByReason.reduce((s, w) => s + w.value, 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Sales by Location */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Sales by Location</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesByLocation}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="location" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
                  <Tooltip formatter={(v: number) => `£${v.toFixed(2)}`} />
                  <Bar dataKey="sales" name="Sales" fill="#ED1C24" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Wastage by Reason */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Wastage by Reason</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={wastageByReason} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: £${value}`} labelLine={false}>
                    {wastageByReason.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `£${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
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
                    <th>Food Cost %</th>
                  </tr>
                </thead>
                <tbody>
                  {topMenuItems.map((item) => (
                    <tr key={item.item}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{item.item}</td>
                      <td style={{ fontSize: 12 }}>{item.qty}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>£{item.sales.toFixed(2)}</td>
                      <td style={{ fontSize: 12, fontWeight: 600, color: item.foodCostPct > 15 ? '#991B1B' : '#166534' }}>{item.foodCostPct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'reports' && (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  border: `1px solid ${categoryFilter === cat ? 'var(--primary)' : 'var(--border)'}`,
                  background: categoryFilter === cat ? 'var(--primary)' : 'transparent',
                  color: categoryFilter === cat ? 'white' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: categoryColors[report.category] || '#6B7280' }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: categoryColors[report.category] || '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{report.category}</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{report.id}</span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{report.name}</h4>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12, lineHeight: 1.5 }}>{report.description}</p>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 12 }}>Last generated: {report.lastGenerated}</div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" style={{ padding: '7px', fontSize: 12 }}>
                    <FileText size={12} /> Generate
                  </button>
                  <button className="btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }}>
                    <Download size={12} /> CSV
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AppLayout>
  );
}
