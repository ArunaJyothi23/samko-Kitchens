'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, Save, CheckCircle2, Copy, Power, AlertTriangle } from 'lucide-react';
import { useEposMaster } from '@/data/eposMasterStore';
import { RECIPE_UNITS, StockUnit } from '@/data/eposMaster';
import {
  ALLERGENS,
  PREP_CATEGORIES,
  PrepIngredient,
  PrepVersion,
  Preparation,
  activePrepVersion,
  emptyPrepVersion,
  estimateVersionCost,
  latestUnitCost,
  nextPrepId,
  usePrepStore,
} from '@/data/prepStore';
import { HotelName } from '@/data/traceability';
import { HOTELS } from '@/contexts/AuthContext';

const gbp = (n: number) => `£${n.toFixed(2)}`;
const STOCK_UNITS: StockUnit[] = ['kg', 'litre', 'g', 'ml', 'piece', 'portion'];

interface Props {
  hotelScope: HotelName | null;
  byName: string;
  readOnly: boolean;
}

export default function PrepMasterPanel({ hotelScope, byName, readOnly }: Props) {
  const { state, savePrep } = usePrepStore();
  const { state: master, materialOf } = useEposMaster();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', category: PREP_CATEGORIES[0], unit: 'kg' as StockUnit, hotel: (hotelScope ?? HOTELS[0].name) as HotelName });
  const [draft, setDraft] = useState<PrepVersion | null>(null);
  const [search, setSearch] = useState('');

  const list = state.preps.filter((p) => !hotelScope || p.hotel === hotelScope);
  const selected = list.find((p) => p.id === selectedId) ?? null;
  const current = activePrepVersion(selected ?? undefined);
  const working: PrepVersion | null = selected ? draft ?? current ?? emptyPrepVersion(1, byName) : null;

  const prepCost = (id: string) => {
    const p = state.preps.find((x) => x.id === id);
    return p ? { unit: p.unit, unitCost: latestUnitCost(state.batches, p.id) } : undefined;
  };
  const est = useMemo(
    () => estimateVersionCost(working ?? undefined, (sku) => materialOf(sku), prepCost),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [working, materialOf, state.batches, state.preps]
  );

  const activeMaterials = master.materials.filter((m) => !master.inactive.includes(m.sku));
  const matches = search
    ? [
        ...activeMaterials.filter((m) => m.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6).map((m) => ({ key: m.sku, name: m.name, sub: `${m.category} · per ${m.unit}`, isPrep: false, unit: m.unit })),
        ...list
          .filter((p) => p.active && p.id !== selected?.id && p.hotel === selected?.hotel && p.name.toLowerCase().includes(search.toLowerCase()))
          .slice(0, 4)
          .map((p) => ({ key: p.id, name: p.name, sub: 'Bulk preparation', isPrep: true, unit: p.unit })),
      ]
    : [];

  const edit = (patch: Partial<PrepVersion>) => working && setDraft({ ...working, ...patch });
  const editIng = (id: string, patch: Partial<PrepIngredient>) => working && edit({ ingredients: working.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) });

  const addIng = (key: string, isPrep: boolean, stockUnit: StockUnit) => {
    if (!working) return;
    const unit: StockUnit = stockUnit === 'kg' ? 'g' : stockUnit === 'litre' ? 'ml' : stockUnit;
    edit({ ingredients: [...working.ingredients, { id: `i-${Date.now().toString(36)}-${working.ingredients.length}`, sku: key, isPrep, quantity: 0, unit }] });
    setSearch('');
  };

  const createPrep = () => {
    if (readOnly) return toast.error('Your account is read-only');
    if (!form.name.trim()) return toast.error('Enter a preparation name');
    if (state.preps.some((p) => p.hotel === form.hotel && p.name.toLowerCase() === form.name.trim().toLowerCase())) return toast.error('A preparation with this name already exists for this hotel');
    const p: Preparation = {
      id: nextPrepId(state.preps, form.hotel),
      hotel: form.hotel,
      name: form.name.trim(),
      category: form.category,
      description: '',
      unit: form.unit,
      storageLocation: 'Chilled store',
      shelfLifeDays: 3,
      allergens: [],
      active: true,
      versions: [emptyPrepVersion(1, byName)],
      createdAt: new Date().toISOString(),
      createdBy: byName,
    };
    savePrep(p, byName, `Created preparation ${p.name}`);
    setSelectedId(p.id);
    setCreating(false);
    setForm({ ...form, name: '' });
    toast.success(`${p.id} created`);
  };

  const patchPrep = (patch: Partial<Preparation>, detail: string) => {
    if (!selected || readOnly) return;
    savePrep({ ...selected, ...patch }, byName, detail);
  };

  const saveVersion = (status: 'draft' | 'approved') => {
    if (!selected || !working || readOnly) return;
    if (status === 'approved' && working.ingredients.length === 0) return toast.error('Add at least one ingredient');
    if (status === 'approved' && (working.expectedYield <= 0 || working.ingredients.some((i) => i.quantity <= 0))) return toast.error('Enter expected yield and all ingredient quantities');
    const v: PrepVersion = { ...working, status, updatedAt: new Date().toISOString(), updatedBy: byName };
    const versions = [...selected.versions.filter((x) => x.version !== v.version), v];
    savePrep({ ...selected, versions }, byName, `Saved recipe v${v.version} (${status}) – ${v.ingredients.length} ingredient(s)`);
    setDraft(null);
    toast.success(status === 'approved' ? `v${v.version} approved – new batches will use it` : 'Draft saved');
  };

  const newVersion = () => {
    if (!selected || !current) return;
    const next = selected.versions.reduce((m, v) => Math.max(m, v.version), 0) + 1;
    setDraft({ ...current, version: next, status: 'draft', updatedAt: new Date().toISOString(), updatedBy: byName });
  };

  const nameOfIng = (i: PrepIngredient) => (i.isPrep ? state.preps.find((p) => p.id === i.sku)?.name : materialOf(i.sku)?.name) ?? i.sku;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-3">
        {!readOnly && (
          <div className="card">
            {!creating ? (
              <button className="btn-primary w-full justify-center" onClick={() => setCreating(true)}>
                <Plus size={14} /> New Bulk Preparation
              </button>
            ) : (
              <div className="space-y-2">
                <input className="input-field" placeholder="e.g. BBQ Marinade" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {PREP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <select className="input-field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as StockUnit })}>
                    {STOCK_UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                  <select className="input-field" value={form.hotel} disabled={!!hotelScope} onChange={(e) => setForm({ ...form, hotel: e.target.value as HotelName })}>
                    {HOTELS.map((h) => <option key={h.name} value={h.name}>{h.shortName}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1 justify-center" onClick={createPrep}>Create</button>
                  <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}
        <div className="card p-0 overflow-hidden">
          {list.length === 0 && <div className="px-4 py-10 text-center" style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>No bulk preparations yet. Create one and enter the kitchen-approved ingredient quantities.</div>}
          {list.map((p) => {
            const v = activePrepVersion(p);
            return (
              <div key={p.id} className="px-4 py-3 border-b cursor-pointer" style={{ borderColor: 'var(--border)', background: selected?.id === p.id ? 'var(--accent)' : 'transparent', opacity: p.active ? 1 : 0.55 }} onClick={() => { setSelectedId(p.id); setDraft(null); }}>
                <div className="flex items-center justify-between gap-2">
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: v?.status === 'approved' ? '#DCFCE7' : '#FEF9C3', color: v?.status === 'approved' ? '#166534' : '#854D0E', textTransform: 'uppercase' }}>{v?.status ?? 'draft'}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{p.id} · {p.category} · {p.hotel.split(' ')[0]}{!p.active ? ' · inactive' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2">
        {!selected || !working ? (
          <div className="card text-center" style={{ fontSize: 13, color: 'var(--muted-foreground)', padding: 40 }}>Select or create a bulk preparation to edit its recipe.</div>
        ) : (
          <div className="card space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>{selected.name}</h2>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  {selected.id} · {selected.hotel} · Recipe v{working.version} · {working.status === 'approved' ? 'Approved (used for new batches)' : 'Draft (not used for production)'}
                </div>
              </div>
              {!readOnly && (
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => patchPrep({ active: !selected.active }, selected.active ? 'Deactivated' : 'Reactivated')}>
                    <Power size={12} /> {selected.active ? 'Deactivate' : 'Reactivate'}
                  </button>
                  {current && !draft && <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={newVersion}><Copy size={12} /> New version</button>}
                  <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => saveVersion('draft')}><Save size={12} /> Save draft</button>
                  <button className="btn-primary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => saveVersion('approved')}><CheckCircle2 size={12} /> Approve</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label style={{ fontSize: 11 }}>Category
                <select className="input-field" disabled={readOnly} value={selected.category} onChange={(e) => patchPrep({ category: e.target.value }, 'Category changed')}>
                  {PREP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11 }}>Prepared stock unit
                <select className="input-field" disabled={readOnly || state.batches.some((b) => b.prepId === selected.id)} value={selected.unit} onChange={(e) => patchPrep({ unit: e.target.value as StockUnit }, 'Unit changed')}>
                  {STOCK_UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11 }}>Shelf life (days)
                <input type="number" min={0} className="input-field" disabled={readOnly} value={selected.shelfLifeDays} onChange={(e) => patchPrep({ shelfLifeDays: Number(e.target.value) || 0 }, 'Shelf life changed')} />
              </label>
              <label style={{ fontSize: 11 }}>Storage location
                <input className="input-field" disabled={readOnly} value={selected.storageLocation} onChange={(e) => patchPrep({ storageLocation: e.target.value }, 'Storage location changed')} />
              </label>
            </div>
            <label style={{ fontSize: 11, display: 'block' }}>Description
              <input className="input-field" disabled={readOnly} value={selected.description} onChange={(e) => patchPrep({ description: e.target.value }, 'Description changed')} />
            </label>
            <div>
              <div style={{ fontSize: 11, marginBottom: 4 }}>Allergens</div>
              <div className="flex flex-wrap gap-1.5">
                {ALLERGENS.map((a) => {
                  const on = selected.allergens.includes(a);
                  return (
                    <button key={a} disabled={readOnly} onClick={() => patchPrep({ allergens: on ? selected.allergens.filter((x) => x !== a) : [...selected.allergens, a] }, `Allergen ${a} ${on ? 'removed' : 'added'}`)} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border)', background: on ? '#FEE2E2' : 'transparent', color: on ? '#991B1B' : 'var(--muted-foreground)', cursor: readOnly ? 'default' : 'pointer' }}>{a}</button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <label style={{ fontSize: 11 }}>Expected yield ({selected.unit}) per recipe
                <input type="number" min={0} step="any" className="input-field" disabled={readOnly} value={working.expectedYield || ''} onChange={(e) => edit({ expectedYield: Number(e.target.value) || 0 })} />
              </label>
              <label style={{ fontSize: 11 }}>Expected preparation loss %
                <input type="number" min={0} max={99} className="input-field" disabled={readOnly} value={working.prepLossPct} onChange={(e) => edit({ prepLossPct: Number(e.target.value) || 0 })} />
              </label>
              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', alignSelf: 'end' }}>Quantities below are for one full recipe producing the expected yield.</div>
            </div>

            {!readOnly && (
              <div className="relative">
                <input className="input-field" placeholder="Add ingredient – search raw materials or other preparations…" value={search} onChange={(e) => setSearch(e.target.value)} />
                {matches.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    {matches.map((m) => (
                      <button key={m.key} className="w-full text-left px-3 py-2" style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between' }} onClick={() => addIng(m.key, m.isPrep, m.unit)}>
                        <span>{m.name}</span><span style={{ color: 'var(--muted-foreground)' }}>{m.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Ingredient</th><th>Quantity</th><th>Unit</th><th /></tr></thead>
                <tbody>
                  {working.ingredients.length === 0 && <tr><td colSpan={4} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No ingredients yet.</td></tr>}
                  {working.ingredients.map((i) => (
                    <tr key={i.id}>
                      <td style={{ fontSize: 13 }}>{nameOfIng(i)} {i.isPrep && <span style={{ fontSize: 10, background: '#EDE9FE', color: '#5B21B6', padding: '1px 5px', borderRadius: 3 }}>PREP</span>}</td>
                      <td><input type="number" min={0} step="any" className="input-field" style={{ width: 100 }} disabled={readOnly} value={i.quantity || ''} onChange={(e) => editIng(i.id, { quantity: Number(e.target.value) || 0 })} /></td>
                      <td>
                        <select className="input-field" style={{ width: 90 }} disabled={readOnly} value={i.unit} onChange={(e) => editIng(i.id, { unit: e.target.value as StockUnit })}>
                          {RECIPE_UNITS.map((u) => <option key={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>{!readOnly && <button aria-label="Remove ingredient" onClick={() => edit({ ingredients: working.ingredients.filter((x) => x.id !== i.id) })}><Trash2 size={14} style={{ color: '#991B1B' }} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Estimated recipe cost', v: gbp(est.total) },
                { l: `Cost per ${selected.unit} (usable)`, v: `£${est.unitCost.toFixed(4)}` },
                { l: 'Latest actual batch cost', v: latestUnitCost(state.batches, selected.id) > 0 ? `£${latestUnitCost(state.batches, selected.id).toFixed(4)}/${selected.unit}` : '—' },
              ].map((x) => (
                <div key={x.l} className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{x.l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{x.v}</div>
                </div>
              ))}
            </div>
            {est.missing && <p style={{ fontSize: 11, color: '#92400E' }}><AlertTriangle size={11} style={{ display: 'inline' }} /> Some ingredients have no purchase cost yet – estimate is incomplete. Actual cost is taken from the GRN batch cost at production.</p>}

            <label style={{ fontSize: 11, display: 'block' }}>Preparation instructions
              <textarea className="input-field" rows={3} disabled={readOnly} value={working.instructions} onChange={(e) => edit({ instructions: e.target.value })} />
            </label>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Recipe versions</div>
              {[...selected.versions].sort((a, b) => b.version - a.version).map((v) => (
                <div key={v.version} style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                  v{v.version} · {v.status} · {v.ingredients.length} ingredient(s) · {v.updatedAt.slice(0, 10)} by {v.updatedBy} · used by {state.batches.filter((b) => b.prepId === selected.id && b.recipeVersion === v.version).length} batch(es)
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
