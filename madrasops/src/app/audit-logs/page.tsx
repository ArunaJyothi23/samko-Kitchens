'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, Download, Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS, NEW_RESTAURANT_NAMES } from '@/contexts/AuthContext';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: string;
  action: string;
  module: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'critical';
  restaurant: string;
}

const baseAuditData: AuditEntry[] = [
  { id: 'AUD-001', timestamp: '2026-10-11 12:34:22', user: 'Anita Menon', userRole: 'Restaurant Manager', action: 'STOCK_ADJUSTMENT', module: 'Inventory', entity: 'StockBatch', entityId: 'BT-2026-283-001', details: 'Approved stock adjustment: Dosa Batter +0.5 kg — reason: Counting error', ipAddress: '192.168.1.10', severity: 'warning', restaurant: 'Hounslow' },
  { id: 'AUD-002', timestamp: '2026-10-11 12:34:05', user: 'System (EPOS)', userRole: 'System', action: 'STOCK_DEDUCTION', module: 'EPOS Orders', entity: 'EPOSOrder', entityId: 'MF-HOU-10482', details: 'Recipe consumption posted: Masala Dosa — 160g total from BT-2026-283-001', ipAddress: 'webhook', severity: 'info', restaurant: 'Hounslow' },
  { id: 'AUD-003', timestamp: '2026-10-11 11:55:10', user: 'Priya Sharma', userRole: 'Kitchen Manager', action: 'RECIPE_APPROVED', module: 'Recipe Costing', entity: 'Recipe', entityId: 'RC-001', details: 'Recipe approved: Masala Dosa v1.0 — activated for stock deduction', ipAddress: '192.168.0.5', severity: 'info', restaurant: 'Central Kitchen' },
  { id: 'AUD-004', timestamp: '2026-10-11 10:22:45', user: 'Anita Menon', userRole: 'Restaurant Manager', action: 'WASTAGE_APPROVED', module: 'Wastage', entity: 'WastageRecord', entityId: 'W-001', details: 'Wastage approved: Dosa Batter 500g — Expired Stock', ipAddress: '192.168.1.10', severity: 'warning', restaurant: 'Hounslow' },
  { id: 'AUD-005', timestamp: '2026-10-11 09:15:33', user: 'Priya Sharma', userRole: 'Kitchen Manager', action: 'DISPATCH_CREATED', module: 'Dispatch', entity: 'DispatchOrder', entityId: 'DO-2026-283-H01', details: 'Dispatch created: 15 kg Dosa Batter to Hounslow — batch BT-2026-283-001', ipAddress: '192.168.0.5', severity: 'info', restaurant: 'Central Kitchen' },
  { id: 'AUD-006', timestamp: '2026-10-11 08:45:00', user: 'Anita Menon', userRole: 'Restaurant Manager', action: 'GRN_CONFIRMED', module: 'Goods Received', entity: 'GRN', entityId: 'GRN-2026-283-H01', details: 'GRN confirmed: 15 kg Dosa Batter accepted — DO-2026-283-H01', ipAddress: '192.168.1.10', severity: 'info', restaurant: 'Hounslow' },
  { id: 'AUD-007', timestamp: '2026-10-11 07:30:15', user: 'Rajesh Kumar', userRole: 'Business Owner', action: 'USER_CREATED', module: 'Users', entity: 'User', entityId: 'USR-008', details: 'New user created: Ravi Krishnan — Central Kitchen Staff', ipAddress: '192.168.0.1', severity: 'info', restaurant: 'All' },
  { id: 'AUD-008', timestamp: '2026-10-10 23:55:00', user: 'System', userRole: 'System', action: 'BATCH_EXPIRED', module: 'Inventory', entity: 'StockBatch', entityId: 'BT-2026-282-010', details: 'Batch auto-quarantined: Cooked Rice BT-2026-282-010 — expiry date passed', ipAddress: 'system', severity: 'critical', restaurant: 'Dartford' },
  { id: 'AUD-009', timestamp: '2026-10-10 22:10:00', user: 'Kumar Rajan', userRole: 'Restaurant Manager', action: 'STOCKTAKE_SUBMITTED', module: 'Inventory', entity: 'Stocktake', entityId: 'ST-2026-283-D01', details: 'Stocktake submitted: Dartford — 3 variances requiring approval', ipAddress: '192.168.2.5', severity: 'warning', restaurant: 'Dartford' },
  { id: 'AUD-010', timestamp: '2026-10-10 21:00:00', user: 'System (EPOS)', userRole: 'System', action: 'DUPLICATE_BLOCKED', module: 'EPOS Orders', entity: 'EPOSEvent', entityId: 'EVT-DUP-001', details: 'Duplicate webhook event blocked — idempotency key already processed', ipAddress: 'webhook', severity: 'warning', restaurant: 'Hounslow' },
  { id: 'AUD-011', timestamp: '2026-10-10 18:30:00', user: 'Vikram Nair', userRole: 'Finance / Auditor', action: 'REPORT_EXPORTED', module: 'Reports', entity: 'Report', entityId: 'R-007', details: 'Menu Item Profitability report exported as CSV', ipAddress: '192.168.0.8', severity: 'info', restaurant: 'All' },
  { id: 'AUD-012', timestamp: '2026-10-10 16:00:00', user: 'Anita Menon', userRole: 'Restaurant Manager', action: 'ORDER_REVERSED', module: 'EPOS Orders', entity: 'EPOSOrder', entityId: 'MF-HOU-10480', details: 'Order cancelled — compensating stock movement posted for Plain Dosa', ipAddress: '192.168.1.10', severity: 'warning', restaurant: 'Hounslow' },
];

