'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Download, Search, RefreshCw, Link2, Unlink, AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useScopedRestaurant } from '@/contexts/AuthContext';
import DateRangeFilter from '../finance/components/DateRangeFilter';
import {
  ALL_LOCATIONS, AccountMapping, DEFAULT_MAPPINGS, DEMO_LABEL, DEMO_TODAY, ExpenseCategory, RangeKey, buildExpenseTxns, downloadCsv,
  fmtDate, fmtGBP, resolveRange,
} from '../finance/components/financeData';

type Tab = 'connection' | 'expenses' | 'mapping' | 'sync';

const CATS: ExpenseCategory[] = ['Payroll', 'Utilities', 'Other Operating', 'Unallocated'];

const SYNC_LOG_SEED = [
  { id: 's1', at: '2026-10-29T06:00:00.000Z', type: 'Scheduled (incremental)', result: 'Success', detail: '142 transactions checked, 6 new, 1 updated, 0 duplicates skipped (external IDs).' },
  { id: 's2', at: '2026-10-28T06:00:00.000Z', type: 'Scheduled (incremental)', result: 'Success', detail: '98 checked, 3 new, 0 updated, 2 duplicates skipped.' },
  { id: 's3', at: '2026-10-27T11:32:00.000Z', type: 'Manual', result: 'Error', detail: 'QuickBooks API rate limit (429). Backed off 60s and retried — resolved on attempt 2 (simulated).' },
  { id: 's4', at: '2026-10-26T06:00:00.000Z', type: 'Scheduled (incremental)', result: 'Success', detail: '1 voided transaction removed from totals (QB-DART-… voided).' },
  { id: 's5', at: '2026-10-01T09:10:00.000Z', type: 'Initial historical import', result: 'Success', detail: '2,481 transactions imported for 01 Sep 2025 – 30 Sep 2026.' },
];

