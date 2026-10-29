'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Receipt, Plus, Eye, X } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { matchesScope, useAuth } from '@/contexts/AuthContext';
import { QuickPurchase, formatDate, formatDateTime, usePurchaseStore } from '../components/purchaseStore';

export default function QuickPurchaseHistoryPage() {
  const { lockedRestaurant } = useAuth();
  const { quickPurchases, hydrated } = usePurchaseStore();
  const [viewing, setViewing] = useState<QuickPurchase | null>(null);

  const records = useMemo(
    () => quickPurchases?.filter((q) => matchesScope(lockedRestaurant, q?.restaurant)),
    [quickPurchases, lockedRestaurant]
  );

  const total = records?.reduce((s, r) => s + r?.total, 0);
  const cash = records?.filter((r) => r?.payment === 'Cash')?.reduce((s, r) => s + r?.total, 0);
  const card = records?.filter((r) => r?.payment === 'Card')?.reduce((s, r) => s + r?.total, 0);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Receipt size={22} style={{ color: 'var(--primary)' }} /> Quick Purchase History
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {lockedRestaurant ? `Purchases made for ${lockedRestaurant} only.` : 'Quick purchases across all restaurants.'}
          </p>
        </div>
        <Link href="/purchase/quick" className="btn-primary" style={{ padding: '8px 14px' }}>
          <Plus size={14} /> Quick Purchase
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Total Spent</p>
          <p className="metric-value">£{total?.toFixed(2)}</p>
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{records?.length} purchase{records?.length === 1 ? '' : 's'}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Cash</p>
          <p className="metric-value" style={{ color: '#166534' }}>£{cash?.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Card</p>
          <p className="metric-value" style={{ color: '#1E40AF' }}>£{card?.toFixed(2)}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Items</th>
                <th>Payment</th>
                <th>Purchased By</th>
                <th>Total</th>
                <th>Receipt</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody>
              {records?.map((r) => (
                <tr key={r?.id}>
                  <td><span className="font-mono font-semibold" style={{ fontSize: 12.5 }}>{r?.invoiceNo}</span></td>
                  <td style={{ fontSize: 12 }}>{formatDateTime(r?.createdAt)}</td>
                  <td style={{ fontSize: 12 }}>
                    {r?.lines?.[0]?.name} × {r?.lines?.[0]?.qty}
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{r?.lines?.length} item{r?.lines?.length === 1 ? '' : 's'}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{r?.payment}</td>
                  <td style={{ fontSize: 12 }}>{r?.purchasedBy}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>£{r?.total?.toFixed(2)}</td>
                  <td style={{ fontSize: 12 }}>{r?.receiptName || '—'}</td>
                  <td>
                    <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => setViewing(r)}>
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
              {hydrated && records?.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 36, color: 'var(--muted-foreground)', fontSize: 13 }}>
                    No quick purchases recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setViewing(null)}>
          <div
            className="h-full overflow-y-auto shadow-2xl animate-slide-in-right"
            style={{ width: 520, maxWidth: '100%', background: 'var(--card)', padding: 28 }}
            onClick={(e) => e?.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }} className="font-mono">{viewing?.invoiceNo}</h2>
                <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 2 }}>{viewing?.restaurant}</p>
              </div>
              <button type="button" onClick={() => setViewing(null)} aria-label="Close" className="btn-ghost" style={{ padding: 6 }}>
                <X size={18} />
              </button>
            </div>
            {[
              ['Date', formatDateTime(viewing?.createdAt)],
              ['Purchased By', viewing?.purchasedBy],
              ['Payment', viewing?.payment],
              ['Receipt', viewing?.receiptName || '—'],
            ]?.map(([label, value]) => (
              <div key={label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: '20px 0 8px' }}>Items</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Expiry</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {viewing?.lines?.map((l) => (
                  <tr key={l?.sku}>
                    <td style={{ fontSize: 13 }}>{l?.name}</td>
                    <td style={{ fontSize: 12 }}>{l?.qty} {l?.unit}</td>
                    <td style={{ fontSize: 12 }}>{formatDate(l?.expiryDate)}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>£{(l?.qty * l?.unitCost)?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex justify-between mt-4" style={{ fontSize: 14, fontWeight: 700 }}>
              <span>Total</span>
              <span>£{viewing?.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