const newAuditData: AuditEntry[] = NEW_RESTAURANTS.flatMap((r, i) => [
  { id: `AUD-${r.code}-1`, timestamp: `2026-10-11 0${7 + (i % 3)}:${String(10 + i * 4).padStart(2, '0')}:00`, user: r.managerName, userRole: 'Restaurant Manager', action: 'GRN_CONFIRMED', module: 'Goods Received', entity: 'GRN', entityId: `GRN-${200 + i * 2}`, details: `GRN confirmed at ${r.name}: delivery accepted in full`, ipAddress: `192.168.${10 + i}.10`, severity: 'info' as const, restaurant: r.name },
  { id: `AUD-${r.code}-2`, timestamp: `2026-10-11 1${i % 3}:${String(20 + i * 3).padStart(2, '0')}:00`, user: r.managerName, userRole: 'Restaurant Manager', action: 'WASTAGE_APPROVED', module: 'Wastage', entity: 'WastageRecord', entityId: `W-${r.code.toLowerCase()}-1`, details: `Wastage approved at ${r.name}: Dosa Batter 600g — Expired Stock`, ipAddress: `192.168.${10 + i}.10`, severity: 'warning' as const, restaurant: r.name },
]);

const allAuditData: AuditEntry[] = [...baseAuditData, ...newAuditData];

const modules = ['All', 'Inventory', 'EPOS Orders', 'Recipe Costing', 'Wastage', 'Dispatch', 'Goods Received', 'Users', 'Reports'];
const severities = ['All', 'info', 'warning', 'critical'];
const restaurants = ['All', 'Central Kitchen', 'Hounslow', 'Reading', 'Dartford', 'Leicester', ...NEW_RESTAURANT_NAMES];

const severityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  info: { icon: <CheckCircle size={12} />, color: '#166534', bg: '#DCFCE7' },
  warning: { icon: <AlertTriangle size={12} />, color: '#854D0E', bg: '#FEF9C3' },
  critical: { icon: <Shield size={12} />, color: '#991B1B', bg: '#FEE2E2' },
};

const actionColors: Record<string, string> = {
  STOCK_ADJUSTMENT: '#6366F1',
  STOCK_DEDUCTION: '#168447',
  RECIPE_APPROVED: '#0EA5E9',
  WASTAGE_APPROVED: '#F97316',
  DISPATCH_CREATED: '#F9B233',
  GRN_CONFIRMED: '#06B6D4',
  USER_CREATED: '#8B5CF6',
  BATCH_EXPIRED: '#EF4444',
  STOCKTAKE_SUBMITTED: '#F97316',
  DUPLICATE_BLOCKED: '#ED1C24',
  REPORT_EXPORTED: '#9CA3AF',
  ORDER_REVERSED: '#F9B233',
};

