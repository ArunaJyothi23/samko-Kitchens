'use client';

import React, { useState } from 'react';
import { X, Truck, AlertTriangle, CheckCircle, User, Car, Clock } from 'lucide-react';
import { DispatchOrder } from './dispatchData';

import ConfirmModal from '@/components/ui/ConfirmModal';
import { toast } from 'sonner';

interface DispatchDetailPanelProps {
  dispatch: DispatchOrder | null;
  open: boolean;
  onClose: () => void;
}

const statusPipeline = ['created', 'reserved', 'in-transit', 'delivered'];

const statusMap: Record<string, any> = {
  created: 'draft',
  reserved: 'reserved',
  'in-transit': 'in-transit',
  delivered: 'delivered',
  discrepancy: 'discrepancy',
  cancelled: 'cancelled',
};

export default function DispatchDetailPanel({ dispatch, open, onClose }: DispatchDetailPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'confirm-delivery' | 'cancel' | null>(null);

  if (!open || !dispatch) return null;

  const currentStep = statusPipeline.indexOf(dispatch.status);

  const handleConfirm = () => {
    if (confirmAction === 'confirm-delivery') {
      toast.success(`Dispatch ${dispatch.dispatchId} marked as delivered. Inventory updated.`);
    } else if (confirmAction === 'cancel') {
      toast.success(`Dispatch ${dispatch.dispatchId} cancelled. Stock reservation released.`);
    }
    setConfirmOpen(false);
    onClose();
  };

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
          width: 520,
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
              style={{ width: 36, height: 36, background: 'var(--transit-bg)', color: 'var(--transit)' }}
            >
              <Truck size={18} />
            </div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--foreground)' }}>
                {dispatch.dispatchId}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                → {dispatch.destination.replace('Samko ', '')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close panel">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">
          {/* Status Pipeline */}
          <div>
            <h3 className="font-semibold mb-3" style={{ fontSize: 13, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Delivery Status
            </h3>
            <div className="flex items-center gap-0">
              {statusPipeline.map((step, i) => {
                const isCompleted = currentStep > i || (dispatch.status === 'delivered' && i <= currentStep);
                const isActive = i === currentStep && dispatch.status !== 'discrepancy';
                const isDiscrepancy = dispatch.status === 'discrepancy' && step === 'delivered';
                return (
                  <React.Fragment key={`pipeline-${step}`}>
                    <div className="flex flex-col items-center" style={{ flex: 1 }}>
                      <div
                        className="rounded-full flex items-center justify-center font-bold"
                        style={{
                          width: 28,
                          height: 28,
                          background: isDiscrepancy
                            ? '#FEF3C7'
                            : isCompleted || isActive
                            ? 'var(--primary)'
                            : 'var(--muted)',
                          color: isDiscrepancy
                            ? '#92400E'
                            : isCompleted || isActive
                            ? '#fff' :'var(--muted-foreground)',
                          fontSize: 11,
                          border: isActive ? '2px solid var(--primary-dark)' : '2px solid transparent',
                        }}
                      >
                        {isDiscrepancy ? '!' : isCompleted ? '✓' : i + 1}
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          marginTop: 4,
                          color: isCompleted || isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                          fontWeight: isActive ? 600 : 400,
                          textAlign: 'center',
                          textTransform: 'capitalize',
                        }}
                      >
                        {step.replace('-', ' ')}
                      </span>
                    </div>
                    {i < statusPipeline.length - 1 && (
                      <div
                        style={{
                          height: 2,
                          flex: 0,
                          width: 24,
                          background: currentStep > i ? 'var(--primary)' : 'var(--border)',
                          marginBottom: 18,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Discrepancy Alert */}
          {dispatch.status === 'discrepancy' && dispatch.discrepancyNote && (
            <div
              className="rounded-lg p-4 flex items-start gap-3"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <AlertTriangle size={16} style={{ color: '#92400E', flexShrink: 0, marginTop: 1 }} />
              <div>
                <p className="font-semibold mb-1" style={{ fontSize: 13, color: '#92400E' }}>
                  Delivery Discrepancy Reported
                </p>
                <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>
                  {dispatch.discrepancyNote}
                </p>
                <button
                  className="mt-2 font-semibold"
                  style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => toast.info('Opening discrepancy resolution workflow…')}
                >
                  Resolve Discrepancy →
                </button>
              </div>
            </div>
          )}

          {/* Delivery Details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'dd-driver', label: 'Driver', value: dispatch.driver, icon: <User size={13} /> },
              { id: 'dd-vehicle', label: 'Vehicle', value: dispatch.vehicle, icon: <Car size={13} /> },
              { id: 'dd-departure', label: 'Departure', value: dispatch.departureTime, icon: <Clock size={13} /> },
              { id: 'dd-eta', label: 'Expected Arrival', value: dispatch.expectedArrival, icon: <Clock size={13} /> },
              { id: 'dd-created', label: 'Created', value: dispatch.createdAt, icon: <Clock size={13} /> },
              { id: 'dd-by', label: 'Created By', value: dispatch.createdBy, icon: <User size={13} /> },
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-3"
                style={{ background: 'var(--muted)' }}
              >
                <div className="flex items-center gap-1.5 mb-1" style={{ color: 'var(--muted-foreground)' }}>
                  {item.icon}
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{item.label}</span>
                </div>
                <p className="font-semibold" style={{ fontSize: 12.5, color: 'var(--foreground)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold" style={{ fontSize: 14, color: 'var(--foreground)' }}>
                Dispatch Lines
              </h3>
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                Total: <strong style={{ color: 'var(--foreground)' }}>£{dispatch.totalValue.toFixed(2)}</strong>
              </span>
            </div>
            <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--muted)' }}>
                    {['Product', 'Batch ID', 'Qty', 'Unit Cost', 'Value', 'Expiry'].map((h) => (
                      <th
                        key={`dlth-${h}`}
                        className="text-left label-text"
                        style={{ padding: '8px 10px', fontSize: 10.5, borderBottom: '1px solid var(--border)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dispatch.lines.map((line, idx) => (
                    <tr
                      key={line.id}
                      style={{ borderBottom: idx < dispatch.lines.length - 1 ? '1px solid var(--border)' : 'none' }}
                    >
                      <td style={{ padding: '8px 10px', fontSize: 12.5, color: 'var(--foreground)' }}>
                        {line.productName}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span className="font-mono" style={{ fontSize: 11, color: 'var(--primary)' }}>
                          {line.batchId}
                        </span>
                      </td>
                      <td className="tabular-nums" style={{ padding: '8px 10px', fontSize: 12.5, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        {line.quantity} {line.unit}
                      </td>
                      <td className="tabular-nums" style={{ padding: '8px 10px', fontSize: 12.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                        £{line.unitCost.toFixed(2)}
                      </td>
                      <td className="tabular-nums" style={{ padding: '8px 10px', fontSize: 12.5, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                        £{line.totalValue.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: 11.5,
                            color: line.expiryDate === '12/10/2026' || line.expiryDate === '11/10/2026' ? '#991B1B' : 'var(--muted-foreground)',
                            fontWeight: line.expiryDate === '12/10/2026' ? 600 : 400,
                          }}
                        >
                          {line.expiryDate}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex gap-3 shrink-0 flex-wrap"
          style={{ borderColor: 'var(--border)' }}
        >
          {dispatch.status === 'in-transit' && (
            <button
              className="btn-primary flex-1 justify-center"
              onClick={() => { setConfirmAction('confirm-delivery'); setConfirmOpen(true); }}
            >
              <CheckCircle size={14} />
              Confirm Delivery
            </button>
          )}
          {dispatch.status === 'discrepancy' && (
            <button
              className="btn-primary flex-1 justify-center"
              style={{ background: '#92400E' }}
              onClick={() => toast.info('Opening discrepancy resolution form…')}
            >
              <AlertTriangle size={14} />
              Resolve Discrepancy
            </button>
          )}
          {(dispatch.status === 'created' || dispatch.status === 'reserved') && (
            <button
              className="btn-secondary flex-1 justify-center"
              style={{ color: '#991B1B', borderColor: '#FECACA' }}
              onClick={() => { setConfirmAction('cancel'); setConfirmOpen(true); }}
            >
              Cancel Dispatch
            </button>
          )}
          <button onClick={onClose} className="btn-secondary" style={{ minWidth: 80 }}>
            Close
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={confirmAction === 'confirm-delivery' ? 'Confirm Delivery' : 'Cancel Dispatch'}
        description={
          confirmAction === 'confirm-delivery'
            ? `Mark ${dispatch.dispatchId} as delivered? This will update restaurant inventory and close the stock-in-transit account.`
            : `Cancel dispatch ${dispatch.dispatchId}? Stock reservations will be released back to central kitchen inventory.`
        }
        confirmLabel={confirmAction === 'confirm-delivery' ? 'Confirm Delivery' : 'Cancel Dispatch'}
        variant={confirmAction === 'cancel' ? 'danger' : 'warning'}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}