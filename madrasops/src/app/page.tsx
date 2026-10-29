import React from 'react';
import AppLayout from '@/components/AppLayout';
import MetricsBentoGrid from './components/MetricsBentoGrid';
import DashboardCharts from './components/DashboardCharts';
import LiveActivityFeed from './components/LiveActivityFeed';
import RestaurantComparisonTable from './components/RestaurantComparisonTable';
import AlertsPanel from './components/AlertsPanel';
import DashboardHeader from './components/DashboardHeader';

export default function OverviewDashboardPage() {
  return (
    <AppLayout>
      <DashboardHeader />
      <MetricsBentoGrid />
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DashboardCharts />
        </div>
        <div>
          <AlertsPanel />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RestaurantComparisonTable />
        </div>
        <div>
          <LiveActivityFeed />
        </div>
      </div>
    </AppLayout>
  );
}