export default function AuditLogsPage() {
  const scope = useScopedRestaurant();
  const auditData = scope ? allAuditData.filter((e) => e.restaurant === scope) : allAuditData;
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [restaurantFilter, setRestaurantFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = auditData.filter((entry) => {
    const matchSearch = !search || entry.user.toLowerCase().includes(search.toLowerCase()) || entry.action.toLowerCase().includes(search.toLowerCase()) || entry.details.toLowerCase().includes(search.toLowerCase());
    const matchModule = moduleFilter === 'All' || entry.module === moduleFilter;
    const matchSeverity = severityFilter === 'All' || entry.severity === severityFilter;
    const matchRest = (scope ?? restaurantFilter) === 'All' || entry.restaurant === (scope ?? restaurantFilter);
    return matchSearch && matchModule && matchSeverity && matchRest;
  });

  const criticalCount = auditData.filter(e => e.severity === 'critical').length;
  const warningCount = auditData.filter(e => e.severity === 'warning').length;

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Immutable audit trail for all system actions, stock movements and approvals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }}><RefreshCw size={14} /></button>
          <button className="btn-secondary" style={{ padding: '8px 12px' }}><Download size={14} /> Export</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Total Entries</p>
          <p className="metric-value">{auditData.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Info</p>
          <p className="metric-value" style={{ color: '#166534' }}>{auditData.filter(e => e.severity === 'info').length}</p>
        </div>
        <div className={warningCount > 0 ? 'metric-card-alert' : 'metric-card'}>
          <p className="label-text">Warnings</p>
          <p className="metric-value" style={{ color: '#92400E' }}>{warningCount}</p>
        </div>
        <div className={criticalCount > 0 ? 'metric-card-alert' : 'metric-card'}>
          <p className="label-text">Critical</p>
          <p className="metric-value" style={{ color: '#991B1B' }}>{criticalCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input className="input-field pl-8" placeholder="Search user, action or details..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ width: 160 }} value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>
          {modules.map(m => <option key={m}>{m}</option>)}
        </select>
        <select className="input-field" style={{ width: 120 }} value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
          {severities.map(s => <option key={s}>{s}</option>)}
        </select>
        <select className="input-field" style={{ width: 150 }} value={scope ?? restaurantFilter} disabled={!!scope} onChange={(e) => setRestaurantFilter(e.target.value)}>
          {restaurants.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Entity</th>
                <th>Location</th>
                <th>Severity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr
                    className="cursor-pointer"
                    onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    style={{ background: entry.severity === 'critical' ? '#FFF5F5' : entry.severity === 'warning' ? '#FFFBEB' : undefined }}
                  >
                    <td style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>{entry.timestamp}</td>
                    <td>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{entry.user}</div>
                      <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>{entry.userRole}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 10, fontFamily: 'monospace', padding: '2px 6px', borderRadius: 3, background: (actionColors[entry.action] || '#6B7280') + '18', color: actionColors[entry.action] || '#6B7280', fontWeight: 600 }}>
                        {entry.action}
                      </span>
                    </td>
                    <td style={{ fontSize: 12 }}>{entry.module}</td>
                    <td>
                      <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>{entry.entityId}</div>
                    </td>
                    <td style={{ fontSize: 12 }}>{entry.restaurant}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: severityConfig[entry.severity].bg, color: severityConfig[entry.severity].color, textTransform: 'capitalize' }}>
                        {severityConfig[entry.severity].icon} {entry.severity}
                      </span>
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--muted-foreground)', maxWidth: 200 }}>
                      <span className="truncate block" style={{ maxWidth: 200 }}>{entry.details}</span>
                    </td>
                  </tr>
                  {expandedId === entry.id && (
                    <tr>
                      <td colSpan={8} style={{ background: 'var(--accent)', padding: '12px 16px' }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 2 }}>Full Details</div>
                            <div style={{ fontSize: 12 }}>{entry.details}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 2 }}>Entity</div>
                            <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{entry.entity} / {entry.entityId}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 2 }}>IP Address</div>
                            <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{entry.ipAddress}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 2 }}>Audit ID</div>
                            <div style={{ fontSize: 12, fontFamily: 'monospace' }}>{entry.id}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', fontSize: 12, color: 'var(--muted-foreground)' }}>
          Showing {filtered.length} of {auditData.length} entries · Audit log is append-only and immutable
        </div>
      </div>
    </AppLayout>
  );
}
