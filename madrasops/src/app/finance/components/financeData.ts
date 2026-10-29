import { NEW_RESTAURANTS } from '@/contexts/AuthContext';

export const DEMO_LABEL = 'DEMO DATA — illustrative figures generated in the browser. Not connected to QuickBooks, EPOS or any live accounting source.';

export type RangeKey = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'custom';

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'thisWeek', label: 'This Week' },
  { key: 'lastWeek', label: 'Last Week' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'custom', label: 'Custom Range' },
];

/** Fixed "demo today" so server and client render identically. */
export const DEMO_TODAY = '2026-10-29';

export const ALL_LOCATIONS: string[] = [
  'Hounslow',
  'Reading',
  'Dartford',
  'Leicester',
  ...NEW_RESTAURANTS.map((r) => r.name as string),
];

const LOCATION_SCALE: Record<string, number> = {
  Hounslow: 1,
  Reading: 0.76,
  Dartford: 0.62,
  Leicester: 0.67,
  ...Object.fromEntries(NEW_RESTAURANTS.map((r) => [r.name, r.scale])),
};

const LOCATION_FOODCOST: Record<string, number> = {
  Hounslow: 25,
  Reading: 27.5,
  Dartford: 29,
  Leicester: 28,
  ...Object.fromEntries(NEW_RESTAURANTS.map((r) => [r.name, r.foodCostPct])),
};

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = parseIso(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toIso(d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86400000) + 1;
}

export function resolveRange(key: RangeKey, customFrom: string, customTo: string): { from: string; to: string } {
  const today = DEMO_TODAY;
  const dow = (parseIso(today).getUTCDay() + 6) % 7; // Monday = 0
  const weekStart = addDays(today, -dow);
  switch (key) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday':
      return { from: addDays(today, -1), to: addDays(today, -1) };
    case 'thisWeek':
      return { from: weekStart, to: today };
    case 'lastWeek':
      return { from: addDays(weekStart, -7), to: addDays(weekStart, -1) };
    case 'thisMonth':
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case 'lastMonth': {
      const first = parseIso(`${today.slice(0, 7)}-01`);
      const lastPrev = new Date(first.getTime() - 86400000);
      return { from: `${toIso(lastPrev).slice(0, 7)}-01`, to: toIso(lastPrev) };
    }
    default: {
      const f = customFrom <= customTo ? customFrom : customTo;
      const t = customFrom <= customTo ? customTo : customFrom;
      return { from: f, to: t };
    }
  }
}

export function previousRange(from: string, to: string): { from: string; to: string } {
  const len = daysBetween(from, to);
  return { from: addDays(from, -len), to: addDays(from, -1) };
}

/* ---------- deterministic pseudo-random helpers ---------- */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/* ---------- daily financials ---------- */
export interface DailyFinancial {
  date: string;
  grossSales: number;
  discounts: number;
  refunds: number;
  netSales: number;
  vat: number;
  orders: number;
  foodCost: number;
  payroll: number;
  utilities: number;
  otherOpex: number;
  wastage: number;
}

export function dailyFinancial(location: string, date: string): DailyFinancial {
  const scale = LOCATION_SCALE[location] ?? 0.7;
  const fcPct = (LOCATION_FOODCOST[location] ?? 28) / 100;
  const dow = parseIso(date).getUTCDay();
  const weekend = dow === 5 || dow === 6 || dow === 0 ? 1.28 : 1;
  const noise = 0.9 + hash(`${location}|${date}|s`) * 0.2;
  const grossSales = Math.round(1020 * scale * weekend * noise * 100) / 100;
  const discounts = Math.round(grossSales * (0.02 + hash(`${location}|${date}|d`) * 0.015) * 100) / 100;
  const refunds = Math.round(grossSales * (0.005 + hash(`${location}|${date}|r`) * 0.01) * 100) / 100;
  const netSalesIncVat = grossSales - discounts - refunds;
  const netSales = Math.round((netSalesIncVat / 1.2) * 100) / 100; // ex-VAT figure used for profit
  const vat = Math.round((netSalesIncVat - netSales) * 100) / 100;
  const orders = Math.round(68 * scale * weekend * noise);
  const foodCost = Math.round(netSales * fcPct * (0.97 + hash(`${location}|${date}|f`) * 0.06) * 100) / 100;
  const payroll = Math.round(305 * scale * (0.96 + hash(`${location}|${date}|p`) * 0.08) * 100) / 100;
  const utilities = Math.round(48 * scale * (0.9 + hash(`${location}|${date}|u`) * 0.2) * 100) / 100;
  const otherOpex = Math.round(92 * scale * (0.9 + hash(`${location}|${date}|o`) * 0.2) * 100) / 100;
  const wastage = Math.round(netSales * (0.012 + hash(`${location}|${date}|w`) * 0.016) * 100) / 100;
  return { date, grossSales, discounts, refunds, netSales, vat, orders, foodCost, payroll, utilities, otherOpex, wastage };
}

