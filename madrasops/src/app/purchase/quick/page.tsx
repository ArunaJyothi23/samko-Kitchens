'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, CreditCard, Receipt, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import AppLayout from '@/components/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import ItemPicker from '../components/ItemPicker';
import { CatalogueItem, usePurchaseStore } from '../components/purchaseStore';

interface QuickLine {
  item: CatalogueItem;
  qty: number;
  expiryDate: string;
}

export default function QuickPurchasePage() {
  const router = useRouter();
  const { user, lockedRestaurant } = useAuth();
  const { createQuickPurchase } = usePurchaseStore();
  const restaurant = lockedRestaurant ?? 'Hounslow';

  const [lines, setLines] = useState<QuickLine[]>([]);
  const [payment, setPayment] = useState<'Cash' | 'Card'>('Cash');
  const [receiptName, setReceiptName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const total = lines.reduce((s, l) => s + l.qty * l.item.unitCost, 0);

  const update = (sku: string, patch: Partial<QuickLine>) =>
    setLines((prev) => prev.map((l) => (l.item.sku === sku ? { ...l, ...patch } : l)));

  const submit = () => {
    const e: Record<string, string> = {};
    if (lines.length === 0) e.lines = 'Add at least one item';
    lines.forEach((l) => {
      if (!(l.qty > 0)) e[`q-${l.item.sku}`] = 'Qty required';
      if (!l.expiryDate) e[`e-${l.item.sku}`] = 'Expiry required';
    });
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error(e.lines ?? 'Enter quantity and expiry date for every item');
      return;
    }
    const qp = createQuickPurchase({
      restaurant,
      purchasedBy: user?.name ?? 'Restaurant Manager',
      payment,
      receiptName,
      lines,
    });
    toast.success(`${qp.invoiceNo} recorded`, { description: 'Stock added to restaurant inventory immediately.' });
    router.push('/purchase/quick-history');
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="page-title flex items-center gap-2">
          <ShoppingCart size={22} style={{ color: 'var(--primary)' }} /> Quick Purchase
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
          Log an emergency local purchase for {restaurant} and update inventory immediately.
        </p>
      </div>

      <div className="card mb-5">
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--primary)' }}>Add Items</h2>
        <ItemPicker onPick={(item) => setLines((p) => [...p, { item, qty: 1, expiryDate: '' }])} pickedSkus={lines.map((l) => l.item.sku)} placeholder="Search inventory items..." />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="label-text flex items-center gap-1"><CreditCard size={12} /> Payment</label>
            <select className="input-field" value={payment} onChange={(e) => setPayment(e.target.value as 'Cash' | 'Card')}>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="label-text flex items-center gap-1"><Receipt size={12} /> Receipt</label>
            <input
              type="file"
              className="input-field"
              onChange={(e) => setReceiptName(e.target.files?.[0]?.name ?? '')}
            />
          </div>
        </div>
      </div>

      <div className="card mb-5">
        {lines.length === 0 ? (
          <div className="text-center" style={{ padding: 40, color: 'var(--muted-foreground)', fontSize: 13 }}>
            <ShoppingCart size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
            Search and add items above to start a quick purchase.
            {errors.lines && <p style={{ color: '#991B1B', marginTop: 6 }}>{errors.lines}</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Unit Cost</th>
                  <th>Quantity</th>
                  <th>Expiry Date *</th>
                  <th>Line Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.item.sku}>
                    <td>
                      <div className="font-medium" style={{ fontSize: 13 }}>{l.item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{l.item.sku}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>£{l.item.unitCost.toFixed(2)}/{l.item.unit}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          className="input-field"
                          style={{ width: 90, ...(errors[`q-${l.item.sku}`] ? { borderColor: '#991B1B' } : {}) }}
                          value={l.qty}
                          onChange={(e) => update(l.item.sku, { qty: Number(e.target.value) })}
                        />
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l.item.unit}</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="date"
                        className="input-field"
                        style={{ width: 160, ...(errors[`e-${l.item.sku}`] ? { borderColor: '#991B1B' } : {}) }}
                        value={l.expiryDate}
                        onChange={(e) => update(l.item.sku, { expiryDate: e.target.value })}
                      />
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>£{(l.qty * l.item.unitCost).toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ padding: 6 }}
                        aria-label={`Remove ${l.item.name}`}
                        onClick={() => setLines((p) => p.filter((x) => x.item.sku !== l.item.sku))}
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

      <div className="flex justify-end">
        <button type="button" className="btn-primary" style={{ padding: '10px 18px' }} onClick={submit}>
          <CheckCircle2 size={14} /> Complete Purchase — £{total.toFixed(2)}
        </button>
      </div>
    </AppLayout>
  );
}
