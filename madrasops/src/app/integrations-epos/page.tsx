'use client';

import React, { useEffect, useMemo, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Settings, Plus, Activity, Clock, Search, X } from 'lucide-react';
import { MENU_ITEMS, MENU_CATEGORIES, activeVersion } from '@/data/eposMaster';
import { useEposMaster } from '@/data/eposMasterStore';

interface Integration {
  id: string;
  name: string;
  provider: string;
  restaurant: string;
  status: 'connected' | 'error' | 'pending' | 'disconnected';
  lastEvent: string;
  lastEventTime: string;
  eventsToday: number;
  failedEvents: number;
  webhookUrl: string;
  menuMapped: number;
  menuTotal: number;
}

const integrations: Integration[] = [
  { id: 'INT-001', name: 'Stanhill Hotel EPOS', provider: 'EPOS Provider (Configure)', restaurant: 'Stanhill Hotel Limited', status: 'pending', lastEvent: 'Awaiting configuration', lastEventTime: '—', eventsToday: 0, failedEvents: 0, webhookUrl: '/api/webhooks/epos/stanhill', menuMapped: 48, menuTotal: 107 },
  { id: 'INT-002', name: 'Warren House Hotel EPOS', provider: 'EPOS Provider (Configure)', restaurant: 'Warren House Hotel Limited', status: 'pending', lastEvent: 'Awaiting configuration', lastEventTime: '—', eventsToday: 0, failedEvents: 0, webhookUrl: '/api/webhooks/epos/warren-house', menuMapped: 32, menuTotal: 107 },
];

const recentEvents = [
  { id: 'EVT-001', type: 'order.completed', orderId: 'SK-STH-10482', restaurant: 'Stanhill Hotel Limited', menuItem: 'Chicken Burger', time: '2026-10-11 12:34', status: 'processed', stockDeducted: true },
  { id: 'EVT-002', type: 'order.completed', orderId: 'SK-STH-10483', restaurant: 'Stanhill Hotel Limited', menuItem: 'Caesar Salad', time: '2026-10-11 12:41', status: 'processed', stockDeducted: true },
  { id: 'EVT-003', type: 'order.completed', orderId: 'SK-STH-10484', restaurant: 'Stanhill Hotel Limited', menuItem: 'Chilli Paneer', time: '2026-10-11 12:55', status: 'unmapped', stockDeducted: false },
  { id: 'EVT-004', type: 'order.cancelled', orderId: 'SK-STH-10480', restaurant: 'Stanhill Hotel Limited', menuItem: 'Beef Cheeseburger', time: '2026-10-11 12:20', status: 'reversed', stockDeducted: false },
  { id: 'EVT-005', type: 'order.completed', orderId: 'SK-WRH-10201', restaurant: 'Warren House Hotel Limited', menuItem: 'Pasta Carbonara', time: '2026-10-11 13:02', status: 'processed', stockDeducted: true },
];

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  connected: { icon: <CheckCircle size={14} />, color: '#166534', bg: '#DCFCE7', label: 'Connected' },
  error: { icon: <XCircle size={14} />, color: '#991B1B', bg: '#FEE2E2', label: 'Error' },
  pending: { icon: <Clock size={14} />, color: '#854D0E', bg: '#FEF9C3', label: 'Pending Setup' },
  disconnected: { icon: <AlertTriangle size={14} />, color: '#6B7280', bg: '#F3F4F6', label: 'Not Configured' },
};

const eventStatusColors: Record<string, { bg: string; text: string }> = {
  processed: { bg: '#DCFCE7', text: '#166534' },
  unmapped: { bg: '#FEF9C3', text: '#854D0E' },
  reversed: { bg: '#DBEAFE', text: '#1E40AF' },
  failed: { bg: '#FEE2E2', text: '#991B1B' },
};

const MAPPING_KEY = 'samko-epos-menu-mapping-v1';
const HOTEL_CODE: Record<string, string> = { 'INT-001': 'STH', 'INT-002': 'WRH' };

type MappingStore = Record<string, Record<string, string>>; // integrationId -> menuItemId -> EPOS item code

