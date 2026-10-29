'use client';

import React, { useMemo, useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { CATALOGUE, CATEGORIES, CatalogueItem } from './purchaseStore';

interface ItemPickerProps {
  onPick: (item: CatalogueItem) => void;
  pickedSkus: string[];
  placeholder?: string;
}

export default function ItemPicker({ onPick, pickedSkus, placeholder = 'Search items by name or SKU...' }: ItemPickerProps) {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const results = useMemo(() => {
    return CATALOGUE.filter((c) => {
      const matchCat = category === 'All' || c.category === category;
      const q = search.trim().toLowerCase();
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.sku.toLowerCase().includes(q);
      return matchCat && matchSearch && !pickedSkus.includes(c.sku);
    });
  }, [category, search, pickedSkus]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={category === c ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '5px 12px', fontSize: 12 }}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
        <input
          className="input-field"
          style={{ paddingLeft: 32 }}
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div
        className="grid gap-2 overflow-y-auto"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', maxHeight: 220 }}
      >
        {results.length === 0 && (
          <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', padding: 8 }}>No matching items.</p>
        )}
        {results.map((item) => (
          <button
            key={item.sku}
            type="button"
            onClick={() => onPick(item)}
            className="text-left rounded-lg border transition-colors"
            style={{ padding: '10px 12px', borderColor: 'var(--border)', background: 'var(--card)', cursor: 'pointer' }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold truncate" style={{ fontSize: 13 }}>{item.name}</span>
              <Plus size={14} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
              {item.sku} · {item.category} · £{item.unitCost.toFixed(2)}/{item.unit}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
