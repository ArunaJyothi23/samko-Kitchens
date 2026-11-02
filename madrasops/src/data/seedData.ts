import { MENU_ITEMS, RAW_MATERIALS, RawMaterial, Recipe, RecipeLine, RecipeVersion, StockUnit } from './eposMaster';
import type { Preparation, PrepIngredient, PrepVersion, ProductionBatch, PrepEvent, PrepAudit, IssuedLine } from './prepStore';

/* ------------------------------------------------------------------ */
/* Approximate ingredient costs (GBP per stock unit) – editable in UI  */
/* ------------------------------------------------------------------ */

export const APPROX_COSTS: Record<string, number> = {
  // Meat & Poultry (per kg)
  'RM-MP-001': 7.5, 'RM-MP-002': 5.2, 'RM-MP-003': 4.8, 'RM-MP-004': 24.0, 'RM-MP-005': 8.5,
  'RM-MP-006': 9.0, 'RM-MP-007': 7.0, 'RM-MP-008': 11.0, 'RM-MP-009': 12.5, 'RM-MP-010': 14.0, 'RM-MP-011': 16.0,
  // Fish & Seafood (per kg)
  'RM-FS-001': 15.0, 'RM-FS-002': 11.0, 'RM-FS-003': 22.0, 'RM-FS-004': 32.0, 'RM-FS-005': 18.0, 'RM-FS-006': 9.5,
  // Vegetables & Fresh Produce
  'RM-VG-001': 2.4, 'RM-VG-002': 1.3, 'RM-VG-003': 1.0, 'RM-VG-004': 6.5, 'RM-VG-005': 2.2, 'RM-VG-006': 3.2,
  'RM-VG-007': 12.0, 'RM-VG-008': 4.5, 'RM-VG-009': 6.0, 'RM-VG-010': 1.8, 'RM-VG-011': 1.1, 'RM-VG-012': 3.0,
  'RM-VG-013': 0.3, 'RM-VG-014': 14.0, 'RM-VG-015': 10.0, 'RM-VG-016': 16.0, 'RM-VG-017': 1.2,
  // Dairy & Eggs
  'RM-DE-001': 7.5, 'RM-DE-002': 8.5, 'RM-DE-003': 10.0, 'RM-DE-004': 18.0, 'RM-DE-005': 9.5, 'RM-DE-006': 8.0,
  'RM-DE-007': 7.5, 'RM-DE-008': 3.6, 'RM-DE-009': 1.1, 'RM-DE-010': 0.25, 'RM-DE-011': 3.5,
  // Bakery & Bread
  'RM-BB-001': 0.55, 'RM-BB-002': 0.15, 'RM-BB-003': 0.16, 'RM-BB-004': 0.3, 'RM-BB-005': 0.45, 'RM-BB-006': 0.6,
  'RM-BB-007': 2.8, 'RM-BB-008': 4.5,
  // Dry Goods & Groceries
  'RM-DG-001': 2.6, 'RM-DG-002': 1.4, 'RM-DG-003': 5.5, 'RM-DG-004': 3.2, 'RM-DG-005': 0.9, 'RM-DG-006': 1.8,
  'RM-DG-007': 1.6, 'RM-DG-008': 2.4, 'RM-DG-009': 0.4, 'RM-DG-010': 0.2, 'RM-DG-011': 2.0, 'RM-DG-012': 6.5,
  'RM-DG-013': 3.5, 'RM-DG-014': 1.1, 'RM-DG-015': 0.6, 'RM-DG-016': 14.0, 'RM-DG-017': 12.0, 'RM-DG-018': 11.0,
  'RM-DG-019': 3.5, 'RM-DG-020': 4.0, 'RM-DG-021': 2.2, 'RM-DG-022': 8.0, 'RM-DG-023': 4.5, 'RM-DG-024': 7.5,
  'RM-DG-025': 2.0, 'RM-DG-026': 1.5,
  // Dessert Ingredients
  'RM-DS-001': 9.0, 'RM-DS-002': 5.0, 'RM-DS-003': 6.0, 'RM-DS-004': 5.5, 'RM-DS-005': 5.5, 'RM-DS-006': 5.5,
  'RM-DS-007': 5.8, 'RM-DS-008': 0.12, 'RM-DS-009': 12.0, 'RM-DS-010': 9.0, 'RM-DS-011': 0.45, 'RM-DS-012': 6.0,
  // Beverages & Hot Drinks
  'RM-BV-001': 16.0, 'RM-BV-002': 0.08, 'RM-BV-003': 0.07, 'RM-BV-004': 0.08, 'RM-BV-005': 0.09, 'RM-BV-006': 0.09,
  'RM-BV-007': 0.09, 'RM-BV-008': 0.1, 'RM-BV-009': 0.1,
};

export function applyApproxCosts(materials: RawMaterial[]): RawMaterial[] {
  return materials.map((m) => (m.unitCost > 0 ? m : { ...m, unitCost: APPROX_COSTS[m.sku] ?? 0 }));
}

/* ------------------------------------------------------------------ */
/* Bulk preparations                                                   */
/* ------------------------------------------------------------------ */

const SEED_AT = '2026-10-01T09:00:00.000Z';
const SEED_BY = 'System seed';

interface PrepSeed {
  key: string;
  name: string;
  category: string;
  description: string;
  unit: StockUnit;
  shelfLifeDays: number;
  storage: string;
  allergens: string[];
  expectedYield: number;
  lossPct: number;
  instructions: string;
  /** [sku or key of another prep (prefixed "prep:"), qty, unit] */
  ingredients: [string, number, StockUnit][];
}