export interface PeriodSummary {
  grossSales: number;
  discounts: number;
  refunds: number;
  netSales: number;
  vat: number;
  orders: number;
  aov: number;
  foodCost: number;
  foodCostPct: number;
  grossProfit: number;
  grossMarginPct: number;
  payroll: number;
  utilities: number;
  otherOpex: number;
  wastage: number;
  wastagePct: number;
  totalOpex: number;
  operatingProfit: number;
  operatingMarginPct: number;
  days: number;
}

export function dateList(from: string, to: string): string[] {
  const out: string[] = [];
  const n = Math.min(daysBetween(from, to), 400);
  for (let i = 0; i < n; i++) out.push(addDays(from, i));
  return out;
}

export function safePct(n: number, d: number): number {
  return d > 0 ? (n / d) * 100 : 0;
}

export function summarise(locations: string[], from: string, to: string): { summary: PeriodSummary; daily: DailyFinancial[] } {
  const dates = dateList(from, to);
  const daily: DailyFinancial[] = dates.map((date) => {
    const rows = locations.map((l) => dailyFinancial(l, date));
    return rows.reduce<DailyFinancial>(
      (a, r) => ({
        date,
        grossSales: a.grossSales + r.grossSales,
        discounts: a.discounts + r.discounts,
        refunds: a.refunds + r.refunds,
        netSales: a.netSales + r.netSales,
        vat: a.vat + r.vat,
        orders: a.orders + r.orders,
        foodCost: a.foodCost + r.foodCost,
        payroll: a.payroll + r.payroll,
        utilities: a.utilities + r.utilities,
        otherOpex: a.otherOpex + r.otherOpex,
        wastage: a.wastage + r.wastage,
      }),
      { date, grossSales: 0, discounts: 0, refunds: 0, netSales: 0, vat: 0, orders: 0, foodCost: 0, payroll: 0, utilities: 0, otherOpex: 0, wastage: 0 }
    );
  });
  const t = daily.reduce(
    (a, r) => ({
      grossSales: a.grossSales + r.grossSales,
      discounts: a.discounts + r.discounts,
      refunds: a.refunds + r.refunds,
      netSales: a.netSales + r.netSales,
      vat: a.vat + r.vat,
      orders: a.orders + r.orders,
      foodCost: a.foodCost + r.foodCost,
      payroll: a.payroll + r.payroll,
      utilities: a.utilities + r.utilities,
      otherOpex: a.otherOpex + r.otherOpex,
      wastage: a.wastage + r.wastage,
    }),
    { grossSales: 0, discounts: 0, refunds: 0, netSales: 0, vat: 0, orders: 0, foodCost: 0, payroll: 0, utilities: 0, otherOpex: 0, wastage: 0 }
  );
  // Costing method: recipe-based consumption (EPOS x recipe). Wastage is NOT included in this food cost,
  // so it is deducted separately in operating profit.
  const grossProfit = t.netSales - t.foodCost;
  const totalOpex = t.payroll + t.utilities + t.otherOpex;
  const operatingProfit = grossProfit - totalOpex - t.wastage;
  const summary: PeriodSummary = {
    ...t,
    aov: t.orders > 0 ? t.netSales / t.orders : 0,
    foodCostPct: safePct(t.foodCost, t.netSales),
    grossProfit,
    grossMarginPct: safePct(grossProfit, t.netSales),
    wastagePct: safePct(t.wastage, t.netSales),
    totalOpex,
    operatingProfit,
    operatingMarginPct: safePct(operatingProfit, t.netSales),
    days: dates.length,
  };
  return { summary, daily };
}

