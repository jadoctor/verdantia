'use client';
import { useEffect, useState, useMemo } from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { auth } from '@/lib/firebase/config';

const MOTIVOS_RECHAZO = [
  'La imagen no está relacionada con cultivos, plantas o huertos',
  'Contenido inapropiado, ofensivo o que infringe las normas de la comunidad',
  'La imagen contiene datos personales visibles (personas, matrículas, domicilios)',
  'Imagen de baja calidad, borrosa o ilegible',
  'Imagen duplicada o ya existente en la plataforma',
  'Contenido con derechos de autor o marca comercial sin autorización',
  'Otro motivo — ver nota adicional',
];

interface PendingPhoto {
  id: number;
  ruta: string;
  nombreOriginal: string;
  fecha: string;
  peso: number;
  variedadId: number;
  variedadNombre: string;
  especieNombre: string;
  usuarioNombre: string;
  usuarioEmail: string;
  usuarioId: number;
  fotoTipo: 'planta' | 'perfil';
}

export default function AsuntosPendientesPage() {
  const [tab, setTab] = useState<'pendientes' | 'recursos'>('pendientes');
  const [pendientes, setPendientes] = useState<PendingPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  // Modal de rechazo
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);
  const [rechazandoRecursoId, setRechazandoRecursoId] = useState<{ id: number, p: any } | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>('');
  const [motivoRechazoRecurso, setMotivoRechazoRecurso] = useState<string>('');
  const [motivoExtra, setMotivoExtra] = useState('');

  // Modal de eliminación por contenido inapropiado
  const [eliminandoId, setEliminandoId] = useState<number | null>(null);
  const [eliminandoConfirm, setEliminandoConfirm] = useState(false);

  // Colapsables por usuario
  const [collapsedUsers, setCollapsedUsers] = useState<Record<number, boolean>>({});

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const groupedData = useMemo(() => {
    const groups: Record<string, any> = {};
    pendientes.forEach((p: any) => {
      const userKey = p.usuarioId ? `${p.usuarioId}-${p.usuarioNombre}` : `unknown-${p.usuarioNombre}`;
      if (!groups[userKey]) {
        groups[userKey] = {
          usuarioNombre: p.usuarioNombre || 'Usuario Desconocido',
          usuarioEmail: p.usuarioEmail || 'Sin email',
          usuarioId: p.usuarioId,
          motivos: {}
        };
      }
      
      let motivoKey = 'Foto de Perfil';
      if (p.fotoTipo === 'planta' || p.fotoTipo === 'labor') {
        const especie = p.especieNombre || 'Sin especie';
        const variedad = p.variedadNombre ? ` - ${p.variedadNombre}` : '';
        motivoKey = `Cultivo: ${especie}${variedad}`;
      }

      if (!groups[userKey].motivos[motivoKey]) {
        groups[userKey].motivos[motivoKey] = {
          nombre: motivoKey,
          labores: {}
        };
      }

      let laborKey = 'General (Planta/Variedad)';
      if (p.fotoTipo === 'labor') {
        if (p.laborNombre) {
          laborKey = `Labor Realizada: ${p.laborNombre}`;
        } else {
          let pendingName = 'Labor Pendiente';
          try {
            const resObj = typeof p.resumen === 'string' ? JSON.parse(p.resumen) : (p.resumen || {});
            if (resObj.pending_fechaEmision) {
              pendingName += ` (${new Date(resObj.pending_fechaEmision).toLocaleDateString('es-ES')})`;
            }
          } catch(e) {}
          laborKey = pendingName;
        }
      } else if (p.fotoTipo === 'perfil') {
        laborKey = 'Perfil de Usuario';
      }

      if (!groups[userKey].motivos[motivoKey].labores[laborKey]) {
        groups[userKey].motivos[motivoKey].labores[laborKey] = [];
      }

      groups[userKey].motivos[motivoKey].labores[laborKey].push(p);
    });
    return Object.values(groups);
  }, [pendientes]);

  const loadPendientes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/asuntos-pendientes?tab=${tab}`);
      const data = await res.json();
      setPendientes(data.pendientes || []);
    } catch (e) {
      console.error('Error cargando pendientes:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPendientes(); }, [tab]);

  const handleValidar = async (photoId: number) => {
    setProcessing(photoId);
    const adminEmail = auth.currentUser?.email || undefined;
    try {
      await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, action: 'validar', adminEmail })
      });
      setPendientes(prev => prev.filter(p => p.id !== photoId));
      showToast('✅ Foto validada correctamente.');
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setProcessing(null);
    }
  };

  const handleRestaurar = async (incidenciaId: number, p: any) => {
    setProcessing(incidenciaId);
    try {
      await fetch('/api/admin/incidencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: incidenciaId, estado: 'resuelta', notas: p.motivoRecurso + '\n\n--- RESOLUCIÓN (Admin) ---\nRecurso aceptado. Foto restaurada.' })
      });
      // Restaurar la foto en la DB (hacerla activa otra vez)
      await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: p.photoId, action: 'validar', adminEmail: auth.currentUser?.email })
      });
      setPendientes(prev => prev.filter(p => p.id !== incidenciaId));
      showToast('✅ Recurso aceptado. Foto restaurada.');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const abrirModalRechazoRecurso = (incidenciaId: number, p: any) => {
    setRechazandoRecursoId({ id: incidenciaId, p });
    setMotivoRechazoRecurso('');
  };

  const handleRechazarRecursoConfirmado = async () => {
    if (!rechazandoRecursoId) return;
    const { id, p } = rechazandoRecursoId;
    if (!motivoRechazoRecurso.trim()) {
      showToast('⚠️ Debes escribir un motivo para denegar el recurso.');
      return;
    }

    setProcessing(id);
    setRechazandoRecursoId(null);
    try {
      await fetch('/api/admin/incidencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          estado: 'resuelta', 
          notas: (p.motivoRecurso || '') + `\n\n--- RESOLUCIÓN DEL EQUIPO (${new Date().toISOString().split('T')[0]}) ---\n${motivoRechazoRecurso}`,
          rejectionEmailTo: p.usuarioEmail && p.usuarioEmail !== 'desconocido' ? p.usuarioEmail : null,
          rejectionReason: motivoRechazoRecurso
        })
      });
      setPendientes(prev => prev.filter(item => item.id !== id));
      showToast('❌ Recurso denegado.');
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(null);
    }
  };

  const abrirModalRechazo = (photoId: number) => {
    setRechazandoId(photoId);
    setMotivoSeleccionado('');
    setMotivoExtra('');
  };

  const confirmarRechazo = async () => {
    if (!rechazandoId || !motivoSeleccionado) return;
    setProcessing(rechazandoId);

    const motivoFinal = motivoSeleccionado === MOTIVOS_RECHAZO[MOTIVOS_RECHAZO.length - 1] && motivoExtra.trim()
      ? `${motivoSeleccionado}: ${motivoExtra.trim()}`
      : motivoSeleccionado;

    const adminEmail = auth.currentUser?.email || undefined;

    try {
      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: rechazandoId,
          action: 'rechazar',
          motivo: motivoFinal,
          adminEmail
        })
      });
      const data = await res.json();
      setPendientes(prev => prev.filter(p => p.id !== rechazandoId));
      setRechazandoId(null);
      
      if (data.emailEnviado) {
        showToast(`✅ Foto rechazada. Correo enviado a: ${data.emailEnviado}`);
      } else {
        showToast('✅ Foto rechazada. El usuario verá el motivo en su galería.');
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setProcessing(null);
    }
  };

  const abrirModalEliminar = (photoId: number) => {
    setEliminandoId(photoId);
    setEliminandoConfirm(false);
  };

  const confirmarEliminacion = async () => {
    if (!eliminandoId) return;
    setProcessing(eliminandoId);
    const adminEmail = auth.currentUser?.email || undefined;
    const foto = pendientes.find(p => p.id === eliminandoId);

    try {
      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: eliminandoId,
          action: 'eliminar_inapropiado',
          motivo: 'Contenido explícito, pornográfico o gravemente inapropiado',
          adminEmail
        })
      });
      const data = await res.json();
      setPendientes(prev => prev.filter(p => p.id !== eliminandoId));
      setEliminandoId(null);

      const msgs: Record<string, string> = {
        advertencia_1: `⚠️ Foto eliminada. 1ª advertencia enviada a ${foto?.usuarioEmail}.`,
        advertencia_2: `🔒 Foto eliminada. 2ª infracción: cuenta suspendida 7 días.`,
        baja: `🔴 Foto eliminada. 3ª infracción: cuenta dada de baja definitivamente.`,
      };
      showToast(msgs[data.sancion] || '✅ Foto eliminada y sanción aplicada.');
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (d: string) => {
    try { return new Date(d).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return d; }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const fotoRechazo = pendientes.find(p => p.id === rechazandoId);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando asuntos pendientes...</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 99998,
          background: '#1e293b', color: 'white', padding: '14px 20px',
          borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          fontSize: '0.9rem', fontWeight: 600, maxWidth: '400px', lineHeight: 1.4,
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast}
        </div>
      )}
      <div style={{
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        padding: '24px 30px', borderRadius: '16px', marginBottom: '24px',
        color: 'white', boxShadow: '0 4px 15px rgba(245,158,11,0.3)'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
          📋 Asuntos Pendientes
        </h1>
        <p style={{ margin: '6px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
          Fotos subidas por usuarios que necesitan tu validación. Al rechazar, el usuario verá el motivo y podrá borrarla o recurrir.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => setTab('pendientes')}
          style={{
            flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
            background: tab === 'pendientes' ? '#3b82f6' : 'white',
            color: tab === 'pendientes' ? 'white' : '#64748b',
            border: tab === 'pendientes' ? 'none' : '1px solid #e2e8f0',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: tab === 'pendientes' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none'
          }}
        >
          📷 Fotos Nuevas
        </button>
        <button
          onClick={() => setTab('recursos')}
          style={{
            flex: 1, padding: '14px', borderRadius: '12px', fontWeight: 700, fontSize: '1rem',
            background: tab === 'recursos' ? '#8b5cf6' : 'white',
            color: tab === 'recursos' ? 'white' : '#64748b',
            border: tab === 'recursos' ? 'none' : '1px solid #e2e8f0',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: tab === 'recursos' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'
          }}
        >
          ⚖️ Recursos de Usuarios
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando datos...</div>
      ) : pendientes.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: '16px', padding: '60px 40px', textAlign: 'center',
          border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>✅</div>
          <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.3rem' }}>¡Todo al día!</h2>
          <p style={{ color: '#64748b', margin: '8px 0 0' }}>No hay fotos pendientes de validar</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            background: tab === 'pendientes' ? '#fffbeb' : '#f3e8ff', 
            border: `1px solid ${tab === 'pendientes' ? '#fde68a' : '#d8b4fe'}`, 
            borderRadius: '12px',
            padding: '12px 16px', fontSize: '0.9rem', 
            color: tab === 'pendientes' ? '#92400e' : '#6b21a8', 
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span>⚠️</span>
            <span><b>{pendientes.length}</b> {tab === 'pendientes' ? 'foto(s) pendiente(s) de validar' : 'recurso(s) por revisar'}</span>
          </div>

          {groupedData.map((user: any, uIdx: number) => (
            <div key={uIdx} style={{ marginBottom: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              {/* Header Usuario - Colapsable */}
              <div 
                onClick={() => setCollapsedUsers(prev => ({ ...prev, [uIdx]: !prev[uIdx] }))}
                style={{ background: '#1e293b', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ width: '40px', height: '40px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                  👤
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{user.usuarioNombre}</h3>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{user.usuarioEmail}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {Object.values(user.motivos).reduce((sum: number, m: any) => sum + Object.values(m.labores).reduce((s2: number, photos: any) => s2 + photos.length, 0), 0)} fotos
                  </span>
                  <span style={{ fontSize: '1.2rem', transition: 'transform 0.3s', transform: collapsedUsers[uIdx] ? 'rotate(0deg)' : 'rotate(180deg)' }}>▼</span>
                </div>
              </div>

              {!collapsedUsers[uIdx] && (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {Object.values(user.motivos).map((motivo: any, mIdx: number) => (
                  <div key={mIdx} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    {/* Header Motivo / Cultivo */}
                    <div style={{ background: '#f1f5f9', padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🌱 {motivo.nombre}
                    </div>

                    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {Object.entries(motivo.labores).map(([laborName, photos]: [string, any], lIdx: number) => (
                        <div key={lIdx}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            📋 {laborName} <span style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', color: '#475569' }}>{photos.length} fotos</span>
                          </h4>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {photos.map((p: any) => (
                              <div key={p.id} style={{
                                border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column', transition: 'all 0.2s',
                                opacity: processing === p.id ? 0.5 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                              }}>
                                {/* Miniatura */}
                                <div style={{ height: '220px', background: '#f1f5f9', position: 'relative', cursor: 'pointer' }} onClick={() => setLightboxUrl(getMediaUrl(p.ruta))}>
                                  <img
                                    src={getMediaUrl(p.ruta)}
                                    alt={p.nombreOriginal}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                                    crossOrigin="anonymous"
                                  />
                                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                                    {formatDate(p.fecha)}
                                  </div>
                                  {tab === 'pendientes' && (
                                    <div style={{ position: 'absolute', top: 8, right: 8, background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                      PENDIENTE
                                    </div>
                                  )}
                                </div>

                                {/* Info y Acciones */}
                                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                  {tab === 'recursos' && (
                                    <div style={{ marginBottom: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>MOTIVO RECHAZO ORIGINAL:</p>
                                      <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#334155' }}>{p.motivoRechazo}</p>
                                      
                                      <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600 }}>ALEGACIÓN DEL USUARIO:</p>
                                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', fontStyle: 'italic' }}>
                                        {p.motivoRecurso || 'Sin alegación'}
                                      </p>
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: '6px', marginTop: 'auto', flexWrap: 'wrap' }}>
                                    {tab === 'pendientes' ? (
                                      <>
                                        <button onClick={() => handleValidar(p.id)} disabled={processing !== null} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✅ Validar</button>
                                        <button onClick={() => abrirModalRechazo(p.id)} disabled={processing !== null} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>❌ Rechazar</button>
                                        <button onClick={() => abrirModalEliminar(p.id)} disabled={processing !== null} title="Contenido explícito" style={{ background: '#7f1d1d', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>🗑️</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => handleRestaurar(p.id, p)} disabled={processing !== null} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✅ Restaurar</button>
                                        <button onClick={() => abrirModalRechazoRecurso(p.id, p)} disabled={processing !== null} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>❌ Denegar</button>
                                      </>
                                    )}
                                    <button onClick={() => setLightboxUrl(getMediaUrl(p.ruta))} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>🔍</button>
                                  </div>
                                </div>
                              </div>
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
          ))}
        </div>
      )}

      {/* ── Modal de Rechazo ── */}
      {rechazandoId && fotoRechazo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', maxWidth: 540, width: '100%',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', padding: '16px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>❌</span>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Rechazar foto</h2>
                </div>
                <p style={{ margin: '4px 0 0', opacity: 0.95, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  👤 {fotoRechazo.usuarioNombre} · 🌱 {fotoRechazo.especieNombre || 'Perfil'} {fotoRechazo.variedadNombre ? `- ${fotoRechazo.variedadNombre}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setRechazandoId(null)}
                  style={{
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white',
                    padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRechazo}
                  disabled={!motivoSeleccionado || processing !== null}
                  style={{
                    background: motivoSeleccionado ? 'white' : 'rgba(255,255,255,0.2)',
                    color: motivoSeleccionado ? '#dc2626' : 'rgba(255,255,255,0.5)', border: 'none',
                    padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: motivoSeleccionado ? 'pointer' : 'not-allowed',
                    fontSize: '0.85rem', transition: 'all 0.15s'
                  }}
                >
                  {processing !== null ? '⏳...' : 'Confirmar'}
                </button>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Visualización de la foto */}
              <div style={{ width: '100%', height: '200px', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img 
                  src={getMediaUrl(fotoRechazo.ruta)} 
                  alt="Foto a rechazar" 
                  crossOrigin="anonymous"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                />
              </div>

              <p style={{ margin: '0 0 16px', color: '#475569', fontSize: '0.9rem' }}>
                Selecciona el motivo del rechazo. El usuario lo verá en su galería y podrá recurrir la decisión.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {MOTIVOS_RECHAZO.map((motivo, i) => (
                  <label key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                    padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#ef4444' : '#e2e8f0'}`,
                    background: motivoSeleccionado === motivo ? '#fef2f2' : 'white',
                    transition: 'all 0.15s'
                  }}>
                    <input
                      type="radio"
                      name="motivo"
                      value={motivo}
                      checked={motivoSeleccionado === motivo}
                      onChange={() => setMotivoSeleccionado(motivo)}
                      style={{ marginTop: '2px', accentColor: '#ef4444', flexShrink: 0 }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>{motivo}</span>
                  </label>
                ))}
              </div>

              {/* Campo libre si elige "Otro" */}
              {motivoSeleccionado === MOTIVOS_RECHAZO[MOTIVOS_RECHAZO.length - 1] && (
                <textarea
                  placeholder="Describe el motivo específico..."
                  value={motivoExtra}
                  onChange={e => setMotivoExtra(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', border: '1.5px solid #fca5a5', borderRadius: '8px',
                    padding: '10px 12px', fontSize: '0.85rem', resize: 'vertical',
                    fontFamily: 'inherit', marginBottom: '8px', boxSizing: 'border-box'
                  }}
                />
              )}

              {/* Nota informativa */}
              <div style={{
                background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
                padding: '10px 12px', fontSize: '0.8rem', color: '#9a3412', marginBottom: '0'
              }}>
                ℹ️ La foto <strong>no se borra</strong>. El usuario la verá marcada como rechazada en su galería y podrá eliminarla o recurrir la decisión.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECHAZAR RECURSO */}
      {rechazandoRecursoId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'white', padding: '32px', borderRadius: '16px', width: '90%', maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1.25rem', color: '#0f172a' }}>Denegar Recurso</h3>
            
            <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#475569' }}>
              Escribe el motivo por el cual se deniega el recurso. Este mensaje será visible para el usuario.
            </p>

            <textarea
              value={motivoRechazoRecurso}
              onChange={(e) => setMotivoRechazoRecurso(e.target.value)}
              placeholder="Ej: La normativa indica claramente que no se permite..."
              style={{
                width: '100%', minHeight: '100px', padding: '12px', border: '1px solid #cbd5e1',
                borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical'
              }}
            />

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setRechazandoRecursoId(null)}
                style={{ flex: 1, padding: '12px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRechazarRecursoConfirmado}
                disabled={!motivoRechazoRecurso.trim()}
                style={{ flex: 1, padding: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, opacity: motivoRechazoRecurso.trim() ? 1 : 0.5 }}
              >
                Denegar y Enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Eliminar por contenido inapropiado ── */}
      {eliminandoId && (() => {
        const fotoElim = pendientes.find(p => p.id === eliminandoId);
        return (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}>
            <div style={{
              background: 'white', borderRadius: '20px', maxWidth: 480, width: '100%',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)', overflow: 'hidden'
            }}>
              <div style={{ background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', padding: '16px 24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.6rem' }}>🗑️</span>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Eliminar inaceptable</h2>
                  </div>
                  <p style={{ margin: '4px 0 0', opacity: 0.95, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    👤 {fotoElim?.usuarioNombre} · 🌱 {fotoElim?.especieNombre || 'Perfil'} {fotoElim?.variedadNombre ? `- ${fotoElim?.variedadNombre}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setEliminandoId(null)}
                    style={{
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white',
                      padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarEliminacion}
                    disabled={!eliminandoConfirm || processing !== null}
                    style={{
                      background: eliminandoConfirm ? 'white' : 'rgba(255,255,255,0.2)',
                      color: eliminandoConfirm ? '#991b1b' : 'rgba(255,255,255,0.5)', border: 'none',
                      padding: '8px 16px', borderRadius: '8px', fontWeight: 700, cursor: eliminandoConfirm ? 'pointer' : 'not-allowed',
                      fontSize: '0.85rem', transition: 'all 0.15s'
                    }}
                  >
                    {processing !== null ? '⏳...' : 'Eliminar'}
                  </button>
                </div>
              </div>

              <div style={{ padding: '24px 28px', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Visualización de la foto */}
                {fotoElim && (
                  <div style={{ width: '100%', height: '200px', marginBottom: '20px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <img 
                      src={getMediaUrl(fotoElim.ruta)} 
                      alt="Foto a eliminar" 
                      crossOrigin="anonymous"
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    />
                  </div>
                )}
                <div style={{
                  background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '10px',
                  padding: '14px 16px', marginBottom: '20px'
                }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#7f1d1d', fontSize: '0.9rem' }}>
                    ⛔ Esta acción es irreversible y activa el régimen sancionador:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: '#991b1b', fontSize: '0.85rem', lineHeight: 1.7 }}>
                    <li>La foto será <strong>eliminada permanentemente</strong> del servidor</li>
                    <li>En su lugar aparecerá un aviso de sanción en la galería del usuario</li>
                    <li>Se aplicará la sanción progresiva: <strong>1ª advertencia → 2ª suspensión → 3ª baja definitiva</strong></li>
                  </ul>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: '0' }}>
                  <input
                    type="checkbox"
                    checked={eliminandoConfirm}
                    onChange={e => setEliminandoConfirm(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#dc2626' }}
                  />
                  <span style={{ fontSize: '0.88rem', color: '#374151', fontWeight: 600 }}>
                    Confirmo que este contenido es explícito o gravemente inapropiado
                  </span>
                </label>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ── Lightbox Overlay ── */}
      {lightboxUrl && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 999999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setLightboxUrl(null)}
        >
          <div style={{ position: 'relative', maxWidth: '95vw', maxHeight: '95vh', display: 'flex', justifyContent: 'center' }}>
            <img
              src={lightboxUrl}
              alt="Vista ampliada"
              crossOrigin="anonymous"
              style={{ maxWidth: '100%', maxHeight: '95vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxUrl(null)}
              style={{
                position: 'absolute', top: '-15px', right: '-15px', background: 'white', color: 'black',
                border: 'none', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.2rem',
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
