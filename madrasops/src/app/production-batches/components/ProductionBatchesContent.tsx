'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Plus, Download, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { productionBatches, ProductionBatch } from './productionData';
import BatchDetailDrawer from './BatchDetailDrawer';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

type SortKey = 'batchId' | 'recipeName' | 'plannedYield' | 'actualYield' | 'yieldPct' | 'costPerKg' | 'productionDate' | 'expiryDate';
type SortDir = 'asc' | 'desc';

const statusOptions = ['All', 'completed', 'in-progress', 'draft', 'dispatched', 'cancelled'];
const categoryOptions = ['All', 'Batters', 'Accompaniments', 'Chutneys', 'Fillings', 'Gravies', 'Soups', 'Rice Dishes'];

export default function ProductionBatchesContent() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortKey, setSortKey] = useState<SortKey>('productionDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let rows = [...productionBatches];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.batchId.toLowerCase().includes(q) ||
          r.recipeName.toLowerCase().includes(q) ||
          r.staff.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') rows = rows.filter((r) => r.status === statusFilter);
    if (categoryFilter !== 'All') rows = rows.filter((r) => r.category === categoryFilter);
    rows.sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [search, statusFilter, categoryFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openDrawer = (batch: ProductionBatch) => {
    setSelectedBatch(batch);
    setDrawerOpen(true);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={12} style={{ color: 'var(--muted-foreground)', opacity: 0.5 }} />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} style={{ color: 'var(--primary)' }} />
      : <ChevronDown size={12} style={{ color: 'var(--primary)' }} />;
  };

  const yieldColor = (pct: number | null) => {
    if (pct === null) return 'var(--muted-foreground)';
    if (pct >= 97) return '#166534';
    if (pct >= 92) return '#92400E';
    return '#991B1B';
  };

  const statusMap: Record<string, 'completed' | 'in-progress' | 'draft' | 'dispatched' | 'cancelled'> = {
    completed: 'completed',
    'in-progress': 'in-progress',
    draft: 'draft',
    dispatched: 'dispatched',
    cancelled: 'cancelled',
  };

  return (
    <>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Production Batches</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 3 }}>
            Central Kitchen · {productionBatches.length} batches · Last updated 06:17
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn-secondary" style={{ padding: '8px 12px' }} onClick={() => toast.success('Report exported as CSV')}>
            <Download size={14} />
            Export CSV
          </button>
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => toast.info('New production batch form coming soon')}>
            <Plus size={14} />
            New Batch
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-6">
        {[
          { id: 'pb-sum-1', label: 'Total Batches', value: productionBatches.length.toString(), color: 'var(--foreground)' },
          { id: 'pb-sum-2', label: 'In Progress', value: productionBatches.filter(b => b.status === 'in-progress').toString().length > 0 ? productionBatches.filter(b => b.status === 'in-progress').length.toString() : '2', color: '#1E40AF' },
          { id: 'pb-sum-3', label: 'Avg Yield %', value: '96.1%', color: '#166534' },
          { id: 'pb-sum-4', label: 'Yield Variance Alert', value: '1 batch', color: '#991B1B' },
        ].map((s) => (
          <div key={s.id} className="metric-card">
            <p className="label-text" style={{ fontSize: 11.5 }}>{s.label}</p>
            <p className="metric-value mt-1" style={{ fontSize: 22, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-elevated mb-4" style={{ padding: '14px 16px' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1" style={{ minWidth: 220 }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
            <input
              type="text"
              placeholder="Search batch ID, recipe, staff…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="input-field pl-9"
              style={{ padding: '7px 12px 7px 34px', fontSize: 13 }}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter size={13} style={{ color: 'var(--muted-foreground)' }} />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Status:</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {statusOptions.map((s) => (
                <button
                  key={`status-filter-${s}`}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={{
                    fontSize: 11.5,
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
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-lg border px-3 py-1.5 text-sm"
            style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 12.5, outline: 'none' }}
          >
            {categoryOptions.map((c) => (
              <option key={`cat-opt-${c}`} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 1000 }}>
            <thead>
              <tr style={{ background: 'var(--muted)' }}>
                {[
                  { label: 'Batch ID', key: 'batchId' as SortKey },
                  { label: 'Recipe / Product', key: 'recipeName' as SortKey },
                  { label: 'Category', key: null },
                  { label: 'Planned Yield', key: 'plannedYield' as SortKey },
                  { label: 'Actual Yield', key: 'actualYield' as SortKey },
                  { label: 'Yield %', key: 'yieldPct' as SortKey },
                  { label: 'Cost / kg', key: 'costPerKg' as SortKey },
                  { label: 'Production Date', key: 'productionDate' as SortKey },
                  { label: 'Expiry Date', key: 'expiryDate' as SortKey },
                  { label: 'Status', key: null },
                  { label: 'Staff', key: null },
                  { label: '', key: null },
                ].map((col, i) => (
                  <th
                    key={`pbth-${i}`}
                    className="text-left label-text"
                    style={{
                      padding: '10px 14px',
                      fontSize: 11,
                      whiteSpace: 'nowrap',
                      borderBottom: '1px solid var(--border)',
                      cursor: col.key ? 'pointer' : 'default',
                    }}
                    onClick={() => col.key && handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {col.key && <SortIcon col={col.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12" style={{ color: 'var(--muted-foreground)', fontSize: 13.5 }}>
                    No production batches match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((batch, idx) => (
                  <tr
                    key={batch.id}
                    className="table-row-hover cursor-pointer"
                    style={{ borderBottom: idx < paginated.length - 1 ? '1px solid var(--border)' : 'none' }}
                    onClick={() => openDrawer(batch)}
                  >
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span className="font-mono font-semibold" style={{ fontSize: 12.5, color: 'var(--primary)' }}>
                        {batch.batchId}
                      </span>
                      <div style={{ fontSize: 10.5, color: 'var(--muted-foreground)', marginTop: 1 }}>
                        {batch.julianDate}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="font-semibold" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                        {batch.recipeName}
                      </span>
                      {batch.notes && (
                        <div className="truncate" style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 1, maxWidth: 180 }}>
                          {batch.notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: 11 }}
                      >
                        {batch.category}
                      </span>
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13.5, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      {batch.plannedYield} {batch.yieldUnit}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13.5, whiteSpace: 'nowrap' }}>
                      {batch.actualYield !== null ? (
                        <span style={{ color: 'var(--foreground)' }}>{batch.actualYield} {batch.yieldUnit}</span>
                      ) : (
                        <span style={{ color: 'var(--muted-foreground)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      {batch.yieldPct !== null ? (
                        <span className="font-bold tabular-nums" style={{ fontSize: 13.5, color: yieldColor(batch.yieldPct) }}>
                          {batch.yieldPct}%
                        </span>
                      ) : (
                        <span style={{ color: 'var(--muted-foreground)', fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td className="tabular-nums" style={{ padding: '12px 14px', fontSize: 13.5, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      {batch.costPerKg !== null ? `£${batch.costPerKg.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                      {batch.productionDate}
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: batch.expiryDate === '11/10/2026' || batch.expiryDate === '12/10/2026' ?'#991B1B' :'var(--foreground)',
                          fontWeight: batch.expiryDate === '12/10/2026' ? 600 : 400,
                        }}
                      >
                        {batch.expiryDate}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <StatusBadge variant={statusMap[batch.status] || 'draft'} label={batch.status.charAt(0).toUpperCase() + batch.status.slice(1).replace('-', ' ')} dot />
                    </td>
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>{batch.staff}</span>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={(e) => { e.stopPropagation(); openDrawer(batch); }}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between px-4 py-3 border-t flex-wrap gap-3"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 12.5, color: 'var(--muted-foreground)' }}>
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} batches
            </span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded border px-2 py-1 text-xs"
              style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--foreground)', fontSize: 12, outline: 'none' }}
            >
              {[10, 25, 50].map((s) => <option key={`ps-${s}`} value={s}>{s} per page</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12, opacity: page === 1 ? 0.4 : 1 }}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={`pg-${p}`}
                onClick={() => setPage(p)}
                className="rounded-md px-3 py-1 text-xs font-medium transition-colors"
                style={{
                  fontSize: 12,
                  background: page === p ? 'var(--primary)' : 'transparent',
                  color: page === p ? '#fff' : 'var(--muted-foreground)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="btn-ghost"
              style={{ padding: '4px 10px', fontSize: 12, opacity: page === totalPages ? 0.4 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <BatchDetailDrawer
        batch={selectedBatch}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}