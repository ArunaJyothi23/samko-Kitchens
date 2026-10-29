'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { GitBranch, Search, ChevronRight, Package, Truck, PackageCheck, ShoppingCart, AlertTriangle, Download } from 'lucide-react';

interface BatchNode {
  id: string;
  type: 'ingredient' | 'production' | 'dispatch' | 'receipt' | 'sale' | 'wastage';
  label: string;
  detail: string;
  date: string;
  quantity: string;
  location: string;
  status: 'ok' | 'warning' | 'quarantined';
}

interface BatchRecord {
  batchId: string;
  ingredient: string;
  supplier: string;
  supplierLot: string;
  productionDate: string;
  expiryDate: string;
  qtyProduced: number;
  qtyDispatched: number;
  qtyRemaining: number;
  qtyConsumed: number;
  qtyWasted: number;
  affectedLocations: string[];
  relatedOrders: string[];
  status: 'active' | 'depleted' | 'quarantined' | 'recalled';
  nodes: BatchNode[];
}

const batchRecords: BatchRecord[] = [
  {
    batchId: 'BT-2026-283-001',
    ingredient: 'Dosa Batter',
    supplier: 'Central Kitchen — Samko Kitchens',
    supplierLot: 'CK-LOT-2026-283-A',
    productionDate: '2026-10-10',
    expiryDate: '2026-10-14',
    qtyProduced: 100,
    qtyDispatched: 25,
    qtyRemaining: 4.2,
    qtyConsumed: 19.3,
    qtyWasted: 1.5,
    affectedLocations: ['Hounslow', 'Reading'],
    relatedOrders: ['MF-HOU-10482', 'MF-HOU-10483', 'MF-REA-10201'],
    status: 'active',
    nodes: [
      { id: 'n1', type: 'ingredient', label: 'Raw Ingredients', detail: 'Rice 60kg, Urad Dal 20kg, Fenugreek 2kg', date: '2026-10-09', quantity: '82 kg inputs', location: 'Central Kitchen', status: 'ok' },
      { id: 'n2', type: 'production', label: 'Production Batch', detail: 'Batch BT-2026-283-001 produced', date: '2026-10-10', quantity: '100 kg yield', location: 'Central Kitchen', status: 'ok' },
      { id: 'n3', type: 'dispatch', label: 'Dispatched to Hounslow', detail: 'Dispatch order DO-2026-283-H01', date: '2026-10-10', quantity: '15 kg', location: 'In Transit', status: 'ok' },
      { id: 'n4', type: 'receipt', label: 'Received at Hounslow', detail: 'GRN-2026-283-H01 — 15 kg accepted', date: '2026-10-10', quantity: '15 kg', location: 'Hounslow', status: 'ok' },
      { id: 'n5', type: 'dispatch', label: 'Dispatched to Reading', detail: 'Dispatch order DO-2026-283-R01', date: '2026-10-10', quantity: '10 kg', location: 'In Transit', status: 'ok' },
      { id: 'n6', type: 'receipt', label: 'Received at Reading', detail: 'GRN-2026-283-R01 — 10 kg accepted', date: '2026-10-10', quantity: '10 kg', location: 'Reading', status: 'ok' },
      { id: 'n7', type: 'sale', label: 'EPOS Consumption', detail: 'MF-HOU-10482: Masala Dosa × 3 (300g)', date: '2026-10-11', quantity: '300 g consumed', location: 'Hounslow', status: 'ok' },
      { id: 'n8', type: 'wastage', label: 'Wastage Recorded', detail: 'W-001: 500g expired before use', date: '2026-10-11', quantity: '500 g wasted', location: 'Hounslow', status: 'warning' },
    ],
  },
  {
    batchId: 'BT-2026-283-002',
    ingredient: 'Idly Batter',
    supplier: 'Central Kitchen — Samko Kitchens',
    supplierLot: 'CK-LOT-2026-283-B',
    productionDate: '2026-10-10',
    expiryDate: '2026-10-15',
    qtyProduced: 80,
    qtyDispatched: 30,
    qtyRemaining: 8.5,
    qtyConsumed: 20.5,
    qtyWasted: 1.0,
    affectedLocations: ['Hounslow', 'Dartford', 'Leicester'],
    relatedOrders: ['MF-HOU-10490', 'MF-DAR-10105'],
    status: 'active',
    nodes: [
      { id: 'n1', type: 'ingredient', label: 'Raw Ingredients', detail: 'Rice 50kg, Urad Dal 15kg', date: '2026-10-09', quantity: '65 kg inputs', location: 'Central Kitchen', status: 'ok' },
      { id: 'n2', type: 'production', label: 'Production Batch', detail: 'Batch BT-2026-283-002 produced', date: '2026-10-10', quantity: '80 kg yield', location: 'Central Kitchen', status: 'ok' },
      { id: 'n3', type: 'dispatch', label: 'Dispatched to Hounslow', detail: 'Dispatch order DO-2026-283-H02', date: '2026-10-10', quantity: '10 kg', location: 'In Transit', status: 'ok' },
      { id: 'n4', type: 'receipt', label: 'Received at Hounslow', detail: 'GRN-2026-283-H02 — 10 kg accepted', date: '2026-10-10', quantity: '10 kg', location: 'Hounslow', status: 'ok' },
      { id: 'n5', type: 'sale', label: 'EPOS Consumption', detail: 'MF-HOU-10490: Idly × 5 (800g)', date: '2026-10-11', quantity: '800 g consumed', location: 'Hounslow', status: 'ok' },
    ],
  },
  {
    batchId: 'BT-2026-279-008',
    ingredient: 'Paneer',
    supplier: 'Fresh Dairy Supplies Ltd',
    supplierLot: 'FDS-2026-279-P1',
    productionDate: '2026-10-06',
    expiryDate: '2026-10-16',
    qtyProduced: 20,
    qtyDispatched: 8,
    qtyRemaining: 1.5,
    qtyConsumed: 6.2,
    qtyWasted: 0.3,
    affectedLocations: ['Hounslow', 'Reading'],
    relatedOrders: ['MF-HOU-10488'],
    status: 'active',
    nodes: [
      { id: 'n1', type: 'ingredient', label: 'Supplier Delivery', detail: 'FDS-2026-279-P1 — 20kg paneer', date: '2026-10-06', quantity: '20 kg', location: 'Central Kitchen', status: 'ok' },
      { id: 'n2', type: 'dispatch', label: 'Dispatched to Hounslow', detail: 'Dispatch order DO-2026-279-H01', date: '2026-10-07', quantity: '5 kg', location: 'In Transit', status: 'ok' },
      { id: 'n3', type: 'receipt', label: 'Received at Hounslow', detail: 'GRN-2026-279-H01 — 5 kg accepted', date: '2026-10-07', quantity: '5 kg', location: 'Hounslow', status: 'ok' },
      { id: 'n4', type: 'wastage', label: 'Wastage — Burnt', detail: 'W-006: 300g overcooked during prep', date: '2026-10-09', quantity: '300 g wasted', location: 'Hounslow', status: 'warning' },
      { id: 'n5', type: 'sale', label: 'EPOS Consumption', detail: 'MF-HOU-10488: Paneer Butter Masala × 4', date: '2026-10-11', quantity: '480 g consumed', location: 'Hounslow', status: 'ok' },
    ],
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  ingredient: <Package size={14} />,
  production: <GitBranch size={14} />,
  dispatch: <Truck size={14} />,
  receipt: <PackageCheck size={14} />,
  sale: <ShoppingCart size={14} />,
  wastage: <AlertTriangle size={14} />,
};

const typeColors: Record<string, string> = {
  ingredient: '#6366F1',
  production: '#168447',
  dispatch: '#F9B233',
  receipt: '#0EA5E9',
  sale: '#ED1C24',
  wastage: '#EF4444',
};

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: '#DCFCE7', text: '#166534' },
  depleted: { bg: '#F3F4F6', text: '#6B7280' },
  quarantined: { bg: '#FEF9C3', text: '#854D0E' },
  recalled: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function BatchGenealogyPage() {
  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(batchRecords[0]);

  const filtered = batchRecords.filter((b) =>
    !search || b.batchId.toLowerCase().includes(search.toLowerCase()) || b.ingredient.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Batch Genealogy</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Full forward and backward traceability for every production batch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }}><Download size={14} /> Export Trace</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch List */}
        <div className="lg:col-span-1">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input className="input-field pl-8 w-full" placeholder="Search batch or ingredient..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
              {filtered.map((batch) => (
                <div
                  key={batch.batchId}
                  className="px-4 py-3 border-b cursor-pointer transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    background: selectedBatch?.batchId === batch.batchId ? 'var(--accent)' : 'transparent',
                  }}
                  onClick={() => setSelectedBatch(batch)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{batch.ingredient}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{batch.batchId}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ display: 'inline-block', padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: statusColors[batch.status].bg, color: statusColors[batch.status].text, textTransform: 'capitalize' }}>
                        {batch.status}
                      </span>
                      <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 4 }}>
                    Produced: {batch.productionDate} · Expires: {batch.expiryDate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Batch Detail */}
        {selectedBatch && (
          <div className="lg:col-span-2 space-y-4">
            {/* Header */}
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>{selectedBatch.ingredient}</h2>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'monospace', marginTop: 2 }}>{selectedBatch.batchId}</div>
                </div>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700, background: statusColors[selectedBatch.status].bg, color: statusColors[selectedBatch.status].text, textTransform: 'uppercase' }}>
                  {selectedBatch.status}
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Produced', value: `${selectedBatch.qtyProduced} kg` },
                  { label: 'Dispatched', value: `${selectedBatch.qtyDispatched} kg` },
                  { label: 'Consumed', value: `${selectedBatch.qtyConsumed} kg` },
                  { label: 'Remaining', value: `${selectedBatch.qtyRemaining} kg` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Supplier / Source: </span>
                  <span style={{ fontSize: 12 }}>{selectedBatch.supplier}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Supplier Lot: </span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{selectedBatch.supplierLot}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Affected Locations: </span>
                  <span style={{ fontSize: 12 }}>{selectedBatch.affectedLocations.join(', ')}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Related Orders: </span>
                  <span style={{ fontSize: 12, fontFamily: 'monospace' }}>{selectedBatch.relatedOrders.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Genealogy Timeline */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Batch Journey Timeline</h3>
              <div className="relative">
                {selectedBatch.nodes.map((node, idx) => (
                  <div key={node.id} className="flex gap-4 mb-4 relative">
                    {/* Line */}
                    {idx < selectedBatch.nodes.length - 1 && (
                      <div className="absolute left-5 top-8 bottom-0 w-px" style={{ background: 'var(--border)' }} />
                    )}
                    {/* Icon */}
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: typeColors[node.type] + '22', color: typeColors[node.type], border: `2px solid ${typeColors[node.type]}` }}>
                      {typeIcons[node.type]}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{node.label}</span>
                        {node.status === 'warning' && <span style={{ fontSize: 10, color: '#92400E', background: '#FEF9C3', padding: '1px 6px', borderRadius: 3 }}>⚠ Warning</span>}
                        {node.status === 'quarantined' && <span style={{ fontSize: 10, color: '#991B1B', background: '#FEE2E2', padding: '1px 6px', borderRadius: 3 }}>Quarantined</span>}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{node.detail}</div>
                      <div className="flex gap-4 mt-1">
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{node.date}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{node.location}</span>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{node.quantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mock Recall */}
            <div className="card" style={{ border: '1px solid #FCA5A5' }}>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} style={{ color: '#991B1B' }} />
                <h3 style={{ fontSize: 14, fontWeight: 600, color: '#991B1B' }}>Recall Workflow</h3>
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12 }}>
                If this batch is suspect, initiate a recall to quarantine remaining stock and identify affected orders.
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12, borderColor: '#FCA5A5', color: '#991B1B' }}>
                  Quarantine Remaining Stock
                </button>
                <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12 }}>
                  Export Recall Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
