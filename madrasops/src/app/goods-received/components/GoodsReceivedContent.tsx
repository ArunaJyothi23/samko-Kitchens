'use client';

import React, { useState } from 'react';
import { Search, Plus, Download, Filter, PackageCheck } from 'lucide-react';
import { grnRecords as allGrnRecords, GRN } from './grnData';
import StatusBadge from '@/components/ui/StatusBadge';
import { useScopedRestaurant, matchesScope } from '@/contexts/AuthContext';
import GRNDetailPanel from './GRNDetailPanel';
import GRNVerificationForm from './GRNVerificationForm';
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
  const grnRecords = allGrnRecords.filter((g) => matchesScope(scope, g.restaurant));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyGRN, setVerifyGRN] = useState<GRN | null>(null);

  const filtered = grnRecords.filter((g) => {
    const matchSearch =
      !search ||
      g.grnId.toLowerCase().includes(search.toLowerCase()) ||
      g.dispatchRef.toLowerCase().includes(search.toLowerCase()) ||
      g.restaurant.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'All' || g.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const summaryStats = [
    { id: 'grn-sum-1', label: 'Total GRNs Today', value: grnRecords.length.toString(), color: 'var(--foreground)' },
    { id: 'grn-sum-2', label: 'Pending Receipt', value: grnRecords.filter(g => g.status === 'pending').length.toString(), color: '#92400E' },
    { id: 'grn-sum-3', label: 'Discrepancies', value: grnRecords.filter(g => g.status === 'discrepancy').length.toString(), color: '#991B1B' },
    { id: 'grn-sum-4', label: 'Total Accepted Value', value: `£${grnRecords.reduce((s, g) => s + g.totalAcceptedValue, 0).toFixed(2)}`, color: '#166534' },
  ];

  return (
    <>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Goods Received</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 3 }}>
            {scope ? `Samko ${scope}` : 'All Restaurants'} · {grnRecords.length} GRNs today · {grnRecords.filter((g) => g.status === 'discrepancy').length} discrepancy pending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => toast.success('GRN report exported')}>
            <Download size={14} />
            Export
          </button>
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => toast.info('Scan QR code or select dispatch order to create GRN')}>
            <Plus size={14} />
            New GRN
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-6">
        {summaryStats.map((s) => (
          <div key={s.id} className={s.id === 'grn-sum-3' && s.value !== '0' ? 'metric-card-alert' : 'metric-card'}>
            <p className="label-text" style={{ fontSize: 11.5 }}>{s.label}</p>
            <p className="metric-value mt-1" style={{ fontSize: 22, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-elevated mb-4" style={{ padding: '14px 16px' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" style={{ minWidth: 240 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search GRN ID, dispatch ref, restaurant…"
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
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  background: statusFilter === s ? 'var(--primary)' : 'var(--muted)',
                  color: statusFilter === s ? '#fff' : 'var(--muted-foreground)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {s === 'All' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {['GRN ID', 'Dispatch Ref', 'Restaurant', 'Received By', 'Date / Time', 'Expected', 'Accepted', 'Discrepancy', 'Status', 'Approval', ''].map((h, i) => (
                  <th
                    key={`grnth-${i}`}
                    className="text-left label-text"
                    style={{ padding: '10px 14px', fontSize: 11, whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12" style={{ color: 'var(--muted-foreground)', fontSize: 13.5 }}>
                    No GRN records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((grn, idx) => (
                  <tr
                    key={grn.id}
                    className="table-row-hover cursor-pointer"
                    style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onClick={() => { setSelectedGRN(grn); setDetailOpen(true); }}
                  >
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="font-mono font-semibold" style={{ fontSize: 13, color: 'var(--primary)' }}>
                        {grn.grnId}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="font-mono" style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
                        {grn.dispatchRef}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded font-bold text-white"
                          style={{ fontSize: 10, padding: '2px 6px', background: 'var(--primary)' }}
                        >
                          {grn.restaurantCode}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--foreground)' }}>
                          {grn.restaurant.replace('Samko ', '')}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {grn.receivedBy}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                      {grn.receivedAt}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      £{grn.totalExpectedValue.toFixed(2)}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#166534', whiteSpace: 'nowrap' }}>
                      {grn.totalAcceptedValue > 0 ? `£${grn.totalAcceptedValue.toFixed(2)}` : '—'}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {grn.discrepancyValue > 0 ? (
                        <span className="font-bold" style={{ fontSize: 13, color: '#991B1B' }}>
                          −£{grn.discrepancyValue.toFixed(2)}
                        </span>
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
                        <button
                          className="btn-ghost"
                          style={{ padding: '4px 10px', fontSize: 12 }}
                          onClick={(e) => { e.stopPropagation(); setSelectedGRN(grn); setDetailOpen(true); }}
                        >
                          View
                        </button>
                        {grn.status === 'pending' && (
                          <button
                            className="btn-primary"
                            style={{ padding: '4px 10px', fontSize: 12 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVerifyGRN(grn);
                              setVerifyOpen(true);
                            }}
                          >
                            <PackageCheck size={12} />
                            Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          className="flex items-center justify-between px-4 py-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
            {filtered.length} of {grnRecords.length} GRNs
          </span>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            Total discrepancy value: <strong style={{ color: '#991B1B' }}>
              £{grnRecords.reduce((s, g) => s + g.discrepancyValue, 0).toFixed(2)}
            </strong>
          </span>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedGRN && (
        <GRNDetailPanel
          grn={selectedGRN}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
        />
      )}

      {/* Verification Form */}
      {verifyGRN && (
        <GRNVerificationForm
          grn={verifyGRN}
          open={verifyOpen}
          onClose={() => setVerifyOpen(false)}
        />
      )}
    </>
  );
}