'use client';
import React, { useEffect, useState } from 'react';

import { usePendientes } from './hooks/usePendientes';
import { usePhotoEditor } from './hooks/usePhotoEditor';
import { useRechazos } from './hooks/useRechazos';

import { UserCard } from './components/UserCard';
import { ModalRechazo } from './components/ModalRechazo';
import { ModalRecurso } from './components/ModalRecurso';
import { LightboxOverlay } from './components/LightboxOverlay';
import { PhotoEditorModal } from './components/PhotoEditorModal';
import { getMediaUrl } from '@/lib/media-url';

export default function AsuntosPendientesPage() {
  const [tab, setTab] = useState<'pendientes' | 'recursos'>('pendientes');
  const [collapsedUsers, setCollapsedUsers] = useState<Record<number, boolean>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const savedTab = sessionStorage.getItem('asuntos_tab');
    if (savedTab) setTab(savedTab as any);
    const savedCol = sessionStorage.getItem('asuntos_collapsed');
    if (savedCol) { try { setCollapsedUsers(JSON.parse(savedCol)); } catch {} }
  }, []);

  const { pendientes, setPendientes, userStats, loading, processing, toast, showToast, load, handleValidar, handleRestaurar, groupedData } = usePendientes(tab);
  const editor = usePhotoEditor(load);
  const rechazos = useRechazos(setPendientes, () => {}, showToast);

  useEffect(() => {
    if (!loading) {
      const s = sessionStorage.getItem('asuntos_scroll');
      if (s) { setTimeout(() => { window.scrollTo(0, parseInt(s, 10)); sessionStorage.removeItem('asuntos_scroll'); }, 50); }
    }
  }, [loading]);

  const saveStateForReturn = () => sessionStorage.setItem('asuntos_scroll', window.scrollY.toString());

  const handleToggleCollapse = (uIdx: number) => {
    setCollapsedUsers(prev => { const next = { ...prev, [uIdx]: !prev[uIdx] }; sessionStorage.setItem('asuntos_collapsed', JSON.stringify(next)); return next; });
  };

  const handleMouseEnterTooltip = (e: React.MouseEvent, text: string) => {
    if (!text) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.bottom + 10, text });
  };

  const fotoRechazo = pendientes.find(p => p.id === rechazos.rechazandoId);

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 99998, background: '#1e293b', color: 'white', padding: '14px 20px', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontSize: '0.9rem', fontWeight: 600, maxWidth: '400px' }}>
          {toast}
        </div>
      )}

      {/* Navegación — Regla 7 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[['🏠 Volver al Inicio', '/dashboard'], ['🌐 Volver a Panel Admin', '/dashboard/admin']].map(([label, href]) => (
          <a key={href} href={href} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', fontSize: '0.82rem', fontWeight: 700, textDecoration: 'none', border: '1px solid #e2e8f0' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#e2e8f0'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'}>
            {label}
          </a>
        ))}
      </div>

      {/* Subheader — Regla 6 */}
      <div style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '24px 30px', borderRadius: '16px', marginBottom: '24px', color: 'white', boxShadow: '0 4px 15px rgba(245,158,11,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>📋 Asuntos Pendientes</h1>
          <button onClick={() => load()} style={{ padding: '10px 18px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>🔄 Actualizar</button>
        </div>
        <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>Fotos subidas por usuarios que necesitan tu validación.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {([['pendientes', '📷 Fotos Nuevas', '#3b82f6'], ['recursos', '⚖️ Recursos de Usuarios', '#8b5cf6']] as const).map(([id, label, color]) => (
          <button key={id} onClick={() => { setTab(id); sessionStorage.setItem('asuntos_tab', id); }}
            style={{ flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem', background: tab === id ? color : 'white', color: tab === id ? 'white' : '#64748b', border: tab === id ? 'none' : '1px solid #e2e8f0', cursor: 'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Overlay carga — Regla 6 */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', backdropFilter: 'blur(2px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'inline-block', width: '36px', height: '36px', border: '4px solid #e2e8f0', borderTop: '4px solid #f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Cargando datos...</span>
            </div>
          </div>
        )}
        <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {pendientes.length === 0 ? (
            <div style={{ background: 'white', borderRadius: '16px', padding: '60px 40px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
              <h2 style={{ margin: 0, color: '#10b981' }}>¡Todo al día!</h2>
              <p style={{ color: '#64748b', margin: '8px 0 0' }}>No hay fotos pendientes de validar</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: tab === 'pendientes' ? '#fffbeb' : '#f3e8ff', border: `1px solid ${tab === 'pendientes' ? '#fde68a' : '#d8b4fe'}`, borderRadius: '12px', padding: '12px 16px', fontSize: '0.9rem', color: tab === 'pendientes' ? '#92400e' : '#6b21a8' }}>
                ⚠️ <b>{pendientes.length}</b> {tab === 'pendientes' ? 'foto(s) pendiente(s) de validar' : 'recurso(s) por revisar'}
              </div>
              {groupedData.map((user: any, uIdx: number) => (
                <UserCard key={uIdx} user={user} uIdx={uIdx} isCollapsed={!!collapsedUsers[uIdx]}
                  userStats={userStats} tab={tab} processing={processing}
                  onToggleCollapse={handleToggleCollapse}
                  onValidar={handleValidar} onRechazar={rechazos.abrirModalRechazo}
                  onRestaurar={handleRestaurar} onRechazarRecurso={rechazos.abrirModalRechazoRecurso}
                  onEditar={editor.open} onLightbox={setLightboxUrl}
                  onMouseEnterTooltip={handleMouseEnterTooltip}
                  onMouseLeaveTooltip={() => setTooltip(null)}
                  saveStateForReturn={saveStateForReturn}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales y Overlays */}
      {rechazos.rechazandoId && fotoRechazo && (
        <ModalRechazo foto={fotoRechazo} motivoSeleccionado={rechazos.motivoSeleccionado}
          setMotivoSeleccionado={rechazos.setMotivoSeleccionado} motivoExtra={rechazos.motivoExtra}
          setMotivoExtra={rechazos.setMotivoExtra} processing={processing}
          onConfirmar={rechazos.confirmarRechazo} onCancelar={rechazos.cerrarModalRechazo}
          getMediaUrl={getMediaUrl} />
      )}
      {rechazos.rechazandoRecursoId && (
        <ModalRecurso motivoRechazoRecurso={rechazos.motivoRechazoRecurso}
          setMotivoRechazoRecurso={rechazos.setMotivoRechazoRecurso}
          onConfirmar={rechazos.handleRechazarRecursoConfirmado}
          onCancelar={() => rechazos.setMotivoRechazoRecurso('')} />
      )}
      {lightboxUrl && <LightboxOverlay url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      {editor.editingPhoto && (
        <PhotoEditorModal editingPhoto={editor.editingPhoto}
          editorX={editor.editorX} editorY={editor.editorY} editorZoom={editor.editorZoom}
          editorBrightness={editor.editorBrightness} editorContrast={editor.editorContrast}
          editorStyle={editor.editorStyle} editorSeoAlt={editor.editorSeoAlt}
          STYLE_FILTERS={editor.STYLE_FILTERS} saveStatus={editor.saveStatus}
          setEditorZoom={editor.setEditorZoom} setEditorBrightness={editor.setEditorBrightness}
          setEditorContrast={editor.setEditorContrast} setEditorStyle={editor.setEditorStyle}
          setEditorSeoAlt={editor.setEditorSeoAlt} setEditorX={editor.setEditorX} setEditorY={editor.setEditorY}
          onMouseDown={editor.onMouseDown} onTouchStart={editor.onTouchStart} onTouchMove={editor.onTouchMove}
          onSave={editor.save} onClose={editor.close} />
      )}

      {/* Tooltip global */}
      {tooltip && (
        <div style={{ position: 'fixed', top: tooltip.y, left: tooltip.x, transform: 'translateX(-50%)', background: '#1e293b', color: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxWidth: '320px', zIndex: 99999, boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-4px', left: '50%', transform: 'translateX(-50%) rotate(45deg)', width: '8px', height: '8px', background: '#1e293b' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>{tooltip.text}</div>
        </div>
      )}
    </div>
  );
}
