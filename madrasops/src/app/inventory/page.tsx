'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Plus, AlertTriangle, TrendingDown, RefreshCw, Download, Eye } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS, NEW_RESTAURANT_NAMES } from '@/contexts/AuthContext';



interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  restaurant: string;
  available: number;
  reserved: number;
  quarantined: number;
  unit: string;
  costPerUnit: number;
  totalValue: number;
  minStock: number;
  maxStock: number;
  expiryDate: string;
  batchId: string;
  status: 'healthy' | 'low' | 'critical' | 'expired';
}

const baseInventoryData: InventoryItem[] = [
  { id: 'inv-1', sku: 'MF-DB-001', name: 'Dosa Batter', category: 'Batters', restaurant: 'Hounslow', available: 4.2, reserved: 0.5, quarantined: 0, unit: 'kg', costPerUnit: 1.00, totalValue: 4.70, minStock: 2, maxStock: 20, expiryDate: '2026-10-14', batchId: 'BT-2026-283-001', status: 'healthy' },
  { id: 'inv-2', sku: 'MF-IB-001', name: 'Idly Batter', category: 'Batters', restaurant: 'Hounslow', available: 8.5, reserved: 1.0, quarantined: 0, unit: 'kg', costPerUnit: 0.95, totalValue: 9.03, minStock: 3, maxStock: 15, expiryDate: '2026-10-15', batchId: 'BT-2026-283-002', status: 'healthy' },
  { id: 'inv-3', sku: 'MF-VB-001', name: 'Vada Batter', category: 'Batters', restaurant: 'Hounslow', available: 1.2, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 1.10, totalValue: 1.32, minStock: 2, maxStock: 10, expiryDate: '2026-10-13', batchId: 'BT-2026-283-003', status: 'low' },
  { id: 'inv-4', sku: 'MF-PM-001', name: 'Potato Masala', category: 'Masalas', restaurant: 'Hounslow', available: 2.8, reserved: 0.3, quarantined: 0, unit: 'kg', costPerUnit: 1.20, totalValue: 3.72, minStock: 1, maxStock: 8, expiryDate: '2026-10-12', batchId: 'BT-2026-283-004', status: 'healthy' },
  { id: 'inv-5', sku: 'MF-RC-001', name: 'Red Chutney', category: 'Chutneys', restaurant: 'Hounslow', available: 0.3, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 10.00, totalValue: 3.00, minStock: 0.5, maxStock: 3, expiryDate: '2026-10-12', batchId: 'BT-2026-283-005', status: 'critical' },
  { id: 'inv-6', sku: 'MF-WC-001', name: 'White Chutney', category: 'Chutneys', restaurant: 'Hounslow', available: 0.4, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 10.00, totalValue: 4.00, minStock: 0.5, maxStock: 3, expiryDate: '2026-10-13', batchId: 'BT-2026-283-006', status: 'low' },
  { id: 'inv-7', sku: 'MF-SB-001', name: 'Sambar', category: 'Gravies', restaurant: 'Hounslow', available: 0.8, reserved: 0.1, quarantined: 0, unit: 'L', costPerUnit: 5.00, totalValue: 4.50, minStock: 1, maxStock: 10, expiryDate: '2026-10-14', batchId: 'BT-2026-283-007', status: 'low' },
  { id: 'inv-8', sku: 'MF-PN-001', name: 'Paneer', category: 'Dairy', restaurant: 'Reading', available: 1.5, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 8.50, totalValue: 12.75, minStock: 1, maxStock: 5, expiryDate: '2026-10-16', batchId: 'BT-2026-283-008', status: 'healthy' },
  { id: 'inv-9', sku: 'MF-MV-001', name: 'Mixed Vegetables', category: 'Vegetables', restaurant: 'Reading', available: 4.0, reserved: 0.5, quarantined: 0, unit: 'kg', costPerUnit: 2.50, totalValue: 11.25, minStock: 2, maxStock: 10, expiryDate: '2026-10-15', batchId: 'BT-2026-283-009', status: 'healthy' },
  { id: 'inv-10', sku: 'MF-CR-001', name: 'Cooked Rice', category: 'Grains', restaurant: 'Dartford', available: 3.5, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 1.80, totalValue: 6.30, minStock: 2, maxStock: 12, expiryDate: '2026-10-11', batchId: 'BT-2026-282-010', status: 'expired' },
  { id: 'inv-11', sku: 'MF-CB-001', name: 'Curry Base', category: 'Gravies', restaurant: 'Leicester', available: 4.5, reserved: 0.5, quarantined: 0, unit: 'kg', costPerUnit: 3.20, totalValue: 16.00, minStock: 2, maxStock: 10, expiryDate: '2026-10-18', batchId: 'BT-2026-283-011', status: 'healthy' },
  { id: 'inv-12', sku: 'MF-GH-001', name: 'Ghee', category: 'Dairy', restaurant: 'Leicester', available: 0.8, reserved: 0, quarantined: 0.2, unit: 'kg', costPerUnit: 12.00, totalValue: 12.00, minStock: 0.5, maxStock: 3, expiryDate: '2026-11-01', batchId: 'BT-2026-280-012', status: 'healthy' },
];

