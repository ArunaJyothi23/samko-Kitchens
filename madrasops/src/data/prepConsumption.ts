import { EPOSOrder } from '@/app/epos-orders/components/eposData';
import { PrepConsumptionInput, Preparation, ProductionBatch } from './prepStore';

/**
 * Converts hydrated EPOS orders into prepared-inventory consumption inputs.
 * Prepared lines are identified by the preparation name on a consumption line that matches a
 * known preparation for that hotel – raw materials never share names with preparations
 * (enforced when preparations are created), so there is no double deduction.
 */
export function buildPrepOrderInputs(orders: EPOSOrder[], preps: Preparation[], _batches: ProductionBatch[]): PrepConsumptionInput[] {
  const byKey = new Map(preps.map((p) => [`${p.hotel}|${p.name}`, p]));
  return orders.map((o) => ({
    orderId: o.orderId,
    hotel: o.restaurant,
    orderTime: o.orderTime,
    status: o.status,
    isDuplicate: !!o.isDuplicate,
    lines: o.lines.map((l) => ({
      menuItem: l.menuItem,
      menuItemId: l.menuItemId,
      prepConsumption: l.consumption
        .map((c) => {
          const p = byKey.get(`${o.restaurant}|${c.ingredientName}`);
          return p ? { prepId: p.id, quantity: c.quantity } : null;
        })
        .filter((x): x is { prepId: string; quantity: number } => x !== null),
    })),
  }));
}

/** Raw-material consumption lines only (preparations are excluded so raw inventory is never double-deducted). */
export function isPrepConsumption(order: EPOSOrder, preps: Preparation[], ingredientName: string): boolean {
  return preps.some((p) => p.hotel === order.restaurant && p.name === ingredientName);
}