const PREP_SEEDS: PrepSeed[] = [
  { key: 'bbq-marinade', name: 'BBQ Marinade', category: 'Marinade', description: 'Smoked BBQ marinade for chicken wings', unit: 'kg', shelfLifeDays: 5, storage: 'Walk-in chiller 1', allergens: ['Soya', 'Mustard'], expectedYield: 10, lossPct: 3, instructions: 'Combine all ingredients, simmer 10 min, cool and chill below 5°C.', ingredients: [['RM-DG-020', 6, 'litre'], ['RM-DG-021', 2, 'litre'], ['RM-DG-014', 0.6, 'kg'], ['RM-DG-004', 0.2, 'kg'], ['RM-DG-016', 0.05, 'kg'], ['RM-DG-026', 0.4, 'litre']] },
  { key: 'chicken-batter', name: 'Chicken Flour Batter', category: 'Batter / Coating', description: 'Seasoned flour coating for fried chicken', unit: 'kg', shelfLifeDays: 3, storage: 'Dry store / chiller', allergens: ['Gluten', 'Eggs', 'Milk'], expectedYield: 10, lossPct: 2, instructions: 'Whisk flour, eggs and milk with seasoning until smooth.', ingredients: [['RM-DG-005', 6, 'kg'], ['RM-DE-010', 30, 'piece'], ['RM-DE-009', 2.5, 'litre'], ['RM-DG-015', 0.1, 'kg'], ['RM-DG-016', 0.05, 'kg']] },
  { key: 'caesar-dressing', name: 'Caesar Dressing', category: 'Dressing', description: 'Classic Caesar dressing', unit: 'kg', shelfLifeDays: 5, storage: 'Walk-in chiller 1', allergens: ['Eggs', 'Fish', 'Milk', 'Mustard'], expectedYield: 8, lossPct: 2, instructions: 'Blend anchovies, garlic, lemon and parmesan into mayonnaise.', ingredients: [['RM-DE-011', 5, 'kg'], ['RM-DE-004', 0.8, 'kg'], ['RM-FS-005', 0.2, 'kg'], ['RM-VG-004', 0.1, 'kg'], ['RM-VG-013', 8, 'piece'], ['RM-DG-024', 1, 'litre']] },
  { key: 'garlic-mayo', name: 'Garlic Mayonnaise', category: 'Dressing', description: 'Garlic mayonnaise for wraps and sides', unit: 'kg', shelfLifeDays: 5, storage: 'Walk-in chiller 1', allergens: ['Eggs', 'Mustard'], expectedYield: 10, lossPct: 1, instructions: 'Fold crushed garlic and lemon juice into mayonnaise.', ingredients: [['RM-DE-011', 9, 'kg'], ['RM-VG-004', 0.3, 'kg'], ['RM-VG-013', 6, 'piece'], ['RM-VG-015', 0.1, 'kg']] },
  { key: 'pizza-sauce', name: 'Pizza Tomato Sauce', category: 'Sauce', description: 'Slow-cooked tomato sauce for stone-baked pizzas', unit: 'kg', shelfLifeDays: 5, storage: 'Walk-in chiller 1', allergens: [], expectedYield: 15, lossPct: 5, instructions: 'Sweat onion and garlic, add tomatoes and basil, reduce 40 min, blend.', ingredients: [['RM-DG-021', 12, 'litre'], ['RM-VG-001', 3, 'kg'], ['RM-VG-003', 0.8, 'kg'], ['RM-VG-004', 0.2, 'kg'], ['RM-VG-016', 0.15, 'kg'], ['RM-DG-024', 0.4, 'litre'], ['RM-DG-014', 0.2, 'kg']] },
  { key: 'tikka-sauce', name: 'Tikka Masala Sauce', category: 'Sauce', description: 'Creamy tikka masala curry sauce', unit: 'kg', shelfLifeDays: 4, storage: 'Walk-in chiller 2', allergens: ['Milk', 'Nuts'], expectedYield: 10, lossPct: 5, instructions: 'Cook spices in oil, add tomato and onion, finish with cream.', ingredients: [['RM-DG-021', 4, 'litre'], ['RM-VG-003', 1.5, 'kg'], ['RM-VG-004', 0.2, 'kg'], ['RM-DE-008', 2, 'litre'], ['RM-DG-018', 0.1, 'kg'], ['RM-DG-017', 0.05, 'kg'], ['RM-DG-025', 0.5, 'litre'], ['RM-DE-007', 0.3, 'kg']] },
  { key: 'thai-sauce', name: 'Thai Curry Sauce', category: 'Sauce', description: 'Mild Thai green curry sauce', unit: 'kg', shelfLifeDays: 4, storage: 'Walk-in chiller 2', allergens: ['Soya', 'Celery'], expectedYield: 8, lossPct: 4, instructions: 'Fry curry paste, add coconut-style base and simmer.', ingredients: [['RM-DE-008', 3, 'litre'], ['RM-DG-019', 0.3, 'litre'], ['RM-VG-003', 0.8, 'kg'], ['RM-VG-004', 0.15, 'kg'], ['RM-DG-017', 0.05, 'kg'], ['RM-VG-014', 0.1, 'kg'], ['RM-DG-025', 0.3, 'litre']] },
  { key: 'sweet-sour', name: 'Sweet & Sour Sauce', category: 'Sauce', description: 'Sweet and sour sauce for chicken and vegetables', unit: 'kg', shelfLifeDays: 6, storage: 'Walk-in chiller 2', allergens: ['Soya'], expectedYield: 8, lossPct: 3, instructions: 'Simmer sugar, vinegar, tomato and soy; thicken.', ingredients: [['RM-DG-021', 3, 'litre'], ['RM-DG-014', 1.5, 'kg'], ['RM-DG-026', 1, 'litre'], ['RM-DG-019', 0.4, 'litre'], ['RM-VG-006', 0.8, 'kg'], ['RM-DG-005', 0.2, 'kg']] },
  { key: 'carbonara', name: 'Carbonara Sauce', category: 'Sauce', description: 'Cream and egg carbonara sauce', unit: 'kg', shelfLifeDays: 2, storage: 'Walk-in chiller 1', allergens: ['Eggs', 'Milk'], expectedYield: 6, lossPct: 2, instructions: 'Whisk eggs, cream and parmesan; hold chilled.', ingredients: [['RM-DE-008', 4, 'litre'], ['RM-DE-010', 24, 'piece'], ['RM-DE-004', 0.6, 'kg'], ['RM-DG-016', 0.03, 'kg']] },
  { key: 'tartare', name: 'Tartare Sauce', category: 'Sauce', description: 'Tartare sauce for fish dishes', unit: 'kg', shelfLifeDays: 5, storage: 'Walk-in chiller 1', allergens: ['Eggs', 'Mustard'], expectedYield: 5, lossPct: 1, instructions: 'Fold chopped capers and herbs into mayonnaise.', ingredients: [['RM-DE-011', 4, 'kg'], ['RM-DG-012', 0.4, 'kg'], ['RM-VG-015', 0.1, 'kg'], ['RM-VG-013', 4, 'piece']] },
  { key: 'tomato-soup', name: 'Tomato Basil Soup Base', category: 'Soup Base', description: 'Tomato and basil soup base', unit: 'litre', shelfLifeDays: 4, storage: 'Walk-in chiller 2', allergens: ['Milk', 'Celery'], expectedYield: 20, lossPct: 4, instructions: 'Roast tomatoes, sweat onion, blend with stock and basil.', ingredients: [['RM-VG-001', 12, 'kg'], ['RM-VG-003', 2, 'kg'], ['RM-VG-004', 0.2, 'kg'], ['RM-VG-016', 0.3, 'kg'], ['RM-DE-008', 1.5, 'litre'], ['RM-DG-024', 0.4, 'litre']] },
  { key: 'chicken-marinade', name: 'Chicken Marinade', category: 'Marinade', description: 'Spiced yoghurt-style marinade for tikka chicken', unit: 'kg', shelfLifeDays: 3, storage: 'Walk-in chiller 2', allergens: ['Milk'], expectedYield: 6, lossPct: 2, instructions: 'Mix spices, garlic and lemon with cream base.', ingredients: [['RM-DE-008', 3, 'litre'], ['RM-DG-018', 0.1, 'kg'], ['RM-DG-017', 0.05, 'kg'], ['RM-VG-004', 0.2, 'kg'], ['RM-VG-013', 6, 'piece'], ['RM-DG-025', 0.3, 'litre']] },
  { key: 'buttermilk-marinade', name: 'Buttermilk Marinade', category: 'Marinade', description: 'Buttermilk marinade for crispy chicken', unit: 'kg', shelfLifeDays: 3, storage: 'Walk-in chiller 1', allergens: ['Milk'], expectedYield: 8, lossPct: 2, instructions: 'Combine milk, vinegar and seasoning; rest 30 min.', ingredients: [['RM-DE-009', 7, 'litre'], ['RM-DG-026', 0.3, 'litre'], ['RM-DG-015', 0.08, 'kg'], ['RM-DG-016', 0.04, 'kg'], ['RM-VG-004', 0.1, 'kg']] },
  { key: 'salad-mix', name: 'Salad Vegetable Mix', category: 'Salad Prep', description: 'Washed and cut mixed salad vegetables', unit: 'kg', shelfLifeDays: 2, storage: 'Walk-in chiller 1', allergens: [], expectedYield: 6, lossPct: 10, instructions: 'Wash, cut and dry vegetables; store covered.', ingredients: [['RM-VG-008', 3, 'kg'], ['RM-VG-007', 0.5, 'kg'], ['RM-VG-010', 1, 'kg'], ['RM-VG-001', 1, 'kg'], ['RM-VG-002', 0.5, 'kg']] },
  { key: 'garlic-rice', name: 'Garlic Turmeric Rice', category: 'Rice / Grain Prep', description: 'Cooked garlic and turmeric rice', unit: 'kg', shelfLifeDays: 1, storage: 'Hot-hold / chiller', allergens: [], expectedYield: 15, lossPct: 3, instructions: 'Cook basmati with turmeric and garlic; chill quickly.', ingredients: [['RM-DG-001', 5, 'kg'], ['RM-DG-018', 0.05, 'kg'], ['RM-VG-004', 0.15, 'kg'], ['RM-DG-025', 0.3, 'litre'], ['RM-DG-015', 0.08, 'kg']] },
  { key: 'quinoa-prep', name: 'Quinoa Preparation', category: 'Rice / Grain Prep', description: 'Cooked quinoa with lemon and herbs', unit: 'kg', shelfLifeDays: 2, storage: 'Walk-in chiller 1', allergens: [], expectedYield: 8, lossPct: 3, instructions: 'Rinse and cook quinoa; dress with lemon, oil and parsley.', ingredients: [['RM-DG-003', 2.5, 'kg'], ['RM-VG-013', 4, 'piece'], ['RM-DG-024', 0.3, 'litre'], ['RM-VG-015', 0.1, 'kg'], ['RM-DG-015', 0.05, 'kg']] },
  { key: 'cheese-sauce', name: 'Cheese Sauce', category: 'Sauce', description: 'Béchamel-style cheese sauce for Croque Monsieur', unit: 'kg', shelfLifeDays: 3, storage: 'Walk-in chiller 1', allergens: ['Milk', 'Gluten'], expectedYield: 6, lossPct: 3, instructions: 'Make roux, add milk, melt in cheddar.', ingredients: [['RM-DE-009', 4, 'litre'], ['RM-DE-007', 0.4, 'kg'], ['RM-DG-005', 0.4, 'kg'], ['RM-DE-002', 1.2, 'kg'], ['RM-DG-016', 0.02, 'kg']] },
  { key: 'red-wine-jus', name: 'Red Wine Jus', category: 'Sauce', description: 'Reduced red wine jus for steak', unit: 'litre', shelfLifeDays: 5, storage: 'Walk-in chiller 2', allergens: ['Sulphites', 'Celery'], expectedYield: 5, lossPct: 8, instructions: 'Reduce wine and stock with shallot; mount with butter.', ingredients: [['RM-DG-022', 4, 'litre'], ['RM-VG-002', 0.4, 'kg'], ['RM-DE-007', 0.2, 'kg'], ['RM-DG-016', 0.01, 'kg']] },
  { key: 'tomato-ragu', name: 'Tomato & Pepper Ragu', category: 'Sauce', description: 'Slow-cooked tomato and pepper ragu', unit: 'kg', shelfLifeDays: 4, storage: 'Walk-in chiller 2', allergens: [], expectedYield: 8, lossPct: 5, instructions: 'Roast peppers, cook with tomato and onion until thick.', ingredients: [['RM-DG-021', 4, 'litre'], ['RM-VG-006', 2, 'kg'], ['RM-VG-003', 1, 'kg'], ['RM-VG-004', 0.15, 'kg'], ['RM-DG-024', 0.3, 'litre']] },
  { key: 'hummus', name: 'Hummus', category: 'Filling', description: 'House hummus for sandwiches', unit: 'kg', shelfLifeDays: 5, storage: 'Walk-in chiller 1', allergens: ['Sesame'], expectedYield: 6, lossPct: 2, instructions: 'Blend chickpeas with lemon, garlic and oil.', ingredients: [['RM-DG-013', 3.5, 'kg'], ['RM-VG-013', 6, 'piece'], ['RM-VG-004', 0.15, 'kg'], ['RM-DG-024', 0.6, 'litre'], ['RM-DG-015', 0.05, 'kg']] },
  { key: 'egg-mayo', name: 'Egg Mayonnaise Filling', category: 'Filling', description: 'Egg mayonnaise sandwich filling', unit: 'kg', shelfLifeDays: 2, storage: 'Walk-in chiller 1', allergens: ['Eggs', 'Mustard'], expectedYield: 6, lossPct: 1, instructions: 'Boil, cool and chop eggs; bind with mayonnaise.', ingredients: [['RM-DE-010', 60, 'piece'], ['RM-DE-011', 2, 'kg'], ['RM-DG-016', 0.02, 'kg'], ['RM-DG-015', 0.05, 'kg']] },
  { key: 'tuna-mayo', name: 'Tuna Mayonnaise Filling', category: 'Filling', description: 'Tuna mayonnaise sandwich filling', unit: 'kg', shelfLifeDays: 2, storage: 'Walk-in chiller 1', allergens: ['Fish', 'Eggs', 'Mustard'], expectedYield: 6, lossPct: 1, instructions: 'Flake tuna; bind with mayonnaise and red onion.', ingredients: [['RM-FS-006', 4, 'kg'], ['RM-DE-011', 1.8, 'kg'], ['RM-VG-002', 0.4, 'kg'], ['RM-DG-016', 0.02, 'kg']] },
  { key: 'raspberry-coulis', name: 'Raspberry Coulis', category: 'Dessert Prep', description: 'Raspberry coulis for desserts', unit: 'kg', shelfLifeDays: 6, storage: 'Walk-in chiller 2', allergens: [], expectedYield: 3, lossPct: 3, instructions: 'Warm coulis base with sugar; strain and cool.', ingredients: [['RM-DS-009', 2.6, 'kg'], ['RM-DG-014', 0.4, 'kg']] },
];

