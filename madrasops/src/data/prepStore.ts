'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { StockUnit, convertUnit, PrepCostRef, RAW_MATERIALS } from './eposMaster';
import { HotelName, HOTEL_CODE, StockBatch } from './traceability';
import { buildSeedPreparations, applyApproxCosts, buildSeedProduction, buildSeedPrepEvents, buildSeedPrepAudit } from './seedData';
import { useEposMaster } from './eposMasterStore';

const SEED_RAW = applyApproxCosts(RAW_MATERIALS);
const SEED_RAW_BY_SKU = new Map(SEED_RAW.map((m) => [m.sku, m]));

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export const PREP_CATEGORIES = ['Sauce', 'Marinade', 'Dressing', 'Batter / Coating', 'Soup Base', 'Filling', 'Rice / Grain Prep', 'Salad Prep', 'Dessert Prep', 'Other'];

export const ALLERGENS = ['Gluten', 'Milk', 'Eggs', 'Fish', 'Crustaceans', 'Molluscs', 'Peanuts', 'Nuts', 'Soya', 'Celery', 'Mustard', 'Sesame', 'Sulphites', 'Lupin'];

export interface PrepIngredient {
  id: string;
  sku: string; // raw material sku OR preparation id when isPrep
  isPrep?: boolean;
  quantity: number;
  unit: StockUnit;
}

export interface PrepVersion {
  version: number;
  ingredients: PrepIngredient[];
  expectedYield: number; // in stockUnit of the preparation
  prepLossPct: number; // expected preparation loss / wastage %
  instructions: string;
  status: 'draft' | 'approved';
  updatedAt: string;
  updatedBy: string;
}

export interface Preparation {
  id: string; // PREP-STH-0001
  hotel: HotelName;
  name: string;
  category: string;
  description: string;
  unit: StockUnit; // prepared inventory unit (kg / litre / piece / portion ...)
  storageLocation: string;
  shelfLifeDays: number;
  allergens: string[];
  active: boolean;
  versions: PrepVersion[];
  createdAt: string;
  createdBy: string;
}

export interface IssuedLine {
  sku: string;
  name: string;
  rawBatchId?: string;
  grnId?: string;
  supplier?: string;
  prepBatchId?: string; // when an ingredient is itself a prepared batch
  quantity: number; // in the ingredient's stock unit
  unit: string;
  unitCost: number;
  cost: number;
}

export type ProdStatus = 'pending-approval' | 'approved' | 'rejected';
export type PrepBatchStatus = 'awaiting-approval' | 'active' | 'depleted' | 'expired' | 'rejected' | 'quarantined';

export interface ProductionBatch {
  batchNo: string; // PRB-STH-0001
  prepId: string;
  prepName: string;
  recipeVersion: number;
  hotel: HotelName;
  unit: StockUnit;
  targetYield: number;
  actualYield: number; // usable yield
  productionLoss: number;
  issued: IssuedLine[];
  totalCost: number;
  otherCost: number;
  unitCost: number; // total cost / actual usable yield
  producedAt: string;
  expiryDate: string;
  preparedBy: string;
  approvedBy: string | null;
  approvalStatus: ProdStatus;
  storageLocation: string;
  tempC: string;
  allergens: string[];
  /** Set when the batch was received from another hotel via an authorised transfer */
  transferredFrom?: { hotel: HotelName; batchNo: string };
}

export type PrepEventType = 'wastage' | 'expired' | 'spoiled' | 'rejected' | 'adjustment' | 'transfer-out' | 'reserve';

export interface PrepEvent {
  id: string;
  batchNo: string;
  hotel: HotelName;
  type: PrepEventType;
  quantity: number;
  at: string;
  by: string;
  note: string;
}

export interface PrepConsumptionRecord {
  orderId: string;
  hotel: HotelName;
  menuItem: string;
  menuItemId?: string;
  prepId: string;
  quantity: number;
  at: string;
}

export interface PrepAudit {
  id: string;
  at: string;
  by: string;
  ref: string;
  detail: string;
}

