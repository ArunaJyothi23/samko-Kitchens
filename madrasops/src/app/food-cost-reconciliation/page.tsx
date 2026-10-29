'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Download, AlertTriangle, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { useScopedRestaurant } from '@/contexts/AuthContext';
import DateRangeFilter from '../finance/components/DateRangeFilter';
import {
  ALL_LOCATIONS, DEMO_LABEL, DEMO_TODAY, RangeKey, WasteRecord, buildWasteRecords, dateList, downloadCsv, fmtDate, fmtGBP, resolveRange,
  summarise,
} from '../finance/components/financeData';

type Method = 'recipe' | 'stock';

export default function FoodCostReconciliationPage() {
  const scope = useScopedRestaurant();
  const [location, setLocation] = useState<string>('Hounslow');
  const [rangeKey, setRangeKey] = useState<RangeKey>('thisMonth');
  const [customFrom, setCustomFrom] = useState('2026-10-01');
  const [customTo, setCustomTo] = useState(DEMO_TODAY);
  const [method, setMethod] = useState<Method>('recipe');
  const [reasonFilter, setReasonFilter] = useState('All');
  const [selected, setSelected] = useState<WasteRecord | null>(null);

  const loc = scope ?? location;
  const { from, to } = resolveRange(rangeKey, customFrom, customTo);

  const records = useMemo(() => buildWasteRecords(loc, from, to), [loc, from, to]);
  const { summary: s } = useMemo(() => summarise([loc], from, to), [loc, from, to]);

  const wasteTotal = records.reduce((a, r) => a + r.cost, 0);
  const wastePct = s.netSales > 0 ? (wasteTotal / s.netSales) * 100 : 0;

  // Method A: recipe consumption (wastage separate). Method B: stock-based (opening + purchases - closing) already includes wastage.
  const recipeFoodCost = s.foodCost;
  const stockFoodCost = s.foodCost + wasteTotal * 1.0; // stock-based figure includes waste physically consumed
  const foodCostUsed = method === 'recipe' ? recipeFoodCost : stockFoodCost;
  const wastageDeducted = method === 'recipe' ? wasteTotal : 0;
  const varianceCost = stockFoodCost - recipeFoodCost - wasteTotal;
  const profitImpact = s.netSales - foodCostUsed - s.totalOpex - wastageDeducted;

  const byReason = useMemo(() => groupSum(records, (r) => r.reason), [records]);
  const byIngredient = useMemo(() => groupSum(records, (r) => r.ingredient), [records]);
  const byCategory = useMemo(() => groupSum(records, (r) => r.category), [records]);

  const avg = records.length ? wasteTotal / records.length : 0;
  const unusual = (r: WasteRecord) => r.cost > Math.max(avg * 3, 8);

  const trend = useMemo(() => {
    const map = new Map<string, number>();
    dateList(from, to).forEach((d) => map.set(d, 0));
    records.forEach((r) => map.set(r.date, (map.get(r.date) ?? 0) + r.cost));
    return Array.from(map.entries()).map(([d, v]) => ({ date: d.slice(5), Wastage: Math.round(v * 100) / 100 }));
  }, [records, from, to]);

  const filtered = records.filter((r) => reasonFilter === 'All' || r.reason === reasonFilter).sort((a, b) => b.date.localeCompare(a.date));
  const reasons = ['All', ...byReason.map((b) => b.name)];

  const exportCsv = () =>
    downloadCsv(`wastage-${loc}-${from}-${to}.csv`, [
      ['ID', 'Date', 'Ingredient', 'Category', 'Qty', 'Unit', 'Base qty', 'Base unit', 'Cost/base unit', 'Cost basis', 'Reason', 'Cost'],
      ...filtered.map((r) => [r.id, r.date, r.ingredient, r.category, r.quantity, r.unit, r.baseQty, r.baseUnit, r.costPerBaseUnit, r.batchCost ? 'Batch cost' : 'Standard cost', r.reason, r.cost]),
    ]);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Wastage &amp; Food Cost Reconciliation</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>Reconcile recorded wastage with food cost for {loc} so nothing is deducted twice</p>
        </div>
        {!scope && (
          <select className="input-field" style={{ width: 220 }} value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Restaurant">
            {ALL_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
          </select>
        )}
      </div>

      <div className="card mb-4" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <p style={{ fontSize: 12, color: '#92400E' }}>⚠ {DEMO_LABEL}</p>
      </div>

      <div className="mb-4"><DateRangeFilter rangeKey={rangeKey} onRangeKey={setRangeKey} customFrom={customFrom} customTo={customTo} onCustomFrom={setCustomFrom} onCustomTo={setCustomTo} from={from} to={to} /></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card"><p className="label-text">Wastage cost</p><p className="metric-value" style={{ color: '#991B1B' }}>{fmtGBP(wasteTotal)}</p><p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{records.length} records</p></div>
        <div className="metric-card"><p className="label-text">Wastage % of net sales</p><p className="metric-value">{wastePct.toFixed(2)}%</p></div>
        <div className="metric-card"><p className="label-text">Food cost used in profit</p><p className="metric-value">{fmtGBP(foodCostUsed)}</p><p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.netSales > 0 ? ((foodCostUsed / s.netSales) * 100).toFixed(1) : '0.0'}% of net sales</p></div>
        <div className="metric-card"><p className="label-text">Operating profit</p><p className="metric-value" style={{ color: profitImpact >= 0 ? '#166534' : '#991B1B' }}>{fmtGBP(profitImpact)}</p></div>
      </div>

      <div className="card mb-6">
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Costing methodology</h3>
        <div className="flex gap-2 mb-3 flex-wrap">
          <button type="button" className={method === 'recipe' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMethod('recipe')}>EPOS × recipe consumption</button>
          <button type="button" className={method === 'stock' ? 'btn-primary' : 'btn-secondary'} onClick={() => setMethod('stock')}>Opening stock + purchases − closing stock</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Line</th><th>Recipe method</th><th>Stock method</th></tr></thead>
          <tbody>
            <tr><td>Food cost</td><td>{fmtGBP(recipeFoodCost)}</td><td>{fmtGBP(stockFoodCost)}</td></tr>
            <tr><td>Wastage already included?</td><td style={{ color: '#991B1B' }}>No → deduct separately ({fmtGBP(wasteTotal)})</td><td style={{ color: '#166534' }}>Yes → do not deduct again</td></tr>
            <tr><td>Wastage deducted from profit</td><td>{fmtGBP(method === 'recipe' ? wasteTotal : 0)}</td><td>{fmtGBP(0)}</td></tr>
            <tr><td><strong>Unexplained variance (stock − recipe − wastage)</strong></td><td colSpan={2}><strong>{fmtGBP(varianceCost)}</strong> — {Math.abs(varianceCost) < 1 ? 'reconciled' : 'investigate portioning / unrecorded waste'} (demo model)</td></tr>
          </tbody>
        </table>
        <p style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 8, lineHeight: 1.6 }}>
          {method === 'recipe' ?'Limitation: recipe consumption is theoretical — it ignores unrecorded waste, over-portioning and theft, which is why recorded wastage is added back as a separate cost.' :'Limitation: stock-based COGS depends on accurate stock counts at both ends of the period; wastage is already embedded in the consumed cost, so it is shown for visibility only.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Wastage trend</h3>
          <ResponsiveContainer width="100%" height={230}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => fmtGBP(v)} />
              <Line type="monotone" dataKey="Wastage" stroke="#ED1C24" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Wastage by reason</h3>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={byReason} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `£${v}`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
              <Tooltip formatter={(v: number) => fmtGBP(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="value" name="Cost" fill="#F9B233" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Wastage by ingredient</h3>
          <table className="data-table"><thead><tr><th>Ingredient</th><th>Cost</th><th>Share</th></tr></thead>
            <tbody>{byIngredient.map((b) => <tr key={b.name}><td style={{ fontSize: 12 }}>{b.name}</td><td style={{ fontSize: 12, fontWeight: 600 }}>{fmtGBP(b.value)}</td><td style={{ fontSize: 12 }}>{wasteTotal > 0 ? ((b.value / wasteTotal) * 100).toFixed(1) : '0.0'}%</td></tr>)}</tbody></table>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Wastage by category</h3>
          <table className="data-table"><thead><tr><th>Category</th><th>Cost</th><th>Share</th></tr></thead>
            <tbody>{byCategory.map((b) => <tr key={b.name}><td style={{ fontSize: 12 }}>{b.name}</td><td style={{ fontSize: 12, fontWeight: 600 }}>{fmtGBP(b.value)}</td><td style={{ fontSize: 12 }}>{wasteTotal > 0 ? ((b.value / wasteTotal) * 100).toFixed(1) : '0.0'}%</td></tr>)}</tbody></table>
        </div>
      </div>

      <div className="card p-0 overflow-hidden mb-4">
        <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Underlying waste records ({filtered.length})</h3>
          <select className="input-field ml-auto" style={{ width: 180 }} value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} aria-label="Reason">
            {reasons.map((r) => <option key={r}>{r}</option>)}
          </select>
          <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={exportCsv}><Download size={13} /> Export CSV</button>
        </div>
        <div className="overflow-x-auto" style={{ maxHeight: 420 }}>
          <table className="data-table">
            <thead><tr><th>Date</th><th>Ingredient</th><th>Recorded qty</th><th>Normalised</th><th>Cost basis</th><th>Reason</th><th>Cost</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>No wastage in this period.</td></tr>}
              {filtered.slice(0, 200).map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontSize: 12 }}>{fmtDate(r.date)}</td>
                  <td style={{ fontSize: 12 }}>{r.ingredient}</td>
                  <td style={{ fontSize: 12 }}>{r.quantity} {r.unit}</td>
                  <td style={{ fontSize: 12 }}>{Number(r.baseQty.toFixed(3))} {r.baseUnit}</td>
                  <td style={{ fontSize: 11 }}>{r.batchCost ? `Batch ${r.batchId}` : 'Standard cost'} @ {fmtGBP(r.costPerBaseUnit)}/{r.baseUnit}</td>
                  <td style={{ fontSize: 12 }}>{r.reason}</td>
                  <td style={{ fontSize: 12, fontWeight: 600 }}>
                    {fmtGBP(r.cost)}
                    {unusual(r) && <span title="Unusually high" style={{ marginLeft: 6, color: '#991B1B' }}><AlertTriangle size={12} style={{ display: 'inline' }} /> High</span>}
                  </td>
                  <td style={{ fontSize: 11, color: '#92400E' }}>{r.corrected ? 'Corrected' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#92400E' }}>⚠ {DEMO_LABEL}</p>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setSelected(null)}>
          <div className="h-full overflow-y-auto shadow-2xl animate-slide-in-right" style={{ width: 460, maxWidth: '100%', background: 'var(--card)', padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-mono" style={{ fontSize: 16, fontWeight: 700 }}>{selected.id}</h2>
                <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{selected.ingredient} · {selected.location}</p>
              </div>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setSelected(null)} aria-label="Close"><X size={18} /></button>
            </div>
            {[
              ['Date', fmtDate(selected.date)],
              ['Reason', selected.reason],
              ['Recorded', `${selected.quantity} ${selected.unit}`],
              ['Normalised', `${Number(selected.baseQty.toFixed(3))} ${selected.baseUnit}`],
              ['Cost basis', selected.batchCost ? `Batch ${selected.batchId}` : 'Standard inventory cost'],
              ['Unit cost', `${fmtGBP(selected.costPerBaseUnit)} / ${selected.baseUnit}`],
              ['Total cost', fmtGBP(selected.cost)],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l}</span><span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <h3 style={{ fontSize: 13.5, fontWeight: 700, margin: '18px 0 8px' }}>Audit trail</h3>
            <div style={{ fontSize: 12, lineHeight: 1.7 }}>
              <div>• Recorded by kitchen staff (demo)</div>
              {selected.corrected && <div style={{ color: '#92400E' }}>• Correction: {selected.correctionNote}</div>}
              {!selected.corrected && <div style={{ color: 'var(--muted-foreground)' }}>• No corrections</div>}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

function groupSum(records: WasteRecord[], key: (r: WasteRecord) => string): { name: string; value: number }[] {
  const m = new Map<string, number>();
  records.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + r.cost));
  return Array.from(m.entries())
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);
}
