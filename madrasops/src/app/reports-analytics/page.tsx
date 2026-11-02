'use client';

import React, { useState, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import { FileText, Download, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useHydratedEposOrders } from '@/data/useHydratedEposOrders';
import { useEposMaster } from '@/data/eposMasterStore';
import { MENU_ITEMS, activeVersion, computeRecipeCost, foodCostPct } from '@/data/eposMaster';

const salesByLocation = [
  { location: 'Stanhill Hotel Limited', sales: 8030.5, orders: 527 },
  { location: 'Warren House Hotel Limited', sales: 6620.95, orders: 439 },
];

const wastageByReason = [
  { name: 'Expired Stock', value: 3.45, color: '#EF4444' },
  { name: 'Spoilage', value: 2.00, color: '#F97316' },
  { name: 'Overproduction', value: 0.95, color: '#EAB308' },
  { name: 'Prep Waste', value: 0.96, color: '#84CC16' },
  { name: 'Staff Meals', value: 0.44, color: '#06B6D4' },
  { name: 'Other', value: 1.50, color: '#8B5CF6' },
];

const reports = [
  { id: 'R-001', name: 'Menu Item Recipe Cost Report', category: 'Costing', description: 'Recipe cost, cost per serving, food cost % and gross profit for every EPOS item', lastGenerated: 'Live' },
  { id: 'R-002', name: 'Ingredient Cost Report', category: 'Costing', description: 'Raw material master with purchase unit and latest cost', lastGenerated: 'Live' },
  { id: 'R-003', name: 'Menu Item Profitability Report', category: 'Costing', description: 'Portions sold, sales, recipe cost, gross profit and food cost % per item', lastGenerated: 'Live' },
  { id: 'R-004', name: 'Daily Food Cost Report', category: 'Costing', description: 'Daily EPOS sales versus theoretical recipe food cost', lastGenerated: '2026-10-31 06:00' },
  { id: 'R-005', name: 'Monthly Food Cost Report', category: 'Costing', description: 'Monthly sales, theoretical food cost, wastage and gross profit', lastGenerated: '2026-10-31 06:00' },
  { id: 'R-006', name: 'Ingredient Consumption Report', category: 'Operations', description: 'Theoretical consumption of each raw material from EPOS orders', lastGenerated: 'Live' },
  { id: 'R-007', name: 'Raw Material Stock Report', category: 'Inventory', description: 'Current raw material stock, batches, cost and expiry status', lastGenerated: '2026-10-31 06:00' },
  { id: 'R-008', name: 'Purchase History Report', category: 'Procurement', description: 'All purchase orders and GRNs with quantities and prices', lastGenerated: '2026-10-31 06:00' },
  { id: 'R-009', name: 'Supplier-wise Purchase Report', category: 'Procurement', description: 'Purchase value and volume grouped by supplier', lastGenerated: '2026-10-31 06:00' },
  { id: 'R-010', name: 'Wastage Report', category: 'Operations', description: 'Wastage records with reasons, financial cost and approval status', lastGenerated: '2026-10-31 06:00' },
  { id: 'R-011', name: 'Stock Adjustment Report', category: 'Inventory', description: 'Stock adjustments, stocktake variances and write-offs', lastGenerated: '2026-10-30 22:00' },
  { id: 'R-012', name: 'EPOS Order-wise Ingredient Consumption', category: 'EPOS', description: 'Ingredient consumption recorded against each EPOS order', lastGenerated: 'Live' },
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
  const liveOrders = useHydratedEposOrders();
  const { state: master, materialOf, getRecipe } = useEposMaster();

  const topMenuItems = React.useMemo(() => {
    const map = new Map<string, { item: string; qty: number; sales: number; cost: number; costed: boolean }>();
    liveOrders.filter((o) => o.status === 'completed' && !o.isDuplicate).forEach((o) => {
      o.lines.forEach((l) => {
        const cur = map.get(l.menuItem) ?? { item: l.menuItem, qty: 0, sales: 0, cost: 0, costed: true };
        cur.qty += l.quantity;
        cur.sales += l.totalPrice;
        const c = l.consumption.reduce((s, x) => s + x.totalIngredientCost, 0);
        if (l.recipeStatus !== 'mapped' || c <= 0) cur.costed = false;
        cur.cost += c;
        map.set(l.menuItem, cur);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales).slice(0, 8);
  }, [liveOrders]);

  const download = (name: string, rows: (string | number)[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportReport = (id: string, name: string) => {
    if (id === 'R-001') {
      download(name, [['Item', 'Category', 'Price', 'Recipe cost / serving', 'Food cost %', 'Gross profit'], ...MENU_ITEMS.map((m) => {
        const c = computeRecipeCost(activeVersion(getRecipe(m.id)), materialOf);
        return [m.name, m.category, m.price.toFixed(2), c.costPerServing.toFixed(2), c.costPerServing > 0 ? foodCostPct(c.costPerServing, m.price).toFixed(1) : '', c.costPerServing > 0 ? (m.price - c.costPerServing).toFixed(2) : ''];
      })]);
    } else if (id === 'R-002') {
      download(name, [['SKU', 'Ingredient', 'Category', 'Unit', 'Cost per unit'], ...master.materials.map((m) => [m.sku, m.name, m.category, m.unit, m.unitCost.toFixed(4)])]);
    } else if (id === 'R-003') {
      download(name, [['Item', 'Portions sold', 'Sales', 'Recipe cost', 'Gross profit'], ...topMenuItems.map((t) => [t.item, t.qty, t.sales.toFixed(2), t.costed ? t.cost.toFixed(2) : '', t.costed ? (t.sales - t.cost).toFixed(2) : ''])]);
    } else if (id === 'R-006') {
      const agg = new Map<string, { unit: string; qty: number; cost: number }>();
      liveOrders.filter((o) => o.status === 'completed' && !o.isDuplicate).forEach((o) => o.lines.forEach((l) => l.consumption.forEach((c) => {
        const cur = agg.get(c.ingredientName) ?? { unit: c.unit, qty: 0, cost: 0 };
        cur.qty += c.quantity; cur.cost += c.totalIngredientCost; agg.set(c.ingredientName, cur);
      })));
      download(name, [['Ingredient', 'Unit', 'Quantity consumed (theoretical)', 'Cost'], ...Array.from(agg.entries()).map(([k, v]) => [k, v.unit, v.qty.toFixed(3), v.cost.toFixed(2)])]);
    } else if (id === 'R-012') {
      download(name, [['Order', 'Restaurant', 'Item', 'Ingredient', 'Quantity', 'Unit', 'Cost'], ...liveOrders.filter((o) => o.status === 'completed' && !o.isDuplicate).flatMap((o) => o.lines.flatMap((l) => l.consumption.map((c) => [o.orderId, o.restaurant, l.menuItem, c.ingredientName, c.quantity, c.unit, c.totalIngredientCost.toFixed(2)])))]);
    } else {
      download(name, [['Report', name], ['Note', 'No transaction data is available yet for this period in the current session. Data appears here once purchase, GRN and stock activity is recorded.']]);
    }
  };

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
              <p className="metric-value" style={{ color: '#166534' }}>{(() => { const c = topMenuItems.filter((t) => t.costed && t.sales > 0); const s = c.reduce((a, t) => a + t.sales, 0); return s > 0 ? `${((c.reduce((a, t) => a + t.cost, 0) / s) * 100).toFixed(1)}%` : '—'; })()}</p>
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
                      <td style={{ fontSize: 12, fontWeight: 600, color: item.costed && item.sales > 0 && (item.cost / item.sales) * 100 > 35 ? '#991B1B' : '#166534' }}>{item.costed && item.sales > 0 ? `${((item.cost / item.sales) * 100).toFixed(1)}%` : 'Recipe pending'}</td>
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
                  <button className="btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => exportReport(report.id, report.name)}>
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
