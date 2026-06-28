'use client';
import React, { useMemo } from 'react';

interface CultivoLogrosProps {
  cultivo: any;
  formData: any;
}

interface Logro {
  id: string;
  icon: string;
  titulo: string;
  descripcion: string;
  completado: boolean;
  color: string;
}

export default function CultivoLogros({ cultivo, formData }: CultivoLogrosProps) {
  const logros: Logro[] = useMemo(() => {
    const obs = formData.cultivosobservaciones || '';
    const fotos = cultivo?.fotosLabores || [];
    const avisosComp = cultivo?.avisosCompletados || [];

    // Contar entradas Quick-Log de riego
    const riegoCount = (obs.match(/💧 Riego/g) || []).length;
    const abonoCount = (obs.match(/🌿 Abono/g) || []).length;
    const hasCosecha = obs.includes('[🏆 Cosecha:');
    const hasRating = obs.includes('[⭐');

    return [
      {
        id: 'siembra',
        icon: '🌱',
        titulo: 'Primera siembra',
        descripcion: 'Registrar la fecha de inicio del cultivo',
        completado: !!formData.cultivosfechainicio,
        color: '#22c55e'
      },
      {
        id: 'foto',
        icon: '📸',
        titulo: 'Primera foto',
        descripcion: 'Subir al menos una foto del cultivo',
        completado: fotos.length > 0,
        color: '#3b82f6'
      },
      {
        id: 'riego5',
        icon: '💧',
        titulo: 'Jardinero constante',
        descripcion: 'Registrar 5 riegos en la bitácora',
        completado: riegoCount >= 5,
        color: '#0ea5e9'
      },
      {
        id: 'abono3',
        icon: '🌿',
        titulo: 'Nutricionista vegetal',
        descripcion: 'Aplicar abono al menos 3 veces',
        completado: abonoCount >= 3,
        color: '#10b981'
      },
      {
        id: 'tareas10',
        icon: '✅',
        titulo: 'Dedicación ejemplar',
        descripcion: 'Completar 10 tareas de mantenimiento',
        completado: avisosComp.length >= 10,
        color: '#8b5cf6'
      },
      {
        id: 'cosecha',
        icon: '🏆',
        titulo: '¡Cosecha lograda!',
        descripcion: 'Registrar la primera cosecha del cultivo',
        completado: hasCosecha,
        color: '#f59e0b'
      },
      {
        id: 'valoracion',
        icon: '⭐',
        titulo: 'Crítico gastronómico',
        descripcion: 'Valorar la cosecha con estrellas',
        completado: hasRating,
        color: '#eab308'
      },
      {
        id: 'ciclo',
        icon: '🎯',
        titulo: 'Ciclo completo',
        descripcion: 'Llevar el cultivo hasta su finalización',
        completado: formData.cultivosestado === 'finalizado',
        color: '#dc2626'
      },
    ];
  }, [cultivo, formData]);

  const completed = logros.filter(l => l.completado).length;
  const total = logros.length;
  const pct = Math.round((completed / total) * 100);

  // No mostrar si no hay siembra
  if (!formData.cultivosfechainicio) return null;

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '24px',
      border: '1px solid #e2e8f0', marginBottom: '24px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏅 Logros del Cultivo
        </h3>
        <span style={{
          background: pct === 100 ? '#dcfce7' : '#f1f5f9',
          color: pct === 100 ? '#16a34a' : '#64748b',
          padding: '4px 12px', borderRadius: '20px',
          fontSize: '0.82rem', fontWeight: 700
        }}>
          {completed}/{total} {pct === 100 && '🎉'}
        </span>
      </div>

      {/* Barra de progreso */}
      <div style={{ background: '#f1f5f9', borderRadius: '6px', height: '8px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: pct === 100
            ? 'linear-gradient(90deg, #22c55e, #10b981)'
            : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
          borderRadius: '6px',
          transition: 'width 0.8s ease'
        }} />
      </div>

      {/* Grid de logros */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))', gap: '10px' }}>
        {logros.map(logro => (
          <div key={logro.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 14px', borderRadius: '10px',
            background: logro.completado ? `${logro.color}08` : '#fafafa',
            border: logro.completado ? `1px solid ${logro.color}30` : '1px solid #f1f5f9',
            opacity: logro.completado ? 1 : 0.6,
            transition: 'all 0.2s'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: logro.completado ? `${logro.color}20` : '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', flexShrink: 0,
              filter: logro.completado ? 'none' : 'grayscale(100%)'
            }}>
              {logro.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 600, fontSize: '0.85rem',
                color: logro.completado ? '#1e293b' : '#94a3b8',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {logro.titulo}
                {logro.completado && <span style={{ fontSize: '0.7rem', color: logro.color }}>✓</span>}
              </div>
              <div style={{
                fontSize: '0.72rem',
                color: logro.completado ? '#64748b' : '#cbd5e1',
                lineHeight: 1.3
              }}>
                {logro.descripcion}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
