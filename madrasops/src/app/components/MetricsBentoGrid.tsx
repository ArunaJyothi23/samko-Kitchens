'use client';

import React from 'react';
import { TrendingDown, Package, AlertTriangle, Clock, Truck, FlaskConical, Zap, ArrowUpRight, ArrowDownRight, ShoppingBag, PoundSterling, Boxes } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

type TrendDir = 'up-bad' | 'up-good' | 'down-good' | 'neutral';

interface Metric {
  id: string;
  label: string;
  value: string;
  subValue: string;
  trend: string;
  trendDir: TrendDir;
  icon: React.ReactNode;
  cardClass: string;
  iconBg: string;
  iconColor: string;
  hero: boolean;
  note?: string;
}

const gbp = (n: number) => `£${Math.round(n).toLocaleString('en-GB')}`;
const gbp2 = (n: number) => `£${n.toFixed(2)}`;

/** Per-hotel daily figures (demo data). Consolidated view = sum of the two hotels. */
function hotelFigures(scale: number, foodCostPct: number) {
  const sales = 1248 * scale;
  const purchases = 520 * scale;
  const consumption = sales * (foodCostPct / 100);
  const wastage = 34.2 * scale;
  const stock = 1842 * scale;
  return {
    sales,
    purchases,
    consumption,
    foodCost: consumption,
    wastage,
    stock,
    orders: Math.round(96 * scale),
    nearExpiry: 3,
    inTransit: 182 * scale,
    unmapped: 5,
    grossProfit: sales - consumption - wastage,
  };
}

function buildMetrics(scope: string | null): Metric[] {
  const hotels = scope ? NEW_RESTAURANTS.filter((r) => r.name === scope) : NEW_RESTAURANTS;
  const figs = hotels.map((h) => hotelFigures(h.scale, h.foodCostPct));
  const sum = (k: keyof ReturnType<typeof hotelFigures>) => figs.reduce((s, f) => s + (f[k] as number), 0);

  const sales = sum('sales');
  const purchases = sum('purchases');
  const consumption = sum('consumption');
  const wastage = sum('wastage');
  const stock = sum('stock');
  const grossProfit = sum('grossProfit');
  const orders = sum('orders');
  const foodCostPct = sales > 0 ? (consumption / sales) * 100 : 0;
  const label = scope ?? 'Both hotels';

  return [
    {
      id: 'metric-food-cost',
      label: 'Food Cost %',
      value: `${foodCostPct.toFixed(1)}%`,
      subValue: `Target: 30% · ${label}`,
      trend: foodCostPct > 30 ? `+${(foodCostPct - 30).toFixed(1)}pp vs target` : 'Within target',
      trendDir: foodCostPct > 30 ? 'up-bad' : 'down-good',
      icon: <TrendingDown size={20} />,
      cardClass: foodCostPct > 30 ? 'metric-card-alert' : 'metric-card-success',
      iconBg: foodCostPct > 30 ? '#FEE2E2' : '#DCFCE7',
      iconColor: foodCostPct > 30 ? '#991B1B' : '#166534',
      hero: true,
      note: foodCostPct > 30 ? 'Above target' : 'On target',
    },
    {
      id: 'metric-epos-sales',
      label: 'Total EPOS Sales',
      value: gbp(sales),
      subValue: `${orders} orders processed`,
      trend: '+14% vs yesterday',
      trendDir: 'up-good',
      icon: <Zap size={18} />,
      cardClass: 'metric-card-success',
      iconBg: '#DCFCE7',
      iconColor: '#166534',
      hero: false,
    },
    {
      id: 'metric-purchases',
      label: 'Total Purchases',
      value: gbp(purchases),
      subValue: 'Goods received & supplier invoices',
      trend: '+£48 vs avg',
      trendDir: 'neutral',
      icon: <ShoppingBag size={18} />,
      cardClass: 'metric-card',
      iconBg: '#DBEAFE',
      iconColor: '#1E40AF',
      hero: false,
    },
    {
      id: 'metric-food-cost-value',
      label: 'Food Cost',
      value: gbp(consumption),
      subValue: 'Recipe-based consumption cost',
      trend: `${foodCostPct.toFixed(1)}% of sales`,
      trendDir: 'neutral',
      icon: <PoundSterling size={18} />,
      cardClass: 'metric-card',
      iconBg: '#FEF3C7',
      iconColor: '#92400E',
      hero: false,
    },
    {
      id: 'metric-stock-val',
      label: 'Inventory Valuation',
      value: gbp(stock),
      subValue: `${label} stock`,
      trend: '+£96 vs yesterday',
      trendDir: 'up-good',
      icon: <Package size={18} />,
      cardClass: 'metric-card',
      iconBg: '#DBEAFE',
      iconColor: '#1E40AF',
      hero: false,
    },
    {
      id: 'metric-consumption',
      label: 'Stock Consumption',
      value: gbp(consumption),
      subValue: 'Deducted via approved recipes',
      trend: 'FEFO allocation',
      trendDir: 'neutral',
      icon: <Boxes size={18} />,
      cardClass: 'metric-card',
      iconBg: '#EDE9FE',
      iconColor: '#5B21B6',
      hero: false,
    },
    {
      id: 'metric-wastage',
      label: 'Wastage Value (Today)',
      value: gbp2(wastage),
      subValue: `${sales > 0 ? ((wastage / sales) * 100).toFixed(1) : '0.0'}% of sales`,
      trend: '+£8 vs avg',
      trendDir: 'up-bad',
      icon: <AlertTriangle size={18} />,
      cardClass: 'metric-card-alert',
      iconBg: '#FEE2E2',
      iconColor: '#991B1B',
      hero: false,
    },
    {
      id: 'metric-gross-profit',
      label: 'Gross Profit',
      value: gbp(grossProfit),
      subValue: `${sales > 0 ? ((grossProfit / sales) * 100).toFixed(1) : '0.0'}% margin`,
      trend: 'Sales − food cost − wastage',
      trendDir: 'neutral',
      icon: <PoundSterling size={18} />,
      cardClass: 'metric-card-success',
      iconBg: '#DCFCE7',
      iconColor: '#166534',
      hero: false,
    },
    {
      id: 'metric-near-expiry',
      label: 'Near-Expiry Batches',
      value: String(sum('nearExpiry')),
      subValue: 'Expiring within 3 days',
      trend: '2 within 24 hours',
      trendDir: 'up-bad',
      icon: <Clock size={18} />,
      cardClass: 'metric-card-warning',
      iconBg: '#FEF3C7',
      iconColor: '#92400E',
      hero: false,
    },
    {
      id: 'metric-in-transit',
      label: 'Stock in Transit',
      value: gbp(sum('inTransit')),
      subValue: 'Inbound dispatches',
      trend: 'Due today',
      trendDir: 'neutral',
      icon: <Truck size={18} />,
      cardClass: 'metric-card-transit',
      iconBg: '#EDE9FE',
      iconColor: '#5B21B6',
      hero: false,
    },
    {
      id: 'metric-unmapped',
      label: 'Unmapped EPOS Items',
      value: String(sum('unmapped')),
      subValue: 'Stock not deducted',
      trend: 'Action required',
      trendDir: 'up-bad',
      icon: <FlaskConical size={18} />,
      cardClass: 'metric-card-alert',
      iconBg: '#FEE2E2',
      iconColor: '#991B1B',
      hero: false,
    },
  ];
}

