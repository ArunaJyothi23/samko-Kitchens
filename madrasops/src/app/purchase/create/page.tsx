'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, Send, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import ItemPicker from '../components/ItemPicker';
import { CatalogueItem, SUPPLIERS, usePurchaseStore, todayIso } from '../components/purchaseStore';

interface DraftLine {
  item: CatalogueItem;
  qty: number;
}

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const { user, lockedRestaurant } = useAuth();
  const { createOrder } = usePurchaseStore();
  const restaurant = lockedRestaurant ?? 'Hounslow';

  const [vendor, setVendor] = useState(SUPPLIERS[0]);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = lines.reduce((s, l) => s + l.qty * l.item.unitCost, 0);

  const addLine = (item: CatalogueItem) => setLines((prev) => [...prev, { item, qty: 1 }]);
  const setQty = (sku: string, qty: number) =>
    setLines((prev) => prev.map((l) => (l.item.sku === sku ? { ...l, qty } : l)));
  const removeLine = (sku: string) => setLines((prev) => prev.filter((l) => l.item.sku !== sku));

  const submit = () => {
    const e: Record<string, string> = {};
    if (!vendor) e.vendor = 'Select a vendor';
    if (!invoiceNo.trim()) e.invoiceNo = 'Invoice number is required';
    if (lines.length === 0) e.lines = 'Add at least one item';
    if (lines.some((l) => !(l.qty > 0))) e.lines = 'All quantities must be greater than zero';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error(e.lines ?? e.invoiceNo ?? e.vendor);
      return;
    }
    const order = createOrder({
      restaurant,
      vendor,
      invoiceNo: invoiceNo.trim(),
      invoiceDate: invoiceDate || todayIso(),
      expectedDate: expectedDate || addDays(todayIso(), 2),
      notes,
      createdBy: user?.name ?? 'Restaurant Manager',
      lines,
    });
    toast.success(`${order.poNumber} submitted`, { description: 'Order is now awaiting delivery in Pending Orders.' });
    router.push('/purchase/pending');
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShoppingCart size={22} style={{ color: 'var(--primary)' }} /> Create Purchase Order
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Select items, quantities and vendor to place a purchase order for {restaurant}
          </p>
        </div>
        <Link href="/purchase/pending" className="btn-secondary" style={{ padding: '8px 14px' }}>
          <ArrowLeft size={14} /> Back to Orders
        </Link>
      </div>

      <div className="card mb-5">
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--primary)' }}>Vendor &amp; Invoice Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label-text">Vendor *</label>
            <select className="input-field" value={vendor} onChange={(e) => setVendor(e.target.value as typeof vendor)}>
              {SUPPLIERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-text">Invoice No *</label>
            <input
              className="input-field"
              placeholder="INV-2026-0001"
              value={invoiceNo}
              onChange={(e) => setInvoiceNo(e.target.value)}
              style={errors.invoiceNo ? { borderColor: '#991B1B' } : undefined}
            />
            {errors.invoiceNo && <p style={{ fontSize: 11, color: '#991B1B', marginTop: 4 }}>{errors.invoiceNo}</p>}
          </div>
          <div>
            <label className="label-text">Invoice Date</label>
            <input type="date" className="input-field" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
          </div>
          <div>
            <label className="label-text">Expected Delivery</label>
            <input type="date" className="input-field" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
          </div>
          <div className="md:col-span-4">
            <label className="label-text">Notes</label>
            <input
              className="input-field"
              placeholder="Vehicle no, driver name, remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card mb-5">
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }} className="flex items-center gap-2">
          <Package size={16} /> Order Items ({lines.length})
        </h2>
        <ItemPicker
          onPick={addLine}
          pickedSkus={lines.map((l) => l.item.sku)}
          placeholder={`Search ${vendor} items...`}
        />

        <div className="mt-5">
          {lines.length === 0 ? (
            <div
              className="text-center rounded-lg border border-dashed"
              style={{ padding: 32, borderColor: 'var(--border)', color: 'var(--muted-foreground)', fontSize: 13 }}
            >
              Search and add items to your purchase order
              {errors.lines && <p style={{ color: '#991B1B', marginTop: 6 }}>{errors.lines}</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Unit Cost</th>
                    <th>Quantity</th>
                    <th>Line Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.item.sku}>
                      <td>
                        <div className="font-medium" style={{ fontSize: 13 }}>{l.item.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{l.item.category}</div>
                      </td>
                      <td><span className="font-mono text-xs">{l.item.sku}</span></td>
                      <td style={{ fontSize: 12 }}>£{l.item.unitCost.toFixed(2)}/{l.item.unit}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0.1}
                            step={0.1}
                            className="input-field"
                            style={{ width: 90 }}
                            value={l.qty}
                            onChange={(e) => setQty(l.item.sku, Number(e.target.value))}
                          />
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l.item.unit}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600 }}>£{(l.qty * l.item.unitCost).toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-ghost"
                          onClick={() => removeLine(l.item.sku)}
                          aria-label={`Remove ${l.item.name}`}
                          style={{ padding: 6 }}
                        >
                          <Trash2 size={14} style={{ color: '#991B1B' }} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/purchase/pending" className="btn-secondary" style={{ padding: '10px 18px' }}>Cancel</Link>
        <button type="button" className="btn-primary" style={{ padding: '10px 18px' }} onClick={submit}>
          <Send size={14} /> Place Purchase Order — £{total.toFixed(2)}
        </button>
      </div>
    </AppLayout>
  );
}
