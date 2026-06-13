'use client';

import React from 'react';

interface AchievementsSectionProps {
  misLogros: any[];
  todosLogros: any[];
}

export default function AchievementsSection({ misLogros, todosLogros }: AchievementsSectionProps) {
  return (
    <div className="logros-section" style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', boxShadow: 'var(--glass-shadow)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', margin: 0 }}>
          Mis Logros
          {todosLogros.length > 0 && (
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '8px' }}>
              {misLogros.length} activo{misLogros.length !== 1 ? 's' : ''} de {todosLogros.length} totales
            </span>
          )}
        </h2>
        <a href="/dashboard/perfil" style={{ fontSize: '0.85rem', color: 'var(--storm-primary)', textDecoration: 'none', fontWeight: 600 }}>Ver todos &rarr;</a>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Logros ADQUIRIDOS */}
        {misLogros.map((logro: any, i: number) => (
          <div key={`adq-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '90px', textAlign: 'center' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: logro.fecha_fin ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fef3c7, #fde68a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem',
              border: logro.fecha_fin ? '3px solid #10b981' : '3px solid #f59e0b',
              boxShadow: logro.fecha_fin ? '0 4px 6px rgba(16,185,129,0.2)' : '0 4px 6px rgba(245,158,11,0.2)',
              position: 'relative'
            }}>
              {logro.logrosicono || '?'}
              <span style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                background: logro.fecha_fin ? '#10b981' : '#f59e0b',
                color: 'white', width: '18px', height: '18px', borderRadius: '50%',
                fontSize: '0.65rem', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
              }}>
                {logro.logrosnivel || 1}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{logro.nombre_logro}</span>
              <span style={{ fontSize: '0.6rem', color: logro.fecha_fin ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                {logro.fecha_fin ? '✓ Completado' : '● Activo'}
              </span>
            </div>
          </div>
        ))}

        {/* Logros PENDIENTES */}
        {todosLogros.filter((tl: any) => !misLogros.some((ml: any) => ml.nombre_logro === tl.logrosnombre)).map((logro: any, i: number) => (
          <div key={`pend-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '90px', textAlign: 'center', opacity: 0.4, filter: 'grayscale(100%)' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: '#f1f5f9', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.6rem', border: '3px solid #cbd5e1',
              position: 'relative'
            }}>
              {logro.logrosicono || '?'}
              <span style={{
                position: 'absolute', bottom: '-4px', right: '-4px',
                background: '#cbd5e1',
                color: '#475569', width: '18px', height: '18px', borderRadius: '50%',
                fontSize: '0.65rem', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {logro.logrosnivel || '?'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{logro.logrosnombre}</span>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Bloqueado</span>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      {todosLogros.length > 0 && (
        <div style={{ marginTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
            <span>Progreso total</span>
            <span>{Math.round((misLogros.length / todosLogros.length) * 100)}%</span>
          </div>
          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(Math.round((misLogros.length / todosLogros.length) * 100), 100)}%`, background: 'linear-gradient(to right, #10b981, #059669)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}
