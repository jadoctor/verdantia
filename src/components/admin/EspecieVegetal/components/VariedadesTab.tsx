import React from 'react';
import EspecieVegetalVariedadesTab from '../../EspecieVegetalVariedadesTab';

interface VariedadesTabProps {
  especieId: string | null;
  userEmail: string | null;
  focusParam: string | null;
  activeTab: string;
}

export default function VariedadesTab({ especieId, userEmail, focusParam, activeTab }: VariedadesTabProps) {
  return (
    <div style={{ display: activeTab === 'variedades' ? 'block' : 'none' }}>
      {especieId && (
        <EspecieVegetalVariedadesTab 
          especieId={especieId} 
          userEmail={userEmail} 
          focusVariedadId={focusParam} 
        />
      )}
    </div>
  );
}
