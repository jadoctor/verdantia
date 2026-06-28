'use client';
import React from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { FotoCard } from './FotoCard';

interface Props {
  user: any;
  uIdx: number;
  isCollapsed: boolean;
  userStats: Record<number, any>;
  tab: 'pendientes' | 'recursos';
  processing: number | null;
  onToggleCollapse: (uIdx: number) => void;
  onValidar: (id: number) => void;
  onRechazar: (id: number) => void;
  onRestaurar: (id: number, foto: any) => void;
  onRechazarRecurso: (id: number, foto: any) => void;
  onEditar: (foto: any) => void;
  onLightbox: (url: string) => void;
  onMouseEnterTooltip: (e: React.MouseEvent, text: string) => void;
  onMouseLeaveTooltip: () => void;
  saveStateForReturn: () => void;
}

export function UserCard({
  user, uIdx, isCollapsed, userStats, tab, processing,
  onToggleCollapse, onValidar, onRechazar, onRestaurar, onRechazarRecurso,
  onEditar, onLightbox, onMouseEnterTooltip, onMouseLeaveTooltip, saveStateForReturn,
}: Props) {
  const stats = userStats[user.usuarioId] || {};
  const plan = stats.suscripcion_nombre || 'Gratuito';
  const isPremium = plan === 'Premium';
  const planLabels: Record<string, string> = { Esencial: '2 🌿 Esencial', Avanzado: '3 🌳 Avanzado', Premium: '4 👑 Premium' };
  const planLabel = planLabels[plan] || '1 🍃 Gratuito';

  const totalFotos = Object.values(user.motivos).reduce((sum: number, m: any) =>
    sum + Object.values(m.labores).reduce((s2: number, photos: any) => s2 + photos.length, 0), 0);

  return (
    <div style={{ marginBottom: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
      {/* Header colapsable */}
      <div
        onClick={() => onToggleCollapse(uIdx)}
        style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.05)'}
        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
      >
        {/* Avatar */}
        <div style={{ width: '80px', height: '80px', background: user.usuarioFotoPerfil ? 'transparent' : 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {user.usuarioFotoPerfil ? <img src={getMediaUrl(user.usuarioFotoPerfil)} alt={user.usuarioNombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" /> : '👤'}
        </div>

        {/* Datos usuario */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{user.usuarioNombre}</h3>
          <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{user.usuarioEmail}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span style={{ background: isPremium ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'white', border: isPremium ? '1px solid #fde68a' : '1px solid rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
              {planLabel}
            </span>
            {user.usuarioId && (
              <a href={`/dashboard/admin/usuarios/${user.usuarioId}?from=asuntos`}
                onClick={e => { e.stopPropagation(); saveStateForReturn(); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'white', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                🛠️ Ver Perfil Admin
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '20px' }}>
          {user.usuarioId && (<>
            <div onMouseEnter={e => onMouseEnterTooltip(e, stats.variedades_nombres || 'Ninguna')} onMouseLeave={onMouseLeaveTooltip}
              style={{ background: 'rgba(0,0,0,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'help' }}>
              🌱 Variedades: <span style={{ background: 'white', color: '#059669', padding: '2px 6px', borderRadius: '4px' }}>{stats.variedades_asumidas || 0}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              📸 Fotos: <span style={{ background: 'white', color: '#059669', padding: '2px 6px', borderRadius: '4px' }}>{stats.fotos_subidas || 0}</span>
            </div>
            {stats.fotos_rechazadas > 0 && (
              <div onMouseEnter={e => onMouseEnterTooltip(e, stats.motivos_rechazo || 'Sin motivos')} onMouseLeave={onMouseLeaveTooltip}
                style={{ background: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'help' }}>
                ⚠️ Rechazadas: <span style={{ background: 'white', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>{stats.fotos_rechazadas}</span>
              </div>
            )}
          </>)}
        </div>

        {/* Contador + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
            {totalFotos} fotos pendientes
          </span>
          <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', transition: 'transform 0.3s', transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
        </div>
      </div>

      {/* Contenido expandido */}
      {isCollapsed && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {Object.values(user.motivos).map((motivo: any, mIdx: number) => (
            <div key={mIdx} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#334155' }}>🌱 {motivo.nombre}</div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {Object.entries(motivo.labores).map(([laborName, photos]: [string, any], lIdx: number) => (
                  <div key={lIdx}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📋 {laborName} <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#475569' }}>{photos.length} fotos</span>
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '16px' }}>
                      {photos.map((p: any) => (
                        <FotoCard key={p.id} foto={p} tab={tab} processing={processing}
                          onValidar={onValidar} onRechazar={onRechazar}
                          onRestaurar={onRestaurar} onRechazarRecurso={onRechazarRecurso}
                          onEditar={onEditar} onLightbox={onLightbox}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
