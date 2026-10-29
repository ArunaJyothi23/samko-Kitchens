'use client';

import React, { useState } from 'react';
import { Search, RefreshCw, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { eposOrders as allEposOrders, EPOSOrder } from './eposData';
import StatusBadge from '@/components/ui/StatusBadge';
import EPOSOrderDetailPanel from './EPOSOrderDetailPanel';
import EPOSLiveStream from './EPOSLiveStream';
import { toast } from 'sonner';
import { useScopedRestaurant, matchesScope, NEW_RESTAURANT_NAMES, RestaurantName } from '@/contexts/AuthContext';

const statusMap: Record<string, any> = {
  completed: 'completed',
  processing: 'processing',
  failed: 'failed',
  cancelled: 'cancelled',
};

const statusOptions = ['All', 'completed', 'processing', 'failed', 'cancelled'];
const restaurantOptions = ['All', 'Hounslow', 'Reading', 'Dartford', 'Leicester', ...NEW_RESTAURANT_NAMES];

export default function EPOSOrdersContent() {
  const scope = useScopedRestaurant();
  const eposOrders = allEposOrders.filter((o) => matchesScope(scope, o.restaurant));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [restaurantFilter, setRestaurantFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState<EPOSOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showStream, setShowStream] = useState(true);

  const filtered = eposOrders.filter((o) => {
    const matchSearch =
      !search ||
      o.orderId.toLowerCase().includes(search.toLowerCase()) ||
      o.restaurant.toLowerCase().includes(search.toLowerCase()) ||
      o.lines.some((l) => l.menuItem.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchRest = restaurantFilter === 'All' || matchesScope(restaurantFilter as RestaurantName, o.restaurant);
    return matchSearch && matchStatus && matchRest;
  });

  const summaryStats = [
    { id: 'epos-sum-1', label: "Today\'s Orders", value: eposOrders.length.toString(), color: 'var(--foreground)' },
    { id: 'epos-sum-2', label: 'Total Sales', value: `£${eposOrders.reduce((s, o) => s + o.totalSelling, 0).toFixed(2)}`, color: '#166534' },
    { id: 'epos-sum-3', label: 'Avg Food Cost %', value: `${(eposOrders.filter(o => o.foodCostPct > 0).reduce((s, o) => s + o.foodCostPct, 0) / eposOrders.filter(o => o.foodCostPct > 0).length).toFixed(1)}%`, color: 'var(--foreground)' },
    { id: 'epos-sum-4', label: 'Unmapped Items', value: eposOrders.filter(o => o.lines.some(l => l.recipeStatus === 'unmapped')).length.toString(), color: '#991B1B' },
    { id: 'epos-sum-5', label: 'Duplicate Events Blocked', value: eposOrders.filter(o => o.isDuplicate).length.toString(), color: '#5B21B6' },
  ];

  return (
    <>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">EPOS Orders</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="live-pulse" />
            <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)' }}>
              Live · {eposOrders.length} orders today · FEFO batch allocation active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            style={{ padding: '8px 12px' }}
            onClick={() => setShowStream(!showStream)}
          >
            <Zap size={14} />
            {showStream ? 'Hide' : 'Show'} Live Stream
          </button>
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => toast.success('EPOS events refreshed')}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4 mb-6">
        {summaryStats.map((s) => (
          <div key={s.id} className={s.id === 'epos-sum-4' && s.value !== '0' ? 'metric-card-alert' : 'metric-card'}>
            <p className="label-text" style={{ fontSize: 11 }}>{s.label}</p>
            <p className="metric-value mt-1" style={{ fontSize: 20, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        {/* Main Table */}
        <div className="xl:col-span-2 space-y-4">
          {/* Filters */}
          <div className="card-elevated" style={{ padding: '14px 16px' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative" style={{ minWidth: 220 }}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search order ID, menu item…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9"
                  style={{ padding: '7px 12px 7px 34px', fontSize: 13 }}
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {statusOptions.map((s) => (
                  <button
                    key={`eposf-${s}`}
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
                    {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
              <select
                value={scope ?? restaurantFilter}
                onChange={(e) => setRestaurantFilter(e.target.value)}
                disabled={!!scope}
                className="rounded-lg border px-3 py-1.5"
                style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 12.5, outline: 'none' }}
              >
                {restaurantOptions.map((r) => (
                  <option key={`epos-rest-${r}`} value={r}>{r === 'All' ? 'All Restaurants' : r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 750 }}>
                <thead>
                  <tr style={{ background: 'var(--muted)' }}>
                    {['Order ID', 'Restaurant', 'Items', 'Selling Price', 'Recipe Cost', 'Food Cost %', 'Status', 'Time', ''].map((h, i) => (
                      <th
                        key={`eposth-${i}`}
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
                      <td colSpan={9} className="text-center py-12" style={{ color: 'var(--muted-foreground)', fontSize: 13.5 }}>
                        No EPOS orders match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((order, idx) => {
                      const hasUnmapped = order.lines.some((l) => l.recipeStatus === 'unmapped');
                      return (
                        <tr
                          key={order.id}
                          className="table-row-hover cursor-pointer"
                          style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onClick={() => { setSelectedOrder(order); setDetailOpen(true); }}
                        >
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold" style={{ fontSize: 12.5, color: 'var(--primary)' }}>
                                {order.orderId}
                              </span>
                              {order.isDuplicate && (
                                <span title="Duplicate event blocked">
                                  <ShieldCheck size={13} style={{ color: '#5B21B6' }} />
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <div className="flex items-center gap-2">
                              <span
                                className="rounded font-bold text-white"
                                style={{ fontSize: 10, padding: '2px 5px', background: 'var(--primary)' }}
                              >
                                {order.restaurantCode}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div>
                              {order.lines.map((l) => (
                                <div key={l.id} className="flex items-center gap-1.5">
                                  <span style={{ fontSize: 12.5, color: 'var(--foreground)' }}>
                                    {l.menuItem} ×{l.quantity}
                                  </span>
                                  {l.recipeStatus === 'unmapped' && (
                                    <span title="No recipe mapped — stock not deducted">
                                      <AlertTriangle size={12} style={{ color: '#991B1B' }} />
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                            £{order.totalSelling.toFixed(2)}
                          </td>
                          <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                            {order.totalRecipeCost > 0 ? `£${order.totalRecipeCost.toFixed(3)}` : '—'}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            {order.foodCostPct > 0 ? (
                              <span
                                className="font-bold tabular-nums"
                                style={{
                                  fontSize: 13,
                                  color: order.foodCostPct > 30 ? '#991B1B' : order.foodCostPct > 15 ? '#92400E' : '#166534',
                                }}
                              >
                                {order.foodCostPct.toFixed(1)}%
                              </span>
                            ) : (
                              <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <StatusBadge
                              variant={statusMap[order.status]}
                              label={order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              dot
                            />
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                            {order.orderTime}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <button
                              className="btn-ghost"
                              style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setDetailOpen(true); }}
                            >
                              Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div
              className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
                {filtered.length} of {eposOrders.length} orders
              </span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                Total sales shown: <strong style={{ color: 'var(--foreground)' }}>
                  £{filtered.reduce((s, o) => s + o.totalSelling, 0).toFixed(2)}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {/* Live Stream */}
        {showStream && <EPOSLiveStream />}
      </div>

      {/* Detail Panel */}
      {selectedOrder && (
        <EPOSOrderDetailPanel
          order={selectedOrder}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      )}
    </>
  );
}