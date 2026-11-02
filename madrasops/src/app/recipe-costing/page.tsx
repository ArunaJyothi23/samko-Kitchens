'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, ChevronDown, ChevronUp, AlertTriangle, Plus, Trash2, Save, Copy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEposMaster } from '@/data/eposMasterStore';
import { usePrepResolver } from '@/data/prepStore';
import {
  MENU_ITEMS,
  MENU_CATEGORIES,
  RECIPE_UNITS,
  RAW_CATEGORIES,
  MenuItem,
  MenuModifier,
  RecipeVersion,
  StockUnit,
  activeVersion,
  computeRecipeCost,
  emptyVersion,
  foodCostPct,
  grossProfit,
} from '@/data/eposMaster';

type Tab = 'recipes' | 'ingredients' | 'audit';

const gbp = (n: number) => `£${n.toFixed(2)}`;

function RecipeEditor({
  targetId,
  kind,
  title,
  price,
  byName,
}: {
  targetId: string;
  kind: 'item' | 'modifier';
  title: string;
  price: number;
  byName: string;
}) {
  const { state, materialOf, getRecipe, saveVersion, newVersion } = useEposMaster();
  const { resolver: prepOf, preps } = usePrepResolver();
  const recipe = getRecipe(targetId);
  const current = activeVersion(recipe);
  const [draft, setDraft] = useState<RecipeVersion | null>(null);
  const [matSearch, setMatSearch] = useState('');
  const working: RecipeVersion = draft ?? current ?? emptyVersion(1, byName);
  const cost = useMemo(() => computeRecipeCost(working, materialOf, prepOf), [working, materialOf, prepOf]);
  const pct = foodCostPct(cost.costPerServing, price);
  const gp = grossProfit(price, cost.costPerServing);

  const edit = (patch: Partial<RecipeVersion>) => setDraft({ ...working, ...patch });
  const editLine = (id: string, patch: Partial<RecipeVersion['lines'][number]>) =>
    edit({ lines: working.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const activeMaterials = state.materials.filter((m) => !state.inactive.includes(m.sku));
  const suggestions = matSearch
    ? [
        ...activeMaterials.filter((m) => m.name.toLowerCase().includes(matSearch.toLowerCase())).slice(0, 6).map((m) => ({ key: m.sku, name: m.name, sub: `${m.category} · per ${m.unit}`, isPrep: false })),
        ...preps.filter((p) => p.active && p.name.toLowerCase().includes(matSearch.toLowerCase())).slice(0, 4).map((p) => ({ key: p.id, name: p.name, sub: `Bulk preparation · ${p.hotel.split(' ')[0]} · per ${p.unit}`, isPrep: true })),
      ]
    : [];

  const addLine = (key: string, isPrep: boolean) => {
    const stock = isPrep ? preps.find((p) => p.id === key)?.unit : materialOf(key)?.unit;
    if (!stock) return;
    const unit: StockUnit = stock === 'kg' ? 'g' : stock === 'litre' ? 'ml' : stock;
    edit({ lines: [...working.lines, { id: `l-${Date.now().toString(36)}-${working.lines.length}`, sku: key, prepId: isPrep ? key : undefined, quantity: 0, unit }] });
    setMatSearch('');
  };

  const save = (status: 'draft' | 'approved') => {
    saveVersion(targetId, kind, { ...working, status, updatedAt: new Date().toISOString(), updatedBy: byName }, byName);
    setDraft(null);
  };

  const startNewVersion = () => setDraft(newVersion(targetId, kind, byName));

  return (
    <div className="p-4 rounded-lg" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
            Version {working.version} · {working.status === 'approved' ? 'Approved (active – deducts stock)' : 'Draft (not active – no stock deducted)'}
            {recipe && recipe.versions.length > 1 ? ` · ${recipe.versions.length} versions` : ''}
          </div>
        </div>
        <div className="flex gap-2">
          {current && !draft && (
            <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={startNewVersion}>
              <Copy size={12} /> New version
            </button>
          )}
          <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => save('draft')}>
            <Save size={12} /> Save draft
          </button>
          <button className="btn-primary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={() => save('approved')} disabled={working.lines.length === 0}>
            <CheckCircle2 size={12} /> Approve &amp; activate
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <label style={{ fontSize: 11 }}>
          Servings produced
          <input type="number" min={1} className="input-field" value={working.servings} onChange={(e) => edit({ servings: Number(e.target.value) || 1 })} />
        </label>
        <label style={{ fontSize: 11 }}>
          Preparation yield %
          <input type="number" min={1} max={100} className="input-field" value={working.yieldPct} onChange={(e) => edit({ yieldPct: Number(e.target.value) || 100 })} />
        </label>
        <label style={{ fontSize: 11 }}>
          Cooking loss / prep wastage %
          <input type="number" min={0} max={99} className="input-field" value={working.wastagePct} onChange={(e) => edit({ wastagePct: Number(e.target.value) || 0 })} />
        </label>
        <div style={{ fontSize: 11, color: 'var(--muted-foreground)', alignSelf: 'end' }}>
          Yield and wastage use a single loss factor (the larger of the two) so prep loss is not double-counted.
        </div>
      </div>

      <div className="relative mb-3">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
        <input className="input-field pl-8" placeholder="Add component – search raw materials or bulk preparations..." value={matSearch} onChange={(e) => setMatSearch(e.target.value)} />
        {suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 rounded-lg overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {suggestions.map((m) => (
              <button key={m.key} className="w-full text-left px-3 py-2 hover:bg-opacity-70" style={{ fontSize: 12.5, display: 'flex', justifyContent: 'space-between' }} onClick={() => addLine(m.key, m.isPrep)}>
                <span>{m.name}</span>
                <span style={{ color: 'var(--muted-foreground)' }}>{m.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="col-left col-wide">Ingredient</th>
              <th className="col-left">Quantity</th>
              <th className="col-left">Unit</th>
              <th className="col-right">Cost / unit</th>
              <th className="col-right">Line cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cost.lines.length === 0 && (
              <tr>
                <td colSpan={6} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  No ingredients yet. Search above and enter the kitchen-approved quantities.
                </td>
              </tr>
            )}
            {cost.lines.map((c) => (
              <tr key={c.line.id}>
                <td style={{ fontSize: 13 }}>
                  {c.prep?.name ?? c.material?.name ?? 'Unknown'}
                  {c.line.prepId && <span style={{ fontSize: 10, marginLeft: 6, background: '#EDE9FE', color: '#5B21B6', padding: '1px 5px', borderRadius: 3 }}>PREP</span>}
                  {c.missingCost && (c.material || c.prep) && <span style={{ color: '#92400E', fontSize: 10, marginLeft: 6 }}>⚠ {c.line.prepId ? 'no produced batch cost yet' : 'purchase cost not entered'}</span>}
                  {c.incompatible && <span style={{ color: '#991B1B', fontSize: 10, marginLeft: 6 }}>⚠ unit mismatch</span>}
                </td>
                <td>
                  <input type="number" min={0} step="any" className="input-field" style={{ width: 90 }} value={c.line.quantity || ''} onChange={(e) => editLine(c.line.id, { quantity: Number(e.target.value) || 0 })} />
                </td>
                <td>
                  <select className="input-field" style={{ width: 90 }} value={c.line.unit} onChange={(e) => editLine(c.line.id, { unit: e.target.value as StockUnit })}>
                    {RECIPE_UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </td>
                <td className="col-right" style={{ fontSize: 12 }}>£{c.costPerRecipeUnit.toFixed(4)}/{c.line.unit}</td>
                <td className="col-right" style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>{gbp(c.lineCost)}</td>
                <td>
                  <button aria-label="Remove ingredient" onClick={() => edit({ lines: working.lines.filter((l) => l.id !== c.line.id) })}>
                    <Trash2 size={14} style={{ color: '#991B1B' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
        {[
          { l: 'Ingredient total', v: gbp(cost.rawTotal) },
          { l: 'Final recipe cost', v: gbp(cost.finalRecipeCost) },
          { l: 'Cost per serving', v: gbp(cost.costPerServing) },
          { l: kind === 'item' ? 'Food cost %' : 'Cost vs extra price', v: price > 0 ? `${pct.toFixed(1)}%` : '—' },
          { l: 'Gross profit', v: price > 0 ? gbp(gp) : '—' },
        ].map((x) => (
          <div key={x.l} className="p-3 rounded-lg" style={{ background: 'var(--card)' }}>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{x.l}</div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{x.v}</div>
          </div>
        ))}
      </div>
      {cost.hasMissingCost && (
        <p style={{ fontSize: 11, color: '#92400E', marginTop: 8 }}>
          <AlertTriangle size={11} style={{ display: 'inline' }} /> Some ingredients have no purchase cost yet. Enter costs on the Ingredient Costs tab (or via purchase orders) for accurate totals.
        </p>
      )}

      <label style={{ fontSize: 11, display: 'block', marginTop: 12 }}>
        Preparation instructions (optional)
        <textarea className="input-field" rows={2} value={working.instructions} onChange={(e) => edit({ instructions: e.target.value })} />
      </label>
    </div>
  );
}

function ItemRow({ item, expanded, onToggle, byName }: { item: MenuItem; expanded: boolean; onToggle: () => void; byName: string }) {
  const { materialOf, getRecipe } = useEposMaster();
  const { resolver: prepOf } = usePrepResolver();
  const v = activeVersion(getRecipe(item.id));
  const cost = computeRecipeCost(v, materialOf, prepOf);
  const status = !v ? 'not configured' : v.status;
  const pct = foodCostPct(cost.costPerServing, item.price);
  const colors: Record<string, { bg: string; text: string }> = {
    approved: { bg: '#DCFCE7', text: '#166534' },
    draft: { bg: '#FEF9C3', text: '#854D0E' },
    'not configured': { bg: '#F3F4F6', text: '#4B5563' },
  };
  const [openMod, setOpenMod] = useState<string | null>(null);

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={onToggle}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 14, fontWeight: 600 }}>{item.name}</span>
            <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: colors[status].bg, color: colors[status].text, textTransform: 'uppercase' }}>{status}</span>
            {item.periods.map((p) => (
              <span key={p} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, background: p === 'Lunch' ? '#DBEAFE' : '#EDE9FE', color: p === 'Lunch' ? '#1E40AF' : '#5B21B6' }}>{p}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>
            {item.category} · {item.id}
            {item.modifiers.length > 0 ? ` · ${item.modifiers.length} option(s)` : ''}
          </div>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right">
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Price</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{gbp(item.price)}</div>
          </div>
          <div className="text-right hidden md:block">
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Recipe cost</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>{v ? gbp(cost.costPerServing) : '—'}</div>
          </div>
          <div className="text-right hidden md:block">
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Food cost %</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: pct > 35 ? '#991B1B' : '#166534' }}>{v && cost.costPerServing > 0 ? `${pct.toFixed(1)}%` : '—'}</div>
          </div>
          <div className="text-right hidden lg:block">
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Gross profit</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>{v && cost.costPerServing > 0 ? gbp(grossProfit(item.price, cost.costPerServing)) : '—'}</div>
          </div>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      {expanded && (
        <div className="border-t space-y-4" style={{ borderColor: 'var(--border)', padding: 16 }}>
          {item.note && <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Note: {item.note}</p>}
          <RecipeEditor targetId={item.id} kind="item" title={`Recipe – ${item.name}`} price={item.price} byName={byName} />
          {item.modifiers.length > 0 && (
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Modifiers &amp; extras (deduct only their own ingredients)</h4>
              <div className="space-y-2">
                {item.modifiers.map((m: MenuModifier) => (
                  <div key={m.id}>
                    <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--background)', border: '1px solid var(--border)', fontSize: 12.5 }} onClick={() => setOpenMod(openMod === m.id ? null : m.id)}>
                      <span>
                        {m.group}: <strong>{m.name}</strong>
                        {m.periods ? ` (${m.periods.join('/')} only)` : ''}
                      </span>
                      <span>{m.priceDelta > 0 ? `+${gbp(m.priceDelta)}` : 'No charge'}</span>
                    </button>
                    {openMod === m.id && (
                      <div className="mt-2">
                        <RecipeEditor targetId={m.id} kind="modifier" title={`Modifier recipe – ${m.name}`} price={m.priceDelta} byName={byName} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IngredientCosts({ byName }: { byName: string }) {
  const { state, setUnitCost, addMaterial, updateMaterial, toggleActive } = useEposMaster();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('All');
  const [form, setForm] = useState({ name: '', category: RAW_CATEGORIES[0], unit: 'kg' as StockUnit });
  const list = state.materials.filter((m) => (cat === 'All' || m.category === cat) && (!q || m.name.toLowerCase().includes(q.toLowerCase())));

  return (
    <div>
      <div className="card mb-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input className="input-field pl-8" placeholder="Search ingredients..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input-field" style={{ width: 220 }} value={cat} onChange={(e) => setCat(e.target.value)}>
          {['All', ...RAW_CATEGORIES].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="card mb-4 flex flex-wrap gap-3 items-end">
        <label style={{ fontSize: 11, flex: 1, minWidth: 180 }}>
          New ingredient
          <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Maple syrup" />
        </label>
        <select className="input-field" style={{ width: 210 }} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
          {RAW_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="input-field" style={{ width: 100 }} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value as StockUnit })}>
          {RECIPE_UNITS.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
        <button
          className="btn-primary"
          style={{ padding: '8px 12px' }}
          onClick={() => {
            if (!form.name.trim()) return;
            const ok = addMaterial({ sku: `RM-X-${String(state.materials.length + 1).padStart(3, '0')}`, name: form.name.trim(), category: form.category, unit: form.unit, unitCost: 0 }, byName);
            if (ok) setForm({ ...form, name: '' });
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
      <div className="card p-0 overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Ingredient</th>
              <th>Category</th>
              <th>Purchase unit</th>
              <th>Purchase cost / unit (£)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const inactive = state.inactive.includes(m.sku);
              return (
                <tr key={m.sku} style={{ opacity: inactive ? 0.5 : 1 }}>
                  <td style={{ fontSize: 11 }}>{m.sku}</td>
                  <td>
                    <input className="input-field" style={{ minWidth: 160 }} value={m.name} onChange={(e) => updateMaterial(m.sku, { name: e.target.value }, byName)} />
                  </td>
                  <td>
                    <select className="input-field" value={m.category} onChange={(e) => updateMaterial(m.sku, { category: e.target.value }, byName)}>
                      {RAW_CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ fontSize: 12 }}>{m.unit}</td>
                  <td>
                    <input type="number" min={0} step="any" className="input-field" style={{ width: 110 }} placeholder="Enter cost" value={m.unitCost || ''} onChange={(e) => setUnitCost(m.sku, Number(e.target.value) || 0, byName)} />
                  </td>
                  <td>
                    <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => toggleActive(m.sku, byName)}>
                      {inactive ? 'Reactivate' : 'Deactivate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8 }}>
        Recipe costing uses the latest cost entered here. Inventory valuation (weighted average from goods receipts) is tracked separately in Inventory.
      </p>
    </div>
  );
}

export default function RecipeCostingPage() {
  const { user } = useAuth();
  const byName = user?.name ?? 'Admin';
  const { state, materialOf, getRecipe } = useEposMaster();
  const { resolver: prepOfTop } = usePrepResolver();
  const [tab, setTab] = useState<Tab>('recipes');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [period, setPeriod] = useState<'All' | 'Lunch' | 'Dinner'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = MENU_ITEMS.filter(
    (m) =>
      (!search || m.name.toLowerCase().includes(search.toLowerCase())) &&
      (category === 'All' || m.category === category) &&
      (period === 'All' || m.periods.includes(period))
  );

  const configured = MENU_ITEMS.filter((m) => activeVersion(getRecipe(m.id))?.status === 'approved').length;
  const costed = MENU_ITEMS.map((m) => {
    const v = activeVersion(getRecipe(m.id));
    const c = computeRecipeCost(v, materialOf, prepOfTop);
    return { m, cost: c.costPerServing, has: !!v && c.costPerServing > 0 };
  }).filter((x) => x.has);
  const avgPct = costed.length ? costed.reduce((s, x) => s + foodCostPct(x.cost, x.m.price), 0) / costed.length : 0;
  const missingCosts = state.materials.filter((m) => m.unitCost <= 0).length;

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Recipe Costing</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            EPOS Lunch &amp; Dinner menu → recipe → raw materials → cost. Enter kitchen-approved quantities and purchase costs; all totals calculate automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Menu Items</p>
          <p className="metric-value">{MENU_ITEMS.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Recipes Approved</p>
          <p className="metric-value">{configured} / {MENU_ITEMS.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Avg Food Cost % (costed items)</p>
          <p className="metric-value">{costed.length ? `${avgPct.toFixed(1)}%` : '—'}</p>
        </div>
        <div className={missingCosts > 0 ? 'metric-card-alert' : 'metric-card'}>
          <p className="label-text">Ingredients without cost</p>
          <p className="metric-value" style={{ color: missingCosts > 0 ? '#92400E' : '#166534' }}>{missingCosts}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {([['recipes', 'Menu Recipes'], ['ingredients', 'Ingredient Costs'], ['audit', 'Audit Trail']] as [Tab, string][]).map(([k, label]) => (
          <button key={k} className={tab === k ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 14px' }} onClick={() => setTab(k)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'recipes' && (
        <>
          <div className="card mb-5 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
              <input className="input-field pl-8" placeholder="Search menu item..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-field" style={{ width: 220 }} value={category} onChange={(e) => setCategory(e.target.value)}>
              {['All', ...MENU_CATEGORIES].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select className="input-field" style={{ width: 120 }} value={period} onChange={(e) => setPeriod(e.target.value as 'All' | 'Lunch' | 'Dinner')}>
              {['All', 'Lunch', 'Dinner'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            {filtered.map((item) => (
              <ItemRow key={item.id} item={item} expanded={expandedId === item.id} onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)} byName={byName} />
            ))}
          </div>
        </>
      )}

      {tab === 'ingredients' && <IngredientCosts byName={byName} />}

      {tab === 'audit' && (
        <div className="card p-0 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>When</th>
                <th>User</th>
                <th>Type</th>
                <th>Ref</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {state.audit.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No changes recorded yet.</td>
                </tr>
              )}
              {state.audit.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontSize: 12 }}>{a.at.slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ fontSize: 12 }}>{a.by}</td>
                  <td style={{ fontSize: 12 }}>{a.entity}</td>
                  <td style={{ fontSize: 12 }}>{a.ref}</td>
                  <td style={{ fontSize: 12 }}>{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
