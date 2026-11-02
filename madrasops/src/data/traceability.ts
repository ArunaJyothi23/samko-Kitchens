'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RAW_BY_SKU, RAW_MATERIALS, MENU_ITEMS, StockUnit } from './eposMaster';

export type HotelName = 'Stanhill Hotel Limited' | 'Warren House Hotel Limited';

export const HOTEL_CODE: Record<HotelName, 'STH' | 'WRH'> = {
  'Stanhill Hotel Limited': 'STH',
  'Warren House Hotel Limited': 'WRH',
};

/* ------------------------------------------------------------------ */
/* Suppliers                                                           */
/* ------------------------------------------------------------------ */

export interface Supplier {
  id: string;
  name: string;
}

export const SUPPLIER_LIST: Supplier[] = [
  { id: 'SUP-001', name: 'KTC Wholesale' },
  { id: 'SUP-002', name: 'Fresh Fields Produce' },
  { id: 'SUP-003', name: 'Dairy Direct UK' },
  { id: 'SUP-004', name: 'Spice Route Foods' },
  { id: 'SUP-005', name: 'Local Cash & Carry' },
];

/* ------------------------------------------------------------------ */
/* GRN + batches                                                       */
/* ------------------------------------------------------------------ */

export type LineCondition = 'good' | 'damaged' | 'short' | 'missing' | 'pending';

export interface GRNLine {
  id: string;
  sku: string; // Raw Material Master reference
  productName: string; // snapshot of master name at time of receipt
  batchId: string;
  supplierLot: string;
  expectedQty: number;
  receivedQty: number | null;
  acceptedQty: number | null;
  rejectedQty: number | null;
  unit: StockUnit | string;
  unitCost: number;
  expiryDate: string; // ISO yyyy-mm-dd
  temperature: string | null;
  condition: LineCondition;
  note: string;
}

export interface GRN {
  id: string;
  grnId: string;
  poNumber: string;
  supplierId: string;
  supplier: string;
  restaurant: HotelName;
  restaurantCode: 'STH' | 'WRH';
  receivedBy: string;
  receivedAt: string; // ISO or 'Expected …'
  purchaseDate: string; // ISO yyyy-mm-dd
  status: 'pending' | 'in-progress' | 'completed' | 'discrepancy' | 'approved';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approvedBy: string | null;
  notes: string;
  lines: GRNLine[];
}

export function grnValues(g: GRN) {
  const expected = g.lines.reduce((s, l) => s + l.expectedQty * l.unitCost, 0);
  const accepted = g.lines.reduce((s, l) => s + (l.acceptedQty ?? 0) * l.unitCost, 0);
  const received = g.lines.some((l) => l.receivedQty !== null);
  const discrepancy = received ? Math.max(0, expected - accepted) : 0;
  return { expected, accepted, discrepancy };
}

const sku = (s: string) => {
  const m = RAW_BY_SKU[s];
  return { sku: s, productName: m?.name ?? s, unit: m?.unit ?? 'kg' };
};

function gl(
  grn: string,
  n: number,
  s: string,
  batchId: string,
  lot: string,
  qty: number,
  cost: number,
  expiry: string,
  extra: Partial<GRNLine> = {}
): GRNLine {
  return {
    id: `${grn}-l${n}`,
    ...sku(s),
    batchId,
    supplierLot: lot,
    expectedQty: qty,
    receivedQty: qty,
    acceptedQty: qty,
    rejectedQty: 0,
    unitCost: cost,
    expiryDate: expiry,
    temperature: '4°C',
    condition: 'good',
    note: '',
    ...extra,
  };
}

function pendingLine(grn: string, n: number, s: string, batchId: string, lot: string, qty: number, cost: number, expiry: string): GRNLine {
  return gl(grn, n, s, batchId, lot, qty, cost, expiry, { receivedQty: null, acceptedQty: null, rejectedQty: null, temperature: null, condition: 'pending' });
}

/**
 * Seed operational GRNs. Every line references the centralised Raw Material Master by SKU.
 * Unit costs are left at 0 where the master has no admin-entered cost, so no cost is invented.
 */