export interface PrepState {
  preps: Preparation[];
  batches: ProductionBatch[];
  events: PrepEvent[];
  audit: PrepAudit[];
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

const KEY = 'samko-prep-v1';
const SEED_FLAG = 'samko-prep-prod-seeded-v1';
const EVT = 'samko-prep-changed';
const EMPTY: PrepState = { preps: [], batches: [], events: [], audit: [] };

/**
 * Merges the starter data into a state. Preparations are added by missing id (user edits are never
 * overwritten). Production batches, events and audit entries are seeded once per browser, and only
 * when no production has been recorded yet, so real batch numbers are never clashed with.
 */
function withSeed(s: PrepState): { state: PrepState; changed: boolean } {
  const have = new Set(s.preps.map((p) => p.id));
  let missing = buildSeedPreparations().filter((p) => !have.has(p.id));

  let seeded = false;
  try {
    seeded = localStorage.getItem(SEED_FLAG) === '1';
  } catch {
    seeded = false;
  }
  const seedProd = !seeded && s.batches.length === 0;
  const seedBatches = seedProd ? buildSeedProduction() : [];
  const seedEvents = seedProd ? buildSeedPrepEvents() : [];
  const seedAudit = seedProd || (!seeded && s.audit.length === 0) ? buildSeedPrepAudit().filter((a) => seedProd || a.id.startsWith('pa-seed-prep')) : [];

  if (!seeded) {
    try {
      localStorage.setItem(SEED_FLAG, '1');
    } catch {
      // storage unavailable
    }
  }

  if (missing.length === 0 && seedBatches.length === 0 && seedEvents.length === 0 && seedAudit.length === 0) return { state: s, changed: false };
  return {
    state: {
      preps: [...s.preps, ...missing],
      batches: [...s.batches, ...seedBatches],
      events: [...s.events, ...seedEvents],
      audit: [...s.audit, ...seedAudit].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 400),
    },
    changed: true,
  };
}

function read(): PrepState {
  let base: PrepState = EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PrepState>;
      base = { preps: p.preps ?? [], batches: p.batches ?? [], events: p.events ?? [], audit: p.audit ?? [] };
    }
  } catch {
    base = EMPTY;
  }
  const { state, changed } = withSeed(base);
  if (changed) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // storage unavailable – seeded state is still returned for this session
    }
  }
  return state;
}

function write(s: PrepState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new Event(EVT));
  } catch {
    // storage unavailable
  }
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

function log(s: PrepState, by: string, ref: string, detail: string): PrepState {
  return { ...s, audit: [{ id: uid('pa'), at: new Date().toISOString(), by, ref, detail }, ...s.audit].slice(0, 400) };
}

/* ------------------------------------------------------------------ */
/* Derived prepared inventory (FEFO)                                   */
/* ------------------------------------------------------------------ */

export interface PreparedBatch {
  batchNo: string;
  prepId: string;
  prepName: string;
  hotel: HotelName;
  unit: StockUnit;
  recipeVersion: number;
  producedAt: string;
  expiryDate: string;
  qtyProduced: number;
  qtyConsumed: number;
  qtyWasted: number;
  qtyReserved: number;
  qtyTransferredOut: number;
  qtyAdjusted: number;
  qtyRemaining: number; // available (excludes reserved)
  unitCost: number;
  valuation: number;
  status: PrepBatchStatus;
  consumers: { orderId: string; menuItem: string; menuItemId?: string; quantity: number; at: string }[];
  source: ProductionBatch;
}

export interface PrepConsumptionInput {
  orderId: string;
  hotel: string;
  orderTime: string;
  status: string;
  isDuplicate: boolean;
  lines: { menuItem: string; menuItemId?: string; prepConsumption: { prepId: string; quantity: number }[] }[];
}

/**
 * Builds Prepared Inventory from approved production batches. Consumption from completed,
 * non-duplicate EPOS orders is allocated FEFO within the same hotel; expired / rejected batches
 * are never allocated.
 */
