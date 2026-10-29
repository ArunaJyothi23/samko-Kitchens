'use client';

import { useCallback, useEffect, useState } from 'react';

export type IntegrationType = 'Direct API' | 'Vendor Portal' | 'Email' | 'Secure File (CSV/XML)' | 'None (Manual)';

export type CommStatus =
  | 'Not Sent' |'Ready to Send' |'Sending' |'Sent to Vendor' |'Acknowledged' |'Partially Confirmed' |'Confirmed' |'Rejected' |'Failed' |'Cancelled';

export interface VendorConfig {
  name: string;
  integrationType: IntegrationType;
  endpoint: string;
  authMethod: string;
  accountRef: string;
  integrationStatus: 'Active' | 'Needs Attention' | 'Not Configured';
  poMethod: string;
  lastSuccess: string;
  lastError: string;
  email: string;
  simulateFailure?: boolean;
}

export const DEFAULT_VENDORS: VendorConfig[] = [
  { name: 'KTC Wholesale', integrationType: 'Direct API', endpoint: 'https://api.ktc-demo.example/v1/purchase-orders', authMethod: 'API key (stored server-side)', accountRef: 'MF-KTC-4471', integrationStatus: 'Active', poMethod: 'JSON payload', lastSuccess: '2026-10-28T14:22:00.000Z', lastError: '', email: 'orders@ktc-demo.example' },
  { name: 'Spice Route Foods', integrationType: 'Email', endpoint: '', authMethod: 'n/a', accountRef: 'SRF-0098', integrationStatus: 'Active', poMethod: 'PDF by email', lastSuccess: '2026-10-27T09:05:00.000Z', lastError: '', email: 'purchasing@spiceroute-demo.example' },
  { name: 'Fresh Fields Produce', integrationType: 'Secure File (CSV/XML)', endpoint: 'sftp://files.freshfields-demo.example/inbound', authMethod: 'SSH key (stored server-side)', accountRef: 'FFP-2210', integrationStatus: 'Needs Attention', poMethod: 'CSV drop', lastSuccess: '2026-10-21T16:40:00.000Z', lastError: 'Connection timed out (demo)', email: 'orders@freshfields-demo.example', simulateFailure: true },
  { name: 'Dairy Direct UK', integrationType: 'Vendor Portal', endpoint: 'https://portal.dairydirect-demo.example', authMethod: 'OAuth 2.0 (official portal API)', accountRef: 'DDU-7781', integrationStatus: 'Active', poMethod: 'Portal submission', lastSuccess: '2026-10-28T11:10:00.000Z', lastError: '', email: 'trade@dairydirect-demo.example' },
  { name: 'Local Cash & Carry', integrationType: 'None (Manual)', endpoint: '', authMethod: 'n/a', accountRef: '', integrationStatus: 'Not Configured', poMethod: 'Manual (print / phone)', lastSuccess: '', lastError: '', email: '' },
  { name: 'Central Kitchen', integrationType: 'None (Manual)', endpoint: '', authMethod: 'n/a', accountRef: 'INTERNAL', integrationStatus: 'Not Configured', poMethod: 'Internal workflow', lastSuccess: '', lastError: '', email: '' },
];

export interface CommEvent {
  id: string;
  at: string;
  action: string;
  actor: string;
  method: string;
  internalRef: string;
  externalRef: string;
  result: 'Success' | 'Error' | 'Info';
  detail: string;
  retryAttempt: number;
}

export interface ConfirmedLine {
  sku: string;
  confirmedQty: number;
  newUnitCost?: number;
  substituteName?: string;
  outOfStock?: boolean;
}

export interface PendingChange {
  id: string;
  kind: 'Price change' | 'Substitution';
  sku: string;
  description: string;
  status: 'Awaiting review' | 'Approved' | 'Declined';
}

export interface PoComm {
  poNumber: string;
  status: CommStatus;
  idempotencyKey: string;
  externalRef: string;
  sentAt: string;
  retryCount: number;
  expectedDelivery: string;
  confirmedLines: ConfirmedLine[];
  pendingChanges: PendingChange[];
  events: CommEvent[];
}

interface CommState {
  vendors: VendorConfig[];
  comms: Record<string, PoComm>;
}

