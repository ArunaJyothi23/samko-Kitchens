import { NEW_RESTAURANTS } from '@/contexts/AuthContext';

export interface FEFOAllocation {
  id: string;
  batchId: string;
  expiryDate: string;
  quantityAllocated: number;
  unit: string;
  batchCost: number;
  totalCost: number;
}

export interface RecipeConsumptionLine {
  id: string;
  ingredientName: string;
  quantity: number;
  unit: string;
  fefoAllocations: FEFOAllocation[];
  totalIngredientCost: number;
}

export interface EPOSOrderLine {
  id: string;
  menuItem: string;
  /** Master menu item id (src/data/eposMaster.ts) */
  menuItemId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  /** Selected modifier / extra ids and display names */
  modifierIds?: string[];
  modifiers?: string[];
  recipeStatus: 'mapped' | 'unmapped' | 'draft';
  consumption: RecipeConsumptionLine[];
}

export interface EPOSOrder {
  id: string;
  orderId: string;
  restaurant: string;
  restaurantCode: string;
  orderTime: string;
  mealPeriod?: 'Lunch' | 'Dinner';
  status: 'completed' | 'processing' | 'failed' | 'cancelled';
  lines: EPOSOrderLine[];
  totalSelling: number;
  totalRecipeCost: number;
  foodCostPct: number;
  grossMargin: number;
  webhookEventId: string;
  isDuplicate: boolean;
  processingNote: string;
}

const UNMAPPED_NOTE = 'No approved recipe for this item yet. Stock is NOT deducted until an administrator approves the recipe in Recipe Costing.';

interface SeedLine {
  itemId: string;
  name: string;
  price: number;
  qty: number;
  modifierIds?: string[];
  modifiers?: string[];
  extra?: number;
}

function line(orderKey: string, idx: number, s: SeedLine): EPOSOrderLine {
  const unit = s.price + (s.extra ?? 0);
  return {
    id: `eol-${orderKey}-${idx + 1}`,
    menuItem: s.name,
    menuItemId: s.itemId,
    quantity: s.qty,
    unitPrice: unit,
    totalPrice: Number((unit * s.qty).toFixed(2)),
    modifierIds: s.modifierIds ?? [],
    modifiers: s.modifiers ?? [],
    recipeStatus: 'unmapped',
    consumption: [],
  };
}

function order(
  n: number,
  orderId: string,
  restaurant: string,
  code: string,
  time: string,
  period: 'Lunch' | 'Dinner',
  status: EPOSOrder['status'],
  seeds: SeedLine[],
  opts: { duplicate?: boolean; note?: string } = {}
): EPOSOrder {
  const key = String(n).padStart(3, '0');
  const lines = seeds.map((s, i) => line(key, i, s));
  const total = lines.reduce((s, l) => s + l.totalPrice, 0);
  return {
    id: `epos-${key}`,
    orderId,
    restaurant,
    restaurantCode: code,
    orderTime: time,
    mealPeriod: period,
    status,
    lines,
    totalSelling: Number(total.toFixed(2)),
    totalRecipeCost: 0,
    foodCostPct: 0,
    grossMargin: 0,
    webhookEventId: `wh_evt_${key}${code.toLowerCase()}`,
    isDuplicate: opts.duplicate ?? false,
    processingNote:
      opts.note ??
      (status === 'cancelled' ?'Order cancelled before preparation. Any stock deduction is reversed once; no net inventory impact.'
        : status === 'processing' ?'Awaiting recipe mapping and stock allocation…'
          : UNMAPPED_NOTE),
  };
}

