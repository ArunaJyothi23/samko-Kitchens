'use client';

import React from 'react';
import { X, PackageCheck, AlertTriangle, CheckCircle, Thermometer } from 'lucide-react';
import { GRN, grnValues, isoToUk, useTraceability } from '@/data/traceability';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { usePostGrnToMaster } from './GRNVerificationForm';
import { toast } from 'sonner';

interface GRNDetailPanelProps {
  grn: GRN;
  open: boolean;
  onClose: () => void;
}

const conditionConfig = {
  good: { label: 'Good', color: '#166534', bg: '#DCFCE7' },
  damaged: { label: 'Damaged', color: '#991B1B', bg: '#FEE2E2' },
  short: { label: 'Short Delivery', color: '#92400E', bg: '#FEF3C7' },
  missing: { label: 'Missing', color: '#991B1B', bg: '#FEE2E2' },
  pending: { label: 'Pending', color: 'var(--muted-foreground)', bg: 'var(--muted)' },
};

const statusMap: Record<string, any> = {
  pending: 'pending',
  'in-progress': 'in-progress',
  completed: 'completed',
  discrepancy: 'discrepancy',
  approved: 'approved',
};

export default function GRNDetailPanel({ grn, open, onClose }: GRNDetailPanelProps) {
  const { user, readOnly } = useAuth();
  const { saveVerification } = useTraceability();
  const post = usePostGrnToMaster();
  if (!open) return null;

  const v = grnValues(grn);
  const canApprove = grn.status === 'discrepancy' && grn.approvalStatus === 'pending' && !readOnly && (user?.role === 'Kitchen Manager' || user?.role === 'Business Owner');

  const approve = () => {
    const approvedBy = user?.name ?? 'Manager';
    saveVerification({
      grnId: grn.grnId,
      status: 'approved',
      approvalStatus: 'approved',
      approvedBy,
      lines: grn.lines.map((l) => ({
        id: l.id,
        receivedQty: l.receivedQty,
        acceptedQty: l.acceptedQty,
        rejectedQty: l.rejectedQty,
        condition: l.condition,
        temperature: l.temperature,
        note: l.note,
        unitCost: l.unitCost,
        expiryDate: l.expiryDate,
      })),
    });
    post({ ...grn, status: 'approved', approvalStatus: 'approved', approvedBy }, approvedBy);
    toast.success(`GRN ${grn.grnId} approved. ${grn.restaurant} inventory updated.`);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.35)' }} onClick={onClose} />
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col animate-slide-in-right overflow-y-auto"
        style={{ width: 580, maxWidth: '100vw', background: 'var(--card)', borderLeft: '1px solid var(--border)', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg flex items-center justify-center" style={{ width: 36, height: 36, background: '#DCFCE7', color: '#166534' }}>
              <PackageCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--foreground)' }}>{grn.grnId}</h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{grn.restaurant} · {grn.supplier} · {grn.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close"><X size={18} /></button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-5">
          <div className="flex items-center gap-3 flex-wrap">
            <StatusBadge variant={statusMap[grn.status]} label={grn.status.charAt(0).toUpperCase() + grn.status.slice(1)} dot />
            <StatusBadge
              variant={grn.approvalStatus === 'approved' ? 'approved' : grn.approvalStatus === 'rejected' ? 'failed' : 'pending'}
              label={`Approval: ${grn.approvalStatus.charAt(0).toUpperCase() + grn.approvalStatus.slice(1)}`}
            />
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Purchased {isoToUk(grn.purchaseDate)}</span>
            {v.discrepancy > 0 && (
              <span className="flex items-center gap-1" style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>
                <AlertTriangle size={12} /> −£{v.discrepancy.toFixed(2)} discrepancy
              </span>
            )}
          </div>

          {grn.notes && grn.status === 'discrepancy' && (
            <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <AlertTriangle size={14} style={{ color: '#92400E', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.5 }}>{grn.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'gs-exp', label: 'Expected Value', value: `£${v.expected.toFixed(2)}`, color: 'var(--foreground)' },
              { id: 'gs-acc', label: 'Accepted Value', value: v.accepted > 0 ? `£${v.accepted.toFixed(2)}` : '—', color: '#166534' },
              { id: 'gs-disc', label: 'Discrepancy', value: v.discrepancy > 0 ? `−£${v.discrepancy.toFixed(2)}` : 'None', color: v.discrepancy > 0 ? '#991B1B' : '#166534' },
            ].map((item) => (
              <div key={item.id} className="rounded-lg p-3" style={{ background: 'var(--muted)' }}>
                <p className="label-text" style={{ fontSize: 10.5 }}>{item.label}</p>
                <p className="font-bold tabular-nums mt-1" style={{ fontSize: 15, color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold mb-3" style={{ fontSize: 14 }}>Line Item Verification</h3>
            <div className="space-y-2">
              {grn.lines.map((line) => {
                const cond = conditionConfig[line.condition];
                return (
                  <div
                    key={line.id}
                    className="rounded-lg p-3"
                    style={{ border: `1px solid ${line.condition !== 'good' && line.condition !== 'pending' ? '#FDE68A' : 'var(--border)'}`, background: line.condition === 'short' || line.condition === 'damaged' ? '#FFFBEB' : 'var(--card)' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold" style={{ fontSize: 13 }}>{line.productName}</span>
                          <span className="font-mono" style={{ fontSize: 11, color: 'var(--primary)' }}>{line.batchId}</span>
                          <span className="rounded-full px-2 py-0.5 font-semibold" style={{ fontSize: 10.5, background: cond.bg, color: cond.color }}>{cond.label}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Expected: <strong style={{ color: 'var(--foreground)' }}>{line.expectedQty} {line.unit}</strong></span>
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                            Received: <strong style={{ color: line.receivedQty !== null && line.receivedQty < line.expectedQty ? '#991B1B' : 'var(--foreground)' }}>{line.receivedQty !== null ? `${line.receivedQty} ${line.unit}` : '—'}</strong>
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Accepted: <strong style={{ color: '#166534' }}>{line.acceptedQty !== null ? `${line.acceptedQty} ${line.unit}` : '—'}</strong></span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>SKU: <strong className="font-mono">{line.sku}</strong></span>
                          <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Lot: <strong className="font-mono">{line.supplierLot}</strong></span>
                          <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Expiry: <strong style={{ color: 'var(--foreground)' }}>{isoToUk(line.expiryDate)}</strong></span>
                          {line.temperature && (
                            <span className="flex items-center gap-1" style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}><Thermometer size={11} />{line.temperature}</span>
                          )}
                          {line.note && <span style={{ fontSize: 11.5, color: '#92400E' }}>{line.note}</span>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="tabular-nums font-semibold" style={{ fontSize: 13 }}>
                          {line.unitCost > 0 ? `£${(line.unitCost * (line.acceptedQty ?? line.expectedQty)).toFixed(2)}` : 'Cost pending'}
                        </p>
                        {line.unitCost > 0 && <p style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>£{line.unitCost.toFixed(2)}/{line.unit}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {grn.approvedBy && (
            <div className="rounded-lg p-3 flex items-center gap-2" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <CheckCircle size={14} style={{ color: '#166534' }} />
              <p style={{ fontSize: 12.5, color: '#166534' }}>Approved by <strong>{grn.approvedBy}</strong></p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
          {canApprove && (
            <button className="btn-primary flex-1 justify-center" onClick={approve}>
              <CheckCircle size={14} />
              Approve GRN
            </button>
          )}
          <button onClick={onClose} className="btn-secondary flex-1 justify-center">Close</button>
        </div>
      </div>
    </>
  );
}