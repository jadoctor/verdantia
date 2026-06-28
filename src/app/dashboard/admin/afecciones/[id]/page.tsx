'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useAfeccion } from './hooks/useAfeccion';
import { useAfeccionPhotos } from './hooks/useAfeccionPhotos';
import AfeccionHero from './components/AfeccionHero';
import AfeccionTratamientosTab from './components/AfeccionTratamientosTab';
import VariedadVegetalMediaManager from '@/components/admin/VariedadVegetalMediaManager';
import '@/components/admin/EspecieVegetalForm.css';

export default function EditarAfeccionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const editPdfParam = searchParams.get('editPdf');
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && ['detalles', 'fotos', 'pdfs', 'blogs'].includes(tabParam) ? tabParam : 'detalles';
  });

  const { formData, loading, saveStatus, handleChange, setFormData } = useAfeccion(resolvedParams.id, userEmail);
  const { photos, refreshPhotos } = useAfeccionPhotos(resolvedParams.id, userEmail);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkResize = () => setIsMobile(window.innerWidth <= 768);
      checkResize();
      window.addEventListener('resize', checkResize);
      return () => window.removeEventListener('resize', checkResize);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setAuthReady(true);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSetPrimaryPhoto = async (photoId: number) => {
    if (!userEmail || resolvedParams.id === 'nueva') return;
    try {
      await fetch(`/api/admin/afecciones/${resolvedParams.id}/photos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ photoId, action: 'setPrimary' })
      });
      refreshPhotos();
    } catch (e) {
      console.error(e);
    }
  };

  if (!authReady || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🦠</div>
        <p>Cargando afección...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: isMobile ? '0' : '20px', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Navegación Hierárquica */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: isMobile ? '10px' : '0' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          🏠 Volver al Inicio
        </button>
        {searchParams.get('from') === 'enlaces' ? (
          <button onClick={() => router.push('/dashboard/admin/mantenimiento/enlaces')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            🔗 Volver a Salud de Enlaces
          </button>
        ) : searchParams.get('from') === 'pdfs' ? (
          <button onClick={() => router.push('/dashboard/admin/pdfs')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            🔙 Volver a Gestor de PDFs
          </button>
        ) : (
          <button onClick={() => router.push('/dashboard/admin/afecciones')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            🔙 Volver a Afecciones Globales
          </button>
        )}
      </div>

      {/* Subheader Contextual y Autoguardado */}
      <div style={{ 
        background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: isMobile ? '0' : '14px', 
        padding: '12px 20px', color: 'white', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' 
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
            🦠 {resolvedParams.id === 'nueva' ? 'Nueva Afección' : formData.afeccionesnombre || 'Edición de Afección'}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.85rem' }}>✏️ Editar Afección · ID: {resolvedParams.id}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
          {formData.afeccionescategoria && (
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
              {formData.afeccionescategoria}
            </span>
          )}
          {formData.afeccionesgravedad && (
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', textTransform: 'uppercase' }}>
              {formData.afeccionesgravedad}
            </span>
          )}
          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.74rem' }}>
            {saveStatus === 'saving' && <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>⏳ Guardando...</span>}
            {saveStatus === 'saved' && <span style={{ color: '#34d399', fontWeight: 'bold' }}>✅ Guardado</span>}
            {saveStatus === 'idle' && <span style={{ color: '#cbd5e1' }}>✓ Al día</span>}
          </div>
        </div>
      </div>

      {/* Estado Global (Activo) */}
      <div style={{ marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', color: formData.afeccionesactivo ? '#166534' : '#94a3b8' }}>
          <input 
            type="checkbox" 
            name="afeccionesactivo" 
            checked={!!formData.afeccionesactivo} 
            onChange={handleChange}
            style={{ width: '20px', height: '20px', accentColor: '#10b981' }}
          />
          {formData.afeccionesactivo ? 'Afección Activa y Visible' : 'Afección Inhabilitada'}
        </label>
        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Controla si esta afección puede ser vinculada a las plantas en el sistema.</span>
      </div>

      {/* Hero Carousel */}
      <AfeccionHero photos={photos} onSetPrimary={handleSetPrimaryPhoto} />

      {/* Pestañas Controladas por CSS */}
      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '2px', overflowX: 'auto', padding: isMobile ? '0 10px' : '0' }}>
        <button onClick={() => setActiveTab('detalles')} style={{ padding: '12px 24px', background: activeTab === 'detalles' ? 'white' : '#f8fafc', border: '1px solid #e2e8f0', borderBottom: activeTab === 'detalles' ? '2px solid #3b82f6' : 'none', color: activeTab === 'detalles' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: 'bold', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', whiteSpace: 'nowrap' }}>
          📝 Detalles
        </button>
        <button onClick={() => setActiveTab('tratamientos')} style={{ padding: '12px 24px', background: activeTab === 'tratamientos' ? 'white' : '#f8fafc', border: '1px solid #e2e8f0', borderBottom: activeTab === 'tratamientos' ? '2px solid #3b82f6' : 'none', color: activeTab === 'tratamientos' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: 'bold', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', whiteSpace: 'nowrap' }}>
          🧪 Tratamientos
        </button>
        <button onClick={() => setActiveTab('fotos')} style={{ padding: '12px 24px', background: activeTab === 'fotos' ? 'white' : '#f8fafc', border: '1px solid #e2e8f0', borderBottom: activeTab === 'fotos' ? '2px solid #3b82f6' : 'none', color: activeTab === 'fotos' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: 'bold', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', whiteSpace: 'nowrap' }}>
          📷 Fotos
        </button>
        <button onClick={() => setActiveTab('pdfs')} style={{ padding: '12px 24px', background: activeTab === 'pdfs' ? 'white' : '#f8fafc', border: '1px solid #e2e8f0', borderBottom: activeTab === 'pdfs' ? '2px solid #3b82f6' : 'none', color: activeTab === 'pdfs' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: 'bold', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', whiteSpace: 'nowrap' }}>
          📄 PDFs
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: isMobile ? '0' : '16px', padding: isMobile ? '16px' : '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: isMobile ? 'none' : '1px solid #e2e8f0' }}>
        
        {/* TAB: Detalles */}
        <div style={{ display: activeTab === 'detalles' ? 'block' : 'none' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre Común *</label>
              <input 
                type="text" name="afeccionesnombre" required
                value={formData.afeccionesnombre} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: Pulgón Verde"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre Científico</label>
              <input 
                type="text" name="afeccionesnombrecientifico" 
                value={formData.afeccionesnombrecientifico} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontStyle: 'italic' }}
                placeholder="Ej: Myzus persicae"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Categoría</label>
              <select name="afeccionescategoria" value={formData.afeccionescategoria} onChange={handleChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}>
                <option value="plaga">Plaga (Insecto, Ácaro, etc.)</option>
                <option value="enfermedad">Enfermedad (Hongo, Virus, etc.)</option>
                <option value="deficiencia">Deficiencia Nutricional</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Gravedad</label>
              <select name="afeccionesgravedad" value={formData.afeccionesgravedad} onChange={handleChange} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}>
                <option value="baja">Baja (Fácil control)</option>
                <option value="media">Media (Requiere atención)</option>
                <option value="alta">Alta (Daños severos)</option>
                <option value="critica">Crítica (Puede matar la planta)</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Agente Causal</label>
              <input 
                type="text" name="afeccionesagente" 
                value={formData.afeccionesagente} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: Hongo, Insecto, Falta de Calcio..."
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Órganos Afectados</label>
              <input 
                type="text" name="afeccionesorganosafectados" 
                value={formData.afeccionesorganosafectados} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: Hojas jóvenes, raíces, frutos..."
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Meses de Riesgo</label>
              <input 
                type="text" name="afeccionesmesesriesgo" 
                value={formData.afeccionesmesesriesgo} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: Abril a Septiembre"
              />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Condiciones Favorables</label>
            <textarea 
              name="afeccionescondiciones" rows={3}
              value={formData.afeccionescondiciones} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Alta humedad y temperaturas suaves..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Síntomas</label>
            <textarea 
              name="afeccionessintomas" rows={3}
              value={formData.afeccionessintomas} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Manchas amarillas en las hojas..."
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Prevención General</label>
            <textarea 
              name="afeccionesprevencion" rows={3}
              value={formData.afeccionesprevencion} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Evitar encharcamientos, buena ventilación..."
            />
          </div>
        </div>

        {/* TAB: Tratamientos */}
        <div style={{ display: activeTab === 'tratamientos' ? 'block' : 'none' }}>
          {resolvedParams.id === 'nueva' ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              Guarda un nombre para la afección primero antes de poder vincular tratamientos.
            </div>
          ) : (
            <AfeccionTratamientosTab afeccionId={resolvedParams.id} userEmail={userEmail} />
          )}
        </div>

        {/* TAB: Fotos */}
        <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
          {resolvedParams.id === 'nueva' ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              Guarda un nombre para la afección primero antes de poder subir fotos.
            </div>
          ) : (
            <VariedadVegetalMediaManager 
              variedadId={resolvedParams.id} 
              userEmail={userEmail || ''} 
              variedadNombre={formData.afeccionesnombre}
              especieNombre={formData.afeccionescategoria}
              apiBasePath={`/api/admin/afecciones/${resolvedParams.id}`}
              section="photos"
              onMediaChange={refreshPhotos}
              entityType="afecciones"
            />
          )}
        </div>

        {/* TAB: PDFs */}
        <div style={{ display: activeTab === 'pdfs' ? 'block' : 'none' }}>
          {resolvedParams.id === 'nueva' ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              Guarda un nombre para la afección primero antes de poder subir documentos.
            </div>
          ) : (
            <VariedadVegetalMediaManager 
              variedadId={resolvedParams.id} 
              userEmail={userEmail || ''} 
              variedadNombre={formData.afeccionesnombre}
              especieNombre={formData.afeccionescategoria}
              apiBasePath={`/api/admin/afecciones/${resolvedParams.id}`}
              section="pdfs"
              entityType="afecciones"
              initialEditPdfId={editPdfParam ? parseInt(editPdfParam, 10) : null}
            />
          )}
        </div>

      </div>
    </div>
  );
}
