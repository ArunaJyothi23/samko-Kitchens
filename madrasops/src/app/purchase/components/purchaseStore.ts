'use client';

import { useCallback, useEffect, useState } from 'react';

export type PurchaseSource = 'Central Kitchen' | 'KTC Wholesale' | 'Spice Route Foods' | 'Fresh Fields Produce' | 'Dairy Direct UK' | 'Local Cash & Carry';

export const SUPPLIERS: PurchaseSource[] = [
  'Central Kitchen',
  'KTC Wholesale',
  'Spice Route Foods',
  'Fresh Fields Produce',
  'Dairy Direct UK',
  'Local Cash & Carry',
];

export interface CatalogueItem {
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
}

export const CATEGORIES = ['Batters', 'Masalas', 'Chutneys', 'Gravies', 'Dairy', 'Vegetables', 'Grains', 'Dry Goods', 'Packaging'];

export const CATALOGUE: CatalogueItem[] = [
  { sku: 'MF-DB-001', name: 'Dosa Batter', category: 'Batters', unit: 'kg', unitCost: 1.0 },
  { sku: 'MF-IB-001', name: 'Idly Batter', category: 'Batters', unit: 'kg', unitCost: 0.95 },
  { sku: 'MF-VB-001', name: 'Vada Batter', category: 'Batters', unit: 'kg', unitCost: 1.1 },
  { sku: 'MF-PM-001', name: 'Potato Masala', category: 'Masalas', unit: 'kg', unitCost: 1.2 },
  { sku: 'MF-RC-001', name: 'Red Chutney', category: 'Chutneys', unit: 'kg', unitCost: 10.0 },
  { sku: 'MF-WC-001', name: 'White Chutney', category: 'Chutneys', unit: 'kg', unitCost: 10.0 },
  { sku: 'MF-SB-001', name: 'Sambar', category: 'Gravies', unit: 'L', unitCost: 5.0 },
  { sku: 'MF-CB-001', name: 'Curry Base', category: 'Gravies', unit: 'kg', unitCost: 3.2 },
  { sku: 'MF-PN-001', name: 'Paneer', category: 'Dairy', unit: 'kg', unitCost: 8.5 },
  { sku: 'MF-GH-001', name: 'Ghee', category: 'Dairy', unit: 'kg', unitCost: 12.0 },
  { sku: 'MF-MV-001', name: 'Mixed Vegetables', category: 'Vegetables', unit: 'kg', unitCost: 2.5 },
  { sku: 'MF-CO-001', name: 'Coriander', category: 'Vegetables', unit: 'bunch', unitCost: 0.8 },
  { sku: 'MF-ON-001', name: 'Onions', category: 'Vegetables', unit: 'kg', unitCost: 0.9 },
  { sku: 'MF-CR-001', name: 'Cooked Rice', category: 'Grains', unit: 'kg', unitCost: 1.8 },
  { sku: 'MF-BR-001', name: 'Basmati Rice', category: 'Grains', unit: 'kg', unitCost: 2.2 },
  { sku: 'MF-TD-001', name: 'Toor Dal', category: 'Dry Goods', unit: 'kg', unitCost: 2.9 },
  { sku: 'MF-SO-001', name: 'Sunflower Oil', category: 'Dry Goods', unit: 'L', unitCost: 1.7 },
  { sku: 'MF-PK-001', name: 'Takeaway Containers', category: 'Packaging', unit: 'pack', unitCost: 6.5 },
];

export interface OrderLine {
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  orderedQty: number;
  receivedQty: number;
  expiryDate: string; // ISO yyyy-mm-dd, filled on receipt
}

export type OrderStatus = 'pending' | 'received';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  restaurant: string;
  vendor: string;
  invoiceNo: string;
  invoiceDate: string;
  expectedDate: string;
  notes: string;
  status: OrderStatus;
  createdAt: string;
  createdBy: string;
  lines: OrderLine[];
  total: number;
  grnNumber?: string;
  receivedAt?: string;
  receivedBy?: string;
}

export interface QuickPurchase {
  id: string;
  invoiceNo: string;
  restaurant: string;
  createdAt: string;
  purchasedBy: string;
  payment: 'Cash' | 'Card';
  receiptName: string;
  lines: { sku: string; name: string; unit: string; unitCost: number; qty: number; expiryDate: string }[];
  total: number;
}

export interface StockReceipt {
  id: string;
  restaurant: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  unitCost: number;
  quantity: number;
  expiryDate: string;
  grnNumber: string;
  sourceType: 'Purchase Order' | 'Quick Purchase';
  sourceRef: string;
  receivedAt: string;
}

export interface PurchaseState {
  orders: PurchaseOrder[];
  quickPurchases: QuickPurchase[];
  receipts: StockReceipt[];
}

const STORAGE_KEY = 'madrasops-purchase-store-v1';
const EVENT_NAME = 'madrasops-purchase-store-changed';

const EMPTY: PurchaseState = { orders: [], quickPurchases: [], receipts: [] };

