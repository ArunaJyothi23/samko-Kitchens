'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { useHydratedEposOrders } from '@/data/useHydratedEposOrders';
import { useEposMaster } from '@/data/eposMasterStore';
import { buildBatches, HotelName, isoToUk, useTraceability } from '@/data/traceability';
import {
  IssuedLine,
  ProductionBatch,
  activePrepVersion,
  addDays,
  buildPreparedBatches,
  nextBatchNo,
  planIssue,
  usePrepStore,
} from '@/data/prepStore';
import { buildPrepOrderInputs } from '@/data/prepConsumption';

interface Props {
  hotelScope: HotelName | null;
  byName: string;
  readOnly: boolean;
  canApprove: boolean;
}

const fmt = (n: number) => Number(n.toFixed(3)).toString();

export default function ProductionPanel({ hotelScope, byName, readOnly, canApprove }: Props) {
  const { state, addBatch, decideBatch, recordEvent: recordPrepEvent } = usePrepStore();
  const { grns, state: trace, recordEvent } = useTraceability();
  const { materialOf } = useEposMaster();
  const orders = useHydratedEposOrders();
  const [prepId, setPrepId] = useState('');
  const [mode, setMode] = useState<'batches' | 'yield'>('batches');
  const [target, setTarget] = useState('');
  const [actual, setActual] = useState('');
  const [otherCost, setOtherCost] = useState('');
  const [temp, setTemp] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const preps = state.preps.filter((p) => p.active && (!hotelScope || p.hotel === hotelScope) && activePrepVersion(p)?.status === 'approved');
  const prep = preps.find((p) => p.id === prepId) ?? null;
  const version = activePrepVersion(prep ?? undefined);

  const rawBatches = useMemo(
    () => buildBatches(grns.filter((g) => !prep || g.restaurant === prep.hotel), trace.events, orders, today),
    [grns, trace.events, orders, prep, today]
  );
  const prepared = useMemo(
    () => buildPreparedBatches(state.batches, state.events, buildPrepOrderInputs(orders, state.preps, state.batches), today),
    [state.batches, state.events, state.preps, orders, today]
  );

  const qty = Number(target) || 0;
  const scale = version && qty > 0 ? (mode === 'batches' ? qty : qty / Math.max(version.expectedYield, 1e-9)) : 0;
  const plan = useMemo(
    () =>
      prep && version && scale > 0
        ? planIssue(version, scale, prep.hotel, rawBatches, prepared, (sku) => materialOf(sku), (id) => {
            const p = state.preps.find((x) => x.id === id);
            return p ? { name: p.name, unit: p.unit } : undefined;
          }, today)
        : [],
    [prep, version, scale, rawBatches, prepared, materialOf, state.preps, today]
  );

  const shortfalls = plan.filter((l) => l.shortfall > 1e-6);
  const issuedCost = plan.reduce((s, l) => s + l.allocations.reduce((a, x) => a + x.qty * x.unitCost, 0), 0);
  const targetYield = version ? version.expectedYield * scale : 0;
  const actualYield = Number(actual) || 0;
  const loss = Math.max(0, targetYield - actualYield);
  const totalCost = issuedCost + (Number(otherCost) || 0);
  const unitCost = actualYield > 0 ? totalCost / actualYield : 0;
  const missingCost = plan.some((l) => l.allocations.some((a) => a.unitCost <= 0));

  const reset = () => {
    setTarget('');
    setActual('');
    setOtherCost('');
    setTemp('');
    setConfirmed(false);
  };

  const complete = () => {
    if (!prep || !version) return;
    if (readOnly) return toast.error('Your account is read-only');
    if (scale <= 0) return toast.error('Enter a batch quantity or target yield');
    if (shortfalls.length > 0) return toast.error(`Insufficient stock: ${shortfalls.map((s) => s.name).join(', ')}`);
    if (!confirmed) return toast.error('Confirm the ingredients issued for production');
    if (actualYield <= 0) return toast.error('Record the actual usable yield');
    const batchNo = nextBatchNo(state.batches, prep.hotel);
    const issued: IssuedLine[] = plan.flatMap((l) =>
      l.allocations.map((a) => ({
        sku: l.sku,
        name: l.name,
        rawBatchId: l.isPrep ? undefined : a.batchId,
        prepBatchId: l.isPrep ? a.batchId : undefined,
        grnId: l.isPrep ? undefined : a.grnId,
        supplier: a.supplier,
        quantity: a.qty,
        unit: l.unit,
        unitCost: a.unitCost,
        cost: a.qty * a.unitCost,
      }))
    );
    const b: ProductionBatch = {
      batchNo,
      prepId: prep.id,
      prepName: prep.name,
      recipeVersion: version.version,
      hotel: prep.hotel,
      unit: prep.unit,
      targetYield,
      actualYield,
      productionLoss: loss,
      issued,
      totalCost,
      otherCost: Number(otherCost) || 0,
      unitCost,
      producedAt: new Date().toISOString(),
      expiryDate: addDays(today, prep.shelfLifeDays),
      preparedBy: byName,
      approvedBy: canApprove ? byName : null,
      approvalStatus: canApprove ? 'approved' : 'pending-approval',
      storageLocation: prep.storageLocation,
      tempC: temp,
      allergens: prep.allergens,
    };
    if (!addBatch(b, byName)) return toast.error('Batch already recorded');
    // Raw material deduction – posted once, together with the batch (idempotent on batchNo).
    for (const l of plan) {
      if (l.isPrep) {
        for (const a of l.allocations) {
          // Prepared ingredient consumed into a higher-level preparation (traceable to the new batch)
          recordPrepEvent({ batchNo: a.batchId, hotel: prep.hotel, type: 'transfer-out', quantity: a.qty, by: byName, note: `Used as ingredient in ${batchNo}` });
        }
      } else {
        for (const a of l.allocations) {
          recordEvent({ batchId: a.batchId, sku: l.sku, restaurant: prep.hotel, type: 'production-issue', quantity: a.qty, by: byName, note: `Issued to ${prep.name} ${batchNo}`, prepBatchNo: batchNo });
        }
      }
    }
    toast.success(canApprove ? `${batchNo} produced and added to Prepared Inventory` : `${batchNo} recorded – awaiting approval before it joins Prepared Inventory`);
    reset();
  };

  const pending = state.batches.filter((b) => b.approvalStatus === 'pending-approval' && (!hotelScope || b.hotel === hotelScope));
  const [recent] = [state.batches.filter((b) => !hotelScope || b.hotel === hotelScope).slice(0, 8)];

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>New production run</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <label style={{ fontSize: 11 }} className="md:col-span-2">1. Select bulk preparation
            <select className="input-field" value={prepId} onChange={(e) => { setPrepId(e.target.value); reset(); }} disabled={readOnly}>
              <option value="">Choose approved preparation…</option>
              {preps.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.hotel.split(' ')[0]} (v{activePrepVersion(p)?.version})</option>)}
            </select>
          </label>
          <label style={{ fontSize: 11 }}>2. Quantity basis
            <select className="input-field" value={mode} onChange={(e) => setMode(e.target.value as 'batches' | 'yield')} disabled={!prep}>
              <option value="batches">Number of recipe batches</option>
              <option value="yield">Target yield{prep ? ` (${prep.unit})` : ''}</option>
            </select>
          </label>
          <label style={{ fontSize: 11 }}>{mode === 'batches' ? 'Batches' : `Target yield (${prep?.unit ?? ''})`}
            <input type="number" min={0} step="any" className="input-field" value={target} onChange={(e) => { setTarget(e.target.value); setConfirmed(false); }} disabled={!prep || readOnly} />
          </label>
        </div>
        {preps.length === 0 && <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No approved bulk preparations yet. Approve a recipe in the Preparation Master first.</p>}

        {prep && version && plan.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th className="col-left col-wide">3. Ingredient</th><th className="col-right">Required</th><th className="col-right">4. Available</th><th className="col-left" style={{ minWidth: 260 }}>5. FEFO source batches</th><th className="col-center">Status</th></tr></thead>
                <tbody>
                  {plan.map((l) => {
                    const avail = l.allocated + l.shortfall > 0 ? l.allocated : 0;
                    return (
                      <tr key={l.ingredientId}>
                        <td className="col-left col-wide" style={{ fontSize: 13 }}>{l.name}{l.isPrep && <span style={{ fontSize: 10, marginLeft: 6, background: '#EDE9FE', color: '#5B21B6', padding: '1px 5px', borderRadius: 3 }}>PREP</span>}</td>
                        <td className="col-right" style={{ fontSize: 12 }}>{fmt(l.required)} {l.unit}</td>
                        <td className="col-right" style={{ fontSize: 12 }}>{fmt(avail)} {l.unit}</td>
                        <td className="col-left" style={{ fontSize: 11.5, minWidth: 260 }}>
                          {l.allocations.length === 0 ? '—' : l.allocations.map((a) => (
                            <div key={a.batchId}><span className="font-mono">{a.batchId}</span> · {fmt(a.qty)} · GRN {a.grnId} · exp {isoToUk(a.expiryDate)}</div>
                          ))}
                        </td>
                        <td className="col-center nowrap">{l.shortfall > 1e-6 ? <span style={{ color: '#991B1B', fontSize: 11.5 }}><XCircle size={12} style={{ display: 'inline' }} /> short {fmt(l.shortfall)} {l.unit}</span> : <span style={{ color: '#166534', fontSize: 11.5 }}><CheckCircle2 size={12} style={{ display: 'inline' }} /> OK</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {missingCost && <p style={{ fontSize: 11.5, color: '#92400E' }}><AlertTriangle size={11} style={{ display: 'inline' }} /> Some issued batches have no purchase cost recorded – batch cost will be understated until GRN costs are entered.</p>}

            <label className="flex items-center gap-2" style={{ fontSize: 12.5 }}>
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} disabled={readOnly || shortfalls.length > 0} />
              6. Confirm the ingredients issued for production (raw stock is deducted on completion)
            </label>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <label style={{ fontSize: 11 }}>Target yield ({prep.unit})
                <input className="input-field" readOnly value={fmt(targetYield)} />
              </label>
              <label style={{ fontSize: 11 }}>7. Actual usable yield ({prep.unit})
                <input type="number" min={0} step="any" className="input-field" value={actual} onChange={(e) => setActual(e.target.value)} disabled={readOnly} />
              </label>
              <label style={{ fontSize: 11 }}>8. Production loss ({prep.unit})
                <input className="input-field" readOnly value={actualYield > 0 ? fmt(loss) : '—'} />
              </label>
              <label style={{ fontSize: 11 }}>Other direct cost (£)
                <input type="number" min={0} step="any" className="input-field" value={otherCost} onChange={(e) => setOtherCost(e.target.value)} disabled={readOnly} />
              </label>
              <label style={{ fontSize: 11 }}>Storage temp (°C)
                <input className="input-field" value={temp} onChange={(e) => setTemp(e.target.value)} disabled={readOnly} />
              </label>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { l: '9. Total batch cost', v: `£${totalCost.toFixed(2)}` },
                { l: `Cost per ${prep.unit} (usable)`, v: actualYield > 0 ? `£${unitCost.toFixed(4)}` : '—' },
                { l: 'Recipe version', v: `v${version.version}` },
                { l: 'Expiry (shelf life)', v: isoToUk(addDays(today, prep.shelfLifeDays)) },
              ].map((x) => (
                <div key={x.l} className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{x.l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{x.v}</div>
                </div>
              ))}
            </div>

            {!readOnly && (
              <button className="btn-primary" onClick={complete} disabled={shortfalls.length > 0}>
                10–12. Complete production {canApprove ? '& add to Prepared Inventory' : '(submit for approval)'}
              </button>
            )}
          </>
        )}
      </div>

      {pending.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', fontSize: 13, fontWeight: 700 }}>Awaiting approval ({pending.length})</div>
          {pending.map((b) => (
            <div key={b.batchNo} className="px-4 py-3 border-b flex items-center justify-between gap-3 flex-wrap" style={{ borderColor: 'var(--border)' }}>
              <div style={{ fontSize: 12.5 }}><strong>{b.batchNo}</strong> · {b.prepName} · {fmt(b.actualYield)} {b.unit} · by {b.preparedBy}</div>
              {canApprove && !readOnly ? (
                <div className="flex gap-2">
                  <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => { decideBatch(b.batchNo, 'approved', byName); toast.success('Approved – added to Prepared Inventory'); }}>Approve</button>
                  <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => { decideBatch(b.batchNo, 'rejected', byName); toast.success('Batch rejected'); }}>Reject</button>
                </div>
              ) : <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Needs Kitchen Manager / Owner approval</span>}
            </div>
          ))}
        </div>
      )}

      <div className="card p-0 overflow-x-auto">
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)', fontSize: 13, fontWeight: 700 }}>Recent production records</div>
        <div className="table-scroll table-scroll-y">
        <table className="data-table">
          <thead><tr><th className="col-left nowrap">Batch</th><th className="col-left col-wide">Preparation</th><th className="col-center">Ver.</th><th className="col-right">Yield</th><th className="col-right">Cost</th><th className="col-center nowrap">Produced</th><th className="col-center nowrap">Expiry</th><th className="col-left nowrap">Prepared / Approved by</th><th className="col-left" style={{ minWidth: 220 }}>Raw batches · GRNs</th></tr></thead>
          <tbody>
            {recent.length === 0 && <tr><td colSpan={9} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No production recorded yet.</td></tr>}
            {recent.map((b) => (
              <tr key={b.batchNo}>
                <td className="col-left nowrap font-mono" style={{ fontSize: 12 }}>{b.batchNo}</td>
                <td className="col-left col-wide" style={{ fontSize: 12.5 }}>{b.prepName}</td>
                <td className="col-center" style={{ fontSize: 12 }}>v{b.recipeVersion}</td>
                <td className="col-right" style={{ fontSize: 12 }}>{fmt(b.actualYield)} {b.unit}</td>
                <td className="col-right" style={{ fontSize: 12 }}>£{b.totalCost.toFixed(2)} <span style={{ color: 'var(--muted-foreground)' }}>(£{b.unitCost.toFixed(4)}/{b.unit})</span></td>
                <td className="col-center nowrap" style={{ fontSize: 12 }}>{isoToUk(b.producedAt.slice(0, 10))}</td>
                <td className="col-center nowrap" style={{ fontSize: 12 }}>{isoToUk(b.expiryDate)}</td>
                <td className="col-left nowrap" style={{ fontSize: 12 }}>{b.preparedBy} / {b.approvedBy ?? b.approvalStatus}</td>
                <td className="col-left" style={{ fontSize: 11, minWidth: 220 }}>{Array.from(new Set(b.issued.map((i) => i.rawBatchId ?? i.prepBatchId))).join(', ')} · {Array.from(new Set(b.issued.map((i) => i.grnId).filter(Boolean))).join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}

/** Placeholder replaced below – kept for type clarity. */
function usePrepEventBridge(_batchNo: string, _hotel: HotelName, _qty: number, _by: string, _into: string) {
  // Replaced at runtime by the store call; see ProductionPanel wiring.
}
