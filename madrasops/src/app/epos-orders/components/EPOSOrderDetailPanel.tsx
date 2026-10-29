'use client';

import React from 'react';
import { X, ShoppingCart, AlertTriangle, ShieldCheck, CheckCircle, ChevronRight } from 'lucide-react';
import { EPOSOrder } from './eposData';
import StatusBadge from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

interface EPOSOrderDetailPanelProps {
  order: EPOSOrder;
  open: boolean;
  onClose: () => void;
}

const statusMap: Record<string, any> = {
  completed: 'completed',
  processing: 'processing',
  failed: 'failed',
  cancelled: 'cancelled',
};

export default function EPOSOrderDetailPanel({ order, open, onClose }: EPOSOrderDetailPanelProps) {
  if (!open) return null;

  const hasUnmapped = order.lines.some((l) => l.recipeStatus === 'unmapped');

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
          width: 540,
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
              style={{ width: 36, height: 36, background: '#FEE2E2', color: 'var(--primary)' }}
            >
              <ShoppingCart size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--foreground)' }}>
                  {order.orderId}
                </h2>
                {order.isDuplicate && (
                  <span
                    className="flex items-center gap-1 rounded-full px-2 py-0.5"
                    style={{ background: '#EDE9FE', color: '#5B21B6', fontSize: 10, fontWeight: 700 }}
                  >
                    <ShieldCheck size={10} /> DUPLICATE BLOCKED
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                {order.restaurant.replace('Samko ', '')} · {order.orderTime}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge variant={statusMap[order.status]} label={order.status.charAt(0).toUpperCase() + order.status.slice(1)} dot />
            {hasUnmapped && (
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-semibold" style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 11 }}>
                <AlertTriangle size={11} /> Unmapped item — stock not deducted
              </span>
            )}
          </div>

          {/* Processing Note */}
          {order.processingNote && (
            <div
              className="rounded-lg p-3 flex items-start gap-2"
              style={{
                background: order.status === 'failed' ? '#FEF2F2' : order.isDuplicate ? '#F5F3FF' : '#F0FDF4',
                border: `1px solid ${order.status === 'failed' ? '#FECACA' : order.isDuplicate ? '#DDD6FE' : '#BBF7D0'}`,
              }}
            >
              {order.isDuplicate ? (
                <ShieldCheck size={14} style={{ color: '#5B21B6', marginTop: 1, flexShrink: 0 }} />
              ) : order.status === 'failed' ? (
                <AlertTriangle size={14} style={{ color: '#991B1B', marginTop: 1, flexShrink: 0 }} />
              ) : (
                <CheckCircle size={14} style={{ color: '#166534', marginTop: 1, flexShrink: 0 }} />
              )}
              <p style={{
                fontSize: 12.5,
                lineHeight: 1.5,
                color: order.status === 'failed' ? '#991B1B' : order.isDuplicate ? '#5B21B6' : '#166534',
              }}>
                {order.processingNote}
              </p>
            </div>
          )}

          {/* Webhook Info */}
          <div
            className="rounded-lg p-3 flex items-center justify-between"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            <div>
              <p className="label-text" style={{ fontSize: 11 }}>Webhook Event ID</p>
              <p className="font-mono font-semibold" style={{ fontSize: 12, color: 'var(--foreground)', marginTop: 2 }}>
                {order.webhookEventId}
              </p>
            </div>
            <span
              className="rounded-full px-2.5 py-0.5 font-semibold"
              style={{
                fontSize: 11,
                background: order.isDuplicate ? '#EDE9FE' : '#DCFCE7',
                color: order.isDuplicate ? '#5B21B6' : '#166534',
              }}
            >
              {order.isDuplicate ? 'Duplicate — Rejected' : 'Idempotency ✓'}
            </span>
          </div>

          {/* Profitability Summary */}
          {order.totalRecipeCost > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'eod-selling', label: 'Selling Price', value: `£${order.totalSelling.toFixed(2)}`, color: 'var(--foreground)' },
                { id: 'eod-cost', label: 'Recipe Cost', value: `£${order.totalRecipeCost.toFixed(3)}`, color: 'var(--muted-foreground)' },
                { id: 'eod-fc', label: 'Food Cost %', value: `${order.foodCostPct.toFixed(1)}%`, color: order.foodCostPct > 30 ? '#991B1B' : '#166534' },
              ].map((item) => (
                <div key={item.id} className="rounded-lg p-3" style={{ background: 'var(--muted)' }}>
                  <p className="label-text" style={{ fontSize: 10.5 }}>{item.label}</p>
                  <p className="font-bold tabular-nums mt-1" style={{ fontSize: 15, color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Order Lines with Consumption */}
          <div>
            <h3 className="font-semibold mb-3" style={{ fontSize: 14, color: 'var(--foreground)' }}>
              Order Lines & Recipe Consumption
            </h3>
            <div className="space-y-4">
              {order.lines.map((line) => (
                <div
                  key={line.id}
                  className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${line.recipeStatus === 'unmapped' ? '#FECACA' : 'var(--border)'}` }}
                >
                  {/* Line Header */}
                  <div
                    className="flex items-center justify-between px-4 py-3"
                    style={{ background: line.recipeStatus === 'unmapped' ? '#FEF2F2' : 'var(--muted)' }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                          {line.menuItem}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>×{line.quantity}</span>
                        {line.recipeStatus === 'unmapped' && (
                          <span className="flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold" style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 10 }}>
                            <AlertTriangle size={9} /> No Recipe
                          </span>
                        )}
                        {line.recipeStatus === 'mapped' && (
                          <span className="fefo-tag">FEFO Active</span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold tabular-nums" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                      £{line.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Unmapped Warning */}
                  {line.recipeStatus === 'unmapped' && (
                    <div className="px-4 py-3" style={{ background: '#FEF2F2' }}>
                      <p style={{ fontSize: 12.5, color: '#991B1B', lineHeight: 1.5 }}>
                        No active recipe mapped for this menu item. Stock was <strong>not deducted</strong>.
                        Configure a recipe in Menu &amp; Recipe Mapping to enable automatic inventory deduction.
                      </p>
                      <button
                        className="mt-2 font-semibold"
                        style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => toast.info('Opening Menu & Recipe Mapping…')}
                      >
                        Configure Recipe →
                      </button>
                    </div>
                  )}

                  {/* FEFO Consumption Breakdown */}
                  {line.consumption.length > 0 && (
                    <div className="px-4 py-3 space-y-3">
                      {line.consumption.map((cons) => (
                        <div key={cons.id}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium" style={{ fontSize: 12.5, color: 'var(--foreground)' }}>
                                {cons.ingredientName}
                              </span>
                              <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                                {cons.quantity} {cons.unit}
                              </span>
                            </div>
                            <span className="tabular-nums font-semibold" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                              £{cons.totalIngredientCost.toFixed(4)}
                            </span>
                          </div>
                          {/* FEFO Allocations */}
                          <div className="space-y-1 pl-3" style={{ borderLeft: '2px solid var(--border)' }}>
                            {cons.fefoAllocations.map((alloc) => (
                              <div
                                key={alloc.id}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="fefo-tag" style={{ fontSize: 9 }}>FEFO</span>
                                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--primary)' }}>
                                    {alloc.batchId}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                                    exp {alloc.expiryDate}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                                    {alloc.quantityAllocated} {alloc.unit}
                                  </span>
                                  <span className="tabular-nums" style={{ fontSize: 11, color: 'var(--foreground)', fontWeight: 500 }}>
                                    £{alloc.totalCost.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Traceability Link */}
          {order.status === 'completed' && (
            <button
              className="w-full flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:bg-muted"
              style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
              onClick={() => toast.info('Opening batch genealogy for this order…')}
            >
              <span className="font-semibold" style={{ fontSize: 13, color: 'var(--foreground)' }}>
                View Full Batch Traceability
              </span>
              <ChevronRight size={16} style={{ color: 'var(--muted-foreground)' }} />
            </button>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex gap-3 shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          {order.status === 'completed' && !order.isDuplicate && (
            <button
              className="btn-secondary flex-1 justify-center"
              style={{ color: '#991B1B', borderColor: '#FECACA' }}
              onClick={() => toast.warning('Cancellation reversal requires manager approval')}
            >
              Reverse Order
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