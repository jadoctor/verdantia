'use client';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { getMediaUrl } from '@/lib/media-url';
import { auth } from '@/lib/firebase/config';
import '@/components/admin/EspecieForm.css';

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
  const [userStats, setUserStats] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  // Restaurar estado guardado en sessionStorage al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = sessionStorage.getItem('asuntos_tab');
      if (savedTab) setTab(savedTab as 'pendientes' | 'recursos');
      const savedCol = sessionStorage.getItem('asuntos_collapsed');
      if (savedCol) {
        try { setCollapsedUsers(JSON.parse(savedCol)); } catch (e) {}
      }
    }
  }, []);

  // Restaurar scroll position cuando termine de cargar
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const savedScroll = sessionStorage.getItem('asuntos_scroll');
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll, 10));
          sessionStorage.removeItem('asuntos_scroll'); // Limpiar para que no salte en el futuro
        }, 50);
      }
    }
  }, [loading]);

  const saveStateForReturn = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('asuntos_scroll', window.scrollY.toString());
    }
  };

  // Modal de rechazo
  const [rechazandoId, setRechazandoId] = useState<number | null>(null);
  const [rechazandoRecursoId, setRechazandoRecursoId] = useState<{ id: number, p: any } | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>('');
  const [motivoRechazoRecurso, setMotivoRechazoRecurso] = useState<string>('');
  const [motivoExtra, setMotivoExtra] = useState('');

  // Modal de eliminación unificado en el de rechazo

  // Colapsables por usuario
  const [collapsedUsers, setCollapsedUsers] = useState<Record<number, boolean>>({});

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Custom Tooltip
  const [tooltip, setTooltip] = useState<{ x: number, y: number, text: string } | null>(null);

  const cleanRedundancy = (text: string) => {
    if (!text) return text;
    let res = text;
    // Remueve "Palabra (Palabra " => "Palabra ("
    res = res.replace(/([A-ZÁÉÍÓÚÑa-záéíóúñ]+)\s*\(\s*\1\s+/gi, '$1 (');
    // Capitaliza la primera letra después de un paréntesis
    res = res.replace(/\(\s*([a-záéíóúñ])/gi, (m, l) => '(' + l.toUpperCase());
    // Limpia dobles paréntesis accidentales "((...))"
    res = res.replace(/\(\s*\(/g, '(').replace(/\)\s*\)/g, ')');
    return res;
  };

  const handleMouseEnterTooltip = (e: React.MouseEvent, text: string) => {
    if (!text) return;
    const cleaned = cleanRedundancy(text);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({ x: rect.left + rect.width / 2, y: rect.bottom + 10, text: cleaned });
  };
  const handleMouseLeaveTooltip = () => setTooltip(null);

  const STYLE_FILTERS: Record<string, string> = {
    '': '',
    'vintage': 'sepia(40%) contrast(110%) saturate(120%)',
    'vivid': 'saturate(150%) contrast(110%)',
    'dramatic': 'contrast(130%) saturate(80%) brightness(90%)',
    'cool': 'hue-rotate(15deg) saturate(110%)'
  };

  const [editingPhoto, setEditingPhoto] = useState<any>(null);
  const [editorX, setEditorX] = useState(50);
  const [editorY, setEditorY] = useState(50);
  const [editorZoom, setEditorZoom] = useState(100);
  const [editorBrightness, setEditorBrightness] = useState(100);
  const [editorContrast, setEditorContrast] = useState(100);
  const [editorStyle, setEditorStyle] = useState('');
  const [editorSeoAlt, setEditorSeoAlt] = useState('');
  const [editorInitialState, setEditorInitialState] = useState('');
  const [photoEditorSaveStatus, setPhotoEditorSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const editorDragRef = useRef<{ dragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number }>({
    dragging: false, startX: 0, startY: 0, startPosX: 50, startPosY: 50
  });

  const onEditorMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    editorDragRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPosX: editorX, startPosY: editorY };
    const onMove = (ev: MouseEvent) => {
      if (!editorDragRef.current.dragging) return;
      const dx = ev.clientX - editorDragRef.current.startX;
      const dy = ev.clientY - editorDragRef.current.startY;
      const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
      setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
      setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
    };
    const onUp = () => {
      editorDragRef.current.dragging = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const onEditorTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    editorDragRef.current = { dragging: true, startX: t.clientX, startY: t.clientY, startPosX: editorX, startPosY: editorY };
  };

  const onEditorTouchMove = (e: React.TouchEvent) => {
    if (!editorDragRef.current.dragging) return;
    const t = e.touches[0];
    const dx = t.clientX - editorDragRef.current.startX;
    const dy = t.clientY - editorDragRef.current.startY;
    const sensitivity = 0.15 * (100 / Math.max(editorZoom, 100));
    setEditorX(Math.max(0, Math.min(100, editorDragRef.current.startPosX - dx * sensitivity)));
    setEditorY(Math.max(0, Math.min(100, editorDragRef.current.startPosY - dy * sensitivity)));
  };

  const openPhotoEditor = (photo: any) => {
    try {
      const meta = typeof photo.resumen === 'string' ? JSON.parse(photo.resumen || '{}') : (photo.resumen || {});
      const initial = {
        x: meta.profile_object_x ?? 50,
        y: meta.profile_object_y ?? 50,
        zoom: meta.profile_object_zoom ?? 100,
        brightness: meta.profile_brightness ?? 100,
        contrast: meta.profile_contrast ?? 100,
        style: meta.profile_style ?? '',
        seo_alt: meta.seo_alt ?? ''
      };
      setEditorX(initial.x);
      setEditorY(initial.y);
      setEditorZoom(initial.zoom);
      setEditorBrightness(initial.brightness);
      setEditorContrast(initial.contrast);
      setEditorStyle(initial.style);
      setEditorSeoAlt(initial.seo_alt);
      setEditorInitialState(JSON.stringify(initial));
    } catch {
      setEditorX(50); setEditorY(50); setEditorZoom(100);
      setEditorBrightness(100); setEditorContrast(100); setEditorStyle(''); setEditorSeoAlt('');
      setEditorInitialState(JSON.stringify({ x: 50, y: 50, zoom: 100, brightness: 100, contrast: 100, style: '', seo_alt: '' }));
    }
    setEditingPhoto(photo);
    setPhotoEditorSaveStatus('idle');
  };

  const savePhotoEdits = async () => {
    if (!editingPhoto) return;
    const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
    if (currentState === editorInitialState) {
      setPhotoEditorSaveStatus('no-changes');
      setTimeout(() => setPhotoEditorSaveStatus('idle'), 2000);
      return;
    }

    setPhotoEditorSaveStatus('saving');
    const resumen = JSON.stringify({
      profile_object_x: editorX,
      profile_object_y: editorY,
      profile_object_zoom: editorZoom,
      profile_brightness: editorBrightness,
      profile_contrast: editorContrast,
      profile_style: editorStyle,
      seo_alt: editorSeoAlt
    });
    try {
      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: editingPhoto.id || editingPhoto.photoId, action: 'updateMeta', resumen })
      });
      if (!res.ok) throw new Error('Error al guardar');
      setEditingPhoto(null);
      loadPendientes(); // Recargar datos
    } catch (e) {
      console.error(e);
      alert('❌ Error guardando ajustes');
    } finally {
      setPhotoEditorSaveStatus('idle');
    }
  };

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
          usuarioFotoPerfil: p.usuarioFotoPerfil,
          motivos: {}
        };
      }
      
      let motivoKey = 'Foto de Perfil';
      if (p.fotoTipo === 'planta') {
        const especie = p.especieNombre || 'Sin especie';
        const variedad = p.variedadNombre ? ` - ${p.variedadNombre}` : '';
        motivoKey = `Variedad: ${especie}${variedad}`;
      } else if (p.fotoTipo === 'labor') {
        const especie = p.especieNombre || 'Sin especie';
        const variedad = p.variedadNombre ? ` - ${p.variedadNombre}` : '';
        let cultivoInfo = '';
        if (p.cultivoNumero) {
          const dateStr = p.cultivoFecha ? new Date(p.cultivoFecha).toLocaleDateString('es-ES') : '';
          cultivoInfo = `Cultivo Nº${p.cultivoNumero} ${dateStr ? `(${dateStr})` : ''} - `;
        } else {
          cultivoInfo = 'Cultivo: ';
        }
        motivoKey = `${cultivoInfo}${especie}${variedad}`.trim();
        if (motivoKey.startsWith('- ')) motivoKey = motivoKey.substring(2);
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
      setUserStats(data.userStats || {});
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

    const motivoFinal = motivoSeleccionado === 'Otro motivo — ver nota adicional' && motivoExtra.trim()
      ? `${motivoSeleccionado}: ${motivoExtra.trim()}`
      : motivoSeleccionado;

    const actionType = MOTIVOS_SANCION_GRAVE.includes(motivoSeleccionado) ? 'eliminar_inapropiado' : 'rechazar';
    const adminEmail = auth.currentUser?.email || undefined;

    try {
      const res = await fetch('/api/admin/asuntos-pendientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId: rechazandoId,
          action: actionType,
          motivo: motivoFinal,
          adminEmail
        })
      });
      const data = await res.json();
      setPendientes(prev => prev.filter(p => p.id !== rechazandoId));
      setRechazandoId(null);
      
      if (actionType === 'eliminar_inapropiado') {
        const msgs: Record<string, string> = {
          advertencia_1: `⚠️ Foto eliminada y 1ª advertencia enviada.`,
          advertencia_2: `🔒 Foto eliminada. 2ª infracción: cuenta suspendida 7 días.`,
          baja: `🔴 Foto eliminada. 3ª infracción: cuenta dada de baja definitivamente.`,
        };
        showToast(msgs[data.sancion] || '✅ Foto eliminada y sanción aplicada.');
      } else {
        if (data.emailEnviado) {
          showToast(`✅ Foto rechazada. Correo enviado a: ${data.emailEnviado}`);
        } else {
          showToast('✅ Foto rechazada. El usuario verá el motivo en su galería.');
        }
      }
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
          onClick={() => { setTab('pendientes'); sessionStorage.setItem('asuntos_tab', 'pendientes'); }}
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
          onClick={() => { setTab('recursos'); sessionStorage.setItem('asuntos_tab', 'recursos'); }}
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

          {groupedData.map((user: any, uIdx: number) => {
            const stats = userStats[user.usuarioId] || {};
            const plan = stats.suscripcion_nombre || 'Gratuito';
            const isPremium = plan === 'Premium';
            let planLabel = '1 🍃 Gratuito';
            if (plan === 'Esencial') planLabel = '2 🌿 Esencial';
            else if (plan === 'Avanzado') planLabel = '3 🌳 Avanzado';
            else if (plan === 'Premium') planLabel = '4 👑 Premium';

            return (
            <div key={uIdx} style={{ marginBottom: '24px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              {/* Header Usuario - Colapsable */}
              <div 
                onClick={() => {
                  setCollapsedUsers(prev => {
                    const next = { ...prev, [uIdx]: !prev[uIdx] };
                    sessionStorage.setItem('asuntos_collapsed', JSON.stringify(next));
                    return next;
                  });
                }}
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)', padding: '16px 20px', color: 'white', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', borderBottom: '1px solid rgba(255,255,255,0.2)' }}
                onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
              >
                <div style={{ width: '80px', height: '80px', background: user.usuarioFotoPerfil ? 'transparent' : 'rgba(255,255,255,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                  {user.usuarioFotoPerfil ? (
                    <img src={getMediaUrl(user.usuarioFotoPerfil)} alt={user.usuarioNombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
                  ) : (
                    '👤'
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '180px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{user.usuarioNombre}</h3>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', fontWeight: 500 }}>{user.usuarioEmail}</span>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    {user.usuarioId && (
                      <span style={{ 
                        background: isPremium ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'rgba(255,255,255,0.2)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        border: isPremium ? '1px solid #fde68a' : '1px solid rgba(255,255,255,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        {planLabel}
                      </span>
                    )}

                    {user.usuarioId && (
                      <a 
                        href={`/dashboard/admin/usuarios/${user.usuarioId}?from=asuntos`}
                        onClick={(e) => { e.stopPropagation(); saveStateForReturn(); }}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '6px', 
                          background: 'rgba(255,255,255,0.2)', 
                          padding: '4px 10px', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 600, 
                          color: 'white', 
                          textDecoration: 'none', 
                          transition: 'background 0.2s',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                      >
                        <span>🛠️</span>
                        <span>Ver Perfil Admin</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Stats Section - now in the middle */}
                <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '20px' }}>
                  {user.usuarioId && (
                    <>
                      <div 
                        onMouseEnter={(e) => handleMouseEnterTooltip(e, stats.variedades_nombres || 'Ninguna variedad asumida')}
                        onMouseLeave={handleMouseLeaveTooltip}
                        style={{ background: 'rgba(0,0,0,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'help' }}
                      >
                        <span>🌱 Variedades:</span>
                        <span style={{ background: 'white', color: '#059669', padding: '2px 6px', borderRadius: '4px' }}>{stats.variedades_asumidas || 0}</span>
                      </div>
                      <div 
                        onMouseEnter={(e) => {
                          let t = '';
                          if (stats.cultivos_activos_nombres) t += `✅ Activos:\n${stats.cultivos_activos_nombres}\n\n`;
                          if (stats.cultivos_inactivos_nombres) t += `❌ Inactivos:\n${stats.cultivos_inactivos_nombres}`;
                          handleMouseEnterTooltip(e, t.trim() || 'Ningún cultivo');
                        }}
                        onMouseLeave={handleMouseLeaveTooltip}
                        style={{ background: 'rgba(0,0,0,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'help' }}
                      >
                        <span>🚜 Cultivos:</span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{stats.cultivos_activos || 0} act / {stats.cultivos_inactivos || 0} inact</span>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>📸 Fotos:</span>
                        <span style={{ background: 'white', color: '#059669', padding: '2px 6px', borderRadius: '4px' }}>{stats.fotos_subidas || 0}</span>
                      </div>
                      {(stats.fotos_rechazadas > 0) && (
                        <div 
                          onMouseEnter={(e) => handleMouseEnterTooltip(e, stats.motivos_rechazo || 'Sin motivos registrados')}
                          onMouseLeave={handleMouseLeaveTooltip}
                          style={{ background: '#ef4444', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)', cursor: 'help' }}
                        >
                          <span>⚠️ Rechazadas:</span>
                          <span style={{ background: 'white', color: '#ef4444', padding: '2px 6px', borderRadius: '4px' }}>{stats.fotos_rechazadas}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.4)', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
                    {Object.values(user.motivos).reduce((sum: number, m: any) => sum + Object.values(m.labores).reduce((s2: number, photos: any) => s2 + photos.length, 0), 0)} fotos pendientes
                  </span>
                  <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.8)', transition: 'transform 0.3s', transform: collapsedUsers[uIdx] === true ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </div>
              </div>

              {collapsedUsers[uIdx] === true && (
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
                                        <button onClick={() => abrirModalRechazo(p.id)} disabled={processing !== null} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>❌ Denegar</button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => handleRestaurar(p.id, p)} disabled={processing !== null} style={{ flex: 1, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>✅ Restaurar</button>
                                        <button onClick={() => abrirModalRechazoRecurso(p.id, p)} disabled={processing !== null} style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>❌ Denegar</button>
                                      </>
                                    )}
                                    <button onClick={() => openPhotoEditor(p)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>✏️</button>
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
          );
          })}
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
            <div style={{ background: 'white', padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ background: '#fef2f2', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🚫</span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>Denegar o Sancionar Foto</h2>
                </div>
                <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, color: '#475569' }}>👤 {fotoRechazo.usuarioNombre}</span>
                  <span style={{ background: '#ecfdf5', padding: '2px 8px', borderRadius: '12px', fontWeight: 600, color: '#047857' }}>🌱 {fotoRechazo.especieNombre || 'Perfil'} {fotoRechazo.variedadNombre ? `- ${fotoRechazo.variedadNombre}` : ''}</span>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => setRechazandoId(null)}
                  style={{
                    background: 'white', border: '1px solid #cbd5e1', color: '#475569',
                    padding: '8px 16px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarRechazo}
                  disabled={!motivoSeleccionado || processing !== null}
                  style={{
                    background: motivoSeleccionado ? '#dc2626' : '#f1f5f9',
                    color: motivoSeleccionado ? 'white' : '#94a3b8', border: 'none',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#475569', fontWeight: 700 }}>Rechazo Leve (Aviso por email, sin sanción)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MOTIVOS_RECHAZO_LEVE.map((motivo, i) => (
                      <label key={`leve-${i}`} style={{
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
                </div>

                <div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '0.9rem', color: '#7f1d1d', fontWeight: 700 }}>⚠️ Infracción Grave (Sanción disciplinaria)</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {MOTIVOS_SANCION_GRAVE.map((motivo, i) => (
                      <label key={`grave-${i}`} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer',
                        padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${motivoSeleccionado === motivo ? '#7f1d1d' : '#e2e8f0'}`,
                        background: motivoSeleccionado === motivo ? '#fef2f2' : 'white',
                        transition: 'all 0.15s'
                      }}>
                        <input
                          type="radio"
                          name="motivo"
                          value={motivo}
                          checked={motivoSeleccionado === motivo}
                          onChange={() => setMotivoSeleccionado(motivo)}
                          style={{ marginTop: '2px', accentColor: '#7f1d1d', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.4 }}>{motivo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Campo libre si elige "Otro" */}
              {motivoSeleccionado === 'Otro motivo — ver nota adicional' && (
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
              {MOTIVOS_SANCION_GRAVE.includes(motivoSeleccionado) ? (
                <div style={{
                  background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px',
                  padding: '10px 12px', fontSize: '0.8rem', color: '#991b1b', marginBottom: '0'
                }}>
                  ⛔ <strong>Atención:</strong> La foto será eliminada permanentemente y el usuario recibirá una sanción disciplinaria.
                </div>
              ) : (
                <div style={{
                  background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px',
                  padding: '10px 12px', fontSize: '0.8rem', color: '#9a3412', marginBottom: '0'
                }}>
                  ℹ️ La foto <strong>no se borra</strong>. El usuario la verá marcada como rechazada en su galería y podrá eliminarla o recurrir la decisión.
                </div>
              )}
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
      {/* EDITOR DE FOTOS MODAL */}
      {editingPhoto && (
        <div className="photo-editor-overlay">
          <div className="photo-editor-content" onClick={e => e.stopPropagation()}>
            <div className="photo-editor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0 }}>Ajustar Fotografía y SEO</h3>
                <small style={{ color: '#64748b', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                  📄 {editingPhoto.ruta.split('/').pop()}
                </small>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button type="button" onClick={() => setEditingPhoto(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#475569', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Cerrar</button>
                {(() => {
                  const currentState = JSON.stringify({ x: editorX, y: editorY, zoom: editorZoom, brightness: editorBrightness, contrast: editorContrast, style: editorStyle, seo_alt: editorSeoAlt });
                  if (currentState !== editorInitialState) {
                    return (
                      <button
                        type="button"
                        onClick={savePhotoEdits}
                        className={`btn-primary ${photoEditorSaveStatus === 'no-changes' ? 'success' : ''}`}
                        style={{ padding: '8px 16px', fontSize: '0.9rem', margin: 0 }}
                        disabled={photoEditorSaveStatus === 'saving'}
                      >
                        {photoEditorSaveStatus === 'saving' ? '⏳ Guardando...' : photoEditorSaveStatus === 'no-changes' ? '✓ Sin cambios' : '💾 Guardar Cambios'}
                      </button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="photo-editor-body">
              <div className="photo-editor-preview-container"
                onMouseDown={onEditorMouseDown}
                onTouchStart={onEditorTouchStart}
                onTouchMove={onEditorTouchMove}>
                <div className="photo-editor-preview-mask" style={{ borderRadius: '12px', aspectRatio: '3/4', width: '220px', overflow: 'hidden' }}>
                  <img
                    src={getMediaUrl(editingPhoto.ruta)}
                    alt="preview"
                    className="photo-editor-image"
                    draggable="false"
                    style={{
                      objectPosition: `${editorX}% ${editorY}%`,
                      transformOrigin: `${editorX}% ${editorY}%`,
                      transform: `scale(${editorZoom / 100})`,
                      filter: `brightness(${editorBrightness}%) contrast(${editorContrast}%) ${editorStyle ? STYLE_FILTERS[editorStyle] : ''}`.trim()
                    }}
                    crossOrigin="anonymous" />
                </div>
                <div className="photo-editor-hint">
                  <span>Arrastra para encuadrar</span>
                </div>
              </div>

              <div className="photo-editor-controls">
                <div className="editor-control-group">
                  <label>
                    <span className="control-label">🔍 Zoom ({editorZoom}%)</span>
                    <button type="button" className="reset-btn" onClick={() => setEditorZoom(100)}>↻</button>
                  </label>
                  <input type="range" min="100" max="300" value={editorZoom} onChange={e => setEditorZoom(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <label>
                    <span className="control-label">☀️ Brillo ({editorBrightness}%)</span>
                  </label>
                  <input type="range" min="50" max="150" value={editorBrightness} onChange={e => setEditorBrightness(Number(e.target.value))} />
                </div>
                <div className="editor-control-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>
                      <span className="control-label" style={{ margin: 0 }}>🌗 Contraste ({editorContrast}%)</span>
                    </label>
                  </div>
                  <input type="range" min="50" max="150" value={editorContrast} onChange={e => setEditorContrast(Number(e.target.value))} />
                </div>

                <div style={{ marginBottom: '15px', display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setEditorBrightness(110);
                      setEditorContrast(115);
                      setEditorStyle('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    ✨ Auto Color
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditorBrightness(100);
                      setEditorContrast(100);
                      setEditorStyle('');
                      setEditorZoom(100);
                      setEditorX(50);
                      setEditorY(38);
                    }}
                    style={{
                      padding: '10px 15px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    ↺ Reset
                  </button>
                </div>

                <div className="editor-control-group" style={{ marginBottom: '15px' }}>
                  <label>
                    <span className="control-label">🎨 Estilos y Filtros de IA</span>
                  </label>
                  <select
                    value={editorStyle}
                    onChange={e => setEditorStyle(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', color: '#334155', background: 'white' }}
                  >
                    <option value="">Sin Filtro (Original)</option>
                    <option value="vibrant">Saturado (Vibrant)</option>
                    <option value="vintage">Vintage (Cálido)</option>
                    <option value="cinematic">Cinemático (Dramatic)</option>
                    <option value="bnw">Blanco y Negro (Clásico)</option>
                    <option value="fade">Desaturado (Fade)</option>
                    <option value="comic">Comic (Vibrante)</option>
                    <option value="manga">Manga (B/N Intenso)</option>
                    <option value="watercolor">Acuarela (Suave)</option>
                  </select>
                </div>

                <div className="editor-control-group">
                  <label><span className="control-label">🏷️ Descripción SEO (Alt Text)</span></label>
                  <input
                    type="text"
                    value={editorSeoAlt}
                    onChange={e => setEditorSeoAlt(e.target.value)}
                    placeholder="Ej. Tomates cherry maduros en la planta"
                    style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.9rem' }}
                  />
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>Ayuda al posicionamiento en buscadores.</small>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.y,
          left: tooltip.x,
          transform: 'translateX(-50%)',
          background: '#1e293b',
          color: 'white',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '0.85rem',
          fontWeight: 500,
          whiteSpace: 'pre-wrap',
          maxWidth: '300px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 999999,
          pointerEvents: 'none'
        }}>
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: '-4px',
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: '8px',
            height: '8px',
            background: '#1e293b'
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            {tooltip.text}
          </div>
        </div>
      )}
    </div>
  );
}
