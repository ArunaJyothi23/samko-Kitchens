'use client';

import React, { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { Users, Plus, Search, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useScopedRestaurant, NEW_RESTAURANTS } from '@/contexts/AuthContext';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  location: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

const baseUsersData: User[] = [
  { id: 'USR-001', name: 'Rajesh Kumar', email: 'owner@samkokitchens.co.uk', role: 'Business Owner / MD', location: 'All Locations', status: 'active', lastLogin: '2026-10-11 06:30', createdAt: '2026-01-01' },
  { id: 'USR-002', name: 'Priya Sharma', email: 'kitchen@samkokitchens.co.uk', role: 'Central Kitchen Manager', location: 'Central Kitchen', status: 'active', lastLogin: '2026-10-11 05:45', createdAt: '2026-01-15' },
  { id: 'USR-003', name: 'Anita Menon', email: 'hounslow@samkokitchens.co.uk', role: 'Restaurant Manager', location: 'Hounslow', status: 'active', lastLogin: '2026-10-11 07:00', createdAt: '2026-02-01' },
  { id: 'USR-004', name: 'Vikram Nair', email: 'finance@samkokitchens.co.uk', role: 'Finance / Auditor', location: 'All Locations', status: 'active', lastLogin: '2026-10-10 17:30', createdAt: '2026-02-15' },
  { id: 'USR-005', name: 'Suresh Pillai', email: 'reading@samkokitchens.co.uk', role: 'Restaurant Manager', location: 'Reading', status: 'active', lastLogin: '2026-10-11 08:00', createdAt: '2026-03-01' },
  { id: 'USR-006', name: 'Meena Lakshmi', email: 'leicester@samkokitchens.co.uk', role: 'Restaurant Manager', location: 'Leicester', status: 'active', lastLogin: '2026-10-11 09:15', createdAt: '2026-04-01' },
  { id: 'USR-007', name: 'Kumar Rajan', email: 'dartford@samkokitchens.co.uk', role: 'Restaurant Manager', location: 'Dartford', status: 'active', lastLogin: '2026-10-10 22:00', createdAt: '2026-03-15' },
  { id: 'USR-008', name: 'Ravi Krishnan', email: 'ravi@samkokitchens.co.uk', role: 'Central Kitchen Staff', location: 'Central Kitchen', status: 'inactive', lastLogin: '2026-10-05 14:00', createdAt: '2026-05-01' },
];

const newUsersData: User[] = NEW_RESTAURANTS.map((r, i) => ({
  id: `USR-${String(9 + i).padStart(3, '0')}`,
  name: r.managerName,
  email: r.email,
  role: 'Restaurant Manager',
  location: r.name,
  status: 'active' as const,
  lastLogin: `2026-10-11 0${6 + (i % 4)}:${String(10 + i * 5).padStart(2, '0')}`,
  createdAt: '2026-10-01',
}));

const allUsersData: User[] = [...baseUsersData, ...newUsersData];

const roles = [
  { name: 'SaaS Super Admin', permissions: ['All system access', 'Tenant management', 'Global settings'], color: '#991B1B' },
  { name: 'Business Owner / MD', permissions: ['All locations view', 'Financial reports', 'User management'], color: '#ED1C24' },
  { name: 'Central Kitchen Manager', permissions: ['Recipes', 'Production', 'Dispatch', 'Ingredients'], color: '#168447' },
  { name: 'Central Kitchen Staff', permissions: ['Production recording', 'Ingredient usage', 'Batch completion'], color: '#166534' },
  { name: 'Restaurant Manager', permissions: ['GRN', 'Inventory', 'Wastage', 'Stocktake', 'Daily closing'], color: '#0EA5E9' },
  { name: 'Restaurant Staff', permissions: ['Authorised stock ops', 'Wastage recording'], color: '#6366F1' },
  { name: 'Finance / Auditor', permissions: ['Cost reports', 'Audit logs', 'Profitability', 'Read-only'], color: '#F9B233' },
  { name: 'Read-only User', permissions: ['Authorised dashboards', 'Reports view only'], color: '#9CA3AF' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: '#DCFCE7', text: '#166534' },
  inactive: { bg: '#F3F4F6', text: '#6B7280' },
  suspended: { bg: '#FEE2E2', text: '#991B1B' },
};

export default function UsersPermissionsPage() {
  const scope = useScopedRestaurant();
  const usersData = scope ? allUsersData.filter((u) => u.location === scope) : allUsersData;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [showAddUser, setShowAddUser] = useState(false);

  const allRoles = ['All', ...Array.from(new Set(usersData.map(u => u.role)))];
  const filtered = usersData.filter((u) => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'All' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="page-title">Users & Permissions</h1>
          <p style={{ fontSize: 13.5, color: 'var(--muted-foreground)', marginTop: 4 }}>
            Manage user accounts, roles and access control across all locations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary" style={{ padding: '8px 12px' }} onClick={() => setShowAddUser(true)}>
            <Plus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="metric-card">
          <p className="label-text">Total Users</p>
          <p className="metric-value">{usersData.length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Active</p>
          <p className="metric-value" style={{ color: '#166534' }}>{usersData.filter(u => u.status === 'active').length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Inactive</p>
          <p className="metric-value" style={{ color: '#6B7280' }}>{usersData.filter(u => u.status === 'inactive').length}</p>
        </div>
        <div className="metric-card">
          <p className="label-text">Roles Defined</p>
          <p className="metric-value">{roles.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'var(--card)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {(['users', 'roles'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{ padding: '7px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'white' : 'var(--muted-foreground)', textTransform: 'capitalize' }}
          >
            {tab === 'users' ? '👥 Users' : '🛡 Roles & Permissions'}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <>
          <div className="card mb-5 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-foreground)' }} />
              <input className="input-field pl-8" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-field" style={{ width: 220 }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              {allRoles.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{user.email}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{user.role}</td>
                      <td style={{ fontSize: 12 }}>{user.location}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: statusColors[user.status].bg, color: statusColors[user.status].text, textTransform: 'capitalize' }}>
                          {user.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                          {user.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{user.lastLogin}</td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11 }}><Edit size={11} /></button>
                          <button className="btn-secondary" style={{ padding: '4px 8px', fontSize: 11, color: '#991B1B' }}><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.name} className="card">
              <div className="flex items-center gap-3 mb-3">
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>{role.name}</h3>
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 'auto' }}>
                  {usersData.filter(u => u.role === role.name).length} user(s)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.permissions.map((perm) => (
                  <span key={perm} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: role.color + '18', color: role.color, fontWeight: 500 }}>
                    {perm}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <button className="btn-secondary" style={{ padding: '5px 12px', fontSize: 11 }}><Edit size={11} /> Edit Role</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAddUser(false)}>
          <div className="rounded-xl shadow-2xl p-6" style={{ width: 480, background: 'var(--card)' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Add New User</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label-text block mb-1">First Name</label>
                  <input className="input-field w-full" placeholder="First name" />
                </div>
                <div>
                  <label className="label-text block mb-1">Last Name</label>
                  <input className="input-field w-full" placeholder="Last name" />
                </div>
              </div>
              <div>
                <label className="label-text block mb-1">Email Address</label>
                <input className="input-field w-full" type="email" placeholder="user@samkokitchens.co.uk" />
              </div>
              <div>
                <label className="label-text block mb-1">Role</label>
                <select className="input-field w-full">
                  {roles.map(r => <option key={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text block mb-1">Location Access</label>
                <select className="input-field w-full">
                  {['All Locations', 'Central Kitchen', 'Hounslow', 'Reading', 'Dartford', 'Leicester'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="btn-primary flex-1" onClick={() => setShowAddUser(false)}>Create User</button>
              <button className="btn-secondary flex-1" onClick={() => setShowAddUser(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
