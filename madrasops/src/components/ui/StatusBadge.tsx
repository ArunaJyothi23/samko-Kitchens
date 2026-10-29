import React from 'react';

type BadgeVariant =
  | 'completed'
  | 'in-progress' |'draft' |'dispatched' |'in-transit' |'delivered' |'discrepancy' |'alert' |'cancelled' |'pending' |'approved' |'processing' |'failed' |'quarantined' |'expired' |'reserved';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, { className: string; defaultLabel: string }> = {
  completed: { className: 'badge-completed', defaultLabel: 'Completed' },
  'in-progress': { className: 'badge-in-progress', defaultLabel: 'In Progress' },
  draft: { className: 'badge-draft', defaultLabel: 'Draft' },
  dispatched: { className: 'badge-dispatched', defaultLabel: 'Dispatched' },
  'in-transit': { className: 'badge-in-transit', defaultLabel: 'In Transit' },
  delivered: { className: 'badge-delivered', defaultLabel: 'Delivered' },
  discrepancy: { className: 'badge-discrepancy', defaultLabel: 'Discrepancy' },
  alert: { className: 'badge-alert', defaultLabel: 'Alert' },
  cancelled: { className: 'badge-cancelled', defaultLabel: 'Cancelled' },
  pending: { className: 'badge-pending', defaultLabel: 'Pending' },
  approved: { className: 'badge-approved', defaultLabel: 'Approved' },
  processing: { className: 'badge-processing', defaultLabel: 'Processing' },
  failed: { className: 'badge-failed', defaultLabel: 'Failed' },
  quarantined: { className: 'badge-quarantined', defaultLabel: 'Quarantined' },
  expired: { className: 'badge-expired', defaultLabel: 'Expired' },
  reserved: { className: 'badge-reserved', defaultLabel: 'Reserved' },
};

export default function StatusBadge({ variant, label, dot = false }: StatusBadgeProps) {
  const { className, defaultLabel } = variantMap[variant];
  return (
    <span className={`status-badge ${className}`}>
      {dot && (
        <span
          className="inline-block rounded-full"
          style={{ width: 6, height: 6, background: 'currentColor', opacity: 0.7 }}
        />
      )}
      {label ?? defaultLabel}
    </span>
  );
}