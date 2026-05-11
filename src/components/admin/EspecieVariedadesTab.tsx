// src/components/admin/EspecieVariedadesTab.tsx
'use client';
import React from 'react';
import VariedadesList from './VariedadesList';

export default function EspecieVariedadesTab({ especieId, userEmail, focusVariedadId }: { especieId: string | null, userEmail: string | null, focusVariedadId?: string | null }) {
  return <VariedadesList especieId={especieId} userEmail={userEmail} focusVariedadId={focusVariedadId} />;
}