function readMappings(): MappingStore {
  try {
    const raw = localStorage.getItem(MAPPING_KEY);
    return raw ? (JSON.parse(raw) as MappingStore) : {};
  } catch {
    return {};
  }
}

function defaultCode(integrationId: string, menuId: string) {
  return `${HOTEL_CODE[integrationId] ?? 'EPOS'}-${menuId.replace('M-', '')}`;
}

export default function IntegrationsEPOSPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [mappingFor, setMappingFor] = useState<Integration | null>(null);
  const [mappings, setMappings] = useState<MappingStore>({});
  const [mapSearch, setMapSearch] = useState('');
  const [mapCategory, setMapCategory] = useState('All');
  const [mapFilter, setMapFilter] = useState<'all' | 'mapped' | 'unmapped'>('all');
  const { state: master } = useEposMaster();

  useEffect(() => {
    setMappings(readMappings());
  }, []);

  const hasRecipe = useMemo(() => {
    const set = new Set<string>();
    master.recipes.forEach((r) => {
      if (r.kind === 'item') {
        const v = activeVersion(r);
        if (v && v.lines.length > 0) set.add(r.targetId);
      }
    });
    return set;
  }, [master.recipes]);

  const isMapped = (integrationId: string, menuId: string) => {
    const code = mappings[integrationId]?.[menuId];
    return !!code && code.trim().length > 0;
  };

  const mappedCount = (integration: Integration) => {
    const stored = mappings[integration.id];
    if (!stored) return integration.menuMapped;
    return MENU_ITEMS.filter((m) => isMapped(integration.id, m.id)).length;
  };

  const saveMappings = (next: MappingStore) => {
    setMappings(next);
    try {
      localStorage.setItem(MAPPING_KEY, JSON.stringify(next));
    } catch {
      // storage unavailable
    }
  };

  const setCode = (integrationId: string, menuId: string, code: string) => {
    const cur = mappings[integrationId] ?? {};
    saveMappings({ ...mappings, [integrationId]: { ...cur, [menuId]: code } });
  };

  const autoMapAll = (integrationId: string) => {
    const cur: Record<string, string> = { ...(mappings[integrationId] ?? {}) };
    MENU_ITEMS.forEach((m) => {
      if (!cur[m.id] || !cur[m.id].trim()) cur[m.id] = defaultCode(integrationId, m.id);
    });
    saveMappings({ ...mappings, [integrationId]: cur });
  };

  const clearAll = (integrationId: string) => {
    saveMappings({ ...mappings, [integrationId]: {} });
  };

  const openMapping = (integration: Integration) => {
    setMapSearch('');
    setMapCategory('All');
    setMapFilter('all');
    setMappingFor(integration);
  };

  const filteredMenu = useMemo(() => {
    if (!mappingFor) return [];
    const q = mapSearch.trim().toLowerCase();
    return MENU_ITEMS.filter((m) => {
      if (mapCategory !== 'All' && m.category !== mapCategory) return false;
      if (q && !m.name.toLowerCase().includes(q) && !m.id.toLowerCase().includes(q)) return false;
      const mapped = !!mappings[mappingFor.id]?.[m.id]?.trim();
      if (mapFilter === 'mapped' && !mapped) return false;
      if (mapFilter === 'unmapped' && mapped) return false;
      return true;
    });
  }, [mappingFor, mapSearch, mapCategory, mapFilter, mappings]);

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Integrations & EPOS</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Configure EPOS connections, webhook endpoints and menu mappings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" style={{ padding: '8px 12px' }}><RefreshCw size={14} /> Refresh</button>
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => setShowConfig(true)}><Plus size={14} /> Add Integration</button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="mb-6 p-4 rounded-lg" style={{ background: '#FEF9C3', border: '1px solid #FDE68A' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={16} style={{ color: '#92400E', marginTop: 1, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>EPOS Integration Pending Configuration</p>
            <p style={{ fontSize: 12, color: '#78350F', marginTop: 3 }}>
              This module is ready to connect to your EPOS provider. Configure your provider credentials, webhook endpoint, and menu item mappings below. The system will not deduct stock from unmapped menu items.
            </p>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {integrations.map((integration) => {
          const sc = statusConfig[integration.status];
          return (
            <div key={integration.id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{integration.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>{integration.provider}</div>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                  {sc.icon} {sc.label}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2 rounded" style={{ background: 'var(--background)' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Events Today</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{integration.eventsToday}</div>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--background)' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Failed</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: integration.failedEvents > 0 ? '#991B1B' : 'var(--foreground)' }}>{integration.failedEvents}</div>
                </div>
                <div className="p-2 rounded" style={{ background: 'var(--background)' }}>
                  <div style={{ fontSize: 10, color: 'var(--muted-foreground)' }}>Menu Mapped</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: mappedCount(integration) < MENU_ITEMS.length ? '#92400E' : '#166534' }}>
                    {mappedCount(integration)}/{MENU_ITEMS.length}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 4 }}>Webhook Endpoint</div>
                <div style={{ fontSize: 11, fontFamily: 'monospace', padding: '6px 10px', borderRadius: 5, background: 'var(--background)', color: 'var(--muted-foreground)' }}>
                  {integration.webhookUrl}
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--muted-foreground)', marginBottom: 12 }}>
                Last event: {integration.lastEvent} · {integration.lastEventTime}
              </div>

              <div className="flex gap-2">
                <button className="btn-primary flex-1" style={{ padding: '7px', fontSize: 12 }} onClick={() => setSelectedIntegration(integration)}>
                  <Settings size={12} /> Configure
                </button>
                <button className="btn-secondary flex-1" style={{ padding: '7px', fontSize: 12 }} onClick={() => openMapping(integration)}>
                  Menu Mapping
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Events */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Activity size={15} style={{ color: 'var(--muted-foreground)' }} />
          <h3 style={{ fontSize: 14, fontWeight: 600 }}>Recent Webhook Events</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Type</th>
                <th>Order</th>
                <th>Hotel</th>
                <th>Menu Item</th>
                <th>Time</th>
                <th>Status</th>
                <th>Stock Deducted</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((event) => (
                <tr key={event.id}>
                  <td><span className="font-mono text-xs" style={{ color: 'var(--muted-foreground)' }}>{event.id}</span></td>
                  <td><span style={{ fontSize: 11, fontFamily: 'monospace', color: '#6366F1' }}>{event.type}</span></td>
                  <td><span className="font-mono" style={{ fontSize: 11 }}>{event.orderId}</span></td>
                  <td style={{ fontSize: 12 }}>{event.restaurant}</td>
                  <td style={{ fontSize: 12 }}>{event.menuItem}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{event.time}</td>
                  <td>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: eventStatusColors[event.status]?.bg || '#F3F4F6', color: eventStatusColors[event.status]?.text || '#6B7280', textTransform: 'capitalize' }}>
                      {event.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: event.stockDeducted ? '#166534' : '#991B1B', fontWeight: 600 }}>
                    {event.stockDeducted ? '✓ Yes' : '✗ No'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Menu Mapping Modal */}
      {mappingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setMappingFor(null)}>
          <div className="rounded-xl shadow-2xl flex flex-col" style={{ width: 'min(960px, 100%)', maxHeight: '90vh', background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Menu Mapping: {mappingFor.restaurant}</h2>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>
                  Link each menu item to its EPOS item code. Stock is only deducted for mapped items that have a recipe.
                </p>
              </div>
              <button className="btn-secondary" style={{ padding: 6 }} onClick={() => setMappingFor(null)} aria-label="Close"><X size={14} /></button>
            </div>

            <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="relative" style={{ minWidth: 200, flex: '1 1 200px' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--muted-foreground)' }} />
                <input className="input-field w-full" style={{ paddingLeft: 30 }} placeholder="Search menu item..." value={mapSearch} onChange={(e) => setMapSearch(e.target.value)} />
              </div>
              <select className="input-field" value={mapCategory} onChange={(e) => setMapCategory(e.target.value)}>
                <option value="All">All Categories</option>
                {MENU_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="input-field" value={mapFilter} onChange={(e) => setMapFilter(e.target.value as 'all' | 'mapped' | 'unmapped')}>
                <option value="all">All Items</option>
                <option value="mapped">Mapped</option>
                <option value="unmapped">Unmapped</option>
              </select>
              <button className="btn-primary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => autoMapAll(mappingFor.id)}>Auto-map all</button>
              <button className="btn-secondary" style={{ padding: '7px 12px', fontSize: 12 }} onClick={() => clearAll(mappingFor.id)}>Clear all</button>
            </div>

            <div className="px-5 py-2" style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              {mappedCount(mappingFor)} of {MENU_ITEMS.length} menu items mapped · Showing {filteredMenu.length}
            </div>

            <div className="overflow-auto flex-1 px-5 pb-4">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Menu Item</th>
                    <th>Category</th>
                    <th>Recipe</th>
                    <th>EPOS Item Code</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMenu.map((m) => {
                    const code = mappings[mappingFor.id]?.[m.id] ?? '';
                    const mapped = code.trim().length > 0;
                    const recipeOk = hasRecipe.has(m.id);
                    return (
                      <tr key={m.id}>
                        <td style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{m.category}</td>
                        <td style={{ fontSize: 12, color: recipeOk ? '#166534' : '#991B1B', fontWeight: 600 }}>{recipeOk ? '✓ Costed' : '✗ No recipe'}</td>
                        <td>
                          <input
                            className="input-field"
                            style={{ width: 150, fontFamily: 'monospace', fontSize: 12 }}
                            placeholder={defaultCode(mappingFor.id, m.id)}
                            value={code}
                            onChange={(e) => setCode(mappingFor.id, m.id, e.target.value)}
                          />
                        </td>
                        <td>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: mapped ? '#DCFCE7' : '#FEF9C3', color: mapped ? '#166534' : '#854D0E' }}>
                            {mapped ? 'Mapped' : 'Unmapped'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMenu.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-foreground)', padding: 24 }}>No menu items match the filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <button className="btn-primary" style={{ padding: '8px 16px' }} onClick={() => setMappingFor(null)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Config Modal */}
      {(selectedIntegration || showConfig) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => { setSelectedIntegration(null); setShowConfig(false); }}>
          <div className="rounded-xl shadow-2xl p-6" style={{ width: 520, background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {selectedIntegration ? `Configure: ${selectedIntegration.name}` : 'Add New Integration'}
            </h2>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 20 }}>
              Enter your EPOS provider credentials. Credentials are stored securely and never exposed in the frontend.
            </p>
            <div className="space-y-4">
              <div>
                <label className="label-text block mb-1">EPOS Provider Name</label>
                <input className="input-field w-full" placeholder="e.g. Lightspeed, Square, Clover..." defaultValue={selectedIntegration?.provider !== 'EPOS Provider (Configure)' ? selectedIntegration?.provider : ''} />
              </div>
              <div>
                <label className="label-text block mb-1">Hotel</label>
                <select className="input-field w-full" defaultValue={selectedIntegration?.restaurant}>
                  {['Stanhill Hotel Limited', 'Warren House Hotel Limited'].map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1">API Key / Token</label>
                <input className="input-field w-full" type="password" placeholder="Enter your EPOS API key..." />
              </div>
              <div>
                <label className="label-text block mb-1">Webhook Secret</label>
                <input className="input-field w-full" type="password" placeholder="Enter webhook signing secret..." />
              </div>
              <div>
                <label className="label-text block mb-1">Webhook Endpoint (auto-generated)</label>
                <div style={{ fontSize: 12, fontFamily: 'monospace', padding: '8px 12px', borderRadius: 6, background: 'var(--background)', color: 'var(--muted-foreground)' }}>
                  {selectedIntegration?.webhookUrl || '/api/webhooks/epos/new-location'}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={() => { setSelectedIntegration(null); setShowConfig(false); }}>Save Configuration</button>
              <button className="btn-secondary flex-1" onClick={() => { setSelectedIntegration(null); setShowConfig(false); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
