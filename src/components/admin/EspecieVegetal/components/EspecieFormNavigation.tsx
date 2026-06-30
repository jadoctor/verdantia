import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PremiumBackButton from '@/components/ui/PremiumBackButton';

interface EspecieFormNavigationProps {
  isDirty: boolean;
}

export default function EspecieFormNavigation({ isDirty }: EspecieFormNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
      <PremiumBackButton
        onClick={() => {
          if (isDirty && !confirm('Tienes cambios sin guardar. ¿Seguro que quieres salir?')) return;
          const from = searchParams.get('from');
          if (from === 'identificar-especie') {
            router.push('/dashboard/admin/tareas/identificar-especie');
          } else if (from === 'labores') {
            router.push('/dashboard/admin/labores');
          } else if (from === 'animales') {
            router.push('/dashboard/admin/especiesanimales');
          } else if (from === 'pdfs') {
            router.push('/dashboard/admin/pdfs');
          } else if (window.history.length > 2) { 
            router.back(); 
          } else { 
            router.push('/dashboard/admin/especiesvegetales'); 
          }
        }}
        text={
          searchParams.get('from') === 'labores'
            ? '🔙 Volver a Labores'
            : searchParams.get('from') === 'identificar-especie'
            ? '🔙 Volver al Identificador de Especies'
            : searchParams.get('from') === 'animales'
            ? '🔙 Volver a Especies de Granja'
            : searchParams.get('from') === 'pdfs'
            ? '🔙 Volver a Gestor de PDFs'
            : '🔙 Volver a Especies'
        }
      />
      {searchParams.get('from') === 'animales' && searchParams.get('fromId') && (
        <PremiumBackButton
          onClick={() => {
            const fromId = searchParams.get('fromId');
            router.push(`/dashboard/admin/especiesanimales/${fromId}`);
          }}
          text={`🔙 Volver a ${decodeURIComponent(searchParams.get('fromName') || 'Animal')}`}
          style={{ background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e' }}
        />
      )}
    </div>
  );
}