export const SEED_GRNS: GRN[] = [
  {
    id: 'grn-sth-001',
    grnId: 'GRN-STH-0001',
    poNumber: 'PO-STH-0001',
    supplierId: 'SUP-001',
    supplier: 'KTC Wholesale',
    restaurant: 'Stanhill Hotel Limited',
    restaurantCode: 'STH',
    receivedBy: 'Stanhill Hotel User',
    receivedAt: '2026-10-10T06:40:00',
    purchaseDate: '2026-10-09',
    status: 'approved',
    approvalStatus: 'approved',
    approvedBy: 'Priya Sharma',
    notes: 'Chilled meat & poultry delivery. Temperatures checked on arrival.',
    lines: [
      gl('grn-sth-001', 1, 'RM-MP-001', 'BAT-STH-0001', 'KTC-L-4410', 20, 0, '2026-10-16', { temperature: '2°C' }),
      gl('grn-sth-001', 2, 'RM-MP-004', 'BAT-STH-0002', 'KTC-L-4411', 8, 0, '2026-10-15', { temperature: '2°C' }),
      gl('grn-sth-001', 3, 'RM-MP-006', 'BAT-STH-0003', 'KTC-L-4412', 6, 0, '2026-10-18', { temperature: '3°C' }),
    ],
  },
  {
    id: 'grn-sth-002',
    grnId: 'GRN-STH-0002',
    poNumber: 'PO-STH-0002',
    supplierId: 'SUP-002',
    supplier: 'Fresh Fields Produce',
    restaurant: 'Stanhill Hotel Limited',
    restaurantCode: 'STH',
    receivedBy: 'Stanhill Hotel User',
    receivedAt: '2026-10-10T07:05:00',
    purchaseDate: '2026-10-09',
    status: 'approved',
    approvalStatus: 'approved',
    approvedBy: 'Priya Sharma',
    notes: '',
    lines: [
      gl('grn-sth-002', 1, 'RM-VG-008', 'BAT-STH-0004', 'FFP-2210', 6, 0, '2026-10-14', { temperature: '5°C' }),
      gl('grn-sth-002', 2, 'RM-VG-001', 'BAT-STH-0005', 'FFP-2211', 12, 0, '2026-10-15', { temperature: '6°C' }),
      gl('grn-sth-002', 3, 'RM-DE-002', 'BAT-STH-0006', 'DDU-7710', 5, 0, '2026-10-30', { temperature: '4°C' }),
    ],
  },
  {
    id: 'grn-sth-003',
    grnId: 'GRN-STH-0003',
    poNumber: 'PO-STH-0003',
    supplierId: 'SUP-003',
    supplier: 'Dairy Direct UK',
    restaurant: 'Stanhill Hotel Limited',
    restaurantCode: 'STH',
    receivedBy: 'Stanhill Hotel User',
    receivedAt: '2026-10-11T06:50:00',
    purchaseDate: '2026-10-10',
    status: 'discrepancy',
    approvalStatus: 'pending',
    approvedBy: null,
    notes: 'Eggs short on delivery — manager approval required before stock is posted.',
    lines: [
      gl('grn-sth-003', 1, 'RM-DE-009', 'BAT-STH-0007', 'DDU-7801', 30, 0, '2026-10-18', { temperature: '3°C' }),
      gl('grn-sth-003', 2, 'RM-DE-010', 'BAT-STH-0008', 'DDU-7802', 360, 0, '2026-10-28', {
        receivedQty: 300, acceptedQty: 300, condition: 'short', note: '60 eggs short — supplier shortage', temperature: '4°C',
      }),
    ],
  },
  {
    id: 'grn-sth-004',
    grnId: 'GRN-STH-0004',
    poNumber: 'PO-STH-0004',
    supplierId: 'SUP-004',
    supplier: 'Spice Route Foods',
    restaurant: 'Stanhill Hotel Limited',
    restaurantCode: 'STH',
    receivedBy: 'Pending',
    receivedAt: 'Expected 07:30',
    purchaseDate: '2026-10-11',
    status: 'pending',
    approvalStatus: 'pending',
    approvedBy: null,
    notes: 'Delivery in transit.',
    lines: [
      pendingLine('grn-sth-004', 1, 'RM-DG-001', 'BAT-STH-0009', 'SRF-3301', 25, 0, '2027-04-30'),
      pendingLine('grn-sth-004', 2, 'RM-DG-024', 'BAT-STH-0010', 'SRF-3302', 10, 0, '2027-02-28'),
      pendingLine('grn-sth-004', 3, 'RM-BB-006', 'BAT-STH-0011', 'SRF-3303', 60, 0, '2026-10-25'),
    ],
  },
  {
    id: 'grn-wrh-001',
    grnId: 'GRN-WRH-0001',
    poNumber: 'PO-WRH-0001',
    supplierId: 'SUP-001',
    supplier: 'KTC Wholesale',
    restaurant: 'Warren House Hotel Limited',
    restaurantCode: 'WRH',
    receivedBy: 'Warren House Hotel User',
    receivedAt: '2026-10-10T06:15:00',
    purchaseDate: '2026-10-09',
    status: 'approved',
    approvalStatus: 'approved',
    approvedBy: 'Priya Sharma',
    notes: '',
    lines: [
      gl('grn-wrh-001', 1, 'RM-MP-009', 'BAT-WRH-0001', 'KTC-L-5510', 4, 0, '2026-11-02', { temperature: '3°C' }),
      gl('grn-wrh-001', 2, 'RM-MP-001', 'BAT-WRH-0002', 'KTC-L-5511', 14, 0, '2026-10-16', { temperature: '2°C' }),
      gl('grn-wrh-001', 3, 'RM-BB-006', 'BAT-WRH-0003', 'KTC-L-5512', 48, 0, '2026-10-24', { temperature: '4°C' }),
    ],
  },
  {
    id: 'grn-wrh-002',
    grnId: 'GRN-WRH-0002',
    poNumber: 'PO-WRH-0002',
    supplierId: 'SUP-002',
    supplier: 'Fresh Fields Produce',
    restaurant: 'Warren House Hotel Limited',
    restaurantCode: 'WRH',
    receivedBy: 'Warren House Hotel User',
    receivedAt: '2026-10-10T07:20:00',
    purchaseDate: '2026-10-09',
    status: 'approved',
    approvalStatus: 'approved',
    approvedBy: 'Priya Sharma',
    notes: '',
    lines: [
      gl('grn-wrh-002', 1, 'RM-VG-001', 'BAT-WRH-0004', 'FFP-3310', 10, 0, '2026-10-15', { temperature: '6°C' }),
      gl('grn-wrh-002', 2, 'RM-FS-001', 'BAT-WRH-0005', 'FFP-3311', 8, 0, '2026-10-13', { temperature: '1°C' }),
      gl('grn-wrh-002', 3, 'RM-DS-004', 'BAT-WRH-0006', 'FFP-3312', 6, 0, '2027-01-31', { temperature: '-18°C' }),
    ],
  },
  {
    id: 'grn-wrh-003',
    grnId: 'GRN-WRH-0003',
    poNumber: 'PO-WRH-0003',
    supplierId: 'SUP-005',
    supplier: 'Local Cash & Carry',
    restaurant: 'Warren House Hotel Limited',
    restaurantCode: 'WRH',
    receivedBy: 'Pending',
    receivedAt: 'Expected 08:00',
    purchaseDate: '2026-10-11',
    status: 'pending',
    approvalStatus: 'pending',
    approvedBy: null,
    notes: 'Delivery in transit.',
    lines: [
      pendingLine('grn-wrh-003', 1, 'RM-DG-007', 'BAT-WRH-0007', 'LCC-9001', 20, 0, '2027-06-30'),
      pendingLine('grn-wrh-003', 2, 'RM-DE-008', 'BAT-WRH-0008', 'LCC-9002', 12, 0, '2026-10-20'),
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Archived legacy (South Indian) records – read-only history          */
/* ------------------------------------------------------------------ */

export interface LegacyRecord {
  id: string;
  kind: 'GRN' | 'Batch' | 'Journey';
  reference: string;
  item: string;
  detail: string;
  location: string; // original, unmapped location label
  date: string;
}

/**
 * Legacy rows are preserved for audit only. They carry NO SKU, are never mapped to the new
 * Raw Material Master, never assigned to either hotel, and never appear in operational lists.
 */
export const LEGACY_ARCHIVE: LegacyRecord[] = [
  { id: 'lg-1', kind: 'GRN', reference: 'GRN-0089', item: 'Dosa Batter, Idly Batter, Sambar, White Chutney', detail: 'Dispatch DSP-0040 · discrepancy pending (Idly Batter 2 kg short)', location: 'Legacy location', date: '2026-10-11' },
  { id: 'lg-2', kind: 'GRN', reference: 'GRN-0088', item: 'Dosa Batter, Idly Batter, Sambar, Red Chutney, Vada Batter', detail: 'Dispatch DSP-0041 · approved', location: 'Legacy location', date: '2026-10-11' },
  { id: 'lg-3', kind: 'GRN', reference: 'GRN-0087', item: 'Dosa Batter, Idly Batter, Sambar, Red Chutney, Dosa Masala', detail: 'Dispatch DSP-0039 · approved', location: 'Legacy location', date: '2026-10-11' },
  { id: 'lg-4', kind: 'GRN', reference: 'GRN-0086', item: 'Dosa Batter, Paneer, Sambar', detail: 'Dispatch DSP-0038 · completed (Paneer 0.5 kg short)', location: 'Legacy location', date: '2026-10-10' },
  { id: 'lg-5', kind: 'GRN', reference: 'GRN-0090', item: 'Dosa Batter, Idly Batter, Sambar, Red & White Chutney', detail: 'Dispatch DSP-0042 · never received', location: 'Legacy location', date: '2026-10-11' },
  { id: 'lg-6', kind: 'Batch', reference: 'BT-2026-283-001', item: 'Dosa Batter', detail: 'Central Kitchen production batch · 100 kg', location: 'Legacy location', date: '2026-10-10' },
  { id: 'lg-7', kind: 'Batch', reference: 'BT-2026-283-002', item: 'Idly Batter', detail: 'Central Kitchen production batch · 80 kg', location: 'Legacy location', date: '2026-10-10' },
  { id: 'lg-8', kind: 'Batch', reference: 'BT-2026-279-008', item: 'Paneer', detail: 'Fresh Dairy Supplies Ltd · 20 kg', location: 'Legacy location', date: '2026-10-06' },
  { id: 'lg-9', kind: 'Journey', reference: 'MF-HOU-10482', item: 'Masala Dosa', detail: 'Order traced via BT-2026-283-001', location: 'Legacy location', date: '2026-10-11' },
  { id: 'lg-10', kind: 'Journey', reference: 'MF-HOU-10483', item: 'Idly (2 pcs)', detail: 'Order traced via BT-2026-283-002', location: 'Legacy location', date: '2026-10-11' },
];

/* ------------------------------------------------------------------ */
/* Persisted ledger: GRN approvals + stock events                      */
/* ------------------------------------------------------------------ */

export type StockEventType = 'transfer-out' | 'transfer-in' | 'wastage' | 'expired' | 'rejected' | 'adjustment' | 'production-issue';

export interface StockEvent {
  id: string;
  batchId: string;
  sku: string;
  restaurant: HotelName;
  type: StockEventType;
  quantity: number; // positive = reduces stock, negative = increases (adjustments)
  at: string;
  by: string;
  note: string;
  /** Preparation batch that consumed this raw batch (production-issue only) */
  prepBatchNo?: string;
}

export interface GrnOverride {
  grnId: string;
  status: GRN['status'];
  approvalStatus: GRN['approvalStatus'];
  approvedBy: string | null;
  receivedBy?: string;
  receivedAt?: string;
  notes?: string;
  lines?: Pick<GRNLine, 'id' | 'receivedQty' | 'acceptedQty' | 'rejectedQty' | 'condition' | 'temperature' | 'note' | 'unitCost' | 'expiryDate'>[];
}

export interface TraceState {
  overrides: GrnOverride[];
  created: GRN[];
  events: StockEvent[];
  postedGrns: string[]; // GRNs whose stock has been posted (idempotency)
}

const KEY = 'samko-trace-v1';
const EVT = 'samko-trace-changed';
const EMPTY: TraceState = { overrides: [], created: [], events: [], postedGrns: [] };

function read(): TraceState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const p = JSON.parse(raw) as Partial<TraceState>;
    return { overrides: p.overrides ?? [], created: p.created ?? [], events: p.events ?? [], postedGrns: p.postedGrns ?? [] };
  } catch {
    return EMPTY;
  }
}

function write(s: TraceState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new Event(EVT));
  } catch {
    // storage unavailable
  }
}

