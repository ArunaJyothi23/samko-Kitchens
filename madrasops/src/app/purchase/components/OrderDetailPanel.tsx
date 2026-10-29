'use client';

import React from 'react';
import { X } from 'lucide-react';
import { PurchaseOrder, formatDate, formatDateTime } from './purchaseStore';

export default function OrderDetailPanel({ order, onClose }: { order: PurchaseOrder; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        style={{ width: 600, maxWidth: '100%', background: 'var(--card)', padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }} className="font-mono">{order.poNumber}</h2>
            <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 2 }}>
              {order.vendor} · {order.restaurant}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {[
          ['Status', order.status === 'received' ? 'Received' : 'Pending delivery'],
          ['Invoice No', order.invoiceNo],
          ['Invoice Date', formatDate(order.invoiceDate)],
          ['Created', formatDateTime(order.createdAt)],
          ['Created By', order.createdBy],
          ['Expected', formatDate(order.expectedDate)],
          ...(order.status === 'received'
            ? [
                ['GRN Number', order.grnNumber ?? '—'],
                ['Received At', order.receivedAt ? formatDateTime(order.receivedAt) : '—'],
                ['Received By', order.receivedBy ?? '—'],
              ]
            : []),
          ['Notes', order.notes || '—'],
        ].map(([label, value]) => (
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
              <th>Ordered</th>
              <th>Received</th>
              <th>Expiry</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((l) => (
              <tr key={l.sku}>
                <td>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{l.sku}</div>
                </td>
                <td style={{ fontSize: 12 }}>{l.orderedQty} {l.unit}</td>
                <td style={{ fontSize: 12 }}>{order.status === 'received' ? `${l.receivedQty} ${l.unit}` : '—'}</td>
                <td style={{ fontSize: 12 }}>{order.status === 'received' ? formatDate(l.expiryDate) : '—'}</td>
                <td style={{ fontSize: 12, fontWeight: 600 }}>
                  £{((order.status === 'received' ? l.receivedQty : l.orderedQty) * l.unitCost).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between mt-4" style={{ fontSize: 14, fontWeight: 700 }}>
          <span>Order Total</span>
          <span>£{order.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
