import React, { Dispatch, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { Familia } from '../types';
import PremiumBackButton from '@/components/ui/PremiumBackButton';
import PremiumCheckButton from '@/components/ui/PremiumCheckButton';

interface HeaderActionsProps {
  familia: Familia;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  setShowCheckModal: Dispatch<SetStateAction<boolean>>;
  isMobile?: boolean;
}

export default function HeaderActions({ familia, saveStatus, setShowCheckModal, isMobile = false }: HeaderActionsProps) {
  const router = useRouter();

  return (
    <>
      {/* ═══ Navegación Jerárquica Superior (Regla 8) ═══ */}
      <div style={{ display: 'flex', gap: '8px', padding: isMobile ? '12px 14px' : '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
        <PremiumBackButton onClick={() => router.push('/dashboard/admin/familias')} text="🔙 Volver a Familias" />
      </div>

      {/* ═══ Subheader Contextual + Autoguardado (Regla 8) ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #059669, #10b981)',
        padding: isMobile ? '16px 20px' : '20px 28px',
        color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: '10px',
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {familia.familiasemoji} Editando: {familia.familiasnombre}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: saveStatus === 'saving' ? 'rgba(255,255,255,0.2)' : saveStatus === 'saved' ? 'rgba(255,255,255,0.3)' : saveStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'transparent',
            padding: '6px 14px', borderRadius: '20px', transition: 'all 0.3s',
            fontSize: '0.8rem', fontWeight: 600,
          }}>
            {saveStatus === 'saving' && '⏳ Guardando...'}
            {saveStatus === 'saved' && '✅ Guardado'}
            {saveStatus === 'error' && '❌ Error al guardar'}
            {saveStatus === 'idle' && <span style={{ opacity: 0.7 }}>💾 Auto-Save</span>}
          </div>
        </div>
      </div>

      {/* ═══ Action Bar Global ═══ */}
      <div style={{ padding: isMobile ? '12px 16px' : '16px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <PremiumCheckButton 
          onClick={() => setShowCheckModal(true)}
          style={{ width: isMobile ? '100%' : 'auto' }}
        />
      </div>
    </>
  );
}
