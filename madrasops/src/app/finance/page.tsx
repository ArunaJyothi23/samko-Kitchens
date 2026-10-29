'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Download, Search, X, TrendingUp, TrendingDown, Info } from 'lucide-react';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, BarChart,
} from 'recharts';
import { useScopedRestaurant } from '@/contexts/AuthContext';
import DateRangeFilter from './components/DateRangeFilter';
import {
  ALL_LOCATIONS, DEMO_LABEL, DEMO_TODAY, RangeKey, buildExpenseTxns, downloadCsv, fmtDate, fmtGBP, pctChange, previousRange,
  resolveRange, summarise, ExpenseTxn, ExpenseCategory,
} from './components/financeData';

const CAT_COLORS: Record<string, string> = { Payroll: '#6366F1', Utilities: '#0EA5E9', 'Other Operating': '#F9B233', Wastage: '#ED1C24', 'Food COGS': '#168447' };

function Delta({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  const ch = pctChange(cur, prev);
  if (ch === null) return <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>vs prev: n/a</span>;
  const good = invert ? ch <= 0 : ch >= 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: good ? '#166534' : '#991B1B', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {ch >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {Math.abs(ch).toFixed(1)}% vs prev period
    </span>
  );
}

export default function FinancePage() {
  const scope = useScopedRestaurant();
  const [location, setLocation] = useState<string>('All');
  const [rangeKey, setRangeKey] = useState<RangeKey>('thisMonth');
  const [customFrom, setCustomFrom] = useState('2026-10-01');
  const [customTo, setCustomTo] = useState(DEMO_TODAY);
  const [drill, setDrill] = useState<ExpenseCategory | null>(null);
  const [search, setSearch] = useState('');

  const activeLocations = scope ? [scope as string] : location === 'All' ? ALL_LOCATIONS : [location];
  const { from, to } = resolveRange(rangeKey, customFrom, customTo);
  const prev = previousRange(from, to);

  const { summary: s, daily } = useMemo(() => summarise(activeLocations, from, to), [activeLocations.join('|'), from, to]); // eslint-disable-line react-hooks/exhaustive-deps
  const { summary: p } = useMemo(() => summarise(activeLocations, prev.from, prev.to), [activeLocations.join('|'), prev.from, prev.to]); // eslint-disable-line react-hooks/exhaustive-deps

  const allTxns = useMemo(() => buildExpenseTxns(), []);
  const drillTxns: ExpenseTxn[] = useMemo(() => {
    if (!drill) return [];
    const q = search.trim().toLowerCase();
    return allTxns
      .filter((t) => t.category === drill && t.sync !== 'Voided' && t.date >= from && t.date <= to && (activeLocations.includes(t.location) || (drill === 'Unallocated' && t.location === 'Unallocated')))
      .filter((t) => !q || `${t.payee} ${t.description} ${t.reference} ${t.account}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [drill, allTxns, from, to, search, activeLocations.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = daily.map((d) => ({
    date: d.date.slice(5),
    Sales: Math.round(d.netSales),
    'Food Cost': Math.round(d.foodCost),
    'Gross Profit': Math.round(d.netSales - d.foodCost),
    'Operating Expenses': Math.round(d.payroll + d.utilities + d.otherOpex),
    'Operating Profit': Math.round(d.netSales - d.foodCost - d.payroll - d.utilities - d.otherOpex - d.wastage),
    Wastage: Math.round(d.wastage),
  }));

  const pieData = [
    { name: 'Payroll', value: Math.round(s.payroll) },
    { name: 'Utilities', value: Math.round(s.utilities) },
    { name: 'Other Operating', value: Math.round(s.otherOpex) },
    { name: 'Wastage', value: Math.round(s.wastage) },
  ];

  const unallocatedTotal = allTxns.filter((t) => t.category === 'Unallocated' && t.date >= from && t.date <= to).reduce((a, t) => a + t.amount, 0);
  const profitPositive = s.operatingProfit >= 0;

  const kpis: { id: string; label: string; value: string; sub: React.ReactNode; color?: string; drill?: ExpenseCategory }[] = [
    { id: 'sales', label: 'Total Sales (Net, ex-VAT)', value: fmtGBP(s.netSales), color: '#166534', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Gross {fmtGBP(s.grossSales, 0)} − Disc {fmtGBP(s.discounts, 0)} − Refunds {fmtGBP(s.refunds, 0)} · VAT {fmtGBP(s.vat, 0)}</div><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.orders.toLocaleString('en-GB')} orders · AOV {fmtGBP(s.aov)}</div><Delta cur={s.netSales} prev={p.netSales} /></> },
    { id: 'cogs', label: 'Food Cost / COGS', value: fmtGBP(s.foodCost), color: '#991B1B', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.foodCostPct.toFixed(1)}% of net sales</div><Delta cur={s.foodCost} prev={p.foodCost} invert /></> },
    { id: 'gp', label: 'Gross Profit', value: fmtGBP(s.grossProfit), color: '#166534', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.grossMarginPct.toFixed(1)}% gross margin</div><Delta cur={s.grossProfit} prev={p.grossProfit} /></> },
    { id: 'payroll', label: 'Payroll Expenses', value: fmtGBP(s.payroll), drill: 'Payroll', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Wages, Employer NI, Pension · click to drill down</div><Delta cur={s.payroll} prev={p.payroll} invert /></> },
    { id: 'util', label: 'Utilities Expenses', value: fmtGBP(s.utilities), drill: 'Utilities', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Electricity, Gas, Water · click to drill down</div><Delta cur={s.utilities} prev={p.utilities} invert /></> },
    { id: 'other', label: 'Other Operating Expenses', value: fmtGBP(s.otherOpex), drill: 'Other Operating', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Rent, repairs, cleaning, insurance… · click to drill down</div><Delta cur={s.otherOpex} prev={p.otherOpex} invert /></> },
    { id: 'waste', label: 'Food Wastage Cost', value: fmtGBP(s.wastage), color: '#991B1B', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{s.wastagePct.toFixed(2)}% of net sales · shown separately</div><Delta cur={s.wastage} prev={p.wastage} invert /></> },
    { id: 'opex', label: 'Total Operating Expenses', value: fmtGBP(s.totalOpex), sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Payroll + Utilities + Other (excl. COGS &amp; wastage)</div><Delta cur={s.totalOpex} prev={p.totalOpex} invert /></> },
    { id: 'np', label: 'Net Operating Profit', value: fmtGBP(s.operatingProfit), color: profitPositive ? '#166534' : '#991B1B', sub: <><div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{profitPositive ? 'Profit' : 'Loss'} · {s.operatingMarginPct.toFixed(1)}% operating margin</div><Delta cur={s.operatingProfit} prev={p.operatingProfit} /></> },
  ];

  const exportDrill = () => {
    downloadCsv(`expenses-${drill}-${from}-${to}.csv`, [
      ['Date', 'Category', 'Payee', 'Description', 'Reference', 'Amount', 'Source', 'Restaurant', 'Sync'],
      ...drillTxns.map((t) => [t.date, t.subCategory, t.payee, t.description, t.reference, t.amount, t.source, t.location, t.sync]),
    ]);
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Restaurant Profitability Dashboard</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Sales, food cost, wastage, expenses and operating profit for {scope ?? (location === 'All' ? 'all locations' : location)}
          </p>
        </div>
        {!scope && (
          <select className="input-field" style={{ width: 220 }} value={location} onChange={(e) => setLocation(e.target.value)} aria-label="Restaurant">
            <option value="All">All locations (consolidated)</option>
            {ALL_LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        )}
      </div>

      <div className="card mb-4" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <p style={{ fontSize: 12, color: '#92400E' }}>⚠ {DEMO_LABEL} Last synchronised: 29 Oct 2026 06:00 (simulated).</p>
      </div>

      <div className="mb-4"><DateRangeFilter rangeKey={rangeKey} onRangeKey={setRangeKey} customFrom={customFrom} customTo={customTo} onCustomFrom={setCustomFrom} onCustomTo={setCustomTo} from={from} to={to} /></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {kpis.map((k) => {
          const clickable = !!k.drill;
          const inner = (
            <>
              <p className="label-text">{k.label}</p>
              <p className="metric-value" style={{ color: k.color }}>{k.value}</p>
              <div className="flex flex-col gap-0.5 mt-1">{k.sub}</div>
            </>
          );
          return clickable ? (
            <button key={k.id} type="button" className="metric-card text-left" style={{ cursor: 'pointer' }} onClick={() => { setSearch(''); setDrill(k.drill!); }}>{inner}</button>
          ) : (
            <div key={k.id} className="metric-card">{inner}</div>
          );
        })}
      </div>

      <div className="card mb-6" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
        <div className="flex items-start gap-2">
          <Info size={14} style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <strong>Costing methodology:</strong> Food cost = EPOS items sold × recipe ingredient cost (recipe-consumption method). Recorded wastage is <u>not</u> included in that figure, so it is deducted separately:
            Net Operating Profit = Net Sales (ex-VAT, after discounts &amp; refunds) − Food COGS − Operating Expenses − Wastage. Purchase order totals are not used as food cost.
            Limitation: theoretical consumption can understate real usage if recipes or portioning drift. This is operating profit before financing, corporation tax and other non-operating items — not final net profit.
            {unallocatedTotal > 0 && <> Unallocated expenses in this period: <strong>{fmtGBP(unallocatedTotal)}</strong> (excluded from restaurant profit until allocated — see Accounting).</>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Sales vs Food Cost</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => fmtGBP(v, 0)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Sales" fill="#168447" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Food Cost" fill="#ED1C24" radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Gross Profit vs Operating Expenses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => fmtGBP(v, 0)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Gross Profit" fill="#6366F1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Operating Expenses" fill="#F9B233" radius={[3, 3, 0, 0]} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Daily Operating Profit</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => fmtGBP(v, 0)} />
              <Line type="monotone" dataKey="Operating Profit" stroke="#168447" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Expense Category Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2} label={(e) => `${e.name}`}>
                {pieData.map((d) => <Cell key={d.name} fill={CAT_COLORS[d.name]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtGBP(v, 0)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card lg:col-span-2">
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Wastage Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v: number) => fmtGBP(v, 0)} />
              <Bar dataKey="Wastage" fill="#ED1C24" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {drill && (
        <div className="card p-0 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b flex items-center justify-between flex-wrap gap-2" style={{ borderColor: 'var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>{drill} transactions · {drillTxns.length} rows · {fmtGBP(drillTxns.reduce((a, t) => a + t.amount, 0))}</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} style={{ position: 'absolute', left: 8, top: 10, color: 'var(--muted-foreground)' }} />
                <input className="input-field" style={{ paddingLeft: 26, width: 200 }} placeholder="Search payee, ref…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={exportDrill}><Download size={13} /> Export CSV</button>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setDrill(null)} aria-label="Close drill-down"><X size={16} /></button>
            </div>
          </div>
          <div className="overflow-x-auto" style={{ maxHeight: 420 }}>
            <table className="data-table">
              <thead>
                <tr><th>Date</th><th>Category</th><th>Payee</th><th>Description</th><th>Reference</th><th>Amount</th><th>Source</th><th>Restaurant</th><th>Sync</th></tr>
              </thead>
              <tbody>
                {drillTxns.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>No transactions in this period.</td></tr>}
                {drillTxns.slice(0, 200).map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 12 }}>{fmtDate(t.date)}</td>
                    <td style={{ fontSize: 12 }}>{t.subCategory}</td>
                    <td style={{ fontSize: 12 }}>{t.payee}</td>
                    <td style={{ fontSize: 12 }}>{t.description}</td>
                    <td className="font-mono" style={{ fontSize: 11 }}>{t.reference}</td>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{fmtGBP(t.amount)}</td>
                    <td style={{ fontSize: 11 }}>{t.source}</td>
                    <td style={{ fontSize: 12 }}>{t.location}</td>
                    <td style={{ fontSize: 11, color: t.sync === 'Synced' ? '#166534' : '#92400E', fontWeight: 600 }}>{t.sync}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p style={{ fontSize: 11, color: '#92400E' }}>⚠ {DEMO_LABEL}</p>
    </AppLayout>
  );
}
