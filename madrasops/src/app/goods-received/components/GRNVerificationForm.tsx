'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, PackageCheck, Thermometer, AlertCircle, CheckCircle } from 'lucide-react';
import { GRN, GrnOverride, isoToUk, useTraceability } from '@/data/traceability';
import { useEposMaster } from '@/data/eposMasterStore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface GRNVerificationFormProps {
  grn: GRN;
  open: boolean;
  onClose: () => void;
}

interface VerificationLine {
  lineId: string;
  receivedQty: string;
  acceptedQty: string;
  temperature: string;
  condition: 'good' | 'damaged' | 'short' | 'missing';
  note: string;
}

interface VerificationFormValues {
  receivedBy: string;
  overallNotes: string;
  lines: VerificationLine[];
}

/** Applies a verified GRN to the shared master: latest purchase cost feeds ingredient costing. */
export function usePostGrnToMaster() {
  const { materialOf, setUnitCost } = useEposMaster();
  const { markPosted } = useTraceability();
  return (grn: GRN, by: string) => {
    if (!markPosted(grn.grnId)) return false;
    for (const l of grn.lines) {
      if ((l.acceptedQty ?? 0) > 0 && l.unitCost > 0) {
        const m = materialOf(l.sku);
        if (m && m.unitCost !== l.unitCost) setUnitCost(l.sku, l.unitCost, `${by} (GRN ${grn.grnId})`);
      }
    }
    return true;
  };
}

