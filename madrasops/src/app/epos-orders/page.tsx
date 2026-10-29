import React from 'react';
import AppLayout from '@/components/AppLayout';
import EPOSOrdersContent from './components/EPOSOrdersContent';

export default function EPOSOrdersPage() {
  return (
    <AppLayout>
      <EPOSOrdersContent />
    </AppLayout>
  );
}