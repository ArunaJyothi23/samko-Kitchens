'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, PackageCheck, Thermometer, AlertCircle, CheckCircle } from 'lucide-react';
import { GRN } from './grnData';
import { toast } from 'sonner';

interface GRNVerificationFormProps {
  grn: GRN;
  open: boolean;
  onClose: () => void;
}

interface VerificationLine {
  lineId: string;
  productName: string;
  batchId: string;
  expectedQty: number;
  unit: string;
  expiryDate: string;
  receivedQty: string;
  acceptedQty: string;
  temperature: string;
  condition: string;
  note: string;
}

interface VerificationFormValues {
  receivedBy: string;
  receivedAt: string;
  overallNotes: string;
  lines: VerificationLine[];
}

export default function GRNVerificationForm({ grn, open, onClose }: GRNVerificationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationFormValues>({
    defaultValues: {
      receivedBy: '',
      receivedAt: '',
      overallNotes: '',
      lines: grn.lines.map((l) => ({
        lineId: l.id,
        productName: l.productName,
        batchId: l.batchId,
        expectedQty: l.expectedQty,
        unit: l.unit,
        expiryDate: l.expiryDate,
        receivedQty: l.expectedQty.toString(),
        acceptedQty: l.expectedQty.toString(),
        temperature: '',
        condition: 'good',
        note: '',
      })),
    },
  });

  // Backend integration point: POST to /api/grn/:id/verify with line-level quantities, temperatures and conditions
  const onSubmit = async (data: VerificationFormValues) => {
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const hasDiscrepancy = data.lines.some(
      (l) => parseFloat(l.receivedQty) < l.expectedQty || l.condition !== 'good'
    );
    if (hasDiscrepancy) {
      toast.warning(`GRN ${grn.grnId} saved with discrepancies. Manager approval required.`);
    } else {
      toast.success(`GRN ${grn.grnId} verified. Stock posted to ${grn.restaurant.replace('Samko ', '')} inventory.`);
    }
    setIsSubmitting(false);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 flex flex-col animate-slide-in-right overflow-y-auto"
        style={{
          width: 600,
          background: 'var(--card)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 32px rgba(0,0,0,0.15)',
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
              <PackageCheck size={18} />
            </div>
            <div>
              <h2 className="font-bold" style={{ fontSize: 15, color: 'var(--foreground)' }}>
                Verify Delivery — {grn.grnId}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                {grn.restaurant.replace('Samko ', '')} · Dispatch {grn.dispatchRef}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
          <div className="flex-1 px-6 py-5 space-y-6 overflow-y-auto">
            {/* Receiver Info */}
            <div>
              <h3 className="font-semibold mb-3" style={{ fontSize: 14, color: 'var(--foreground)' }}>
                Receipt Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="grn-received-by" className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>
                    Received By <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    id="grn-received-by"
                    type="text"
                    className="input-field"
                    placeholder="Your name"
                    {...register('receivedBy', { required: 'Required' })}
                  />
                  {errors.receivedBy && (
                    <p className="flex items-center gap-1 mt-1" style={{ fontSize: 11.5, color: 'var(--primary)' }}>
                      <AlertCircle size={11} /> {errors.receivedBy.message}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="grn-received-at" className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>
                    Time of Receipt <span style={{ color: 'var(--primary)' }}>*</span>
                  </label>
                  <input
                    id="grn-received-at"
                    type="time"
                    className="input-field"
                    {...register('receivedAt', { required: 'Required' })}
                  />
                  {errors.receivedAt && (
                    <p className="flex items-center gap-1 mt-1" style={{ fontSize: 11.5, color: 'var(--primary)' }}>
                      <AlertCircle size={11} /> {errors.receivedAt.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold" style={{ fontSize: 14, color: 'var(--foreground)' }}>
                  Verify Each Item
                </h3>
                <span className="demo-badge">FEFO Batch Verification</span>
              </div>
              <div className="space-y-4">
                {grn.lines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="rounded-xl p-4"
                    style={{ border: '1px solid var(--border)', background: 'var(--muted)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold" style={{ fontSize: 13.5, color: 'var(--foreground)' }}>
                          {line.productName}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="font-mono" style={{ fontSize: 11, color: 'var(--primary)' }}>
                            {line.batchId}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                            Expiry: <strong style={{ color: line.expiryDate === '12/10/2026' ? '#991B1B' : 'var(--foreground)' }}>
                              {line.expiryDate}
                            </strong>
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>
                            Expected: <strong>{line.expectedQty} {line.unit}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>
                          Received Qty ({line.unit}) <span style={{ color: 'var(--primary)' }}>*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-field"
                          style={{ fontSize: 13 }}
                          {...register(`lines.${idx}.receivedQty`, { required: 'Required', min: { value: 0, message: 'Must be ≥ 0' } })}
                        />
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>
                          Accepted Qty ({line.unit}) <span style={{ color: 'var(--primary)' }}>*</span>
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="input-field"
                          style={{ fontSize: 13 }}
                          {...register(`lines.${idx}.acceptedQty`, { required: 'Required', min: { value: 0, message: 'Must be ≥ 0' } })}
                        />
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>
                          <span className="flex items-center gap-1">
                            <Thermometer size={11} /> Temperature (°C)
                          </span>
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. 4°C"
                          style={{ fontSize: 13 }}
                          {...register(`lines.${idx}.temperature`)}
                        />
                      </div>
                      <div>
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>
                          Condition <span style={{ color: 'var(--primary)' }}>*</span>
                        </label>
                        <select
                          className="input-field"
                          style={{ fontSize: 13 }}
                          {...register(`lines.${idx}.condition`)}
                        >
                          <option value="good">Good — Accept in full</option>
                          <option value="short">Short delivery</option>
                          <option value="damaged">Damaged — partial reject</option>
                          <option value="missing">Missing — not delivered</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="label-text block mb-1" style={{ fontSize: 11.5 }}>
                          Notes / Reason (required if condition ≠ Good)
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. 2 kg short — vehicle capacity issue"
                          style={{ fontSize: 13 }}
                          {...register(`lines.${idx}.note`)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Overall Notes */}
            <div>
              <label htmlFor="grn-overall-notes" className="label-text block mb-1.5" style={{ fontSize: 12.5 }}>
                Overall Delivery Notes
              </label>
              <textarea
                id="grn-overall-notes"
                rows={3}
                className="input-field"
                placeholder="Any additional observations about this delivery…"
                style={{ resize: 'vertical', fontSize: 13 }}
                {...register('overallNotes')}
              />
            </div>

            {/* Warning */}
            <div
              className="rounded-lg p-3 flex items-start gap-2"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
            >
              <AlertCircle size={14} style={{ color: '#92400E', marginTop: 1, flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
                Any quantity discrepancy will require manager approval before stock is posted to inventory.
                Never accept expired or quarantined stock — verify expiry dates against batch records.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t flex gap-3 shrink-0"
            style={{ borderColor: 'var(--border)' }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
              style={{ opacity: isSubmitting ? 0.7 : 1 }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Posting to Inventory…
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Submit GRN & Post Stock
                </>
              )}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ minWidth: 90 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}