export function buildPreparedBatches(batches: ProductionBatch[], events: PrepEvent[], orders: PrepConsumptionInput[], today: string): PreparedBatch[] {
  const out: PreparedBatch[] = batches.map((b) => ({
    batchNo: b.batchNo,
    prepId: b.prepId,
    prepName: b.prepName,
    hotel: b.hotel,
    unit: b.unit,
    recipeVersion: b.recipeVersion,
    producedAt: b.producedAt,
    expiryDate: b.expiryDate,
    qtyProduced: b.approvalStatus === 'approved' ? b.actualYield : 0,
    qtyConsumed: 0,
    qtyWasted: 0,
    qtyReserved: 0,
    qtyTransferredOut: 0,
    qtyAdjusted: 0,
    qtyRemaining: 0,
    unitCost: b.unitCost,
    valuation: 0,
    status: b.approvalStatus === 'approved' ? 'active' : b.approvalStatus === 'rejected' ? 'rejected' : 'awaiting-approval',
    consumers: [],
    source: b,
  }));

  for (const e of events) {
    const b = out.find((x) => x.batchNo === e.batchNo && x.hotel === e.hotel);
    if (!b) continue;
    if (e.type === 'wastage' || e.type === 'expired' || e.type === 'spoiled' || e.type === 'rejected') b.qtyWasted += e.quantity;
    else if (e.type === 'adjustment') b.qtyAdjusted += e.quantity;
    else if (e.type === 'transfer-out') b.qtyTransferredOut += e.quantity;
    else if (e.type === 'reserve') b.qtyReserved += e.quantity;
    if (e.type === 'rejected') b.status = 'rejected';
    if (e.type === 'spoiled') b.status = 'quarantined';
  }

  const net = (b: PreparedBatch) => b.qtyProduced - b.qtyConsumed - b.qtyWasted - b.qtyTransferredOut + b.qtyAdjusted;
  const usable = (b: PreparedBatch) => b.status === 'active' && b.expiryDate >= today;

  const sorted = [...orders].filter((o) => o.status === 'completed' && !o.isDuplicate).sort((a, b) => a.orderTime.localeCompare(b.orderTime));
  for (const o of sorted) {
    for (const line of o.lines) {
      for (const pc of line.prepConsumption) {
        let need = pc.quantity;
        const pool = out
          .filter((b) => b.prepId === pc.prepId && b.hotel === o.hotel && usable(b))
          .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
        for (const b of pool) {
          if (need <= 0) break;
          const avail = net(b) - b.qtyReserved;
          if (avail <= 0) continue;
          const take = Math.min(avail, need);
          b.qtyConsumed += take;
          need -= take;
          b.consumers.push({ orderId: o.orderId, menuItem: line.menuItem, menuItemId: line.menuItemId, quantity: take, at: o.orderTime });
        }
      }
    }
  }

  for (const b of out) {
    b.qtyRemaining = Math.max(0, net(b) - b.qtyReserved);
    b.valuation = b.qtyRemaining * b.unitCost;
    if (b.status === 'active') {
      if (b.qtyProduced > 0 && net(b) <= 0) b.status = 'depleted';
      else if (b.expiryDate < today) b.status = 'expired';
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Raw material FEFO issue planning                                    */
/* ------------------------------------------------------------------ */

export interface IssuePlanLine {
  ingredientId: string;
  sku: string;
  name: string;
  isPrep: boolean;
  required: number; // in ingredient stock unit
  unit: string;
  allocations: { batchId: string; grnId: string; supplier: string; expiryDate: string; qty: number; unitCost: number }[];
  allocated: number;
  shortfall: number;
}

/**
 * Plans FEFO allocations for a production run. Raw ingredients draw from approved GRN batches
 * (earliest expiry first, non-expired); prepared ingredients draw from prepared batches.
 */
export function planIssue(
  v: PrepVersion,
  scale: number,
  hotel: HotelName,
  rawBatches: StockBatch[],
  preparedBatches: PreparedBatch[],
  nameOf: (sku: string) => { name: string; unit: StockUnit } | undefined,
  prepNameOf: (id: string) => { name: string; unit: StockUnit } | undefined,
  today: string
): IssuePlanLine[] {
  // Local working copy so multiple lines of the same sku don't over-allocate.
  const remainingRaw = new Map(rawBatches.map((b) => [b.batchId, b.qtyRemaining]));
  const remainingPrep = new Map(preparedBatches.map((b) => [b.batchNo, b.qtyRemaining]));
  return v.ingredients.map((ing) => {
    const meta = ing.isPrep ? prepNameOf(ing.sku) : nameOf(ing.sku);
    const stockUnit: StockUnit = meta?.unit ?? ing.unit;
    const qty = convertUnit(ing.quantity * scale, ing.unit, stockUnit) ?? ing.quantity * scale;
    const allocations: IssuePlanLine['allocations'] = [];
    let need = qty;
    if (ing.isPrep) {
      const pool = preparedBatches
        .filter((b) => b.prepId === ing.sku && b.hotel === hotel && b.status === 'active' && b.expiryDate >= today)
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
      for (const b of pool) {
        if (need <= 1e-9) break;
        const avail = remainingPrep.get(b.batchNo) ?? 0;
        if (avail <= 0) continue;
        const take = Math.min(avail, need);
        remainingPrep.set(b.batchNo, avail - take);
        need -= take;
        allocations.push({ batchId: b.batchNo, grnId: b.batchNo, supplier: 'Internal preparation', expiryDate: b.expiryDate, qty: take, unitCost: b.unitCost });
      }
    } else {
      const pool = rawBatches
        .filter((b) => b.sku === ing.sku && b.restaurant === hotel && b.status === 'active' && (!b.expiryDate || b.expiryDate >= today))
        .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
      for (const b of pool) {
        if (need <= 1e-9) break;
        const avail = remainingRaw.get(b.batchId) ?? 0;
        if (avail <= 0) continue;
        const take = Math.min(avail, need);
        remainingRaw.set(b.batchId, avail - take);
        need -= take;
        allocations.push({ batchId: b.batchId, grnId: b.grnId, supplier: b.supplier, expiryDate: b.expiryDate, qty: take, unitCost: b.unitCost });
      }
    }
    const allocated = allocations.reduce((s, a) => s + a.qty, 0);
    return {
      ingredientId: ing.id,
      sku: ing.sku,
      name: meta?.name ?? ing.sku,
      isPrep: !!ing.isPrep,
      required: qty,
      unit: stockUnit,
      allocations,
      allocated,
      shortfall: Math.max(0, qty - allocated),
    };
  });
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export function activePrepVersion(p: Preparation | undefined): PrepVersion | undefined {
  if (!p || p.versions.length === 0) return undefined;
  const approved = p.versions.filter((v) => v.status === 'approved').sort((a, b) => b.version - a.version)[0];
  return approved ?? [...p.versions].sort((a, b) => b.version - a.version)[0];
}

export function emptyPrepVersion(version: number, by: string): PrepVersion {
  return { version, ingredients: [], expectedYield: 1, prepLossPct: 0, instructions: '', status: 'draft', updatedAt: new Date().toISOString(), updatedBy: by };
}

export function nextPrepId(all: Preparation[], hotel: HotelName): string {
  const code = HOTEL_CODE[hotel];
  const max = all.filter((p) => p.hotel === hotel).reduce((m, p) => Math.max(m, parseInt(p.id.split('-').pop() ?? '0', 10) || 0), 0);
  return `PREP-${code}-${String(max + 1).padStart(4, '0')}`;
}

export function nextBatchNo(all: ProductionBatch[], hotel: HotelName): string {
  const code = HOTEL_CODE[hotel];
  const max = all.filter((b) => b.hotel === hotel).reduce((m, b) => Math.max(m, parseInt(b.batchNo.split('-').pop() ?? '0', 10) || 0), 0);
  return `PRB-${code}-${String(max + 1).padStart(4, '0')}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Cost of a recipe version at current raw/prepared unit costs (estimate before any batch exists). */
export function estimateVersionCost(
  v: PrepVersion | undefined,
  rawCost: (sku: string) => { unit: StockUnit; unitCost: number } | undefined,
  prepCost: (id: string) => { unit: StockUnit; unitCost: number } | undefined
): { total: number; unitCost: number; missing: boolean } {
  if (!v) return { total: 0, unitCost: 0, missing: false };
  let total = 0;
  let missing = false;
  for (const i of v.ingredients) {
    const m = i.isPrep ? prepCost(i.sku) : rawCost(i.sku);
    if (!m) {
      missing = true;
      continue;
    }
    const q = convertUnit(i.quantity, i.unit, m.unit);
    if (q === null) {
      missing = true;
      continue;
    }
    if (m.unitCost <= 0) missing = true;
    total += q * m.unitCost;
  }
  const usable = Math.max(v.expectedYield, 0) * (1 - Math.min(Math.max(v.prepLossPct, 0), 99) / 100);
  return { total, unitCost: usable > 0 ? total / usable : 0, missing };
}

/* ------------------------------------------------------------------ */
/* Hook                                                                */
/* ------------------------------------------------------------------ */

export function usePrepStore() {
  const [state, setState] = useState<PrepState>(EMPTY);
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

  const savePrep = useCallback((p: Preparation, by: string, detail: string) => {
    const cur = read();
    const exists = cur.preps.some((x) => x.id === p.id);
    const preps = exists ? cur.preps.map((x) => (x.id === p.id ? p : x)) : [p, ...cur.preps];
    write(log({ ...cur, preps }, by, p.id, detail));
  }, []);

  const addBatch = useCallback((b: ProductionBatch, by: string) => {
    const cur = read();
    if (cur.batches.some((x) => x.batchNo === b.batchNo)) return false; // idempotent
    write(log({ ...cur, batches: [b, ...cur.batches] }, by, b.batchNo, `Production recorded for ${b.prepName}: ${b.actualYield} ${b.unit} @ £${b.unitCost.toFixed(4)}/${b.unit} (${b.approvalStatus})`));
    return true;
  }, []);

  const decideBatch = useCallback((batchNo: string, decision: 'approved' | 'rejected', by: string) => {
    const cur = read();
    const hit = cur.batches.find((b) => b.batchNo === batchNo);
    if (!hit || hit.approvalStatus !== 'pending-approval') return false;
    const batches = cur.batches.map((b) => (b.batchNo === batchNo ? { ...b, approvalStatus: decision, approvedBy: by } : b));
    write(log({ ...cur, batches }, by, batchNo, `Production batch ${decision}`));
    return true;
  }, []);

  const recordEvent = useCallback((e: Omit<PrepEvent, 'id' | 'at'>) => {
    const cur = read();
    write(log({ ...cur, events: [{ ...e, id: uid('pe'), at: new Date().toISOString() }, ...cur.events].slice(0, 600) }, e.by, e.batchNo, `${e.type} ${e.quantity} – ${e.note || 'no note'}`));
  }, []);

  const prepOf = useCallback((id: string) => state.preps.find((p) => p.id === id), [state.preps]);

  return { state, hydrated, savePrep, addBatch, decideBatch, recordEvent, prepOf };
}

/** Latest approved-batch unit cost per prep per hotel; falls back to 0 when nothing produced yet. */
export function latestUnitCost(batches: ProductionBatch[], prepId: string): number {
  const list = batches.filter((b) => b.prepId === prepId && b.approvalStatus === 'approved').sort((a, b) => b.producedAt.localeCompare(a.producedAt));
  return list[0]?.unitCost ?? 0;
}

/** Builds a resolver usable by recipe costing and consumption engines. */
export function usePrepResolver() {
  const { state, hydrated } = usePrepStore();
  const { state: master } = useEposMaster();
  const resolver = useMemo(() => {
    const liveRaw = new Map(master.materials.map((m) => [m.sku, m]));
    return (id: string): PrepCostRef | undefined => {
      const p = state.preps.find((x) => x.id === id);
      if (!p) return undefined;
      const produced = latestUnitCost(state.batches, p.id);
      if (produced > 0) return { id: p.id, name: p.name, unit: p.unit, unitCost: produced };
      // No produced batch yet: approximate from the approved recipe at current ingredient costs.
      const est = estimateVersionCost(
        activePrepVersion(p),
        (sku) => {
          const m = liveRaw.get(sku) ?? SEED_RAW_BY_SKU.get(sku);
          return m ? { unit: m.unit, unitCost: m.unitCost } : undefined;
        },
        () => undefined
      );
      return { id: p.id, name: p.name, unit: p.unit, unitCost: est.unitCost };
    };
  }, [state.preps, state.batches, master.materials]);
  return { resolver, preps: state.preps, batches: state.batches, hydrated };
}