export default function AccountingPage() {
  const scope = useScopedRestaurant();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('expenses');
  const [connected, setConnected] = useState(true);
  const [mappings, setMappings] = useState<AccountMapping[]>(DEFAULT_MAPPINGS);
  const [rangeKey, setRangeKey] = useState<RangeKey>('thisMonth');
  const [customFrom, setCustomFrom] = useState('2026-10-01');
  const [customTo, setCustomTo] = useState(DEMO_TODAY);
  const [catFilter, setCatFilter] = useState<'All' | ExpenseCategory>('All');
  const [locFilter, setLocFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [syncLog, setSyncLog] = useState(SYNC_LOG_SEED);
  const [lastSync, setLastSync] = useState('2026-10-29T06:00:00.000Z');
  const [syncing, setSyncing] = useState(false);
  const [newAcct, setNewAcct] = useState({ accountCode: '', accountName: '', category: 'Other Operating' as ExpenseCategory, subCategory: '' });
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  const canAdmin = !scope; // restaurant managers are read-only on accounting configuration
  const { from, to } = resolveRange(rangeKey, customFrom, customTo);

  const txns = useMemo(() => buildExpenseTxns(mappings), [mappings]);
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return txns
      .map((t) => (allocations[t.id] ? { ...t, location: allocations[t.id], category: (t.category === 'Unallocated' ? 'Other Operating' : t.category) as ExpenseCategory } : t))
      .filter((t) => t.date >= from && t.date <= to)
      .filter((t) => (scope ? t.location === scope : locFilter === 'All' || t.location === locFilter))
      .filter((t) => catFilter === 'All' || t.category === catFilter)
      .filter((t) => !q || `${t.payee} ${t.description} ${t.reference} ${t.account} ${t.id}`.toLowerCase().includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [txns, allocations, from, to, scope, locFilter, catFilter, search]);

  const totals = useMemo(() => {
    const live = rows.filter((r) => r.sync !== 'Voided');
    return CATS.map((c) => ({ cat: c, amount: live.filter((r) => r.category === c).reduce((a, r) => a + r.amount, 0) }));
  }, [rows]);

  const runSync = (type: string) => {
    if (!connected) {
      toast.error('Connect QuickBooks first (demo).');
      return;
    }
    setSyncing(true);
    setTimeout(() => {
      const nowIso = new Date().toISOString();
      setLastSync(nowIso);
      setSyncLog((l) => [{ id: `s-${nowIso}`, at: nowIso, type, result: 'Success', detail: 'Simulated sync complete. No live QuickBooks call was made; duplicates prevented via external transaction IDs.' }, ...l]);
      setSyncing(false);
      toast.success('Simulated sync complete');
    }, 900);
  };

  const exportRows = () =>
    downloadCsv(`expenses-${from}-${to}.csv`, [
      ['Date', 'Category', 'Account', 'Code', 'Payee', 'Description', 'Reference', 'Amount', 'Source', 'Restaurant', 'Sync'],
      ...rows.map((t) => [t.date, t.category, t.account, t.accountCode, t.payee, t.description, t.reference, t.amount, t.source, t.location, t.sync]),
    ]);

  const addMapping = () => {
    if (!newAcct.accountCode.trim() || !newAcct.accountName.trim()) {
      toast.error('Account code and name are required');
      return;
    }
    setMappings((m) => [...m, { id: `m-${m.length + 1}-${newAcct.accountCode}`, ...newAcct, subCategory: newAcct.subCategory || newAcct.accountName }]);
    setNewAcct({ accountCode: '', accountName: '', category: 'Other Operating', subCategory: '' });
    toast.success('Mapping added (demo, not saved to a database)');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'connection', label: 'QuickBooks Connection' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'mapping', label: 'Account Mapping' },
    { id: 'sync', label: 'Sync Log' },
  ];

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="page-title">Accounting &amp; Expenses</h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>QuickBooks-style expense feed, account mapping and restaurant allocation</p>
      </div>
      <div className="card mb-4" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <p style={{ fontSize: 12, color: '#92400E' }}>⚠ {DEMO_LABEL} OAuth, tokens and sync are simulated in the browser; a real connection needs a secure backend (tokens must never be stored in the frontend).</p>
      </div>

      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--border)' }} role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)}
            style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.id ? 'var(--primary)' : 'var(--muted-foreground)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'connection' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Connection status</h3>
            <div className="flex items-center gap-2 mb-3">
              {connected ? <CheckCircle2 size={18} color="#166534" /> : <AlertTriangle size={18} color="#92400E" />}
              <span style={{ fontWeight: 700, fontSize: 14 }}>{connected ? 'Connected (demo)' : 'Disconnected'}</span>
            </div>
            {[
              ['Company', connected ? 'Samko Kitchens Ltd (demo company)' : '—'],
              ['Realm ID', connected ? '9130-DEMO-0001' : '—'],
              ['Authorisation', connected ? 'OAuth 2.0 — tokens held server-side (simulated)' : '—'],
              ['Last successful sync', connected ? `${fmtDate(lastSync)} ${lastSync.slice(11, 16)}` : '—'],
              ['Data freshness', connected ? 'Fresh (< 24h)' : 'Stale'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <div className="flex gap-2 mt-4 flex-wrap">
              {connected ? (
                <>
                  <button className="btn-primary" disabled={!canAdmin || syncing} onClick={() => runSync('Manual')}><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} /> Sync now</button>
                  <button className="btn-secondary" disabled={!canAdmin} onClick={() => { setConnected(false); toast.success('Disconnected (demo)'); }}><Unlink size={14} /> Disconnect</button>
                </>
              ) : (
                <button className="btn-primary" disabled={!canAdmin} onClick={() => { setConnected(true); toast.success('Connected (demo) — no real OAuth performed'); }}><Link2 size={14} /> Connect QuickBooks</button>
              )}
            </div>
            {!canAdmin && <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8 }}>Connection settings are restricted to administrators.</p>}
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Integration notes</h3>
            <ul style={{ fontSize: 12.5, lineHeight: 1.7, paddingLeft: 18, listStyle: 'disc' }}>
              <li>Expense data comes from the QuickBooks Online Accounting API (Purchases, Bills, Journal entries).</li>
              <li><strong>Payroll:</strong> detailed payroll may need a separate payroll integration or extra permissions. This demo assumes payroll arrives as journal / expense postings.</li>
              <li>Restaurant allocation uses QuickBooks <em>Class</em> / <em>Location</em> tags. Untagged items go to <strong>Unallocated</strong> and are excluded from restaurant profit.</li>
              <li>Duplicates are prevented using external transaction IDs; voided / edited transactions are re-synced incrementally.</li>
              <li>Client secret and tokens are never exposed to the browser in a real build.</li>
            </ul>
          </div>
        </div>
      )}

      {tab === 'expenses' && (
        <>
          <div className="mb-3"><DateRangeFilter rangeKey={rangeKey} onRangeKey={setRangeKey} customFrom={customFrom} customTo={customTo} onCustomFrom={setCustomFrom} onCustomTo={setCustomTo} from={from} to={to} /></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {totals.map((t) => (
              <div key={t.cat} className="metric-card" style={t.cat === 'Unallocated' && t.amount > 0 ? { borderColor: '#F59E0B' } : undefined}>
                <p className="label-text">{t.cat}</p>
                <p className="metric-value" style={{ color: t.cat === 'Unallocated' ? '#92400E' : undefined }}>{fmtGBP(t.amount)}</p>
                {t.cat === 'Unallocated' && <p style={{ fontSize: 11, color: '#92400E' }}>Excluded from restaurant profit</p>}
              </div>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search size={13} style={{ position: 'absolute', left: 8, top: 10, color: 'var(--muted-foreground)' }} />
                <input className="input-field" style={{ paddingLeft: 26, width: 210 }} placeholder="Search payee, ref, account…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="input-field" style={{ width: 160 }} value={catFilter} onChange={(e) => setCatFilter(e.target.value as 'All' | ExpenseCategory)} aria-label="Category">
                <option value="All">All categories</option>
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
              {!scope && (
                <select className="input-field" style={{ width: 200 }} value={locFilter} onChange={(e) => setLocFilter(e.target.value)} aria-label="Restaurant">
                  <option value="All">All restaurants</option>
                  <option value="Unallocated">Unallocated</option>
                  {ALL_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              )}
              <button className="btn-secondary ml-auto" style={{ padding: '6px 10px' }} onClick={exportRows}><Download size={13} /> Export CSV</button>
            </div>
            <div className="overflow-x-auto" style={{ maxHeight: 520 }}>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Category</th><th>Account</th><th>Payee</th><th>Description</th><th>Ref</th><th>Amount</th><th>Source</th><th>Restaurant</th><th>Sync</th></tr></thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>No expenses for the selected filters.</td></tr>}
                  {rows.slice(0, 250).map((t) => (
                    <tr key={t.id} style={t.sync === 'Voided' ? { opacity: 0.5, textDecoration: 'line-through' } : undefined}>
                      <td style={{ fontSize: 12 }}>{fmtDate(t.date)}</td>
                      <td style={{ fontSize: 12, color: t.category === 'Unallocated' ? '#92400E' : undefined, fontWeight: t.category === 'Unallocated' ? 700 : 400 }}>{t.category}</td>
                      <td style={{ fontSize: 12 }}>{t.account} <span style={{ color: 'var(--muted-foreground)' }}>({t.accountCode})</span></td>
                      <td style={{ fontSize: 12 }}>{t.payee}</td>
                      <td style={{ fontSize: 12 }}>{t.description}</td>
                      <td className="font-mono" style={{ fontSize: 11 }}>{t.reference}</td>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>{fmtGBP(t.amount)}</td>
                      <td style={{ fontSize: 11 }}>{t.source}</td>
                      <td style={{ fontSize: 12 }}>
                        {t.location === 'Unallocated' && canAdmin ? (
                          <select className="input-field" style={{ width: 150, padding: '3px 6px', fontSize: 11 }} value="" onChange={(e) => { if (e.target.value) { setAllocations((a) => ({ ...a, [t.id]: e.target.value })); toast.success(`Allocated to ${e.target.value} (demo)`); } }} aria-label="Allocate to restaurant">
                            <option value="">Allocate…</option>
                            {ALL_LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                          </select>
                        ) : t.location}
                      </td>
                      <td style={{ fontSize: 11, fontWeight: 600, color: t.sync === 'Synced' ? '#166534' : t.sync === 'Voided' ? '#6B7280' : '#92400E' }}>{t.sync}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--border)', fontSize: 11, color: '#92400E' }}>⚠ {DEMO_LABEL} Showing up to 250 rows.</div>
          </div>
        </>
      )}

      {tab === 'mapping' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card p-0 overflow-hidden xl:col-span-2">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600 }}>QuickBooks account → dashboard category</h3>
            </div>
            <table className="data-table">
              <thead><tr><th>Code</th><th>QuickBooks account</th><th>Dashboard category</th><th>Sub-category</th></tr></thead>
              <tbody>
                {mappings.map((m) => (
                  <tr key={m.id}>
                    <td className="font-mono" style={{ fontSize: 12 }}>{m.accountCode}</td>
                    <td style={{ fontSize: 13 }}>{m.accountName}</td>
                    <td>
                      <select className="input-field" style={{ width: 170 }} disabled={!canAdmin} value={m.category} aria-label={`Category for ${m.accountName}`}
                        onChange={(e) => setMappings((all) => all.map((x) => (x.id === m.id ? { ...x, category: e.target.value as ExpenseCategory } : x)))}>
                        {CATS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize: 12 }}>{m.subCategory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Add account mapping</h3>
            <div className="flex flex-col gap-2">
              <input className="input-field" placeholder="Account code (e.g. 7700)" value={newAcct.accountCode} onChange={(e) => setNewAcct({ ...newAcct, accountCode: e.target.value })} disabled={!canAdmin} />
              <input className="input-field" placeholder="QuickBooks account name" value={newAcct.accountName} onChange={(e) => setNewAcct({ ...newAcct, accountName: e.target.value })} disabled={!canAdmin} />
              <select className="input-field" value={newAcct.category} onChange={(e) => setNewAcct({ ...newAcct, category: e.target.value as ExpenseCategory })} disabled={!canAdmin} aria-label="Category">
                {CATS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input className="input-field" placeholder="Sub-category (optional)" value={newAcct.subCategory} onChange={(e) => setNewAcct({ ...newAcct, subCategory: e.target.value })} disabled={!canAdmin} />
              <button className="btn-primary" onClick={addMapping} disabled={!canAdmin}><Plus size={14} /> Add mapping</button>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 600, margin: '20px 0 8px' }}>Restaurant allocation rules</h3>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.6 }}>
              Transactions are assigned to a restaurant using the QuickBooks <strong>Class</strong> tag matching the restaurant name. Anything without a recognised class is placed in <strong>Unallocated</strong> and excluded from restaurant-level profit, so company-wide costs are never duplicated across sites. {user && !canAdmin ? '' : ''}
            </p>
            {!canAdmin && <p style={{ fontSize: 11, color: '#92400E', marginTop: 8 }}>Mappings are editable by administrators only.</p>}
          </div>
        </div>
      )}

      {tab === 'sync' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>Synchronisation history</h3>
            <button className="btn-secondary" disabled={!canAdmin || syncing} onClick={() => runSync('Manual retry')} style={{ padding: '6px 10px' }}><RefreshCw size={13} /> Retry / sync now</button>
          </div>
          <table className="data-table">
            <thead><tr><th>Time</th><th>Type</th><th>Result</th><th>Detail</th></tr></thead>
            <tbody>
              {syncLog.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontSize: 12 }}>{fmtDate(s.at)} {s.at.slice(11, 16)}</td>
                  <td style={{ fontSize: 12 }}>{s.type}</td>
                  <td style={{ fontSize: 12, fontWeight: 700, color: s.result === 'Success' ? '#166534' : '#991B1B' }}>{s.result}</td>
                  <td style={{ fontSize: 12 }}>{s.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--border)', fontSize: 11, color: '#92400E' }}>⚠ {DEMO_LABEL}</div>
        </div>
      )}
    </AppLayout>
  );
}
