'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Settings, Building2, MapPin, Bell, Shield, Database, Palette, Save } from 'lucide-react';
import { NEW_RESTAURANTS } from '@/contexts/AuthContext';

type SettingsTab = 'general' | 'locations' | 'notifications' | 'security' | 'data' | 'appearance';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings size={15} /> },
  { id: 'locations', label: 'Locations', icon: <MapPin size={15} /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell size={15} /> },
  { id: 'security', label: 'Security', icon: <Shield size={15} /> },
  { id: 'data', label: 'Data & Retention', icon: <Database size={15} /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={15} /> },
];

const locations = [
  { id: 'LOC-001', name: 'Samko Kitchens', type: 'Central Kitchen', address: 'Hounslow, London, UK', active: true },
  { id: 'LOC-002', name: 'Samko Hounslow', type: 'Restaurant', address: 'Hounslow, London, UK', active: true },
  { id: 'LOC-003', name: 'Samko Reading', type: 'Restaurant', address: 'Reading, Berkshire, UK', active: true },
  { id: 'LOC-004', name: 'Samko Dartford', type: 'Restaurant', address: 'Dartford, Kent, UK', active: true },
  { id: 'LOC-005', name: 'Samko Leicester', type: 'Restaurant', address: 'Leicester, Leicestershire, UK', active: true },
  ...NEW_RESTAURANTS.map((r, i) => ({ id: `LOC-${String(6 + i).padStart(3, '0')}`, name: r.fullName, type: 'Restaurant', address: r.address, active: true })),
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Settings</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Configure your SaaS application, locations, notifications and preferences
          </p>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '8px 16px' }}
          onClick={handleSave}
        >
          <Save size={14} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Nav */}
        <div className="shrink-0" style={{ width: 200 }}>
          <div className="card p-2 space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--muted-foreground)',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Business Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label-text block mb-1">Business Name</label>
                    <input className="input-field w-full" defaultValue="Samko Kitchens" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-text block mb-1">Country</label>
                      <select className="input-field w-full"><option>United Kingdom</option></select>
                    </div>
                    <div>
                      <label className="label-text block mb-1">Currency</label>
                      <select className="input-field w-full"><option>GBP (£)</option></select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label-text block mb-1">Timezone</label>
                      <select className="input-field w-full"><option>Europe/London (GMT/BST)</option></select>
                    </div>
                    <div>
                      <label className="label-text block mb-1">Date Format</label>
                      <select className="input-field w-full"><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option></select>
                    </div>
                  </div>
                  <div>
                    <label className="label-text block mb-1">VAT Registration Number</label>
                    <input className="input-field w-full" placeholder="GB 000 0000 00" />
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Inventory Defaults</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label-text block mb-1">Default Stock Consumption Rule</label>
                    <select className="input-field w-full">
                      <option>FEFO (First Expired, First Out) — Recommended</option>
                      <option>FIFO (First In, First Out)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="label-text block mb-1">Expiry Alert (Critical)</label>
                      <div className="flex items-center gap-2">
                        <input className="input-field flex-1" type="number" defaultValue={1} />
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>day(s)</span>
                      </div>
                    </div>
                    <div>
                      <label className="label-text block mb-1">Expiry Alert (Warning)</label>
                      <div className="flex items-center gap-2">
                        <input className="input-field flex-1" type="number" defaultValue={3} />
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>day(s)</span>
                      </div>
                    </div>
                    <div>
                      <label className="label-text block mb-1">Expiry Alert (Info)</label>
                      <div className="flex items-center gap-2">
                        <input className="input-field flex-1" type="number" defaultValue={7} />
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>day(s)</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="label-text block mb-1">Default VAT Rate</label>
                    <div className="flex items-center gap-2">
                      <input className="input-field" style={{ width: 100 }} type="number" defaultValue={20} />
                      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>% (applied to dine-in menu items)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Approval Workflows</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Require approval for stock adjustments', defaultChecked: true },
                    { label: 'Require approval for wastage records', defaultChecked: true },
                    { label: 'Require approval for yield variances > 5%', defaultChecked: true },
                    { label: 'Require approval for delivery discrepancies', defaultChecked: true },
                    { label: 'Require manager sign-off for end-of-day closing', defaultChecked: true },
                  ].map(({ label, defaultChecked }) => (
                    <label key={label} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" defaultChecked={defaultChecked} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                      <span style={{ fontSize: 13 }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'locations' && (
            <div className="card p-0 overflow-hidden">
              <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600 }}>Locations</h3>
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>+ Add Location</button>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {locations.map((loc) => (
                  <div key={loc.id} className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: loc.type === 'Central Kitchen' ? '#FEF9C3' : '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {loc.type === 'Central Kitchen' ? <Building2 size={16} style={{ color: '#92400E' }} /> : <MapPin size={16} style={{ color: '#166534' }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{loc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{loc.type} · {loc.address}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>Active</span>
                      <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 11 }}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { category: 'Stock Alerts', items: ['Low stock threshold reached', 'Critical stock level', 'Batch expiring within 24 hours', 'Batch expiring within 3 days', 'Expired batch auto-quarantined'] },
                  { category: 'Operations', items: ['Delivery discrepancy requires approval', 'Wastage pending approval', 'Stock adjustment pending approval', 'End-of-day closing overdue'] },
                  { category: 'EPOS & Integration', items: ['EPOS webhook failure', 'Unmapped menu item detected', 'Duplicate event blocked', 'Integration health degraded'] },
                  { category: 'Financial', items: ['Food cost % exceeds threshold', 'Wastage cost exceeds daily limit', 'Recipe cost variance alert'] },
                ].map(({ category, items }) => (
                  <div key={category}>
                    <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11 }}>{category}</h4>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <label key={item} className="flex items-center justify-between py-2 border-b cursor-pointer" style={{ borderColor: 'var(--border)' }}>
                          <span style={{ fontSize: 13 }}>{item}</span>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>Email</span>
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" defaultChecked style={{ accentColor: 'var(--primary)' }} />
                              <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>In-app</span>
                            </label>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Authentication</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label-text block mb-1">Session Timeout</label>
                    <select className="input-field" style={{ width: 200 }}>
                      <option>8 hours</option>
                      <option>4 hours</option>
                      <option>1 hour</option>
                      <option>30 minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text block mb-1">Password Policy</label>
                    <select className="input-field" style={{ width: 200 }}>
                      <option>Strong (12+ chars, mixed case, numbers, symbols)</option>
                      <option>Medium (8+ chars, mixed case, numbers)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 13 }}>Require two-factor authentication for admin roles</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 13 }}>Log all authentication events to audit trail</span>
                  </label>
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>API & Webhook Security</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 13 }}>Verify webhook signatures on all incoming events</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 13 }}>Enforce idempotency keys to prevent duplicate processing</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
                    <span style={{ fontSize: 13 }}>Rate limit API endpoints</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-5">
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Data Retention</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Audit logs retention', defaultValue: '7 years (HMRC compliance)' },
                    { label: 'Stock movement ledger retention', defaultValue: '7 years' },
                    { label: 'EPOS event retention', defaultValue: '2 years' },
                    { label: 'Report snapshots retention', defaultValue: '1 year' },
                  ].map(({ label, defaultValue }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <span style={{ fontSize: 13 }}>{label}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{defaultValue}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Data Export</h3>
                <div className="space-y-3">
                  <p style={{ fontSize: 13, color: 'var(--muted-foreground)' }}>Export all business data in compliance with GDPR data portability requirements.</p>
                  <div className="flex gap-3">
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>Export All Data (CSV)</button>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>Export Audit Logs</button>
                    <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12 }}>Export Stock Ledger</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="card">
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Theme & Display</h3>
              <div className="space-y-5">
                <div>
                  <label className="label-text block mb-3">Colour Theme</label>
                  <div className="flex gap-3">
                    {[
                      { label: 'Light', value: 'light' },
                      { label: 'Dark', value: 'dark' },
                      { label: 'System', value: 'system' },
                    ].map(({ label, value }) => (
                      <label key={value} className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border" style={{ borderColor: value === 'light' ? 'var(--primary)' : 'var(--border)', flex: 1, justifyContent: 'center' }}>
                        <input type="radio" name="theme" value={value} defaultChecked={value === 'light'} style={{ accentColor: 'var(--primary)' }} />
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-text block mb-1">Brand Primary Colour</label>
                  <div className="flex items-center gap-3">
                    <input type="color" defaultValue="#ED1C24" style={{ width: 40, height: 36, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer' }} />
                    <input className="input-field" style={{ width: 120 }} defaultValue="#ED1C24" />
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Samko Red</span>
                  </div>
                </div>
                <div>
                  <label className="label-text block mb-1">Sidebar Style</label>
                  <select className="input-field" style={{ width: 200 }}>
                    <option>Dark sidebar (current)</option>
                    <option>Light sidebar</option>
                    <option>Branded sidebar</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
