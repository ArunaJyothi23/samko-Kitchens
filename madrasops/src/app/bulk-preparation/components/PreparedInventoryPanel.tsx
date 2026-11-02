'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Search } from 'lucide-react';
import { useHydratedEposOrders } from '@/data/useHydratedEposOrders';
import { HotelName, isoToUk } from '@/data/traceability';
import { PrepEventType, PreparedBatch, buildPreparedBatches, usePrepStore } from '@/data/prepStore';
import { buildPrepOrderInputs } from '@/data/prepConsumption';

interface Props {
  hotelScope: HotelName | null;
  byName: string;
  readOnly: boolean;
}

const fmt = (n: number) => Number(n.toFixed(3)).toString();

const STATUS: Record<string, { bg: string; text: string }> = {
  active: { bg: '#DCFCE7', text: '#166534' },
  depleted: { bg: '#F3F4F6', text: '#4B5563' },
  expired: { bg: '#FEE2E2', text: '#991B1B' },
  rejected: { bg: '#FEE2E2', text: '#991B1B' },
  quarantined: { bg: '#FEF3C7', text: '#92400E' },
  'awaiting-approval': { bg: '#DBEAFE', text: '#1E40AF' },
};

export default function PreparedInventoryPanel({ hotelScope, byName, readOnly }: Props) {
  const { state, recordEvent } = usePrepStore();
  const orders = useHydratedEposOrders();
  const [search, setSearch] = useState('');
  const [selKey, setSelKey] = useState<string | null>(null);
  const [evt, setEvt] = useState<{ type: PrepEventType; qty: string; note: string }>({ type: 'wastage', qty: '', note: '' });
  const today = new Date().toISOString().slice(0, 10);

  const all = useMemo(
    () => buildPreparedBatches(state.batches, state.events, buildPrepOrderInputs(orders, state.preps, state.batches), today).filter((b) => !hotelScope || b.hotel === hotelScope),
    [state.batches, state.events, state.preps, orders, today, hotelScope]
  );
  const list = all.filter((b) => !search || b.batchNo.toLowerCase().includes(search.toLowerCase()) || b.prepName.toLowerCase().includes(search.toLowerCase()));
  const keyOf = (b: PreparedBatch) => `${b.hotel}:${b.batchNo}`;
  const selected = list.find((b) => keyOf(b) === selKey) ?? null;

  const totals = {
    value: all.filter((b) => b.status === 'active').reduce((s, b) => s + b.valuation, 0),
    active: all.filter((b) => b.status === 'active' && b.qtyRemaining > 0).length,
    expired: all.filter((b) => b.status === 'expired' && b.qtyRemaining > 0).length,
    wasted: all.reduce((s, b) => s + b.qtyWasted * b.unitCost, 0),
  };

  const submit = () => {
    if (!selected) return;
    if (readOnly) return toast.error('Your account is read-only');
    const q = Number(evt.qty);
    if (!q || (evt.type !== 'adjustment' && q < 0)) return toast.error('Enter a valid quantity');
    recordEvent({ batchNo: selected.batchNo, hotel: selected.hotel, type: evt.type, quantity: q, by: byName, note: evt.note });
    toast.success('Movement recorded with audit trail');
    setEvt({ ...evt, qty: '', note: '' });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="metric-card"><p className="label-text">Prepared stock value</p><p className="metric-value">£{totals.value.toFixed(2)}</p></div>
        <div className="metric-card"><p className="label-text">Usable batches</p><p className="metric-value">{totals.active}</p></div>
        <div className={totals.expired > 0 ? 'metric-card-alert' : 'metric-card'}><p className="label-text">Expired with stock</p><p className="metric-value" style={{ color: totals.expired > 0 ? '#991B1B' : undefined }}>{totals.expired}</p></div>
        <div className="metric-card"><p className="label-text">Wastage value</p><p className="metric-value">£{totals.wasted.toFixed(2)}</p></div>
      </div>

      <div className="card">
        <div className="relative max-w-md">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input className="input-field pl-8" placeholder="Search batch or preparation…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-scroll table-scroll-y">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-left nowrap">Batch</th>
              <th className="col-left col-wide">Preparation</th>
              <th className="col-left nowrap">Hotel</th>
              <th className="col-center nowrap">Produced</th>
              <th className="col-center nowrap">Expiry</th>
              <th className="col-right">Available</th>
              <th className="col-right">Reserved</th>
              <th className="col-right">Consumed</th>
              <th className="col-right">Wasted</th>
              <th className="col-right">Cost / unit</th>
              <th className="col-right">Valuation</th>
              <th className="col-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={12} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No prepared batches yet. Complete a production run to add stock.</td></tr>}
            {list.map((b) => (
              <tr key={keyOf(b)} className={`cursor-pointer${selected && keyOf(selected) === keyOf(b) ? ' selected' : ''}`} onClick={() => setSelKey(keyOf(b))}>
                <td className="col-left nowrap font-mono" style={{ fontSize: 12 }}>{b.batchNo}</td>
                <td className="col-left col-wide" style={{ fontSize: 12.5, fontWeight: 600 }}>{b.prepName}</td>
                <td className="col-left nowrap" style={{ fontSize: 12 }}>{b.hotel.split(' ')[0]}</td>
                <td className="col-center nowrap" style={{ fontSize: 12 }}>{isoToUk(b.producedAt.slice(0, 10))}</td>
                <td className="col-center nowrap" style={{ fontSize: 12 }}>{isoToUk(b.expiryDate)}</td>
                <td className="col-right" style={{ fontSize: 12 }}>{fmt(b.qtyRemaining)} {b.unit}</td>
                <td className="col-right" style={{ fontSize: 12 }}>{fmt(b.qtyReserved)}</td>
                <td className="col-right" style={{ fontSize: 12 }}>{fmt(b.qtyConsumed)}</td>
                <td className="col-right" style={{ fontSize: 12 }}>{fmt(b.qtyWasted)}</td>
                <td className="col-right" style={{ fontSize: 12 }}>£{b.unitCost.toFixed(4)}</td>
                <td className="col-right" style={{ fontSize: 12, fontWeight: 600 }}>£{b.valuation.toFixed(2)}</td>
                <td className="col-center"><span className="table-status" style={{ background: STATUS[b.status].bg, color: STATUS[b.status].text }}>{b.status.replace('-', ' ')}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {selected && (
        <div className="card space-y-3">
          <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.batchNo} · {selected.prepName} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted-foreground)' }}>recipe v{selected.recipeVersion}</span></div>
          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            Prepared by {selected.source.preparedBy} · approved by {selected.source.approvedBy ?? 'pending'} · {selected.source.storageLocation}{selected.source.tempC ? ` · ${selected.source.tempC}°C` : ''} · Allergens: {selected.source.allergens.join(', ') || 'none declared'}
          </div>
          <div style={{ fontSize: 12 }}>
            <strong>Raw ingredients issued:</strong>
            {selected.source.issued.map((i, idx) => (
              <div key={idx} style={{ fontSize: 11.5 }}>{i.name} · {fmt(i.quantity)} {i.unit} · batch {i.rawBatchId ?? i.prepBatchId}{i.grnId ? ` · GRN ${i.grnId}` : ''} · {i.supplier}</div>
            ))}
          </div>
          <div style={{ fontSize: 12 }}>
            <strong>Consumed by EPOS orders:</strong> {selected.consumers.length === 0 ? 'none yet' : selected.consumers.map((c) => `${c.orderId} (${c.menuItem}, ${fmt(c.quantity)})`).join(', ')}
          </div>
          {!readOnly && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <select className="input-field" value={evt.type} onChange={(e) => setEvt({ ...evt, type: e.target.value as PrepEventType })}>
                <option value="wastage">Wastage</option>
                <option value="expired">Expired (discard)</option>
                <option value="spoiled">Spoiled (quarantine)</option>
                <option value="rejected">Rejected (QC fail)</option>
                <option value="reserve">Reserve</option>
                <option value="adjustment">Adjustment (+/−)</option>
              </select>
              <input type="number" step="any" className="input-field" placeholder={`Qty (${selected.unit})`} value={evt.qty} onChange={(e) => setEvt({ ...evt, qty: e.target.value })} />
              <input className="input-field" placeholder="Reason / note" value={evt.note} onChange={(e) => setEvt({ ...evt, note: e.target.value })} />
              <button className="btn-primary justify-center" onClick={submit}>Record</button>
            </div>
          )}
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Expired, spoiled and rejected batches are never allocated to EPOS orders. Different batches stay separate to preserve traceability.</p>
        </div>
      )}
    </div>
  );
}
