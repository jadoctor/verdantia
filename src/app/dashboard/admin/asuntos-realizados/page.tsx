'use client';
import { useEffect, useState } from 'react';
import { getMediaUrl } from '@/lib/media-url';

interface RealizedPhoto {
  id: number;
  ruta: string;
  nombreOriginal: string;
  fechaSubida: string;
  fechaValidacion: string;
  activo: number;
  fechaEliminacion?: string;
  motivo?: string;
  resultado: string;
  variedadId: number;
  variedadNombre: string;
  especieNombre: string;
  usuarioPropietario: string;
  emailPropietario: string;
  idPropietario: number;
  adminNombre: string;
  adminEmail: string;
  fotoTipo: 'planta' | 'perfil';
}

export default function AsuntosRealizadosPage() {
  const [realizados, setRealizados] = useState<RealizedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'solved' | 'approved_deleted'>('all');

  const loadRealizados = async () => {
    try {
      const res = await fetch('/api/admin/asuntos-realizados');
      const data = await res.json();
      setRealizados(data.realizados || []);
    } catch (e) {
      console.error('Error cargando realizados:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRealizados(); }, []);

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const getResultBadge = (resultado: string, fechaValidacion: string) => {
    const formattedDate = formatDate(fechaValidacion);
    switch(resultado) {
      case 'aprobado': return <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>✅ Aprobado el {formattedDate}</span>;
      case 'rechazado': return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>❌ Rechazado el {formattedDate}</span>;
      case 'sancionado': return <span style={{ background: '#fef2f2', color: '#7f1d1d', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid #fca5a5' }}>🗑️ Sancionado el {formattedDate}</span>;
      default: return <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>{resultado} el {formattedDate}</span>;
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando historial...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        padding: '24px 30px', borderRadius: '16px', marginBottom: '24px',
        color: 'white', boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
      }}>
        <h1 style={{ margin: '0 0 16px 0', fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
          ✅ Asuntos Realizados
        </h1>
        
        {/* Filtros dentro del header */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setFilter('all')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: filter === 'all' ? '#ffffff' : 'rgba(255,255,255,0.2)', color: filter === 'all' ? '#059669' : '#ffffff', transition: 'all 0.2s', boxShadow: filter === 'all' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}
          >
            Todos ({realizados.length})
          </button>
          <button 
            onClick={() => setFilter('approved')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: filter === 'approved' ? '#ffffff' : 'rgba(255,255,255,0.2)', color: filter === 'approved' ? '#059669' : '#ffffff', transition: 'all 0.2s', boxShadow: filter === 'approved' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}
          >
            🟢 Aprobados Activos
          </button>
          <button 
            onClick={() => setFilter('pending')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: filter === 'pending' ? '#ffffff' : 'rgba(255,255,255,0.2)', color: filter === 'pending' ? '#059669' : '#ffffff', transition: 'all 0.2s', boxShadow: filter === 'pending' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}
          >
            🔴 Rechazados Pendientes
          </button>
          <button 
            onClick={() => setFilter('solved')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: filter === 'solved' ? '#ffffff' : 'rgba(255,255,255,0.2)', color: filter === 'solved' ? '#059669' : '#ffffff', transition: 'all 0.2s', boxShadow: filter === 'solved' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}
          >
            🔴🟢 Incidencias Solucionadas
          </button>
          <button 
            onClick={() => setFilter('approved_deleted')}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, background: filter === 'approved_deleted' ? '#ffffff' : 'rgba(255,255,255,0.2)', color: filter === 'approved_deleted' ? '#059669' : '#ffffff', transition: 'all 0.2s', boxShadow: filter === 'approved_deleted' ? '0 2px 5px rgba(0,0,0,0.1)' : 'none' }}
          >
            🟡 Aprobados Borrados
          </button>
        </div>
      </div>

      {realizados.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '60px 40px', textAlign: 'center',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>📭</div>
          <h2 style={{ margin: 0, color: '#64748b', fontSize: '1.3rem' }}>Aún no hay historial</h2>
          <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>El registro de fotos procesadas está vacío.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {realizados.filter(p => {
              const isSolved = (p.resultado === 'rechazado' || p.resultado === 'sancionado') && p.fechaEliminacion;
              const isPendingUserAction = (p.resultado === 'rechazado' || p.resultado === 'sancionado') && !p.fechaEliminacion;
              const isApprovedAndDeleted = p.resultado === 'aprobado' && p.fechaEliminacion;
              const isApproved = p.resultado === 'aprobado' && !p.fechaEliminacion;

              if (filter === 'approved') return isApproved;
              if (filter === 'pending') return isPendingUserAction;
              if (filter === 'solved') return isSolved;
              if (filter === 'approved_deleted') return isApprovedAndDeleted;
              return true; // all
            }).map(p => {
            const isSolved = (p.resultado === 'rechazado' || p.resultado === 'sancionado') && p.fechaEliminacion;
            const isPendingUserAction = (p.resultado === 'rechazado' || p.resultado === 'sancionado') && !p.fechaEliminacion;
            const isApprovedAndDeleted = p.resultado === 'aprobado' && p.fechaEliminacion;
            
            let borderColor = '#e2e8f0'; // por defecto
            let borderThickness = '8px';
            let innerBorderColor = 'transparent';
            let innerBorderThickness = '0px';
            
            if (isSolved) {
              borderColor = '#ef4444'; // rojo por fuera (incidencia original)
              borderThickness = '8px'; // doble de ancha
              innerBorderColor = '#22c55e'; // verde por dentro (solución)
              innerBorderThickness = '8px'; // doble de ancha
            }
            else if (isPendingUserAction) borderColor = '#ef4444'; // rojo (pendiente)
            else if (isApprovedAndDeleted) borderColor = '#eab308'; // amarillo (aprobado y borrado)
            else if (p.resultado === 'aprobado') borderColor = '#22c55e'; // verde normal (aprobado)

            return (
            <div key={p.id} style={{
              background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
              borderLeft: `${borderThickness} solid ${borderColor}`,
              boxShadow: `0 2px 8px rgba(0,0,0,0.04)`, overflow: 'hidden',
              display: 'flex', gap: 0, transition: 'all 0.2s ease'
            }}>
              {/* Miniatura y Tipo */}
              <div style={{ display: 'flex', flexDirection: 'column', width: '160px', flexShrink: 0, borderRight: '1px solid #e2e8f0', borderLeft: `${innerBorderThickness} solid ${innerBorderColor}`, background: '#f8fafc' }}>
                <div style={{ width: '160px', height: '160px', position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
                  {p.activo === 0 && p.resultado === 'aprobado' ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#ef4444', textAlign: 'center', padding: '10px', position: 'absolute', inset: 0 }}>
                      <span style={{ fontSize: '24px', marginBottom: '8px' }}>🗑️</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Eliminada por<br/>el usuario</span>
                    </div>
                  ) : (
                    <img
                    src={getMediaUrl(p.ruta)}
                    alt={p.nombreOriginal}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0, opacity: p.resultado !== 'aprobado' ? 0.6 : 1, filter: p.resultado !== 'aprobado' ? 'grayscale(80%)' : 'none' }}
                    crossOrigin="anonymous"
                  />
                  )}
                </div>
                <div style={{ padding: '8px', fontSize: '0.75rem', color: '#475569', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, borderTop: '1px solid #e2e8f0' }}>
                  {p.fotoTipo === 'perfil' ? (
                    <b>👤 Foto de Perfil</b>
                  ) : (
                    <>
                      <b>🌱 {p.especieNombre || 'Sin especie'} {p.variedadNombre ? `- ${p.variedadNombre}` : ''}</b>
                    </>
                  )}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getResultBadge(p.resultado, p.fechaValidacion)}
                      {p.fechaEliminacion && (
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                          <span style={{ 
                            marginLeft: '6px', padding: '2px 6px', 
                            background: p.resultado === 'rechazado' || p.resultado === 'sancionado' ? '#dcfce7' : '#fee2e2', 
                            color: p.resultado === 'rechazado' || p.resultado === 'sancionado' ? '#16a34a' : '#ef4444', 
                            borderRadius: '4px', fontWeight: 'bold', fontSize: '0.75rem', 
                            border: p.resultado === 'rechazado' || p.resultado === 'sancionado' ? '1px solid #86efac' : '1px solid #fca5a5' 
                          }}>
                            {p.resultado === 'rechazado' || p.resultado === 'sancionado' 
                              ? `✅ Incidencia Solucionada (Foto eliminada el ${formatDate(p.fechaEliminacion)})` 
                              : `🗑️ Eliminada por el usuario el ${formatDate(p.fechaEliminacion)}`}
                          </span>
                        </span>
                      )}
                    </div>
                    {p.resultado !== 'aprobado' && p.motivo && (
                      <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#ef4444', background: '#fee2e2', padding: '6px 10px', borderRadius: '6px', border: '1px solid #fca5a5', display: 'inline-block', alignSelf: 'flex-start' }}>
                        <strong>Motivo:</strong> {p.motivo}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '4px' }}>
                    Sube: <b>👤 {p.usuarioPropietario || 'Usuario'}</b> <span style={{ color: '#64748b' }}>({p.emailPropietario})</span> <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>el {formatDate(p.fechaSubida)}</span>
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '8px' }}>
                    Modera: <b>🛡️ {p.adminNombre || 'Desconocido'}</b> <span style={{ color: '#64748b' }}>({p.adminEmail || 'Email no registrado'})</span>
                  </div>
                </div>

                {/* Acciones */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  {!(p.activo === 0 && p.resultado === 'aprobado') ? (
                    <a
                      href={getMediaUrl(p.ruta)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px',
                        padding: '8px 14px', fontWeight: 600, fontSize: '0.82rem',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                    >
                      🔍 Ver imagen completa
                    </a>
                  ) : (
                    <span
                      style={{
                        background: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: '8px',
                        padding: '8px 14px', fontWeight: 600, fontSize: '0.82rem',
                        display: 'flex', alignItems: 'center', gap: '6px', cursor: 'not-allowed', opacity: 0.7
                      }}
                    >
                      🚫 Imagen eliminada del servidor
                    </span>
                  )}
                </div>
              </div>
            </div>
            );
          })}
          </div>
        </>
      )}
    </div>
  );
}