/* ---------- expense transactions (QuickBooks-style) ---------- */
export type ExpenseCategory = 'Payroll' | 'Utilities' | 'Other Operating' | 'Unallocated';
export type SyncStatus = 'Synced' | 'Pending' | 'Error' | 'Voided';
export type DataOrigin = 'Imported (demo QuickBooks)' | 'Manual entry' | 'Estimated';

export interface ExpenseTxn {
  id: string;
  date: string;
  location: string;
  category: ExpenseCategory;
  subCategory: string;
  account: string;
  accountCode: string;
  payee: string;
  description: string;
  reference: string;
  amount: number;
  source: DataOrigin;
  sync: SyncStatus;
  qbClass: string;
}

export interface AccountMapping {
  id: string;
  accountCode: string;
  accountName: string;
  category: ExpenseCategory;
  subCategory: string;
}

export const DEFAULT_MAPPINGS: AccountMapping[] = [
  { id: 'm1', accountCode: '7000', accountName: 'Wages and Salaries', category: 'Payroll', subCategory: 'Wages & Salaries' },
  { id: 'm2', accountCode: '7006', accountName: 'Employer NI', category: 'Payroll', subCategory: 'Employer NI' },
  { id: 'm3', accountCode: '7007', accountName: 'Employer Pension', category: 'Payroll', subCategory: 'Employer Pension' },
  { id: 'm4', accountCode: '7200', accountName: 'Electricity', category: 'Utilities', subCategory: 'Electricity' },
  { id: 'm5', accountCode: '7201', accountName: 'Gas', category: 'Utilities', subCategory: 'Gas' },
  { id: 'm6', accountCode: '7202', accountName: 'Water Rates', category: 'Utilities', subCategory: 'Water' },
  { id: 'm7', accountCode: '7100', accountName: 'Rent', category: 'Other Operating', subCategory: 'Rent' },
  { id: 'm8', accountCode: '7300', accountName: 'Repairs and Maintenance', category: 'Other Operating', subCategory: 'Repairs' },
  { id: 'm9', accountCode: '7310', accountName: 'Cleaning', category: 'Other Operating', subCategory: 'Cleaning' },
  { id: 'm10', accountCode: '7400', accountName: 'Insurance', category: 'Other Operating', subCategory: 'Insurance' },
  { id: 'm11', accountCode: '7500', accountName: 'Marketing', category: 'Other Operating', subCategory: 'Marketing' },
  { id: 'm12', accountCode: '7600', accountName: 'Software Subscriptions', category: 'Other Operating', subCategory: 'Software' },
];

const PAYEES: Record<string, string[]> = {
  'Wages and Salaries': ['Payroll run (demo)'],
  'Employer NI': ['HMRC (demo)'],
  'Employer Pension': ['NEST Pension (demo)'],
  Electricity: ['British Gas Business (demo)', 'EDF Energy (demo)'],
  Gas: ['British Gas Business (demo)'],
  'Water Rates': ['Thames Water (demo)'],
  Rent: ['Landlord Properties Ltd (demo)'],
  'Repairs and Maintenance': ['KitchenFix Services (demo)'],
  Cleaning: ['SparkClean Ltd (demo)'],
  Insurance: ['Zurich Hospitality (demo)'],
  Marketing: ['Meta Ads (demo)', 'Local Flyers Co (demo)'],
  'Software Subscriptions': ['EPOS Cloud (demo)', 'Rota Software (demo)'],
};

