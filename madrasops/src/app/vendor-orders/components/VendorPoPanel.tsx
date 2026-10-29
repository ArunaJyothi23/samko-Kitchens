'use client';

import React, { useState } from 'react';
import { X, Send, RotateCcw, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { PurchaseOrder, formatDate, formatDateTime } from '@/app/purchase/components/purchaseStore';
import { COMM_STATUS_STYLE, CommStatus, ConfirmedLine, PoComm, VendorConfig } from './vendorCommsStore';

interface Props {
  order: PurchaseOrder;
  comm: PoComm;
  vendor: VendorConfig | undefined;
  actor: string;
  canManage: boolean;
  onClose: () => void;
  onSend: () => void;
  onCancel: () => void;
  onRecord: (input: {
    outcome: 'Acknowledged' | 'Confirmed' | 'Partially Confirmed' | 'Rejected';
    externalRef: string;
    expectedDelivery: string;
    lines: ConfirmedLine[];
    note: string;
    orderedLines: { sku: string; name: string; unitCost: number }[];
  }) => void;
  onReview: (changeId: string, decision: 'Approved' | 'Declined') => void;
}

export function CommBadge({ status }: { status: CommStatus }) {
  const st = COMM_STATUS_STYLE[status];
  return <span style={{ background: st.bg, color: st.fg, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>{status}</span>;
}

export default function VendorPoPanel({ order, comm, vendor, actor, canManage, onClose, onSend, onCancel, onRecord, onReview }: Props) {
  const [showResponse, setShowResponse] = useState(false);
  const [outcome, setOutcome] = useState<'Acknowledged' | 'Confirmed' | 'Partially Confirmed' | 'Rejected'>('Confirmed');
  const [extRef, setExtRef] = useState('');
  const [expDate, setExpDate] = useState(order.expectedDate);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<Record<string, { qty: string; price: string; sub: string }>>(
    () => Object.fromEntries(order.lines.map((l) => [l.sku, { qty: String(l.orderedQty), price: String(l.unitCost), sub: '' }]))
  );

  const manual = !vendor || vendor.integrationType === 'None (Manual)';
  const received = order.status === 'received';
  const canSend = canManage && !manual && !received && ['Not Sent', 'Failed', 'Ready to Send'].includes(comm.status);
  const canCancel = canManage && !received && !['Cancelled', 'Rejected', 'Not Sent'].includes(comm.status);

  const submit = () => {
    const confirmed: ConfirmedLine[] = order.lines.map((l) => {
      const v = lines[l.sku];
      const qty = Number(v?.qty ?? l.orderedQty);
      const price = Number(v?.price ?? l.unitCost);
      return {
        sku: l.sku,
        confirmedQty: Number.isFinite(qty) && qty >= 0 ? qty : 0,
        newUnitCost: Number.isFinite(price) ? price : undefined,
        substituteName: v?.sub.trim() || undefined,
        outOfStock: Number(v?.qty ?? 0) === 0,
      };
    });
    onRecord({ outcome, externalRef: extRef.trim(), expectedDelivery: expDate, lines: confirmed, note: note.trim(), orderedLines: order.lines.map((l) => ({ sku: l.sku, name: l.name, unitCost: l.unitCost })) });
    setShowResponse(false);
    toast.success('Vendor response recorded');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="h-full overflow-y-auto shadow-2xl animate-slide-in-right" style={{ width: 680, maxWidth: '100%', background: 'var(--card)', padding: 28 }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="font-mono" style={{ fontSize: 17, fontWeight: 700 }}>{order.poNumber}</h2>
            <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 2 }}>{order.vendor} · {order.restaurant}</p>
          </div>
          <button type="button" className="btn-ghost" style={{ padding: 6 }} onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="card mb-4" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
          <p style={{ fontSize: 11.5, color: '#92400E' }}>⚠ DEMO — sending and vendor responses are simulated. Nothing is transmitted to any vendor, and stock only changes via the existing Pending Orders → Received (GRN) process.</p>
        </div>

        {[
          ['Goods receipt status', received ? `Received (GRN ${order.grnNumber ?? '—'})` : 'Pending delivery'],
          ['Vendor communication', <CommBadge key="s" status={comm.status} />],
          ['Integration method', vendor ? `${vendor.integrationType} · ${vendor.poMethod}` : 'Manual'],
          ['Vendor reference', comm.externalRef || '—'],
          ['Sent at', comm.sentAt ? formatDateTime(comm.sentAt) : '—'],
          ['Requested delivery', formatDate(order.expectedDate)],
          ['Vendor-confirmed delivery', comm.expectedDelivery ? formatDate(comm.expectedDelivery) : '—'],
          ['Retry attempts', String(comm.retryCount)],
        ].map(([l, v]) => (
          <div key={String(l)} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
          </div>
        ))}

        <div className="flex flex-wrap gap-2 my-4">
          {manual ? (
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No integration for this vendor — continue to print / send this PO manually, then record the vendor’s reply below if needed.</p>
          ) : (
            <button className="btn-primary" disabled={!canSend} onClick={onSend}>
              {comm.status === 'Failed' ? <RotateCcw size={14} /> : <Send size={14} />} {comm.status === 'Failed' ? 'Retry delivery' : 'Send to vendor'}
            </button>
          )}
          <button className="btn-secondary" disabled={!canManage || received} onClick={() => setShowResponse((s) => !s)}>Record vendor response</button>
          <button className="btn-secondary" disabled={!canCancel} onClick={onCancel}><Ban size={14} /> Cancel PO (comms)</button>
        </div>
        {!canManage && <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 8 }}>Sending and amendments are limited to administrators.</p>}

        {showResponse && (
          <div className="card mb-4">
            <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 10 }}>Manual vendor response</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select className="input-field" value={outcome} onChange={(e) => setOutcome(e.target.value as typeof outcome)} aria-label="Outcome">
                {(['Acknowledged', 'Confirmed', 'Partially Confirmed', 'Rejected'] as const).map((o) => <option key={o}>{o}</option>)}
              </select>
              <input className="input-field" placeholder="Vendor order ref" value={extRef} onChange={(e) => setExtRef(e.target.value)} />
              <input type="date" className="input-field" value={expDate} onChange={(e) => setExpDate(e.target.value)} aria-label="Confirmed delivery date" />
              <input className="input-field" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <table className="data-table">
              <thead><tr><th>Item</th><th>Ordered</th><th>Confirmed qty</th><th>Unit price</th><th>Substitute</th></tr></thead>
              <tbody>
                {order.lines.map((l) => (
                  <tr key={l.sku}>
                    <td style={{ fontSize: 12 }}>{l.name}</td>
                    <td style={{ fontSize: 12 }}>{l.orderedQty} {l.unit}</td>
                    <td><input type="number" min={0} className="input-field" style={{ width: 80 }} value={lines[l.sku]?.qty} onChange={(e) => setLines({ ...lines, [l.sku]: { ...lines[l.sku], qty: e.target.value } })} aria-label={`Confirmed qty ${l.name}`} /></td>
                    <td><input type="number" min={0} step="0.01" className="input-field" style={{ width: 80 }} value={lines[l.sku]?.price} onChange={(e) => setLines({ ...lines, [l.sku]: { ...lines[l.sku], price: e.target.value } })} aria-label={`Unit price ${l.name}`} /></td>
                    <td><input className="input-field" style={{ width: 110 }} placeholder="none" value={lines[l.sku]?.sub} onChange={(e) => setLines({ ...lines, [l.sku]: { ...lines[l.sku], sub: e.target.value } })} aria-label={`Substitute ${l.name}`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 11, color: 'var(--muted-foreground)', margin: '8px 0' }}>Price changes and substitutions are never applied automatically — they require review below.</p>
            <button className="btn-primary" onClick={submit}>Save response</button>
          </div>
        )}

        <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: '16px 0 8px' }}>Requested vs vendor-confirmed</h3>
        <table className="data-table">
          <thead><tr><th>Item</th><th>Requested</th><th>Confirmed</th><th>Unit price</th><th>Flag</th></tr></thead>
          <tbody>
            {order.lines.map((l) => {
              const c = comm.confirmedLines.find((x) => x.sku === l.sku);
              const diff = c && c.confirmedQty !== l.orderedQty;
              const priceChanged = c?.newUnitCost !== undefined && c.newUnitCost !== l.unitCost;
              return (
                <tr key={l.sku}>
                  <td style={{ fontSize: 12 }}>{l.name}</td>
                  <td style={{ fontSize: 12 }}>{l.orderedQty} {l.unit}</td>
                  <td style={{ fontSize: 12, fontWeight: diff ? 700 : 400, color: diff ? '#991B1B' : undefined }}>{c ? `${c.confirmedQty} ${l.unit}` : '—'}</td>
                  <td style={{ fontSize: 12 }}>£{l.unitCost.toFixed(2)}{priceChanged ? ` → £${c!.newUnitCost!.toFixed(2)}` : ''}</td>
                  <td style={{ fontSize: 11, color: '#92400E' }}>{c?.outOfStock ? 'Out of stock' : c?.substituteName ? `Sub: ${c.substituteName}` : diff ? 'Qty differs' : priceChanged ? 'Price change' : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {comm.pendingChanges.length > 0 && (
          <>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: '16px 0 8px' }}>Changes awaiting review</h3>
            {comm.pendingChanges.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{p.kind}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{p.description}</div>
                </div>
                {p.status === 'Awaiting review' ? (
                  <div className="flex gap-1">
                    <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} disabled={!canManage} onClick={() => onReview(p.id, 'Approved')}>Approve</button>
                    <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} disabled={!canManage} onClick={() => onReview(p.id, 'Declined')}>Decline</button>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: p.status === 'Approved' ? '#166534' : '#991B1B' }}>{p.status}</span>
                )}
              </div>
            ))}
          </>
        )}

        <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: '20px 0 8px' }}>Communication history</h3>
        {comm.events.length === 0 && <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No vendor communication recorded yet.</p>}
        <div className="flex flex-col gap-2">
          {comm.events.map((e) => (
            <div key={e.id} className="card" style={{ padding: 10 }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {e.result === 'Error' ? <AlertTriangle size={13} color="#991B1B" /> : <CheckCircle2 size={13} color="#166534" />} {e.action}
                </span>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{formatDateTime(e.at)}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 2 }}>
                {e.actor} · {e.method} · PO {e.internalRef}{e.externalRef ? ` · Vendor ref ${e.externalRef}` : ''}{e.retryAttempt > 0 ? ` · Retry #${e.retryAttempt}` : ''}
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>{e.detail}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 12 }}>Logs never include credentials. Actor: {actor}</p>
      </div>
    </div>
  );
}
