'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';

const PLAN_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; label: string }> = {
  premium:  { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: '4 👑', label: 'Premium' },
  avanzado: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: '3 🌳', label: 'Avanzado' },
  esencial: { color: '#059669', bg: '#f0fdf4', border: '#a7f3d0', icon: '2 🌿', label: 'Esencial' },
  gratuito: { color: '#64748b', bg: '#f8fafc', border: '#e2e8f0', icon: '1 🍃', label: 'Gratuito' },
};

function getPlanCfg(plan?: string) {
  return PLAN_CONFIG[(plan || '').toLowerCase()] || PLAN_CONFIG['gratuito'];
}

const MOTIVOS_RECHAZO_LEVE = [
  'La imagen no está relacionada con cultivos, plantas o huertos',
  'Imagen de baja calidad, borrosa o ilegible',
  'Imagen duplicada o ya existente en la plataforma',
  'Otro motivo — ver nota adicional',
];

const MOTIVOS_SANCION_GRAVE = [
  'Contenido inapropiado, ofensivo, o de carácter sexual',
  'Contenido violento o incitación al odio',
  'La imagen contiene datos personales visibles (personas, matrículas, domicilios)',
  'Contenido con derechos de autor o marca comercial sin autorización',
];

export default function UsuarioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const [data, setData] = useState<{ usuario: any; logros: any[]; fotos: any[]; historialSuscripciones?: any[]; historialIa?: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [fromAsuntos, setFromAsuntos] = useState(false);
  const [fromUsoIa, setFromUsoIa] = useState(false);
  
  // States with sessionStorage persistence
  const [tab, setTabState] = useState('perfil');
  const [userDataOpen, setUserDataOpenState] = useState(true);
  const [userCultivosOpen, setUserCultivosOpenState] = useState(true);
  const [userIaOpen, setUserIaOpenState] = useState(false);
  const [iaFilter, setIaFilter] = useState<string>('todos');

  const setTab = (newTab: string) => {
    setTabState(newTab);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`usuario_detail_tab_${id}`, newTab);
    }
  };

  const setUserDataOpen = (val: boolean) => {
    setUserDataOpenState(val);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`usuario_detail_userDataOpen_${id}`, String(val));
    }
  };

  const setUserCultivosOpen = (val: boolean) => {
    setUserCultivosOpenState(val);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`usuario_detail_userCultivosOpen_${id}`, String(val));
    }
  };

  const setUserIaOpen = (val: boolean) => {
    setUserIaOpenState(val);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`usuario_detail_userIaOpen_${id}`, String(val));
    }
  };

  const [activeFotoId, setActiveFotoId] = useState<number | null>(null);
  const [avisosConfig, setAvisosConfig] = useState<any>(null);
  const [avisosLoading, setAvisosLoading] = useState(false);
  const [cultivarLocked, setCultivarLocked] = useState(true);
  const [comunicacionesLocked, setComunicacionesLocked] = useState(true);
  const [cultivos, setCultivos] = useState<any[] | null>(null);
  const [cultivosLoading, setCultivosLoading] = useState(false);
  const [cultivosFiltro, setCultivosFiltro] = useState<'todos' | 'activos' | 'historial'>('activos');
  const [cultivosLocked, setCultivosLocked] = useState(true);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setFromAsuntos(urlParams.get('from') === 'asuntos');
      setFromUsoIa(urlParams.get('from') === 'usoia');
      
      const savedTab = sessionStorage.getItem(`usuario_detail_tab_${id}`);
      if (savedTab) setTabState(savedTab);

      const savedDataOpen = sessionStorage.getItem(`usuario_detail_userDataOpen_${id}`);
      if (savedDataOpen !== null) setUserDataOpenState(savedDataOpen === 'true');

      const savedCultivosOpen = sessionStorage.getItem(`usuario_detail_userCultivosOpen_${id}`);
      if (savedCultivosOpen !== null) setUserCultivosOpenState(savedCultivosOpen === 'true');

      const savedIaOpen = sessionStorage.getItem(`usuario_detail_userIaOpen_${id}`);
      if (savedIaOpen !== null) setUserIaOpenState(savedIaOpen === 'true');
    }
  }, [id]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/login'); return; }
      setAuthReady(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!authReady) return;
    fetch(`/api/admin/usuarios/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, authReady]);

  useEffect(() => {
    if (data?.fotos?.length) {
      const primary = data.fotos.find(f => f.esPrincipal === 1 || f.esPrincipal) || data.fotos[0];
      if (primary) {
        setActiveFotoId(primary.id);
      }
    }
  }, [data]);

  const loadAvisos = async (email: string) => {
    setAvisosLoading(true);
    try {
      const res = await fetch(`/api/perfil/avisos?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const d = await res.json();
        setAvisosConfig(d);
      } else {
        showToast('❌ Error al cargar avisos');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error al cargar avisos');
    } finally {
      setAvisosLoading(false);
    }
  };

  const toggleAvisoMaestro = async (avisoId: number, currentVal: number) => {
    if (comunicacionesLocked) {
      showToast('⚠️ Edición bloqueada. Haz clic en "Desbloquear Edición" para realizar cambios.');
      return;
    }
    if (!data?.usuario?.email || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({ ...prev, userPrefs: { ...prev.userPrefs, [avisoId]: newVal } }));
    try {
      const res = await fetch('/api/perfil/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.usuario.email, tipo: 'maestro', avisoId, activo: newVal })
      });
      if (res.ok) {
        showToast('🔔 Preferencias actualizadas');
      } else {
        showToast('❌ Error al actualizar');
        setAvisosConfig((prev: any) => ({ ...prev, userPrefs: { ...prev.userPrefs, [avisoId]: currentVal } }));
      }
    } catch {
      showToast('❌ Error al actualizar');
      setAvisosConfig((prev: any) => ({ ...prev, userPrefs: { ...prev.userPrefs, [avisoId]: currentVal } }));
    }
  };

  const toggleAvisoLabor = async (laborId: number, currentVal: number) => {
    if (comunicacionesLocked) {
      showToast('⚠️ Edición bloqueada. Haz clic en "Desbloquear Edición" para realizar cambios.');
      return;
    }
    if (!data?.usuario?.email || !avisosConfig) return;
    const newVal = currentVal === 1 ? 0 : 1;
    setAvisosConfig((prev: any) => ({ ...prev, userLaboresPrefs: { ...prev.userLaboresPrefs, [laborId]: newVal } }));
    try {
      const res = await fetch('/api/perfil/avisos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.usuario.email, tipo: 'labor', laborId, activo: newVal })
      });
      if (res.ok) {
        showToast('🔔 Labores actualizadas');
      } else {
        showToast('❌ Error al actualizar');
        setAvisosConfig((prev: any) => ({ ...prev, userLaboresPrefs: { ...prev.userLaboresPrefs, [laborId]: currentVal } }));
      }
    } catch {
      showToast('❌ Error al actualizar');
      setAvisosConfig((prev: any) => ({ ...prev, userLaboresPrefs: { ...prev.userLaboresPrefs, [laborId]: currentVal } }));
    }
  };

  useEffect(() => {
    if (tab === 'comunicaciones' && data?.usuario?.email && !avisosConfig) {
      loadAvisos(data.usuario.email);
    }
  }, [tab, data?.usuario?.email, avisosConfig]);

  const loadCultivos = async (email: string) => {
    setCultivosLoading(true);
    try {
      const res = await fetch(`/api/user/cultivos`, {
        headers: { 'x-user-email': email }
      });
      if (res.ok) {
        const d = await res.json();
        setCultivos(d.cultivos || []);
      } else {
        showToast('❌ Error al cargar cultivos');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Error al cargar cultivos');
    } finally {
      setCultivosLoading(false);
    }
  };

  const handleSaveCultivo = async (cultivoId: number, field: string, value: any) => {
    if (cultivosLocked) {
      showToast('⚠️ Edición bloqueada. Haz clic en "Desbloquear Edición" para realizar cambios.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/user/cultivos/${cultivoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': data?.usuario?.email || ''
        },
        body: JSON.stringify({ [field]: value })
      });
      setSaving(false);
      if (res.ok) {
        showToast('✅ Cultivo guardado');
        setCultivos((prev: any) => {
          if (!prev) return null;
          return prev.map((c: any) => c.idcultivos === cultivoId ? { ...c, [field]: value } : c);
        });
      } else {
        showToast('❌ Error al guardar cultivo');
      }
    } catch (err) {
      console.error(err);
      setSaving(false);
      showToast('❌ Error al guardar cultivo');
    }
  };

  useEffect(() => {
    if (data?.usuario?.email && !cultivos) {
      loadCultivos(data.usuario.email);
    }
  }, [data?.usuario?.email, cultivos]);

  const handlePatch = async (field: string, value: any) => {
    if (cultivarLocked && (field === 'tipoCalendario' || field === 'tipoLaboreo')) {
      showToast('⚠️ Edición bloqueada. Haz clic en "Desbloquear Edición" para realizar cambios.');
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/admin/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    setSaving(false);
    if (res.ok) {
      showToast('✅ Guardado');
      setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, [field]: field === 'esPrueba' ? Number(value) : value } } : null);
    } else {
      showToast('❌ Error al guardar');
    }
  };

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [motivoExtra, setMotivoExtra] = useState<string>('');
  const [validating, setValidating] = useState(false);

  const handleValidatePhoto = async (action: 'validar' | 'rechazar') => {
    if (!activeFoto && !fotos?.[0]) return;
    const targetPhoto = activeFoto || fotos?.[0];
    if (!targetPhoto) return;

    let actionType = 'validar';
    let motivoFinal = undefined;

    if (action === 'rechazar') {
      if (!motivoSeleccionado) {
        showToast('❌ Selecciona un motivo de rechazo');
        return;
      }
      motivoFinal = motivoSeleccionado === 'Otro motivo — ver nota adicional' && motivoExtra.trim()
        ? `${motivoSeleccionado}: ${motivoExtra.trim()}`
        : motivoSeleccionado;

      if (motivoSeleccionado === 'Otro motivo — ver nota adicional' && !motivoExtra.trim()) {
        showToast('❌ Describe el motivo del rechazo');
        return;
      }

      actionType = MOTIVOS_SANCION_GRAVE.includes(motivoSeleccionado) ? 'eliminar_inapropiado' : 'rechazar';
    }

    setValidating(true);
    try {
      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: targetPhoto.id,
          action: actionType,
          motivo: motivoFinal,
          adminEmail: auth.currentUser?.email
        })
      });

      if (res.ok) {
        const resData = await res.json();
        if (actionType === 'eliminar_inapropiado') {
          const msgs: Record<string, string> = {
            advertencia_1: `⚠️ Foto eliminada y 1ª advertencia enviada.`,
            advertencia_2: `🔒 Foto eliminada. Infracción grave: cuenta suspendida 7 días.`,
            baja: `🔴 Foto eliminada. 3ª infracción: cuenta de baja definitivamente.`,
          };
          showToast(msgs[resData.sancion] || '✅ Foto eliminada y sanción aplicada.');
        } else {
          showToast(action === 'validar' ? '🟢 Foto aprobada con éxito' : '🔴 Foto rechazada con éxito');
        }
        
        setShowValidationModal(false);
        setMotivoSeleccionado('');
        setMotivoExtra('');
        
        // Refresh data to reflect the changes instantly in the frontend!
        const refreshRes = await fetch(`/api/admin/usuarios/${id}`);
        if (refreshRes.ok) {
          const freshData = await refreshRes.json();
          setData(freshData);
        }
      } else {
        const errorData = await res.json();
        showToast(`❌ Error: ${errorData.error || 'Acción fallida'}`);
      }
    } catch (e) {
      showToast('❌ Error de conexión al validar');
    } finally {
      setValidating(false);
    }
  };

  if (!authReady || loading) return (
    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
      <div className="loading-spinner" style={{ margin: '0 auto 16px' }} />
      <p>Cargando perfil de usuario...</p>
    </div>
  );

  if (!data?.usuario) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2 style={{ color: '#64748b' }}>Usuario no encontrado</h2>
      <button onClick={() => router.push('/dashboard/admin/usuarios')} style={{ marginTop: '16px', padding: '10px 20px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>
        ← Volver a Usuarios
      </button>
    </div>
  );

  const { usuario: u, logros, fotos, historialSuscripciones, historialIa = [] } = data;
  const planCfg = getPlanCfg(u.suscripcion);
  const activeFoto = fotos?.find((f: any) => f.id === activeFotoId) || fotos?.find((f: any) => f.esPrincipal) || fotos?.[0];

  const iaModules = Array.from(new Set(historialIa.map((i: any) => i.modulo)));
  const filteredIa = historialIa.filter((i: any) => iaFilter === 'todos' || i.modulo === iaFilter);

  return (
    <div style={{ width: '100%' }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 20px', background: 'white', border: '1px solid #e2e8f0', borderLeft: '4px solid #0056b3', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontWeight: 600, fontSize: '0.9rem' }}>
          {toast}
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
        {fromAsuntos ? (
          <button onClick={() => router.push('/dashboard/admin/asuntos-pendientes')} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            🔙 Volver a Asuntos Pendientes
          </button>
        ) : fromUsoIa ? (
          <button onClick={() => router.push('/dashboard/admin/uso-ia')} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            🔙 Volver a Uso de IA Global
          </button>
        ) : (
          <button onClick={() => router.push('/dashboard/admin/usuarios')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            🔙 Volver a Gestión de Usuarios
          </button>
        )}
      </div>

      {/* ── Cabecera Principal Unificada (Encabezado Negro con Datos de Usuario) ── */}
      <div style={{ 
        background: 'linear-gradient(135deg, #115e59 0%, #064e3b 100%)', 
        borderRadius: '14px',
        padding: '12px 20px', 
        marginBottom: '20px', 
        color: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Bloque Izquierdo: Nombre y Contexto de Edición */}
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 1.1 }}>
            👤 {u.nombre || '—'} {u.apellidos || ''}
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#cbd5e1', opacity: 0.85, lineHeight: 1.1 }}>
            ✏️ Editar Usuario · ID del Registro: {u.idusuarios || id}
          </p>
        </div>

        {/* Bloque Derecho: Datos Adicionales (Username, Email, Pills) y Autoguardado */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          flex: 1, 
          gap: '8px', 
          flexWrap: 'wrap', 
          fontSize: '0.74rem', 
          color: '#cbd5e1' 
        }}>
          <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>@{u.nombreUsuario || '—'}</span>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>·</span>
          <span style={{ color: u.emailVerificado ? '#86efac' : '#fca5a5', fontWeight: 600, display: 'inline-flex', alignItems: 'center' }}>{u.email}</span>
          
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>·</span>

          {/* Pill: Email Verificado */}
          <span style={{ 
            background: u.emailVerificado ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)', 
            color: u.emailVerificado ? '#86efac' : '#fca5a5', 
            border: u.emailVerificado ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
            padding: '2px 8px', 
            borderRadius: '20px', 
            fontSize: '0.74rem', 
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {u.emailVerificado ? '✅ Verificado' : '❌ No verificado'}
          </span>

          {/* Pill: Plan Suscripción */}
          <span style={{ 
            background: planCfg.bg === '#f8fafc' ? 'rgba(255, 255, 255, 0.08)' : planCfg.bg, 
            color: planCfg.bg === '#f8fafc' ? 'white' : planCfg.color, 
            border: `1px solid ${planCfg.border}`, 
            padding: '2px 8px', 
            borderRadius: '20px', 
            fontWeight: 700, 
            fontSize: '0.74rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {planCfg.icon} {planCfg.label} {u.suscripcion && u.suscripcion !== 'Gratuito' ? (u.esPrueba ? 'no pago' : 'pago') : ''}
          </span>

          {/* Pills: Roles */}
          {(u.roles || '').split(',').map((r: string) => (
            <span key={r} style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              border: '1px solid rgba(255, 255, 255, 0.12)',
              padding: '2px 8px', 
              borderRadius: '20px', 
              fontWeight: 600, 
              fontSize: '0.74rem',
              color: '#e2e8f0',
              display: 'inline-flex',
              alignItems: 'center'
            }}>
              {r.trim()}
            </span>
          ))}

          <span style={{ display: 'inline-flex', alignItems: 'center' }}>·</span>

          {/* Indicador de Autoguardado */}
          <div style={{ display: 'inline-flex', alignItems: 'center' }}>
            {saving ? (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: 'rgba(255, 255, 255, 0.1)', 
                padding: '2px 8px', 
                borderRadius: '20px', 
                fontSize: '0.74rem', 
                fontWeight: 700, 
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <span className="saving-spinner" style={{
                  width: '10px',
                  height: '10px',
                  border: '2px solid rgba(56, 189, 248, 0.2)',
                  borderTop: '2px solid #38bdf8',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.8s linear infinite'
                }} />
                <span>Guardando...</span>
              </div>
            ) : (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                padding: '2px 8px', 
                borderRadius: '20px', 
                fontSize: '0.74rem', 
                fontWeight: 700, 
                color: '#34d399',
                border: '1px solid rgba(52, 211, 153, 0.3)'
              }}>
                <span>✅ Guardado</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Acciones de Cuenta */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <h3 style={{ margin: '0 0 16px', color: '#1e293b', fontWeight: 700, fontSize: '1rem' }}>⚡ Acciones de la Cuenta</h3>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Cambiar Rol</label>
            <select defaultValue={u.roles?.split(',')[0].trim() || 'visitante'}
              onChange={e => handlePatch('roles', e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              <option value="visitante">Visitante</option>
              <option value="usuario">Usuario</option>
              <option value="administrador">Administrador</option>
              <option value="superadministrador">Superadministrador</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Estado Cuenta</label>
            <select defaultValue={u.estadoCuenta || 'activa'}
              onChange={e => handlePatch('estado', e.target.value)}
              style={{ padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
              <option value="activa">✅ Activo</option>
              <option value="suspendido">⛔ Suspendido</option>
              <option value="baja">🗑️ Baja solicitada</option>
            </select>
          </div>
          {saving && <div style={{ padding: '8px 14px', color: '#0056b3', fontWeight: 600, fontSize: '0.85rem' }}>Guardando...</div>}
        </div>
      </div>

      {/* ── Carrusel de Fotos sin Caja Envolvente (No encuadrado) ── */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-start' }}>
        <div className="user-detail-avatar" style={{ flexShrink: 0, padding: 0 }}>
          {fotos && fotos.length > 1 ? (
            <div className="user-detail-carousel-container">
              {/* Hero photo (3:4 ratio) */}
              <div className="user-detail-hero-photo-wrapper" style={{ position: 'relative', border: 'none', background: 'rgba(0, 0, 0, 0.03)' }}>
                {activeFoto ? (
                  <>
                    <img
                      src={getMediaUrl(activeFoto.ruta)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      crossOrigin="anonymous"
                    />
                    {/* Validation trigger button only if not approved */}
                    {activeFoto.validado !== 1 && (
                      <button
                        onClick={() => setShowValidationModal(true)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.2s ease',
                          zIndex: 20
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        🛡️ Validar
                      </button>
                    )}
                    
                    {/* Validation Status Badge only if not approved */}
                    {activeFoto.validado !== 1 && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        right: '8px',
                        background: activeFoto.resultado === 'rechazado' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                        backdropFilter: 'blur(4px)',
                        letterSpacing: '0.05em'
                      }}>
                        {activeFoto.resultado === 'rechazado' ? '🔴 Rechazada' : ' ⏳ Pendiente'}
                      </div>
                    )}
                  </>
                ) : u.fotoPrincipal ? (
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    <img
                      src={getMediaUrl(u.fotoPrincipal)}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      crossOrigin="anonymous"
                    />
                    {!u.fotoValidada && (
                      <button
                        onClick={() => setShowValidationModal(true)}
                        style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '20px',
                          padding: '4px 10px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          backdropFilter: 'blur(4px)',
                          transition: 'all 0.2s ease',
                          zIndex: 20
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        🛡️ Validar
                      </button>
                    )}
                  </div>
                ) : (
                  <span style={{ fontSize: '2.5rem' }}>👤</span>
                )}
              </div>

              {/* Vertical Miniatures */}
              <div className="user-detail-thumbnail-strip">
                {fotos
                  .filter((f: any) => f.id !== activeFoto?.id)
                  .slice(0, 3)
                  .map((f: any) => (
                    <div
                      key={f.id}
                      onClick={() => setActiveFotoId(f.id)}
                      className="user-detail-thumbnail-wrapper"
                      style={{
                        position: 'relative',
                        border: f.validado === 1 ? '2px solid rgba(16, 185, 129, 0.6)' : f.resultado === 'rechazado' ? '2px solid rgba(239, 68, 68, 0.6)' : '2px solid rgba(245, 158, 11, 0.6)'
                      }}
                    >
                      <img
                        src={getMediaUrl(f.ruta)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        crossOrigin="anonymous"
                        draggable={false}
                      />
                      <span style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        background: f.validado === 1 ? '#10b981' : f.resultado === 'rechazado' ? '#ef4444' : '#f59e0b',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        border: '1px solid white',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                      }} />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div style={{ width: '180px', height: '220px', borderRadius: '12px', overflow: 'hidden', border: 'none', background: 'rgba(0, 0, 0, 0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>
              {u.fotoPrincipal ? (
                <>
                  <img src={getMediaUrl(u.fotoPrincipal)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                  {(() => {
                    const singleFoto = fotos?.[0];
                    const isApproved = singleFoto ? singleFoto.validado === 1 : !!u.fotoValidada;
                    if (!isApproved) {
                      return (
                        <button
                          onClick={() => setShowValidationModal(true)}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: 'rgba(15, 23, 42, 0.75)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '20px',
                            padding: '4px 10px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(4px)',
                            transition: 'all 0.2s ease',
                            zIndex: 20
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.9)';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          🛡️ Validar
                        </button>
                      );
                    }
                    return null;
                  })()}
                  
                  {(() => {
                    const singleFoto = fotos?.[0];
                    const isApproved = singleFoto ? singleFoto.validado === 1 : !!u.fotoValidada;
                    if (!isApproved && (singleFoto || u.fotoPrincipal)) {
                      const isRejected = singleFoto ? singleFoto.resultado === 'rechazado' : false;
                      return (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          left: '8px',
                          right: '8px',
                          background: isRejected ? 'rgba(239, 68, 68, 0.9)' : 'rgba(245, 158, 11, 0.9)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          textTransform: 'uppercase',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          backdropFilter: 'blur(4px)',
                          letterSpacing: '0.05em'
                        }}>
                          {isRejected ? '🔴 Rechazada' : ' ⏳ Pendiente'}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </>
              ) : u.icono ? (
                <span style={{ fontSize: '3.5rem' }}>{u.icono}</span>
              ) : (
                <span style={{ fontSize: '2.5rem' }}>👤</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CSS para el carrusel y sticky en móvil */}
      <style>{`
        .user-detail-avatar {
          padding: 24px 0 24px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .user-detail-carousel-container {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .user-detail-hero-photo-wrapper {
          width: 180px;
          height: 220px;
          border-radius: 12px;
          overflow: hidden;
          border: 3px solid rgba(255,255,255,0.5);
          background: rgba(255, 255, 255, 0.15);
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(0,0,0,0.15);
          transition: all 0.3s ease;
        }
        .user-detail-thumbnail-strip {
          display: flex;
          flex-direction: column;
          gap: 8px;
          justify-content: center;
        }
        .user-detail-thumbnail-wrapper {
          width: 52px;
          height: 70px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          flex-shrink: 0;
          border: 2px solid rgba(255,255,255,0.4);
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .user-detail-thumbnail-wrapper:hover {
          transform: scale(1.08);
          border-color: #a78bfa;
        }
        @media (max-width: 640px) {
          .user-detail-avatar {
            width: 100%;
            padding: 20px 16px;
          }
          .user-detail-avatar > div {
            max-width: none !important;
          }
          .user-detail-avatar > .user-detail-carousel-container {
            max-width: none !important;
          }
          .user-detail-hero-photo-wrapper {
            width: 150px;
            height: 183px;
            border-radius: 10px;
          }
          .user-detail-thumbnail-wrapper {
            width: 44px;
            height: 60px;
            border-radius: 6px;
          }
          .user-detail-carousel-container {
            gap: 12px;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .cultivo-card-option {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cultivo-card-option:hover {
          transform: translateY(-4px) scale(1.015);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08) !important;
        }
        .cultivo-card-option-locked {
          transition: all 0.2s ease;
        }
        .labor-checkbox-label {
          transition: all 0.2s ease;
        }
        .labor-checkbox-label:hover {
          transform: translateY(-1px);
          border-color: #a7f3d0 !important;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.05);
        }
      `}</style>


      {/* ── Datos del Usuario (Módulo Colapsable) ── */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <button 
          type="button"
          onClick={() => setUserDataOpen(!userDataOpen)}
          style={{ 
            width: '100%', 
            background: '#f8fafc', 
            border: 'none', 
            padding: '20px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#334155',
            borderBottom: userDataOpen ? '1px solid #e2e8f0' : 'none',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem' }}>👤</span> 
            <span style={{ fontWeight: 700 }}>Datos del Usuario</span>
            {!userDataOpen && (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                flexWrap: 'wrap', 
                fontSize: '0.8rem', 
                color: '#64748b', 
                background: '#f1f5f9', 
                padding: '4px 12px', 
                borderRadius: '12px',
                marginLeft: '12px',
                fontWeight: 600
              }}>
                <span>👤 {u.nombre || '—'} {u.apellidos || ''}</span>
                <span>·</span>
                <span>@{u.nombreUsuario || '—'}</span>
                <span>·</span>
                <span>📧 {u.email}</span>
                {u.poblacion && (
                  <>
                    <span>·</span>
                    <span>📍 {u.poblacion}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <span style={{ display: 'inline-block', transform: userDataOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', marginLeft: '12px' }}>
            ▼
          </span>
        </button>
        {userDataOpen && (
          <div style={{ padding: '24px' }}>
            {/* Tabs inside Datos del Usuario */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0px', flexWrap: 'wrap' }}>
              {['perfil', 'suscripciones', 'actividad', 'cultivar', 'comunicaciones'].map(t => (
                <button 
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontWeight: tab === t ? 700 : 600,
                    color: tab === t ? '#2563eb' : '#64748b',
                    borderBottom: tab === t ? '3px solid #2563eb' : '3px solid transparent',
                    marginBottom: '-2px',
                    fontSize: '0.82rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {t === 'perfil' ? '👤 Datos Básicos' : 
                   t === 'suscripciones' ? '💳 Planes' : 
                   t === 'actividad' ? '🏆 Logros' : 
                   t === 'cultivar' ? '🌾 Mi forma de cultivar' : 
                   '🔔 Centro de Comunicaciones'}
                </button>
              ))}
            </div>

      {/* ── TAB: PERFIL ── */}
      <div style={{ display: tab === 'perfil' ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
        {/* Datos Personales */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            👤 Datos Básicos
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 200px), 1fr))', gap: '16px' }}>
            {[
              ['Nombre', u.nombre], ['Apellidos', u.apellidos], ['Usuario', u.nombreUsuario],
              ['Email', u.email], ['País', u.pais], ['CP', u.codigoPostal],
              ['Población', u.poblacion], ['F. Nacimiento', u.fechaNacimiento ? new Date(u.fechaNacimiento).toLocaleDateString('es-ES') : '—'],
              ['Registro', u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString('es-ES') : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.9rem', wordBreak: 'break-all' }}>{value || '—'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* ── TAB: SUSCRIPCIONES ── */}
      <div style={{ display: tab === 'suscripciones' ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
        {/* Controles de Suscripción */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 8px', color: '#1e293b', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {planCfg.icon} Plan Actual: {planCfg.label}
              </h3>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                  Origen: {
                    u.suscripcionOrigen === 'pago_directo' ? 'Pago Directo' :
                    u.suscripcionOrigen === 'trial_inicial' ? 'Verificación Email' :
                    u.suscripcionOrigen === 'degradacion_trial' ? 'Degradación de Trial' :
                    u.suscripcionOrigen === 'degradacion_pago' ? 'Degradación de Pago' :
                    u.suscripcionOrigen === 'asignado_admin' ? (u.suscripcion === 'Gratuito' ? 'Registro' : 'Manual') :
                    (u.suscripcionOrigen || 'Desconocido')
                  }
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px' }}>
                  Estado: {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Forzar Cambio de Plan</label>
                <select defaultValue={u.suscripcion || 'Gratuito'}
                  onChange={e => handlePatch('suscripcion', e.target.value)}
                  style={{ padding: '8px 12px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', background: 'white' }}>
                  <option value="Gratuito">1 🍃 Gratuito</option>
                  <option value="Esencial">2 🌿 Esencial</option>
                  <option value="Avanzado">3 🌳 Avanzado</option>
                  <option value="Premium">4 👑 Premium</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>Etiqueta Trial</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', height: '38px', padding: '0 12px', background: 'white', borderRadius: '8px', border: '1.5px solid #cbd5e1' }}>
                  <input 
                    type="checkbox" 
                    defaultChecked={!!u.esPrueba}
                    onChange={e => handlePatch('esPrueba', e.target.checked)}
                    style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>Es de Regalo 🎁 (No Pago)</span>
                </label>
              </div>
              {saving && <div style={{ padding: '8px', color: '#0056b3', fontWeight: 600, fontSize: '0.85rem' }}>Guardando...</div>}
            </div>
          </div>
        </div>

        {/* Historial de Planes */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📜 Historial de Suscripciones</span>
            <span style={{ fontSize: '0.8rem', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', color: '#475569' }}>
              {historialSuscripciones?.length || 0} registros
            </span>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#64748b', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Plan</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Inicio</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Fin</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Estado</th>
                  <th style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>Origen</th>
                </tr>
              </thead>
              <tbody>
                {historialSuscripciones && historialSuscripciones.length > 0 ? historialSuscripciones.map((h: any) => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 600, color: '#0f172a' }}>
                      {getPlanCfg(h.plan).icon} {h.plan} {h.plan !== 'Gratuito' ? (h.origen === 'trial_inicial' || h.origen === 'degradacion_trial' ? 'no pago' : 'pago') : ''}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#475569', whiteSpace: 'nowrap' }}>
                      {new Date(h.fechaInicio).toLocaleDateString('es-ES')} a las {new Date(h.fechaInicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#475569' }}>
                      {h.fechaFin ? (
                        <>
                          <div style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {new Date(h.fechaFin).toLocaleDateString('es-ES')} a las {new Date(h.fechaFin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '0.74rem', marginTop: '4px', fontWeight: 700, color: h.estado === 'activa' ? '#10b981' : '#64748b' }}>
                            {(() => {
                              const start = new Date(h.fechaInicio).getTime();
                              const end = new Date(h.fechaFin).getTime();
                              const now = new Date().getTime();
                              
                              if (h.estado === 'activa' && end > now) {
                                const diffMs = end - now;
                                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                                
                                if (diffDays > 0) {
                                  return `⏳ Quedan ${diffDays}d ${diffHours}h`;
                                } else if (diffHours > 0) {
                                  return `⏳ Quedan ${diffHours}h ${diffMinutes}m`;
                                } else {
                                  return `⏳ Quedan ${diffMinutes}m`;
                                }
                              } else {
                                // Plan finalizado o caducado
                                const durationMs = end - start;
                                const durDays = Math.floor(durationMs / (1000 * 60 * 60 * 24));
                                const durHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const durMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                                const durSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
                                
                                if (durDays > 0) {
                                  return `⏱️ Estuvo ${durDays} día${durDays > 1 ? 's' : ''}`;
                                } else if (durHours > 0) {
                                  return `⏱️ Estuvo ${durHours}h ${durMinutes}m`;
                                } else if (durMinutes > 0) {
                                  return `⏱️ Estuvo ${durMinutes} min`;
                                } else {
                                  return `⏱️ Estuvo ${durSeconds} seg`;
                                }
                              }
                            })()}
                          </div>
                        </>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>— (Sin límite)</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <span style={{ 
                        background: h.estado === 'activa' ? '#dcfce7' : '#f1f5f9', 
                        color: h.estado === 'activa' ? '#166534' : '#475569', 
                        padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' 
                      }}>
                        {h.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: '12px 20px', color: '#64748b', fontSize: '0.85rem' }}>
                      {
                        h.origen === 'pago_directo' ? 'Pago Directo' :
                        h.origen === 'trial_inicial' ? 'Verificación Email' :
                        h.origen === 'degradacion_trial' ? 'Degradado de Trial' :
                        h.origen === 'degradacion_pago' ? 'Degradado de Pago' :
                        h.origen === 'asignado_admin' ? (h.plan === 'Gratuito' ? 'Registro' : 'Manual') : h.origen
                      }
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                      No hay historial de suscripciones registrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {/* ── TAB: ACTIVIDAD ── */}
      <div style={{ display: tab === 'actividad' ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
        {/* Logros */}
        {logros?.length > 0 ? (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '16px 20px', fontWeight: 700, fontSize: '1rem', color: '#1e293b', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              🏆 Logros Desbloqueados ({logros.length})
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logros.map((l: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#fffbeb', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <span style={{ fontWeight: 600, color: '#92400e' }}>⭐ {l.nombre_logro}</span>
                  <span style={{ fontSize: '0.78rem', color: '#b45309', display: 'flex', gap: '8px' }}>
                    <span>Inicio: {new Date(l.fecha_desbloqueo).toLocaleDateString('es-ES')} a las {new Date(l.fecha_desbloqueo).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>—</span>
                    <span>Fin: {l.fecha_fin ? `${new Date(l.fecha_fin).toLocaleDateString('es-ES')} a las ${new Date(l.fecha_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : 'En curso'}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
            Sin logros desbloqueados.
          </div>
        )}
      </div>
      {/* ── TAB: CULTIVAR ── */}
      <div style={{ display: tab === 'cultivar' ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
        {/* Desbloqueador de Edición */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '12px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {cultivarLocked ? '🔒 Los datos de cultivo están bloqueados para evitar modificaciones accidentales.' : '🔓 Edición de cultivo desbloqueada para el administrador.'}
          </span>
          <button 
            onClick={() => setCultivarLocked(!cultivarLocked)}
            style={{
              background: cultivarLocked ? '#2563eb' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {cultivarLocked ? '🔑 Desbloquear Edición' : '🔒 Bloquear Edición'}
          </button>
        </div>

        {/* Calendario de Cultivo */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: cultivarLocked ? 0.85 : 1, transition: 'opacity 0.2s ease' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📅 Calendario de Cultivo {cultivarLocked && <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Solo Lectura</span>}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b' }}>
            Selecciona el tipo de calendario agrícola que rige los cultivos y pautas del huerto.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            {[
              {
                value: 'Normal',
                label: 'Normal',
                desc: 'Calendario estándar basado en el año solar tradicional.',
                badge: 'Estándar',
                badgeBg: '#f1f5f9',
                badgeColor: '#475569',
                activeBorder: '2px solid #10b981',
                activeBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                icon: '🍃'
              },
              {
                value: 'Lunar',
                label: 'Lunar',
                desc: 'Alineado con las fases lunares para optimizar siembras y cosechas.',
                badge: 'Esencial',
                badgeBg: '#dbeafe',
                badgeColor: '#1e40af',
                activeBorder: '2px solid #3b82f6',
                activeBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                icon: '🌙'
              },
              {
                value: 'Biodinámico',
                label: 'Biodinámico',
                desc: 'Máxima conexión astral y ciclos cósmicos (Raíz, Hoja, Flor, Fruto).',
                badge: 'Premium',
                badgeBg: '#f5f3ff',
                badgeColor: '#5b21b6',
                activeBorder: '2px solid #8b5cf6',
                activeBg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
                icon: '✨'
              }
            ].map(opt => {
              const isActive = (u.tipoCalendario || 'Normal') === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handlePatch('tipoCalendario', opt.value)}
                  style={{
                    border: isActive ? opt.activeBorder : '1px solid #cbd5e1',
                    background: isActive ? opt.activeBg : '#ffffff',
                    borderRadius: '12px',
                    padding: '18px',
                    cursor: cultivarLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  className={cultivarLocked ? 'cultivo-card-option-locked' : 'cultivo-card-option'}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.25rem' }}>{opt.icon}</span>
                      <span style={{ background: opt.badgeBg, color: opt.badgeColor, padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700 }}>
                        {opt.badge}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{opt.label}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filosofía de Laboreo */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: cultivarLocked ? 0.85 : 1, transition: 'opacity 0.2s ease' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚜 Filosofía de Laboreo {cultivarLocked && <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Solo Lectura</span>}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b' }}>
            Establece el método de trabajo de la tierra del huerto (indica cómo se trata la estructura del suelo).
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '16px' }}>
            {[
              {
                value: 'Convencional',
                label: 'Convencional',
                desc: 'Arado y volteo tradicional profundo para oxigenar y soltar la tierra.',
                icon: '🌾',
                activeColor: '#10b981',
                activeBg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
              },
              {
                value: 'Mínimo',
                label: 'Laboreo Mínimo',
                desc: 'Intervención superficial leve sin voltear las capas profundas.',
                icon: '🌱',
                activeColor: '#f59e0b',
                activeBg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'
              },
              {
                value: 'No laboreo',
                label: 'No laboreo / No-Till',
                desc: 'Filosofía regenerativa: mantener el suelo vivo intacto sin remover.',
                icon: '🌳',
                activeColor: '#3b82f6',
                activeBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
              }
            ].map(opt => {
              const isActive = (u.tipoLaboreo || 'Convencional') === opt.value;
              return (
                <div
                  key={opt.value}
                  onClick={() => handlePatch('tipoLaboreo', opt.value)}
                  style={{
                    border: isActive ? `2px solid ${opt.activeColor}` : '1px solid #cbd5e1',
                    background: isActive ? opt.activeBg : '#ffffff',
                    borderRadius: '12px',
                    padding: '18px',
                    cursor: cultivarLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 8px 24px rgba(0,0,0,0.06)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                  className={cultivarLocked ? 'cultivo-card-option-locked' : 'cultivo-card-option'}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{opt.icon}</span>
                    </div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>{opt.label}</h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>{opt.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Camas y Pasillos de cultivo */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginTop: '20px', opacity: cultivarLocked ? 0.85 : 1, transition: 'opacity 0.2s ease' }}>
          <h3 style={{ margin: '0 0 6px 0', color: '#1e293b', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🌱 Dimensiones y Camas de Cultivo {cultivarLocked && <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Solo Lectura</span>}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b' }}>
            Medidas predeterminadas del huerto de este usuario en metros reales.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '20px' }}>
            
            {/* Cama Bilateral */}
            <div>
              <label style={{ display: 'block', margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>↕️ Cama Bilateral (acceso 2 lados)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  step="0.05"
                  min="0.2"
                  max="10.0"
                  value={u.camaCultivoBilateral !== undefined ? u.camaCultivoBilateral : 1.20}
                  disabled={cultivarLocked}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, camaCultivoBilateral: isNaN(val) ? 0 : val } } : null);
                  }}
                  onBlur={() => {
                    const val = Math.max(0.2, Math.min(10.0, parseFloat(u.camaCultivoBilateral) || 1.20));
                    setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, camaCultivoBilateral: val } } : null);
                    handlePatch('camaCultivoBilateral', val);
                  }}
                  style={{
                    width: '100px',
                    background: cultivarLocked ? '#f8fafc' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    fontWeight: 700,
                    textAlign: 'center',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    cursor: cultivarLocked ? 'not-allowed' : 'text'
                  }}
                />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569' }}>m</span>
              </div>
            </div>

            {/* Cama Unilateral */}
            <div>
              <label style={{ display: 'block', margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>🧱 Cama Unilateral (acceso 1 lado)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  step="0.05"
                  min="0.1"
                  max="5.0"
                  value={u.camaCultivoUnilateral !== undefined ? u.camaCultivoUnilateral : 0.75}
                  disabled={cultivarLocked}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, camaCultivoUnilateral: isNaN(val) ? 0 : val } } : null);
                  }}
                  onBlur={() => {
                    const val = Math.max(0.1, Math.min(5.0, parseFloat(u.camaCultivoUnilateral) || 0.75));
                    setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, camaCultivoUnilateral: val } } : null);
                    handlePatch('camaCultivoUnilateral', val);
                  }}
                  style={{
                    width: '100px',
                    background: cultivarLocked ? '#f8fafc' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    fontWeight: 700,
                    textAlign: 'center',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    cursor: cultivarLocked ? 'not-allowed' : 'text'
                  }}
                />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569' }}>m</span>
              </div>
            </div>

            {/* Pasillo */}
            <div>
              <label style={{ display: 'block', margin: '0 0 6px 0', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>🚶 Pasillo (distancia entre camas)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="number" 
                  step="0.05"
                  min="0.1"
                  max="3.0"
                  value={u.pasillo !== undefined ? u.pasillo : 0.50}
                  disabled={cultivarLocked}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, pasillo: isNaN(val) ? 0 : val } } : null);
                  }}
                  onBlur={() => {
                    const val = Math.max(0.1, Math.min(3.0, parseFloat(u.pasillo) || 0.50));
                    setData(prev => prev ? { ...prev, usuario: { ...prev.usuario, pasillo: val } } : null);
                    handlePatch('pasillo', val);
                  }}
                  style={{
                    width: '100px',
                    background: cultivarLocked ? '#f8fafc' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    fontWeight: 700,
                    textAlign: 'center',
                    outline: 'none',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    cursor: cultivarLocked ? 'not-allowed' : 'text'
                  }}
                />
                <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#475569' }}>m</span>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* ── TAB: COMUNICACIONES ── */}
      <div style={{ display: tab === 'comunicaciones' ? 'block' : 'none', animation: 'fadeIn 0.3s ease' }}>
        {/* Desbloqueador de Edición */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '12px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {comunicacionesLocked ? '🔒 Los canales de comunicación están bloqueados para evitar modificaciones accidentales.' : '🔓 Edición de canales desbloqueada para el administrador.'}
          </span>
          <button 
            onClick={() => setComunicacionesLocked(!comunicacionesLocked)}
            style={{
              background: comunicacionesLocked ? '#2563eb' : '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            {comunicacionesLocked ? '🔑 Desbloquear Edición' : '🔒 Bloquear Edición'}
          </button>
        </div>

        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: comunicacionesLocked ? 0.85 : 1, transition: 'opacity 0.2s ease' }}>
          <h3 style={{ margin: '0 0 4px 0', color: '#1e293b', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔔 Centro de Comunicaciones {comunicacionesLocked && <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Solo Lectura</span>}
          </h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748b' }}>
            Gestiona los canales por los que Verdantia se comunica con el usuario.
          </p>

          {avisosLoading || !avisosConfig ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cargando preferencias de comunicación...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {avisosConfig.tiposAvisos.map((aviso: any) => {
                const reglaEstado = avisosConfig.reglas[aviso.idtiposavisos] ?? 0;
                let isActivo = true;
                if (reglaEstado === 2) isActivo = false;
                else if (reglaEstado === 1) isActivo = true;
                else if (avisosConfig.userPrefs[aviso.idtiposavisos] === 0) isActivo = false;

                const isTareasDelHuerto = aviso.tiposavisoscodigo === 'TAREAS';

                return (
                  <div key={aviso.idtiposavisos} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: reglaEstado === 2 ? '#f8fafc' : '#ffffff' }}>
                      <div style={{ flex: 1, paddingRight: '16px' }}>
                        <h4 style={{ margin: '0 0 4px 0', color: reglaEstado === 2 ? '#94a3b8' : '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 700 }}>
                          {aviso.tiposavisosnombre === 'Boletín Agrícola' ? '📰 Boletín Agrícola (Blogs)' : 
                           aviso.tiposavisosnombre === 'Tareas del Huerto' ? '🗓️ Tareas del Huerto' :
                           aviso.tiposavisosnombre === 'Alertas Biodinámicas' ? '🌙 Alertas Biodinámicas' :
                           aviso.tiposavisosnombre === 'Alertas Meteorológicas' ? '⚡ Alertas Meteorológicas' :
                           aviso.tiposavisosnombre === 'Novedades y Promociones' ? '🎁 Novedades y Promociones' :
                           aviso.tiposavisosnombre === 'Alertas de Sistema' ? '🛡️ Alertas de Sistema' : 
                           aviso.tiposavisosnombre}
                          
                          {reglaEstado === 2 && <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#e2e8f0', color: '#475569', borderRadius: '12px', fontWeight: 600 }}>🔒 Bloqueado en su plan</span>}
                          {reglaEstado === 1 && <span style={{ fontSize: '0.72rem', padding: '2px 8px', background: '#fee2e2', color: '#b91c1c', borderRadius: '12px', fontWeight: 700 }}>Obligatorio</span>}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.4 }}>{aviso.tiposavisosdescripcion}</p>
                        {reglaEstado === 2 && (
                          <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>
                            💡 Requiere un plan superior para activar este canal.
                          </p>
                        )}
                      </div>

                      <div style={{ marginLeft: '16px', flexShrink: 0 }}>
                        {reglaEstado === 2 ? (
                          <button type="button" style={{ padding: '6px 12px', fontSize: '0.8rem', opacity: 0.6, border: '1px solid #cbd5e1', borderRadius: '8px', background: '#f1f5f9', color: '#64748b', fontWeight: 600 }} disabled>Bloqueado</button>
                        ) : reglaEstado === 1 ? (
                          <div style={{ width: '44px', height: '24px', background: '#10b981', borderRadius: '12px', position: 'relative', opacity: 0.6 }}>
                            <div style={{ width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }} />
                          </div>
                        ) : (
                          <div 
                            onClick={() => toggleAvisoMaestro(aviso.idtiposavisos, isActivo ? 1 : 0)}
                            style={{ 
                              width: '44px', height: '24px', 
                              background: isActivo ? '#10b981' : '#cbd5e1', 
                              borderRadius: '12px', position: 'relative', cursor: comunicacionesLocked ? 'not-allowed' : 'pointer', transition: 'all 0.2s' 
                            }}>
                            <div style={{ 
                              width: '20px', height: '20px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', 
                              left: isActivo ? '22px' : '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' 
                            }} />
                          </div>
                        )}
                      </div>
                    </div>

                    {isTareasDelHuerto && isActivo && (
                      <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px', background: '#f8fafc' }}>
                        <p style={{ margin: '0 0 12px 0', fontSize: '0.82rem', color: '#475569', fontWeight: 700 }}>
                          Desmarca las labores que NO le interesan (Opt-Out):
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))', gap: '10px' }}>
                          {avisosConfig.labores.map((labor: any) => {
                            const laborActiva = avisosConfig.userLaboresPrefs[labor.idlabores] !== 0;
                            return (
                              <label 
                                key={labor.idlabores} 
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '8px', 
                                  cursor: comunicacionesLocked ? 'not-allowed' : 'pointer', 
                                  background: '#fff', 
                                  padding: '8px 12px', 
                                  border: '1px solid #e2e8f0', 
                                  borderRadius: '8px',
                                  transition: 'all 0.2s'
                                }}
                                className={comunicacionesLocked ? '' : 'labor-checkbox-label'}
                              >
                                <input 
                                  type="checkbox" 
                                  checked={laborActiva}
                                  onChange={() => toggleAvisoLabor(labor.idlabores, laborActiva ? 1 : 0)}
                                  disabled={comunicacionesLocked}
                                  style={{ accentColor: '#10b981', width: '16px', height: '16px', cursor: comunicacionesLocked ? 'not-allowed' : 'pointer' }}
                                />
                                <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 500 }}>{labor.laboresnombre}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>


          </div>
        )}
      </div>


      {/* ── Cultivos del Usuario (Módulo Colapsable) ── */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <button 
          type="button"
          onClick={() => setUserCultivosOpen(!userCultivosOpen)}
          style={{ 
            width: '100%', 
            background: '#f8fafc', 
            border: 'none', 
            padding: '20px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#334155',
            borderBottom: userCultivosOpen ? '1px solid #e2e8f0' : 'none',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.3rem' }}>🌱</span> Cultivos del Usuario ({cultivosLoading ? 'Cargando...' : (cultivos?.length || 0)})
          </div>
          <span style={{ display: 'inline-block', transform: userCultivosOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>
            ▼
          </span>
        </button>
        {userCultivosOpen && (
          <div style={{ padding: '24px' }}>

        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Desbloqueador de Edición */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#f8fafc', padding: '12px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              {cultivosLocked ? '🔒 Los cultivos están bloqueados para evitar modificaciones accidentales.' : '🔓 Edición de cultivos desbloqueada para el administrador.'}
            </span>
            <button 
              onClick={() => setCultivosLocked(!cultivosLocked)}
              style={{
                background: cultivosLocked ? '#2563eb' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {cultivosLocked ? '🔑 Desbloquear Edición' : '🔒 Bloquear Edición'}
            </button>
          </div>

          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: cultivosLocked ? 0.85 : 1, transition: 'opacity 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌱 Cultivos del Usuario {cultivosLocked && <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>Solo Lectura</span>}
              </h3>
              
              {/* Filtros */}
              <div style={{ display: 'inline-flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {[
                  { value: 'activos', label: '🌿 En Curso' },
                  { value: 'historial', label: '📜 Historial' },
                  { value: 'todos', label: '🌍 Todos' }
                ].map(f => (
                  <button
                    key={f.value}
                    onClick={() => setCultivosFiltro(f.value as any)}
                    style={{
                      background: cultivosFiltro === f.value ? 'white' : 'transparent',
                      color: cultivosFiltro === f.value ? '#2563eb' : '#64748b',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: cultivosFiltro === f.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {cultivosLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cargando cultivos del usuario...</p>
              </div>
            ) : !cultivos || cultivos.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🌾</span>
                <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>No se encontraron cultivos registrados para este usuario.</p>
              </div>
            ) : (() => {
              const filtered = cultivos.filter((c: any) => {
                if (cultivosFiltro === 'activos') {
                  return c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido';
                }
                if (cultivosFiltro === 'historial') {
                  return c.cultivosestado === 'finalizado' || c.cultivosestado === 'perdido';
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', border: '1.5px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                    <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>No hay cultivos que coincidan con el filtro seleccionado.</p>
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '20px' }}>
                  {filtered.map((c: any) => {
                    return (
                      <div 
                        key={c.idcultivos}
                        style={{ 
                          border: '1.5px solid #e2e8f0', 
                          borderRadius: '16px', 
                          background: '#fff', 
                          overflow: 'hidden', 
                          boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.25s ease'
                        }}
                        className={cultivosLocked ? 'cultivo-card-option-locked' : 'cultivo-card-option'}
                      >
                        {/* Cabecera Tarjeta */}
                        <div style={{ padding: '14px 16px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '1.2rem' }}>{c.especiesvegetalesicono || '🌱'}</span>
                            {c.especiesvegetalesnombre} <span style={{ color: '#94a3b8', fontWeight: 600 }}>#{c.cultivosnumerocoleccion || c.idcultivos}</span>
                          </span>

                          <select
                            disabled={cultivosLocked}
                            value={c.cultivosestado}
                            onChange={e => handleSaveCultivo(c.idcultivos, 'cultivosestado', e.target.value)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '8px',
                              border: '1.5px solid #cbd5e1',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              cursor: cultivosLocked ? 'not-allowed' : 'pointer',
                              background: c.cultivosestado === 'finalizado' ? '#f1f5f9' : c.cultivosestado === 'perdido' ? '#fee2e2' : '#dcfce7',
                              color: c.cultivosestado === 'finalizado' ? '#475569' : c.cultivosestado === 'perdido' ? '#991b1b' : '#15803d',
                              transition: 'all 0.2s'
                            }}
                          >
                            <option value="germinacion">🌱 Germinación</option>
                            <option value="crecimiento">🌿 Crecimiento</option>
                            <option value="produccion">🌸 Producción</option>
                            <option value="finalizado">✅ Finalizado</option>
                            <option value="perdido">☠️ Perdido</option>
                          </select>
                        </div>

                        {/* Contenido */}
                        <div style={{ padding: '16px', display: 'flex', gap: '14px', flex: 1 }}>
                          {/* Foto */}
                          <div style={{ width: '80px', height: '110px', borderRadius: '10px', overflow: 'hidden', background: '#f1f5f9', border: '1px solid #cbd5e1', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {c.foto ? (
                              <img 
                                src={getMediaUrl(c.foto)} 
                                alt="" 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                crossOrigin="anonymous" 
                              />
                            ) : (
                              <span style={{ fontSize: '1.8rem', color: '#cbd5e1' }}>🌿</span>
                            )}
                          </div>

                          {/* Campos Form */}
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Variedad</span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', textAlign: 'right', wordBreak: 'break-all' }}>{c.variedad_nombre || '—'}</span>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Ubicación</span>
                              <input
                                type="text"
                                disabled={cultivosLocked}
                                value={c.cultivosubicacion || ''}
                                placeholder="Ej: Exterior, Maceta"
                                onChange={e => handleSaveCultivo(c.idcultivos, 'cultivosubicacion', e.target.value)}
                                style={{
                                  width: '120px',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontWeight: 600,
                                  color: '#1e293b',
                                  fontSize: '0.8rem',
                                  textAlign: 'right',
                                  background: 'white',
                                  cursor: cultivosLocked ? 'not-allowed' : 'text'
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Cantidad</span>
                              <input
                                type="number"
                                disabled={cultivosLocked}
                                value={c.cultivoscantidad || 1}
                                min={1}
                                onChange={e => handleSaveCultivo(c.idcultivos, 'cultivoscantidad', Number(e.target.value))}
                                style={{
                                  width: '50px',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  textAlign: 'right',
                                  background: 'white',
                                  cursor: cultivosLocked ? 'not-allowed' : 'text'
                                }}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Inicio</span>
                              <input
                                type="date"
                                disabled={cultivosLocked}
                                value={c.cultivosfechainicio ? c.cultivosfechainicio.split('T')[0] : ''}
                                onChange={e => handleSaveCultivo(c.idcultivos, 'cultivosfechainicio', e.target.value)}
                                style={{
                                  width: '120px',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  border: '1px solid #cbd5e1',
                                  fontWeight: 600,
                                  fontSize: '0.76rem',
                                  textAlign: 'right',
                                  background: 'white',
                                  cursor: cultivosLocked ? 'not-allowed' : 'pointer'
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Footer Tarjeta: Observaciones */}
                        <div style={{ padding: '10px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Observaciones</span>
                          <input
                            type="text"
                            disabled={cultivosLocked}
                            value={c.cultivosobservaciones || ''}
                            placeholder="Añadir notas..."
                            onChange={e => handleSaveCultivo(c.idcultivos, 'cultivosobservaciones', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              fontSize: '0.78rem',
                              fontWeight: 500,
                              background: 'white',
                              boxSizing: 'border-box',
                              cursor: cultivosLocked ? 'not-allowed' : 'text'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>

          </div>
        )}
      </div>

      {/* ── Informe de Uso de IA (Módulo Colapsable) ── */}
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
        <button 
          type="button"
          onClick={() => setUserIaOpen(!userIaOpen)}
          style={{ 
            width: '100%', 
            background: '#f8fafc', 
            border: 'none', 
            padding: '20px 24px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '1.1rem',
            color: '#334155',
            borderBottom: userIaOpen ? '1px solid #e2e8f0' : 'none',
            transition: 'background 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-start' }}>
            <span style={{ fontSize: '1.3rem' }}>✨</span> 
            <span style={{ fontWeight: 700 }}>Uso de IA y Asistentes</span>
            {!userIaOpen && (
              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                flexWrap: 'wrap', 
                fontSize: '0.8rem', 
                color: '#64748b', 
                background: '#f1f5f9', 
                padding: '4px 12px', 
                borderRadius: '12px',
                marginLeft: '12px',
                fontWeight: 600
              }}>
                <span>📊 {historialIa.length} interacciones totales</span>
                {historialIa.length > 0 && (
                  <>
                    <span>·</span>
                    <span>Última: {new Date(historialIa[0].fecha).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <span style={{ display: 'inline-block', transform: userIaOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', marginLeft: '12px' }}>
            ▼
          </span>
        </button>

        {userIaOpen && (
          <div style={{ padding: '24px' }}>
            {historialIa.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', border: '1.5px dashed #cbd5e1', borderRadius: '12px', background: '#f8fafc' }}>
                <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>🤖</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>Este usuario aún no ha utilizado los asistentes de Inteligencia Artificial.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setIaFilter('todos')}
                    style={{
                      background: iaFilter === 'todos' ? '#8b5cf6' : '#f1f5f9',
                      color: iaFilter === 'todos' ? 'white' : '#64748b',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Todos ({historialIa.length})
                  </button>
                  {iaModules.map((mod: any) => {
                    const count = historialIa.filter((i: any) => i.modulo === mod).length;
                    return (
                      <button
                        key={mod}
                        onClick={() => setIaFilter(mod)}
                        style={{
                          background: iaFilter === mod ? '#8b5cf6' : '#f1f5f9',
                          color: iaFilter === mod ? 'white' : '#64748b',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {mod} ({count})
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredIa.map((item: any) => (
                    <div key={item.id} style={{ 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '12px', 
                      padding: '16px',
                      background: item.exito === 1 ? 'white' : '#fef2f2',
                      borderColor: item.exito === 1 ? '#e2e8f0' : '#fecaca'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ 
                            background: '#f3e8ff', 
                            color: '#7e22ce', 
                            padding: '4px 10px', 
                            borderRadius: '6px', 
                            fontSize: '0.75rem', 
                            fontWeight: 700,
                            border: '1px solid #e9d5ff'
                          }}>
                            {item.modulo}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                            {new Date(item.fecha).toLocaleString()}
                          </span>
                        </div>
                        {item.exito !== 1 && (
                          <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 700, background: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                            ⚠️ Error / Fallido
                          </span>
                        )}
                      </div>
                      
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>PROMPT / ACCIÓN:</span>
                        <div style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                          {item.prompt || '—'}
                        </div>
                      </div>

                      {item.respuesta && (
                        <div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>RESPUESTA IA:</span>
                          <div style={{ fontSize: '0.85rem', color: '#334155', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', maxHeight: '150px', overflowY: 'auto' }}>
                            {item.respuesta}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Validation Modal ── */}
      {showValidationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🛡️ Panel de Validación de Imagen
              </h3>
              <button 
                onClick={() => { setShowValidationModal(false); setMotivoSeleccionado(''); setMotivoExtra(''); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  lineHeight: 1,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#475569'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                ✕
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Photo Preview */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '140px',
                  aspectRatio: '3/4',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '3px solid #e2e8f0',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.08)'
                }}>
                  <img
                    src={getMediaUrl((activeFoto || fotos?.[0])?.ruta || '')}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              {/* Status Info */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Estado actual:</span>
                {(() => {
                  const f = activeFoto || fotos?.[0];
                  if (!f) return null;
                  const isApproved = f.validado === 1;
                  const isRejected = f.resultado === 'rechazado';
                  return (
                    <span style={{
                      background: isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
                      color: isApproved ? '#166534' : isRejected ? '#991b1b' : '#92400e',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {isApproved ? '🟢 Aprobada' : isRejected ? '🔴 Rechazada' : '⏳ Pendiente'}
                    </span>
                  );
                })()}
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9' }} />

              {/* Action: Approve */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.85rem', color: '#475569', fontWeight: 700, textAlign: 'left' }}>Aprobar Imagen</h4>
                <button
                  disabled={validating}
                  onClick={() => handleValidatePhoto('validar')}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: validating ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(16,185,129,0.2)',
                    transition: 'all 0.2s',
                    opacity: validating ? 0.7 : 1
                  }}
                  onMouseEnter={e => { if(!validating) e.currentTarget.style.background = '#059669'; }}
                  onMouseLeave={e => { if(!validating) e.currentTarget.style.background = '#10b981'; }}
                >
                  {validating ? 'Procesando...' : '✅ Aprobar Imagen'}
                </button>
              </div>

              <div style={{ borderBottom: '1px solid #f1f5f9' }} />

              {/* Action: Reject Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Leve */}
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#475569', fontWeight: 700, textAlign: 'left' }}>Rechazo Leve (Aviso por email, sin sanción)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MOTIVOS_RECHAZO_LEVE.map((motivo, i) => (
                      <label key={`leve-${i}`} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                        padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#ef4444' : '#e2e8f0'}`,
                        background: motivoSeleccionado === motivo ? '#fef2f2' : 'white',
                        transition: 'all 0.15s',
                        textAlign: 'left'
                      }}>
                        <input
                          type="radio"
                          name="motivo"
                          value={motivo}
                          checked={motivoSeleccionado === motivo}
                          onChange={() => setMotivoSeleccionado(motivo)}
                          style={{ marginTop: '2px', accentColor: '#ef4444', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>{motivo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Grave */}
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#7f1d1d', fontWeight: 700, textAlign: 'left' }}>⚠️ Infracción Grave (Sanción disciplinaria)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MOTIVOS_SANCION_GRAVE.map((motivo, i) => (
                      <label key={`grave-${i}`} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                        padding: '8px 10px', borderRadius: '8px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#7f1d1d' : '#e2e8f0'}`,
                        background: motivoSeleccionado === motivo ? '#fef2f2' : 'white',
                        transition: 'all 0.15s',
                        textAlign: 'left'
                      }}>
                        <input
                          type="radio"
                          name="motivo"
                          value={motivo}
                          checked={motivoSeleccionado === motivo}
                          onChange={() => setMotivoSeleccionado(motivo)}
                          style={{ marginTop: '2px', accentColor: '#7f1d1d', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.4 }}>{motivo}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Motivo personalizado */}
                {motivoSeleccionado === 'Otro motivo — ver nota adicional' && (
                  <textarea
                    placeholder="Describe el motivo específico del rechazo..."
                    value={motivoExtra}
                    onChange={e => setMotivoExtra(e.target.value)}
                    rows={3}
                    style={{
                      width: '100%', border: '1.5px solid #fca5a5', borderRadius: '8px',
                      padding: '10px 12px', fontSize: '0.82rem', resize: 'vertical',
                      fontFamily: 'inherit', boxSizing: 'border-box', color: '#0f172a'
                    }}
                  />
                )}

                {/* Nota informativa contextual */}
                {MOTIVOS_SANCION_GRAVE.includes(motivoSeleccionado) ? (
                  <div style={{
                    background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px',
                    padding: '10px 12px', fontSize: '0.78rem', color: '#991b1b', textAlign: 'left'
                  }}>
                    ⛔ <strong>Atención:</strong> La foto será eliminada permanentemente y el usuario recibirá una sanción disciplinaria.
                  </div>
                ) : motivoSeleccionado ? (
                  <div style={{
                    background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
                    padding: '10px 12px', fontSize: '0.78rem', color: '#9a3412', textAlign: 'left'
                  }}>
                    ℹ️ La foto <strong>no se borra</strong>. El usuario la verá marcada como rechazada en su galería y podrá eliminarla o recurrir.
                  </div>
                ) : null}

                {/* Reject Button */}
                <button
                  disabled={validating || !motivoSeleccionado || (motivoSeleccionado === 'Otro motivo — ver nota adicional' && !motivoExtra.trim())}
                  onClick={() => handleValidatePhoto('rechazar')}
                  style={{
                    background: motivoSeleccionado ? '#ef4444' : '#f1f5f9',
                    color: motivoSeleccionado ? 'white' : '#94a3b8',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: (validating || !motivoSeleccionado || (motivoSeleccionado === 'Otro motivo — ver nota adicional' && !motivoExtra.trim())) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: (validating || !motivoSeleccionado || (motivoSeleccionado === 'Otro motivo — ver nota adicional' && !motivoExtra.trim())) ? 0.5 : 1
                  }}
                  onMouseEnter={e => { if(!validating && motivoSeleccionado) e.currentTarget.style.background = '#dc2626'; }}
                  onMouseLeave={e => { if(!validating && motivoSeleccionado) e.currentTarget.style.background = '#ef4444'; }}
                >
                  {validating ? 'Procesando...' : '❌ Denegar Imagen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
