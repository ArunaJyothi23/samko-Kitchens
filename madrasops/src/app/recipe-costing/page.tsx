'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Search, ChevronDown, ChevronUp, AlertTriangle, Download } from 'lucide-react';

interface RecipeComponent {
  ingredient: string;
  quantity: number;
  unit: string;
  costPerUnit: number;
  portionCost: number;
}

interface RecipeItem {
  id: string;
  menuItem: string;
  category: string;
  sellingPrice: number;
  vatRate: number;
  netSales: number;
  ingredientCost: number;
  packagingCost: number;
  totalPortionCost: number;
  grossProfit: number;
  grossMarginPct: number;
  foodCostPct: number;
  soldQty: number;
  totalSales: number;
  totalIngredientCost: number;
  recipeStatus: 'approved' | 'draft' | 'pending';
  components: RecipeComponent[];
}

const recipeData: RecipeItem[] = [
  {
    id: 'RC-001', menuItem: 'Masala Dosa', category: 'Dosa Corner', sellingPrice: 7.99, vatRate: 20, netSales: 6.66,
    ingredientCost: 0.42, packagingCost: 0.05, totalPortionCost: 0.47, grossProfit: 6.19, grossMarginPct: 92.95, foodCostPct: 6.31,
    soldQty: 48, totalSales: 383.52, totalIngredientCost: 20.16, recipeStatus: 'approved',
    components: [
      { ingredient: 'Dosa Batter', quantity: 100, unit: 'g', costPerUnit: 1.00, portionCost: 0.10 },
      { ingredient: 'Dosa Masala', quantity: 20, unit: 'g', costPerUnit: 1.00, portionCost: 0.02 },
      { ingredient: 'Red Chutney', quantity: 10, unit: 'g', costPerUnit: 10.00, portionCost: 0.10 },
      { ingredient: 'White Chutney', quantity: 10, unit: 'g', costPerUnit: 10.00, portionCost: 0.10 },
      { ingredient: 'Sambar', quantity: 20, unit: 'g', costPerUnit: 5.00, portionCost: 0.10 },
    ],
  },
  {
    id: 'RC-002', menuItem: 'Plain Dosa', category: 'Dosa Corner', sellingPrice: 6.99, vatRate: 20, netSales: 5.83,
    ingredientCost: 0.38, packagingCost: 0.05, totalPortionCost: 0.43, grossProfit: 5.40, grossMarginPct: 92.63, foodCostPct: 6.52,
    soldQty: 35, totalSales: 244.65, totalIngredientCost: 13.30, recipeStatus: 'approved',
    components: [
      { ingredient: 'Dosa Batter', quantity: 120, unit: 'g', costPerUnit: 1.00, portionCost: 0.12 },
      { ingredient: 'Red Chutney', quantity: 15, unit: 'g', costPerUnit: 10.00, portionCost: 0.15 },
      { ingredient: 'White Chutney', quantity: 15, unit: 'g', costPerUnit: 10.00, portionCost: 0.15 },
      { ingredient: 'Sambar', quantity: 30, unit: 'g', costPerUnit: 5.00, portionCost: 0.15 },
    ],
  },
  {
    id: 'RC-003', menuItem: 'Idly', category: 'All Day Favourites', sellingPrice: 4.75, vatRate: 20, netSales: 3.96,
    ingredientCost: 0.32, packagingCost: 0.03, totalPortionCost: 0.35, grossProfit: 3.61, grossMarginPct: 91.16, foodCostPct: 8.08,
    soldQty: 62, totalSales: 294.50, totalIngredientCost: 19.84, recipeStatus: 'approved',
    components: [
      { ingredient: 'Idly Batter', quantity: 160, unit: 'g', costPerUnit: 0.95, portionCost: 0.15 },
      { ingredient: 'Sambar', quantity: 50, unit: 'g', costPerUnit: 5.00, portionCost: 0.25 },
      { ingredient: 'Chutney', quantity: 30, unit: 'g', costPerUnit: 10.00, portionCost: 0.30 },
    ],
  },
  {
    id: 'RC-004', menuItem: 'Medhu Vada (3 Nos)', category: 'All Day Favourites', sellingPrice: 5.50, vatRate: 20, netSales: 4.58,
    ingredientCost: 0.38, packagingCost: 0.03, totalPortionCost: 0.41, grossProfit: 4.17, grossMarginPct: 91.05, foodCostPct: 8.30,
    soldQty: 28, totalSales: 154.00, totalIngredientCost: 10.64, recipeStatus: 'approved',
    components: [
      { ingredient: 'Vada Batter', quantity: 150, unit: 'g', costPerUnit: 1.10, portionCost: 0.17 },
      { ingredient: 'Sambar', quantity: 50, unit: 'g', costPerUnit: 5.00, portionCost: 0.25 },
      { ingredient: 'Chutney', quantity: 30, unit: 'g', costPerUnit: 10.00, portionCost: 0.30 },
    ],
  },
  {
    id: 'RC-005', menuItem: 'Paneer Butter Masala', category: 'Indian Curries', sellingPrice: 9.50, vatRate: 20, netSales: 7.92,
    ingredientCost: 1.42, packagingCost: 0.08, totalPortionCost: 1.50, grossProfit: 6.42, grossMarginPct: 81.06, foodCostPct: 17.93,
    soldQty: 31, totalSales: 294.50, totalIngredientCost: 44.02, recipeStatus: 'draft',
    components: [
      { ingredient: 'Paneer', quantity: 120, unit: 'g', costPerUnit: 8.50, portionCost: 1.02 },
      { ingredient: 'Tomato/Cashew Gravy', quantity: 180, unit: 'g', costPerUnit: 2.00, portionCost: 0.36 },
      { ingredient: 'Butter/Cream', quantity: 10, unit: 'g', costPerUnit: 4.00, portionCost: 0.04 },
    ],
  },
  {
    id: 'RC-006', menuItem: 'Vegetable Biryani', category: 'Rice & Noodles', sellingPrice: 7.99, vatRate: 20, netSales: 6.66,
    ingredientCost: 0.82, packagingCost: 0.08, totalPortionCost: 0.90, grossProfit: 5.76, grossMarginPct: 86.49, foodCostPct: 12.31,
    soldQty: 22, totalSales: 175.78, totalIngredientCost: 18.04, recipeStatus: 'draft',
    components: [
      { ingredient: 'Cooked Biryani Rice', quantity: 250, unit: 'g', costPerUnit: 1.80, portionCost: 0.45 },
      { ingredient: 'Mixed Vegetables', quantity: 100, unit: 'g', costPerUnit: 2.50, portionCost: 0.25 },
      { ingredient: 'Oil/Ghee', quantity: 10, unit: 'g', costPerUnit: 12.00, portionCost: 0.12 },
    ],
  },
];