function applyOverride(g: GRN, o?: GrnOverride): GRN {
  if (!o) return g;
  return {
    ...g,
    status: o.status,
    approvalStatus: o.approvalStatus,
    approvedBy: o.approvedBy,
    receivedBy: o.receivedBy ?? g.receivedBy,
    receivedAt: o.receivedAt ?? g.receivedAt,
    notes: o.notes ?? g.notes,
    lines: g.lines.map((l) => {
      const ov = o.lines?.find((x) => x.id === l.id);
      return ov ? { ...l, ...ov } : l;
    }),
  };
}

/* ------------------------------------------------------------------ */
/* Batches derived from approved GRNs                                  */
/* ------------------------------------------------------------------ */

export interface StockBatch {
  batchId: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  restaurant: HotelName;
  restaurantCode: 'STH' | 'WRH';
  supplier: string;
  supplierId: string;
  supplierLot: string;
  grnId: string;
  poNumber: string;
  purchaseDate: string;
  receivedAt: string;
  expiryDate: string;
  unitCost: number;
  qtyReceived: number;
  qtyConsumed: number;
  qtyWasted: number;
  qtyExpired: number;
  qtyRejected: number;
  qtyTransferredOut: number;
  qtyAdjusted: number;
  /** Quantity issued into bulk preparation production */
  qtyIssuedToPrep?: number;
  qtyRemaining: number;
  status: 'active' | 'depleted' | 'expired' | 'quarantined';
  consumers: BatchConsumption[];
}

