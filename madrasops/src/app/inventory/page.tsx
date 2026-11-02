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
  { id: 'inv-1', sku: 'RM-MP-001', name: 'Chicken breast', category: 'Meat & Poultry', restaurant: 'Hounslow', available: 12.5, reserved: 1.5, quarantined: 0, unit: 'kg', costPerUnit: 0, totalValue: 0, minStock: 5, maxStock: 30, expiryDate: '2026-11-04', batchId: 'BT-2026-304-001', status: 'healthy' },
  { id: 'inv-2', sku: 'RM-BB-001', name: 'Brioche buns', category: 'Bakery & Bread', restaurant: 'Hounslow', available: 48, reserved: 6, quarantined: 0, unit: 'piece', costPerUnit: 0, totalValue: 0, minStock: 30, maxStock: 120, expiryDate: '2026-11-03', batchId: 'BT-2026-304-002', status: 'healthy' },
  { id: 'inv-3', sku: 'RM-DE-002', name: 'Cheddar cheese', category: 'Dairy & Eggs', restaurant: 'Hounslow', available: 1.8, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 0, totalValue: 0, minStock: 3, maxStock: 15, expiryDate: '2026-11-20', batchId: 'BT-2026-304-003', status: 'low' },
  { id: 'inv-4', sku: 'RM-VG-008', name: 'Cos lettuce', category: 'Vegetables & Fresh Produce', restaurant: 'Hounslow', available: 0.8, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 0, totalValue: 0, minStock: 2, maxStock: 8, expiryDate: '2026-11-02', batchId: 'BT-2026-304-004', status: 'critical' },
  { id: 'inv-5', sku: 'RM-DG-025', name: 'Cooking oil', category: 'Dry Goods & Groceries', restaurant: 'Hounslow', available: 18, reserved: 0, quarantined: 0, unit: 'litre', costPerUnit: 0, totalValue: 0, minStock: 10, maxStock: 40, expiryDate: '2027-02-01', batchId: 'BT-2026-290-005', status: 'healthy' },
  { id: 'inv-6', sku: 'RM-BB-006', name: 'Pizza bases', category: 'Bakery & Bread', restaurant: 'Reading', available: 36, reserved: 4, quarantined: 0, unit: 'piece', costPerUnit: 0, totalValue: 0, minStock: 20, maxStock: 80, expiryDate: '2026-11-05', batchId: 'BT-2026-304-006', status: 'healthy' },
  { id: 'inv-7', sku: 'RM-DE-001', name: 'Fior Di Latte mozzarella', category: 'Dairy & Eggs', restaurant: 'Reading', available: 3.2, reserved: 0.4, quarantined: 0, unit: 'kg', costPerUnit: 0, totalValue: 0, minStock: 2, maxStock: 12, expiryDate: '2026-11-08', batchId: 'BT-2026-304-007', status: 'healthy' },
  { id: 'inv-8', sku: 'RM-FS-001', name: 'Cod fillet', category: 'Fish & Seafood', restaurant: 'Dartford', available: 4.5, reserved: 0.5, quarantined: 0, unit: 'kg', costPerUnit: 0, totalValue: 0, minStock: 3, maxStock: 15, expiryDate: '2026-11-02', batchId: 'BT-2026-304-008', status: 'healthy' },
  { id: 'inv-9', sku: 'RM-DS-004', name: 'Ice cream – Vanilla', category: 'Dessert Ingredients', restaurant: 'Dartford', available: 0.5, reserved: 0, quarantined: 0, unit: 'litre', costPerUnit: 0, totalValue: 0, minStock: 2, maxStock: 10, expiryDate: '2027-01-15', batchId: 'BT-2026-290-009', status: 'critical' },
  { id: 'inv-10', sku: 'RM-DE-010', name: 'Eggs', category: 'Dairy & Eggs', restaurant: 'Leicester', available: 90, reserved: 0, quarantined: 0, unit: 'piece', costPerUnit: 0, totalValue: 0, minStock: 60, maxStock: 300, expiryDate: '2026-10-30', batchId: 'BT-2026-299-010', status: 'expired' },
  { id: 'inv-11', sku: 'RM-BV-001', name: 'Coffee beans', category: 'Beverages & Hot Drinks', restaurant: 'Leicester', available: 4.0, reserved: 0, quarantined: 0, unit: 'kg', costPerUnit: 0, totalValue: 0, minStock: 2, maxStock: 10, expiryDate: '2027-03-01', batchId: 'BT-2026-290-011', status: 'healthy' },
  { id: 'inv-12', sku: 'RM-MP-004', name: 'Beef steak', category: 'Meat & Poultry', restaurant: 'Leicester', available: 6.0, reserved: 0, quarantined: 0.5, unit: 'kg', costPerUnit: 0, totalValue: 0, minStock: 4, maxStock: 20, expiryDate: '2026-11-03', batchId: 'BT-2026-304-012', status: 'healthy' },
];

