// src/components/admin/EspecieVegetalVariedadesTab.tsx
'use client';
import React from 'react';
import VariedadesVegetalesList from './VariedadesVegetalesList';

export default function EspecieVegetalVariedadesTab({ especieId, userEmail, focusVariedadId, especieNombre }: { especieId: string | null, userEmail: string | null, focusVariedadId?: string | null, especieNombre?: string }) {
  return <VariedadesVegetalesList especieId={especieId} userEmail={userEmail} focusVariedadId={focusVariedadId} especieNombre={especieNombre} />;
}