export interface BatchConsumption {
  orderId: string;
  menuItemId?: string;
  menuItem: string;
  quantity: number; // in batch stock unit
  at: string;
}

export interface EposConsumptionSource {
  orderId: string;
  restaurant: string;
  orderTime: string;
  status: string;
  isDuplicate: boolean;
  lines: {
    menuItem: string;
    menuItemId?: string;
    quantity: number;
    modifiers?: string[];
    consumption: { ingredientName: string; quantity: number; unit: string; totalIngredientCost: number }[];
  }[];
}

const toStock = (qty: number, from: string, to: string): number => {
  if (from === to) return qty;
  if (from === 'g' && to === 'kg') return qty / 1000;
  if (from === 'kg' && to === 'g') return qty * 1000;
  if (from === 'ml' && to === 'litre') return qty / 1000;
  if (from === 'litre' && to === 'ml') return qty * 1000;
  return qty;
};

/**
 * Builds FEFO-allocated batches. Consumption comes from EPOS orders (approved recipes only) and is
 * allocated to the earliest-expiring approved batch of the same SKU in the same hotel.
 */
export function buildBatches(grns: GRN[], events: StockEvent[], orders: EposConsumptionSource[], today: string): StockBatch[] {
  const batches: StockBatch[] = [];
  for (const g of grns) {
    if (g.approvalStatus !== 'approved') continue;
    for (const l of g.lines) {
      const qty = l.acceptedQty ?? 0;
      if (qty <= 0) continue;
      batches.push({
        batchId: l.batchId,
        sku: l.sku,
        name: l.productName,
        category: RAW_BY_SKU[l.sku]?.category ?? 'Uncategorised',
        unit: String(l.unit),
        restaurant: g.restaurant,
        restaurantCode: g.restaurantCode,
        supplier: g.supplier,
        supplierId: g.supplierId,
        supplierLot: l.supplierLot,
        grnId: g.grnId,
        poNumber: g.poNumber,
        purchaseDate: g.purchaseDate,
        receivedAt: g.receivedAt,
        expiryDate: l.expiryDate,
        unitCost: l.unitCost,
        qtyReceived: qty,
        qtyConsumed: 0,
        qtyWasted: 0,
        qtyExpired: 0,
        qtyRejected: l.rejectedQty ?? 0,
        qtyTransferredOut: 0,
        qtyAdjusted: 0,
        qtyRemaining: qty,
        status: 'active',
        consumers: [],
      });
    }
  }

  // Manual stock events (wastage, expiry, adjustments, transfers)
  for (const e of events) {
    const b = batches.find((x) => x.batchId === e.batchId && x.restaurant === e.restaurant);
    if (!b) continue;
    if (e.type === 'wastage') b.qtyWasted += e.quantity;
    else if (e.type === 'expired') b.qtyExpired += e.quantity;
    else if (e.type === 'rejected') b.qtyRejected += e.quantity;
    else if (e.type === 'transfer-out') b.qtyTransferredOut += e.quantity;
    else if (e.type === 'production-issue') b.qtyTransferredOut += e.quantity;
    else if (e.type === 'adjustment') b.qtyAdjusted += e.quantity;
  }

  // EPOS consumption → FEFO allocation (completed, non-duplicate orders only)
  const sorted = [...orders].filter((o) => o.status === 'completed' && !o.isDuplicate).sort((a, b) => a.orderTime.localeCompare(b.orderTime));
  for (const o of sorted) {
    for (const line of o.lines) {
      for (const c of line.consumption) {
        const mat = RAW_MATERIALS.find((m) => m.name === c.ingredientName);
        if (!mat) continue;
        let need = toStock(c.quantity, c.unit, mat.unit);
        const pool = batches
          .filter((b) => b.sku === mat.sku && b.restaurant === o.restaurant)
          .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
        for (const b of pool) {
          if (need <= 0) break;
          const avail = b.qtyReceived - b.qtyConsumed - b.qtyWasted - b.qtyExpired - b.qtyTransferredOut + b.qtyAdjusted;
          if (avail <= 0) continue;
          const take = Math.min(avail, need);
          b.qtyConsumed += take;
          need -= take;
          b.consumers.push({ orderId: o.orderId, menuItemId: line.menuItemId, menuItem: line.menuItem, quantity: take, at: o.orderTime });
        }
      }
    }
  }

  for (const b of batches) {
    b.qtyRemaining = Math.max(0, b.qtyReceived - b.qtyConsumed - b.qtyWasted - b.qtyExpired - b.qtyTransferredOut + b.qtyAdjusted);
    b.status = b.qtyRemaining <= 0 ? 'depleted' : b.expiryDate && b.expiryDate < today ? 'expired' : 'active';
  }
  return batches;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

function uid() {
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function useTraceability() {
  const [state, setState] = useState<TraceState>(EMPTY);
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

  const grns = useMemo<GRN[]>(
    () => [...state.created, ...SEED_GRNS].map((g) => applyOverride(g, state.overrides.find((o) => o.grnId === g.grnId))),
    [state.overrides, state.created]
  );

  const saveVerification = useCallback((o: GrnOverride) => {
    const cur = read();
    write({ ...cur, overrides: [...cur.overrides.filter((x) => x.grnId !== o.grnId), o] });
  }, []);

  /** Idempotent: marks GRN as stock-posted once so inventory/batches are never duplicated. */
  const markPosted = useCallback((grnId: string): boolean => {
    const cur = read();
    if (cur.postedGrns.includes(grnId)) return false;
    write({ ...cur, postedGrns: [...cur.postedGrns, grnId] });
    return true;
  }, []);

  const addGrn = useCallback((g: GRN) => {
    const cur = read();
    write({ ...cur, created: [g, ...cur.created] });
  }, []);

  const recordEvent = useCallback((e: Omit<StockEvent, 'id' | 'at'>) => {
    const cur = read();
    write({ ...cur, events: [{ ...e, id: uid(), at: new Date().toISOString() }, ...cur.events].slice(0, 500) });
  }, []);

  return { state, hydrated, grns, saveVerification, markPosted, addGrn, recordEvent };
}

/** Next sequential GRN number for a hotel (never reused across hotels). */
export function nextGrnNumber(all: GRN[], code: 'STH' | 'WRH'): string {
  const max = all
    .filter((g) => g.restaurantCode === code)
    .reduce((m, g) => Math.max(m, parseInt(g.grnId.split('-').pop() ?? '0', 10) || 0), 0);
  return `GRN-${code}-${String(max + 1).padStart(4, '0')}`;
}

export function menuItemName(id?: string): string | undefined {
  return MENU_ITEMS.find((m) => m.id === id)?.name;
}

export function isoToUk(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return iso || '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}