/** Weekly/monthly style transactions generated per location across Sep–Oct 2026. */
export function buildExpenseTxns(mappings: AccountMapping[] = DEFAULT_MAPPINGS): ExpenseTxn[] {
  const out: ExpenseTxn[] = [];
  const start = '2026-09-01';
  const end = DEMO_TODAY;
  ALL_LOCATIONS.forEach((loc) => {
    const scale = LOCATION_SCALE[loc] ?? 0.7;
    dateList(start, end).forEach((date) => {
      const day = parseIso(date).getUTCDate();
      const dow = parseIso(date).getUTCDay();
      const push = (acctName: string, amount: number, desc: string, idx: number) => {
        const mp = mappings.find((m) => m.accountName === acctName);
        const payees = PAYEES[acctName] ?? ['Supplier (demo)'];
        let h = hash(`${loc}|${date}|${acctName}`);
        const voided = h > 0.985;
        const pending = h < 0.02;
        out.push({
          id: `QB-${loc.replace(/\s+/g, '').slice(0, 4).toUpperCase()}-${date.replace(/-/g, '')}-${idx}`,
          date,
          location: loc,
          category: mp ? mp.category : 'Unallocated',
          subCategory: mp ? mp.subCategory : 'Unmapped',
          account: acctName,
          accountCode: mp ? mp.accountCode : '—',
          payee: payees[Math.floor(h * payees.length) % payees.length],
          description: desc,
          reference: `REF-${Math.floor(hash(`${loc}${date}${acctName}r`) * 90000 + 10000)}`,
          amount: Math.round(amount * 100) / 100,
          source: 'Imported (demo QuickBooks)',
          sync: voided ? 'Voided' : pending ? 'Pending' : 'Synced',
          qbClass: loc,
        });
      };
      if (dow === 5) {
        push('Wages and Salaries', 1620 * scale * (0.95 + hash(`${loc}${date}ws`) * 0.1), 'Weekly payroll – wages', 1);
        push('Employer NI', 168 * scale, 'Employer NI contribution', 2);
        push('Employer Pension', 54 * scale, 'Auto-enrolment pension', 3);
      }
      if (day === 1) {
        push('Rent', 2300 * scale, 'Monthly rent', 4);
        push('Insurance', 190 * scale, 'Premises & liability insurance', 5);
        push('Software Subscriptions', 95 * scale, 'EPOS & rota subscriptions', 6);
      }
      if (day === 5) push('Electricity', 780 * scale * (0.9 + hash(`${loc}${date}e`) * 0.2), 'Electricity – monthly bill', 7);
      if (day === 8) push('Gas', 540 * scale * (0.9 + hash(`${loc}${date}g`) * 0.2), 'Gas – monthly bill', 8);
      if (day === 15) push('Water Rates', 120 * scale, 'Water & sewerage', 9);
      if (dow === 2) push('Cleaning', 105 * scale, 'Weekly deep clean', 10);
      if (day === 12 || day === 26) push('Marketing', 160 * scale * (0.8 + hash(`${loc}${date}m`) * 0.4), 'Social ads / flyers', 11);
      if (day === 20) push('Repairs and Maintenance', 210 * scale * (0.7 + hash(`${loc}${date}rm`) * 0.8), 'Equipment servicing', 12);
    });
    // Unmapped / unallocated demo items
    out.push({
      id: `QB-${loc.replace(/\s+/g, '').slice(0, 4).toUpperCase()}-UNALLOC`,
      date: '2026-10-17',
      location: 'Unallocated',
      category: 'Unallocated',
      subCategory: 'Unmapped',
      account: 'General Overheads',
      accountCode: '7999',
      payee: 'Head Office Allocation (demo)',
      description: `Company-wide cost with no class/location tag (${loc} candidate)`,
      reference: `REF-U-${loc.slice(0, 3).toUpperCase()}`,
      amount: Math.round(85 * (LOCATION_SCALE[loc] ?? 0.7) * 100) / 100,
      source: 'Imported (demo QuickBooks)',
      sync: 'Synced',
      qbClass: '(none)',
    });
  });
  return out;
}

export function fmtGBP(n: number, dp = 2): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n).toFixed(dp);
  const [i, d] = abs.split('.');
  return `${sign}£${i.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${d ? '.' + d : ''}`;
}

export function fmtDate(iso: string): string {
  if (!iso) return '—';
  const d = parseIso(iso.slice(0, 10));
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  return `${String(d.getUTCDate()).padStart(2, '0')} ${m} ${d.getUTCFullYear()}`;
}

