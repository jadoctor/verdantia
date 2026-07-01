'use client'; // Force hot-reload: 2026-06-29T23:33:00 - Exact Premium Standard

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PremiumSubheader from '@/components/ui/PremiumSubheader';
import PremiumDeleteButton from '@/components/ui/PremiumDeleteButton';
import PremiumUndoButton from '@/components/ui/PremiumUndoButton';
import PremiumSaveButton from '@/components/ui/PremiumSaveButton';
import PremiumDevInsights from '@/components/ui/PremiumDevInsights';
import PremiumHeroCarousel from '@/components/ui/PremiumHeroCarousel';
import { useEspecieVegetalForm } from './hooks/EspecieVegetal/useEspecieVegetalForm';
import EspecieFormNavigation from './EspecieVegetal/components/EspecieFormNavigation';
import EspecieVisibilityToggle from './EspecieVegetal/components/EspecieVisibilityToggle';
import EspecieFormTabsSection from './EspecieVegetal/components/EspecieFormTabsSection';
import EspecieModalsSection from './EspecieVegetal/components/EspecieModalsSection';
import './EspecieVegetalForm.css';

interface EspecieVegetalFormProps {
  especieId: string | null;
  userEmail: string | null;
}

export default function EspecieVegetalForm({ especieId, userEmail }: EspecieVegetalFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPdfParam = searchParams.get('editPdf');
  const focusParam = searchParams.get('focus');

  const s = useEspecieVegetalForm({ especieId, userEmail });

  return (
    <>
      {/* ── Navegación ── */}
      <EspecieFormNavigation isDirty={s.isDirty} />

      {/* ── Encabezado Premium Contextual (PremiumSubheader) ── */}
      <PremiumSubheader
        title={
          <>
            {s.formData.especiesvegetalesicono || '🌿'} {s.formData.especiesvegetalesnombre || 'Nueva Especie'}
            {s.formData.especiesvegetalesnombrecientifico ? (
              <span style={{ fontWeight: 'normal', opacity: 0.9, marginLeft: '8px', fontSize: '0.9em' }}>
                ({s.formData.especiesvegetalesnombrecientifico})
              </span>
            ) : null}
          </>
        }
        gradient="linear-gradient(135deg, #0f766e, #10b981)"
        actions={
          <>
            {s.isDirty && s.saveStatus === 'idle' && (
              <>
                <PremiumUndoButton onClick={() => s.setFormData(s.initialData)} text="Deshacer" />
                <PremiumSaveButton 
                  onClick={() => s.handleSubmit(undefined as unknown as React.FormEvent)} 
                  text="Guardar Cambios" 
                />
              </>
            )}
            {especieId && (
              <PremiumDeleteButton onClick={() => s.setDeleteConfirm({ type: 'especie', id: especieId, url: '' })} />
            )}
          </>
        }
      >
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <PremiumDevInsights modulePath="components/admin/EspecieVegetalForm.tsx" />
        </div>
      </PremiumSubheader>

      {/* ── Status Bar / Visibility ── */}
      <EspecieVisibilityToggle 
        visibilidad={!!s.formData.especiesvegetalesvisibilidadsino} 
        onChange={s.handleChange} 
      />

      {/* Hero Carousel */}
      {s.photos.length > 0 ? (
        <PremiumHeroCarousel
          photos={s.photos}
          activePhotoId={s.activeFotoId}
          onSetPrimary={(id) => {
            s.handleSetPrimaryPhoto(id);
            s.setHeroIndex(0);
          }}
          onReorder={(dragId, dropId) => {
            const dragIdx = s.photos.findIndex(p => p.id === dragId);
            const dropIdx = s.photos.findIndex(p => p.id === dropId);
            if (dragIdx !== -1 && dropIdx !== -1) {
              const newPhotos = [...s.photos];
              const [draggedItem] = newPhotos.splice(dragIdx, 1);
              newPhotos.splice(dropIdx, 0, draggedItem);
              s.handleReorderPhotos(newPhotos);
            }
          }}
          fallbackAlt={s.formData.especiesvegetalesnombre || 'Especie'}
        />
      ) : (
        <div style={{ marginBottom: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', background: '#f8fafc', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          {s.formData.especiesvegetalesicono && <span style={{ fontSize: '2.5rem' }}>{s.formData.especiesvegetalesicono}</span>}
          <h2 style={{ margin: 0, color: '#1e293b' }}>Sin fotos en la galería</h2>
        </div>
      )}

      {/* ── Tabs Section ── */}
      <EspecieFormTabsSection
        s={s}
        especieId={especieId}
        userEmail={userEmail}
        focusParam={focusParam}
        editPdfParam={editPdfParam}
      />

      {/* ── Modals Section ── */}
      <EspecieModalsSection
        s={s}
        especieId={especieId}
        userEmail={userEmail}
      />

      {s.toastMessage && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', background: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', zIndex: 9999, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', animation: 'fadeInUp 0.3s ease-out' }}>
          <span>✓</span> {s.toastMessage}
        </div>
      )}
    </>
  );
}