function mkPrepVersion(s: PrepSeed, idOf: (key: string) => string): PrepVersion {
  const ingredients: PrepIngredient[] = s.ingredients.map(([ref, quantity, unit], i) => {
    const isPrep = ref.startsWith('prep:');
    return { id: `pi-${s.key}-${i + 1}`, sku: isPrep ? idOf(ref.slice(5)) : ref, isPrep: isPrep || undefined, quantity, unit };
  });
  return { version: 1, ingredients, expectedYield: s.expectedYield, prepLossPct: s.lossPct, instructions: s.instructions, status: 'approved', updatedAt: SEED_AT, updatedBy: SEED_BY };
}

const HOTEL_SEEDS: { hotel: Preparation['hotel']; code: 'STH' | 'WRH' }[] = [
  { hotel: 'Stanhill Hotel Limited', code: 'STH' },
  { hotel: 'Warren House Hotel Limited', code: 'WRH' },
];

/** Prep ids are deterministic: PREP-<CODE>-<index>. Returns [prepId for key, hotel]. */
export function seedPrepId(code: 'STH' | 'WRH', key: string): string {
  const idx = PREP_SEEDS.findIndex((p) => p.key === key);
  return `PREP-${code}-${String(idx + 1).padStart(4, '0')}`;
}

export function buildSeedPreparations(): Preparation[] {
  const out: Preparation[] = [];
  for (const h of HOTEL_SEEDS) {
    for (const s of PREP_SEEDS) {
      out.push({
        id: seedPrepId(h.code, s.key),
        hotel: h.hotel,
        name: s.name,
        category: s.category,
        description: s.description,
        unit: s.unit,
        storageLocation: s.storage,
        shelfLifeDays: s.shelfLifeDays,
        allergens: s.allergens,
        active: true,
        versions: [mkPrepVersion(s, (k) => seedPrepId(h.code, k))],
        createdAt: SEED_AT,
        createdBy: SEED_BY,
      });
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Approximate prepared-unit cost (recipe estimate)                    */
/* ------------------------------------------------------------------ */

const TO_BASE: Record<StockUnit, number> = { g: 1, kg: 1000, ml: 1, litre: 1000, piece: 1, portion: 1 };
const FAMILY: Record<StockUnit, string> = { g: 'm', kg: 'm', ml: 'v', litre: 'v', piece: 'c', portion: 'c' };

function convert(qty: number, from: StockUnit, to: StockUnit): number {
  if (from === to) return qty;
  if (FAMILY[from] !== FAMILY[to]) return qty;
  return (qty * TO_BASE[from]) / TO_BASE[to];
}

/** Estimated cost per prepared unit from approximate raw costs (total cost / usable yield). */
export function estimatePrepUnitCost(key: string, rawUnit: (sku: string) => { unit: StockUnit; cost: number } | undefined): number {
  const s = PREP_SEEDS.find((p) => p.key === key);
  if (!s) return 0;
  let total = 0;
  for (const [ref, qty, unit] of s.ingredients) {
    if (ref.startsWith('prep:')) continue;
    const m = rawUnit(ref);
    if (!m) continue;
    total += convert(qty, unit, m.unit) * m.cost;
  }
  const usable = s.expectedYield * (1 - s.lossPct / 100);
  return usable > 0 ? total / usable : 0;
}

export const SEED_PREP_KEYS = PREP_SEEDS.map((p) => p.key);

/* ------------------------------------------------------------------ */
/* Menu recipes                                                        */
/* ------------------------------------------------------------------ */

type L = [string, number, StockUnit];
const R = (sku: string, qty: number, unit: StockUnit): L => [sku, qty, unit];
const P = (key: string, qty: number, unit: StockUnit): L => [`prep:${key}`, qty, unit];

/** menu item name -> recipe lines per single portion (servings = 1). */
const MENU_RECIPES: Record<string, L[]> = {
  'Spinach and Mozzarella Arancini': [R('RM-DG-004', 0.08, 'kg'), R('RM-VG-009', 0.04, 'kg'), R('RM-DE-001', 0.05, 'kg'), R('RM-DG-006', 0.04, 'kg'), R('RM-DG-025', 0.05, 'litre')],
  'Chicken Gyoza (5 Pieces)': [R('RM-MP-002', 0.1, 'kg'), R('RM-VG-011', 0.04, 'kg'), R('RM-DG-019', 0.02, 'litre'), R('RM-DG-005', 0.06, 'kg')],
  'Vegetable Gyoza (5 Pieces)': [R('RM-DG-011', 0.1, 'kg'), R('RM-VG-011', 0.04, 'kg'), R('RM-DG-019', 0.02, 'litre'), R('RM-DG-005', 0.06, 'kg')],
  'Smoked BBQ Chicken Wings': [R('RM-MP-003', 0.4, 'kg'), P('bbq-marinade', 0.08, 'kg'), P('chicken-batter', 0.06, 'kg'), R('RM-DG-025', 0.08, 'litre')],
  'Tomato Basil Soup': [P('tomato-soup', 0.35, 'litre'), R('RM-BB-002', 1, 'piece'), R('RM-DE-007', 0.01, 'kg')],
  'Crispy Fried Calamari': [R('RM-FS-002', 0.18, 'kg'), P('chicken-batter', 0.05, 'kg'), P('tartare', 0.04, 'kg'), R('RM-VG-013', 0.5, 'piece'), R('RM-DG-025', 0.08, 'litre')],
  'Beef Cheeseburger': [R('RM-MP-005', 0.2, 'kg'), R('RM-BB-001', 1, 'piece'), R('RM-DE-002', 0.03, 'kg'), R('RM-VG-008', 0.02, 'kg'), R('RM-VG-001', 0.04, 'kg'), R('RM-DE-011', 0.02, 'kg')],
  'Chicken Burger': [R('RM-MP-001', 0.18, 'kg'), P('chicken-batter', 0.06, 'kg'), R('RM-BB-001', 1, 'piece'), R('RM-VG-008', 0.02, 'kg'), P('garlic-mayo', 0.03, 'kg')],
  'Vegan Burger': [R('RM-DG-011', 0.15, 'kg'), R('RM-BB-001', 1, 'piece'), R('RM-VG-008', 0.02, 'kg'), R('RM-VG-001', 0.04, 'kg')],
  'Egg Mayonnaise & Roquette': [P('egg-mayo', 0.1, 'kg'), R('RM-VG-007', 0.015, 'kg'), R('RM-BB-002', 2, 'piece'), R('RM-DG-009', 1, 'piece')],
  'BLT': [R('RM-MP-006', 0.08, 'kg'), R('RM-VG-008', 0.03, 'kg'), R('RM-VG-001', 0.05, 'kg'), R('RM-DE-011', 0.02, 'kg'), R('RM-BB-002', 2, 'piece'), R('RM-DG-009', 1, 'piece')],
  'Tuna Mayonnaise & Red Onion': [P('tuna-mayo', 0.11, 'kg'), R('RM-VG-002', 0.01, 'kg'), R('RM-BB-002', 2, 'piece'), R('RM-DG-009', 1, 'piece')],
  'Wiltshire Ham & English Mustard': [R('RM-MP-008', 0.09, 'kg'), R('RM-VG-008', 0.02, 'kg'), R('RM-BB-002', 2, 'piece'), R('RM-DG-009', 1, 'piece')],
  'Vintage Cheddar, Plum & Apple Chutney': [R('RM-DE-002', 0.08, 'kg'), R('RM-DG-023', 0.03, 'kg'), R('RM-BB-003', 2, 'piece'), R('RM-DG-009', 1, 'piece')],
  'Roast Peppers & Hummus': [P('hummus', 0.07, 'kg'), P('tomato-ragu', 0.04, 'kg'), R('RM-VG-007', 0.015, 'kg'), R('RM-BB-004', 1, 'piece'), R('RM-DG-009', 1, 'piece')],
  'Club Sandwich': [R('RM-MP-001', 0.1, 'kg'), R('RM-MP-006', 0.06, 'kg'), R('RM-DE-010', 1, 'piece'), R('RM-VG-001', 0.05, 'kg'), R('RM-VG-008', 0.03, 'kg'), R('RM-BB-002', 3, 'piece'), R('RM-DG-009', 1, 'piece')],
  'Croque Monsieur': [P('cheese-sauce', 0.08, 'kg'), R('RM-MP-008', 0.08, 'kg'), R('RM-DE-002', 0.05, 'kg'), R('RM-BB-002', 2, 'piece')],
  'Buttermilk Chicken & Garlic Mayo Wrap': [R('RM-MP-001', 0.15, 'kg'), P('buttermilk-marinade', 0.05, 'kg'), P('chicken-batter', 0.05, 'kg'), P('garlic-mayo', 0.04, 'kg'), R('RM-BB-004', 1, 'piece'), R('RM-VG-008', 0.03, 'kg')],
  'Caesar Salad': [P('caesar-dressing', 0.05, 'kg'), P('salad-mix', 0.2, 'kg'), R('RM-BB-008', 0.03, 'kg'), R('RM-DE-004', 0.02, 'kg'), R('RM-MP-006', 0.03, 'kg')],
  'Healthy Flavour Bowl': [P('quinoa-prep', 0.15, 'kg'), P('salad-mix', 0.15, 'kg'), R('RM-DE-006', 0.04, 'kg'), R('RM-VG-017', 0.25, 'piece'), R('RM-DG-024', 0.015, 'litre')],
  'Rustic Classic Pizza (12")': [R('RM-BB-006', 1, 'piece'), P('pizza-sauce', 0.08, 'kg'), R('RM-DE-001', 0.12, 'kg'), R('RM-VG-016', 0.005, 'kg')],
  'The Garden Club Pizza (12")': [R('RM-BB-006', 1, 'piece'), P('pizza-sauce', 0.08, 'kg'), R('RM-DE-001', 0.12, 'kg'), R('RM-VG-006', 0.05, 'kg'), R('RM-VG-005', 0.05, 'kg'), R('RM-DG-012', 0.02, 'kg')],
  'Pepperoni Pizza (12")': [R('RM-BB-006', 1, 'piece'), P('pizza-sauce', 0.08, 'kg'), R('RM-DE-001', 0.12, 'kg'), R('RM-MP-009', 0.06, 'kg')],
  'Nice & Spicy Pizza (12")': [R('RM-BB-006', 1, 'piece'), P('pizza-sauce', 0.08, 'kg'), R('RM-DE-001', 0.12, 'kg'), R('RM-MP-011', 0.04, 'kg'), R('RM-MP-010', 0.04, 'kg'), R('RM-VG-006', 0.04, 'kg')],
  'Pan Fried British Aged Ribeye Steak (8 oz)': [R('RM-MP-004', 0.23, 'kg'), P('red-wine-jus', 0.06, 'litre'), R('RM-DE-007', 0.02, 'kg'), R('RM-VG-001', 0.05, 'kg')],
  'Pork Belly': [R('RM-MP-007', 0.25, 'kg'), R('RM-DG-022', 0.05, 'litre'), R('RM-DG-011', 0.12, 'kg'), R('RM-DE-007', 0.02, 'kg')],
  'Herb Butter Roasted Cod': [R('RM-FS-001', 0.2, 'kg'), R('RM-DE-007', 0.04, 'kg'), R('RM-VG-015', 0.005, 'kg'), R('RM-DG-011', 0.12, 'kg'), R('RM-VG-013', 0.5, 'piece')],
  'Stir-Fried Noodles with Vegetables': [R('RM-DG-008', 0.15, 'kg'), R('RM-DG-011', 0.15, 'kg'), R('RM-DG-019', 0.03, 'litre'), R('RM-DG-025', 0.03, 'litre')],
  'Veg Thai Curry with Rice': [P('thai-sauce', 0.25, 'kg'), R('RM-DG-011', 0.2, 'kg'), P('garlic-rice', 0.2, 'kg')],
  'Chicken Tikka Masala': [R('RM-MP-001', 0.18, 'kg'), P('chicken-marinade', 0.05, 'kg'), P('tikka-sauce', 0.25, 'kg'), R('RM-DG-001', 0.1, 'kg'), R('RM-BB-005', 1, 'piece'), R('RM-DG-010', 1, 'piece'), R('RM-DG-023', 0.02, 'kg')],
  'Sweet & Sour Chicken & Vegs with White Rice': [R('RM-MP-001', 0.18, 'kg'), P('sweet-sour', 0.2, 'kg'), R('RM-VG-006', 0.06, 'kg'), R('RM-DG-011', 0.08, 'kg'), R('RM-DG-002', 0.1, 'kg')],
  'Ale Battered Cod Fillet': [R('RM-FS-001', 0.22, 'kg'), P('chicken-batter', 0.1, 'kg'), P('tartare', 0.04, 'kg'), R('RM-DG-025', 0.1, 'litre'), R('RM-DG-012', 0.01, 'kg')],
  'Pasta Carbonara': [P('carbonara', 0.15, 'kg'), R('RM-DG-007', 0.12, 'kg'), R('RM-MP-006', 0.06, 'kg'), R('RM-DE-004', 0.02, 'kg')],
  'Ale Battered Onion Rings': [R('RM-VG-003', 0.15, 'kg'), P('chicken-batter', 0.08, 'kg'), R('RM-DG-025', 0.08, 'litre')],
  'Chunky Chips': [R('RM-DG-011', 0.25, 'kg'), R('RM-DG-025', 0.06, 'litre'), R('RM-DG-015', 0.002, 'kg')],
  'French Fries': [R('RM-DG-011', 0.2, 'kg'), R('RM-DG-025', 0.05, 'litre'), R('RM-DG-015', 0.002, 'kg')],
  'Mini Caesar Salad': [P('caesar-dressing', 0.025, 'kg'), P('salad-mix', 0.1, 'kg'), R('RM-BB-008', 0.015, 'kg'), R('RM-DE-004', 0.01, 'kg')],
  'Marinated Olives': [R('RM-DG-012', 0.06, 'kg'), R('RM-DG-024', 0.01, 'litre'), R('RM-VG-004', 0.002, 'kg')],
  'Bread with Olive Oil': [R('RM-BB-002', 3, 'piece'), R('RM-DG-024', 0.02, 'litre')],
  'Chocolate Brownie': [R('RM-DS-002', 0.1, 'kg'), R('RM-DS-001', 0.03, 'kg'), R('RM-DS-004', 0.06, 'litre')],
  'Gulab Jamun': [R('RM-DS-011', 3, 'piece'), R('RM-DS-012', 0.05, 'litre'), R('RM-DS-004', 0.06, 'litre')],
  'Vanilla Cheesecake': [R('RM-DS-003', 0.14, 'kg'), P('raspberry-coulis', 0.03, 'kg'), R('RM-DS-008', 2, 'ml')],
  'Citron Tart': [R('RM-DS-010', 0.03, 'kg'), R('RM-VG-013', 1, 'piece'), R('RM-DE-008', 0.04, 'litre'), R('RM-DE-007', 0.04, 'kg'), P('raspberry-coulis', 0.02, 'kg')],
  'Choice of Ice Cream': [R('RM-DS-004', 0.12, 'litre')],
  'Black Coffee': [R('RM-BV-001', 0.018, 'kg')],
  'Latte': [R('RM-BV-001', 0.018, 'kg'), R('RM-DE-009', 0.25, 'litre')],
  'Cappuccino': [R('RM-BV-001', 0.018, 'kg'), R('RM-DE-009', 0.15, 'litre')],
  'Espresso': [R('RM-BV-001', 0.009, 'kg')],
  'Double Espresso': [R('RM-BV-001', 0.018, 'kg')],
  'White Coffee': [R('RM-BV-001', 0.018, 'kg'), R('RM-DE-009', 0.05, 'litre')],
  'Mocha': [R('RM-BV-001', 0.018, 'kg'), R('RM-DE-009', 0.2, 'litre'), R('RM-DS-001', 0.015, 'kg')],
  'Earl Grey': [R('RM-BV-002', 1, 'piece'), R('RM-DE-009', 0.03, 'litre')],
  'English Breakfast': [R('RM-BV-003', 1, 'piece'), R('RM-DE-009', 0.03, 'litre')],
  'Cranberry & Raspberry': [R('RM-BV-008', 1, 'piece')],
  'Assam': [R('RM-BV-004', 1, 'piece'), R('RM-DE-009', 0.03, 'litre')],
  'Peppermint': [R('RM-BV-006', 1, 'piece')],
  'Green Tea': [R('RM-BV-005', 1, 'piece')],
  'Pure Camomile': [R('RM-BV-007', 1, 'piece')],
  'Zingy Lemon & Ginger': [R('RM-BV-009', 1, 'piece')],
};

/**
 * Modifier ("Add …") recipes, keyed by modifier id.
 * Modifiers carry their own additional ingredients only.
 */
const MODIFIER_RECIPES: Record<string, L[]> = {
  'caesar-chicken': [R('RM-MP-001', 0.1, 'kg')],
  'caesar-prawns': [R('RM-FS-003', 0.08, 'kg')],
  'caesar-salmon': [R('RM-FS-004', 0.06, 'kg')],
  'caesar-halloumi': [R('RM-DE-005', 0.08, 'kg')],
  'bowl-chicken': [R('RM-MP-001', 0.1, 'kg')],
  'bowl-halloumi': [R('RM-DE-005', 0.08, 'kg')],
  'pep-chicken': [R('RM-MP-001', 0.08, 'kg')],
  'spicy-chicken': [R('RM-MP-001', 0.08, 'kg')],
  'pasta-chicken': [R('RM-MP-001', 0.1, 'kg')],
  'ic-vanilla': [],
  'ic-chocolate': [],
  'ic-strawberry': [],
};

function mkRecipeVersion(lines: L[], idPrefix: string, prepIdOf: (key: string) => string): RecipeVersion {
  const recipeLines: RecipeLine[] = lines.map(([ref, quantity, unit], i) => {
    const isPrep = ref.startsWith('prep:');
    return isPrep
      ? { id: `${idPrefix}-${i + 1}`, sku: prepIdOf(ref.slice(5)), prepId: prepIdOf(ref.slice(5)), quantity, unit }
      : { id: `${idPrefix}-${i + 1}`, sku: ref, quantity, unit };
  });
  return { version: 1, lines: recipeLines, yieldPct: 100, wastagePct: 0, servings: 1, instructions: '', status: 'approved', updatedAt: SEED_AT, updatedBy: SEED_BY };
}

/**
 * Seeded menu recipes. The recipe master is shared by both hotels, and bulk-preparation lines
 * reference the Stanhill preparation ids (Warren House has an identical, separately-owned set).
 */
export function buildSeedRecipes(): Recipe[] {
  const prepIdOf = (key: string) => seedPrepId('STH', key);
  const out: Recipe[] = [];
  for (const item of MENU_ITEMS) {
    const lines = MENU_RECIPES[item.name];
    if (lines && lines.length > 0) {
      out.push({ targetId: item.id, kind: 'item', versions: [mkRecipeVersion(lines, `rl-${item.id}`, prepIdOf)] });
    }
  }
  for (const [mid, lines] of Object.entries(MODIFIER_RECIPES)) {
    if (lines.length === 0) continue;
    out.push({ targetId: mid, kind: 'modifier', versions: [mkRecipeVersion(lines, `rl-${mid}`, prepIdOf)] });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Seeded production batches, prepared-inventory events and audit      */
/* ------------------------------------------------------------------ */

/** Raw GRN batch references (from the seeded approved GRNs) used to give issued lines real traceability. */
const RAW_REFS: Record<'STH' | 'WRH', Record<string, { batchId: string; grnId: string; supplier: string }>> = {
  STH: {
    'RM-MP-001': { batchId: 'BAT-STH-0001', grnId: 'GRN-STH-0001', supplier: 'KTC Wholesale' },
    'RM-MP-004': { batchId: 'BAT-STH-0002', grnId: 'GRN-STH-0001', supplier: 'KTC Wholesale' },
    'RM-MP-006': { batchId: 'BAT-STH-0003', grnId: 'GRN-STH-0001', supplier: 'KTC Wholesale' },
    'RM-VG-008': { batchId: 'BAT-STH-0004', grnId: 'GRN-STH-0002', supplier: 'Fresh Fields Produce' },
    'RM-VG-001': { batchId: 'BAT-STH-0005', grnId: 'GRN-STH-0002', supplier: 'Fresh Fields Produce' },
    'RM-DE-002': { batchId: 'BAT-STH-0006', grnId: 'GRN-STH-0002', supplier: 'Fresh Fields Produce' },
  },
  WRH: {
    'RM-MP-009': { batchId: 'BAT-WRH-0001', grnId: 'GRN-WRH-0001', supplier: 'KTC Wholesale' },
    'RM-MP-001': { batchId: 'BAT-WRH-0002', grnId: 'GRN-WRH-0001', supplier: 'KTC Wholesale' },
    'RM-VG-001': { batchId: 'BAT-WRH-0004', grnId: 'GRN-WRH-0002', supplier: 'Fresh Fields Produce' },
    'RM-FS-001': { batchId: 'BAT-WRH-0005', grnId: 'GRN-WRH-0002', supplier: 'Fresh Fields Produce' },
  },
};

interface ProdSeed {
  key: string;
  code: 'STH' | 'WRH';
  daysAgo: number;
  scale: number; // multiple of the recipe's expected yield
  yieldPct: number; // actual usable yield as % of expected
  status: 'approved' | 'pending-approval';
  temp: string;
  by: string;
}

const PROD_SEEDS: ProdSeed[] = [
  { key: 'bbq-marinade', code: 'STH', daysAgo: 1, scale: 1, yieldPct: 96, status: 'approved', temp: '3°C', by: 'Stanhill Hotel User' },
  { key: 'chicken-batter', code: 'STH', daysAgo: 1, scale: 1, yieldPct: 97, status: 'approved', temp: '4°C', by: 'Stanhill Hotel User' },
  { key: 'caesar-dressing', code: 'STH', daysAgo: 2, scale: 1, yieldPct: 98, status: 'approved', temp: '3°C', by: 'Stanhill Hotel User' },
  { key: 'garlic-mayo', code: 'STH', daysAgo: 2, scale: 1, yieldPct: 99, status: 'approved', temp: '3°C', by: 'Stanhill Hotel User' },
  { key: 'pizza-sauce', code: 'STH', daysAgo: 1, scale: 1, yieldPct: 94, status: 'approved', temp: '4°C', by: 'Stanhill Hotel User' },
  { key: 'tikka-sauce', code: 'STH', daysAgo: 1, scale: 1, yieldPct: 95, status: 'approved', temp: '3°C', by: 'Stanhill Hotel User' },
  { key: 'salad-mix', code: 'STH', daysAgo: 0, scale: 1, yieldPct: 88, status: 'approved', temp: '4°C', by: 'Stanhill Hotel User' },
  { key: 'carbonara', code: 'STH', daysAgo: 0, scale: 1, yieldPct: 98, status: 'pending-approval', temp: '3°C', by: 'Stanhill Hotel User' },
  { key: 'pizza-sauce', code: 'WRH', daysAgo: 1, scale: 1, yieldPct: 95, status: 'approved', temp: '4°C', by: 'Warren House Hotel User' },
  { key: 'garlic-mayo', code: 'WRH', daysAgo: 2, scale: 1, yieldPct: 99, status: 'approved', temp: '3°C', by: 'Warren House Hotel User' },
  { key: 'tomato-soup', code: 'WRH', daysAgo: 1, scale: 1, yieldPct: 96, status: 'approved', temp: '3°C', by: 'Warren House Hotel User' },
  { key: 'hummus', code: 'WRH', daysAgo: 2, scale: 1, yieldPct: 98, status: 'approved', temp: '3°C', by: 'Warren House Hotel User' },
  { key: 'tuna-mayo', code: 'WRH', daysAgo: 0, scale: 1, yieldPct: 99, status: 'pending-approval', temp: '3°C', by: 'Warren House Hotel User' },
];

const RAW_NAME_BY_SKU = new Map(RAW_MATERIALS.map((m) => [m.sku, m.name]));

const HOTEL_BY_CODE: Record<'STH' | 'WRH', Preparation['hotel']> = { STH: 'Stanhill Hotel Limited', WRH: 'Warren House Hotel Limited' };

function isoDaysAgo(days: number, hour: number): string {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function seedBatchNo(code: 'STH' | 'WRH', n: number): string {
  return `PRB-${code}-${String(n).padStart(4, '0')}`;
}

/** Builds seeded production batches with deterministic batch numbers. Costs use approximate raw costs. */
export function buildSeedProduction(): ProductionBatch[] {
  const rawBySku = new Map(Object.entries(APPROX_COSTS));
  const counters: Record<'STH' | 'WRH', number> = { STH: 0, WRH: 0 };
  const out: ProductionBatch[] = [];
  for (const ps of PROD_SEEDS) {
    const seed = PREP_SEEDS.find((p) => p.key === ps.key);
    if (!seed) continue;
    counters[ps.code] += 1;
    const batchNo = seedBatchNo(ps.code, counters[ps.code]);
    const producedAt = isoDaysAgo(ps.daysAgo, 8 + counters[ps.code]);
    const issued: IssuedLine[] = [];
    for (const [ref, qty, unit] of seed.ingredients) {
      if (ref.startsWith('prep:')) continue;
      const base = rawBySku.get(ref) ?? 0;
      // Approximate costs are per stock unit; recipe units here are already stock-compatible (kg/litre/piece).
      const q = qty * ps.scale;
      const rr = RAW_REFS[ps.code][ref];
      issued.push({
        sku: ref,
        name: RAW_NAME_BY_SKU.get(ref) ?? ref,
        rawBatchId: rr?.batchId,
        grnId: rr?.grnId,
        supplier: rr?.supplier ?? 'Approved supplier',
        quantity: q,
        unit,
        unitCost: base,
        cost: q * base,
      });
    }
    const ingredientCost = issued.reduce((s, l) => s + l.cost, 0);
    const otherCost = Math.round(seed.expectedYield * ps.scale * 0.05 * 100) / 100; // approx. energy / labour
    const targetYield = seed.expectedYield * ps.scale;
    const actualYield = Math.round(targetYield * (ps.yieldPct / 100) * 100) / 100;
    const totalCost = ingredientCost + otherCost;
    const expiry = new Date(producedAt);
    expiry.setUTCDate(expiry.getUTCDate() + seed.shelfLifeDays);
    out.push({
      batchNo,
      prepId: seedPrepId(ps.code, ps.key),
      prepName: seed.name,
      recipeVersion: 1,
      hotel: HOTEL_BY_CODE[ps.code],
      unit: seed.unit,
      targetYield,
      actualYield,
      productionLoss: Math.max(0, targetYield - actualYield),
      issued,
      totalCost,
      otherCost,
      unitCost: actualYield > 0 ? totalCost / actualYield : 0,
      producedAt,
      expiryDate: expiry.toISOString().slice(0, 10),
      preparedBy: ps.by,
      approvedBy: ps.status === 'approved' ? 'Priya Sharma' : null,
      approvalStatus: ps.status,
      storageLocation: seed.storage,
      tempC: ps.temp,
      allergens: seed.allergens,
    });
  }
  return out;
}

/** Seeded wastage / adjustment events against seeded production batches. */
export function buildSeedPrepEvents(): PrepEvent[] {
  const b = buildSeedProduction();
  const find = (code: 'STH' | 'WRH', key: string) => b.find((x) => x.prepId === seedPrepId(code, key));
  const out: PrepEvent[] = [];
  const add = (id: string, batch: ProductionBatch | undefined, type: PrepEvent['type'], quantity: number, daysAgo: number, by: string, note: string) => {
    if (!batch) return;
    out.push({ id, batchNo: batch.batchNo, hotel: batch.hotel, type, quantity, at: isoDaysAgo(daysAgo, 15), by, note });
  };
  add('pe-seed-1', find('STH', 'salad-mix'), 'wastage', 0.3, 0, 'Stanhill Hotel User', 'Trim and wilted leaves discarded');
  add('pe-seed-2', find('STH', 'caesar-dressing'), 'spoiled', 0.4, 1, 'Stanhill Hotel User', 'Container left out of chiller – discarded');
  add('pe-seed-3', find('STH', 'pizza-sauce'), 'adjustment', -0.2, 1, 'Priya Sharma', 'Stock count correction after weigh-in');
  add('pe-seed-4', find('WRH', 'garlic-mayo'), 'wastage', 0.25, 1, 'Warren House Hotel User', 'Spillage during portioning');
  add('pe-seed-5', find('WRH', 'tomato-soup'), 'reserve', 2, 0, 'Warren House Hotel User', 'Reserved for tomorrow’s lunch service');
  return out;
}

/** Seeded audit trail entries mirroring the seeded preparations and production runs. */
export function buildSeedPrepAudit(): PrepAudit[] {
  const out: PrepAudit[] = [];
  const batches = buildSeedProduction();
  for (const b of batches) {
    out.push({
      id: `pa-seed-${b.batchNo}`,
      at: b.producedAt,
      by: b.preparedBy,
      ref: b.batchNo,
      detail: `Production recorded for ${b.prepName}: ${b.actualYield} ${b.unit} @ £${b.unitCost.toFixed(4)}/${b.unit} (${b.approvalStatus})`,
    });
    if (b.approvalStatus === 'approved' && b.approvedBy) {
      out.push({ id: `pa-seed-ok-${b.batchNo}`, at: new Date(new Date(b.producedAt).getTime() + 45 * 60000).toISOString(), by: b.approvedBy, ref: b.batchNo, detail: 'Production batch approved' });
    }
  }
  for (const e of buildSeedPrepEvents()) {
    out.push({ id: `pa-seed-${e.id}`, at: e.at, by: e.by, ref: e.batchNo, detail: `${e.type} ${e.quantity} – ${e.note || 'no note'}` });
  }
  out.push({ id: 'pa-seed-prep-sth', at: SEED_AT, by: SEED_BY, ref: 'PREP-STH', detail: 'Seeded 24 bulk preparations (v1 approved) for Stanhill Hotel Limited' });
  out.push({ id: 'pa-seed-prep-wrh', at: SEED_AT, by: SEED_BY, ref: 'PREP-WRH', detail: 'Seeded 24 bulk preparations (v1 approved) for Warren House Hotel Limited' });
  return out.sort((a, b) => b.at.localeCompare(a.at));
}
