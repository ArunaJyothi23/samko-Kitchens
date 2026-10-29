'use client';

import React from 'react';
import { X, FlaskConical, Calendar, User, Package, AlertTriangle, CheckCircle, Truck } from 'lucide-react';
import { ProductionBatch } from './productionData';
import StatusBadge from '@/components/ui/StatusBadge';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';

const YieldRadialChart = dynamic(() => import('./YieldRadialChart'), { ssr: false });

interface BatchDetailDrawerProps {
  batch: ProductionBatch | null;
  open: boolean;
  onClose: () => void;
}

export default function BatchDetailDrawer({ batch, open, onClose }: BatchDetailDrawerProps) {
  if (!open || !batch) return null;

  const totalIngredientCost = batch.ingredients.reduce((s, i) => s + i.cost, 0);

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.35)' }}
        onClick={onClose}
      />
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col animate-slide-in-right overflow-y-auto"
        style={{
          width: 480,
          background: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg flex items-center justify-center"
              style={{ width: 36, height: 36, background: '#DBEAFE', color: '#1E40AF' }}
            >
              <FlaskConical size={18} />
            </div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--foreground)' }}>
                {batch.batchId}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{batch.recipeName}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Status & Dates */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge
              variant={batch.status as any}
              label={batch.status.charAt(0).toUpperCase() + batch.status.slice(1).replace('-', ' ')}
              dot
            />
            <span className="fefo-tag">FEFO</span>
            {batch.notes && (
              <span className="demo-badge">DEMO DATA</span>
            )}
          </div>

          {/* Key Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'di-julian', label: 'Julian Date', value: batch.julianDate, icon: <Calendar size={13} /> },
              { id: 'di-prod', label: 'Production Date', value: batch.productionDate, icon: <Calendar size={13} /> },
              { id: 'di-expiry', label: 'Expiry Date', value: batch.expiryDate, icon: <Calendar size={13} />, alert: batch.expiryDate === '12/10/2026' || batch.expiryDate === '11/10/2026' },
              { id: 'di-staff', label: 'Production Staff', value: batch.staff, icon: <User size={13} /> },
              { id: 'di-category', label: 'Category', value: batch.category, icon: <Package size={13} /> },
              { id: 'di-dispatch', label: 'Dispatch Status', value: batch.dispatchStatus, icon: <Truck size={13} /> },
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-3"
                style={{ background: item.alert ? '#FEF2F2' : 'var(--muted)', border: item.alert ? '1px solid #FECACA' : '1px solid transparent' }}
              >
                <div className="flex items-center gap-1.5 mb-1" style={{ color: item.alert ? '#991B1B' : 'var(--muted-foreground)' }}>
                  {item.icon}
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{item.label}</span>
                </div>
                <p className="font-semibold" style={{ fontSize: 13, color: item.alert ? '#991B1B' : 'var(--foreground)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Yield Chart */}
          {batch.yieldPct !== null && (
            <div>
              <h3 className="font-semibold mb-3" style={{ fontSize: 14, color: 'var(--foreground)' }}>
                Yield Performance
              </h3>
              <div className="flex items-center gap-6">
                <YieldRadialChart yieldPct={batch.yieldPct} />
                <div className="space-y-2">
                  <div>
                    <p className="label-text" style={{ fontSize: 11 }}>Planned Yield</p>
                    <p className="font-bold tabular-nums" style={{ fontSize: 16, color: 'var(--foreground)' }}>
                      {batch.plannedYield} {batch.yieldUnit}
                    </p>
                  </div>
                  <div>
                    <p className="label-text" style={{ fontSize: 11 }}>Actual Yield</p>
                    <p className="font-bold tabular-nums" style={{ fontSize: 16, color: 'var(--foreground)' }}>
                      {batch.actualYield} {batch.yieldUnit}
                    </p>
                  </div>
                  <div>
                    <p className="label-text" style={{ fontSize: 11 }}>Production Loss</p>
                    <p className="font-bold tabular-nums" style={{ fontSize: 16, color: '#991B1B' }}>
                      {((batch.plannedYield - (batch.actualYield ?? 0))).toFixed(1)} {batch.yieldUnit}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ingredient Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ fontSize: 14, color: 'var(--foreground)' }}>
                Ingredient Consumption
              </h3>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                Total: <strong style={{ color: 'var(--foreground)' }}>£{totalIngredientCost.toFixed(2)}</strong>
              </span>
            </div>
            <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--muted)' }}>
                    {['Ingredient', 'Planned', 'Actual', 'Cost'].map((h) => (
                      <th
                        key={`ingth-${h}`}
                        className="text-left label-text"
                        style={{ padding: '8px 12px', fontSize: 10.5, borderBottom: '1px solid var(--border)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batch.ingredients.map((ing, idx) => (
                    <tr
                      key={ing.id}
                      style={{ borderBottom: idx < batch.ingredients.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <td style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--foreground)' }}>{ing.name}</td>
                      <td className="tabular-nums" style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--muted-foreground)' }}>
                        {ing.planned} {ing.unit}
                      </td>
                      <td className="tabular-nums" style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--foreground)' }}>
                        {ing.actual > 0 ? `${ing.actual} ${ing.unit}` : '—'}
                      </td>
                      <td className="tabular-nums" style={{ padding: '8px 12px', fontSize: 12.5, color: 'var(--foreground)', fontWeight: 500 }}>
                        {ing.cost > 0 ? `£${ing.cost.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Costing Summary */}
          {batch.totalBatchCost !== null && (
            <div
              className="rounded-lg p-4"
              style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              <h3 className="font-semibold mb-3" style={{ fontSize: 14, color: 'var(--foreground)' }}>
                Batch Costing Summary
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'cs-ingredients', label: 'Total Ingredient Cost', value: `£${totalIngredientCost.toFixed(2)}` },
                  { id: 'cs-total', label: 'Total Batch Cost', value: `£${batch.totalBatchCost.toFixed(2)}` },
                  { id: 'cs-per-kg', label: `Cost per ${batch.yieldUnit}`, value: `£${batch.costPerKg?.toFixed(2)}` },
                ].map((row) => (
                  <div key={row.id} className="flex items-center justify-between">
                    <span style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>{row.label}</span>
                    <span className="font-bold tabular-nums" style={{ fontSize: 13, color: 'var(--foreground)' }}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {batch.notes && (
            <div
              className="rounded-lg p-3 flex items-start gap-2"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <AlertTriangle size={14} style={{ color: '#92400E', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>{batch.notes}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-4 border-t flex gap-3 shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          {batch.status === 'completed' && (
            <button
              className="btn-primary flex-1 justify-center"
              onClick={() => { toast.success(`Dispatch order created for ${batch.batchId}`); onClose(); }}
            >
              <Truck size={14} />
              Create Dispatch
            </button>
          )}
          {batch.status === 'draft' && (
            <button
              className="btn-primary flex-1 justify-center"
              onClick={() => { toast.success(`Batch ${batch.batchId} approved for production`); onClose(); }}
            >
              <CheckCircle size={14} />
              Approve & Start
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">
            Close
          </button>
        </div>
      </div>
    </>
  );
}