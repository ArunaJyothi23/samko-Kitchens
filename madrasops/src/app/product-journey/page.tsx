'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Layers, Search, ChevronRight, Package, Truck, PackageCheck, ShoppingCart, FlaskConical } from 'lucide-react';

interface JourneyStep {
  step: number;
  type: string;
  title: string;
  description: string;
  date: string;
  location: string;
  reference: string;
  quantity: string;
  cost?: string;
  status: 'completed' | 'in_progress' | 'pending' | 'warning';
}

interface ProductJourney {
  orderId: string;
  menuItem: string;
  restaurant: string;
  orderDate: string;
  sellingPrice: number;
  ingredientCost: number;
  steps: JourneyStep[];
}

const journeys: ProductJourney[] = [
  {
    orderId: 'MF-HOU-10482',
    menuItem: 'Masala Dosa',
    restaurant: 'Hounslow',
    orderDate: '2026-10-11 12:34',
    sellingPrice: 7.99,
    ingredientCost: 0.42,
    steps: [
      { step: 1, type: 'ingredient', title: 'Raw Ingredients Sourced', description: 'Rice, Urad Dal, Fenugreek sourced from approved suppliers', date: '2026-10-09', location: 'Central Kitchen', reference: 'PO-2026-279-001', quantity: '82 kg inputs', status: 'completed' },
      { step: 2, type: 'production', title: 'Dosa Batter Produced', description: 'Production batch BT-2026-283-001 — 100 kg yield from 82 kg inputs', date: '2026-10-10', location: 'Central Kitchen', reference: 'BT-2026-283-001', quantity: '100 kg', cost: '£1.00/kg', status: 'completed' },
      { step: 3, type: 'dispatch', title: 'Dispatched to Hounslow', description: 'Dispatch order DO-2026-283-H01 — 15 kg dosa batter', date: '2026-10-10', location: 'In Transit', reference: 'DO-2026-283-H01', quantity: '15 kg', status: 'completed' },
      { step: 4, type: 'receipt', title: 'Received at Hounslow', description: 'GRN-2026-283-H01 — 15 kg accepted, batch verified', date: '2026-10-10', location: 'Hounslow', reference: 'GRN-2026-283-H01', quantity: '15 kg', status: 'completed' },
      { step: 5, type: 'sale', title: 'EPOS Order Received', description: 'Order MF-HOU-10482 — Masala Dosa × 1 at £7.99', date: '2026-10-11 12:34', location: 'Hounslow', reference: 'MF-HOU-10482', quantity: '1 portion', cost: '£7.99', status: 'completed' },
      { step: 6, type: 'consumption', title: 'Recipe Consumption Posted', description: 'FEFO allocation: 100g dosa batter from BT-2026-283-001, 20g masala, 10g red chutney, 10g white chutney, 20g sambar', date: '2026-10-11 12:34', location: 'Hounslow', reference: 'CONS-MF-HOU-10482', quantity: '160 g total', cost: '£0.42', status: 'completed' },
    ],
  },
  {
    orderId: 'MF-HOU-10483',
    menuItem: 'Idly (2 pcs)',
    restaurant: 'Hounslow',
    orderDate: '2026-10-11 12:41',
    sellingPrice: 4.75,
    ingredientCost: 0.32,
    steps: [
      { step: 1, type: 'ingredient', title: 'Raw Ingredients Sourced', description: 'Rice, Urad Dal sourced from approved suppliers', date: '2026-10-09', location: 'Central Kitchen', reference: 'PO-2026-279-002', quantity: '65 kg inputs', status: 'completed' },
      { step: 2, type: 'production', title: 'Idly Batter Produced', description: 'Production batch BT-2026-283-002 — 80 kg yield', date: '2026-10-10', location: 'Central Kitchen', reference: 'BT-2026-283-002', quantity: '80 kg', cost: '£0.95/kg', status: 'completed' },
      { step: 3, type: 'dispatch', title: 'Dispatched to Hounslow', description: 'Dispatch order DO-2026-283-H02 — 10 kg idly batter', date: '2026-10-10', location: 'In Transit', reference: 'DO-2026-283-H02', quantity: '10 kg', status: 'completed' },
      { step: 4, type: 'receipt', title: 'Received at Hounslow', description: 'GRN-2026-283-H02 — 10 kg accepted', date: '2026-10-10', location: 'Hounslow', reference: 'GRN-2026-283-H02', quantity: '10 kg', status: 'completed' },
      { step: 5, type: 'sale', title: 'EPOS Order Received', description: 'Order MF-HOU-10483 — Idly at £4.75', date: '2026-10-11 12:41', location: 'Hounslow', reference: 'MF-HOU-10483', quantity: '1 portion', cost: '£4.75', status: 'completed' },
      { step: 6, type: 'consumption', title: 'Recipe Consumption Posted', description: 'FEFO allocation: 160g idly batter from BT-2026-283-002, 50g sambar, 30g chutney', date: '2026-10-11 12:41', location: 'Hounslow', reference: 'CONS-MF-HOU-10483', quantity: '240 g total', cost: '£0.32', status: 'completed' },
    ],
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  ingredient: <Package size={14} />,
  production: <FlaskConical size={14} />,
  dispatch: <Truck size={14} />,
  receipt: <PackageCheck size={14} />,
  sale: <ShoppingCart size={14} />,
  consumption: <Layers size={14} />,
};

const typeColors: Record<string, string> = {
  ingredient: '#6366F1',
  production: '#168447',
  dispatch: '#F9B233',
  receipt: '#0EA5E9',
  sale: '#ED1C24',
  consumption: '#8B5CF6',
};

const stepStatusColors: Record<string, string> = {
  completed: '#168447',
  in_progress: '#F9B233',
  pending: '#9CA3AF',
  warning: '#EF4444',
};

export default function ProductJourneyPage() {
  const [search, setSearch] = useState('');
  const [selectedJourney, setSelectedJourney] = useState<ProductJourney | null>(journeys[0]);

  const filtered = journeys.filter((j) =>
    !search || j.orderId.toLowerCase().includes(search.toLowerCase()) || j.menuItem.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Product Journey</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Trace any EPOS order from supplier ingredient to customer plate
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order List */}
        <div className="lg:col-span-1">
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Recent Orders</h3>
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
                <input className="input-field pl-8 w-full" placeholder="Search order or item..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 600 }}>
              {filtered.map((journey) => (
                <div
                  key={journey.orderId}
                  className="px-4 py-3 border-b cursor-pointer transition-colors"
                  style={{ borderColor: 'var(--border)', background: selectedJourney?.orderId === journey.orderId ? 'var(--accent)' : 'transparent' }}
                  onClick={() => setSelectedJourney(journey)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{journey.menuItem}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)', fontFamily: 'monospace' }}>{journey.orderId}</div>
                    </div>
                    <ChevronRight size={14} style={{ color: 'var(--muted-foreground)' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 3 }}>
                    {journey.restaurant} · {journey.orderDate}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    <span style={{ color: '#166534', fontWeight: 600 }}>£{journey.sellingPrice.toFixed(2)}</span>
                    <span style={{ color: 'var(--muted-foreground)' }}> · Cost: </span>
                    <span style={{ color: '#991B1B', fontWeight: 600 }}>£{journey.ingredientCost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Journey Detail */}
        {selectedJourney && (
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>{selectedJourney.menuItem}</h2>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'monospace', marginTop: 2 }}>{selectedJourney.orderId}</div>
                </div>
                <div className="text-right">
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Selling Price</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#166534' }}>£{selectedJourney.sellingPrice.toFixed(2)}</div>
                  <div style={{ fontSize: 11, color: '#991B1B' }}>Ingredient Cost: £{selectedJourney.ingredientCost.toFixed(2)}</div>
                </div>
              </div>
              <div className="flex gap-4 text-sm" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                <span>📍 {selectedJourney.restaurant}</span>
                <span>🕐 {selectedJourney.orderDate}</span>
                <span>📊 {selectedJourney.steps.length} traceability steps</span>
              </div>
            </div>

            {/* Journey Steps */}
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Full Traceability Chain</h3>
              <div className="relative">
                {selectedJourney.steps.map((step, idx) => (
                  <div key={step.step} className="flex gap-4 mb-5 relative">
                    {idx < selectedJourney.steps.length - 1 && (
                      <div className="absolute left-5 top-10 bottom-0 w-px" style={{ background: 'var(--border)' }} />
                    )}
                    <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center z-10" style={{ background: typeColors[step.type] + '22', color: typeColors[step.type], border: `2px solid ${typeColors[step.type]}` }}>
                      {typeIcons[step.type]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{step.title}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: stepStatusColors[step.status] + '22', color: stepStatusColors[step.status], textTransform: 'capitalize', fontWeight: 600 }}>
                          {step.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{step.description}</div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>📅 {step.date}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>📍 {step.location}</span>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--muted-foreground)' }}>🔗 {step.reference}</span>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>⚖ {step.quantity}</span>
                        {step.cost && <span style={{ fontSize: 11, fontWeight: 600, color: '#166534' }}>💷 {step.cost}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
