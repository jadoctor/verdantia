'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  roles: string;
  icono: string | null;
  estadoCuenta: string;
  nombreUsuario: string | null;
}

export default function DashboardHome() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMessage, setSetupMessage] = useState('');
  const [misLogros, setMisLogros] = useState<any[]>([]);
  const [todosLogros, setTodosLogros] = useState<any[]>([]);
  const [misCultivos, setMisCultivos] = useState<any[]>([]);
  const [showCultivoDetalle, setShowCultivoDetalle] = useState(false);
  const router = useRouter();

  const loadProfile = async (email: string, uid: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setSetupMessage('');
        if (data.profile?.id) {
          try {
            const [logrosRes, totalRes] = await Promise.all([
              fetch(`/api/perfil/logros?userId=${data.profile.id}`),
              fetch('/api/admin/ajustes/logros')
            ]);
            if (logrosRes.ok) {
              const logrosData = await logrosRes.json();
              setMisLogros(logrosData.logros || []);
            }
            if (totalRes.ok) {
              const totalData = await totalRes.json();
              setTodosLogros(Array.isArray(totalData) ? totalData : []);
            }
          } catch { /* silently fail */ }
          try {
            const cultivosRes = await fetch('/api/user/cultivos', { headers: { 'x-user-email': email } });
            if (cultivosRes.ok) {
              const cultivosData = await cultivosRes.json();
              setMisCultivos(cultivosData.cultivos || []);
            }
          } catch { /* silently fail */ }
        }
      } else if (res.status === 404) {
        try {
          await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid, email, nombre: '', apellidos: '' }),
          });
          const resRetry = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
          if (resRetry.ok) {
            const dataRetry = await resRetry.json();
            setProfile(dataRetry.profile);
            setSetupMessage('');
          } else {
            setSetupMessage('Estamos configurando tu huerto. Por favor, recarga la pagina en unos segundos.');
          }
        } catch {
          setSetupMessage('No se pudo sincronizar tu perfil con la base de datos.');
        }
      } else {
        setSetupMessage('Error de conexion con el servidor. Pulsa "Reintentar" o recarga la pagina.');
      }
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setSetupMessage('Error de red. Comprueba tu conexion y pulsa "Reintentar".');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      loadProfile(user.email!, user.uid);
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) return <p className="loading-text">Cargando tu huerto...</p>;

  const isSuperAdmin = profile?.roles?.includes('superadministrador');
  const displayName = profile?.nombreUsuario || profile?.nombre || auth.currentUser?.email?.split('@')[0] || 'Agricultor';

  return (
    <div className="welcome-section">
      <div className="welcome-header">
        <h1>Bienvenido al huerto, {displayName}!</h1>
        <p className="subtitle">
          Sesion iniciada como <strong>{auth.currentUser?.email}</strong>
          {isSuperAdmin && <> &mdash; <span style={{ color: 'var(--danger)', fontWeight: 800 }}>SUPERADMIN</span></>}
        </p>
      </div>

      {/* Onboarding Call to Action */}
      {profile && (!auth.currentUser?.emailVerified || !profile.nombre) && (
        <div className="card-storm" style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          color: '#064e3b',
          border: '2px solid #22c55e',
          padding: '2rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(34, 197, 94, 0.15)'
        }}>
          <h2 style={{ color: '#15803d', fontSize: '1.4rem', marginTop: 0 }}>
            Bienvenido! Tu huerto te espera
          </h2>
          <p style={{ lineHeight: 1.6, color: '#166534', fontSize: '0.95rem' }}>
            Actualmente tienes acceso al <strong>Plan Basico Gratuito</strong>.
          </p>
          <button
            onClick={() => router.push('/dashboard/perfil')}
            type="button"
            style={{
              background: 'linear-gradient(to right, #10b981, #059669)',
              color: 'white', border: 'none', padding: '12px 24px',
              borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
            }}
          >
            Completar mi Perfil
          </button>
        </div>
      )}

      {setupMessage && !profile && (
        <div className="status-message glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)', marginBottom: '2rem' }}>
          <p>{setupMessage}</p>
          <button
            type="button"
            onClick={() => { const user = auth.currentUser; if (user) loadProfile(user.email!, user.uid); }}
            style={{ marginTop: '10px', padding: '8px 20px', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 700 }}
          >
            Reintentar
          </button>
        </div>
      )}

      {profile && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="card-icon">&#127807;</div>
              <div className="card-info"><h3>Plantas Activas</h3><div className="value">&mdash;</div></div>
            </div>
            <div className="stat-card">
              <div className="card-icon">&#128230;</div>
              <div className="card-info"><h3>Semillas en Inventario</h3><div className="value">&mdash;</div></div>
            </div>
            <div className="stat-card">
              <div className="card-icon">&#128203;</div>
              <div className="card-info"><h3>Tareas Pendientes</h3><div className="value">&mdash;</div></div>
            </div>
            <div className="stat-card">
              <div className="card-icon">&#127777;</div>
              <div className="card-info"><h3>Meteo Local</h3><div className="value">&mdash;</div></div>
            </div>
          </div>

          {/* Seccion de Logros */}
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
                    boxShadow: logro.fecha_fin ? '0 4px 6px rgba(16,185,129,0.2)' : '0 4px 6px rgba(245,158,11,0.2)'
                  }}>
                    {logro.logrosicono || '?'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{logro.nombre_logro}</span>
                    <span style={{ fontSize: '0.6rem', color: logro.fecha_fin ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                      {logro.fecha_fin ? '\u2713 Completado' : '\u25cf Activo'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Logros PENDIENTES */}
              {todosLogros.filter((tl: any) => !misLogros.some((ml: any) => ml.nombre_logro === tl.logrosnombre)).map((logro: any, i: number) => (
                <div key={`pend-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', width: '90px', textAlign: 'center', opacity: 0.4, filter: 'grayscale(100%)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', border: '3px solid #cbd5e1' }}>
                    {logro.logrosicono || '?'}
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>{logro.logrosnombre}</span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Bloqueado</span>
                  </div>
                </div>
              ))}
            </div>

            {/* TARJETA SIGUIENTE NIVEL */}
            {(() => {
              const pendientes = todosLogros.filter((tl: any) => !misLogros.some((ml: any) => ml.nombre_logro === tl.logrosnombre));
              const siguiente = pendientes[0];
              if (!siguiente) return null;
              const reqs: { icon: string; label: string; chipColor?: string; chipBorder?: string; chipTextColor?: string; cta?: string; ctaText?: string }[] = [];

              if (siguiente.req_semillas > 0)
                reqs.push({ icon: '\u{1F330}', label: `${siguiente.req_semillas} semilla${siguiente.req_semillas > 1 ? 's' : ''} en inventario` });

              if (siguiente.req_siembras > 0) {
                const cultivosCompletados = misCultivos.filter((c: any) => c.cultivosestado === 'finalizado' && c.cultivosfecharecoleccion).length;
                const cultivosEnCurso = misCultivos.filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido').length;
                const cultivosEnRecoleccion = misCultivos.filter((c: any) => c.cultivosestado === 'recoleccion').length;
                let statusLabel = '';
                let chipColor = 'white'; let chipBorder = '1px solid #a7f3d0'; let chipTextColor = '#065f46';
                let showCta = false; let ctaText = ''; let ctaHref = '';
                if (cultivosCompletados >= siguiente.req_siembras) {
                  statusLabel = `\u2705 ${cultivosCompletados} cultivo${cultivosCompletados > 1 ? 's' : ''} completado${cultivosCompletados > 1 ? 's' : ''}`;
                  chipColor = '#f0fdf4'; chipBorder = '1px solid #10b981'; chipTextColor = '#065f46';
                } else if (cultivosEnRecoleccion > 0) {
                  statusLabel = `${cultivosEnRecoleccion} en recoleccion \u00b7 Marcalo como finalizado`;
                  chipColor = '#fefce8'; chipBorder = '1.5px solid #eab308'; chipTextColor = '#854d0e';
                  showCta = true; ctaText = 'Ir a mis cultivos \u2192'; ctaHref = '/dashboard/mis-plantas';
                } else if (cultivosEnCurso > 0) {
                  statusLabel = `\u23f3 ${cultivosEnCurso} cultivo${cultivosEnCurso > 1 ? 's' : ''} en curso \u00b7 Llevalo a recoleccion`;
                  chipColor = '#fefce8'; chipBorder = '1.5px solid #eab308'; chipTextColor = '#854d0e';
                  showCta = true; ctaText = showCultivoDetalle ? 'Ocultar detalle \u25b2' : 'Ver mi progreso \u25bc'; ctaHref = '__toggle__';
                } else {
                  statusLabel = `${siguiente.req_siembras} cultivo${siguiente.req_siembras > 1 ? 's' : ''}`;
                  showCta = true; ctaText = 'Crealo ahora! \u2192'; ctaHref = '/dashboard/mis-plantas?wizard=true';
                }
                reqs.push({ icon: '\u{1F331}', label: statusLabel, chipColor, chipBorder, chipTextColor, cta: showCta ? ctaHref : undefined, ctaText: showCta ? ctaText : undefined });
              }

              if (siguiente.req_recolecciones > 0) reqs.push({ icon: '\u{1F9BA}', label: `${siguiente.req_recolecciones} recoleccion${siguiente.req_recolecciones > 1 ? 'es' : ''}` });
              if (siguiente.req_especies > 0) reqs.push({ icon: '\u{1F33F}', label: `${siguiente.req_especies} especie${siguiente.req_especies > 1 ? 's' : ''} distintas` });
              if (siguiente.req_fotos > 0) reqs.push({ icon: '\u{1F4F8}', label: `${siguiente.req_fotos} foto${siguiente.req_fotos > 1 ? 's' : ''} publicadas` });
              if (siguiente.req_mensajes > 0) reqs.push({ icon: '\u{1F4AC}', label: `${siguiente.req_mensajes} mensaje${siguiente.req_mensajes > 1 ? 's' : ''} en la comunidad` });
              if (siguiente.req_blogs > 0) reqs.push({ icon: '\u{1F4DD}', label: `${siguiente.req_blogs} entrada${siguiente.req_blogs > 1 ? 's' : ''} de blog` });
              if (siguiente.req_antiguedad_meses > 0) reqs.push({ icon: '\u{1F4C5}', label: `${siguiente.req_antiguedad_meses} mes${siguiente.req_antiguedad_meses > 1 ? 'es' : ''} de antiguedad` });
              if (reqs.length === 0) reqs.push({ icon: '\u2709\uFE0F', label: siguiente.logrosdescripcion || 'Verifica tu correo y completa tu perfil' });

              return (
                <div style={{ marginTop: '1.5rem', padding: '1rem 1.25rem', background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)', border: '1.5px solid #6ee7b7', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{siguiente.logrosicono || '\u{1F3AF}'}</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Siguiente nivel</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{siguiente.logrosnombre}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '8px' }}>Para desbloquearlo necesitas:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'flex-start' }}>
                    {reqs.map((r, i) => (
                      <div key={i} style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: r.chipColor || 'white', border: r.chipBorder || '1px solid #a7f3d0', borderRadius: '20px', padding: '4px 10px', fontSize: '0.78rem', color: r.chipTextColor || '#065f46', fontWeight: 600 }}>
                          {r.icon} {r.label}
                        </span>
                        {r.cta && r.cta !== '__toggle__' && (
                          <a href={r.cta} style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}>
                            {r.ctaText}
                          </a>
                        )}
                        {r.cta === '__toggle__' && (
                          <>
                            <button
                              onClick={() => setShowCultivoDetalle(v => !v)}
                              style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', padding: 0 }}
                            >
                              {r.ctaText}
                            </button>
                            {showCultivoDetalle && misCultivos.filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido').length > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {misCultivos
                                  .filter((c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido')
                                  .map((c: any, ci: number) => {
                                    const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' }) : null;
                                    const fases = [
                                      { label: 'Inicio', fecha: fmt(c.cultivosfechainicio) },
                                      { label: 'Germinacion', fecha: fmt(c.cultivosfechagerminacion) },
                                      { label: 'Trasplante', fecha: fmt(c.cultivosfechatrasplante) },
                                      { label: 'Recoleccion', fecha: fmt(c.cultivosfecharecoleccion) },
                                    ];
                                    const completadas = fases.filter(f => f.fecha);
                                    const proxima = fases.find(f => !f.fecha);
                                    return (
                                      <div key={ci} style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '10px', padding: '7px 10px', fontSize: '0.74rem', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ fontWeight: 800, color: '#92400e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          Cultivo N&ordm; {c.cultivosnumerocoleccion}: {c.especiesnombre}{c.variedad_nombre ? <span style={{ fontWeight: 400, color: '#b45309' }}> ({c.variedad_nombre})</span> : null}
                                        </div>
                                        {completadas.map((f, fi) => (
                                          <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#15803d' }}>
                                            <span style={{ fontSize: '0.65rem' }}>&#x2705;</span>
                                            <span style={{ fontWeight: 600 }}>{f.label}</span>
                                            <span style={{ color: '#9ca3af', marginLeft: 'auto', fontSize: '0.68rem' }}>{f.fecha}</span>
                                          </div>
                                        ))}
                                        {proxima && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#d97706', borderTop: '1px dashed #fde68a', paddingTop: '3px', marginTop: '1px' }}>
                                            <span style={{ fontSize: '0.65rem' }}>&#x23F3;</span>
                                            <span style={{ fontWeight: 700 }}>Siguiente: {proxima.label}</span>
                                            <a href={`/dashboard/cultivos/${c.idcultivos}`} style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#059669', fontWeight: 700, textDecoration: 'none' }}>Ir &rarr;</a>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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
        </>
      )}
    </div>
  );
}
