'use client';

import React, { useMemo, useState } from 'react';
import { Search, Plus, Download, Filter, PackageCheck, Archive } from 'lucide-react';
import { GRN, grnValues, LEGACY_ARCHIVE, useTraceability, isoToUk } from '@/data/traceability';
import StatusBadge from '@/components/ui/StatusBadge';
import { useScopedRestaurant, matchesScope } from '@/contexts/AuthContext';
import GRNDetailPanel from './GRNDetailPanel';
import GRNVerificationForm from './GRNVerificationForm';
import NewGRNPanel from './NewGRNPanel';
import { toast } from 'sonner';

const statusMap: Record<string, any> = {
  pending: 'pending',
  'in-progress': 'in-progress',
  completed: 'completed',
  discrepancy: 'discrepancy',
  approved: 'approved',
};

const statusOptions = ['All', 'pending', 'in-progress', 'completed', 'discrepancy', 'approved'];

export default function GoodsReceivedContent() {
  const scope = useScopedRestaurant();
  const { grns: allGrns, hydrated } = useTraceability();
  const grnRecords = useMemo(() => allGrns.filter((g) => matchesScope(scope, g.restaurant)), [allGrns, scope]);
  const [tab, setTab] = useState<'active' | 'archive'>('active');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [verifyId, setVerifyId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const selectedGRN = allGrns.find((g) => g.id === selectedId) ?? null;
  const verifyGRN = allGrns.find((g) => g.id === verifyId) ?? null;

  const filtered = grnRecords.filter((g) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      g.grnId.toLowerCase().includes(q) ||
      g.poNumber.toLowerCase().includes(q) ||
      g.supplier.toLowerCase().includes(q) ||
      g.restaurant.toLowerCase().includes(q) ||
      g.lines.some((l) => l.productName.toLowerCase().includes(q) || l.batchId.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'All' || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totals = grnRecords.reduce(
    (a, g) => {
      const v = grnValues(g);
      return { accepted: a.accepted + (g.approvalStatus === 'approved' || g.status === 'completed' ? v.accepted : 0), discrepancy: a.discrepancy + v.discrepancy };
    },
    { accepted: 0, discrepancy: 0 }
  );

  const summaryStats = [
    { id: 'grn-sum-1', label: 'Total GRNs', value: grnRecords.length.toString(), color: 'var(--foreground)' },
    { id: 'grn-sum-2', label: 'Pending Receipt', value: grnRecords.filter((g) => g.status === 'pending').length.toString(), color: '#92400E' },
    { id: 'grn-sum-3', label: 'Discrepancies', value: grnRecords.filter((g) => g.status === 'discrepancy').length.toString(), color: '#991B1B' },
    { id: 'grn-sum-4', label: 'Total Accepted Value', value: `£${totals.accepted.toFixed(2)}`, color: '#166534' },
  ];

  const legacy = LEGACY_ARCHIVE.filter((l) => l.kind === 'GRN');

  return (
    <>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Goods Received</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 3 }}>
            {scope ?? 'Both Hotels'} · {grnRecords.length} GRNs · {grnRecords.filter((g) => g.status === 'discrepancy').length} discrepancy pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => toast.success('GRN report exported')}>
            <Download size={14} />
            Export
          </button>
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => setNewOpen(true)}>
            <Plus size={14} />
            New GRN
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {([['active', 'Active GRNs'], ['archive', `Archived Legacy (${legacy.length})`]] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="rounded-full px-4 py-1.5"
            style={{ fontSize: 12.5, fontWeight: 600, border: 'none', cursor: 'pointer', background: tab === k ? 'var(--primary)' : 'var(--muted)', color: tab === k ? '#fff' : 'var(--muted-foreground)' }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'archive' ? (
        <div className="card-elevated overflow-hidden">
          <div className="px-4 py-3 flex items-start gap-2" style={{ background: '#FFFBEB', borderBottom: '1px solid #FDE68A' }}>
            <Archive size={14} style={{ color: '#92400E', marginTop: 2 }} />
            <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
              Read-only history from the previous South Indian menu and removed locations. These records are retained for audit, are not assigned to either hotel, are not mapped to the new Raw Material Master and cannot be used in new transactions.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--muted)' }}>
                  {['GRN', 'Legacy Items', 'Detail', 'Location', 'Date'].map((h) => (
                    <th key={h} className="text-left label-text" style={{ padding: '10px 14px', fontSize: 11, borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {legacy.map((l) => (
                  <tr key={l.id} style={{ borderBottom: '1px solid var(--border)', opacity: 0.8 }}>
                    <td style={{ padding: '12px 14px' }}><span className="font-mono font-semibold" style={{ fontSize: 13 }}>{l.reference}</span></td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5 }}>{l.item}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--muted-foreground)' }}>{l.detail}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5 }}>{l.location}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5 }}>{isoToUk(l.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {summaryStats.map((s) => (
              <div key={s.id} className={s.id === 'grn-sum-3' && s.value !== '0' ? 'metric-card-alert' : 'metric-card'}>
                <p className="label-text" style={{ fontSize: 11.5 }}>{s.label}</p>
                <p className="metric-value mt-1" style={{ fontSize: 22, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="card-elevated mb-4" style={{ padding: '14px 16px' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative" style={{ minWidth: 260 }}>
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input
                  type="text"
                  placeholder="Search GRN, PO, supplier, ingredient, batch…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-9"
                  style={{ padding: '7px 12px 7px 34px', fontSize: 13 }}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Filter size={13} style={{ color: 'var(--muted-foreground)' }} />
                <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Status:</span>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {statusOptions.map((s) => (
                  <button
                    key={`grnf-${s}`}
                    onClick={() => setStatusFilter(s)}
                    className="rounded-full px-3 py-1 transition-colors"
                    style={{ fontSize: 11.5, fontWeight: 500, background: statusFilter === s ? 'var(--primary)' : 'var(--muted)', color: statusFilter === s ? '#fff' : 'var(--muted-foreground)', border: 'none', cursor: 'pointer' }}
                  >
                    {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 1000 }}>
                <thead>
                  <tr style={{ background: 'var(--muted)' }}>
                    {['GRN ID', 'PO', 'Supplier', 'Hotel', 'Items', 'Purchased', 'Expected', 'Accepted', 'Discrepancy', 'Status', 'Approval', ''].map((h, i) => (
                      <th key={`grnth-${i}`} className="text-left label-text" style={{ padding: '10px 14px', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {!hydrated ? null : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-12" style={{ color: 'var(--muted-foreground)', fontSize: 13.5 }}>No GRN records match your filters.</td>
                    </tr>
                  ) : (
                    filtered.map((grn, idx) => {
                      const v = grnValues(grn);
                      return (
                        <tr
                          key={grn.id}
                          className="table-row-hover cursor-pointer"
                          style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                          onClick={() => setSelectedId(grn.id)}
                        >
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span className="font-mono font-semibold" style={{ fontSize: 13, color: 'var(--primary)' }}>{grn.grnId}</span>
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <span className="font-mono" style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{grn.poNumber}</span>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>{grn.supplier}</td>
                          <td style={{ padding: '12px 14px' }}>
                            <div className="flex items-center gap-2">
                              <span className="rounded font-bold text-white" style={{ fontSize: 10, padding: '2px 6px', background: 'var(--primary)' }}>{grn.restaurantCode}</span>
                              <span style={{ fontSize: 13 }}>{grn.restaurant}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--muted-foreground)' }}>{grn.lines.length} lines</td>
                          <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{isoToUk(grn.purchaseDate)}</td>
                          <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>£{v.expected.toFixed(2)}</td>
                          <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>
                            {v.accepted > 0 ? `£${v.accepted.toFixed(2)}` : '—'}
                          </td>
                          <td className="tabular-nums" style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            {v.discrepancy > 0 ? (
                              <span className="font-bold" style={{ fontSize: 13, color: '#991B1B' }}>−£{v.discrepancy.toFixed(2)}</span>
                            ) : (
                              <span style={{ fontSize: 13, color: '#166534' }}>None</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <StatusBadge variant={statusMap[grn.status]} label={grn.status.charAt(0).toUpperCase() + grn.status.slice(1).replace('-', ' ')} dot />
                          </td>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            <StatusBadge
                              variant={grn.approvalStatus === 'approved' ? 'approved' : grn.approvalStatus === 'rejected' ? 'failed' : 'pending'}
                              label={grn.approvalStatus.charAt(0).toUpperCase() + grn.approvalStatus.slice(1)}
                            />
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div className="flex items-center gap-1.5">
                              <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setSelectedId(grn.id); }}>View</button>
                              {grn.status === 'pending' && (
                                <button className="btn-primary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); setVerifyId(grn.id); }}>
                                  <PackageCheck size={12} />
                                  Verify
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{filtered.length} of {grnRecords.length} GRNs</span>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                Total discrepancy value: <strong style={{ color: '#991B1B' }}>£{totals.discrepancy.toFixed(2)}</strong>
              </span>
            </div>
          </div>
        </>
      )}

      {selectedGRN && <GRNDetailPanel grn={selectedGRN} open onClose={() => setSelectedId(null)} />}
      {verifyGRN && <GRNVerificationForm grn={verifyGRN} open onClose={() => setVerifyId(null)} />}
      {newOpen && <NewGRNPanel onClose={() => setNewOpen(false)} />}
    </>
  );
}