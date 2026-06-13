'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

interface StatsGridProps {
  misCultivos: any[];
  misSemillas: any[];
  deletingCropId: number | null;
  setDeletingCropId: (val: number | null) => void;
  deletingSeedId: number | null;
  setDeletingSeedId: (val: number | null) => void;
  executeDeleteCrop: (id: number) => Promise<void>;
  executeDeleteSeed: (id: number) => Promise<void>;
  executeInactivateSeed: (id: number) => Promise<void>;
  openCropWizard: () => void;
  router: any;
}

export default function StatsGrid({
  misCultivos,
  misSemillas,
  deletingCropId,
  setDeletingCropId,
  deletingSeedId,
  setDeletingSeedId,
  executeDeleteCrop,
  executeDeleteSeed,
  executeInactivateSeed,
  openCropWizard,
  router
}: StatsGridProps) {
  
  const activeCrops = misCultivos.filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido');
  const activeSeeds = misSemillas.filter((s: any) => s.semillasactivosino !== 0 && s.semillasactivosino !== false);

  const problemSeeds = misSemillas.filter((s: any) => {
    const esActiva = s.semillasactivosino !== 0 && s.semillasactivosino !== false;
    if (!esActiva) return false;
    const caducada = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
    const sinStock = s.semillasstockactual !== null && s.semillasstockactual !== undefined && Number(s.semillasstockactual) <= 0;
    return caducada || sinStock;
  });

  return (
    <div className="stats-grid">
      {/* 1. Active Crops Card */}
      <div 
        className="stat-card" 
        style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }} 
        onClick={openCropWizard}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div className="card-icon">&#127807;</div>
          <div className="card-info" style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Cultivos activos</h3>
            <div className="value" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{activeCrops.length}</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', flexShrink: 0 }}>+ Sembrar</span>
            </div>
          </div>
        </div>
        
        <div style={{ borderTop: activeCrops.length > 0 ? '1px dashed #e2e8f0' : 'none', paddingTop: activeCrops.length > 0 ? '8px' : 0, display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
          {activeCrops.length > 0 ? (
            activeCrops.slice(0, 3).map((c: any, idx: number) => {
              const isConfirming = deletingCropId === c.idcultivos;
              if (isConfirming) {
                return (
                  <div 
                    key={idx} 
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '6px', 
                      fontSize: '0.78rem', 
                      color: '#475569',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                      <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>¿Eliminar Cultivo?</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await executeDeleteCrop(c.idcultivos);
                        }}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                        onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
                      >
                        Sí
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingCropId(null);
                        }}
                        style={{
                          background: 'white',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseOut={e => e.currentTarget.style.background = 'white'}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={idx} 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/cultivos/${c.idcultivos}?from=dashboard`);
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '6px', 
                    fontSize: '0.78rem', 
                    color: '#475569',
                    cursor: 'pointer',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#f0fdf4';
                    e.currentTarget.style.color = '#10b981';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', minWidth: 0 }}>
                      <div style={{ flexShrink: 0, display: 'inline-flex' }}><SpeciesIcon icon={c.especiesicono || '🌱'} size="1rem" /></div>
                      <span style={{ fontWeight: 800, color: '#065f46', background: '#d1fae5', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', flexShrink: 0 }}>Nº {c.cultivosnumerocoleccion || c.idcultivos}</span>
                      <span style={{ 
                        fontWeight: 700, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        display: 'inline-block', 
                        minWidth: 0,
                        flex: 1
                      }}>
                        {c.especiesnombre} <span style={{ fontWeight: 'normal', opacity: 0.85 }}>({c.variedad_nombre || 'Común'})</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '26px', flexWrap: 'wrap' }}>
                      {c.cultivosfechainicio && (
                        <span style={{ fontSize: '0.62rem', color: '#64748b', background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          📅 {new Date(c.cultivosfechainicio).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      <span style={{ 
                        fontSize: '0.62rem', 
                        padding: '1px 5px', 
                        borderRadius: '4px', 
                        fontWeight: 700, 
                        whiteSpace: 'nowrap',
                        background: c.cultivosestado === 'germinacion' ? '#fef3c7' : c.cultivosestado === 'crecimiento' ? '#d1fae5' : c.cultivosestado === 'recoleccion' ? '#fce7f3' : c.cultivosestado === 'en_espera' ? '#e0e7ff' : '#f1f5f9',
                        color: c.cultivosestado === 'germinacion' ? '#92400e' : c.cultivosestado === 'crecimiento' ? '#065f46' : c.cultivosestado === 'recoleccion' ? '#9d174d' : c.cultivosestado === 'en_espera' ? '#3730a3' : '#475569'
                      }}>
                        {c.cultivosestado === 'germinacion' ? '🌱 Germinación' : c.cultivosestado === 'crecimiento' ? '🌿 Crecimiento' : c.cultivosestado === 'recoleccion' ? '🧺 Recolección' : c.cultivosestado === 'en_espera' ? '⏳ En espera' : c.cultivosestado === 'trasplante' ? '🪴 Trasplante' : c.cultivosestado}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingCropId(c.idcultivos);
                    }}
                    title="Eliminar cultivo"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      padding: '4px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      opacity: 0.8
                    }}
                    onMouseOver={e => {
                      e.stopPropagation();
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseOut={e => {
                      e.stopPropagation();
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.opacity = '0.8';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          ) : (
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No hay cultivos activos.</span>
          )}
          {activeCrops.length > 3 && (
            <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 'bold', paddingLeft: '4px' }}>
              + {activeCrops.length - 3} cultivos más...
            </div>
          )}
        </div>
      </div>

      {/* 2. Active Seeds (Banco Digital) Card */}
      <div 
        className="stat-card" 
        style={{ cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }} 
        onClick={() => router.push('/dashboard/semillas')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div className="card-icon" style={{ background: '#e0f2fe' }}>📦</div>
          <div className="card-info" style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Banco de semillas</h3>
            <div className="value" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{activeSeeds.length}</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', flexShrink: 0 }}>Ver banco</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: activeSeeds.length > 0 ? '1px dashed #e2e8f0' : 'none', paddingTop: activeSeeds.length > 0 ? '8px' : 0, display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
          {activeSeeds.length > 0 ? (
            activeSeeds.slice(0, 3).map((s: any, idx: number) => {
              const isConfirming = deletingSeedId === s.idsemillas;
              if (isConfirming) {
                return (
                  <div 
                    key={idx} 
                    onClick={(e) => e.stopPropagation()}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '6px', 
                      fontSize: '0.78rem', 
                      color: '#475569',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      width: '100%',
                      minWidth: 0,
                      boxSizing: 'border-box'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                      <span style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>¿Eliminar semillas?</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await executeDeleteSeed(s.idsemillas);
                        }}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
                        onMouseOut={e => e.currentTarget.style.background = '#ef4444'}
                      >
                        Sí
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSeedId(null);
                        }}
                        style={{
                          background: 'white',
                          color: '#475569',
                          border: '1px solid #cbd5e1',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseOut={e => e.currentTarget.style.background = 'white'}
                      >
                        No
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div 
                  key={idx} 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/dashboard/semillas/${s.idsemillas}?from=dashboard`);
                  }}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '6px', 
                    fontSize: '0.78rem', 
                    color: '#475569',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '8px',
                    transition: 'all 0.2s',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = '#f0fdfa';
                    e.currentTarget.style.color = '#0d9488';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0, width: '100%' }}>
                    <div style={{ flexShrink: 0, display: 'inline-flex' }}><SpeciesIcon icon={s.especiesicono || '🌰'} size="1rem" /></div>
                    <span style={{ fontWeight: 800, color: '#0f766e', background: '#ccfbf1', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem', flexShrink: 0 }}>Semilla Nº {s.semillasnumerocoleccion || s.idsemillas}</span>
                    <span style={{ 
                      fontWeight: 700, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap', 
                      display: 'inline-block', 
                      minWidth: 0,
                      flex: 1
                    }}>
                      {s.especiesnombre} <span style={{ fontWeight: 'normal', opacity: 0.85 }}>({s.variedad_nombre || 'Común'})</span>
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingSeedId(s.idsemillas);
                    }}
                    title="Eliminar lote de semillas"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      padding: '4px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      opacity: 0.8
                    }}
                    onMouseOver={e => {
                      e.stopPropagation();
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseOut={e => {
                      e.stopPropagation();
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.opacity = '0.8';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          ) : (
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>No hay semillas registradas.</span>
          )}
          {activeSeeds.length > 3 && (
            <div style={{ fontSize: '0.72rem', color: '#0d9488', fontWeight: 'bold', paddingLeft: '4px' }}>
              + {activeSeeds.length - 3} lotes más...
            </div>
          )}
        </div>
      </div>

      {/* 3. Pending Tasks (Problem Seeds) Card */}
      <div 
        className="stat-card" 
        style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '10px', 
          alignItems: 'stretch',
          border: problemSeeds.length > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : undefined, 
          background: problemSeeds.length > 0 ? 'linear-gradient(135deg, var(--bg-card), rgba(254, 243, 199, 0.15))' : undefined 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
          <div className="card-icon" style={{ background: problemSeeds.length > 0 ? '#fef3c7' : undefined }}>
            {problemSeeds.length > 0 ? '⚠️' : '📋'}
          </div>
          <div className="card-info" style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Tareas Pendientes</h3>
            <div className="value" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', width: '100%', marginTop: '4px' }}>
              {problemSeeds.length === 0 ? (
                <span style={{ fontSize: '1rem', fontWeight: 700, color: '#10b981' }}>Al día</span>
              ) : (
                <span style={{ fontSize: '2rem', fontWeight: 800, color: '#d97706' }}>{problemSeeds.length}</span>
              )}
              {problemSeeds.length > 0 && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', flexShrink: 0 }}>
                  Revisión necesaria
                </span>
              )}
            </div>
          </div>
        </div>

        {problemSeeds.length > 0 && (
          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, marginBottom: '2px' }}>
              Semillas caducadas o sin stock:
            </div>
            {problemSeeds.slice(0, 3).map((s: any, idx: number) => {
              const caducada = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
              const sinStock = s.semillasstockactual !== null && s.semillasstockactual !== undefined && Number(s.semillasstockactual) <= 0;
              let motivo = '';
              if (caducada && sinStock) motivo = '📅 Caducada y 📦 sin stock';
              else if (caducada) motivo = '📅 Caducada';
              else motivo = '📦 Sin stock';

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    fontSize: '0.78rem',
                    color: '#475569',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    width: '100%',
                    minWidth: 0,
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100%', minWidth: 0 }}>
                      <span style={{ fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 4px', borderRadius: '4px', fontSize: '0.62rem', flexShrink: 0 }}>
                        Nº {s.semillasnumerocoleccion || s.idsemillas}
                      </span>
                      <span style={{ 
                        fontWeight: 700, 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap', 
                        display: 'inline-block', 
                        minWidth: 0,
                        flex: 1
                      }}>
                        {s.especiesnombre} <span style={{ fontWeight: 'normal', opacity: 0.8 }}>({s.variedad_nombre || 'Común'})</span>
                      </span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#d97706', paddingLeft: '2px' }}>
                      {motivo}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/semillas/${s.idsemillas}?from=dashboard`);
                      }}
                      title="Ir a la semilla"
                      style={{
                        background: 'white',
                        border: '1px solid #cbd5e1',
                        color: '#475569',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#94a3b8';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = 'white';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                    >
                      Ir
                    </button>

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Inactivar semilla Nº ${s.semillasnumerocoleccion || s.idsemillas}? Dejará de mostrarse como activa en tu banco.`)) {
                          await executeInactivateSeed(s.idsemillas);
                        }
                      }}
                      title="Inactivar directamente"
                      style={{
                        background: '#ef4444',
                        border: '1px solid #ef4444',
                        color: 'white',
                        padding: '3px 6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.background = '#dc2626';
                        e.currentTarget.style.borderColor = '#dc2626';
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.background = '#ef4444';
                        e.currentTarget.style.borderColor = '#ef4444';
                      }}
                    >
                      Inactivar
                    </button>
                  </div>
                </div>
              );
            })}
            {problemSeeds.length > 3 && (
              <div style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold', paddingLeft: '4px' }}>
                + {problemSeeds.length - 3} tareas más...
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Weather Card */}
      <div className="stat-card">
        <div className="card-icon">&#127777;</div>
        <div className="card-info">
          <h3>Meteo Local</h3>
          <div className="value">&mdash;</div>
        </div>
      </div>
    </div>
  );
}
