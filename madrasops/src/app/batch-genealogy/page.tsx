'use client';

import React, { useMemo, useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, ChevronRight, Package, Truck, PackageCheck, AlertTriangle, Download, Archive, ClipboardList, ChefHat } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useScopedRestaurant, matchesScope } from '@/contexts/AuthContext';
import { useHydratedEposOrders } from '@/data/useHydratedEposOrders';
import { buildBatches, HotelName, isoToUk, LEGACY_ARCHIVE, StockBatch, StockEventType, useTraceability } from '@/data/traceability';
import { RAW_BY_SKU } from '@/data/eposMaster';
import { buildPreparedBatches, usePrepStore } from '@/data/prepStore';
import { buildPrepOrderInputs } from '@/data/prepConsumption';

interface TimelineNode {
  id: string;
  type: 'supplier' | 'grn' | 'inventory' | 'consumption' | 'event';
  label: string;
  detail: string;
  date: string;
  quantity: string;
  warn?: boolean;
}

const typeIcons: Record<TimelineNode['type'], React.ReactNode> = {
  supplier: <Truck size={14} />,
  grn: <PackageCheck size={14} />,
  inventory: <Package size={14} />,
  consumption: <ChefHat size={14} />,
  event: <AlertTriangle size={14} />,
};

const typeColors: Record<TimelineNode['type'], string> = {
  supplier: '#6366F1',
  grn: '#0EA5E9',
  inventory: '#168447',
  consumption: '#ED1C24',
  event: '#EF4444',
};

const statusColors: Record<StockBatch['status'], { bg: string; text: string }> = {
  active: { bg: '#DCFCE7', text: '#166534' },
  depleted: { bg: '#F3F4F6', text: '#6B7280' },
  expired: { bg: '#FEE2E2', text: '#991B1B' },
  quarantined: { bg: '#FEF9C3', text: '#854D0E' },
};

const fmt = (n: number) => Number(n.toFixed(3)).toString();

