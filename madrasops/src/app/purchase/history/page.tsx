'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { History, Plus, Search, Eye } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { matchesScope, useAuth } from '@/contexts/AuthContext';
import { PurchaseOrder, SUPPLIERS, formatDate, usePurchaseStore } from '../components/purchaseStore';
import OrderDetailPanel from '../components/OrderDetailPanel';

export default function PurchaseHistoryPage() {
  const { lockedRestaurant } = useAuth();
  const { orders, hydrated } = usePurchaseStore();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [vendor, setVendor] = useState('All');
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);

  const scoped = useMemo(() => orders?.filter((o) => matchesScope(lockedRestaurant, o?.restaurant)), [orders, lockedRestaurant]);

  const filtered = useMemo(
    () =>
      scoped?.filter((o) => {
        const q = search?.trim()?.toLowerCase();
        const matchSearch =
          !q ||
          o?.poNumber?.toLowerCase()?.includes(q) ||
          o?.vendor?.toLowerCase()?.includes(q) ||
          o?.grnNumber?.toLowerCase()?.includes(q) ||
          o?.lines?.some((l) => l?.name?.toLowerCase()?.includes(q));
        const matchStatus = status === 'All' || o?.status === status;
        const matchVendor = vendor === 'All' || o?.vendor === vendor;
        return matchSearch && matchStatus && matchVendor;
      }),
    [scoped, search, status, vendor]
  );

  const pendingCount = scoped?.filter((o) => o?.status === 'pending')?.length;
  const receivedCount = scoped?.filter((o) => o?.status === 'received')?.length;
  const totalSpent = scoped?.filter((o) => o?.status === 'received')?.reduce((s, o) => s + o?.total, 0);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <History size={22} style={{ color: 'var(--primary)' }} /> Purchase History
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {filtered?.length} orders found
          </p>
        </div>
        <Link href="/purchase/create" className="btn-primary" style={{ padding: '8px 14px' }}>
          <Plus size={14} /> New Order
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Total Orders</p>
          <p className="metric-value">{scoped?.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Pending</p>
          <p className="metric-value" style={{ color: '#92400E' }}>{pendingCount}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Received</p>
          <p className="metric-value" style={{ color: '#166534' }}>{receivedCount}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Total Spent</p>
          <p className="metric-value">£{totalSpent?.toFixed(2)}</p>
        </div>
      </div>

      <div className="card mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 32 }}
            placeholder="Search PO number, vendor, GRN or item..."
            value={search}
            onChange={(e) => setSearch(e?.target?.value)}
          />
        </div>
        <select className="input-field" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e?.target?.value)}>
          <option value="All">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="received">Received</option>
        </select>
        <select className="input-field" style={{ width: 180 }} value={vendor} onChange={(e) => setVendor(e?.target?.value)}>
          <option value="All">All Vendors</option>
          {SUPPLIERS?.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Items</th>
                <th>Order Total</th>
                <th>Status</th>
                <th>GRN No</th>
                <th>Created</th>
                <th>Received</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((o) => (
                <tr key={o?.id}>
                  <td><span className="font-mono font-semibold" style={{ fontSize: 12.5 }}>{o?.poNumber}</span></td>
                  <td style={{ fontSize: 13 }}>{o?.vendor}</td>
                  <td style={{ fontSize: 12 }}>{o?.lines?.length}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>£{o?.total?.toFixed(2)}</td>
                  <td>
                    <StatusBadge
                      variant={o?.status === 'received' ? 'completed' : 'pending'}
                      label={o?.status === 'received' ? 'Received' : 'Pending'}
                      dot
                    />
                  </td>
                  <td style={{ fontSize: 12 }} className="font-mono">{o?.grnNumber ?? '—'}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(o?.createdAt)}</td>
                  <td style={{ fontSize: 12 }}>{o?.receivedAt ? formatDate(o?.receivedAt) : '—'}</td>
                  <td>
                    <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setViewing(o)}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {hydrated && filtered?.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--muted-foreground)', fontSize: 13 }}>
                    No purchase orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && <OrderDetailPanel order={viewing} onClose={() => setViewing(null)} />}
    </AppLayout>
  );
}