function readState(): PurchaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as PurchaseState;
    return {
      orders: parsed.orders ?? [],
      quickPurchases: parsed.quickPurchases ?? [],
      receipts: parsed.receipts ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function writeState(state: PurchaseState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch {
    // storage unavailable
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function dateCode(d: Date) {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

export function usePurchaseStore() {
  const [state, setState] = useState<PurchaseState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(readState());
    sync();
    setHydrated(true);
    window.addEventListener(EVENT_NAME, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT_NAME, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const createOrder = useCallback(
    (input: {
      restaurant: string;
      vendor: string;
      invoiceNo: string;
      invoiceDate: string;
      expectedDate: string;
      notes: string;
      createdBy: string;
      lines: { item: CatalogueItem; qty: number }[];
    }): PurchaseOrder => {
      const current = readState();
      const now = new Date();
      const lines: OrderLine[] = input.lines.map((l) => ({
        sku: l.item.sku,
        name: l.item.name,
        category: l.item.category,
        unit: l.item.unit,
        unitCost: l.item.unitCost,
        orderedQty: l.qty,
        receivedQty: l.qty,
        expiryDate: '',
      }));
      const order: PurchaseOrder = {
        id: uid('po'),
        poNumber: `PO-${dateCode(now)}-${String(current.orders.length + 1).padStart(4, '0')}`,
        restaurant: input.restaurant,
        vendor: input.vendor,
        invoiceNo: input.invoiceNo,
        invoiceDate: input.invoiceDate,
        expectedDate: input.expectedDate,
        notes: input.notes,
        status: 'pending',
        createdAt: now.toISOString(),
        createdBy: input.createdBy,
        lines,
        total: lines.reduce((s, l) => s + l.orderedQty * l.unitCost, 0),
      };
      writeState({ ...current, orders: [order, ...current.orders] });
      return order;
    },
    []
  );

  /** Marks the order received and posts every line to restaurant inventory. */
  const receiveOrder = useCallback(
    (
      orderId: string,
      input: {
        grnNumber: string;
        receivedBy: string;
        lines: { sku: string; receivedQty: number; expiryDate: string }[];
      }
    ) => {
      const current = readState();
      const order = current.orders.find((o) => o.id === orderId);
      if (!order || order.status === 'received') return;
      const nowIso = new Date().toISOString();
      const lines: OrderLine[] = order.lines.map((l) => {
        const m = input.lines.find((x) => x.sku === l.sku);
        return m ? { ...l, receivedQty: m.receivedQty, expiryDate: m.expiryDate } : l;
      });
      const updated: PurchaseOrder = {
        ...order,
        lines,
        status: 'received',
        grnNumber: input.grnNumber,
        receivedAt: nowIso,
        receivedBy: input.receivedBy,
        total: lines.reduce((s, l) => s + l.receivedQty * l.unitCost, 0),
      };
      const newReceipts: StockReceipt[] = lines
        .filter((l) => l.receivedQty > 0)
        .map((l) => ({
          id: uid('rc'),
          restaurant: order.restaurant,
          sku: l.sku,
          name: l.name,
          category: l.category,
          unit: l.unit,
          unitCost: l.unitCost,
          quantity: l.receivedQty,
          expiryDate: l.expiryDate,
          grnNumber: input.grnNumber,
          sourceType: 'Purchase Order',
          sourceRef: order.poNumber,
          receivedAt: nowIso,
        }));
      writeState({
        ...current,
        orders: current.orders.map((o) => (o.id === orderId ? updated : o)),
        receipts: [...newReceipts, ...current.receipts],
      });
    },
    []
  );

  const createQuickPurchase = useCallback(
    (input: {
      restaurant: string;
      purchasedBy: string;
      payment: 'Cash' | 'Card';
      receiptName: string;
      lines: { item: CatalogueItem; qty: number; expiryDate: string }[];
    }): QuickPurchase => {
      const current = readState();
      const now = new Date();
      const year = now.getFullYear();
      const invoiceNo = `PC-${year}-${String(current.quickPurchases.length + 1).padStart(4, '0')}`;
      const lines = input.lines.map((l) => ({
        sku: l.item.sku,
        name: l.item.name,
        unit: l.item.unit,
        unitCost: l.item.unitCost,
        qty: l.qty,
        expiryDate: l.expiryDate,
      }));
      const qp: QuickPurchase = {
        id: uid('qp'),
        invoiceNo,
        restaurant: input.restaurant,
        createdAt: now.toISOString(),
        purchasedBy: input.purchasedBy,
        payment: input.payment,
        receiptName: input.receiptName,
        lines,
        total: lines.reduce((s, l) => s + l.qty * l.unitCost, 0),
      };
      const nowIso = now.toISOString();
      const newReceipts: StockReceipt[] = input.lines.map((l) => ({
        id: uid('rc'),
        restaurant: input.restaurant,
        sku: l.item.sku,
        name: l.item.name,
        category: l.item.category,
        unit: l.item.unit,
        unitCost: l.item.unitCost,
        quantity: l.qty,
        expiryDate: l.expiryDate,
        grnNumber: invoiceNo,
        sourceType: 'Quick Purchase',
        sourceRef: invoiceNo,
        receivedAt: nowIso,
      }));
      writeState({
        ...current,
        quickPurchases: [qp, ...current.quickPurchases],
        receipts: [...newReceipts, ...current.receipts],
      });
      return qp;
    },
    []
  );

  return { ...state, hydrated, createOrder, receiveOrder, createQuickPurchase };
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

export function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
