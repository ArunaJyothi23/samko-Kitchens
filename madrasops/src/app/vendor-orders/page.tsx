'use client';

import React, { useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth, useScopedRestaurant, matchesScope } from '@/contexts/AuthContext';
import { usePurchaseStore, PurchaseOrder, formatDate, formatDateTime, SUPPLIERS } from '@/app/purchase/components/purchaseStore';
import { DEMO_LABEL } from '../finance/components/financeData';
import { CommStatus, IntegrationType, useVendorComms, VendorConfig } from './components/vendorCommsStore';
import VendorPoPanel, { CommBadge } from './components/VendorPoPanel';

type Tab = 'orders' | 'monitor' | 'vendors';

const COMM_STATUSES: CommStatus[] = ['Not Sent', 'Ready to Send', 'Sending', 'Sent to Vendor', 'Acknowledged', 'Partially Confirmed', 'Confirmed', 'Rejected', 'Failed', 'Cancelled'];
const INT_TYPES: IntegrationType[] = ['Direct API', 'Vendor Portal', 'Email', 'Secure File (CSV/XML)', 'None (Manual)'];

export default function VendorOrdersPage() {
  const scope = useScopedRestaurant();
  const { user } = useAuth();
  const { orders, hydrated } = usePurchaseStore();
  const vc = useVendorComms();
  const [tab, setTab] = useState<Tab>('orders');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | CommStatus>('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | IntegrationType>('All');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const canManage = !scope; // administrators / non-restaurant roles can send & amend
  const actor = user?.name ?? 'Demo user';

  const scoped = useMemo(() => orders.filter((o) => matchesScope(scope, o.restaurant)), [orders, scope]);
  const vendorOf = (name: string) => vc.vendors.find((v) => v.name === name);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped.filter((o) => {
      const c = vc.getComm(o.poNumber);
      const v = vendorOf(o.vendor);
      const day = o.createdAt.slice(0, 10);
      return (
        (statusFilter === 'All' || c.status === statusFilter) &&
        (vendorFilter === 'All' || o.vendor === vendorFilter) &&
        (typeFilter === 'All' || v?.integrationType === typeFilter) &&
        (!from || day >= from) &&
        (!to || day <= to) &&
        (!q || `${o.poNumber} ${o.vendor} ${o.restaurant}`.toLowerCase().includes(q))
      );
    });
  }, [scoped, vc.comms, vc.vendors, search, statusFilter, vendorFilter, typeFilter, from, to]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected: PurchaseOrder | undefined = scoped.find((o) => o.id === selectedId);

  const count = (pred: (s: CommStatus) => boolean) => scoped.filter((o) => pred(vc.getComm(o.poNumber).status)).length;
  const awaitingTx = scoped.filter((o) => {
    const v = vendorOf(o.vendor);
    return o.status === 'pending' && v && v.integrationType !== 'None (Manual)' && ['Not Sent', 'Ready to Send'].includes(vc.getComm(o.poNumber).status);
  }).length;
  const kpis = [
    { label: 'Awaiting transmission', value: awaitingTx },
    { label: 'Sent successfully', value: count((s) => ['Sent to Vendor', 'Acknowledged', 'Partially Confirmed', 'Confirmed'].includes(s)) },
    { label: 'Awaiting vendor response', value: count((s) => s === 'Sent to Vendor') },
    { label: 'Confirmed', value: count((s) => s === 'Confirmed') },
    { label: 'Rejected', value: count((s) => s === 'Rejected') },
    { label: 'Failed transmissions', value: count((s) => s === 'Failed') },
    { label: 'Integrations needing attention', value: vc.vendors.filter((v) => v.integrationStatus === 'Needs Attention').length },
  ];

  const handleSend = (o: PurchaseOrder) => {
    const res = vc.sendToVendor(o.poNumber, o.vendor, actor);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
  };

  const editVendor = (name: string, patch: Partial<VendorConfig>) => {
    vc.updateVendor(name, patch);
    toast.success('Vendor configuration updated (demo)');
  };

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'orders', label: 'Purchase Orders' },
    { id: 'monitor', label: 'Integration Monitor', adminOnly: true },
    { id: 'vendors', label: 'Vendor Configuration', adminOnly: true },
  ];

  return (
    <AppLayout>
      <div className="mb-4">
        <h1 className="page-title">Vendor Purchase Orders</h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>Send POs to vendors, track responses and review communication history. Existing PO creation and goods receipt (GRN) workflows are unchanged.</p>
      </div>
      <div className="card mb-4" style={{ background: '#FFFBEB', borderColor: '#FDE68A' }}>
        <p style={{ fontSize: 12, color: '#92400E' }}>⚠ {DEMO_LABEL} Vendor connectors are simulated; credentials are never stored in the browser. Stock is updated only via Purchase → Pending Orders → Received.</p>
      </div>

      <div className="flex gap-1 mb-4 border-b" style={{ borderColor: 'var(--border)' }} role="tablist">
        {tabs.filter((t) => !t.adminOnly || canManage).map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} type="button" onClick={() => setTab(t.id)}
            style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', borderBottom: tab === t.id ? '2px solid var(--primary)' : '2px solid transparent', color: tab === t.id ? 'var(--primary)' : 'var(--muted-foreground)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'monitor' && canManage && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {kpis.map((k) => (
              <div key={k.label} className="metric-card"><p className="label-text">{k.label}</p><p className="metric-value">{hydrated ? k.value : 0}</p></div>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>Failed &amp; attention-needed items</h3></div>
            <table className="data-table">
              <thead><tr><th>PO</th><th>Vendor</th><th>Restaurant</th><th>Status</th><th>Last error</th><th></th></tr></thead>
              <tbody>
                {scoped.filter((o) => vc.getComm(o.poNumber).status === 'Failed').length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)' }}>No failed transmissions.</td></tr>
                )}
                {scoped.filter((o) => vc.getComm(o.poNumber).status === 'Failed').map((o) => {
                  const c = vc.getComm(o.poNumber);
                  return (
                    <tr key={o.id}>
                      <td className="font-mono" style={{ fontSize: 12 }}>{o.poNumber}</td>
                      <td style={{ fontSize: 12 }}>{o.vendor}</td>
                      <td style={{ fontSize: 12 }}>{o.restaurant}</td>
                      <td><CommBadge status={c.status} /></td>
                      <td style={{ fontSize: 12 }}>{c.events[0]?.detail ?? '—'}</td>
                      <td><button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleSend(o)}><RotateCcw size={12} /> Retry</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 8 }}>Use the Purchase Orders tab to filter by vendor, restaurant, date, status and integration type.</p>
        </>
      )}

      {tab === 'orders' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search size={13} style={{ position: 'absolute', left: 8, top: 10, color: 'var(--muted-foreground)' }} />
              <input className="input-field" style={{ paddingLeft: 26, width: 190 }} placeholder="Search PO, vendor…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-field" style={{ width: 170 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'All' | CommStatus)} aria-label="Communication status">
              <option value="All">All comm. statuses</option>
              {COMM_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="input-field" style={{ width: 170 }} value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} aria-label="Vendor">
              <option value="All">All vendors</option>
              {SUPPLIERS.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="input-field" style={{ width: 170 }} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'All' | IntegrationType)} aria-label="Integration type">
              <option value="All">All integration types</option>
              {INT_TYPES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <input type="date" className="input-field" style={{ width: 140 }} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <input type="date" className="input-field" style={{ width: 140 }} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>PO</th><th>Restaurant</th><th>Vendor</th><th>Integration</th><th>Created</th><th>Total</th><th>Goods receipt</th><th>Vendor comms</th><th></th></tr></thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={9} style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--muted-foreground)', padding: 24 }}>
                    {hydrated && scoped.length === 0 ? 'No purchase orders yet. Create one under Purchase → Create Order, then return here to send it to the vendor.' : 'No purchase orders match the filters.'}
                  </td></tr>
                )}
                {rows.map((o) => {
                  const c = vc.getComm(o.poNumber);
                  const v = vendorOf(o.vendor);
                  return (
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedId(o.id)}>
                      <td className="font-mono" style={{ fontSize: 12, fontWeight: 600 }}>{o.poNumber}</td>
                      <td style={{ fontSize: 12 }}>{o.restaurant}</td>
                      <td style={{ fontSize: 12 }}>{o.vendor}</td>
                      <td style={{ fontSize: 11.5 }}>{v?.integrationType ?? 'None (Manual)'}</td>
                      <td style={{ fontSize: 12 }}>{formatDate(o.createdAt)}</td>
                      <td style={{ fontSize: 12, fontWeight: 600 }}>£{o.total.toFixed(2)}</td>
                      <td style={{ fontSize: 12 }}>{o.status === 'received' ? 'Received' : 'Pending'}</td>
                      <td><CommBadge status={c.status} /></td>
                      <td style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{c.sentAt ? formatDateTime(c.sentAt) : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'vendors' && canManage && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}><h3 style={{ fontSize: 14, fontWeight: 600 }}>Vendor integration configuration</h3></div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Vendor</th><th>Integration type</th><th>Endpoint / contact</th><th>Auth</th><th>Account ref</th><th>Status</th><th>Last success</th><th>Last error</th></tr></thead>
              <tbody>
                {vc.vendors.map((v) => (
                  <tr key={v.name}>
                    <td style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</td>
                    <td>
                      <select className="input-field" style={{ width: 170 }} value={v.integrationType} onChange={(e) => editVendor(v.name, { integrationType: e.target.value as IntegrationType, integrationStatus: e.target.value === 'None (Manual)' ? 'Not Configured' : 'Active' })} aria-label={`Integration type for ${v.name}`}>
                        {INT_TYPES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td style={{ fontSize: 11.5, maxWidth: 220, wordBreak: 'break-all' }}>{v.endpoint || v.email || '—'}</td>
                    <td style={{ fontSize: 11.5 }}>{v.authMethod}</td>
                    <td className="font-mono" style={{ fontSize: 11.5 }}>{v.accountRef || '—'}</td>
                    <td style={{ fontSize: 12, fontWeight: 700, color: v.integrationStatus === 'Active' ? '#166534' : v.integrationStatus === 'Needs Attention' ? '#991B1B' : '#6B7280' }}>{v.integrationStatus}</td>
                    <td style={{ fontSize: 11.5 }}>{v.lastSuccess ? formatDateTime(v.lastSuccess) : '—'}</td>
                    <td style={{ fontSize: 11.5, color: '#991B1B' }}>{v.lastError || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t" style={{ borderColor: 'var(--border)', fontSize: 11, color: '#92400E' }}>⚠ {DEMO_LABEL} Endpoints are placeholders. Real credentials must be stored server-side only. Vendors without integrations keep using the manual PO process.</div>
        </div>
      )}

      {selected && (
        <VendorPoPanel
          order={selected}
          comm={vc.getComm(selected.poNumber)}
          vendor={vendorOf(selected.vendor)}
          actor={actor}
          canManage={canManage}
          onClose={() => setSelectedId(null)}
          onSend={() => handleSend(selected)}
          onCancel={() => { vc.cancelPo(selected.poNumber, actor); toast.success('PO marked cancelled in vendor comms'); }}
          onRecord={(input) => vc.recordResponse(selected.poNumber, actor, input)}
          onReview={(id, decision) => { vc.reviewChange(selected.poNumber, id, decision, actor); toast.success(`Change ${decision.toLowerCase()}`); }}
        />
      )}
    </AppLayout>
  );
}
