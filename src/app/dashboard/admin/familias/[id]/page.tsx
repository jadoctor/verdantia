'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

import { useFamiliaState } from './hooks/useFamiliaState';
import { useAiAssistant } from './hooks/useAiAssistant';

import HeaderActions from './components/HeaderActions';
import TabDatosGenerales from './components/TabDatosGenerales';
import TabRotacion from './components/TabRotacion';
import AiModal from './components/AiModal';
import CheckModal from './components/CheckModal';

export default function EditarFamiliaPage() {
  const params = useParams();
  const familiaId = params.id as string;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('datos');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768; // Hook responsivo para auditoría

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || null);
    });
    return () => unsubscribe();
  }, []);

  const {
    familia, setFamilia, especies, todasFamilias, loading, saveStatus,
    handleChange, toggleRotacion, autoSave
  } = useFamiliaState(familiaId, userEmail);

  const aiProps = useAiAssistant(familia, userEmail, setFamilia, autoSave, setActiveTab);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!familia) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Familia no encontrada</div>;
  }

  return (
    <div style={{ width: '100%', padding: '0' }}>
      <HeaderActions familia={familia} saveStatus={saveStatus} setShowCheckModal={setShowCheckModal} isMobile={isMobile} />

      {/* ═══ Pestañas (Regla 8: controladas por CSS, NO condicional React) ═══ */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e2e8f0', padding: isMobile ? '0 8px' : '0 20px', background: '#fafafa', flexWrap: isMobile ? 'nowrap' : 'wrap', overflowX: isMobile ? 'auto' : 'visible', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {[
          { key: 'datos', label: '📋 Datos Generales' },
          { key: 'rotacion', label: '🔄 Rotación' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              flexShrink: 0,
              padding: '12px 20px', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.85rem', transition: 'all 0.2s', background: 'transparent',
              borderBottom: activeTab === tab.key ? '3px solid #059669' : '3px solid transparent',
              color: activeTab === tab.key ? '#059669' : '#64748b',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 20px' }}>
        <div style={{ display: activeTab === 'datos' ? 'block' : 'none' }}>
          <TabDatosGenerales 
            familia={familia} especies={especies} handleChange={handleChange}
            setAiModalType={aiProps.setAiModalType} setShowAiModal={aiProps.setShowAiModal}
            setAiProposals={aiProps.setAiProposals} setAiExtraInstructions={aiProps.setAiExtraInstructions}
          />
        </div>

        <div style={{ display: activeTab === 'rotacion' ? 'block' : 'none' }}>
          <TabRotacion 
            familia={familia} todasFamilias={todasFamilias} handleChange={handleChange} toggleRotacion={toggleRotacion}
            setAiModalType={aiProps.setAiModalType} setShowAiModal={aiProps.setShowAiModal} setAiPromptOpen={aiProps.setAiPromptOpen}
            setAiProposals={aiProps.setAiProposals} setAiExtraInstructions={aiProps.setAiExtraInstructions}
            isAILoading={aiProps.isAILoading} aiError={aiProps.aiError}
          />
        </div>
      </div>

      <AiModal familia={familia} todasFamilias={todasFamilias} {...aiProps} />
      <CheckModal familia={familia} showCheckModal={showCheckModal} setShowCheckModal={setShowCheckModal} />
    </div>
  );
}