const newInventoryData: InventoryItem[] = NEW_RESTAURANTS.flatMap((r, i) => {
  const code = r.code;
  const mk = (n: number, sku: string, name: string, category: string, unit: string, costPerUnit: number, base: number, minStock: number, maxStock: number, expiryDate: string, status: InventoryItem['status']): InventoryItem => {
    const available = Number((base * r.scale).toFixed(1));
    return { id: `inv-${code.toLowerCase()}-${n}`, sku, name, category, restaurant: r.name, available, reserved: Number((available * 0.1).toFixed(1)), quarantined: 0, unit, costPerUnit, totalValue: Number((available * costPerUnit).toFixed(2)), minStock, maxStock, expiryDate, batchId: `BT-2026-283-${code}${n}`, status };
  };
  return [
    mk(1, 'MF-DB-001', 'Dosa Batter', 'Batters', 'kg', 1.0, 6.0, 2, 20, '2026-10-14', 'healthy'),
    mk(2, 'MF-IB-001', 'Idly Batter', 'Batters', 'kg', 0.95, 7.5, 3, 15, '2026-10-15', 'healthy'),
    mk(3, 'MF-SB-001', 'Sambar', 'Gravies', 'L', 5.0, i % 2 === 0 ? 1.2 : 4.5, 1, 10, '2026-10-14', i % 2 === 0 ? 'low' : 'healthy'),
    mk(4, 'MF-RC-001', 'Red Chutney', 'Chutneys', 'kg', 10.0, i % 3 === 0 ? 0.5 : 1.6, 0.5, 3, '2026-10-12', i % 3 === 0 ? 'critical' : 'healthy'),
  ];
});

const allInventoryData: InventoryItem[] = [...baseInventoryData, ...newInventoryData];

const categories = ['All', 'Batters', 'Masalas', 'Chutneys', 'Gravies', 'Dairy', 'Vegetables', 'Grains'];
const restaurants = ['All', 'Hounslow', 'Reading', 'Dartford', 'Leicester', ...NEW_RESTAURANT_NAMES];
const statusOptions = ['All', 'healthy', 'low', 'critical', 'expired'];

const statusColors: Record<string, string> = {
  healthy: '#166534',
  low: '#92400E',
  critical: '#991B1B',
  expired: '#6B7280',
};