const newInventoryData: InventoryItem[] = NEW_RESTAURANTS.flatMap((r, i) => {
  const code = r.code;
  const mk = (n: number, sku: string, name: string, category: string, unit: string, base: number, minStock: number, maxStock: number, expiryDate: string, status: InventoryItem['status']): InventoryItem => {
    const available = Number((base * r.scale).toFixed(1));
    return { id: `inv-${code.toLowerCase()}-${n}`, sku, name, category, restaurant: r.name, available, reserved: Number((available * 0.1).toFixed(1)), quarantined: 0, unit, costPerUnit: 0, totalValue: 0, minStock, maxStock, expiryDate, batchId: `BT-2026-304-${code}${n}`, status };
  };
  return [
    mk(1, 'RM-MP-001', 'Chicken breast', 'Meat & Poultry', 'kg', 10.0, 5, 30, '2026-11-04', 'healthy'),
    mk(2, 'RM-BB-001', 'Brioche buns', 'Bakery & Bread', 'piece', 40, 30, 120, '2026-11-03', 'healthy'),
    mk(3, 'RM-DE-002', 'Cheddar cheese', 'Dairy & Eggs', 'kg', i % 2 === 0 ? 1.5 : 6.0, 3, 15, '2026-11-20', i % 2 === 0 ? 'low' : 'healthy'),
    mk(4, 'RM-VG-008', 'Cos lettuce', 'Vegetables & Fresh Produce', 'kg', i % 3 === 0 ? 0.8 : 4.0, 2, 8, '2026-11-02', i % 3 === 0 ? 'critical' : 'healthy'),
  ];
});

const HOTEL_BY_LEGACY: Record<string, string> = {
  Hounslow: 'Stanhill Hotel Limited',
  Leicester: 'Stanhill Hotel Limited',
  Reading: 'Warren House Hotel Limited',
  Dartford: 'Warren House Hotel Limited',
};

const allInventoryData: InventoryItem[] = [
  ...baseInventoryData.map((i) => ({ ...i, restaurant: HOTEL_BY_LEGACY[i.restaurant] ?? i.restaurant })),
  ...newInventoryData,
];

const categories = ['All', 'Meat & Poultry', 'Fish & Seafood', 'Vegetables & Fresh Produce', 'Dairy & Eggs', 'Bakery & Bread', 'Dry Goods & Groceries', 'Dessert Ingredients', 'Beverages & Hot Drinks'];
const restaurants = ['All', ...NEW_RESTAURANT_NAMES];
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
            {scope ? `Real-time stock levels at ${scope}` : 'Real-time stock levels across both hotels'}
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
        <div className="table-scroll table-scroll-y">
          <table className="data-table">
            <thead>
              <tr>
                <th className="col-left nowrap">SKU</th>
                <th className="col-left col-wide">Ingredient</th>
                <th className="col-left nowrap">Category</th>
                <th className="col-left nowrap">Hotel</th>
                <th className="col-right">Available</th>
                <th className="col-right">Reserved</th>
                <th className="col-right">Quarantined</th>
                <th className="col-right">Cost/Unit</th>
                <th className="col-right">Total Value</th>
                <th className="col-center nowrap">Expiry</th>
                <th className="col-center">Status</th>
                <th className="col-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className={selectedItem?.id === item.id ? 'selected' : ''}>
                  <td className="col-left nowrap"><span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.sku}</span></td>
                  <td className="col-left col-wide">
                    <div className="font-medium" style={{ fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{item.batchId}</div>
                  </td>
                  <td className="col-left nowrap" style={{ fontSize: 12 }}>{item.category}</td>
                  <td className="col-left nowrap" style={{ fontSize: 12 }}>{item.restaurant}</td>
                  <td className="col-right">
                    <span className="font-semibold" style={{ fontSize: 13, color: item.available < item.minStock ? '#991B1B' : '#166534' }}>
                      {item.available} {item.unit}
                    </span>
                  </td>
                  <td className="col-right" style={{ fontSize: 12 }}>{item.reserved} {item.unit}</td>
                  <td className="col-right" style={{ fontSize: 12, color: item.quarantined > 0 ? '#92400E' : 'var(--muted-foreground)' }}>{item.quarantined} {item.unit}</td>
                  <td className="col-right" style={{ fontSize: 12 }}>£{item.costPerUnit.toFixed(2)}/{item.unit}</td>
                  <td className="col-right" style={{ fontSize: 12, fontWeight: 600 }}>£{item.totalValue.toFixed(2)}</td>
                  <td className="col-center nowrap" style={{ fontSize: 11, color: item.status === 'expired' ? '#991B1B' : 'var(--muted-foreground)' }}>{item.expiryDate}</td>
                  <td className="col-center">
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
                ['Hotel', selectedItem.restaurant],
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
