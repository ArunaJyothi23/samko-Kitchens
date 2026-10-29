'use client';

import React from 'react';
import { RANGE_OPTIONS, RangeKey, fmtDate } from './financeData';

interface Props {
  rangeKey: RangeKey;
  onRangeKey: (k: RangeKey) => void;
  customFrom: string;
  customTo: string;
  onCustomFrom: (v: string) => void;
  onCustomTo: (v: string) => void;
  from: string;
  to: string;
}

export default function DateRangeFilter({ rangeKey, onRangeKey, customFrom, customTo, onCustomFrom, onCustomTo, from, to }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Date range">
        {RANGE_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => onRangeKey(o.key)}
            className={rangeKey === o.key ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 10px', fontSize: 12 }}
          >
            {o.label}
          </button>
        ))}
      </div>
      {rangeKey === 'custom' && (
        <div className="flex items-center gap-1">
          <input type="date" className="input-field" style={{ width: 140 }} value={customFrom} onChange={(e) => onCustomFrom(e.target.value)} aria-label="Start date" />
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>to</span>
          <input type="date" className="input-field" style={{ width: 140 }} value={customTo} onChange={(e) => onCustomTo(e.target.value)} aria-label="End date" />
        </div>
      )}
      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
        {fmtDate(from)} – {fmtDate(to)} · Europe/London
      </span>
    </div>
  );
}