export default function InventoryPage() {
  const scope = useScopedRestaurant();
  const inventoryData = scope ? allInventoryData.filter((i) => i.restaurant === scope) : allInventoryData;
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [restaurantFilter, setRestaurantFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const filtered = inventoryData.filter((item) => {
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || item.category === categoryFilter;
    const matchRest = (scope ?? restaurantFilter) === 'All' || item.restaurant === (scope ?? restaurantFilter);
    const matchStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchSearch && matchCat && matchRest && matchStatus;
  });

  const totalValue = filtered.reduce((s, i) => s + i.totalValue, 0);
  const lowStockCount = inventoryData.filter(i => i.status === 'low' || i.status === 'critical').length;
  const expiredCount = inventoryData.filter(i => i.status === 'expired').length;

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {scope ? `Real-time stock levels at Samko ${scope}` : 'Real-time stock levels across all restaurant locations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }}>
            <Download size={14} /> Export
          </button>
          <button className="btn-primary" style={{ padding: '8px 12px' }}>
            <Plus size={14} /> Add Stock
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Total Items</p>
          <p className="metric-value">{inventoryData.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Stock Value</p>
          <p className="metric-value" style={{ color: '#166534' }}>£{totalValue.toFixed(2)}</p>
        </div>
        <div className={lowStockCount > 0 ? 'metric-card-alert' : 'metric-card'}>
          <p className="label-text">Low / Critical</p>
          <p className="metric-value" style={{ color: lowStockCount > 0 ? '#991B1B' : 'var(--foreground)' }}>{lowStockCount}</p>
        </div>
        <div className={expiredCount > 0 ? 'metric-card-alert' : 'metric-card'}>
          <p className="label-text">Expired Batches</p>
          <p className="metric-value" style={{ color: expiredCount > 0 ? '#991B1B' : 'var(--foreground)' }}>{expiredCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            className="input-field pl-8"
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input-field" style={{ width: 140 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input-field" style={{ width: 140 }} value={scope ?? restaurantFilter} disabled={!!scope} onChange={(e) => setRestaurantFilter(e.target.value)}>
          {restaurants.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="input-field" style={{ width: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statusOptions.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-secondary" style={{ padding: '8px 12px' }}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Ingredient</th>
                <th>Category</th>
                <th>Location</th>
                <th>Available</th>
                <th>Reserved</th>
                <th>Quarantined</th>
                <th>Cost/Unit</th>
                <th>Total Value</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={selectedItem?.id === item.id ? 'selected' : ''}>
                  <td><span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.sku}</span></td>
                  <td>
                    <div className="font-medium" style={{ fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{item.batchId}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{item.category}</td>
                  <td style={{ fontSize: 12 }}>{item.restaurant}</td>
                  <td>
                    <span className="font-semibold" style={{ fontSize: 13, color: item.available < item.minStock ? '#991B1B' : '#166534' }}>
                      {item.available} {item.unit}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{item.reserved} {item.unit}</td>
                  <td style={{ fontSize: 12, color: item.quarantined > 0 ? '#92400E' : 'var(--muted-foreground)' }}>{item.quarantined} {item.unit}</td>
                  <td style={{ fontSize: 12 }}>£{item.costPerUnit.toFixed(2)}/{item.unit}</td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>£{item.totalValue.toFixed(2)}</td>
                  <td style={{ fontSize: 11, color: item.status === 'expired' ? '#991B1B' : 'var(--muted-foreground)' }}>{item.expiryDate}</td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      background: statusColors[item.status] + '22',
                      color: statusColors[item.status],
                      textTransform: 'capitalize',
                    }}>
                      {item.status === 'critical' && <AlertTriangle size={10} style={{ display: 'inline', marginRight: 3 }} />}
                      {item.status === 'low' && <TrendingDown size={10} style={{ display: 'inline', marginRight: 3 }} />}
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => setSelectedItem(item)}
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', fontSize: 12, color: 'var(--muted-foreground)' }}>
          Showing {filtered.length} of {inventoryData.length} items · Total value: £{filtered.reduce((s, i) => s + i.totalValue, 0).toFixed(2)}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelectedItem(null)}>
          <div className="h-full overflow-y-auto shadow-2xl" style={{ width: 420, background: 'var(--card)', padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 style={{ fontSize: 17, fontWeight: 700 }}>{selectedItem.name}</h2>
              <button onClick={() => setSelectedItem(null)} style={{ fontSize: 20, color: 'var(--muted-foreground)', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
            </div>
            <div className="space-y-4">
              {[
                ['SKU', selectedItem.sku],
                ['Batch ID', selectedItem.batchId],
                ['Category', selectedItem.category],
                ['Location', selectedItem.restaurant],
                ['Available', `${selectedItem.available} ${selectedItem.unit}`],
                ['Reserved', `${selectedItem.reserved} ${selectedItem.unit}`],
                ['Quarantined', `${selectedItem.quarantined} ${selectedItem.unit}`],
                ['Cost per Unit', `£${selectedItem.costPerUnit.toFixed(2)}/${selectedItem.unit}`],
                ['Total Value', `£${selectedItem.totalValue.toFixed(2)}`],
                ['Min Stock', `${selectedItem.minStock} ${selectedItem.unit}`],
                ['Max Stock', `${selectedItem.maxStock} ${selectedItem.unit}`],
                ['Expiry Date', selectedItem.expiryDate],
                ['Status', selectedItem.status.toUpperCase()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex gap-2">
              <button className="btn-primary flex-1" style={{ padding: '10px' }}>Adjust Stock</button>
              <button className="btn-secondary flex-1" style={{ padding: '10px' }}>View Ledger</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