function TrendChip({ dir, text }: { dir: string; text: string }) {
  if (dir === 'up-bad')
    return (
      <span className="flex items-center gap-0.5" style={{ fontSize: 11.5, color: '#991B1B', fontWeight: 600 }}>
        <ArrowUpRight size={12} /> {text}
      </span>
    );
  if (dir === 'up-good')
    return (
      <span className="flex items-center gap-0.5" style={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>
        <ArrowUpRight size={12} /> {text}
      </span>
    );
  if (dir === 'down-good')
    return (
      <span className="flex items-center gap-0.5" style={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>
        <ArrowDownRight size={12} /> {text}
      </span>
    );
  return <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>{text}</span>;
}

export default function MetricsBentoGrid() {
  const scope = useScopedRestaurant();
  const scoped = buildMetrics(scope);
  const hero = scoped.find((m) => m.hero)!;
  const rest = scoped.filter((m) => !m.hero);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
      {/* Hero card — spans 2 cols */}
      <div className={`${hero.cardClass} col-span-1 md:col-span-2 flex flex-col justify-between`} style={{ minHeight: 140 }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="label-text" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {hero.label}
            </p>
            <div className="metric-value mt-1" style={{ fontSize: 40 }}>
              {hero.value}
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', marginTop: 4 }}>{hero.subValue}</p>
          </div>
          <div
            className="rounded-xl flex items-center justify-center shrink-0"
            style={{ width: 44, height: 44, background: hero.iconBg, color: hero.iconColor }}
          >
            {hero.icon}
          </div>
        </div>
        <div className="flex items-center justify-between mt-3">
          <TrendChip dir={hero.trendDir} text={hero.trend} />
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: hero.iconBg, color: hero.iconColor, fontSize: 11 }}
          >
            {hero.note}
          </span>
        </div>
      </div>

      {/* Remaining cards */}
      {rest.map((m) => (
        <div key={m.id} className={`${m.cardClass} flex flex-col justify-between`} style={{ minHeight: 120 }}>
          <div className="flex items-start justify-between">
            <p className="label-text" style={{ fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {m.label}
            </p>
            <div
              className="rounded-lg flex items-center justify-center shrink-0"
              style={{ width: 34, height: 34, background: m.iconBg, color: m.iconColor }}
            >
              {m.icon}
            </div>
          </div>
          <div>
            <div className="metric-value mt-1" style={{ fontSize: 26 }}>
              {m.value}
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--muted-foreground)', marginTop: 2 }}>{m.subValue}</p>
            <div className="mt-2">
              <TrendChip dir={m.trendDir} text={m.trend} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}