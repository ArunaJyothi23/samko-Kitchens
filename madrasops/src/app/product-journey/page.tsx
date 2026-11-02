'use client';

import React, { useMemo, useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, ChevronRight, Package, Truck, PackageCheck, ShoppingCart, ChefHat, Boxes, FileText, Archive, AlertTriangle } from 'lucide-react';
import { useScopedRestaurant, matchesScope } from '@/contexts/AuthContext';
import { useHydratedEposOrders } from '@/data/useHydratedEposOrders';
import { buildBatches, isoToUk, LEGACY_ARCHIVE, StockBatch, useTraceability } from '@/data/traceability';
import { RAW_BY_SKU, RAW_MATERIALS } from '@/data/eposMaster';
import { buildPreparedBatches, usePrepStore } from '@/data/prepStore';
import { buildPrepOrderInputs } from '@/data/prepConsumption';

type StepType = 'supplier' | 'po' | 'grn' | 'batch' | 'inventory' | 'recipe' | 'menu' | 'order' | 'event';

interface Step {
  key: string;
  type: StepType;
  title: string;
  description: string;
  date: string;
  reference: string;
  quantity?: string;
  cost?: string;
  warn?: boolean;
}

const icons: Record<StepType, React.ReactNode> = {
  supplier: <Truck size={14} />,
  po: <FileText size={14} />,
  grn: <PackageCheck size={14} />,
  batch: <Boxes size={14} />,
  inventory: <Package size={14} />,
  recipe: <ChefHat size={14} />,
  menu: <ChefHat size={14} />,
  order: <ShoppingCart size={14} />,
  event: <AlertTriangle size={14} />,
};

const colors: Record<StepType, string> = {
  supplier: '#6366F1',
  po: '#8B5CF6',
  grn: '#0EA5E9',
  batch: '#168447',
  inventory: '#0D9488',
  recipe: '#F9B233',
  menu: '#F97316',
  order: '#ED1C24',
  event: '#EF4444',
};

const fmt = (n: number) => Number(n.toFixed(3)).toString();

