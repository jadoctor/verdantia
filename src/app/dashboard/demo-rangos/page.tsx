'use client';
import React from 'react';
import RangoBadge from '@/components/ui/RangoBadge';

const LOGROS = [
  { nivel: 1, icono: '👶', nombre: 'Visitante' },
  { nivel: 2, icono: '🤓', nombre: 'Campesino Aprendiz' },
  { nivel: 3, icono: '🧑‍🔧', nombre: 'Sembrador Novato' },
  { nivel: 4, icono: '👷', nombre: 'Cultivador' },
  { nivel: 5, icono: '🧔‍♂️', nombre: 'Hortelano' },
  { nivel: 6, icono: '🧑‍🌾', nombre: 'Agricultor Dedicado' },
  { nivel: 7, icono: '🧓', nombre: 'Maestro de la Tierra' },
  { nivel: 8, icono: '🧙‍♂️', nombre: 'Sabio de la Comunidad' },
  { nivel: 9, icono: '💂', nombre: 'Guardián de Semilla' },
  { nivel: 10, icono: '🤴', nombre: 'Leyenda Verde' },
];

export default function DemoRangos() {
  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        Sistema de Rangos - Verdantia
      </h1>
      <p style={{ color: '#475569', marginBottom: '40px' }}>
        Los 10 niveles de logros con su diseño oficial: cara grande + número emoji como oreja.
      </p>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', 
        gap: '20px' 
      }}>
        {LOGROS.map((logro) => (
          <div key={logro.nivel} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            transition: 'all 0.2s'
          }}>
            <RangoBadge icono={logro.icono} nivel={logro.nivel} size={64} />
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nivel {logro.nivel}
              </div>
              <div style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 800 }}>
                {logro.nombre}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