const categories = ['All', 'Dosa Corner', 'All Day Favourites', 'Indian Curries', 'Rice & Noodles', 'Starters'];
const statuses = ['All', 'approved', 'draft', 'pending'];

const statusColors: Record<string, { bg: string; text: string }> = {
  approved: { bg: '#DCFCE7', text: '#166534' },
  draft: { bg: '#FEF9C3', text: '#854D0E' },
  pending: { bg: '#DBEAFE', text: '#1E40AF' },
};

export default function RecipeCostingPage() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = recipeData.filter((r) => {
    const matchSearch = !search || r.menuItem.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'All' || r.category === categoryFilter;
    const matchStatus = statusFilter === 'All' || r.recipeStatus === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const avgFoodCost = filtered.reduce((s, r) => s + r.foodCostPct, 0) / (filtered.length || 1);
  const totalSales = filtered.reduce((s, r) => s + r.totalSales, 0);
  const totalIngCost = filtered.reduce((s, r) => s + r.totalIngredientCost, 0);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Recipe Costing</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Ingredient costs, margins and food-cost % per menu item · <span style={{ color: '#92400E', fontSize: 12 }}>⚠ DEMO DATA — pending client validation</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }}><Download size={14} /> Export</button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Recipes Configured</p>
          <p className="metric-value">{recipeData.filter(r => r.recipeStatus === 'approved').length} / {recipeData.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Avg Food Cost %</p>
          <p className="metric-value" style={{ color: avgFoodCost > 30 ? '#991B1B' : '#166534' }}>{avgFoodCost.toFixed(1)}%</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Total Sales (Demo)</p>
          <p className="metric-value" style={{ color: '#166534' }}>£{totalSales.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Total Ingredient Cost</p>
          <p className="metric-value">£{totalIngCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
          <input className="input-field pl-8" placeholder="Search menu item..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field" style={{ width: 160 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="input-field" style={{ width: 130 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Recipe Cards */}
      <div className="space-y-3">
        {filtered.map((recipe) => (
          <div key={recipe.id} className="card p-0 overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-80"
              style={{ background: 'var(--card)' }}
              onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{recipe.menuItem}</span>
                    <span style={{ display: 'inline-block', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: statusColors[recipe.recipeStatus].bg, color: statusColors[recipe.recipeStatus].text, textTransform: 'uppercase' }}>
                      {recipe.recipeStatus}
                    </span>
                    {recipe.recipeStatus === 'draft' && <span style={{ fontSize: 10, color: '#92400E' }}><AlertTriangle size={10} style={{ display: 'inline' }} /> Not active</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginTop: 2 }}>{recipe.category} · {recipe.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right hidden md:block">
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Selling Price</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>£{recipe.sellingPrice.toFixed(2)}</div>
                </div>
                <div className="text-right hidden md:block">
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Ingredient Cost</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>£{recipe.ingredientCost.toFixed(2)}</div>
                </div>
                <div className="text-right hidden lg:block">
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Food Cost %</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: recipe.foodCostPct > 30 ? '#991B1B' : '#166534' }}>{recipe.foodCostPct.toFixed(1)}%</div>
                </div>
                <div className="text-right hidden lg:block">
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Gross Margin</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>{recipe.grossMarginPct.toFixed(1)}%</div>
                </div>
                <div className="text-right hidden xl:block">
                  <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Sold Qty</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{recipe.soldQty}</div>
                </div>
                {expandedId === recipe.id ? <ChevronUp size={16} style={{ color: 'var(--muted-foreground)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted-foreground)' }} />}
              </div>
            </div>

            {expandedId === recipe.id && (
              <div className="border-t" style={{ borderColor: 'var(--border)', padding: 20 }}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                  {[
                    { label: 'Selling Price (incl. VAT)', value: `£${recipe.sellingPrice.toFixed(2)}` },
                    { label: `Net Sales (ex. ${recipe.vatRate}% VAT)`, value: `£${recipe.netSales.toFixed(2)}` },
                    { label: 'Ingredient Cost', value: `£${recipe.ingredientCost.toFixed(2)}`, highlight: true },
                    { label: 'Packaging Cost', value: `£${recipe.packagingCost.toFixed(2)}` },
                    { label: 'Total Portion Cost', value: `£${recipe.totalPortionCost.toFixed(2)}` },
                    { label: 'Gross Profit Contribution', value: `£${recipe.grossProfit.toFixed(2)}`, green: true },
                    { label: 'Gross Margin %', value: `${recipe.grossMarginPct.toFixed(2)}%`, green: true },
                    { label: 'Food Cost %', value: `${recipe.foodCostPct.toFixed(2)}%`, highlight: true },
                  ].map(({ label, value, highlight, green }) => (
                    <div key={label} className="p-3 rounded-lg" style={{ background: 'var(--background)' }}>
                      <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: highlight ? '#991B1B' : green ? '#166534' : 'var(--foreground)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Recipe Components</h4>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Quantity</th>
                      <th>Unit</th>
                      <th>Cost/Unit</th>
                      <th>Portion Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recipe.components.map((c, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 13 }}>{c.ingredient}</td>
                        <td style={{ fontSize: 12 }}>{c.quantity}</td>
                        <td style={{ fontSize: 12 }}>{c.unit}</td>
                        <td style={{ fontSize: 12 }}>£{c.costPerUnit.toFixed(2)}/kg</td>
                        <td style={{ fontSize: 12, fontWeight: 600, color: '#991B1B' }}>£{c.portionCost.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--background)', fontWeight: 700 }}>
                      <td colSpan={4} style={{ fontSize: 12 }}>Total Ingredient Cost</td>
                      <td style={{ fontSize: 13, color: '#991B1B' }}>£{recipe.ingredientCost.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 p-3 rounded-lg" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
                  <p style={{ fontSize: 11, color: '#92400E' }}>
                    ⚠ <strong>DEMO DATA</strong> — These ingredient costs and quantities are illustrative examples pending validation by the client. Gross margin shown is ingredient-only contribution, not net profit. Activate recipe to enable automatic stock deduction.
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AppLayout>
  );
}
