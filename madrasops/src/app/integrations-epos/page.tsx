'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Settings, Plus, Activity, Clock } from 'lucide-react';

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
  { id: 'INT-001', name: 'Hounslow EPOS', provider: 'EPOS Provider (Configure)', restaurant: 'Hounslow', status: 'pending', lastEvent: 'Awaiting configuration', lastEventTime: '—', eventsToday: 0, failedEvents: 0, webhookUrl: '/api/webhooks/epos/hounslow', menuMapped: 48, menuTotal: 107 },
  { id: 'INT-002', name: 'Reading EPOS', provider: 'EPOS Provider (Configure)', restaurant: 'Reading', status: 'pending', lastEvent: 'Awaiting configuration', lastEventTime: '—', eventsToday: 0, failedEvents: 0, webhookUrl: '/api/webhooks/epos/reading', menuMapped: 32, menuTotal: 107 },
  { id: 'INT-003', name: 'Dartford EPOS', provider: 'EPOS Provider (Configure)', restaurant: 'Dartford', status: 'disconnected', lastEvent: 'Not configured', lastEventTime: '—', eventsToday: 0, failedEvents: 0, webhookUrl: '/api/webhooks/epos/dartford', menuMapped: 0, menuTotal: 107 },
  { id: 'INT-004', name: 'Leicester EPOS', provider: 'EPOS Provider (Configure)', restaurant: 'Leicester', status: 'disconnected', lastEvent: 'Not configured', lastEventTime: '—', eventsToday: 0, failedEvents: 0, webhookUrl: '/api/webhooks/epos/leicester', menuMapped: 0, menuTotal: 107 },
];

const recentEvents = [
  { id: 'EVT-001', type: 'order.completed', orderId: 'MF-HOU-10482', restaurant: 'Hounslow', menuItem: 'Masala Dosa', time: '2026-10-11 12:34', status: 'processed', stockDeducted: true },
  { id: 'EVT-002', type: 'order.completed', orderId: 'MF-HOU-10483', restaurant: 'Hounslow', menuItem: 'Idly', time: '2026-10-11 12:41', status: 'processed', stockDeducted: true },
  { id: 'EVT-003', type: 'order.completed', orderId: 'MF-HOU-10484', restaurant: 'Hounslow', menuItem: 'Ghee Masala Dosa', time: '2026-10-11 12:55', status: 'unmapped', stockDeducted: false },
  { id: 'EVT-004', type: 'order.cancelled', orderId: 'MF-HOU-10480', restaurant: 'Hounslow', menuItem: 'Plain Dosa', time: '2026-10-11 12:20', status: 'reversed', stockDeducted: false },
  { id: 'EVT-005', type: 'order.completed', orderId: 'MF-REA-10201', restaurant: 'Reading', menuItem: 'Paneer Butter Masala', time: '2026-10-11 13:02', status: 'processed', stockDeducted: true },
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

export default function IntegrationsEPOSPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfig, setShowConfig] = useState(false);

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
                  <div style={{ fontSize: 16, fontWeight: 700, color: integration.menuMapped < integration.menuTotal ? '#92400E' : '#166534' }}>
                    {integration.menuMapped}/{integration.menuTotal}
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
                <button className="btn-secondary flex-1" style={{ padding: '7px', fontSize: 12 }}>
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
                <th>Location</th>
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
                <label className="label-text block mb-1">Restaurant Location</label>
                <select className="input-field w-full">
                  {['Hounslow', 'Reading', 'Dartford', 'Leicester'].map(r => <option key={r} selected={selectedIntegration?.restaurant === r}>{r}</option>)}
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
