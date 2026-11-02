export type MealPeriod = 'Lunch' | 'Dinner';

export interface MenuModifier {
  id: string;
  name: string;
  group: string;
  priceDelta: number;
  periods?: MealPeriod[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  periods: MealPeriod[];
  modifiers: MenuModifier[];
  note?: string;
}

const mod = (id: string, name: string, group: string, priceDelta: number, periods?: MealPeriod[]): MenuModifier => ({ id, name, group, priceDelta, periods });

const BREAD = (p: string): MenuModifier[] => [
  mod(`${p}-white`, 'White Bread', 'Bread', 0),
  mod(`${p}-brown`, 'Brown Bread', 'Bread', 0),
  mod(`${p}-wrap`, 'Wrap', 'Bread', 0),
];

const CAESAR_EXTRAS: MenuModifier[] = [
  mod('caesar-chicken', 'Add Chicken', 'Extras', 3),
  mod('caesar-prawns', 'Add Tiger Prawns', 'Extras', 6),
  mod('caesar-salmon', 'Add Smoked Salmon', 'Extras', 5),
  mod('caesar-halloumi', 'Add Halloumi', 'Extras', 4),
];

const BOWL_EXTRAS: MenuModifier[] = [
  mod('bowl-chicken', 'Add Chicken', 'Extras', 3),
  mod('bowl-halloumi', 'Add Halloumi', 'Extras', 4),
];

const ICE_CREAM: MenuModifier[] = [
  mod('ic-vanilla', 'Vanilla', 'Flavour', 0),
  mod('ic-chocolate', 'Chocolate', 'Flavour', 0),
  mod('ic-strawberry', 'Strawberry', 'Flavour', 0),
  mod('ic-butterscotch', 'Butterscotch', 'Flavour', 0, ['Lunch']),
];

const both: MealPeriod[] = ['Lunch', 'Dinner'];
const L: MealPeriod[] = ['Lunch'];
const D: MealPeriod[] = ['Dinner'];

// Single master list: shared dishes carry both periods (no duplicates).
export const MENU_ITEMS: MenuItem[] = [
  // Lite Bites (Lunch) / Small Plates (Dinner)
  { id: 'M-001', name: 'Spinach and Mozzarella Arancini', category: 'Lite Bites / Small Plates', price: 7.95, periods: both, modifiers: [] },
  { id: 'M-002', name: 'Chicken Gyoza (5 Pieces)', category: 'Lite Bites / Small Plates', price: 8.95, periods: both, modifiers: [] },
  { id: 'M-003', name: 'Vegetable Gyoza (5 Pieces)', category: 'Lite Bites / Small Plates', price: 7.95, periods: both, modifiers: [] },
  { id: 'M-004', name: 'Smoked BBQ Chicken Wings', category: 'Lite Bites / Small Plates', price: 9.95, periods: both, modifiers: [] },
  { id: 'M-005', name: 'Tomato Basil Soup', category: 'Lite Bites / Small Plates', price: 6.95, periods: both, modifiers: [] },
  { id: 'M-006', name: 'Crispy Fried Calamari', category: 'Lite Bites / Small Plates', price: 10.0, periods: both, modifiers: [] },
  // Burgers
  { id: 'M-010', name: 'Beef Cheeseburger', category: 'Burgers', price: 18.0, periods: both, modifiers: [] },
  { id: 'M-011', name: 'Chicken Burger', category: 'Burgers', price: 18.0, periods: both, modifiers: [] },
  { id: 'M-012', name: 'Vegan Burger', category: 'Burgers', price: 13.5, periods: both, modifiers: [] },
  // Sandwiches (Lunch)
  { id: 'M-020', name: 'Egg Mayonnaise & Roquette', category: 'Sandwiches', price: 9.0, periods: L, modifiers: BREAD('s1'), note: 'Crisps included' },
  { id: 'M-021', name: 'BLT', category: 'Sandwiches', price: 9.0, periods: L, modifiers: BREAD('s2'), note: 'Crisps included' },
  { id: 'M-022', name: 'Tuna Mayonnaise & Red Onion', category: 'Sandwiches', price: 9.0, periods: L, modifiers: BREAD('s3'), note: 'Crisps included' },
  { id: 'M-023', name: 'Wiltshire Ham & English Mustard', category: 'Sandwiches', price: 9.0, periods: L, modifiers: BREAD('s4'), note: 'Crisps included' },
  { id: 'M-024', name: 'Vintage Cheddar, Plum & Apple Chutney', category: 'Sandwiches', price: 9.0, periods: L, modifiers: BREAD('s5'), note: 'Crisps included' },
  { id: 'M-025', name: 'Roast Peppers & Hummus', category: 'Sandwiches', price: 9.0, periods: L, modifiers: BREAD('s6'), note: 'Crisps included' },
  // Gourmet Deli (Lunch)
  { id: 'M-030', name: 'Club Sandwich', category: 'Gourmet Deli', price: 15.0, periods: L, modifiers: [] },
  { id: 'M-031', name: 'Croque Monsieur', category: 'Gourmet Deli', price: 14.0, periods: L, modifiers: [] },
  { id: 'M-032', name: 'Buttermilk Chicken & Garlic Mayo Wrap', category: 'Gourmet Deli', price: 14.0, periods: L, modifiers: [] },
  // Salads & Bowls
  { id: 'M-040', name: 'Caesar Salad', category: 'Salads & Healthy Bowls', price: 15.0, periods: both, modifiers: CAESAR_EXTRAS },
  { id: 'M-041', name: 'Healthy Flavour Bowl', category: 'Salads & Healthy Bowls', price: 15.0, periods: both, modifiers: BOWL_EXTRAS },
  // Pizzas (Dinner)
  { id: 'M-050', name: 'Rustic Classic Pizza (12")', category: 'Stone-Baked Pizzas', price: 15.0, periods: D, modifiers: [] },
  { id: 'M-051', name: 'The Garden Club Pizza (12")', category: 'Stone-Baked Pizzas', price: 16.0, periods: D, modifiers: [] },
  { id: 'M-052', name: 'Pepperoni Pizza (12")', category: 'Stone-Baked Pizzas', price: 18.0, periods: D, modifiers: [mod('pep-chicken', 'Add Chicken', 'Extras', 3)] },
  { id: 'M-053', name: 'Nice & Spicy Pizza (12")', category: 'Stone-Baked Pizzas', price: 18.0, periods: D, modifiers: [mod('spicy-chicken', 'Add Chicken', 'Extras', 3)] },
  // Mains (Dinner)
  { id: 'M-060', name: 'Pan Fried British Aged Ribeye Steak (8 oz)', category: 'Mains', price: 29.95, periods: D, modifiers: [] },
  { id: 'M-061', name: 'Pork Belly', category: 'Mains', price: 22.0, periods: D, modifiers: [] },
  { id: 'M-062', name: 'Herb Butter Roasted Cod', category: 'Mains', price: 22.0, periods: D, modifiers: [] },
  { id: 'M-063', name: 'Stir-Fried Noodles with Vegetables', category: 'Mains', price: 12.0, periods: D, modifiers: [] },
  { id: 'M-064', name: 'Veg Thai Curry with Rice', category: 'Mains', price: 16.95, periods: D, modifiers: [] },
  { id: 'M-065', name: 'Chicken Tikka Masala', category: 'Mains', price: 19.95, periods: D, modifiers: [] },
  { id: 'M-066', name: 'Sweet & Sour Chicken & Vegs with White Rice', category: 'Mains', price: 18.0, periods: D, modifiers: [] },
  { id: 'M-067', name: 'Ale Battered Cod Fillet', category: 'Mains', price: 19.0, periods: D, modifiers: [] },
  // Pasta (Dinner)
  { id: 'M-070', name: 'Pasta Carbonara', category: 'Pasta', price: 15.0, periods: D, modifiers: [mod('pasta-chicken', 'Add Chicken', 'Extras', 3)] },
  // Sides
  { id: 'M-080', name: 'Ale Battered Onion Rings', category: 'Sides', price: 5.0, periods: both, modifiers: [] },
  { id: 'M-081', name: 'Chunky Chips', category: 'Sides', price: 5.0, periods: both, modifiers: [] },
  { id: 'M-082', name: 'French Fries', category: 'Sides', price: 5.0, periods: both, modifiers: [] },
  { id: 'M-083', name: 'Mini Caesar Salad', category: 'Sides', price: 5.0, periods: both, modifiers: [] },
  { id: 'M-084', name: 'Marinated Olives', category: 'Sides', price: 3.5, periods: both, modifiers: [] },
  { id: 'M-085', name: 'Bread with Olive Oil', category: 'Sides', price: 3.5, periods: both, modifiers: [] },
  // Desserts
  { id: 'M-090', name: 'Chocolate Brownie', category: 'Desserts', price: 8.95, periods: both, modifiers: [] },
  { id: 'M-091', name: 'Gulab Jamun', category: 'Desserts', price: 8.95, periods: L, modifiers: [] },
  { id: 'M-092', name: 'Vanilla Cheesecake', category: 'Desserts', price: 8.95, periods: both, modifiers: [] },
  { id: 'M-093', name: 'Citron Tart', category: 'Desserts', price: 8.95, periods: D, modifiers: [] },
  { id: 'M-094', name: 'Choice of Ice Cream', category: 'Desserts', price: 7.95, periods: both, modifiers: ICE_CREAM, note: 'Butterscotch at lunch only' },
  // Hot drinks – coffee
  { id: 'M-100', name: 'Black Coffee', category: 'Hot Drinks – Coffee', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-101', name: 'Latte', category: 'Hot Drinks – Coffee', price: 3.5, periods: L, modifiers: [] },
  { id: 'M-102', name: 'Cappuccino', category: 'Hot Drinks – Coffee', price: 3.5, periods: L, modifiers: [] },
  { id: 'M-103', name: 'Espresso', category: 'Hot Drinks – Coffee', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-104', name: 'Double Espresso', category: 'Hot Drinks – Coffee', price: 3.5, periods: L, modifiers: [] },
  { id: 'M-105', name: 'White Coffee', category: 'Hot Drinks – Coffee', price: 3.5, periods: L, modifiers: [] },
  { id: 'M-106', name: 'Mocha', category: 'Hot Drinks – Coffee', price: 3.5, periods: L, modifiers: [] },
  // Hot drinks – tea
  { id: 'M-110', name: 'Earl Grey', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-111', name: 'English Breakfast', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-112', name: 'Cranberry & Raspberry', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-113', name: 'Assam', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-114', name: 'Peppermint', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-115', name: 'Green Tea', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-116', name: 'Pure Camomile', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
  { id: 'M-117', name: 'Zingy Lemon & Ginger', category: 'Hot Drinks – Tea', price: 2.95, periods: L, modifiers: [] },
];

export const MENU_CATEGORIES: string[] = Array.from(new Set(MENU_ITEMS.map((m) => m.category)));

export type StockUnit = 'g' | 'kg' | 'ml' | 'litre' | 'piece' | 'portion';

export interface RawMaterial {
  sku: string;
  name: string;
  category: string;
  unit: StockUnit; // purchasing / stock unit
  unitCost: number; // admin-entered purchase cost per stock unit (0 = not yet entered)
}

export const RAW_CATEGORIES = [
  'Meat & Poultry',
  'Fish & Seafood',
  'Vegetables & Fresh Produce',
  'Dairy & Eggs',
  'Bakery & Bread',
  'Dry Goods & Groceries',
  'Dessert Ingredients',
  'Beverages & Hot Drinks',
];

const rm = (sku: string, name: string, category: string, unit: StockUnit): RawMaterial => ({ sku, name, category, unit, unitCost: 0 });

export const RAW_MATERIALS: RawMaterial[] = [
  // Meat & Poultry
  rm('RM-MP-001', 'Chicken breast', 'Meat & Poultry', 'kg'),
  rm('RM-MP-002', 'Chicken thigh', 'Meat & Poultry', 'kg'),
  rm('RM-MP-003', 'Chicken wings', 'Meat & Poultry', 'kg'),
  rm('RM-MP-004', 'Beef steak', 'Meat & Poultry', 'kg'),
  rm('RM-MP-005', 'Beef mince', 'Meat & Poultry', 'kg'),
  rm('RM-MP-006', 'Bacon', 'Meat & Poultry', 'kg'),
  rm('RM-MP-007', 'Pork belly', 'Meat & Poultry', 'kg'),
  rm('RM-MP-008', 'Wiltshire ham', 'Meat & Poultry', 'kg'),
  rm('RM-MP-009', 'Pepperoni', 'Meat & Poultry', 'kg'),
  rm('RM-MP-010', 'Salami', 'Meat & Poultry', 'kg'),
  rm('RM-MP-011', 'Nduja sausage', 'Meat & Poultry', 'kg'),
  // Fish & Seafood
  rm('RM-FS-001', 'Cod fillet', 'Fish & Seafood', 'kg'),
  rm('RM-FS-002', 'Squid / Calamari', 'Fish & Seafood', 'kg'),
  rm('RM-FS-003', 'Tiger prawns', 'Fish & Seafood', 'kg'),
  rm('RM-FS-004', 'Smoked salmon', 'Fish & Seafood', 'kg'),
  rm('RM-FS-005', 'Anchovies', 'Fish & Seafood', 'kg'),
  rm('RM-FS-006', 'Tuna', 'Fish & Seafood', 'kg'),
  // Vegetables & Fresh Produce
  rm('RM-VG-001', 'Tomatoes', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-002', 'Red onion', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-003', 'White onion', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-004', 'Garlic', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-005', 'Courgette', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-006', 'Bell peppers', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-007', 'Roquette', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-008', 'Cos lettuce', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-009', 'Spinach', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-010', 'Cucumber', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-011', 'Cabbage', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-012', 'Green peas', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-013', 'Lemon', 'Vegetables & Fresh Produce', 'piece'),
  rm('RM-VG-014', 'Mint', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-015', 'Parsley', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-016', 'Fresh basil', 'Vegetables & Fresh Produce', 'kg'),
  rm('RM-VG-017', 'Pomegranate', 'Vegetables & Fresh Produce', 'piece'),
  // Dairy & Eggs
  rm('RM-DE-001', 'Fior Di Latte mozzarella', 'Dairy & Eggs', 'kg'),
  rm('RM-DE-002', 'Cheddar cheese', 'Dairy & Eggs', 'kg'),
  rm('RM-DE-003', 'Smoked cheese', 'Dairy & Eggs', 'kg'),
  rm('RM-DE-004', 'Parmesan', 'Dairy & Eggs', 'kg'),
  rm('RM-DE-005', 'Halloumi', 'Dairy & Eggs', 'kg'),
  rm('RM-DE-006', 'Feta', 'Dairy & Eggs', 'kg'),
  rm('RM-DE-007', 'Butter', 'Dairy & Eggs', 'kg'),
  rm('RM-DE-008', 'Cream', 'Dairy & Eggs', 'litre'),
  rm('RM-DE-009', 'Milk', 'Dairy & Eggs', 'litre'),
  rm('RM-DE-010', 'Eggs', 'Dairy & Eggs', 'piece'),
  rm('RM-DE-011', 'Mayonnaise', 'Dairy & Eggs', 'kg'),
  // Bakery & Bread
  rm('RM-BB-001', 'Brioche buns', 'Bakery & Bread', 'piece'),
  rm('RM-BB-002', 'White bread', 'Bakery & Bread', 'piece'),
  rm('RM-BB-003', 'Brown bread', 'Bakery & Bread', 'piece'),
  rm('RM-BB-004', 'Wraps', 'Bakery & Bread', 'piece'),
  rm('RM-BB-005', 'Naan bread', 'Bakery & Bread', 'piece'),
  rm('RM-BB-006', 'Pizza bases', 'Bakery & Bread', 'piece'),
  rm('RM-BB-007', 'Linguine pasta', 'Bakery & Bread', 'kg'),
  rm('RM-BB-008', 'Croûtes', 'Bakery & Bread', 'kg'),
  // Dry Goods & Groceries
  rm('RM-DG-001', 'Basmati rice', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-002', 'White rice', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-003', 'Quinoa', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-004', 'Risotto rice', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-005', 'Flour', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-006', 'Breadcrumbs', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-007', 'Pasta', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-008', 'Noodles', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-009', 'Crisps', 'Dry Goods & Groceries', 'piece'),
  rm('RM-DG-010', 'Poppadums', 'Dry Goods & Groceries', 'piece'),
  rm('RM-DG-011', 'Mixed vegetables', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-012', 'Olives', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-013', 'Chickpeas / Hummus ingredients', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-014', 'Sugar', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-015', 'Salt', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-016', 'Black pepper', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-017', 'Chilli flakes', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-018', 'Turmeric', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-019', 'Soy sauce', 'Dry Goods & Groceries', 'litre'),
  rm('RM-DG-020', 'BBQ sauce', 'Dry Goods & Groceries', 'litre'),
  rm('RM-DG-021', 'Tomato sauce', 'Dry Goods & Groceries', 'litre'),
  rm('RM-DG-022', 'Red wine jus ingredients', 'Dry Goods & Groceries', 'litre'),
  rm('RM-DG-023', 'Mango chutney', 'Dry Goods & Groceries', 'kg'),
  rm('RM-DG-024', 'Olive oil', 'Dry Goods & Groceries', 'litre'),
  rm('RM-DG-025', 'Cooking oil', 'Dry Goods & Groceries', 'litre'),
  rm('RM-DG-026', 'Vinegar', 'Dry Goods & Groceries', 'litre'),
  // Dessert Ingredients
  rm('RM-DS-001', 'Chocolate', 'Dessert Ingredients', 'kg'),
  rm('RM-DS-002', 'Brownie mix ingredients', 'Dessert Ingredients', 'kg'),
  rm('RM-DS-003', 'Cheesecake ingredients', 'Dessert Ingredients', 'kg'),
  rm('RM-DS-004', 'Ice cream – Vanilla', 'Dessert Ingredients', 'litre'),
  rm('RM-DS-005', 'Ice cream – Chocolate', 'Dessert Ingredients', 'litre'),
  rm('RM-DS-006', 'Ice cream – Strawberry', 'Dessert Ingredients', 'litre'),
  rm('RM-DS-007', 'Ice cream – Butterscotch', 'Dessert Ingredients', 'litre'),
  rm('RM-DS-008', 'Vanilla', 'Dessert Ingredients', 'ml'),
  rm('RM-DS-009', 'Raspberry coulis', 'Dessert Ingredients', 'kg'),
  rm('RM-DS-010', 'Meringue', 'Dessert Ingredients', 'kg'),
  rm('RM-DS-011', 'Gulab jamun', 'Dessert Ingredients', 'piece'),
  rm('RM-DS-012', 'Saffron syrup ingredients', 'Dessert Ingredients', 'litre'),
  // Beverages & Hot Drinks
  rm('RM-BV-001', 'Coffee beans', 'Beverages & Hot Drinks', 'kg'),
  rm('RM-BV-002', 'Tea bags – Earl Grey', 'Beverages & Hot Drinks', 'piece'),
  rm('RM-BV-003', 'Tea bags – English Breakfast', 'Beverages & Hot Drinks', 'piece'),
  rm('RM-BV-004', 'Tea bags – Assam', 'Beverages & Hot Drinks', 'piece'),
  rm('RM-BV-005', 'Tea bags – Green tea', 'Beverages & Hot Drinks', 'piece'),
  rm('RM-BV-006', 'Tea bags – Peppermint', 'Beverages & Hot Drinks', 'piece'),
  rm('RM-BV-007', 'Tea bags – Camomile', 'Beverages & Hot Drinks', 'piece'),
  rm('RM-BV-008', 'Tea bags – Cranberry & raspberry', 'Beverages & Hot Drinks', 'piece'),
  rm('RM-BV-009', 'Tea bags – Lemon & ginger', 'Beverages & Hot Drinks', 'piece'),
];

export const RAW_BY_SKU: Record<string, RawMaterial> = Object.fromEntries(RAW_MATERIALS.map((r) => [r.sku, r]));

/* ---------- Units & costing ---------- */

export const RECIPE_UNITS: StockUnit[] = ['g', 'kg', 'ml', 'litre', 'piece', 'portion'];

type Family = 'mass' | 'volume' | 'count';

const UNIT_FAMILY: Record<StockUnit, Family> = { g: 'mass', kg: 'mass', ml: 'volume', litre: 'volume', piece: 'count', portion: 'count' };
const TO_BASE: Record<StockUnit, number> = { g: 1, kg: 1000, ml: 1, litre: 1000, piece: 1, portion: 1 };

/** Convert qty between compatible units. Returns null when units are incompatible (e.g. g -> piece). */
export function convertUnit(qty: number, from: StockUnit, to: StockUnit): number | null {
  if (from === to) return qty;
  if (UNIT_FAMILY[from] !== UNIT_FAMILY[to]) return null;
  return (qty * TO_BASE[from]) / TO_BASE[to];
}

export interface RecipeLine {
  id: string;
  sku: string; // RawMaterial sku (or preparation id when prepId is set)
  /** When set, this line is a Bulk Preparation / Sub-Recipe (prepared inventory), not a raw material. */
  prepId?: string;
  quantity: number;
  unit: StockUnit;
}

export interface RecipeVersion {
  version: number;
  lines: RecipeLine[];
  yieldPct: number; // preparation yield % (100 = no loss). Cost is grossed up: cost / (yield/100)
  wastagePct: number; // cooking loss / prep wastage % already built into the recipe
  servings: number; // portions produced by this recipe
  instructions: string;
  status: 'draft' | 'approved';
  updatedAt: string;
  updatedBy: string;
}

export interface Recipe {
  /** menu item id, or modifier id for modifier recipes */
  targetId: string;
  kind: 'item' | 'modifier';
  versions: RecipeVersion[];
}

export interface CostLine {
  line: RecipeLine;
  material?: RawMaterial;
  /** Resolved bulk preparation, when the line is a sub-recipe */
  prep?: PrepCostRef;
  costPerRecipeUnit: number;
  lineCost: number;
  missingCost: boolean;
  incompatible: boolean;
}

/** Minimal view of a preparation needed for costing/consumption (avoids circular imports). */
export interface PrepCostRef {
  id: string;
  name: string;
  unit: StockUnit; // prepared-inventory stock unit
  unitCost: number; // current cost per unit from prepared batches (or recipe estimate)
}

export type PrepResolver = (prepId: string) => PrepCostRef | undefined;

export interface RecipeCostResult {
  lines: CostLine[];
  rawTotal: number;
  finalRecipeCost: number;
  costPerServing: number;
  hasMissingCost: boolean;
}

export function emptyVersion(version: number, by: string): RecipeVersion {
  return { version, lines: [], yieldPct: 100, wastagePct: 0, servings: 1, instructions: '', status: 'draft', updatedAt: new Date().toISOString(), updatedBy: by };
}

/**
 * Ingredient Cost = Quantity x Cost per Unit (after unit conversion).
 * Yield and wastage are applied once on the recipe total (yield gross-up), wastage % is
 * informational unless yieldPct is 100 – to avoid double-counting we apply only the larger loss factor.
 */
export function computeRecipeCost(
  v: RecipeVersion | undefined,
  costOf: (sku: string) => RawMaterial | undefined,
  prepOf?: PrepResolver
): RecipeCostResult {
  if (!v) return { lines: [], rawTotal: 0, finalRecipeCost: 0, costPerServing: 0, hasMissingCost: false };
  const lines: CostLine[] = v.lines.map((line) => {
    if (line.prepId) {
      const prep = prepOf?.(line.prepId);
      if (!prep) return { line, costPerRecipeUnit: 0, lineCost: 0, missingCost: true, incompatible: false };
      const qtyInStock = convertUnit(line.quantity, line.unit, prep.unit);
      if (qtyInStock === null) return { line, prep, costPerRecipeUnit: 0, lineCost: 0, missingCost: false, incompatible: true };
      // Cost comes from the prepared batch unit cost – raw ingredients are NOT added again.
      const costPerRecipeUnit = line.quantity > 0 ? (qtyInStock * prep.unitCost) / line.quantity : 0;
      return { line, prep, costPerRecipeUnit, lineCost: qtyInStock * prep.unitCost, missingCost: prep.unitCost <= 0, incompatible: false };
    }
    const material = costOf(line.sku);
    if (!material) return { line, material, costPerRecipeUnit: 0, lineCost: 0, missingCost: true, incompatible: false };
    const qtyInStock = convertUnit(line.quantity, line.unit, material.unit);
    if (qtyInStock === null) return { line, material, costPerRecipeUnit: 0, lineCost: 0, missingCost: false, incompatible: true };
    const costPerRecipeUnit = line.quantity > 0 ? (qtyInStock * material.unitCost) / line.quantity : 0;
    return { line, material, costPerRecipeUnit, lineCost: qtyInStock * material.unitCost, missingCost: material.unitCost <= 0, incompatible: false };
  });
  const rawTotal = lines.reduce((s, l) => s + l.lineCost, 0);
  const yieldFactor = Math.max(v.yieldPct, 1) / 100;
  const wasteFactor = 1 - Math.min(Math.max(v.wastagePct, 0), 99) / 100;
  // Single loss factor: whichever is more severe, so prep loss recorded in both fields is not counted twice.
  const lossFactor = Math.min(yieldFactor, wasteFactor);
  const finalRecipeCost = rawTotal / lossFactor;
  const servings = Math.max(v.servings, 1);
  return {
    lines,
    rawTotal,
    finalRecipeCost,
    costPerServing: finalRecipeCost / servings,
    hasMissingCost: lines.some((l) => l.missingCost || l.incompatible),
  };
}

export function foodCostPct(cost: number, price: number): number {
  return price > 0 ? (cost / price) * 100 : 0;
}

export function grossProfit(price: number, cost: number): number {
  return price - cost;
}

export function activeVersion(r: Recipe | undefined): RecipeVersion | undefined {
  if (!r || r.versions.length === 0) return undefined;
  const approved = [...r.versions].filter((v) => v.status === 'approved').sort((a, b) => b.version - a.version)[0];
  return approved ?? [...r.versions].sort((a, b) => b.version - a.version)[0];
}

/* ---------- Consumption engine (EPOS order -> raw materials) ---------- */

export interface ConsumptionLine {
  sku: string;
  name: string;
  unit: StockUnit; // stock unit
  quantity: number; // in stock unit
  cost: number;
  source: string; // menu item or modifier name
  /** Present when the line is a bulk preparation deducted from Prepared Inventory */
  prepId?: string;
}

export interface OrderLineInput {
  menuItemId: string;
  quantity: number;
  modifierIds: string[];
}

export interface ConsumptionResult {
  lines: ConsumptionLine[];
  totalCost: number;
  unmappedItems: string[];
}

/**
 * Only approved recipes deduct stock. Modifiers deduct only their own additional ingredients
 * (e.g. Add Chicken deducts the extra chicken, never a second salad recipe).
 */
export function computeConsumption(
  inputs: OrderLineInput[],
  recipes: Recipe[],
  costOf: (sku: string) => RawMaterial | undefined,
  prepOf?: PrepResolver
): ConsumptionResult {
  const map = new Map<string, ConsumptionLine>();
  const unmapped: string[] = [];
  const byTarget = new Map(recipes.map((r) => [r.targetId, r]));

  const apply = (recipe: Recipe | undefined, qty: number, source: string): boolean => {
    const v = activeVersion(recipe);
    if (!v || v.status !== 'approved' || v.lines.length === 0) return false;
    const lossFactor = Math.min(Math.max(v.yieldPct, 1) / 100, 1 - Math.min(Math.max(v.wastagePct, 0), 99) / 100);
    const servings = Math.max(v.servings, 1);
    for (const l of v.lines) {
      if (l.prepId) {
        // Sub-recipe: deduct from Prepared Inventory only. Underlying raw materials are never re-deducted.
        const p = prepOf?.(l.prepId);
        if (!p) continue;
        const inPrepStock = convertUnit(l.quantity, l.unit, p.unit);
        if (inPrepStock === null) continue;
        const amount = (inPrepStock / servings / lossFactor) * qty;
        const key = `prep:${l.prepId}`;
        const cost = amount * p.unitCost;
        const prev = map.get(key);
        if (prev) {
          prev.quantity += amount;
          prev.cost += cost;
        } else {
          map.set(key, { sku: l.prepId, prepId: l.prepId, name: p.name, unit: p.unit, quantity: amount, cost, source });
        }
        continue;
      }
      const m = costOf(l.sku);
      if (!m) continue;
      const inStock = convertUnit(l.quantity, l.unit, m.unit);
      if (inStock === null) continue;
      const amount = (inStock / servings / lossFactor) * qty;
      const key = `${l.sku}`;
      const prev = map.get(key);
      const cost = amount * m.unitCost;
      if (prev) {
        prev.quantity += amount;
        prev.cost += cost;
      } else {
        map.set(key, { sku: l.sku, name: m.name, unit: m.unit, quantity: amount, cost, source });
      }
    }
    return true;
  };

  for (const input of inputs) {
    const item = MENU_ITEMS.find((m) => m.id === input.menuItemId);
    if (!item) continue;
    if (!apply(byTarget.get(item.id), input.quantity, item.name)) unmapped.push(item.name);
    for (const mid of input.modifierIds) {
      const modifier = item.modifiers.find((x) => x.id === mid);
      if (!modifier) continue;
      const r = byTarget.get(mid);
      // Modifiers with no recipe (e.g. plain bread choice) simply consume nothing until configured.
      if (r) apply(r, input.quantity, `${item.name} – ${modifier.name}`);
    }
  }
  const lines = Array.from(map.values());
  return { lines, totalCost: lines.reduce((s, l) => s + l.cost, 0), unmappedItems: unmapped };
}
