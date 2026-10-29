'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Plus, Download, Search, RefreshCw, Trash2 } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS, NEW_RESTAURANT_NAMES } from '@/contexts/AuthContext';

interface WastageRecord {
  id: string;
  date: string;
  restaurant: string;
  ingredient: string;
  batchId: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
  reason: string;
  staff: string;
  status: 'approved' | 'pending' | 'rejected';
  notes: string;
}

const baseWastageData: WastageRecord[] = [
  { id: 'W-001', date: '2026-10-11', restaurant: 'Hounslow', ingredient: 'Dosa Batter', batchId: 'BT-2026-280-001', quantity: 0.5, unit: 'kg', costPerUnit: 1.00, totalCost: 0.50, reason: 'Expired Stock', staff: 'Priya S.', status: 'approved', notes: 'Batch expired before use' },
  { id: 'W-002', date: '2026-10-11', restaurant: 'Hounslow', ingredient: 'Sambar', batchId: 'BT-2026-281-007', quantity: 0.3, unit: 'L', costPerUnit: 5.00, totalCost: 1.50, reason: 'Spillage', staff: 'Ravi K.', status: 'approved', notes: 'Accidental spillage during service' },
  { id: 'W-003', date: '2026-10-10', restaurant: 'Reading', ingredient: 'Red Chutney', batchId: 'BT-2026-280-005', quantity: 0.2, unit: 'kg', costPerUnit: 10.00, totalCost: 2.00, reason: 'Spoilage', staff: 'Anita M.', status: 'approved', notes: 'Discoloration observed' },
  { id: 'W-004', date: '2026-10-10', restaurant: 'Dartford', ingredient: 'Idly Batter', batchId: 'BT-2026-281-002', quantity: 1.0, unit: 'kg', costPerUnit: 0.95, totalCost: 0.95, reason: 'Overproduction', staff: 'Kumar R.', status: 'pending', notes: 'Excess batter from morning prep' },
  { id: 'W-005', date: '2026-10-09', restaurant: 'Leicester', ingredient: 'Potato Masala', batchId: 'BT-2026-280-004', quantity: 0.8, unit: 'kg', costPerUnit: 1.20, totalCost: 0.96, reason: 'Preparation Waste', staff: 'Meena L.', status: 'approved', notes: 'Trimming and prep waste' },
  { id: 'W-006', date: '2026-10-09', restaurant: 'Hounslow', ingredient: 'Paneer', batchId: 'BT-2026-279-008', quantity: 0.3, unit: 'kg', costPerUnit: 8.50, totalCost: 2.55, reason: 'Burnt / Damaged', staff: 'Priya S.', status: 'approved', notes: 'Overcooked during preparation' },
  { id: 'W-007', date: '2026-10-08', restaurant: 'Reading', ingredient: 'Vada Batter', batchId: 'BT-2026-279-003', quantity: 0.4, unit: 'kg', costPerUnit: 1.10, totalCost: 0.44, reason: 'Staff Meals', staff: 'Anita M.', status: 'approved', notes: 'Staff meal allocation' },
  { id: 'W-008', date: '2026-10-08', restaurant: 'Dartford', ingredient: 'Mixed Vegetables', batchId: 'BT-2026-279-009', quantity: 0.6, unit: 'kg', costPerUnit: 2.50, totalCost: 1.50, reason: 'Portioning Variance', staff: 'Kumar R.', status: 'pending', notes: 'Variance from standard portion size' },
];

const newWastageData: WastageRecord[] = NEW_RESTAURANTS.flatMap((r, i) => {
  const code = r.code.toLowerCase();
  const staff = `${r.managerName.split(' ')[0]} ${r.managerName.split(' ')[1]?.[0] ?? ''}.`;
  return [
    { id: `W-${code}-1`, date: '2026-10-11', restaurant: r.name, ingredient: 'Dosa Batter', batchId: 'BT-2026-280-001', quantity: 0.6, unit: 'kg', costPerUnit: 1.0, totalCost: 0.6, reason: 'Expired Stock', staff, status: 'approved' as const, notes: 'Batch expired before use' },
    { id: `W-${code}-2`, date: '2026-10-10', restaurant: r.name, ingredient: i % 2 === 0 ? 'Sambar' : 'Idly Batter', batchId: 'BT-2026-281-007', quantity: 0.4, unit: i % 2 === 0 ? 'L' : 'kg', costPerUnit: i % 2 === 0 ? 5.0 : 0.95, totalCost: i % 2 === 0 ? 2.0 : 0.38, reason: i % 2 === 0 ? 'Spillage' : 'Overproduction', staff, status: (i % 3 === 0 ? 'pending' : 'approved') as 'pending' | 'approved', notes: 'Recorded during service' },
  ];
});

const allWastageData: WastageRecord[] = [...baseWastageData, ...newWastageData];

const reasons = ['All', 'Expired Stock', 'Spoilage', 'Overproduction', 'Preparation Waste', 'Burnt / Damaged', 'Spillage', 'Staff Meals', 'Portioning Variance', 'Other'];
const restaurants = ['All', 'Hounslow', 'Reading', 'Dartford', 'Leicester', ...NEW_RESTAURANT_NAMES];
const statuses = ['All', 'approved', 'pending', 'rejected'];