export const eposOrders: EPOSOrder[] = [
  order(1, 'SK-STH-10482', 'Stanhill Hotel Limited', 'STH', '13:17:32', 'Lunch', 'completed', [
    { itemId: 'M-011', name: 'Chicken Burger', price: 18, qty: 2 },
    { itemId: 'M-040', name: 'Caesar Salad', price: 15, qty: 1, modifierIds: ['caesar-chicken'], modifiers: ['Add Chicken'], extra: 3 },
    { itemId: 'M-082', name: 'French Fries', price: 5, qty: 1 },
  ]),
  order(2, 'SK-STH-10481', 'Stanhill Hotel Limited', 'STH', '13:08:14', 'Lunch', 'completed', [
    { itemId: 'M-021', name: 'BLT', price: 9, qty: 2, modifierIds: ['s2-brown'], modifiers: ['Brown Bread'] },
    { itemId: 'M-101', name: 'Latte', price: 3.5, qty: 2 },
  ]),
  order(3, 'SK-WRH-8821', 'Warren House Hotel Limited', 'WRH', '19:02:47', 'Dinner', 'completed', [
    { itemId: 'M-052', name: 'Pepperoni Pizza (12")', price: 18, qty: 1, modifierIds: ['pep-chicken'], modifiers: ['Add Chicken'], extra: 3 },
    { itemId: 'M-070', name: 'Pasta Carbonara', price: 15, qty: 1 },
  ]),
  order(4, 'SK-WRH-6102', 'Warren House Hotel Limited', 'WRH', '19:54:18', 'Dinner', 'completed', [
    { itemId: 'M-060', name: 'Pan Fried British Aged Ribeye Steak (8 oz)', price: 29.95, qty: 1 },
    { itemId: 'M-081', name: 'Chunky Chips', price: 5, qty: 1 },
    { itemId: 'M-094', name: 'Choice of Ice Cream', price: 7.95, qty: 1, modifierIds: ['ic-vanilla'], modifiers: ['Vanilla'] },
  ]),
  order(5, 'SK-STH-4401', 'Stanhill Hotel Limited', 'STH', '18:41:09', 'Dinner', 'completed', [
    { itemId: 'M-065', name: 'Chicken Tikka Masala', price: 19.95, qty: 1 },
  ]),
  order(6, 'SK-STH-10479', 'Stanhill Hotel Limited', 'STH', '12:28:55', 'Lunch', 'failed', [
    { itemId: 'UNKNOWN', name: 'Chilli Paneer (not on EPOS menu)', price: 8.99, qty: 1 },
  ], { note: 'Item is not part of the current Lunch/Dinner EPOS menu. Stock not deducted. Item flagged for review.' }),
  order(7, 'SK-STH-10478', 'Stanhill Hotel Limited', 'STH', '12:14:22', 'Lunch', 'cancelled', [
    { itemId: 'M-010', name: 'Beef Cheeseburger', price: 18, qty: 1 },
  ]),
  order(8, 'SK-WRH-8819', 'Warren House Hotel Limited', 'WRH', '19:12:11', 'Dinner', 'completed', [
    { itemId: 'M-062', name: 'Herb Butter Roasted Cod', price: 22, qty: 1 },
    { itemId: 'M-092', name: 'Vanilla Cheesecake', price: 8.95, qty: 1 },
  ]),
  order(9, 'SK-STH-10477', 'Stanhill Hotel Limited', 'STH', '12:58:44', 'Lunch', 'processing', [
    { itemId: 'M-031', name: 'Croque Monsieur', price: 14, qty: 1 },
  ]),
  order(10, 'SK-WRH-6100', 'Warren House Hotel Limited', 'WRH', '18:44:02', 'Dinner', 'completed', [
    { itemId: 'M-012', name: 'Vegan Burger', price: 13.5, qty: 1 },
  ], { duplicate: true, note: 'Duplicate webhook event detected. Idempotency check passed — stock not deducted twice.' }),
  ...NEW_RESTAURANTS.flatMap((r, i): EPOSOrder[] => {
    const base = 20 + i * 2;
    return [
      order(base, `SK-${r.code}-${5200 + i * 11}`, r.fullName, r.code, `13:${String(10 + i * 3).padStart(2, '0')}:10`, 'Lunch', 'completed', [
        { itemId: 'M-041', name: 'Healthy Flavour Bowl', price: 15, qty: 1, modifierIds: ['bowl-halloumi'], modifiers: ['Add Halloumi'], extra: 4 },
      ]),
      order(base + 1, `SK-${r.code}-${5201 + i * 11}`, r.fullName, r.code, `19:${String(10 + i * 3).padStart(2, '0')}:11`, 'Dinner', 'completed', [
        { itemId: 'M-050', name: 'Rustic Classic Pizza (12")', price: 15, qty: 1 },
      ]),
    ];
  }),
];