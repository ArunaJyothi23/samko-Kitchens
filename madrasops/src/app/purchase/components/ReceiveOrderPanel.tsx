'use client';

import React, { useState } from 'react';
import { X, PackageCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PurchaseOrder, formatDate, usePurchaseStore } from './purchaseStore';

interface ReceiveOrderPanelProps {
  order: PurchaseOrder;
  receivedBy: string;
  onClose: () => void;
}

export default function ReceiveOrderPanel({ order, receivedBy, onClose }: ReceiveOrderPanelProps) {
  const { receiveOrder } = usePurchaseStore();
  const [grnNumber, setGrnNumber] = useState('');
  const [qtys, setQtys] = useState<Record<string, number>>(
    Object.fromEntries(order.lines.map((l) => [l.sku, l.orderedQty]))
  );
  const [expiries, setExpiries] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = () => {
    const e: Record<string, string> = {};
    const grn = grnNumber.trim();
    if (!grn) e.grn = 'GRN number is required';
    order.lines.forEach((l) => {
      if (!(qtys[l.sku] >= 0)) e[`q-${l.sku}`] = 'Invalid';
      if ((qtys[l.sku] ?? 0) > 0 && !expiries[l.sku]) e[`e-${l.sku}`] = 'Expiry date required';
    });
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Enter the GRN number and expiry date for every received item');
      return;
    }
    if (order.lines.every((l) => (qtys[l.sku] ?? 0) <= 0)) {
      toast.error('At least one item must have a received quantity');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      receiveOrder(order.id, {
        grnNumber: grn,
        receivedBy,
        lines: order.lines.map((l) => ({
          sku: l.sku,
          receivedQty: qtys[l.sku] ?? 0,
          expiryDate: expiries[l.sku] ?? '',
        })),
      });
      toast.success(`${order.poNumber} received`, { description: `GRN ${grn} posted — inventory updated.` });
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        style={{ width: 640, maxWidth: '100%', background: 'var(--card)', padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }} className="flex items-center gap-2">
              <PackageCheck size={18} style={{ color: 'var(--primary)' }} /> Receive Goods
            </h2>
            <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 2 }}>
              {order.poNumber} · {order.vendor}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-ghost" style={{ padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        <div className="mb-5">
          <label className="label-text">GRN Number *</label>
          <input
            className="input-field"
            placeholder="e.g. GRN-0101"
            value={grnNumber}
            onChange={(e) => setGrnNumber(e.target.value)}
            style={errors.grn ? { borderColor: '#991B1B' } : undefined}
          />
          {errors.grn && (
            <p className="flex items-center gap-1" style={{ fontSize: 11, color: '#991B1B', marginTop: 4 }}>
              <AlertCircle size={11} /> {errors.grn}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {order.lines.map((l) => (
            <div key={l.sku} className="rounded-lg border" style={{ borderColor: 'var(--border)', padding: 14 }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold" style={{ fontSize: 13.5 }}>{l.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                    {l.sku} · Ordered {l.orderedQty} {l.unit}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text">Received Qty ({l.unit})</label>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    className="input-field"
                    value={qtys[l.sku] ?? 0}
                    onChange={(e) => setQtys((p) => ({ ...p, [l.sku]: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="label-text">Expiry Date *</label>
                  <input
                    type="date"
                    className="input-field"
                    value={expiries[l.sku] ?? ''}
                    onChange={(e) => setExpiries((p) => ({ ...p, [l.sku]: e.target.value }))}
                    style={errors[`e-${l.sku}`] ? { borderColor: '#991B1B' } : undefined}
                  />
                  {errors[`e-${l.sku}`] && (
                    <p className="flex items-center gap-1" style={{ fontSize: 11, color: '#991B1B', marginTop: 4 }}>
                      <AlertCircle size={11} /> {errors[`e-${l.sku}`]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2">
          <button type="button" className="btn-secondary flex-1" style={{ padding: 10 }} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary flex-1"
            style={{ padding: 10, opacity: submitting ? 0.7 : 1 }}
            disabled={submitting}
            onClick={submit}
          >
            <PackageCheck size={14} /> {submitting ? 'Posting…' : 'Received — Post to Inventory'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 10 }}>
          Expected delivery: {formatDate(order.expectedDate)} · Invoice {order.invoiceNo}
        </p>
      </div>
    </div>
  );
}
