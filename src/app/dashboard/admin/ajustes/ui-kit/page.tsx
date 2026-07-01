'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumBackButton from '@/components/ui/PremiumBackButton';

import { useUIKit } from './hooks/useUIKit';
import ActionButtonsShowcase from './components/ActionButtonsShowcase';
import FiltersShowcase from './components/FiltersShowcase';
import MultimediaShowcase from './components/MultimediaShowcase';

export default function UIKitPage() {
  const router = useRouter();
  const {
    activePhoto, setActivePhoto, photos,
    activeSegment, setActiveSegment,
    activeDropdown, setActiveDropdown,
    handleClick, handleReorder
  } = useUIKit();

  const titleStyle: React.CSSProperties = { fontSize: '13px', color: '#64748b', marginBottom: '12px', fontWeight: 600 };
  const containerStyle: React.CSSProperties = { display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' };
  const cardStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', alignItems: 'center' };

  return (
    <div style={{ padding: '24px', width: '100%' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <PremiumBackButton onClick={() => router.push('/dashboard')} text="🏠 Volver al Inicio" />
      </div>
      
      <PremiumSubheader
        title={<>🎨 UI KIT PREMIUM</>}
        gradient="linear-gradient(135deg, #6366f1, #8b5cf6)"
      >
        <PremiumDevInsights modulePath="admin/ajustes/ui-kit/page.tsx" />
      </PremiumSubheader>

      <ActionButtonsShowcase 
        handleClick={handleClick} 
        cardStyle={cardStyle} 
        titleStyle={titleStyle} 
        containerStyle={containerStyle} 
      />

      <FiltersShowcase 
        activeSegment={activeSegment} setActiveSegment={setActiveSegment}
        activeDropdown={activeDropdown} setActiveDropdown={setActiveDropdown}
        cardStyle={cardStyle} titleStyle={titleStyle} containerStyle={containerStyle}
      />

      <MultimediaShowcase 
        photos={photos} activePhoto={activePhoto}
        setActivePhoto={setActivePhoto} handleReorder={handleReorder}
      />
    </div>
  );
}
