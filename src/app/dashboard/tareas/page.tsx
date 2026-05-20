'use client';

import React from 'react';
import DashboardAlertsWidget from '@/components/user/DashboardAlertsWidget';

export default function TareasPendientesPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <DashboardAlertsWidget />
    </div>
  );
}
