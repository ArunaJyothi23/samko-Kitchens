'use client';

import React from 'react';
import { TrendingDown, Package, AlertTriangle, Clock, Truck, FlaskConical, Zap, ArrowUpRight, ArrowDownRight,  } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

// Grid plan: 8 cards → grid-cols-4 → row1: hero(2 cols) + 2 regular, row2: 4 regular
// hero = Food Cost % (North Star), spans 2 cols

const metrics = [
  {
    id: 'metric-food-cost',
    label: 'Food Cost %',
    value: '31.4%',
    subValue: 'Target: 30%',
    trend: '+1.4pp vs last week',
    trendDir: 'up-bad',
    icon: <TrendingDown size={20} />,
    cardClass: 'metric-card-alert',
    iconBg: '#FEE2E2',
    iconColor: '#991B1B',
    hero: true,
    note: 'Above target — 4 locations',
  },
  {
    id: 'metric-stock-val',
    label: 'Total Stock Valuation',
    value: '£4,821',
    subValue: 'Across all locations',
    trend: '+£312 vs yesterday',
    trendDir: 'up-good',
    icon: <Package size={18} />,
    cardClass: 'metric-card',
    iconBg: '#DBEAFE',
    iconColor: '#1E40AF',
    hero: false,
  },
  {
    id: 'metric-epos-sales',
    label: "Today\'s EPOS Sales",
    value: '£3,248',
    subValue: '247 orders processed',
    trend: '+18% vs yesterday',
    trendDir: 'up-good',
    icon: <Zap size={18} />,
    cardClass: 'metric-card-success',
    iconBg: '#DCFCE7',
    iconColor: '#166534',
    hero: false,
  },
  {
    id: 'metric-wastage',
    label: 'Wastage Value (Today)',
    value: '£87.40',
    subValue: '2.7% of sales',
    trend: '+£22 vs avg',
    trendDir: 'up-bad',
    icon: <AlertTriangle size={18} />,
    cardClass: 'metric-card-alert',
    iconBg: '#FEE2E2',
    iconColor: '#991B1B',
    hero: false,
  },
  {
    id: 'metric-near-expiry',
    label: 'Near-Expiry Batches',
    value: '7',
    subValue: 'Expiring within 3 days',
    trend: '3 within 24 hours',
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
    value: '£642',
    subValue: '3 dispatches active',
    trend: '2 due today',
    trendDir: 'neutral',
    icon: <Truck size={18} />,
    cardClass: 'metric-card-transit',
    iconBg: '#EDE9FE',
    iconColor: '#5B21B6',
    hero: false,
  },
  {
    id: 'metric-production',
    label: 'Active Production Batches',
    value: '5',
    subValue: '2 pending approval',
    trend: 'Avg yield 94.2%',
    trendDir: 'neutral',
    icon: <FlaskConical size={18} />,
    cardClass: 'metric-card',
    iconBg: '#DBEAFE',
    iconColor: '#1E40AF',
    hero: false,
  },
  {
    id: 'metric-unmapped',
    label: 'Unmapped EPOS Items',
    value: '12',
    subValue: 'Stock not deducted',
    trend: '3 high-volume items',
    trendDir: 'up-bad',
    icon: <AlertTriangle size={18} />,
    cardClass: 'metric-card-alert',
    iconBg: '#FEE2E2',
    iconColor: '#991B1B',
    hero: false,
  },
];

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