export default function GRNVerificationForm({ grn, open, onClose }: GRNVerificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, readOnly } = useAuth();
  const { saveVerification } = useTraceability();
  const post = usePostGrnToMaster();

  const { register, handleSubmit, formState: { errors } } = useForm<VerificationFormValues>({
    defaultValues: {
      receivedBy: user?.name ?? '',
      overallNotes: '',
      lines: grn.lines.map((l) => ({
        lineId: l.id,
        receivedQty: l.expectedQty.toString(),
        acceptedQty: l.expectedQty.toString(),
        temperature: '',
        condition: 'good' as const,
        note: '',
      })),
    },
  });

  const onSubmit = async (data: VerificationFormValues) => {
    if (readOnly) {
      toast.error('Your account is read-only and cannot verify GRNs');
      return;
    }
    setIsSubmitting(true);
    const lines = grn.lines.map((l, i) => {
      const f = data.lines[i];
      const received = Math.max(0, parseFloat(f.receivedQty) || 0);
      const accepted = Math.min(received, Math.max(0, parseFloat(f.acceptedQty) || 0));
      return {
        id: l.id,
        receivedQty: received,
        acceptedQty: accepted,
        rejectedQty: Math.max(0, received - accepted),
        condition: f.condition,
        temperature: f.temperature || null,
        note: f.note,
        unitCost: l.unitCost,
        expiryDate: l.expiryDate,
      };
    });
    const hasDiscrepancy = lines.some((l, i) => l.receivedQty < grn.lines[i].expectedQty || l.condition !== 'good' || (l.rejectedQty ?? 0) > 0);
    const nowIso = new Date().toISOString();
    const override: GrnOverride = {
      grnId: grn.grnId,
      status: hasDiscrepancy ? 'discrepancy' : 'approved',
      approvalStatus: hasDiscrepancy ? 'pending' : 'approved',
      approvedBy: hasDiscrepancy ? null : user?.name ?? 'System',
      receivedBy: data.receivedBy,
      receivedAt: nowIso,
      notes: data.overallNotes || grn.notes,
      lines,
    };
    saveVerification(override);
    if (hasDiscrepancy) {
      toast.warning(`GRN ${grn.grnId} saved with discrepancies. Manager approval required before stock is posted.`);
    } else {
      post({ ...grn, ...override, lines: grn.lines.map((l) => ({ ...l, ...(lines.find((x) => x.id === l.id) ?? {}) })) } as GRN, user?.name ?? 'System');
      toast.success(`GRN ${grn.grnId} verified. Batches posted to ${grn.restaurant} inventory.`);
    }
    setIsSubmitting(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={onClose} />
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col animate-slide-in-right overflow-y-auto"
        style={{ width: 600, maxWidth: '100vw', background: 'var(--card)', borderLeft: '1px solid var(--border)', boxShadow: '-4px 0 32px rgba(0,0,0,0.15)' }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg flex items-center justify-center" style={{ width: 36, height: 36, background: '#DBEAFE', color: '#1E40AF' }}>
              <PackageCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--foreground)' }}>Verify Delivery — {grn.grnId}</h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{grn.restaurant} · {grn.supplier} · {grn.poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
          <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
            <div>
              <label htmlFor="grn-received-by" className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>
                Received By <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input id="grn-received-by" type="text" className="input-field" placeholder="Your name" {...register('receivedBy', { required: 'Required' })} />
              {errors.receivedBy && (
                <p className="flex items-center gap-1 mt-1" style={{ fontSize: 11.5, color: 'var(--primary)' }}>
                  <AlertCircle size={11} /> {errors.receivedBy.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ fontSize: 14, color: 'var(--foreground)' }}>Verify Each Item</h3>
                <span className="demo-badge">FEFO Batch Verification</span>
              </div>
              <div className="space-y-4">
                {grn.lines.map((line, idx) => (
                  <div key={line.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--muted)' }}>
                    <div className="mb-3">
                      <p className="font-semibold" style={{ fontSize: 13.5 }}>{line.productName}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="font-mono" style={{ fontSize: 11, color: 'var(--primary)' }}>{line.batchId}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>SKU {line.sku}</span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Expiry: <strong style={{ color: 'var(--foreground)' }}>{isoToUk(line.expiryDate)}</strong></span>
                        <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Expected: <strong>{line.expectedQty} {line.unit}</strong></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>Received Qty ({line.unit}) *</label>
                        <input type="number" step="any" className="input-field" style={{ fontSize: 13 }} {...register(`lines.${idx}.receivedQty`, { required: 'Required', min: 0 })} />
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>Accepted Qty ({line.unit}) *</label>
                        <input type="number" step="any" className="input-field" style={{ fontSize: 13 }} {...register(`lines.${idx}.acceptedQty`, { required: 'Required', min: 0 })} />
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>
                          <span className="flex items-center gap-1"><Thermometer size={11} /> Temperature</span>
                        </label>
                        <input type="text" className="input-field" placeholder="e.g. 4°C" style={{ fontSize: 13 }} {...register(`lines.${idx}.temperature`)} />
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>Condition *</label>
                        <select className="input-field" style={{ fontSize: 13 }} {...register(`lines.${idx}.condition`)}>
                          <option value="good">Good — Accept in full</option>
                          <option value="short">Short delivery</option>
                          <option value="damaged">Damaged — partial reject</option>
                          <option value="missing">Missing — not delivered</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>Notes / Reason (required if condition ≠ Good)</label>
                        <input type="text" className="input-field" placeholder="e.g. 2 kg short — vehicle capacity issue" style={{ fontSize: 13 }} {...register(`lines.${idx}.note`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="grn-overall-notes" className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>Overall Delivery Notes</label>
              <textarea id="grn-overall-notes" rows={3} className="input-field" placeholder="Any additional observations about this delivery…" style={{ resize: 'vertical', fontSize: 13 }} {...register('overallNotes')} />
            </div>

            <div className="rounded-lg p-3 flex items-start gap-2" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <AlertCircle size={14} style={{ color: '#92400E', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                Any discrepancy requires manager approval before batches are posted to inventory. Purchase costs flow into ingredient costing once the GRN is approved.
              </p>
            </div>
          </div>

          <div className="px-6 py-4 border-t flex gap-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
            <button type="submit" disabled={isSubmitting || readOnly} className="btn-primary flex-1 justify-center" style={{ opacity: isSubmitting || readOnly ? 0.6 : 1 }}>
              <CheckCircle size={14} />
              Submit GRN & Post Stock
            </button>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ minWidth: 90 }}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}