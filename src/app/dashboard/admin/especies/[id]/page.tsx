'use client';
// Responsividad controlada en EspecieForm (isMobile, @media, innerWidth) - Hot-reload trigger: 2026-06-18T12:58:30

import React, { useState, useEffect } from 'react';
import EspecieForm from '@/components/admin/EspecieForm';
import { useEditarEspecie } from './hooks/useEditarEspecie';

// HMR trigger for db change (removed metadata) - updated phases - added master labor editor - changed to link - updated in especieform - rules 8 and 11 v6

export default function EditarEspeciePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { userEmail, authReady } = useEditarEspecie();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

  // No renderizamos el formulario hasta que Firebase haya resuelto el usuario
  if (!authReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🌿</div>
        <p>Cargando especie...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '0px' : '20px', width: '100%' }}>
      <EspecieForm especieId={resolvedParams.id} userEmail={userEmail} />
    </div>
  );
}
