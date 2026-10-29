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
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  recipeStatus: 'mapped' | 'unmapped' | 'draft';
  consumption: RecipeConsumptionLine[];
}

export interface EPOSOrder {
  id: string;
  orderId: string;
  restaurant: string;
  restaurantCode: string;
  orderTime: string;
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

export const eposOrders: EPOSOrder[] = [
  {
    id: 'epos-001',
    orderId: 'MF-HOU-10482',
    restaurant: 'Samko Hounslow',
    restaurantCode: 'HOU',
    orderTime: '06:17:32',
    status: 'completed',
    webhookEventId: 'wh_evt_a1b2c3d4',
    isDuplicate: false,
    processingNote: 'Order processed successfully. FEFO batch allocation complete.',
    totalSelling: 7.99,
    totalRecipeCost: 0.62,
    foodCostPct: 7.76,
    grossMargin: 92.24,
    lines: [
      {
        id: 'eol-001-1',
        menuItem: 'Masala Dosa',
        quantity: 1,
        unitPrice: 7.99,
        totalPrice: 7.99,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-001-1-1',
            ingredientName: 'Dosa Batter',
            quantity: 100,
            unit: 'g',
            totalIngredientCost: 0.098,
            fefoAllocations: [
              { id: 'fefo-001-1-1-a', batchId: 'PB-2024-0111', expiryDate: '13/10/2026', quantityAllocated: 100, unit: 'g', batchCost: 0.00098, totalCost: 0.098 },
            ],
          },
          {
            id: 'rcl-001-1-2',
            ingredientName: 'Dosa Masala',
            quantity: 20,
            unit: 'g',
            totalIngredientCost: 0.101,
            fefoAllocations: [
              { id: 'fefo-001-1-2-a', batchId: 'PB-2024-0113', expiryDate: '14/10/2026', quantityAllocated: 20, unit: 'g', batchCost: 0.00507, totalCost: 0.101 },
            ],
          },
          {
            id: 'rcl-001-1-3',
            ingredientName: 'Red Chutney',
            quantity: 10,
            unit: 'g',
            totalIngredientCost: 0.034,
            fefoAllocations: [
              { id: 'fefo-001-1-3-a', batchId: 'PB-2024-0109', expiryDate: '12/10/2026', quantityAllocated: 10, unit: 'g', batchCost: 0.00342, totalCost: 0.034 },
            ],
          },
          {
            id: 'rcl-001-1-4',
            ingredientName: 'White Chutney',
            quantity: 10,
            unit: 'g',
            totalIngredientCost: 0.052,
            fefoAllocations: [
              { id: 'fefo-001-1-4-a', batchId: 'PB-2024-0108', expiryDate: '12/10/2026', quantityAllocated: 10, unit: 'g', batchCost: 0.00518, totalCost: 0.052 },
            ],
          },
          {
            id: 'rcl-001-1-5',
            ingredientName: 'Sambar',
            quantity: 20,
            unit: 'g',
            totalIngredientCost: 0.096,
            fefoAllocations: [
              { id: 'fefo-001-1-5-a', batchId: 'PB-2024-0110', expiryDate: '13/10/2026', quantityAllocated: 20, unit: 'g', batchCost: 0.00482, totalCost: 0.096 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'epos-002',
    orderId: 'MF-HOU-10481',
    restaurant: 'Samko Hounslow',
    restaurantCode: 'HOU',
    orderTime: '06:08:14',
    status: 'completed',
    webhookEventId: 'wh_evt_b2c3d4e5',
    isDuplicate: false,
    processingNote: 'Multi-item order. FEFO allocation split across batches for dosa batter.',
    totalSelling: 13.98,
    totalRecipeCost: 0.98,
    foodCostPct: 7.01,
    grossMargin: 92.99,
    lines: [
      {
        id: 'eol-002-1',
        menuItem: 'Plain Dosa',
        quantity: 2,
        unitPrice: 6.99,
        totalPrice: 13.98,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-002-1-1',
            ingredientName: 'Dosa Batter',
            quantity: 240,
            unit: 'g',
            totalIngredientCost: 0.235,
            fefoAllocations: [
              { id: 'fefo-002-1-1-a', batchId: 'PB-2024-0111', expiryDate: '13/10/2026', quantityAllocated: 240, unit: 'g', batchCost: 0.00098, totalCost: 0.235 },
            ],
          },
          {
            id: 'rcl-002-1-2',
            ingredientName: 'Red Chutney',
            quantity: 30,
            unit: 'g',
            totalIngredientCost: 0.103,
            fefoAllocations: [
              { id: 'fefo-002-1-2-a', batchId: 'PB-2024-0109', expiryDate: '12/10/2026', quantityAllocated: 30, unit: 'g', batchCost: 0.00342, totalCost: 0.103 },
            ],
          },
          {
            id: 'rcl-002-1-3',
            ingredientName: 'White Chutney',
            quantity: 30,
            unit: 'g',
            totalIngredientCost: 0.155,
            fefoAllocations: [
              { id: 'fefo-002-1-3-a', batchId: 'PB-2024-0108', expiryDate: '12/10/2026', quantityAllocated: 30, unit: 'g', batchCost: 0.00518, totalCost: 0.155 },
            ],
          },
          {
            id: 'rcl-002-1-4',
            ingredientName: 'Sambar',
            quantity: 60,
            unit: 'g',
            totalIngredientCost: 0.289,
            fefoAllocations: [
              { id: 'fefo-002-1-4-a', batchId: 'PB-2024-0110', expiryDate: '13/10/2026', quantityAllocated: 60, unit: 'g', batchCost: 0.00482, totalCost: 0.289 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'epos-003',
    orderId: 'MF-REA-8821',
    restaurant: 'Samko Reading',
    restaurantCode: 'REA',
    orderTime: '06:02:47',
    status: 'completed',
    webhookEventId: 'wh_evt_c3d4e5f6',
    isDuplicate: false,
    processingNote: 'Multi-item order processed. FEFO allocations confirmed.',
    totalSelling: 12.74,
    totalRecipeCost: 1.04,
    foodCostPct: 8.16,
    grossMargin: 91.84,
    lines: [
      {
        id: 'eol-003-1',
        menuItem: 'Idly',
        quantity: 2,
        unitPrice: 4.75,
        totalPrice: 9.50,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-003-1-1',
            ingredientName: 'Idly Batter',
            quantity: 320,
            unit: 'g',
            totalIngredientCost: 0.397,
            fefoAllocations: [
              { id: 'fefo-003-1-1-a', batchId: 'PB-2024-0112', expiryDate: '14/10/2026', quantityAllocated: 320, unit: 'g', batchCost: 0.00124, totalCost: 0.397 },
            ],
          },
          {
            id: 'rcl-003-1-2',
            ingredientName: 'Sambar',
            quantity: 100,
            unit: 'g',
            totalIngredientCost: 0.482,
            fefoAllocations: [
              { id: 'fefo-003-1-2-a', batchId: 'PB-2024-0110', expiryDate: '13/10/2026', quantityAllocated: 100, unit: 'g', batchCost: 0.00482, totalCost: 0.482 },
            ],
          },
        ],
      },
      {
        id: 'eol-003-2',
        menuItem: 'Vegetable Biryani',
        quantity: 1,
        unitPrice: 7.99,
        totalPrice: 7.99,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-003-2-1',
            ingredientName: 'Basmati Rice (cooked)',
            quantity: 250,
            unit: 'g',
            totalIngredientCost: 0.088,
            fefoAllocations: [
              { id: 'fefo-003-2-1-a', batchId: 'SUPP-RICE-0041', expiryDate: '18/10/2026', quantityAllocated: 250, unit: 'g', batchCost: 0.00035, totalCost: 0.088 },
            ],
          },
          {
            id: 'rcl-003-2-2',
            ingredientName: 'Mixed Vegetables',
            quantity: 100,
            unit: 'g',
            totalIngredientCost: 0.072,
            fefoAllocations: [
              { id: 'fefo-003-2-2-a', batchId: 'SUPP-VEG-0019', expiryDate: '13/10/2026', quantityAllocated: 100, unit: 'g', batchCost: 0.00072, totalCost: 0.072 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'epos-004',
    orderId: 'MF-DAR-6102',
    restaurant: 'Samko Dartford',
    restaurantCode: 'DAR',
    orderTime: '05:54:18',
    status: 'completed',
    webhookEventId: 'wh_evt_d4e5f6g7',
    isDuplicate: false,
    processingNote: 'FEFO: Red chutney consumed from batch PB-2024-0109 (earliest expiry 12/10).',
    totalSelling: 8.50,
    totalRecipeCost: 0.72,
    foodCostPct: 8.47,
    grossMargin: 91.53,
    lines: [
      {
        id: 'eol-004-1',
        menuItem: 'Ghee Masala Dosa',
        quantity: 1,
        unitPrice: 8.50,
        totalPrice: 8.50,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-004-1-1',
            ingredientName: 'Dosa Batter',
            quantity: 100,
            unit: 'g',
            totalIngredientCost: 0.098,
            fefoAllocations: [
              { id: 'fefo-004-1-1-a', batchId: 'PB-2024-0111', expiryDate: '13/10/2026', quantityAllocated: 100, unit: 'g', batchCost: 0.00098, totalCost: 0.098 },
            ],
          },
          {
            id: 'rcl-004-1-2',
            ingredientName: 'Dosa Masala',
            quantity: 20,
            unit: 'g',
            totalIngredientCost: 0.101,
            fefoAllocations: [
              { id: 'fefo-004-1-2-a', batchId: 'PB-2024-0113', expiryDate: '14/10/2026', quantityAllocated: 20, unit: 'g', batchCost: 0.00507, totalCost: 0.101 },
            ],
          },
          {
            id: 'rcl-004-1-3',
            ingredientName: 'Ghee',
            quantity: 8,
            unit: 'g',
            totalIngredientCost: 0.096,
            fefoAllocations: [
              { id: 'fefo-004-1-3-a', batchId: 'SUPP-GHEE-0012', expiryDate: '30/11/2026', quantityAllocated: 8, unit: 'g', batchCost: 0.012, totalCost: 0.096 },
            ],
          },
          {
            id: 'rcl-004-1-4',
            ingredientName: 'Red Chutney',
            quantity: 10,
            unit: 'g',
            totalIngredientCost: 0.034,
            fefoAllocations: [
              { id: 'fefo-004-1-4-a', batchId: 'PB-2024-0109', expiryDate: '12/10/2026', quantityAllocated: 10, unit: 'g', batchCost: 0.00342, totalCost: 0.034 },
            ],
          },
          {
            id: 'rcl-004-1-5',
            ingredientName: 'Sambar',
            quantity: 20,
            unit: 'g',
            totalIngredientCost: 0.096,
            fefoAllocations: [
              { id: 'fefo-004-1-5-a', batchId: 'PB-2024-0110', expiryDate: '13/10/2026', quantityAllocated: 20, unit: 'g', batchCost: 0.00482, totalCost: 0.096 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'epos-005',
    orderId: 'MF-LEI-4401',
    restaurant: 'Samko Leicester',
    restaurantCode: 'LEI',
    orderTime: '05:41:09',
    status: 'completed',
    webhookEventId: 'wh_evt_e5f6g7h8',
    isDuplicate: false,
    processingNote: '',
    totalSelling: 9.50,
    totalRecipeCost: 1.24,
    foodCostPct: 13.05,
    grossMargin: 86.95,
    lines: [
      {
        id: 'eol-005-1',
        menuItem: 'Paneer Butter Masala',
        quantity: 1,
        unitPrice: 9.50,
        totalPrice: 9.50,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-005-1-1',
            ingredientName: 'Paneer',
            quantity: 120,
            unit: 'g',
            totalIngredientCost: 0.660,
            fefoAllocations: [
              { id: 'fefo-005-1-1-a', batchId: 'SUPP-PAN-0041', expiryDate: '14/10/2026', quantityAllocated: 120, unit: 'g', batchCost: 0.0055, totalCost: 0.660 },
            ],
          },
          {
            id: 'rcl-005-1-2',
            ingredientName: 'Tomato/Cashew Gravy',
            quantity: 180,
            unit: 'g',
            totalIngredientCost: 0.576,
            fefoAllocations: [
              { id: 'fefo-005-1-2-a', batchId: 'PB-2024-0107', expiryDate: '11/10/2026', quantityAllocated: 180, unit: 'g', batchCost: 0.0032, totalCost: 0.576 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'epos-006',
    orderId: 'MF-HOU-10479',
    restaurant: 'Samko Hounslow',
    restaurantCode: 'HOU',
    orderTime: '05:28:55',
    status: 'failed',
    webhookEventId: 'wh_evt_f6g7h8i9',
    isDuplicate: false,
    processingNote: 'Recipe not mapped for Chilli Paneer. Stock not deducted. Item flagged for recipe configuration.',
    totalSelling: 8.99,
    totalRecipeCost: 0,
    foodCostPct: 0,
    grossMargin: 0,
    lines: [
      {
        id: 'eol-006-1',
        menuItem: 'Chilli Paneer',
        quantity: 1,
        unitPrice: 8.99,
        totalPrice: 8.99,
        recipeStatus: 'unmapped',
        consumption: [],
      },
    ],
  },
  {
    id: 'epos-007',
    orderId: 'MF-HOU-10478',
    restaurant: 'Samko Hounslow',
    restaurantCode: 'HOU',
    orderTime: '05:14:22',
    status: 'cancelled',
    webhookEventId: 'wh_evt_g7h8i9j0',
    isDuplicate: false,
    processingNote: 'Order cancelled by customer before preparation. Stock reversal posted. No net inventory impact.',
    totalSelling: 7.99,
    totalRecipeCost: 0,
    foodCostPct: 0,
    grossMargin: 0,
    lines: [
      {
        id: 'eol-007-1',
        menuItem: 'Masala Dosa',
        quantity: 1,
        unitPrice: 7.99,
        totalPrice: 7.99,
        recipeStatus: 'mapped',
        consumption: [],
      },
    ],
  },
  {
    id: 'epos-008',
    orderId: 'MF-REA-8819',
    restaurant: 'Samko Reading',
    restaurantCode: 'REA',
    orderTime: '05:02:11',
    status: 'completed',
    webhookEventId: 'wh_evt_h8i9j0k1',
    isDuplicate: false,
    processingNote: '',
    totalSelling: 16.48,
    totalRecipeCost: 1.18,
    foodCostPct: 7.16,
    grossMargin: 92.84,
    lines: [
      {
        id: 'eol-008-1',
        menuItem: 'Ghee Pongal',
        quantity: 1,
        unitPrice: 6.99,
        totalPrice: 6.99,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-008-1-1',
            ingredientName: 'Rice & Dal Mixture',
            quantity: 180,
            unit: 'g',
            totalIngredientCost: 0.420,
            fefoAllocations: [
              { id: 'fefo-008-1-1-a', batchId: 'PB-2024-0105', expiryDate: '10/10/2026', quantityAllocated: 180, unit: 'g', batchCost: 0.00392, totalCost: 0.420 },
            ],
          },
          {
            id: 'rcl-008-1-2',
            ingredientName: 'Ghee',
            quantity: 8,
            unit: 'g',
            totalIngredientCost: 0.096,
            fefoAllocations: [
              { id: 'fefo-008-1-2-a', batchId: 'SUPP-GHEE-0012', expiryDate: '30/11/2026', quantityAllocated: 8, unit: 'g', batchCost: 0.012, totalCost: 0.096 },
            ],
          },
        ],
      },
      {
        id: 'eol-008-2',
        menuItem: 'Medhu Vada (3 Nos)',
        quantity: 1,
        unitPrice: 5.50,
        totalPrice: 5.50,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-008-2-1',
            ingredientName: 'Vada Batter',
            quantity: 150,
            unit: 'g',
            totalIngredientCost: 0.621,
            fefoAllocations: [
              { id: 'fefo-008-2-1-a', batchId: 'PB-2024-0114', expiryDate: '14/10/2026', quantityAllocated: 150, unit: 'g', batchCost: 0.00414, totalCost: 0.621 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'epos-009',
    orderId: 'MF-HOU-10477',
    restaurant: 'Samko Hounslow',
    restaurantCode: 'HOU',
    orderTime: '04:58:44',
    status: 'processing',
    webhookEventId: 'wh_evt_i9j0k1l2',
    isDuplicate: false,
    processingNote: 'FEFO batch allocation in progress…',
    totalSelling: 9.99,
    totalRecipeCost: 0,
    foodCostPct: 0,
    grossMargin: 0,
    lines: [
      {
        id: 'eol-009-1',
        menuItem: 'Paneer Tikka Masala',
        quantity: 1,
        unitPrice: 9.99,
        totalPrice: 9.99,
        recipeStatus: 'mapped',
        consumption: [],
      },
    ],
  },
  {
    id: 'epos-010',
    orderId: 'MF-DAR-6100',
    restaurant: 'Samko Dartford',
    restaurantCode: 'DAR',
    orderTime: '04:44:02',
    status: 'completed',
    webhookEventId: 'wh_evt_j0k1l2m3',
    isDuplicate: true,
    processingNote: 'Duplicate webhook event detected. Idempotency check passed — stock not deducted twice. Original event: wh_evt_j0k1l2m2.',
    totalSelling: 6.99,
    totalRecipeCost: 0.48,
    foodCostPct: 6.87,
    grossMargin: 93.13,
    lines: [
      {
        id: 'eol-010-1',
        menuItem: 'Idly',
        quantity: 1,
        unitPrice: 6.99,
        totalPrice: 6.99,
        recipeStatus: 'mapped',
        consumption: [
          {
            id: 'rcl-010-1-1',
            ingredientName: 'Idly Batter',
            quantity: 160,
            unit: 'g',
            totalIngredientCost: 0.198,
            fefoAllocations: [
              { id: 'fefo-010-1-1-a', batchId: 'PB-2024-0112', expiryDate: '14/10/2026', quantityAllocated: 160, unit: 'g', batchCost: 0.00124, totalCost: 0.198 },
            ],
          },
          {
            id: 'rcl-010-1-2',
            ingredientName: 'Sambar',
            quantity: 50,
            unit: 'g',
            totalIngredientCost: 0.241,
            fefoAllocations: [
              { id: 'fefo-010-1-2-a', batchId: 'PB-2024-0110', expiryDate: '13/10/2026', quantityAllocated: 50, unit: 'g', batchCost: 0.00482, totalCost: 0.241 },
            ],
          },
        ],
      },
    ],
  },
  ...NEW_RESTAURANTS.flatMap((r, i): EPOSOrder[] => {
    const code = r.code.toLowerCase();
    const menu = [
      { name: 'Masala Dosa', price: 7.99, ingredient: 'Dosa Batter', grams: 100, batchId: 'PB-2024-0111', expiry: '13/10/2026', perGram: 0.00098 },
      { name: 'Idly (2 pcs)', price: 4.75, ingredient: 'Idly Batter', grams: 160, batchId: 'PB-2024-0112', expiry: '14/10/2026', perGram: 0.00124 },
    ];
    return menu.map((m, k): EPOSOrder => {
      const cost = Number((m.grams * m.perGram).toFixed(3));
      const pct = Number(((cost / m.price) * 100).toFixed(2));
      const orderNo = 5200 + i * 11 + k;
      return {
        id: `epos-${code}-${k + 1}`,
        orderId: `MF-${r.code}-${orderNo}`,
        restaurant: r.fullName,
        restaurantCode: r.code,
        orderTime: `0${6 + k}:${String(10 + i * 3).padStart(2, '0')}:1${k}`,
        status: 'completed',
        webhookEventId: `wh_evt_${code}${k + 1}`,
        isDuplicate: false,
        processingNote: 'Order processed successfully. FEFO batch allocation complete.',
        totalSelling: m.price,
        totalRecipeCost: cost,
        foodCostPct: pct,
        grossMargin: Number((100 - pct).toFixed(2)),
        lines: [
          {
            id: `eol-${code}-${k + 1}-1`,
            menuItem: m.name,
            quantity: 1,
            unitPrice: m.price,
            totalPrice: m.price,
            recipeStatus: 'mapped',
            consumption: [
              {
                id: `rcl-${code}-${k + 1}-1`,
                ingredientName: m.ingredient,
                quantity: m.grams,
                unit: 'g',
                totalIngredientCost: cost,
                fefoAllocations: [
                  { id: `fefo-${code}-${k + 1}-1-a`, batchId: m.batchId, expiryDate: m.expiry, quantityAllocated: m.grams, unit: 'g', batchCost: m.perGram, totalCost: cost },
                ],
              },
            ],
          },
        ],
      };
    });
  }),
];