export function pctChange(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------- Wastage detail (for reconciliation) ---------- */
export interface WasteRecord {
  id: string;
  date: string;
  location: string;
  ingredient: string;
  category: string;
  quantity: number;
  unit: string;
  baseQty: number; // normalised to kg/L/each
  baseUnit: string;
  costPerBaseUnit: number;
  batchId: string;
  batchCost: boolean;
  reason: string;
  cost: number;
  corrected: boolean;
  correctionNote?: string;
}

const WASTE_ITEMS: { name: string; category: string; unit: string; factor: number; baseUnit: string; costPerBase: number }[] = [
  { name: 'Dosa Batter', category: 'Batters', unit: 'kg', factor: 1, baseUnit: 'kg', costPerBase: 1.0 },
  { name: 'Idly Batter', category: 'Batters', unit: 'kg', factor: 1, baseUnit: 'kg', costPerBase: 0.95 },
  { name: 'Sambar', category: 'Gravies', unit: 'L', factor: 1, baseUnit: 'L', costPerBase: 5.0 },
  { name: 'Red Chutney', category: 'Chutneys', unit: 'g', factor: 0.001, baseUnit: 'kg', costPerBase: 10.0 },
  { name: 'Paneer', category: 'Dairy', unit: 'kg', factor: 1, baseUnit: 'kg', costPerBase: 8.5 },
  { name: 'Sunflower Oil', category: 'Dry Goods', unit: 'ml', factor: 0.001, baseUnit: 'L', costPerBase: 1.7 },
  { name: 'Coriander', category: 'Vegetables', unit: 'bunch', factor: 1, baseUnit: 'bunch', costPerBase: 0.8 },
  { name: 'Mixed Vegetables', category: 'Vegetables', unit: 'kg', factor: 1, baseUnit: 'kg', costPerBase: 2.5 },
  { name: 'Takeaway Containers', category: 'Packaging', unit: 'pack', factor: 1, baseUnit: 'pack', costPerBase: 6.5 },
];

const WASTE_REASONS = ['Expired Stock', 'Spoilage', 'Overproduction', 'Preparation Waste', 'Spillage', 'Burnt / Damaged', 'Staff Meals'];

export function buildWasteRecords(location: string, from: string, to: string): WasteRecord[] {
  const out: WasteRecord[] = [];
  dateList(from, to).forEach((date) => {
    const n = 1 + Math.floor(hash(`${location}|${date}|wn`) * 3);
    for (let i = 0; i < n; i++) {
      let h = hash(`${location}|${date}|wi${i}`);
      const item = WASTE_ITEMS[Math.floor(h * WASTE_ITEMS.length) % WASTE_ITEMS.length];
      const reason = WASTE_REASONS[Math.floor(hash(`${location}|${date}|wr${i}`) * WASTE_REASONS.length) % WASTE_REASONS.length];
      let quantity: number;
      if (item.unit === 'g') quantity = Math.round(150 + hash(`${location}${date}q${i}`) * 900);
      else if (item.unit === 'ml') quantity = Math.round(250 + hash(`${location}${date}q${i}`) * 1500);
      else if (item.unit === 'bunch' || item.unit === 'pack') quantity = Math.round(1 + hash(`${location}${date}q${i}`) * 4);
      else quantity = Math.round((0.3 + hash(`${location}${date}q${i}`) * 2.2) * 10) / 10;
      const spike = hash(`${location}|${date}|spike${i}`) > 0.97 ? 4 : 1;
      quantity = Math.round(quantity * spike * 10) / 10;
      const baseQty = quantity * item.factor;
      const batchCost = hash(`${location}|${date}|bc${i}`) > 0.4;
      const costPerBase = batchCost ? Math.round(item.costPerBase * (0.97 + hash(`${location}${date}bcp${i}`) * 0.08) * 100) / 100 : item.costPerBase;
      const corrected = hash(`${location}|${date}|cor${i}`) > 0.94;
      out.push({
        id: `WR-${location.replace(/\s+/g, '').slice(0, 3).toUpperCase()}-${date.replace(/-/g, '')}-${i + 1}`,
        date,
        location,
        ingredient: item.name,
        category: item.category,
        quantity,
        unit: item.unit,
        baseQty,
        baseUnit: item.baseUnit,
        costPerBaseUnit: costPerBase,
        batchId: `BT-${date.slice(2, 4)}${date.slice(5, 7)}-${String(Math.floor(h * 900 + 100))}`,
        batchCost,
        reason,
        cost: Math.round(baseQty * costPerBase * 100) / 100,
        corrected,
        correctionNote: corrected ? 'Quantity corrected from 2.0 to recorded value after stock check (demo audit entry).' : undefined,
      });
    }
  });
  return out;
}
