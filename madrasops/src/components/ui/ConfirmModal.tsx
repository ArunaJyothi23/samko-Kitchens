'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onCancel}
      />
      <div
        className="relative card-elevated animate-fade-in w-full max-w-md"
        style={{ padding: 24 }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 btn-ghost"
          aria-label="Close"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 rounded-full flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              background: variant === 'danger' ? '#FEE2E2' : '#FEF3C7',
            }}
          >
            <AlertTriangle
              size={20}
              style={{ color: variant === 'danger' ? 'var(--primary)' : 'var(--warning)' }}
            />
          </div>
          <div>
            <h3 className="font-semibold" style={{ fontSize: 16, color: 'var(--foreground)' }}>
              {title}
            </h3>
            <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 6, lineHeight: 1.5 }}>
              {description}
            </p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary"
            style={variant === 'warning' ? { background: 'var(--warning)', color: 'var(--warning-foreground)' } : {}}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}