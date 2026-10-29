'use client';

import React, { useState } from 'react';
import { Search, Plus, Download, Filter, AlertTriangle } from 'lucide-react';
import { dispatchOrders as allDispatchOrders, DispatchOrder } from './dispatchData';
import StatusBadge from '@/components/ui/StatusBadge';
import { useScopedRestaurant, matchesScope, NEW_RESTAURANT_NAMES, RestaurantName } from '@/contexts/AuthContext';
import DispatchDetailPanel from './DispatchDetailPanel';
import { toast } from 'sonner';

const statusOptions = ['All', 'created', 'reserved', 'in-transit', 'delivered', 'discrepancy', 'cancelled'];

const destinationOptions = ['All', 'Hounslow', 'Reading', 'Dartford', 'Leicester', ...NEW_RESTAURANT_NAMES];

const statusMap: Record<string, any> = {
  created: 'draft',
  reserved: 'reserved',
  'in-transit': 'in-transit',
  delivered: 'delivered',
  discrepancy: 'discrepancy',
  cancelled: 'cancelled',
};

export default function DispatchManagementContent() {
  const scope = useScopedRestaurant();
  const dispatchOrders = allDispatchOrders.filter((d) => matchesScope(scope, d.destination));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [destFilter, setDestFilter] = useState('All');
  const [selectedDispatch, setSelectedDispatch] = useState<DispatchOrder | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = dispatchOrders.filter((d) => {
    const matchSearch =
      !search ||
      d.dispatchId.toLowerCase().includes(search.toLowerCase()) ||
      d.destination.toLowerCase().includes(search.toLowerCase()) ||
      d.driver.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || d.status === statusFilter;
    const matchDest = destFilter === 'All' || matchesScope(destFilter as RestaurantName, d.destination);
    return matchSearch && matchStatus && matchDest;
  });

  const summaryStats = [
    { id: 'ds-total', label: 'Total Dispatches', value: dispatchOrders.length.toString(), color: 'var(--foreground)' },
    { id: 'ds-transit', label: 'In Transit', value: dispatchOrders.filter(d => d.status === 'in-transit').length.toString(), color: '#5B21B6' },
    { id: 'ds-delivered', label: 'Delivered Today', value: dispatchOrders.filter(d => d.status === 'delivered').length.toString(), color: '#166534' },
    { id: 'ds-discrepancy', label: 'Discrepancies', value: dispatchOrders.filter(d => d.status === 'discrepancy').length.toString(), color: '#991B1B' },
  ];

  return (
    <>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Dispatch Management</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 3 }}>
            {scope ? `Central Kitchen → ${scope}` : 'Central Kitchen → All Restaurants'} · {dispatchOrders.length} dispatches today
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => toast.success('Dispatch report exported')}>
            <Download size={14} />
            Export
          </button>
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => toast.info('New dispatch order form coming soon')}>
            <Plus size={14} />
            New Dispatch
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((s) => (
          <div key={s.id} className="metric-card">
            <p className="label-text" style={{ fontSize: 11.5 }}>{s.label}</p>
            <p className="metric-value mt-1" style={{ fontSize: 22, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-elevated mb-4" style={{ padding: '14px 16px' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" style={{ minWidth: 240 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search dispatch ID, restaurant, driver…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
              style={{ padding: '7px 12px 7px 34px', fontSize: 13 }}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter size={13} style={{ color: 'var(--muted-foreground)' }} />
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Status:</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {statusOptions.map((s) => (
              <button
                key={`dsf-${s}`}
                onClick={() => setStatusFilter(s)}
                className="rounded-full px-3 py-1 transition-colors"
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  background: statusFilter === s ? 'var(--primary)' : 'var(--muted)',
                  color: statusFilter === s ? '#fff' : 'var(--muted-foreground)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
          <select
            value={scope ?? destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            disabled={!!scope}
            className="rounded-lg border px-3 py-1.5"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 12.5, outline: 'none' }}
          >
            {destinationOptions.map((d) => (
              <option key={`ddest-${d}`} value={d}>{d === 'All' ? 'All Destinations' : d}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {['Dispatch ID', 'Destination', 'Items', 'Total Value', 'Status', 'Driver', 'Vehicle', 'Departure', 'ETA', ''].map((h, i) => (
                  <th
                    key={`dsth-${i}`}
                    className="text-left label-text"
                    style={{ padding: '10px 14px', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12" style={{ color: 'var(--muted-foreground)', fontSize: 13.5 }}>
                    No dispatch orders match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((d, idx) => (
                  <tr
                    key={d.id}
                    className="table-row-hover cursor-pointer"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onClick={() => { setSelectedDispatch(d); setPanelOpen(true); }}
                  >
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="font-mono font-semibold" style={{ fontSize: 13, color: 'var(--primary)' }}>
                        {d.dispatchId}
                      </span>
                      {d.status === 'discrepancy' && (
                        <div className="flex items-center gap-1 mt-1">
                          <AlertTriangle size={11} style={{ color: '#92400E' }} />
                          <span style={{ fontSize: 10.5, color: '#92400E', fontWeight: 600 }}>Discrepancy</span>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded font-bold text-white"
                          style={{ fontSize: 10, padding: '2px 6px', background: 'var(--primary)' }}
                        >
                          {d.destinationCode}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--foreground)' }}>
                          {d.destination.replace('Samko ', '')}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{d.itemCount} items</span>
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      £{d.totalValue.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <StatusBadge variant={statusMap[d.status]} label={d.status.charAt(0).toUpperCase() + d.status.slice(1).replace('-', ' ')} dot />
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {d.driver}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        className="font-mono"
                        style={{ fontSize: 12, color: 'var(--muted-foreground)' }}
                      >
                        {d.vehicle}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      {d.departureTime}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      {d.expectedArrival}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={(e) => { e.stopPropagation(); setSelectedDispatch(d); setPanelOpen(true); }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
            {filtered.length} of {dispatchOrders.length} dispatches
          </span>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              Total in-transit value:
            </span>
            <span className="font-bold tabular-nums" style={{ fontSize: 13, color: 'var(--foreground)' }}>
              £{dispatchOrders.filter(d => d.status === 'in-transit').reduce((s, d) => s + d.totalValue, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      <DispatchDetailPanel
        dispatch={selectedDispatch}
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </>
  );
}