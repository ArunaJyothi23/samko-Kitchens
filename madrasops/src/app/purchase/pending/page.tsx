'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Clock, Plus, Search, PackageCheck, Eye } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import StatusBadge from '@/components/ui/StatusBadge';
import { matchesScope, useAuth } from '@/contexts/AuthContext';
import { PurchaseOrder, formatDate, usePurchaseStore } from '../components/purchaseStore';
import ReceiveOrderPanel from '../components/ReceiveOrderPanel';
import OrderDetailPanel from '../components/OrderDetailPanel';

export default function PendingOrdersPage() {
  const { user, lockedRestaurant } = useAuth();
  const { orders, hydrated } = usePurchaseStore();
  const [search, setSearch] = useState('');
  const [receiving, setReceiving] = useState<PurchaseOrder | null>(null);
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null);

  const pending = useMemo(
    () =>
      orders?.filter((o) => o?.status === 'pending' && matchesScope(lockedRestaurant, o?.restaurant))?.filter((o) => {
          const q = search?.trim()?.toLowerCase();
          return !q || o?.poNumber?.toLowerCase()?.includes(q) || o?.vendor?.toLowerCase()?.includes(q) || o?.invoiceNo?.toLowerCase()?.includes(q);
        }),
    [orders, lockedRestaurant, search]
  );

  const totalValue = pending?.reduce((s, o) => s + o?.total, 0);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Clock size={22} style={{ color: 'var(--primary)' }} /> Pending Orders
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Submitted purchase orders awaiting delivery. Enter the GRN number and expiry dates to receive.
          </p>
        </div>
        <Link href="/purchase/create" className="btn-primary" style={{ padding: '8px 14px' }}>
          <Plus size={14} /> New Order
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Awaiting Delivery</p>
          <p className="metric-value" style={{ color: '#92400E' }}>{pending?.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Pending Value</p>
          <p className="metric-value">£{totalValue?.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Total Line Items</p>
          <p className="metric-value">{pending?.reduce((s, o) => s + o?.lines?.length, 0)}</p>
        </div>
      </div>

      <div className="card mb-5">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 32 }}
            placeholder="Search PO number, vendor or invoice..."
            value={search}
            onChange={(e) => setSearch(e?.target?.value)}
          />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>PO Number</th>
                <th>Vendor</th>
                <th>Invoice</th>
                <th>Items</th>
                <th>Order Total</th>
                <th>Expected</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending?.map((o) => (
                <tr key={o?.id}>
                  <td><span className="font-mono font-semibold" style={{ fontSize: 12.5 }}>{o?.poNumber}</span></td>
                  <td style={{ fontSize: 13 }}>{o?.vendor}</td>
                  <td style={{ fontSize: 12 }}>{o?.invoiceNo}</td>
                  <td style={{ fontSize: 12 }}>{o?.lines?.length}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>£{o?.total?.toFixed(2)}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(o?.expectedDate)}</td>
                  <td><StatusBadge variant="pending" label="Awaiting Delivery" dot /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setViewing(o)}>
                        <Eye size={12} /> View
                      </button>
                      <button type="button" className="btn-primary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setReceiving(o)}>
                        <PackageCheck size={12} /> Received
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {hydrated && pending?.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: 'var(--muted-foreground)', fontSize: 13 }}>
                    No pending orders. <Link href="/purchase/create" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create a purchase order</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {receiving && (
        <ReceiveOrderPanel order={receiving} receivedBy={user?.name ?? 'Restaurant Manager'} onClose={() => setReceiving(null)} />
      )}
      {viewing && <OrderDetailPanel order={viewing} onClose={() => setViewing(null)} />}
    </AppLayout>
  );
}