export default function ProductJourneyPage() {
  const scope = useScopedRestaurant();
  const orders = useHydratedEposOrders();
  const { grns, state } = useTraceability();
  const { state: prepState } = usePrepStore();
  const [mode, setMode] = useState<'forward' | 'backward' | 'archive'>('forward');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<string>('');
  const [today, setToday] = useState('');
  React.useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);

  const scopedOrders = useMemo(() => orders.filter((o) => matchesScope(scope, o.restaurant)), [orders, scope]);
  const batches = useMemo(
    () => buildBatches(grns.filter((g) => matchesScope(scope, g.restaurant)), state.events, orders, today || '0000-00-00'),
    [grns, scope, state.events, orders, today]
  );

  const preparedBatches = useMemo(
    () => buildPreparedBatches(prepState.batches, prepState.events, buildPrepOrderInputs(orders, prepState.preps, prepState.batches), today || '0000-00-00'),
    [prepState, orders, today]
  );

  const filteredOrders = scopedOrders.filter((o) => {
    const q = search.toLowerCase();
    return !q || o.orderId.toLowerCase().includes(q) || o.lines.some((l) => l.menuItem.toLowerCase().includes(q));
  });
  const order = filteredOrders.find((o) => o.orderId === selectedOrder) ?? filteredOrders[0] ?? null;

  /* ---- Forward trace: order -> menu item -> raw material -> batch -> GRN -> PO -> supplier ---- */
  const forwardSteps = useMemo<Step[]>(() => {
    if (!order) return [];
    const steps: Step[] = [];
    steps.push({ key: 'order', type: 'order', title: 'Customer Order (EPOS)', description: `${order.restaurant} · ${order.mealPeriod ?? ''} · status ${order.status}`, date: order.orderTime, reference: order.orderId, cost: `£${order.totalSelling.toFixed(2)}` });
    order.lines.forEach((l, li) => {
      steps.push({
        key: `menu-${li}`,
        type: 'menu',
        title: `EPOS Menu Item — ${l.menuItem}${l.modifiers?.length ? ` (+ ${l.modifiers.join(', ')})` : ''}`,
        description: l.recipeStatus === 'mapped' && l.consumption.length > 0 ? 'Approved recipe applied. Raw materials deducted.' : 'Recipe pending — no stock deducted until a recipe is approved.',
        date: order.orderTime,
        reference: l.menuItemId ?? '—',
        quantity: `${l.quantity} portion(s)`,
        warn: l.recipeStatus !== 'mapped' || l.consumption.length === 0,
      });
      l.consumption.forEach((c, ci) => {
        const mat = RAW_MATERIALS.find((m) => m.name === c.ingredientName);
        const prep = !mat ? prepState.preps.find((p) => p.hotel === order.restaurant && p.name === c.ingredientName) : undefined;
        if (prep) {
          steps.push({ key: `rec-${li}-${ci}`, type: 'recipe', title: `Bulk Preparation — ${prep.name}`, description: `Sub-recipe ${prep.id} used in ${l.menuItem}. Deducted from Prepared Inventory (raw ingredients not re-deducted).`, date: order.orderTime, reference: prep.id, quantity: `${fmt(c.quantity)} ${c.unit}`, cost: c.totalIngredientCost > 0 ? `£${c.totalIngredientCost.toFixed(2)}` : undefined });
          preparedBatches
            .filter((pb) => pb.prepId === prep.id && pb.consumers.some((x) => x.orderId === order.orderId && x.menuItem === l.menuItem))
            .forEach((pb) => {
              const q = pb.consumers.filter((x) => x.orderId === order.orderId && x.menuItem === l.menuItem).reduce((s, x) => s + x.quantity, 0);
              steps.push({ key: `pb-${li}-${ci}-${pb.batchNo}`, type: 'batch', title: `Prepared Batch — ${pb.batchNo}`, description: `Recipe v${pb.recipeVersion} · produced ${isoToUk(pb.producedAt.slice(0, 10))} · expiry ${isoToUk(pb.expiryDate)} · by ${pb.source.preparedBy}`, date: isoToUk(pb.producedAt.slice(0, 10)), reference: pb.batchNo, quantity: `${fmt(q)} ${pb.unit}`, cost: `£${pb.unitCost.toFixed(4)}/${pb.unit}` });
              pb.source.issued.forEach((iss, ii) => {
                steps.push({ key: `pbr-${li}-${ci}-${pb.batchNo}-${ii}`, type: 'batch', title: `Raw Material Batch — ${iss.rawBatchId ?? iss.prepBatchId} (${iss.name})`, description: `Issued to production · GRN ${iss.grnId ?? '—'}`, date: isoToUk(pb.producedAt.slice(0, 10)), reference: iss.rawBatchId ?? iss.prepBatchId ?? '—', quantity: `${fmt(iss.quantity)} ${iss.unit}` });
                steps.push({ key: `pbs-${li}-${ci}-${pb.batchNo}-${ii}`, type: 'supplier', title: `Supplier — ${iss.supplier ?? '—'}`, description: `GRN ${iss.grnId ?? '—'}`, date: isoToUk(pb.producedAt.slice(0, 10)), reference: iss.grnId ?? '—' });
              });
            });
          if (!preparedBatches.some((pb) => pb.prepId === prep.id && pb.consumers.some((x) => x.orderId === order.orderId)) && order.status === 'completed') {
            steps.push({ key: `nopb-${li}-${ci}`, type: 'batch', title: 'No prepared batch in stock', description: `No usable (unexpired, approved) batch of ${prep.name} was available for ${order.restaurant}. Complete a production run.`, date: order.orderTime, reference: '—', warn: true });
          }
          return;
        }
        steps.push({ key: `rec-${li}-${ci}`, type: 'recipe', title: `Recipe / Preparation — ${c.ingredientName}`, description: `Raw material ${mat?.sku ?? ''} used in ${l.menuItem}`, date: order.orderTime, reference: mat?.sku ?? '—', quantity: `${fmt(c.quantity)} ${c.unit}`, cost: c.totalIngredientCost > 0 ? `£${c.totalIngredientCost.toFixed(2)}` : undefined });
        const used = batches.filter((b) => b.consumers.some((x) => x.orderId === order.orderId && x.menuItem === l.menuItem) && b.name === c.ingredientName);
        used.forEach((b) => {
          const qty = b.consumers.filter((x) => x.orderId === order.orderId && x.menuItem === l.menuItem).reduce((s, x) => s + x.quantity, 0);
          steps.push({ key: `bat-${li}-${ci}-${b.batchId}`, type: 'batch', title: `Raw Material Batch — ${b.batchId}`, description: `FEFO allocation · expiry ${isoToUk(b.expiryDate)} · lot ${b.supplierLot}`, date: isoToUk(b.receivedAt.slice(0, 10)), reference: b.batchId, quantity: `${fmt(qty)} ${b.unit}` });
          steps.push({ key: `grn-${li}-${ci}-${b.batchId}`, type: 'grn', title: `Goods Received — ${b.grnId}`, description: `${b.restaurant} · ${b.poNumber}`, date: isoToUk(b.receivedAt.slice(0, 10)), reference: b.grnId, quantity: `${fmt(b.qtyReceived)} ${b.unit} accepted`, cost: b.unitCost > 0 ? `£${b.unitCost.toFixed(2)}/${b.unit}` : undefined });
          steps.push({ key: `sup-${li}-${ci}-${b.batchId}`, type: 'supplier', title: `Supplier — ${b.supplier}`, description: `Purchased ${isoToUk(b.purchaseDate)} · ${b.poNumber}`, date: isoToUk(b.purchaseDate), reference: b.supplierId });
        });
        if (used.length === 0 && order.status === 'completed') {
          steps.push({ key: `nob-${li}-${ci}`, type: 'batch', title: 'No approved batch in stock', description: `No approved GRN batch of ${c.ingredientName} exists for ${order.restaurant}. Receive and approve a GRN to allocate stock.`, date: order.orderTime, reference: '—', warn: true });
        }
      });
    });
    return steps;
  }, [order, batches, preparedBatches, prepState.preps]);

  /* ---- Backward trace: raw material -> batches -> menu items & orders ---- */
  const matBatches = useMemo(() => batches.filter((b) => b.sku === selectedSku), [batches, selectedSku]);
  const sku = selectedSku || RAW_MATERIALS[0]?.sku;
  const usedBy = useMemo(() => {
    const map = new Map<string, { menuItem: string; orders: Set<string>; qty: number; unit: string }>();
    matBatches.forEach((b) =>
      b.consumers.forEach((c) => {
        const e = map.get(c.menuItem) ?? { menuItem: c.menuItem, orders: new Set<string>(), qty: 0, unit: b.unit };
        e.orders.add(c.orderId);
        e.qty += c.quantity;
        map.set(c.menuItem, e);
      })
    );
    return Array.from(map.values());
  }, [matBatches]);

  /** Backward recall: prepared batches that used this material's batches, and the menu items/orders they served. */
  const viaPrep = useMemo(() => {
    const ids = new Set(batches.filter((b) => b.sku === (selectedSku || RAW_MATERIALS[0]?.sku)).map((b) => b.batchId));
    return preparedBatches
      .filter((pb) => pb.source.issued.some((i) => i.rawBatchId && ids.has(i.rawBatchId)))
      .map((pb) => ({
        batchNo: pb.batchNo,
        prepName: pb.prepName,
        hotel: pb.hotel,
        raw: Array.from(new Set(pb.source.issued.filter((i) => i.rawBatchId && ids.has(i.rawBatchId)).map((i) => i.rawBatchId as string))),
        items: Array.from(new Set(pb.consumers.map((c) => c.menuItem))),
        orders: Array.from(new Set(pb.consumers.map((c) => c.orderId))),
      }));
  }, [batches, selectedSku, preparedBatches]);

  const legacy = LEGACY_ARCHIVE.filter((l) => l.kind === 'Journey');

  const tabBtn = (k: typeof mode, label: string) => (
    <button key={k} onClick={() => setMode(k)} className="rounded-full px-4 py-1.5" style={{ fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: mode === k ? 'var(--primary)' : 'var(--muted)', color: mode === k ? '#fff' : 'var(--muted-foreground)' }}>{label}</button>
  );

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="page-title">Product Journey</h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
          {scope ?? 'Both Hotels'} · Supplier → Purchase Order → GRN → Raw Material Batch → Inventory → Recipe → EPOS Menu Item → Customer Order
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {tabBtn('forward', 'Order → Supplier (backward trace)')}
        {tabBtn('backward', 'Raw Material → Menu Items (forward trace)')}
        {tabBtn('archive', `Archived Legacy (${legacy.length})`)}
      </div>

      {mode === 'archive' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 flex items-start gap-2" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <Archive size={14} style={{ color: '#92400E', marginTop: 2 }} />
            <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>Read-only journeys from the previous South Indian menu. Retained for audit; not assigned to either hotel and not mapped to the new menu or raw materials.</p>
          </div>
          {legacy.map((l) => (
            <div key={l.id} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', opacity: 0.85 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{l.item} <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{l.reference}</span></div>
              <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l.detail} · {l.location} · {isoToUk(l.date)}</div>
            </div>
          ))}
        </div>
      )}

      {mode === 'forward' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>EPOS Orders</h3>
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                  <input className="input-field pl-8 w-full" placeholder="Search order or menu item…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 640 }}>
                {filteredOrders.map((o) => (
                  <div key={o.orderId} className="px-4 py-3 border-b cursor-pointer" style={{ borderColor: 'var(--border)', background: order?.orderId === o.orderId ? 'var(--accent)' : 'transparent' }} onClick={() => setSelectedOrder(o.orderId)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{o.lines.map((l) => l.menuItem).slice(0, 2).join(', ')}{o.lines.length > 2 ? ` +${o.lines.length - 2}` : ''}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{o.orderId}</div>
                      </div>
                      <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>{o.restaurantCode} · {o.orderTime} · {o.status}</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      <span style={{ color: '#166534', fontWeight: 600 }}>£{o.totalSelling.toFixed(2)}</span>
                      <span style={{ color: 'var(--muted-foreground)' }}> · Cost: </span>
                      <span style={{ color: '#991B1B', fontWeight: 600 }}>{o.totalRecipeCost > 0 ? `£${o.totalRecipeCost.toFixed(2)}` : 'Recipe pending'}</span>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && <div className="px-4 py-10 text-center" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No orders for this hotel.</div>}
              </div>
            </div>
          </div>

          {order && (
            <div className="lg:col-span-2 space-y-4">
              <div className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 style={{ fontSize: 17, fontWeight: 700 }}>{order.orderId}</h2>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{order.restaurant} · {order.orderTime} · {order.mealPeriod}</div>
                  </div>
                  <div className="text-right">
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Selling Price</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#166534' }}>£{order.totalSelling.toFixed(2)}</div>
                    <div style={{ fontSize: 11, color: '#991B1B' }}>{order.totalRecipeCost > 0 ? `Ingredient cost £${order.totalRecipeCost.toFixed(2)}` : 'Ingredient cost: recipe pending'}</div>
                  </div>
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Full Traceability Chain</h3>
                {forwardSteps.map((s, idx) => (
                  <div key={s.key} className="flex gap-4 mb-5 relative">
                    {idx < forwardSteps.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px" style={{ background: 'var(--border)' }} />}
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: colors[s.type] + '22', color: colors[s.type], border: `2px solid ${colors[s.type]}` }}>{icons[s.type]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{s.title}</span>
                        {s.warn && <span style={{ fontSize: 10, color: '#92400E', background: '#FEF9C3', padding: '1px 6px', borderRadius: 3 }}>Attention</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{s.description}</div>
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.date}</span>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>{s.reference}</span>
                        {s.quantity && <span style={{ fontSize: 11, fontWeight: 600 }}>{s.quantity}</span>}
                        {s.cost && <span style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>{s.cost}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'backward' && (
        <div className="space-y-4">
          <div className="card">
            <label className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>Raw material (central master)</label>
            <select className="input-field" style={{ maxWidth: 420 }} value={sku} onChange={(e) => setSelectedSku(e.target.value)}>
              {RAW_MATERIALS.map((m) => <option key={m.sku} value={m.sku}>{m.name} — {m.category}</option>)}
            </select>
            <p style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 6 }}>{RAW_BY_SKU[sku]?.name} · {sku}</p>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>Batches received</h3></div>
            {(sku === selectedSku ? matBatches : batches.filter((b) => b.sku === sku)).length === 0 ? (
              <div className="px-4 py-8 text-center" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No approved batches for this raw material{scope ? ` in ${scope}` : ''}.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 820 }}>
                  <thead>
                    <tr style={{ background: 'var(--muted)' }}>
                      {['Batch', 'Hotel', 'Supplier', 'GRN', 'Purchased', 'Expiry', 'Received', 'Consumed', 'Wasted/Exp.', 'Remaining'].map((h) => (
                        <th key={h} className="text-left label-text" style={{ padding: '10px 12px', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {batches.filter((b) => b.sku === sku).map((b: StockBatch) => (
                      <tr key={`${b.restaurantCode}-${b.batchId}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }} className="font-mono">{b.batchId}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{b.restaurantCode}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{b.supplier}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }} className="font-mono">{b.grnId}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{isoToUk(b.purchaseDate)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{isoToUk(b.expiryDate)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{fmt(b.qtyReceived)} {b.unit}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{fmt(b.qtyConsumed)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5 }}>{fmt(b.qtyWasted + b.qtyExpired + b.qtyRejected)}</td>
                        <td style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 600 }}>{fmt(b.qtyRemaining)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>EPOS menu items that used this raw material</h3></div>
            {(() => {
              const rows = (sku === selectedSku ? usedBy : (() => {
                const map = new Map<string, { menuItem: string; orders: Set<string>; qty: number; unit: string }>();
                batches.filter((b) => b.sku === sku).forEach((b) => b.consumers.forEach((c) => {
                  const e = map.get(c.menuItem) ?? { menuItem: c.menuItem, orders: new Set<string>(), qty: 0, unit: b.unit };
                  e.orders.add(c.orderId); e.qty += c.quantity; map.set(c.menuItem, e);
                }));
                return Array.from(map.values());
              })());
              if (rows.length === 0) return <div className="px-4 py-8 text-center" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No EPOS consumption recorded yet (requires an approved recipe and an approved batch).</div>;
              return rows.map((r) => (
                <div key={r.menuItem} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{r.menuItem} <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--muted-foreground)' }}>· {fmt(r.qty)} {r.unit}</span></div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{Array.from(r.orders).join(', ')}</div>
                </div>
              ));
            })()}
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>Bulk preparation batches that used this raw material (recall trace)</h3></div>
            {viaPrep.length === 0 ? (
              <div className="px-4 py-8 text-center" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No bulk preparation has used this material yet.</div>
            ) : (
              viaPrep.map((v) => (
                <div key={v.batchNo} className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{v.prepName} <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{v.batchNo}</span> · {v.hotel}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Raw batches: {v.raw.join(', ')}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Menu items served: {v.items.join(', ') || 'none yet'}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>Orders: {v.orders.join(', ') || '—'}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}
