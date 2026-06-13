import React from 'react';
import Link from 'next/link';
import { useProfileData } from '../hooks/useProfileData';

interface PreferenciasTabProps {
  profileData: ReturnType<typeof useProfileData>;
}

export function PreferenciasTab({ profileData }: PreferenciasTabProps) {
  const {
    profile,
    tipoCalendario,
    setTipoCalendario,
    tipoLaboreo,
    setTipoLaboreo,
    camaCultivoBilateral,
    setCamaCultivoBilateral,
    camaCultivoUnilateral,
    setCamaCultivoUnilateral,
    pasillo,
    setPasillo,
    autoSaveField,
    showToast
  } = profileData;

  if (!profile) return null;

  const plan = (profile.suscripcion || '').toLowerCase();

  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.1rem', fontWeight: 800 }}>🌾 Mi forma de cultivar</h3>
      <div className="accordion-body" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
        {/* Subapartado 1: Calendario de cultivo */}
        <div className="optional-zone" style={{ marginTop: '0px' }}>
          <div className="optional-zone-header" style={{ marginBottom: '15px' }}>
            <h3>🌾 Calendario de cultivo</h3>
            <p>Personaliza las notificaciones de siembra y cosecha según tu filosofía de cultivo y suscripción.</p>
          </div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                
                {/* Normal */}
                <div 
                  onClick={() => {
                    setTipoCalendario('Normal');
                    autoSaveField('tipoCalendario', 'Normal');
                    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoCalendario: 'Normal' } }));
                  }}
                  style={{
                    border: tipoCalendario === 'Normal' ? '2.5px solid #10b981' : '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: tipoCalendario === 'Normal' ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                    boxShadow: tipoCalendario === 'Normal' ? '0 8px 24px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: tipoCalendario === 'Normal' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = tipoCalendario === 'Normal' ? 'translateY(-4px) scale(1.025)' : 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = tipoCalendario === 'Normal' ? '0 12px 28px rgba(16, 185, 129, 0.22)' : '0 6px 16px rgba(0,0,0,0.08)';
                    if (tipoCalendario !== 'Normal') e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = tipoCalendario === 'Normal' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = tipoCalendario === 'Normal' ? '0 8px 24px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                    if (tipoCalendario !== 'Normal') e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  {tipoCalendario === 'Normal' && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                    }}>
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌱</div>
                  <h4 style={{ margin: '0 0 5px 0', color: tipoCalendario === 'Normal' ? '#047857' : '#334155', fontWeight: 700 }}>Calendario Normal</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Basado únicamente en las épocas estándar de siembra y cosecha del año.</p>
                </div>

                {/* Lunar */}
                <div 
                  onClick={() => {
                    const hasAccess = ['esencial','avanzado','premium'].includes(plan);
                    if (!hasAccess) {
                      showToast('❌ El calendario Lunar requiere un plan Esencial o superior');
                      return;
                    }
                    setTipoCalendario('Lunar');
                    autoSaveField('tipoCalendario', 'Lunar');
                    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoCalendario: 'Lunar' } }));
                  }}
                  style={{
                    border: tipoCalendario === 'Lunar' ? '2.5px solid #3b82f6' : '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: ['esencial','avanzado','premium'].includes(plan) ? 'pointer' : 'not-allowed',
                    background: tipoCalendario === 'Lunar' ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : (!['esencial','avanzado','premium'].includes(plan) ? '#f8fafc' : '#ffffff'),
                    opacity: ['esencial','avanzado','premium'].includes(plan) ? 1 : 0.6,
                    boxShadow: tipoCalendario === 'Lunar' ? '0 8px 24px rgba(59, 130, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: tipoCalendario === 'Lunar' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    const hasAccess = ['esencial','avanzado','premium'].includes(plan);
                    if (!hasAccess) return;
                    e.currentTarget.style.transform = tipoCalendario === 'Lunar' ? 'translateY(-4px) scale(1.025)' : 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = tipoCalendario === 'Lunar' ? '0 12px 28px rgba(59, 130, 246, 0.22)' : '0 6px 16px rgba(0,0,0,0.08)';
                    if (tipoCalendario !== 'Lunar') e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    const hasAccess = ['esencial','avanzado','premium'].includes(plan);
                    if (!hasAccess) return;
                    e.currentTarget.style.transform = tipoCalendario === 'Lunar' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = tipoCalendario === 'Lunar' ? '0 8px 24px rgba(59, 130, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                    if (tipoCalendario !== 'Lunar') e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  {!['esencial','avanzado','premium'].includes(plan) && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: '1.2rem' }}>🔒</div>}
                  {tipoCalendario === 'Lunar' && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                    }}>
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌔</div>
                  <h4 style={{ margin: '0 0 5px 0', color: tipoCalendario === 'Lunar' ? '#1d4ed8' : '#334155', fontWeight: 700 }}>Calendario Lunar</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Añade la influencia gravitacional y fases de la luna para optimizar la savia.</p>
                  <div style={{ marginTop: '10px' }}>
                    <Link href="/blog/calendario-lunar" style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }} onClick={(e) => e.stopPropagation()}>
                      Leer Guía Práctica del Calendario Lunar
                    </Link>
                  </div>
                  <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.7rem', padding: '3px 8px', background: tipoCalendario === 'Lunar' ? '#bfdbfe' : '#dbeafe', color: tipoCalendario === 'Lunar' ? '#1e40af' : '#1d4ed8', borderRadius: '10px', fontWeight: 'bold' }}>Requiere Plan Esencial</span>
                </div>

                {/* Biodinámico */}
                <div 
                  onClick={() => {
                    if (!['avanzado','pro','premium'].includes(plan)) {
                      showToast('❌ El calendario Biod. requiere un plan Avanzado o Premium');
                      return;
                    }
                    setTipoCalendario('Biodinámico');
                    autoSaveField('tipoCalendario', 'Biodinámico');
                    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoCalendario: 'Biodinámico' } }));
                  }}
                  style={{
                    border: tipoCalendario === 'Biodinámico' ? '2.5px solid #8b5cf6' : '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: !['avanzado','pro','premium'].includes(plan) ? 'not-allowed' : 'pointer',
                    background: tipoCalendario === 'Biodinámico' ? 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)' : (!['avanzado','pro','premium'].includes(plan) ? '#f8fafc' : '#ffffff'),
                    opacity: !['avanzado','pro','premium'].includes(plan) ? 0.6 : 1,
                    boxShadow: tipoCalendario === 'Biodinámico' ? '0 8px 24px rgba(139, 92, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: tipoCalendario === 'Biodinámico' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    const hasAccess = ['avanzado','pro','premium'].includes(plan);
                    if (!hasAccess) return;
                    e.currentTarget.style.transform = tipoCalendario === 'Biodinámico' ? 'translateY(-4px) scale(1.025)' : 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = tipoCalendario === 'Biodinámico' ? '0 12px 28px rgba(139, 92, 246, 0.22)' : '0 6px 16px rgba(0,0,0,0.08)';
                    if (tipoCalendario !== 'Biodinámico') e.currentTarget.style.borderColor = '#8b5cf6';
                  }}
                  onMouseLeave={(e) => {
                    const hasAccess = ['avanzado','pro','premium'].includes(plan);
                    if (!hasAccess) return;
                    e.currentTarget.style.transform = tipoCalendario === 'Biodinámico' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = tipoCalendario === 'Biodinámico' ? '0 8px 24px rgba(139, 92, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                    if (tipoCalendario !== 'Biodinámico') e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  {!['avanzado','pro','premium'].includes(plan) && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: '1.2rem' }}>🔒</div>}
                  {tipoCalendario === 'Biodinámico' && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#8b5cf6',
                      color: 'white',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(139, 92, 246, 0.3)'
                    }}>
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✨</div>
                  <h4 style={{ margin: '0 0 5px 0', color: tipoCalendario === 'Biodinámico' ? '#5b21b6' : '#334155', fontWeight: 700 }}>Calendario Biodinámico</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Cosmos, constelaciones y elementos (raíz, hoja, flor, fruto) según Maria Thun.</p>
                  <span style={{ display: 'inline-block', marginTop: '8px', fontSize: '0.7rem', padding: '3px 8px', background: tipoCalendario === 'Biodinámico' ? '#ddd6fe' : '#ede9fe', color: tipoCalendario === 'Biodinámico' ? '#4c1d95' : '#6d28d9', borderRadius: '10px', fontWeight: 'bold' }}>Requiere Plan Avanzado o Premium</span>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Subapartado 2: Filosofía de laboreo */}
        <div id="filosofia-laboreo" className="optional-zone" style={{ marginTop: '0px' }}>
          <div className="optional-zone-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3>🚜 Filosofía de laboreo</h3>
              <p>Elige cómo trabajas la tierra en tus cultivos para adaptar las recomendaciones de preparación de suelo.</p>
            </div>
            <a 
              href="/filosofia-laboreo.html" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '600',
                textDecoration: 'none',
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#e2e8f0';
                e.currentTarget.style.color = '#1e293b';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#475569';
              }}
            >
              📄 Ver / Imprimir infografía (PDF)
            </a>
          </div>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                
                {/* Convencional */}
                <div 
                  onClick={() => {
                    setTipoLaboreo('Convencional');
                    autoSaveField('tipoLaboreo', 'Convencional');
                    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoLaboreo: 'Convencional' } }));
                  }}
                  style={{
                    border: tipoLaboreo === 'Convencional' ? '2.5px solid #d97706' : '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: tipoLaboreo === 'Convencional' ? 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' : '#ffffff',
                    boxShadow: tipoLaboreo === 'Convencional' ? '0 8px 24px rgba(217, 119, 6, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: tipoLaboreo === 'Convencional' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = tipoLaboreo === 'Convencional' ? 'translateY(-4px) scale(1.025)' : 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = tipoLaboreo === 'Convencional' ? '0 12px 28px rgba(217, 119, 6, 0.22)' : '0 6px 16px rgba(0,0,0,0.08)';
                    if (tipoLaboreo !== 'Convencional') e.currentTarget.style.borderColor = '#d97706';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = tipoLaboreo === 'Convencional' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = tipoLaboreo === 'Convencional' ? '0 8px 24px rgba(217, 119, 6, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                    if (tipoLaboreo !== 'Convencional') e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  {tipoLaboreo === 'Convencional' && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#d97706',
                      color: 'white',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)'
                    }}>
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚜</div>
                  <h4 style={{ margin: '0 0 5px 0', color: tipoLaboreo === 'Convencional' ? '#92400e' : '#334155', fontWeight: 700 }}>Laboreo Convencional</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Remoción profunda y volteo del suelo con herramientas tradicionales.</p>
                </div>

                {/* Mínimo */}
                <div 
                  onClick={() => {
                    setTipoLaboreo('Mínimo');
                    autoSaveField('tipoLaboreo', 'Mínimo');
                    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoLaboreo: 'Mínimo' } }));
                  }}
                  style={{
                    border: tipoLaboreo === 'Mínimo' ? '2.5px solid #0d9488' : '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: tipoLaboreo === 'Mínimo' ? 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)' : '#ffffff',
                    boxShadow: tipoLaboreo === 'Mínimo' ? '0 8px 24px rgba(13, 148, 136, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: tipoLaboreo === 'Mínimo' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = tipoLaboreo === 'Mínimo' ? 'translateY(-4px) scale(1.025)' : 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = tipoLaboreo === 'Mínimo' ? '0 12px 28px rgba(13, 148, 136, 0.22)' : '0 6px 16px rgba(0,0,0,0.08)';
                    if (tipoLaboreo !== 'Mínimo') e.currentTarget.style.borderColor = '#0d9488';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = tipoLaboreo === 'Mínimo' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = tipoLaboreo === 'Mínimo' ? '0 8px 24px rgba(13, 148, 136, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                    if (tipoLaboreo !== 'Mínimo') e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  {tipoLaboreo === 'Mínimo' && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#0d9488',
                      color: 'white',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)'
                    }}>
                      ✓
                    </div>
                  )}
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔱</div>
                  <h4 style={{ margin: '0 0 5px 0', color: tipoLaboreo === 'Mínimo' ? '#0f766e' : '#334155', fontWeight: 700 }}>Laboreo Mínimo</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Descompactación vertical sin voltear perfiles, respetando la estructura del suelo.</p>
                </div>

                {/* No Laboreo */}
                <div 
                  onClick={() => {
                    setTipoLaboreo('No laboreo');
                    autoSaveField('tipoLaboreo', 'No laboreo');
                    window.dispatchEvent(new CustomEvent('profile_updated', { detail: { tipoLaboreo: 'No laboreo' } }));
                  }}
                  style={{
                    border: tipoLaboreo === 'No laboreo' ? '2.5px solid #10b981' : '1px solid #cbd5e1',
                    borderRadius: '16px',
                    padding: '20px',
                    cursor: 'pointer',
                    background: tipoLaboreo === 'No laboreo' ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' : '#ffffff',
                    boxShadow: tipoLaboreo === 'No laboreo' ? '0 8px 24px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transform: tipoLaboreo === 'No laboreo' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = tipoLaboreo === 'No laboreo' ? 'translateY(-4px) scale(1.025)' : 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = tipoLaboreo === 'No laboreo' ? '0 12px 28px rgba(16, 185, 129, 0.22)' : '0 6px 16px rgba(0,0,0,0.08)';
                    if (tipoLaboreo !== 'No laboreo') e.currentTarget.style.borderColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = tipoLaboreo === 'No laboreo' ? 'translateY(-2px) scale(1.02)' : 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = tipoLaboreo === 'No laboreo' ? '0 8px 24px rgba(16, 185, 129, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)';
                    if (tipoLaboreo !== 'No laboreo') e.currentTarget.style.borderColor = '#cbd5e1';
                  }}
                >
                  {tipoLaboreo === 'No laboreo' && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: '#10b981',
                      color: 'white',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                    }}>
                      ✓
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🍂</div>
                    <h4 style={{ margin: '0 0 5px 0', color: tipoLaboreo === 'No laboreo' ? '#047857' : '#334155', fontWeight: 700 }}>No Laboreo (No-Till)</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Perturbación física nula del suelo. Siembra directa bajo acolchado permanente.</p>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <a 
                      href="/blog/guia-definitiva-no-laboreo" 
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        color: '#10b981',
                        textDecoration: 'none',
                        borderBottom: '1px dashed #10b981',
                        paddingBottom: '2px',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.color = '#059669';
                        e.currentTarget.style.borderBottomStyle = 'solid';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.color = '#10b981';
                        e.currentTarget.style.borderBottomStyle = 'dashed';
                      }}
                    >
                      📖 Leer guía en el Blog →
                    </a>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Subapartado 3: Cama de cultivo y Pasillo */}
        <div id="cama-cultivo" className="optional-zone" style={{ marginTop: '30px' }}>
          <div className="optional-zone-header" style={{ marginBottom: '15px' }}>
            <h3>🌱 Preferencias de Camas de Cultivo y Pasillos</h3>
            <p>Configura las dimensiones ideales de tu huerto. Estas medidas se utilizarán por defecto al calcular la distribución de tus bancales.</p>
          </div>
          <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            
            {/* Cama Bilateral */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '2.2rem', marginTop: '4px' }}>↕️</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontWeight: 700 }}>Cama Bilateral</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b', minHeight: '48px' }}>
                  Acceso desde ambos lados. El estándar agroecológico recomendado para trabajar cómodamente es de 1,20 m.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0.2"
                    max="10.0"
                    value={camaCultivoBilateral}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCamaCultivoBilateral(isNaN(val) ? 0 : val);
                    }}
                    onBlur={() => {
                      const val = Math.max(0.2, Math.min(10.0, camaCultivoBilateral || 1.20));
                      setCamaCultivoBilateral(val);
                      autoSaveField('camaCultivoBilateral', String(val));
                    }}
                    style={{
                      width: '100px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569' }}>metros</span>
                </div>
              </div>
            </div>

            {/* Cama Unilateral */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '2.2rem', marginTop: '4px' }}>🧱</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontWeight: 700 }}>Cama Unilateral</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b', minHeight: '48px' }}>
                  Acceso por un solo lado (apoyado en pared o valla). Se recomienda de 0,70 m a 0,80 m para alcanzar el fondo.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0.1"
                    max="5.0"
                    value={camaCultivoUnilateral}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCamaCultivoUnilateral(isNaN(val) ? 0 : val);
                    }}
                    onBlur={() => {
                      const val = Math.max(0.1, Math.min(5.0, camaCultivoUnilateral || 0.75));
                      setCamaCultivoUnilateral(val);
                      autoSaveField('camaCultivoUnilateral', String(val));
                    }}
                    style={{
                      width: '100px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569' }}>metros</span>
                </div>
              </div>
            </div>

            {/* Pasillo entre Camas */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <span style={{ fontSize: '2.2rem', marginTop: '4px' }}>🚶</span>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontWeight: 700 }}>Pasillos / Caminos</h4>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b', minHeight: '48px' }}>
                  Ancho de caminos entre camas. El estándar es de 0,50 m para transitar cómodamente y pasar con carretilla.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="number" 
                    step="0.05"
                    min="0.1"
                    max="3.0"
                    value={pasillo}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setPasillo(isNaN(val) ? 0 : val);
                    }}
                    onBlur={() => {
                      const val = Math.max(0.1, Math.min(3.0, pasillo || 0.50));
                      setPasillo(val);
                      autoSaveField('pasillo', String(val));
                    }}
                    style={{
                      width: '100px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.9rem',
                      color: '#1e293b',
                      fontWeight: 700,
                      textAlign: 'center',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                  <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569' }}>metros</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