const statusColors: Record<string, { bg: string; text: string }> = {
  approved: { bg: '#DCFCE7', text: '#166534' },
  pending: { bg: '#FEF9C3', text: '#854D0E' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function WastagePage() {
  const scope = useScopedRestaurant();
  const wastageData = scope ? allWastageData.filter((w) => w.restaurant === scope) : allWastageData;
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [restaurantFilter, setRestaurantFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);

  const filtered = wastageData.filter((w) => {
    const matchSearch = !search || w.ingredient.toLowerCase().includes(search.toLowerCase()) || w.id.toLowerCase().includes(search.toLowerCase());
    const matchReason = reasonFilter === 'All' || w.reason === reasonFilter;
    const matchRest = (scope ?? restaurantFilter) === 'All' || w.restaurant === (scope ?? restaurantFilter);
    const matchStatus = statusFilter === 'All' || w.status === statusFilter;
    return matchSearch && matchReason && matchRest && matchStatus;
  });

  const totalWastageCost = filtered.reduce((s, w) => s + w.totalCost, 0);
  const pendingCount = wastageData.filter(w => w.status === 'pending').length;

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Wastage</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {scope ? `Track and manage food wastage at Samko ${scope}` : 'Track and manage food wastage across all locations'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }}>
            <Download size={14} /> Export
          </button>
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => setShowForm(true)}>
            <Plus size={14} /> Record Wastage
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Total Records</p>
          <p className="metric-value">{wastageData.length}</p>
        </div>
        <div className="metric-card-alert">
          <p className="label-text">Total Wastage Cost</p>
          <p className="metric-value" style={{ color: '#991B1B' }}>£{wastageData.reduce((s, w) => s + w.totalCost, 0).toFixed(2)}</p>
        </div>
        <div className={pendingCount > 0 ? 'metric-card-alert' : 'metric-card'}>
          <p className="label-text">Pending Approval</p>
          <p className="metric-value" style={{ color: pendingCount > 0 ? '#92400E' : 'var(--foreground)' }}>{pendingCount}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">This Week</p>
          <p className="metric-value">£{totalWastageCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input className="input-field pl-8" placeholder="Search ingredient or ID..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ width: 160 }} value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}>
          {reasons.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="input-field" style={{ width: 140 }} value={scope ?? restaurantFilter} disabled={!!scope} onChange={(e) => setRestaurantFilter(e.target.value)}>
          {restaurants.map(r => <option key={r}>{r}</option>)}
        </select>
        <select className="input-field" style={{ width: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-secondary" style={{ padding: '8px 12px' }}><RefreshCw size={14} /></button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Date</th>
                <th>Location</th>
                <th>Ingredient</th>
                <th>Batch</th>
                <th>Quantity</th>
                <th>Cost</th>
                <th>Reason</th>
                <th>Staff</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((w) => (
                <tr key={w.id}>
                  <td><span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{w.id}</span></td>
                  <td style={{ fontSize: 12 }}>{w.date}</td>
                  <td style={{ fontSize: 12 }}>{w.restaurant}</td>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{w.ingredient}</td>
                  <td><span className="font-mono" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{w.batchId}</span></td>
                  <td style={{ fontSize: 12 }}>{w.quantity} {w.unit}</td>
                  <td style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>£{w.totalCost.toFixed(2)}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 7px', borderRadius: 4, background: '#FEE2E2', color: '#991B1B' }}>
                      <Trash2 size={10} />{w.reason}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>{w.staff}</td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: statusColors[w.status].bg, color: statusColors[w.status].text, textTransform: 'capitalize' }}>
                      {w.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted-foreground)', maxWidth: 160 }}>{w.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', fontSize: 12, color: 'var(--muted-foreground)' }}>
          Showing {filtered.length} records · Total cost: £{totalWastageCost.toFixed(2)}
        </div>
      </div>

      {/* Record Wastage Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowForm(false)}>
          <div className="rounded-xl shadow-2xl p-6" style={{ width: 480, background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Record Wastage</h2>
            <div className="space-y-4">
              <div>
                <label className="label-text block mb-1">Ingredient</label>
                <select className="input-field w-full"><option>Select ingredient...</option><option>Dosa Batter</option><option>Idly Batter</option><option>Sambar</option></select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text block mb-1">Quantity</label>
                  <input className="input-field w-full" type="number" placeholder="0.00" />
                </div>
                <div>
                  <label className="label-text block mb-1">Unit</label>
                  <select className="input-field w-full"><option>kg</option><option>L</option><option>units</option></select>
                </div>
              </div>
              <div>
                <label className="label-text block mb-1">Reason</label>
                <select className="input-field w-full">
                  {reasons.filter(r => r !== 'All').map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1">Notes</label>
                <textarea className="input-field w-full" rows={3} placeholder="Additional notes..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={() => setShowForm(false)}>Submit for Approval</button>
              <button className="btn-secondary flex-1" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
