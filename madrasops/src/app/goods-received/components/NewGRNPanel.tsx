'use client';

import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { RAW_CATEGORIES, StockUnit, RECIPE_UNITS } from '@/data/eposMaster';
import { useEposMaster } from '@/data/eposMasterStore';
import { GRN, GRNLine, HOTEL_CODE, HotelName, SUPPLIER_LIST, nextGrnNumber, useTraceability } from '@/data/traceability';
import { useAuth, HOTELS } from '@/contexts/AuthContext';

interface DraftLine {
  key: string;
  sku: string;
  qty: string;
  unitCost: string;
  expiry: string;
  lot: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

export default function NewGRNPanel({ onClose }: { onClose: () => void }) {
  const { user, lockedRestaurant, activeScope, readOnly } = useAuth();
  const { state, addMaterial } = useEposMaster();
  const { grns, addGrn } = useTraceability();

  const [hotel, setHotel] = useState<HotelName>((lockedRestaurant ?? activeScope ?? HOTELS[0].name) as HotelName);
  const [supplierId, setSupplierId] = useState(SUPPLIER_LIST[0].id);
  const [poNumber, setPoNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(todayIso());
  const [lines, setLines] = useState<DraftLine[]>([{ key: 'l0', sku: '', qty: '', unitCost: '', expiry: '', lot: '' }]);
  const [newItem, setNewItem] = useState({ name: '', category: RAW_CATEGORIES[0], unit: 'kg' as StockUnit });
  const [showNew, setShowNew] = useState(false);

  // Only active items of the centralised master; deactivated / legacy items are never offered.
  const active = useMemo(() => state.materials.filter((m) => !state.inactive.includes(m.sku)), [state.materials, state.inactive]);
  const grouped = useMemo(() => RAW_CATEGORIES.map((c) => ({ c, items: active.filter((m) => m.category === c) })).filter((g) => g.items.length), [active]);

  const patch = (key: string, p: Partial<DraftLine>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  const pickSku = (key: string, sku: string) => {
    const m = state.materials.find((x) => x.sku === sku);
    patch(key, { sku, unitCost: m && m.unitCost > 0 ? String(m.unitCost) : '' });
  };

  const createItem = () => {
    if (!newItem.name.trim()) return;
    const sku = `RM-X-${String(state.materials.length + 1).padStart(3, '0')}`;
    const ok = addMaterial({ sku, name: newItem.name.trim(), category: newItem.category, unit: newItem.unit, unitCost: 0 }, user?.name ?? 'User');
    if (!ok) {
      toast.error('An ingredient with this name already exists in the master');
      return;
    }
    toast.success(`${newItem.name.trim()} added to the Raw Material Master`);
    setNewItem({ ...newItem, name: '' });
    setShowNew(false);
  };

  const submit = () => {
    if (readOnly) return toast.error('Your account is read-only');
    const valid = lines.filter((l) => l.sku && Number(l.qty) > 0);
    if (valid.length === 0) return toast.error('Add at least one raw material with a quantity');
    if (valid.some((l) => !l.expiry)) return toast.error('Expiry date is required for every line');
    const supplier = SUPPLIER_LIST.find((s) => s.id === supplierId)!;
    const code = HOTEL_CODE[hotel];
    const grnId = nextGrnNumber(grns, code);
    const seq = grnId.split('-').pop()!;
    const built: GRNLine[] = valid.map((l, i) => {
      const m = state.materials.find((x) => x.sku === l.sku)!;
      return {
        id: `${grnId}-l${i + 1}`,
        sku: m.sku,
        productName: m.name,
        batchId: `BAT-${code}-${seq}${String(i + 1).padStart(2, '0')}`,
        supplierLot: l.lot || `${supplier.id}-${seq}${i + 1}`,
        expectedQty: Number(l.qty),
        receivedQty: null,
        acceptedQty: null,
        rejectedQty: null,
        unit: m.unit,
        unitCost: Number(l.unitCost) || 0,
        expiryDate: l.expiry,
        temperature: null,
        condition: 'pending',
        note: '',
      };
    });
    const grn: GRN = {
      id: `grn-${code.toLowerCase()}-${Date.now().toString(36)}`,
      grnId,
      poNumber: poNumber.trim() || `PO-${code}-${seq}`,
      supplierId: supplier.id,
      supplier: supplier.name,
      restaurant: hotel,
      restaurantCode: code,
      receivedBy: 'Pending',
      receivedAt: 'Awaiting delivery',
      purchaseDate,
      status: 'pending',
      approvalStatus: 'pending',
      approvedBy: null,
      notes: '',
      lines: built,
    };
    addGrn(grn);
    toast.success(`${grnId} created for ${hotel}. Verify on delivery to post stock.`);
    onClose();
  };

  const hotelLocked = !!lockedRestaurant;

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col overflow-y-auto animate-slide-in-right" style={{ width: 680, maxWidth: '100vw', background: 'var(--card)', borderLeft: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg flex items-center justify-center" style={{ width: 36, height: 36, background: '#DBEAFE', color: '#1E40AF' }}><PackagePlus size={18} /></div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15 }}>New Goods Received Note</h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Ingredients come from the central Raw Material Master</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>Hotel</label>
              <select className="input-field" value={hotel} disabled={hotelLocked} onChange={(e) => setHotel(e.target.value as HotelName)}>
                {HOTELS.map((h) => <option key={h.name} value={h.name}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>Supplier</label>
              <select className="input-field" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
                {SUPPLIER_LIST.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>Purchase Order No. (optional)</label>
              <input className="input-field" value={poNumber} onChange={(e) => setPoNumber(e.target.value)} placeholder="Auto-generated if blank" />
            </div>
            <div>
              <label className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>Purchase Date</label>
              <input type="date" className="input-field" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold" style={{ fontSize: 14 }}>Raw Materials</h3>
              <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => setShowNew((v) => !v)}>
                <Plus size={12} /> New inventory item
              </button>
            </div>

            {showNew && (
              <div className="rounded-lg p-3 mb-3 grid grid-cols-4 gap-2 items-end" style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
                <div className="col-span-2">
                  <label className="label-text block mb-1" style={{ fontSize: 11 }}>Name</label>
                  <input className="input-field" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Duck breast" />
                </div>
                <div>
                  <label className="label-text block mb-1" style={{ fontSize: 11 }}>Category</label>
                  <select className="input-field" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}>
                    {RAW_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-text block mb-1" style={{ fontSize: 11 }}>Unit</label>
                  <select className="input-field" value={newItem.unit} onChange={(e) => setNewItem({ ...newItem, unit: e.target.value as StockUnit })}>
                    {RECIPE_UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </div>
                <div className="col-span-4">
                  <button type="button" className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={createItem}>Add to Raw Material Master</button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {lines.map((l) => {
                const m = state.materials.find((x) => x.sku === l.sku);
                return (
                  <div key={l.key} className="rounded-lg p-3" style={{ border: '1px solid var(--border)', background: 'var(--muted)' }}>
                    <div className="grid grid-cols-6 gap-2 items-end">
                      <div className="col-span-3">
                        <label className="label-text block mb-1" style={{ fontSize: 11 }}>Ingredient</label>
                        <select className="input-field" value={l.sku} onChange={(e) => pickSku(l.key, e.target.value)}>
                          <option value="">Select raw material…</option>
                          {grouped.map((g) => (
                            <optgroup key={g.c} label={g.c}>
                              {g.items.map((i) => <option key={i.sku} value={i.sku}>{i.name} ({i.unit})</option>)}
                            </optgroup>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11 }}>Qty {m ? `(${m.unit})` : ''}</label>
                        <input type="number" min={0} step="any" className="input-field" value={l.qty} onChange={(e) => patch(l.key, { qty: e.target.value })} />
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11 }}>Cost / unit (£)</label>
                        <input type="number" min={0} step="any" className="input-field" value={l.unitCost} onChange={(e) => patch(l.key, { unitCost: e.target.value })} />
                      </div>
                      <div className="flex justify-end">
                        {lines.length > 1 && (
                          <button type="button" className="btn-ghost p-2" aria-label="Remove line" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><Trash2 size={14} /></button>
                        )}
                      </div>
                      <div className="col-span-3">
                        <label className="label-text block mb-1" style={{ fontSize: 11 }}>Expiry date</label>
                        <input type="date" className="input-field" value={l.expiry} onChange={(e) => patch(l.key, { expiry: e.target.value })} />
                      </div>
                      <div className="col-span-3">
                        <label className="label-text block mb-1" style={{ fontSize: 11 }}>Supplier lot (optional)</label>
                        <input className="input-field" value={l.lot} onChange={(e) => patch(l.key, { lot: e.target.value })} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button type="button" className="btn-secondary mt-3" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setLines((ls) => [...ls, { key: `l${Date.now()}`, sku: '', qty: '', unitCost: '', expiry: '', lot: '' }])}>
              <Plus size={12} /> Add line
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex gap-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
          <button type="button" className="btn-primary flex-1 justify-center" onClick={submit} disabled={readOnly} style={{ opacity: readOnly ? 0.6 : 1 }}>Create GRN</button>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ minWidth: 90 }}>Cancel</button>
        </div>
      </div>
    </>
  );
}
