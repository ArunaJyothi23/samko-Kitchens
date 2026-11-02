'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { useAuth, useScopedRestaurant } from '@/contexts/AuthContext';
import { usePrepStore } from '@/data/prepStore';
import PrepMasterPanel from './components/PrepMasterPanel';
import ProductionPanel from './components/ProductionPanel';
import PreparedInventoryPanel from './components/PreparedInventoryPanel';

type Tab = 'master' | 'production' | 'prepared' | 'audit';

export default function BulkPreparationPage() {
  const { user, readOnly } = useAuth();
  const scope = useScopedRestaurant();
  const { state } = usePrepStore();
  const [tab, setTab] = useState<Tab>('master');
  const byName = user?.name ?? 'User';
  const canApprove = user?.role === 'Kitchen Manager' || user?.role === 'Business Owner';
  const tabs: [Tab, string][] = [
    ['master', 'Preparation Master'],
    ['production', 'Production'],
    ['prepared', 'Prepared Inventory'],
    ['audit', 'Audit Trail'],
  ];
  const scopedPreps = state.preps.filter((p) => !scope || p.hotel === scope);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="page-title">Bulk Preparation / Sub-Recipes</h1>
        <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
          {scope ?? 'Both Hotels'} · Raw materials → bulk preparation → prepared inventory → EPOS menu recipe. {scopedPreps.length} preparation(s).
        </p>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {tabs.map(([k, label]) => (
          <button key={k} className={tab === k ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 14px' }} onClick={() => setTab(k)}>{label}</button>
        ))}
      </div>

      {tab === 'master' && <PrepMasterPanel hotelScope={scope} byName={byName} readOnly={readOnly} />}
      {tab === 'production' && <ProductionPanel hotelScope={scope} byName={byName} readOnly={readOnly} canApprove={canApprove && !readOnly} />}
      {tab === 'prepared' && <PreparedInventoryPanel hotelScope={scope} byName={byName} readOnly={readOnly} />}
      {tab === 'audit' && (
        <div className="card p-0 overflow-x-auto">
          <table className="data-table">
            <thead><tr><th>When</th><th>User</th><th>Ref</th><th>Change</th></tr></thead>
            <tbody>
              {state.audit.length === 0 && <tr><td colSpan={4} style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>No activity recorded yet.</td></tr>}
              {state.audit.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontSize: 12 }}>{a.at.slice(0, 16).replace('T', ' ')}</td>
                  <td style={{ fontSize: 12 }}>{a.by}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{a.ref}</td>
                  <td style={{ fontSize: 12 }}>{a.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
