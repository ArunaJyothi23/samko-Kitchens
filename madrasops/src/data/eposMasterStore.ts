'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  RAW_MATERIALS,
  RawMaterial,
  Recipe,
  RecipeVersion,
  StockUnit,
  emptyVersion,
} from './eposMaster';
import { applyApproxCosts, buildSeedRecipes } from './seedData';

export interface AuditEntry {
  id: string;
  at: string;
  by: string;
  entity: 'recipe' | 'ingredient-cost' | 'ingredient';
  ref: string;
  detail: string;
}

export interface ProcessedConsumption {
  orderId: string; // idempotency key
  restaurant: string;
  at: string;
  reversed: boolean;
  lines: { sku: string; name: string; unit: StockUnit; quantity: number; cost: number }[];
}

export interface MasterState {
  materials: RawMaterial[];
  inactive: string[]; // deactivated skus
  recipes: Recipe[];
  audit: AuditEntry[];
  processed: ProcessedConsumption[];
}

const KEY = 'samko-epos-master-v1';
const EVENT = 'samko-epos-master-changed';

const SEEDED_MATERIALS = applyApproxCosts(RAW_MATERIALS);
const SEEDED_RECIPES = buildSeedRecipes();
const INITIAL: MasterState = { materials: SEEDED_MATERIALS, inactive: [], recipes: SEEDED_RECIPES, audit: [], processed: [] };

function read(): MasterState {
  let stored: Partial<MasterState> = {};
  let hadStorage = false;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      stored = JSON.parse(raw) as Partial<MasterState>;
      hadStorage = true;
    }
  } catch {
    stored = {};
  }

  const baseMaterials = stored.materials && stored.materials.length ? stored.materials : RAW_MATERIALS;
  // Only fill costs that are still blank – never overwrite a cost an admin has entered.
  const materials = applyApproxCosts(baseMaterials);

  // Add any seeded recipe whose target has no recipe yet. Existing recipes are never replaced.
  const storedRecipes = stored.recipes ?? [];
  const have = new Set(storedRecipes.map((r) => r.targetId));
  const missing = SEEDED_RECIPES.filter((r) => !have.has(r.targetId));
  const recipes = missing.length > 0 ? [...storedRecipes, ...missing] : storedRecipes;

  const next: MasterState = {
    materials,
    inactive: stored.inactive ?? [],
    recipes,
    audit: stored.audit ?? [],
    processed: stored.processed ?? [],
  };

  const costsChanged = materials.some((m, i) => m.unitCost !== baseMaterials[i]?.unitCost);
  if (!hadStorage || missing.length > 0 || costsChanged) {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // storage unavailable – seeded state is still returned for this session
    }
  }
  return next;
}

function write(s: MasterState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // storage unavailable
  }
}

function uid() {
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function log(s: MasterState, by: string, entity: AuditEntry['entity'], ref: string, detail: string): MasterState {
  return { ...s, audit: [{ id: uid(), at: new Date().toISOString(), by, entity, ref, detail }, ...s.audit].slice(0, 300) };
}

export function useEposMaster() {
  const [state, setState] = useState<MasterState>(INITIAL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sync = () => setState(read());
    sync();
    setHydrated(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const materialOf = useCallback((sku: string) => state.materials.find((m) => m.sku === sku), [state.materials]);

  const getRecipe = useCallback((targetId: string) => state.recipes.find((r) => r.targetId === targetId), [state.recipes]);

  const saveVersion = useCallback((targetId: string, kind: 'item' | 'modifier', v: RecipeVersion, by: string) => {
    const cur = read();
    const existing = cur.recipes.find((r) => r.targetId === targetId);
    const versions = existing ? [...existing.versions.filter((x) => x.version !== v.version), v] : [v];
    const recipes = existing
      ? cur.recipes.map((r) => (r.targetId === targetId ? { ...r, versions } : r))
      : [...cur.recipes, { targetId, kind, versions }];
    write(log({ ...cur, recipes }, by, 'recipe', targetId, `Saved v${v.version} (${v.status}) with ${v.lines.length} ingredient line(s)`));
  }, []);

  const newVersion = useCallback((targetId: string, kind: 'item' | 'modifier', by: string): RecipeVersion => {
    const cur = read();
    const existing = cur.recipes.find((r) => r.targetId === targetId);
    const next = (existing?.versions.reduce((m, x) => Math.max(m, x.version), 0) ?? 0) + 1;
    const base = existing?.versions.find((x) => x.version === next - 1);
    return base ? { ...base, version: next, status: 'draft', updatedAt: new Date().toISOString(), updatedBy: by } : emptyVersion(next, by);
  }, []);

  const setUnitCost = useCallback((sku: string, unitCost: number, by: string) => {
    const cur = read();
    const m = cur.materials.find((x) => x.sku === sku);
    if (!m) return;
    const materials = cur.materials.map((x) => (x.sku === sku ? { ...x, unitCost } : x));
    write(log({ ...cur, materials }, by, 'ingredient-cost', sku, `${m.name}: cost £${m.unitCost.toFixed(4)} → £${unitCost.toFixed(4)} per ${m.unit}`));
  }, []);

  const addMaterial = useCallback((m: RawMaterial, by: string) => {
    const cur = read();
    if (cur.materials.some((x) => x.name.toLowerCase() === m.name.toLowerCase())) return false;
    write(log({ ...cur, materials: [...cur.materials, m] }, by, 'ingredient', m.sku, `Added ingredient ${m.name}`));
    return true;
  }, []);

  const updateMaterial = useCallback((sku: string, patch: Partial<RawMaterial>, by: string) => {
    const cur = read();
    const materials = cur.materials.map((x) => (x.sku === sku ? { ...x, ...patch } : x));
    write(log({ ...cur, materials }, by, 'ingredient', sku, `Edited ingredient ${patch.name ?? sku}`));
  }, []);

  const toggleActive = useCallback((sku: string, by: string) => {
    const cur = read();
    const isInactive = cur.inactive.includes(sku);
    const inactive = isInactive ? cur.inactive.filter((x) => x !== sku) : [...cur.inactive, sku];
    write(log({ ...cur, inactive }, by, 'ingredient', sku, isInactive ? 'Reactivated' : 'Deactivated'));
  }, []);

  /** Idempotent: a repeat call with the same orderId is ignored. */
  const recordConsumption = useCallback((entry: ProcessedConsumption): boolean => {
    const cur = read();
    if (cur.processed.some((p) => p.orderId === entry.orderId)) return false;
    write({ ...cur, processed: [entry, ...cur.processed].slice(0, 500) });
    return true;
  }, []);

  /** Reverse stock for cancelled / voided / refunded orders (only once). */
  const reverseConsumption = useCallback((orderId: string): boolean => {
    const cur = read();
    const hit = cur.processed.find((p) => p.orderId === orderId);
    if (!hit || hit.reversed) return false;
    write({ ...cur, processed: cur.processed.map((p) => (p.orderId === orderId ? { ...p, reversed: true } : p)) });
    return true;
  }, []);

  return { state, hydrated, materialOf, getRecipe, saveVersion, newVersion, setUnitCost, addMaterial, updateMaterial, toggleActive, recordConsumption, reverseConsumption };
}