const restaurantMetrics: Record<string, Record<string, { value?: string; subValue?: string; trend?: string; note?: string }>> = {
  Hounslow: {
    'metric-food-cost': { value: '31.4%', note: 'Above target' },
    'metric-stock-val': { value: '£1,842', subValue: 'Hounslow stock', trend: '+£96 vs yesterday' },
    'metric-epos-sales': { value: '£1,248', subValue: '96 orders processed', trend: '+14% vs yesterday' },
    'metric-wastage': { value: '£34.20', subValue: '2.7% of sales', trend: '+£8 vs avg' },
    'metric-near-expiry': { value: '3', trend: '2 within 24 hours' },
    'metric-in-transit': { value: '£182', subValue: '1 dispatch inbound', trend: '1 due today' },
    'metric-production': { value: '—', subValue: 'Central kitchen only', trend: 'Not applicable' },
    'metric-unmapped': { value: '5', trend: '2 high-volume items' },
  },
  Reading: {
    'metric-food-cost': { value: '29.8%', note: 'On target' },
    'metric-stock-val': { value: '£1,104', subValue: 'Reading stock', trend: '+£64 vs yesterday' },
    'metric-epos-sales': { value: '£892', subValue: '71 orders processed', trend: '+11% vs yesterday' },
    'metric-wastage': { value: '£21.80', subValue: '2.4% of sales', trend: '+£3 vs avg' },
    'metric-near-expiry': { value: '2', trend: '1 within 24 hours' },
    'metric-in-transit': { value: '£96', subValue: '1 dispatch inbound', trend: '1 due today' },
    'metric-production': { value: '—', subValue: 'Central kitchen only', trend: 'Not applicable' },
    'metric-unmapped': { value: '3', trend: '1 high-volume item' },
  },
  Dartford: {
    'metric-food-cost': { value: '33.2%', note: 'Above target' },
    'metric-stock-val': { value: '£982', subValue: 'Dartford stock', trend: '+£41 vs yesterday' },
    'metric-epos-sales': { value: '£648', subValue: '49 orders processed', trend: '+9% vs yesterday' },
    'metric-wastage': { value: '£18.40', subValue: '2.8% of sales', trend: '+£6 vs avg' },
    'metric-near-expiry': { value: '1', trend: '1 within 24 hours' },
    'metric-in-transit': { value: '£74', subValue: '1 dispatch inbound', trend: '1 due today' },
    'metric-production': { value: '—', subValue: 'Central kitchen only', trend: 'Not applicable' },
    'metric-unmapped': { value: '2', trend: '1 high-volume item' },
  },
  Leicester: {
    'metric-food-cost': { value: '30.1%', note: 'Near target' },
    'metric-stock-val': { value: '£893', subValue: 'Leicester stock', trend: '+£38 vs yesterday' },
    'metric-epos-sales': { value: '£460', subValue: '31 orders processed', trend: '+7% vs yesterday' },
    'metric-wastage': { value: '£13.00', subValue: '2.8% of sales', trend: '+£2 vs avg' },
    'metric-near-expiry': { value: '1', trend: '0 within 24 hours' },
    'metric-in-transit': { value: '£58', subValue: '1 dispatch inbound', trend: '1 due today' },
    'metric-production': { value: '—', subValue: 'Central kitchen only', trend: 'Not applicable' },
    'metric-unmapped': { value: '2', trend: '1 high-volume item' },
  },
  ...Object.fromEntries(
    NEW_RESTAURANTS.map((r) => {
      const sales = Math.round(1248 * r.scale);
      const orders = Math.round(96 * r.scale);
      const stock = Math.round(1842 * r.scale);
      const wastage = (34.2 * r.scale).toFixed(2);
      return [
        r.name,
        {
          'metric-food-cost': { value: `${r.foodCostPct}%`, note: r.foodCostPct > 30 ? 'Above target' : 'On target' },
          'metric-stock-val': { value: `£${stock.toLocaleString('en-GB')}`, subValue: `${r.name} stock`, trend: `+£${Math.round(96 * r.scale)} vs yesterday` },
          'metric-epos-sales': { value: `£${sales.toLocaleString('en-GB')}`, subValue: `${orders} orders processed`, trend: '+10% vs yesterday' },
          'metric-wastage': { value: `£${wastage}`, subValue: '2.6% of sales', trend: `+£${Math.round(6 * r.scale)} vs avg` },
          'metric-near-expiry': { value: '2', trend: '1 within 24 hours' },
          'metric-in-transit': { value: `£${Math.round(182 * r.scale)}`, subValue: '1 dispatch inbound', trend: '1 due today' },
          'metric-production': { value: '—', subValue: 'Central kitchen only', trend: 'Not applicable' },
          'metric-unmapped': { value: '3', trend: '1 high-volume item' },
        },
      ];
    })
  ),
};

export default function MetricsBentoGrid() {
  const scope = useScopedRestaurant();
  const scoped: typeof metrics = scope
    ? metrics.map((m) => ({ ...m, ...(restaurantMetrics[scope]?.[m.id] ?? {}) }))
    : metrics;
  const hero = scoped.find((m) => m.hero)!;
  const rest = scoped
    .filter((m) => !m.hero)
    .filter((m) => !(scope && m.id === 'metric-production'));

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
            style={{ background: '#FEE2E2', color: '#991B1B', fontSize: 11 }}
          >
            {hero.note}
          </span>
        </div>
      </div>

      {/* Remaining 6 cards */}
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