const KEY = 'madrasops-vendor-comms-v1';
const EVT = 'madrasops-vendor-comms-changed';
const EMPTY: CommState = { vendors: DEFAULT_VENDORS, comms: {} };

function read(): CommState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as CommState;
    return { vendors: p.vendors?.length ? p.vendors : DEFAULT_VENDORS, comms: p.comms ?? {} };
  } catch {
    return EMPTY;
  }
}

function write(s: CommState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new Event(EVT));
  } catch {
    // storage unavailable
  }
}

function uid(p: string) {
  return `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function newComm(poNumber: string): PoComm {
  return {
    poNumber,
    status: 'Not Sent',
    idempotencyKey: `idem-${poNumber}`,
    externalRef: '',
    sentAt: '',
    retryCount: 0,
    expectedDelivery: '',
    confirmedLines: [],
    pendingChanges: [],
    events: [],
  };
}

export function useVendorComms() {
  const [state, setState] = useState<CommState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(read());
    sync();
    setHydrated(true);
    window.addEventListener(EVT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const getComm = useCallback((poNumber: string): PoComm => state.comms[poNumber] ?? newComm(poNumber), [state.comms]);

  const mutate = (poNumber: string, fn: (c: PoComm, s: CommState) => PoComm) => {
    const cur = read();
    const existing = cur.comms[poNumber] ?? newComm(poNumber);
    const next = fn(existing, cur);
    write({ ...cur, comms: { ...cur.comms, [poNumber]: next } });
  };

  /** Simulated send. Idempotency key prevents duplicate vendor orders on retry. */
  const sendToVendor = useCallback((poNumber: string, vendor: string, actor: string): { ok: boolean; message: string } => {
    const cur = read();
    const cfg = cur.vendors.find((v) => v.name === vendor);
    if (!cfg || cfg.integrationType === 'None (Manual)') {
      return { ok: false, message: 'This vendor has no integration configured. Use the manual PO process.' };
    }
    const existing = cur.comms[poNumber] ?? newComm(poNumber);
    if (['Sent to Vendor', 'Acknowledged', 'Partially Confirmed', 'Confirmed'].includes(existing.status)) {
      return { ok: false, message: 'Already sent — duplicate submission blocked by idempotency key.' };
    }
    const nowIso = new Date().toISOString();
    const attempt = existing.retryCount + (existing.status === 'Failed' ? 1 : 0);
    const failed = cfg.simulateFailure === true && attempt < 1;
    const ev: CommEvent = {
      id: uid('ev'),
      at: nowIso,
      action: attempt > 0 ? 'Retry send' : 'Send to vendor',
      actor,
      method: cfg.integrationType,
      internalRef: poNumber,
      externalRef: failed ? '' : `${cfg.accountRef}-${poNumber.slice(-4)}`,
      result: failed ? 'Error' : 'Success',
      detail: failed ? `Delivery failed: ${cfg.lastError || 'timeout'} (simulated). Idempotency key ${existing.idempotencyKey} retained.` : `Accepted by ${cfg.integrationType} connector (simulated, no real transmission).`,
      retryAttempt: attempt,
    };
    const next: PoComm = {
      ...existing,
      status: failed ? 'Failed' : 'Sent to Vendor',
      externalRef: failed ? existing.externalRef : ev.externalRef,
      sentAt: failed ? existing.sentAt : nowIso,
      retryCount: attempt,
      events: [ev, ...existing.events],
    };
    write({
      ...cur,
      comms: { ...cur.comms, [poNumber]: next },
      vendors: cur.vendors.map((v) =>
        v.name === vendor
          ? failed
            ? { ...v, integrationStatus: 'Needs Attention', lastError: 'Delivery failed (simulated)' }
            : { ...v, integrationStatus: 'Active', lastSuccess: nowIso, lastError: '' }
          : v
      ),
    });
    return failed ? { ok: false, message: 'Delivery failed (simulated). You can retry safely — no duplicate will be created.' } : { ok: true, message: `Sent to ${vendor} (simulated).` };
  }, []);

  const recordResponse = useCallback(
    (
      poNumber: string,
      actor: string,
      input: {
        outcome: 'Acknowledged' | 'Confirmed' | 'Partially Confirmed' | 'Rejected';
        externalRef: string;
        expectedDelivery: string;
        lines: ConfirmedLine[];
        note: string;
        orderedLines: { sku: string; name: string; unitCost: number }[];
      }
    ) => {
      mutate(poNumber, (c) => {
        const pending: PendingChange[] = [];
        input.lines.forEach((l) => {
          const ol = input.orderedLines.find((o) => o.sku === l.sku);
          if (l.newUnitCost !== undefined && ol && l.newUnitCost !== ol.unitCost) {
            pending.push({ id: uid('pc'), kind: 'Price change', sku: l.sku, description: `${ol.name}: £${ol.unitCost.toFixed(2)} → £${l.newUnitCost.toFixed(2)}`, status: 'Awaiting review' });
          }
          if (l.substituteName && ol) {
            pending.push({ id: uid('pc'), kind: 'Substitution', sku: l.sku, description: `${ol.name} → ${l.substituteName}`, status: 'Awaiting review' });
          }
        });
        const ev: CommEvent = {
          id: uid('ev'),
          at: new Date().toISOString(),
          action: `Vendor response recorded: ${input.outcome}`,
          actor,
          method: 'Manual response entry',
          internalRef: poNumber,
          externalRef: input.externalRef || c.externalRef,
          result: input.outcome === 'Rejected' ? 'Error' : 'Success',
          detail: (input.note || 'Manual entry') + (pending.length ? ` — ${pending.length} change(s) await authorised review.` : ''),
          retryAttempt: c.retryCount,
        };
        return {
          ...c,
          status: input.outcome,
          externalRef: input.externalRef || c.externalRef,
          expectedDelivery: input.expectedDelivery || c.expectedDelivery,
          confirmedLines: input.lines,
          pendingChanges: [...c.pendingChanges, ...pending],
          events: [ev, ...c.events],
        };
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const reviewChange = useCallback((poNumber: string, changeId: string, decision: 'Approved' | 'Declined', actor: string) => {
    mutate(poNumber, (c) => {
      const ch = c.pendingChanges.find((p) => p.id === changeId);
      const ev: CommEvent = {
        id: uid('ev'),
        at: new Date().toISOString(),
        action: `${ch?.kind ?? 'Change'} ${decision.toLowerCase()}`,
        actor,
        method: 'Internal review',
        internalRef: poNumber,
        externalRef: c.externalRef,
        result: 'Info',
        detail: ch?.description ?? '',
        retryAttempt: c.retryCount,
      };
      return { ...c, pendingChanges: c.pendingChanges.map((p) => (p.id === changeId ? { ...p, status: decision } : p)), events: [ev, ...c.events] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelPo = useCallback((poNumber: string, actor: string) => {
    mutate(poNumber, (c) => ({
      ...c,
      status: 'Cancelled',
      events: [
        { id: uid('ev'), at: new Date().toISOString(), action: 'Cancellation requested', actor, method: 'Internal', internalRef: poNumber, externalRef: c.externalRef, result: 'Info', detail: 'Communication status set to Cancelled (simulated). Vendor cancellation to be confirmed separately.', retryAttempt: c.retryCount },
        ...c.events,
      ],
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateVendor = useCallback((name: string, patch: Partial<VendorConfig>) => {
    const cur = read();
    write({ ...cur, vendors: cur.vendors.map((v) => (v.name === name ? { ...v, ...patch } : v)) });
  }, []);

  return { ...state, hydrated, getComm, sendToVendor, recordResponse, reviewChange, cancelPo, updateVendor };
}

export const COMM_STATUS_STYLE: Record<CommStatus, { bg: string; fg: string }> = {
  'Not Sent': { bg: '#F1F5F9', fg: '#475569' },
  'Ready to Send': { bg: '#E0E7FF', fg: '#3730A3' },
  Sending: { bg: '#E0F2FE', fg: '#075985' },
  'Sent to Vendor': { bg: '#DBEAFE', fg: '#1E40AF' },
  Acknowledged: { bg: '#CFFAFE', fg: '#155E75' },
  'Partially Confirmed': { bg: '#FEF9C3', fg: '#854D0E' },
  Confirmed: { bg: '#DCFCE7', fg: '#166534' },
  Rejected: { bg: '#FEE2E2', fg: '#991B1B' },
  Failed: { bg: '#FEE2E2', fg: '#991B1B' },
  Cancelled: { bg: '#E5E7EB', fg: '#374151' },
};
