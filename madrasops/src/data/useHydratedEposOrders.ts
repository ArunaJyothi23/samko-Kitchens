'use client';

import { useEffect, useMemo } from 'react';
import { eposOrders as seedOrders, EPOSOrder, EPOSOrderLine, RecipeConsumptionLine } from '@/app/epos-orders/components/eposData';
import { computeConsumption, foodCostPct, MENU_ITEMS, PrepCostRef, StockUnit } from './eposMaster';
import { useEposMaster } from './eposMasterStore';
import { latestUnitCost, usePrepStore } from './prepStore';

/**
 * Hydrates EPOS orders with live raw-material consumption derived from APPROVED recipes
 * (and only the selected modifiers' own ingredients). Bulk-preparation lines are costed from the
 * prepared batch unit cost and deducted from Prepared Inventory only. Also posts each completed order to the
 * consumption ledger exactly once (idempotent on orderId) and reverses cancelled orders once.
 */
export function useHydratedEposOrders(): EPOSOrder[] {
  const { state, materialOf, recordConsumption, reverseConsumption, hydrated } = useEposMaster();
  const { state: prepState } = usePrepStore();

  const orders = useMemo<EPOSOrder[]>(() => {
    return seedOrders.map((o) => {
      if (o.status === 'failed' || o.status === 'processing') return o;
      // Preparations are hotel-specific: resolve against the order's hotel.
      const prepOf = (id: string): PrepCostRef | undefined => {
        const p = prepState.preps.find((x) => x.id === id);
        if (!p) return undefined;
        // Same-named preparation in the order's hotel takes precedence (recipes are global per menu item).
        const local = prepState.preps.find((x) => x.hotel === o.restaurant && x.name === p.name) ?? p;
        return { id: local.id, name: local.name, unit: local.unit, unitCost: latestUnitCost(prepState.batches, local.id) };
      };
      let totalCost = 0;
      const lines: EPOSOrderLine[] = o.lines.map((l) => {
        const item = MENU_ITEMS.find((m) => m.id === l.menuItemId);
        if (!item || o.status === 'cancelled') return o.status === 'cancelled' ? { ...l, recipeStatus: 'mapped', consumption: [] } : l;
        const result = computeConsumption([{ menuItemId: item.id, quantity: l.quantity, modifierIds: l.modifierIds ?? [] }], state.recipes, materialOf, prepOf);
        if (result.unmappedItems.length > 0) return { ...l, recipeStatus: 'unmapped', consumption: [] };
        totalCost += result.totalCost;
        const consumption: RecipeConsumptionLine[] = result.lines.map((c, i) => ({
          id: `rcl-${l.id}-${i}`,
          ingredientName: c.name,
          quantity: Number(c.quantity.toFixed(4)),
          unit: c.unit,
          totalIngredientCost: c.cost,
          fefoAllocations: [],
        }));
        return { ...l, recipeStatus: 'mapped', consumption };
      });
      const anyMapped = lines.some((l) => l.recipeStatus === 'mapped' && l.consumption.length > 0);
      const allMapped = lines.every((l) => l.recipeStatus === 'mapped');
      const pct = foodCostPct(totalCost, o.totalSelling);
      return {
        ...o,
        lines,
        totalRecipeCost: totalCost,
        foodCostPct: totalCost > 0 ? pct : 0,
        grossMargin: totalCost > 0 ? 100 - pct : 0,
        processingNote:
          o.status === 'completed' && allMapped && anyMapped
            ? o.isDuplicate
              ? o.processingNote
              : 'Order processed. Raw materials deducted from approved recipes and selected modifiers; consumption recorded against this order.'
            : o.processingNote,
      };
    });
  }, [state.recipes, materialOf, prepState.preps, prepState.batches]);

  useEffect(() => {
    if (!hydrated) return;
    for (const o of orders) {
      if (o.isDuplicate) continue; // duplicate events never deduct
      if (o.status === 'completed') {
        const lines = o.lines.flatMap((l) => l.consumption);
        if (lines.length === 0) continue;
        const entryLines = lines.map((c) => {
          const m = state.materials.find((x) => x.name === c.ingredientName);
          const p = !m ? prepState.preps.find((x) => x.hotel === o.restaurant && x.name === c.ingredientName) : undefined;
          return { sku: m?.sku ?? p?.id ?? c.ingredientName, name: c.ingredientName, unit: (m?.unit ?? p?.unit ?? 'g') as StockUnit, quantity: c.quantity, cost: c.totalIngredientCost };
        });
        recordConsumption({ orderId: o.orderId, restaurant: o.restaurant, at: new Date().toISOString(), reversed: false, lines: entryLines });
      } else if (o.status === 'cancelled') {
        reverseConsumption(o.orderId);
      }
    }
  }, [orders, hydrated, state.materials, prepState.preps, recordConsumption, reverseConsumption]);

  return orders;
}
