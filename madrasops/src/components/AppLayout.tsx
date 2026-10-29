'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Topbar sidebarCollapsed={collapsed} />
      <main
        className="content-transition min-h-screen"
        style={{
          marginLeft: collapsed ? 64 : 240,
          paddingTop: 60,
        }}
      >
        <div className="w-full max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}