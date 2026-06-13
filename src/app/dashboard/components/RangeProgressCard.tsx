'use client';

import React from 'react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

interface RangeProgressCardProps {
  todosLogros: any[];
  misLogros: any[];
  misSemillas: any[];
  misCultivos: any[];
  misMensajesComunidad: any[];
  profile: any;
  isLogrosExpanded: boolean;
  setIsLogrosExpanded: (val: boolean) => void;
  showSemillasDetalle: boolean;
  setShowSemillasDetalle: (val: boolean | ((prev: boolean) => boolean)) => void;
  showCultivoDetalle: boolean;
  setShowCultivoDetalle: (val: boolean | ((prev: boolean) => boolean)) => void;
  openSeedModal: () => void;
  openCropWizard: () => void;
  isMobile?: boolean;
}

export default function RangeProgressCard({
  todosLogros,
  misLogros,
  misSemillas,
  misCultivos,
  misMensajesComunidad,
  profile,
  isLogrosExpanded,
  setIsLogrosExpanded,
  showSemillasDetalle,
  setShowSemillasDetalle,
  showCultivoDetalle,
  setShowCultivoDetalle,
  openSeedModal,
  openCropWizard,
  isMobile = false
}: RangeProgressCardProps) {
  const pendientes = todosLogros.filter((tl: any) => !misLogros.some((ml: any) => ml.nombre_logro === tl.logrosnombre));
  const siguiente = pendientes[0];
  if (!siguiente) return null;

  const actualLogro = misLogros.length > 0 ? misLogros[misLogros.length - 1] : null;
  const actualLogroIcono = actualLogro?.logrosicono || (profile?.roles?.includes('visitante') ? '👁️' : '🧑‍🌾');
  const actualLogroNombre = actualLogro?.nombre_logro || (profile?.roles?.includes('visitante') ? 'Visitante' : 'Aprendiz');
  const actualLogroNivel = actualLogro?.logrosnivel || 1;

  const reqList: React.ReactNode[] = [];

  // 🌰 Requisito de Semillas
  if (siguiente.req_semillas > 0) {
    const totalSemillas = misSemillas.length;
    const satis = totalSemillas >= siguiente.req_semillas;
    reqList.push(
      <div key="semillas" style={{ 
        display: 'flex', flexDirection: 'column', gap: '8px', width: '100%',
        background: satis ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(220, 252, 231, 0.8))' : 'linear-gradient(135deg, rgba(255, 251, 235, 0.9), rgba(254, 243, 199, 0.8))', 
        padding: '16px 20px', 
        borderRadius: '16px', 
        border: satis ? '2px solid rgba(52, 211, 153, 0.4)' : '2px solid rgba(251, 191, 36, 0.4)',
        color: satis ? '#065f46' : '#92400e',
        boxShadow: satis ? '0 8px 20px rgba(52, 211, 153, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)' : '0 8px 20px rgba(251, 191, 36, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'white', borderRadius: '14px',
            boxShadow: satis ? '0 4px 12px rgba(52, 211, 153, 0.3)' : '0 4px 12px rgba(251, 191, 36, 0.3)',
            animation: satis ? 'none' : 'float 3s ease-in-out infinite'
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 2px 4px rgba(217, 119, 6, 0.3))' }}>
              <g transform="translate(-6, 4) rotate(-30 16 16) scale(0.8)">
                <path d="M16 4C20 10 20 22 16 28C12 22 12 10 16 4Z" fill="#d97706" />
                <path d="M16 6L16 26" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </g>
              <g transform="translate(6, 4) rotate(30 16 16) scale(0.8)">
                <path d="M16 4C20 10 20 22 16 28C12 22 12 10 16 4Z" fill="#d97706" />
                <path d="M16 6L16 26" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </g>
              <g transform="translate(0, -2)">
                <path d="M16 4C20 10 20 22 16 28C12 22 12 10 16 4Z" fill="#f59e0b" />
                <path d="M16 6L16 26" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
              </g>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {satis ? '¡Colección de semillas! ✅' : 'Colección de semillas'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: satis ? '#059669' : '#b45309', opacity: 0.9 }}>
              {totalSemillas} / {siguiente.req_semillas} en inventario
            </span>
          </div>
          <div style={{ 
            marginLeft: isMobile ? '0' : 'auto', 
            display: 'flex', 
            alignItems: 'center', 
            flexWrap: 'wrap', 
            gap: '8px',
            width: isMobile ? '100%' : 'auto',
            marginTop: isMobile ? '12px' : '0'
          }}>
            {misSemillas.length > 0 ? (
              <>
                <button onClick={() => setShowSemillasDetalle(v => !v)} style={{ 
                  background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(217,119,6,0.3)', 
                  cursor: 'pointer', fontSize: '0.8rem', color: '#b45309', fontWeight: 700, 
                  padding: '8px 14px', borderRadius: '10px', transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(217,119,6,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                  width: isMobile ? '100%' : '150px', height: '42px', boxSizing: 'border-box'
                }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}>
                  {showSemillasDetalle ? 'Ocultar semillas ▲' : 'Ver semillas ▼'}
                </button>
                <a href="/dashboard/semillas" style={{ 
                  fontSize: '0.85rem', color: satis ? '#065f46' : '#92400e', fontWeight: 800, 
                  border: '1px solid ' + (satis ? 'rgba(5, 150, 105, 0.3)' : 'rgba(217, 119, 6, 0.3)'),
                  background: 'rgba(255,255,255,0.5)', padding: '10px 14px', borderRadius: '12px', 
                  textDecoration: 'none', transition: 'all 0.2s', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                  width: isMobile ? '100%' : '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}>
                  Ir a mis semillas ➔
                </a>
                <button onClick={openSeedModal} style={{ 
                  fontSize: '0.85rem', color: '#92400e', fontWeight: 800, border: 'none',
                  background: 'linear-gradient(to bottom, #fde047, #facc15)', padding: '10px 18px', 
                  borderRadius: '12px', boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)',
                  cursor: 'pointer', transition: 'all 0.2s', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                  width: isMobile ? '100%' : '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 204, 21, 0.5), inset 0 1px 1px rgba(255,255,255,0.6)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)'; }}>
                  Añadir semillas <span style={{ fontSize: '1rem' }}>+</span>
                </button>
              </>
            ) : (
              <button onClick={openSeedModal} style={{ 
                fontSize: '0.85rem', color: '#92400e', fontWeight: 800, border: 'none',
                background: 'linear-gradient(to bottom, #fde047, #facc15)', padding: '10px 18px', 
                borderRadius: '12px', boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)',
                cursor: 'pointer', transition: 'all 0.2s', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: isMobile ? '100%' : 'auto'
              }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 204, 21, 0.5), inset 0 1px 1px rgba(255,255,255,0.6)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)'; }}>
                Añadir ahora <span style={{ fontSize: '1rem' }}>+</span>
              </button>
            )}
          </div>
        </div>

        {/* Desplegable de Semillas */}
        <div style={{
          maxHeight: showSemillasDetalle && misSemillas.length > 0 ? '500px' : '0',
          opacity: showSemillasDetalle && misSemillas.length > 0 ? 1 : 0,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ 
            display: 'flex', flexDirection: 'column', gap: '10px', 
            padding: '16px', background: 'rgba(255,255,255,0.5)',
            borderRadius: '16px', border: '1px solid rgba(217,119,6,0.2)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
            marginTop: '4px'
          }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#92400e', marginBottom: '4px' }}>
              Tus Semillas Recientes
            </div>
            {misSemillas.slice(0, 5).map((s: any) => (
              <div key={s.idsemillas} style={{ 
                background: 'white', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(217,119,6,0.1)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.9rem' }}>
                  🌱 {s.especiesnombre}{s.variedades_nombre ? ` (${s.variedades_nombre})` : ''}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.75rem', background: '#fef3c7', padding: '2px 8px', borderRadius: '6px', color: '#92400e', fontWeight: 700 }}>
                    Stock: {s.semillasstockactual}
                  </span>
                  <a href={`/dashboard/semillas/${s.idsemillas}`} style={{ fontSize: '0.65rem', color: '#d97706', fontWeight: 800, textDecoration: 'none' }}>Editar ➔</a>
                </div>
              </div>
            ))}
            {misSemillas.length > 5 && (
              <div style={{ textAlign: 'center', marginTop: '8px' }}>
                <a href="/dashboard/semillas" style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 800, textDecoration: 'none' }}>
                  Ver {misSemillas.length - 5} más ➔
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 🌱 Requisito de Cultivos
  if (siguiente.req_siembras > 0) {
    const cultivosCompletados = misCultivos.filter((c: any) => c.cultivosestado === 'finalizado' && c.cultivosfecharecoleccion && c.fotos_propias_count > 0).length;
    const cultivosEnCurso = misCultivos.filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido').length;
    const cultivosEnRecoleccion = misCultivos.filter((c: any) => c.cultivosestado === 'recoleccion').length;
    const satis = cultivosCompletados >= siguiente.req_siembras;
    reqList.push(
      <div key="siembras" style={{ 
        display: 'flex', flexDirection: 'column', gap: '8px', width: '100%',
        background: satis ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(220, 252, 231, 0.8))' : 'linear-gradient(135deg, rgba(254, 242, 242, 0.9), rgba(254, 226, 226, 0.8))', 
        padding: '16px 20px', 
        borderRadius: '16px', 
        border: satis ? '2px solid rgba(52, 211, 153, 0.4)' : '2px solid rgba(248, 113, 113, 0.4)',
        color: satis ? '#065f46' : '#991b1b',
        boxShadow: satis ? '0 8px 20px rgba(52, 211, 153, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)' : '0 8px 20px rgba(248, 113, 113, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '16px'
        }}>
          <div style={{
            width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'white', borderRadius: '14px',
            boxShadow: satis ? '0 4px 12px rgba(52, 211, 153, 0.3)' : '0 4px 12px rgba(248, 113, 113, 0.3)',
            animation: satis ? 'none' : 'float 3.5s ease-in-out infinite'
          }}>
            <svg width="28" height="28" viewBox="0 0 32 32" style={{ filter: 'drop-shadow(0 3px 5px rgba(20, 184, 166, 0.3))' }}>
              <line x1="18" y1="23" x2="18" y2="6" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="18" y1="23" x2="18" y2="6" stroke="#84cc16" strokeWidth="1" strokeLinecap="round" />
              <g stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" fill="#84cc16">
                <path d="M 18 7 Q 14 7, 14 3 Q 18 3, 18 7 Z" />
                <path d="M 18 7 Q 22 7, 22 3 Q 18 3, 18 7 Z" />
                <path d="M 18 12 Q 12 12, 12 6 Q 18 6, 18 12 Z" />
                <path d="M 18 12 Q 24 12, 24 6 Q 18 6, 18 12 Z" />
                <path d="M 18 17 Q 10 17, 10 9 Q 18 9, 18 17 Z" />
                <path d="M 18 17 Q 26 17, 26 9 Q 18 9, 18 17 Z" />
              </g>
              <path d="M 7 25 C 13 28, 20 29, 25 26 Q 31 23, 30 25 C 28 28, 22 32, 15 32 L 7 30 Z" fill="#fcd34d" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M 10 25 C 10 20, 15 19, 18 19 C 22 19, 25 20, 27 23 C 28 25, 25 27, 18 27 C 12 27, 10 26, 10 25 Z" fill="#78350f" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="14" cy="21" r="0.75" fill="#1e293b" />
              <circle cx="21" cy="22" r="0.75" fill="#1e293b" />
              <circle cx="24" cy="24" r="0.75" fill="#1e293b" />
              <path d="M 7 22 C 11 21, 14 22, 15 24 C 13 26, 10 26, 7 25 Z" fill="#fcd34d" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M 2 19 L 7 19 L 7 32 L 2 32 Z" fill="#0ea5e9" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M 7 18 L 10 18 L 10 32 L 7 32 Z" fill="#0284c7" stroke="#1e293b" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {satis ? '¡Cultivos finalizados! ✅' : 'Cosecha tus Cultivos'}
            </span>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: satis ? '#059669' : '#b91c1c', opacity: 0.9 }}>
              {cultivosCompletados} de {siguiente.req_siembras} cultivo{siguiente.req_siembras > 1 ? 's' : ''} completado{siguiente.req_siembras > 1 ? 's' : ''}
              {cultivosEnCurso > 0 && (
                <span style={{ marginLeft: '6px', paddingLeft: '6px', borderLeft: '1px solid currentColor', opacity: 0.8 }}>
                  {cultivosEnCurso} en curso
                </span>
              )}
            </span>
            <div style={{ marginTop: '8px', fontSize: '0.75rem', color: satis ? '#064e3b' : '#7f1d1d', opacity: 0.85, lineHeight: 1.4 }}>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Criterios para contabilizar:</strong>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                <li>Cultivo en estado <strong>Finalizado</strong>.</li>
                <li>Tener registrada <strong>Fecha de Recolección</strong>.</li>
                <li>Tener al menos <strong>1 foto asociada</strong>.</li>
              </ul>
            </div>
          </div>
          
          {!satis && (
            <div style={{ 
              marginLeft: isMobile ? '0' : 'auto', 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: '8px',
              width: isMobile ? '100%' : 'auto',
              marginTop: isMobile ? '12px' : '0'
            }}>
              {cultivosEnRecoleccion > 0 ? (
                <a href="/dashboard/mis-plantas" style={{ 
                  fontSize: '0.85rem', 
                  color: '#854d0e', 
                  fontWeight: 800, 
                  textDecoration: 'none', 
                  background: 'linear-gradient(to bottom, #fde047, #facc15)', 
                  padding: '10px 18px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4), inset 0 1px 1px rgba(255,255,255,0.6)',
                  transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  width: isMobile ? '100%' : 'auto', justifyContent: 'center'
                }}>
                  🧺 Recolectar <span style={{ fontSize: '1rem' }}>➔</span>
                </a>
              ) : cultivosEnCurso > 0 ? (
                <>
                  <button onClick={() => setShowCultivoDetalle(v => !v)} style={{ 
                    background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(248,113,113,0.3)', 
                    cursor: 'pointer', fontSize: '0.8rem', color: '#b91c1c', fontWeight: 700, 
                    padding: '8px 14px', borderRadius: '10px', transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(248,113,113,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                    width: isMobile ? '100%' : '150px', height: '42px', boxSizing: 'border-box'
                  }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}>
                    {showCultivoDetalle ? 'Ocultar progreso ▲' : 'Ver progreso ▼'}
                  </button>
                  <a href="/dashboard/mis-plantas" style={{ 
                    fontSize: '0.85rem', 
                    color: '#b91c1c', 
                    fontWeight: 800, 
                    textDecoration: 'none', 
                    border: '1px solid rgba(248, 113, 113, 0.3)',
                    background: 'rgba(255,255,255,0.5)', 
                    padding: '10px 14px', 
                    borderRadius: '12px',
                    transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                    width: isMobile ? '100%' : '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                  }} onMouseOver={e => e.currentTarget.style.background = 'white'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.5)'}>
                    Ir a mis cultivos ➔
                  </a>
                  <button onClick={openCropWizard} style={{ 
                    fontSize: '0.85rem', 
                    color: 'white', 
                    fontWeight: 800, 
                    border: 'none',
                    background: 'linear-gradient(to bottom, #fb7185, #f43f5e)', 
                    padding: '10px 18px', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                    cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', 
                    width: isMobile ? '100%' : '175px', height: '42px', boxSizing: 'border-box', whiteSpace: 'nowrap'
                  }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)'; }}>
                    Añadir cultivo <span style={{ fontSize: '1rem' }}>+</span>
                  </button>
                </>
              ) : (
                <button onClick={openCropWizard} style={{ 
                  fontSize: '0.85rem', 
                  color: 'white', 
                  fontWeight: 800, 
                  border: 'none',
                  background: 'linear-gradient(to bottom, #fb7185, #f43f5e)', 
                  padding: '10px 18px', 
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
                  cursor: 'pointer', transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  width: isMobile ? '100%' : 'auto', justifyContent: 'center'
                }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.5), inset 0 1px 1px rgba(255,255,255,0.3)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(244, 63, 94, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)'; }}>
                  Crear nuevo ➔
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Timeline Desplegable Premium */}
        <div style={{
          maxHeight: showCultivoDetalle && !satis && cultivosEnCurso > 0 ? '500px' : '0',
          opacity: showCultivoDetalle && !satis && cultivosEnCurso > 0 ? 1 : 0,
          overflowX: 'hidden',
          overflowY: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ 
            display: 'flex', flexDirection: 'column', gap: '10px', 
            padding: '16px', background: 'rgba(255,255,255,0.4)',
            borderRadius: '16px', border: '1px solid rgba(248,113,113,0.2)',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
            marginTop: '4px'
          }}>
            {misCultivos
              .filter((c: any) => c.cultivosestado !== 'perdido')
              .map((c: any, ci: number) => {
                const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : null;
                const fases = [
                  { label: 'Inicio', fecha: fmt(c.cultivosfechainicio) },
                  { label: 'Germinación', fecha: fmt(c.cultivosfechagerminacion) },
                  { label: 'Trasplante', fecha: fmt(c.cultivosfechatrasplante) },
                  { label: 'Recolección', fecha: fmt(c.cultivosfecharecoleccion) },
                  { label: 'Finalizado', fecha: fmt(c.cultivosfechafinalizacion) }
                ];
                const completadas = fases.filter(f => f.fecha);
                const proxima = fases.find(f => !f.fecha);
                return (
                  <div key={ci} style={{ 
                    background: 'white', border: '1px solid rgba(0,0,0,0.05)', 
                    borderRadius: '12px', padding: '12px 16px', 
                    boxShadow: '0 4px 6px rgba(0,0,0,0.02)',
                    display: 'flex', flexDirection: 'column', gap: '8px'
                  }}>
                    <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🌿 {c.especiesnombre}{c.variedad_nombre ? <span style={{ fontWeight: 500, color: '#64748b' }}> ({c.variedad_nombre})</span> : null}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', color: '#64748b' }}>Nº {c.cultivosnumerocoleccion || c.idcultivos}</span>
                        <a href={`/dashboard/cultivos/${c.idcultivos}`} style={{ 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          width: '26px', height: '26px', background: '#e2e8f0', borderRadius: '6px', 
                          color: '#475569', textDecoration: 'none', transition: 'all 0.2s'
                        }} onMouseOver={e => e.currentTarget.style.background = '#cbd5e1'} onMouseOut={e => e.currentTarget.style.background = '#e2e8f0'}>
                          ✏️
                        </a>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {completadas.map((f, fi) => (
                        <div key={fi} style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '80px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.7rem' }}>✅</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#059669' }}>{f.label}</span>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: '#64748b', paddingLeft: '16px' }}>{f.fecha}</span>
                        </div>
                      ))}
                      {proxima && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '90px', borderLeft: '2px dashed #cbd5e1', paddingLeft: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ fontSize: '0.7rem' }}>⏳</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#d97706' }}>{proxima.label}</span>
                          </div>
                          <a href={`/dashboard/cultivos/${c.idcultivos}`} style={{ fontSize: '0.65rem', color: '#2563eb', fontWeight: 700, paddingLeft: '16px', textDecoration: 'none' }}>Actualizar ➔</a>
                        </div>
                      )}
                    </div>

                    {/* Bloque de requisitos de rango */}
                    <div style={{
                      marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.05)',
                      display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.7rem', fontWeight: 700
                    }}>
                      {c.cultivosfechafinalizacion && c.cultivosfecharecoleccion && c.fotos_propias_count > 0 ? (
                        <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✅ Contabilizado para el rango
                        </span>
                      ) : (
                        <>
                          <span style={{ color: '#64748b' }}>Pendiente para contabilizar:</span>
                          {!c.cultivosfechafinalizacion && (
                            <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ⏳ Falta fecha de finalización
                            </span>
                          )}
                          {!c.cultivosfecharecoleccion && (
                            <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              📅 Falta fecha recolección
                            </span>
                          )}
                          {(!c.fotos_propias_count || c.fotos_propias_count === 0) && (
                            <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              📷 Falta foto
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  }

  // 💬 Requisito de Mensajes
  if (siguiente.req_mensajes > 0) {
    const mensajesEnviados = misMensajesComunidad.length;
    const satis = mensajesEnviados >= siguiente.req_mensajes;
    reqList.push(
      <div key="mensajes" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '16px', 
        background: satis ? 'linear-gradient(135deg, rgba(240, 253, 244, 0.9), rgba(220, 252, 231, 0.8))' : 'linear-gradient(135deg, rgba(240, 249, 255, 0.9), rgba(224, 242, 254, 0.8))', 
        padding: '16px 20px', 
        borderRadius: '16px', 
        border: satis ? '2px solid rgba(52, 211, 153, 0.4)' : '2px solid rgba(56, 189, 248, 0.4)',
        color: satis ? '#065f46' : '#0369a1',
        boxShadow: satis ? '0 8px 20px rgba(52, 211, 153, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)' : '0 8px 20px rgba(56, 189, 248, 0.15), inset 0 2px 4px rgba(255,255,255,0.5)'
      }}>
        <div style={{
          width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'white', borderRadius: '14px',
          boxShadow: satis ? '0 4px 12px rgba(52, 211, 153, 0.3)' : '0 4px 12px rgba(56, 189, 248, 0.3)'
        }}>
          <span style={{ fontSize: '1.8rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>💬</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {satis ? '¡Comunidad activa! ✅' : 'Participa en el Chat'}
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: satis ? '#059669' : '#0284c7', opacity: 0.9 }}>
            {mensajesEnviados} de {siguiente.req_mensajes} mensaje{siguiente.req_mensajes > 1 ? 's' : ''} en el grupo de Comunidad Verdantia
          </span>
        </div>
        {!satis && (
          <a id="chat-requisito-btn" href="/dashboard/comunidad?from=rangos" style={{ 
            marginLeft: isMobile ? '0' : 'auto', 
            fontSize: '0.85rem', 
            color: 'white', 
            fontWeight: 800, 
            textDecoration: 'none', 
            background: 'linear-gradient(to bottom, #38bdf8, #0284c7)', 
            padding: '10px 18px', 
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4), inset 0 1px 1px rgba(255,255,255,0.3)',
            transition: 'all 0.2s',
            display: 'flex', alignItems: 'center', gap: '6px',
            width: isMobile ? '100%' : 'auto',
            justifyContent: 'center',
            marginTop: isMobile ? '12px' : '0'
          }}>
            Ir al Chat ➔
          </a>
        )}
      </div>
    );
  }

  // Fallback
  if (reqList.length === 0) {
    reqList.push(
      <div key="fallback" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.9), rgba(241, 245, 249, 0.8))', 
        padding: '16px 20px', 
        borderRadius: '16px', 
        border: '1px solid rgba(203, 213, 225, 0.8)',
        color: '#475569'
      }}>
        <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '1.8rem' }}>✉️</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Misión Principal</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{siguiente.logrosdescripcion || 'Completa tu perfil y verifica tu correo para desbloquear el siguiente rango.'}</span>
        </div>
      </div>
    );
  }

  let totalWeight = 0;
  let currentProgress = 0;

  if (siguiente.req_semillas > 0) {
    totalWeight += 1;
    currentProgress += Math.min(misSemillas.length / siguiente.req_semillas, 1);
  }
  if (siguiente.req_siembras > 0) {
    const cultivosCompletados = misCultivos.filter((c: any) => c.cultivosestado === 'finalizado' && c.cultivosfecharecoleccion && c.fotos_propias_count > 0).length;
    totalWeight += 1;
    currentProgress += Math.min(cultivosCompletados / siguiente.req_siembras, 1);
  }
  if (siguiente.req_mensajes > 0) {
    const mensajesEnviados = misMensajesComunidad.length;
    totalWeight += 1;
    currentProgress += Math.min(mensajesEnviados / siguiente.req_mensajes, 1);
  }
  
  const progresoPorcentaje = totalWeight > 0 ? Math.round((currentProgress / totalWeight) * 100) : 0;

  return (
    <>
      {!isLogrosExpanded ? (
        <div 
          onClick={() => setIsLogrosExpanded(true)}
          style={{
            marginBottom: '2.5rem',
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(253, 224, 71, 0.35))',
            color: '#854d0e',
            border: '1.5px solid rgba(234, 179, 8, 0.4)',
            borderRadius: '16px',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', background: 'white', borderRadius: '10px', border: '1.5px solid rgba(234, 179, 8, 0.6)', flexShrink: 0 }}>
              <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 1px 2px rgba(234,179,8,0.25))' }}>{actualLogroIcono}</span>
              <span style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#ca8a04', color: 'white', width: '16px', height: '16px', borderRadius: '50%', fontSize: '0.62rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid white', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                {actualLogroNivel}
              </span>
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Rango Actual: {actualLogroNombre}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#ca8a04' }}>
            Progreso {progresoPorcentaje}% <span style={{ fontSize: '1rem' }}>▼</span>
          </div>
        </div>
      ) : (
        <div style={{
          marginBottom: '2.5rem',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(253, 224, 71, 0.35))',
          color: '#854d0e',
          border: '1.5px solid rgba(255, 255, 255, 0.9)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(16, 185, 129, 0.08), 0 1px 3px rgba(0,0,0,0.02)',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)'
        }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '180px', height: '180px', background: 'rgba(168, 85, 247, 0.15)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '180px', height: '180px', background: 'rgba(34, 197, 94, 0.15)', filter: 'blur(50px)', borderRadius: '50%', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.08)', paddingBottom: '16px', marginBottom: '20px' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button 
                onClick={() => setIsLogrosExpanded(false)}
                style={{
                  background: 'rgba(0,0,0,0.05)', color: '#475569', border: 'none', borderRadius: '50%', 
                  width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(0,0,0,0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
                title="Ocultar progreso"
              >
                ▲
              </button>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(254, 240, 138, 0.4), rgba(253, 224, 71, 0.35))', padding: '8px 16px', borderRadius: '16px', border: '1.5px solid rgba(234, 179, 8, 0.4)', color: '#854d0e' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', background: 'white', borderRadius: '12px', border: '2px solid rgba(234, 179, 8, 0.6)' }}>
                  <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(234,179,8,0.25))' }}>{actualLogroIcono}</span>
                  <span style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: '#ca8a04', color: 'white', width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                    {actualLogroNivel}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mi Rango Actual</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{actualLogroNombre}</div>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#475569', fontWeight: 800 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📊 Progreso al próximo rango</span>
                <span style={{ background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: '6px', color: '#15803d' }}>{progresoPorcentaje}%</span>
              </div>
              <div style={{ height: '16px', background: 'rgba(0, 0, 0, 0.15)', clipPath: 'polygon(0 0, calc(100% - 15px) 0, 100% 50%, calc(100% - 15px) 100%, 0 100%)', position: 'relative', borderRadius: '4px 0 0 4px' }}>
                <div style={{ position: 'absolute', top: '1px', bottom: '1px', left: '1px', right: '2.125px', background: 'rgba(255, 255, 255, 0.7)', clipPath: 'polygon(0 0, calc(100% - 13.125px) 0, 100% 50%, calc(100% - 13.125px) 100%, 0 100%)', overflow: 'hidden', borderRadius: '3px 0 0 3px' }}>
                  <div style={{ height: '100%', width: `${Math.min(progresoPorcentaje, 100)}%`, background: 'linear-gradient(to right, #fbbf24, #34d399, #3b82f6)', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'linear-gradient(135deg, rgba(233, 213, 255, 0.45), rgba(216, 180, 254, 0.35))', padding: '8px 16px', borderRadius: '16px', border: '1.5px solid rgba(168, 85, 247, 0.4)', color: '#6b21a8' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '54px', height: '54px', background: 'white', borderRadius: '12px', border: '2px solid rgba(168, 85, 247, 0.6)' }}>
                <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 4px rgba(139,92,246,0.3))' }}>{siguiente.logrosicono || '🏆'}</span>
                <span style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: '#9333ea', color: 'white', width: '22px', height: '22px', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                  {siguiente.logrosnivel || '?'}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#7e22ce', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siguiente Rango</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{siguiente.logrosnombre}</div>
              </div>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Para desbloquearlo necesitas:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reqList}
          </div>

        </div>
      )}
    </>
  );
}