export default function BatchGenealogyPage() {
  const scope = useScopedRestaurant();
  const { user, readOnly } = useAuth();
  const orders = useHydratedEposOrders();
  const { grns, state, recordEvent, hydrated } = useTraceability();
  const { state: prepState } = usePrepStore();
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [evt, setEvt] = useState<{ type: StockEventType; qty: string; note: string }>({ type: 'wastage', qty: '', note: '' });

  const [today, setToday] = useState('');
  React.useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);

  const batches = useMemo(() => {
    const scoped = grns.filter((g) => matchesScope(scope, g.restaurant));
    return buildBatches(scoped, state.events, orders, today || '0000-00-00');
  }, [grns, scope, state.events, orders, today]);

  const filtered = batches.filter((b) => {
    const q = search.toLowerCase();
    return !q || b.batchId.toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || b.sku.toLowerCase().includes(q) || b.supplier.toLowerCase().includes(q) || b.grnId.toLowerCase().includes(q);
  });

  const keyOf = (b: StockBatch) => `${b.restaurantCode}:${b.batchId}`;
  const selected = filtered.find((b) => keyOf(b) === selectedKey) ?? filtered[0] ?? null;

  const nodes = useMemo<TimelineNode[]>(() => {
    if (!selected) return [];
    const unit = selected.unit;
    const list: TimelineNode[] = [
      { id: 'n-sup', type: 'supplier', label: `Supplier — ${selected.supplier}`, detail: `${selected.poNumber} · Supplier lot ${selected.supplierLot}`, date: isoToUk(selected.purchaseDate), quantity: `${fmt(selected.qtyReceived)} ${unit} ordered` },
      { id: 'n-grn', type: 'grn', label: `Goods Received — ${selected.grnId}`, detail: `${selected.restaurant} · batch ${selected.batchId} · expiry ${isoToUk(selected.expiryDate)}`, date: isoToUk(selected.receivedAt.slice(0, 10)), quantity: `${fmt(selected.qtyReceived)} ${unit} accepted` },
      { id: 'n-inv', type: 'inventory', label: 'Posted to Inventory', detail: `${selected.name} (${selected.sku}) · ${selected.restaurant}`, date: isoToUk(selected.receivedAt.slice(0, 10)), quantity: `${fmt(selected.qtyRemaining)} ${unit} remaining` },
    ];
    selected.consumers.forEach((c, i) =>
      list.push({ id: `n-c${i}`, type: 'consumption', label: `EPOS Consumption — ${c.menuItem}`, detail: `Order ${c.orderId} · recipe preparation → EPOS menu item`, date: c.at, quantity: `${fmt(c.quantity)} ${unit} used` })
    );
    // Bulk preparation production that issued this raw batch, and the EPOS orders served from the resulting prepared batch
    const preparedAll = buildPreparedBatches(prepState.batches, prepState.events, buildPrepOrderInputs(orders, prepState.preps, prepState.batches), today || '0000-00-00');
    prepState.batches
      .filter((pb) => pb.hotel === selected.restaurant && pb.issued.some((i) => i.rawBatchId === selected.batchId))
      .forEach((pb, i) => {
        const used = pb.issued.filter((x) => x.rawBatchId === selected.batchId).reduce((s, x) => s + x.quantity, 0);
        list.push({ id: `n-prep${i}`, type: 'event', label: `Bulk Preparation — ${pb.prepName} (${pb.batchNo})`, detail: `Recipe v${pb.recipeVersion} · yield ${fmt(pb.actualYield)} ${pb.unit} · expiry ${isoToUk(pb.expiryDate)} · by ${pb.preparedBy}`, date: isoToUk(pb.producedAt.slice(0, 10)), quantity: `${fmt(used)} ${unit} issued` });
        const pre = preparedAll.find((x) => x.batchNo === pb.batchNo && x.hotel === pb.hotel);
        pre?.consumers.forEach((c, j) =>
          list.push({ id: `n-prep${i}-o${j}`, type: 'consumption', label: `EPOS Order via ${pb.prepName} — ${c.menuItem}`, detail: `Order ${c.orderId} · prepared batch ${pb.batchNo} → EPOS menu item`, date: c.at, quantity: `${fmt(c.quantity)} ${pb.unit} used` })
        );
      });
    state.events
      .filter((e) => e.batchId === selected.batchId && e.restaurant === selected.restaurant && e.type !== 'production-issue')
      .forEach((e) =>
        list.push({ id: e.id, type: 'event', label: e.type.replace('-', ' ').replace(/^./, (c) => c.toUpperCase()), detail: `${e.note || 'No note'} · by ${e.by}`, date: isoToUk(e.at.slice(0, 10)), quantity: `${fmt(e.quantity)} ${unit}`, warn: true })
      );
    return list;
  }, [selected, state.events, prepState, orders, today]);

  const legacy = LEGACY_ARCHIVE.filter((l) => l.kind === 'Batch');

  const submitEvent = () => {
    if (!selected) return;
    if (readOnly) return toast.error('Your account is read-only');
    const q = Number(evt.qty);
    if (!q || (evt.type !== 'adjustment' && q < 0)) return toast.error('Enter a valid quantity');
    recordEvent({ batchId: selected.batchId, sku: selected.sku, restaurant: selected.restaurant as HotelName, type: evt.type, quantity: q, by: user?.name ?? 'User', note: evt.note });
    toast.success('Stock movement recorded against batch');
    setEvt({ ...evt, qty: '', note: '' });
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Batch Genealogy</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            {scope ?? 'Both Hotels'} · Supplier → GRN → raw material batch → inventory → EPOS consumption
          </p>
        </div>
        <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => toast.success('Trace exported')}><Download size={14} /> Export Trace</button>
      </div>

      <div className="flex gap-2 mb-4">
        {([['active', `Active Batches (${batches.length})`], ['archive', `Archived Legacy (${legacy.length})`]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className="rounded-full px-4 py-1.5" style={{ fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === k ? 'var(--primary)' : 'var(--muted)', color: tab === k ? '#fff' : 'var(--muted-foreground)' }}>{label}</button>
        ))}
      </div>

      {tab === 'archive' ? (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 flex items-start gap-2" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <Archive size={14} style={{ color: '#92400E', marginTop: 2 }} />
            <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>Read-only history from the previous South Indian inventory. Not assigned to either hotel and not mapped to the new Raw Material Master.</p>
          </div>
          {legacy.map((l) => (
            <div key={l.id} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', opacity: 0.85 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l.item} <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{l.reference}</span></div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l.detail} · {l.location} · {isoToUk(l.date)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                  <input className="input-field pl-8 w-full" placeholder="Search batch, ingredient, supplier, GRN…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 640 }}>
                {hydrated && filtered.length === 0 && (
                  <div className="px-4 py-10 text-center" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No approved batches yet. Batches appear once a GRN is approved.</div>
                )}
                {filtered.map((b) => (
                  <div key={keyOf(b)} className="px-4 py-3 border-b cursor-pointer transition-colors" style={{ borderColor: 'var(--border)', background: selected && keyOf(selected) === keyOf(b) ? 'var(--accent)' : 'transparent' }} onClick={() => setSelectedKey(keyOf(b))}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{b.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{b.batchId}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: statusColors[b.status].bg, color: statusColors[b.status].text, textTransform: 'capitalize' }}>{b.status}</span>
                        <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>{b.restaurantCode} · {b.supplier} · Expires {isoToUk(b.expiryDate)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>{selected.name}</h2>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'monospace', marginTop: 2 }}>{selected.batchId} · {selected.sku} · {RAW_BY_SKU[selected.sku]?.category}</div>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: statusColors[selected.status].bg, color: statusColors[selected.status].text, textTransform: 'uppercase' }}>{selected.status}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Received', value: `${fmt(selected.qtyReceived)} ${selected.unit}` },
                    { label: 'Consumed (EPOS)', value: `${fmt(selected.qtyConsumed)} ${selected.unit}` },
                    { label: 'Wasted / Expired', value: `${fmt(selected.qtyWasted + selected.qtyExpired)} ${selected.unit}` },
                    { label: 'Remaining', value: `${fmt(selected.qtyRemaining)} ${selected.unit}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    ['Hotel', selected.restaurant],
                    ['Supplier', selected.supplier],
                    ['Supplier Lot', selected.supplierLot],
                    ['GRN / PO', `${selected.grnId} / ${selected.poNumber}`],
                    ['Purchase Date', isoToUk(selected.purchaseDate)],
                    ['Expiry Date', isoToUk(selected.expiryDate)],
                    ['Unit Cost', selected.unitCost > 0 ? `£${selected.unitCost.toFixed(2)} / ${selected.unit}` : 'Not yet entered'],
                    ['EPOS Orders', selected.consumers.length ? Array.from(new Set(selected.consumers.map((c) => c.orderId))).join(', ') : 'None yet'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{k}: </span>
                      <span style={{ fontSize: 12 }}>{v}</span>
                    </div>
                  ))}
                </div>
                {selected.consumers.length === 0 && (
                  <p className="mt-3" style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>No consumption linked yet — EPOS orders deduct stock only once the related recipe is approved.</p>
                )}
              </div>

              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Batch Journey Timeline</h3>
                <div className="relative">
                  {nodes.map((node, idx) => (
                    <div key={node.id} className="flex gap-4 mb-4 relative">
                      {idx < nodes.length - 1 && <div className="absolute left-5 top-8 bottom-0 w-px" style={{ background: 'var(--border)' }} />}
                      <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: typeColors[node.type] + '22', color: typeColors[node.type], border: `2px solid ${typeColors[node.type]}` }}>{typeIcons[node.type]}</div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{node.label}</span>
                          {node.warn && <span style={{ fontSize: 10, color: '#92400E', background: '#FEF9C3', padding: '1px 6px', borderRadius: 3 }}>Stock movement</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{node.detail}</div>
                        <div className="flex gap-4 mt-1">
                          <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{node.date}</span>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{node.quantity}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList size={16} />
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>Record Stock Movement</h3>
                </div>
                <div className="grid grid-cols-4 gap-2 items-end">
                  <select className="input-field" value={evt.type} onChange={(e) => setEvt({ ...evt, type: e.target.value as StockEventType })} disabled={readOnly}>
                    <option value="wastage">Wastage</option>
                    <option value="expired">Expired</option>
                    <option value="rejected">Rejected</option>
                    <option value="transfer-out">Transfer out</option>
                    <option value="adjustment">Adjustment (+/−)</option>
                  </select>
                  <input type="number" step="any" className="input-field" placeholder={`Qty (${selected.unit})`} value={evt.qty} onChange={(e) => setEvt({ ...evt, qty: e.target.value })} disabled={readOnly} />
                  <input className="input-field" placeholder="Reason / note" value={evt.note} onChange={(e) => setEvt({ ...evt, note: e.target.value })} disabled={readOnly} />
                  <button className="btn-primary justify-center" onClick={submitEvent} disabled={readOnly} style={{ opacity: readOnly ? 0.6 : 1 }}>Record</button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8 }}>Adjustment quantity: positive adds stock, negative removes it. Movements stay within {selected.restaurant}.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}
