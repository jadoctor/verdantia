'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import '@/components/admin/EspecieForm.css';
import { processAlertas } from '@/lib/alertas-utils';
import InlineLaborPhotos from './InlineLaborPhotos';

export default function CultivoDashboard() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const cultivoId = params.id as string;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cultivo, setCultivo] = useState<any>(null);
  const [pautas, setPautas] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [countdownStr, setCountdownStr] = useState<string | null>(null);
  const [ignoredPautas, setIgnoredPautas] = useState<number[]>([]);
  const [forcedPautas, setForcedPautas] = useState<number[]>([]);
  const [showToggleMenu, setShowToggleMenu] = useState<number | null>(null);
  const [expandedPautas, setExpandedPautas] = useState<number[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const [showAllAlerts, setShowAllAlerts] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ficha' | 'tareas' | 'completadas'>('ficha');
  const [timeOffsetDays, setTimeOffsetDays] = useState<number>(0);
  const [avisosCompletados, setAvisosCompletados] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadCultivo(user.email, cultivoId);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router, cultivoId]);

  
  const handleMarkAsDone = async (idpauta: number, fase: string, fechaEmision: string | null) => {
    if (isSimulating) return;
    if (!window.confirm('¿Marcar esta labor como completada?')) return;
    
    try {
      const res = await fetch(`/api/user/cultivos/${cultivoId}/completar-labor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ idpauta, fase, fechaEmision })
      });
      if (res.ok) {
        await loadCultivo(userEmail!, cultivoId);
      } else {
        alert('Error al completar labor');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red');
    }
  };
  
  const loadCultivo = async (email: string, id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/cultivos/${id}?_t=${Date.now()}`, { 
        headers: { 'x-user-email': email },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        const c = data.cultivo;
        // Attach pautas and avisosCompletados to cultivo for processAlertas
        c.pautas = data.pautas || [];
        c.avisosCompletados = data.avisosCompletados || [];
        // Calculate pending alerts/tasks
        const alertas = processAlertas([c], isSimulating ? Date.now() + timeOffsetDays * 86400000 : undefined);
        c.avisos = alertas;
        setCultivo(c);
        setPautas(data.pautas || []);
        setAvisosCompletados(data.avisosCompletados || []);
        
        let ign = [];
        try { ign = typeof c.cultivosalertas_ignoradas === 'string' ? JSON.parse(c.cultivosalertas_ignoradas) : (c.cultivosalertas_ignoradas || []); } catch(e){}
        setIgnoredPautas(ign);

        let frc = [];
        try { frc = typeof c.cultivosalertas_forzadas === 'string' ? JSON.parse(c.cultivosalertas_forzadas) : (c.cultivosalertas_forzadas || []); } catch(e){}
        setForcedPautas(frc);

        setFormData({
          cultivosestado: c.cultivosestado || 'en_espera',
          cultivoscantidad: c.cultivoscantidad || 1,
          cultivosubicacion: c.cultivosubicacion || '',
          cultivosfechainicio: c.cultivosfechainicio ? new Date(c.cultivosfechainicio).toISOString().split('T')[0] : '',
          cultivosfechagerminacion: c.cultivosfechagerminacion ? new Date(c.cultivosfechagerminacion).toISOString().split('T')[0] : '',
          cultivosfechatrasplante: c.cultivosfechatrasplante ? new Date(c.cultivosfechatrasplante).toISOString().split('T')[0] : '',
          cultivosfechacrecimiento: c.cultivosfechacrecimiento ? new Date(c.cultivosfechacrecimiento).toISOString().split('T')[0] : '',
          cultivosfecharecoleccion: c.cultivosfecharecoleccion ? new Date(c.cultivosfecharecoleccion).toISOString().split('T')[0] : '',
          cultivosfechafinalizacion: c.cultivosfechafinalizacion ? new Date(c.cultivosfechafinalizacion).toISOString().split('T')[0] : '',
          cultivosobservaciones: c.cultivosobservaciones || ''
        });
      } else {
        router.push('/dashboard/mis-plantas');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandClick = (pautaId: number) => {
    if (expandedPautas.includes(pautaId)) {
      setExpandedPautas(expandedPautas.filter(id => id !== pautaId));
    } else {
      setExpandedPautas([...expandedPautas, pautaId]);
    }
  };

  const handleToggleClick = (pautaId: number) => {
    const pauta = pautas.find(p => p.idlaborespauta === pautaId);
    if (!pauta) return;
    
    const isGloballyInactive = pauta.laborespautaactivosino === 0;
    const isIgnored = ignoredPautas.includes(pautaId);
    const isForced = forcedPautas.includes(pautaId);
    const isCurrentlyActive = (isGloballyInactive ? isForced : !isIgnored);

    if (isCurrentlyActive) {
      // Si está activo, mostrar menú para apagar
      setShowToggleMenu(showToggleMenu === pautaId ? null : pautaId);
    } else {
      // Si está inactivo, mostrar menú para encender
      setShowToggleMenu(showToggleMenu === pautaId ? null : pautaId);
    }
  };

  const applyToggle = async (pautaId: number, scope: 'cultivo' | 'variedad', turnOn: boolean) => {
    setShowToggleMenu(null);
    if (!userEmail) return;

    if (turnOn) {
      const pauta = pautas.find(p => p.idlaborespauta === pautaId);
      const isGloballyInactive = pauta?.laborespautaactivosino === 0;

      if (scope === 'cultivo') {
        if (isGloballyInactive) {
          // Si está inactiva globalmente, la forzamos localmente
          setForcedPautas([...forcedPautas, pautaId]);
          fetch(`/api/user/cultivos/${cultivoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail }, body: JSON.stringify({ action: 'toggle_force', pautaId }) });
        } else {
          // Si estaba ignorada localmente, quitamos el ignore
          setIgnoredPautas(ignoredPautas.filter(id => id !== pautaId));
          fetch(`/api/user/cultivos/${cultivoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail }, body: JSON.stringify({ action: 'toggle_alert', pautaId }) });
        }
      } else if (scope === 'variedad') {
        // Encender para toda la variedad (eliminar el clon inactivo)
        // Al eliminarlo, en el frontend lo "activamos" globalmente simulándolo o recargando.
        // Simulamos cambiando el active del pauta local:
        setPautas(prev => prev.map(p => p.idlaborespauta === pautaId ? { ...p, laborespautaactivosino: 1 } : p));
        fetch(`/api/user/variedades/pautas`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail }, body: JSON.stringify({ action: 'enable_pauta', pautaId }) });
      }
    } else {
      // Apagar
      if (scope === 'cultivo') {
        setIgnoredPautas([...ignoredPautas, pautaId]);
        fetch(`/api/user/cultivos/${cultivoId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail }, body: JSON.stringify({ action: 'toggle_alert', pautaId }) });
      } else if (scope === 'variedad') {
        // Simulamos desactivación global:
        setPautas(prev => prev.map(p => p.idlaborespauta === pautaId ? { ...p, laborespautaactivosino: 0 } : p));
        // Y quitamos cualquier force local
        setForcedPautas(forcedPautas.filter(id => id !== pautaId));
        fetch(`/api/user/variedades/pautas`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail }, body: JSON.stringify({ action: 'disable_pauta', pautaId, variedadId: cultivo.xcultivosidvariedades }) });
      }
    }
  };

  const saveField = async (field: string, value: any) => {
    setSaveStatus('saving');
    try {
      await fetch(`/api/user/cultivos/${cultivoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ [field]: value || null })
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus('idle');
    }
  };

  const handleResetAlerts = async () => {
    if (!window.confirm('¿Estás seguro de que quieres restaurar todos los avisos? Esto borrará tus excepciones locales y devolverá la variedad a su estado original maestro.')) return;
    
    setLoading(true);
    try {
      await fetch(`/api/user/cultivos/${cultivoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({ action: 'reset_alerts' })
      });
      // Recargar cultivo
      loadCultivo(userEmail!, cultivoId);
    } catch(e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    if (e.target.tagName === 'SELECT') {
      setTimeout(() => saveField(name, value), 100);
    }
  };

  const handleBlurSave = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    saveField(e.target.name, e.target.value);
  };

  const handleSetToday = (field: string) => {
    const today = new Date().toISOString().split('T')[0];
    setFormData((prev: any) => ({ ...prev, [field]: today }));
    saveField(field, today);
  };

  useEffect(() => {
    if (!formData || !cultivo) return;
    if (formData.cultivosestado === 'perdido') return;

    let newState = 'en_espera';
    if (formData.cultivosfechafinalizacion) newState = 'finalizado';
    else if (formData.cultivosfecharecoleccion) newState = 'recoleccion';
    else if (formData.cultivosfechacrecimiento) newState = 'crecimiento';
    else if (formData.cultivosfechatrasplante) newState = 'crecimiento_inicial';
    else if (formData.cultivosfechagerminacion) {
      const germDate = new Date(`${formData.cultivosfechagerminacion}T08:00:00`).getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      if (new Date().getTime() >= germDate + oneWeek) {
        newState = 'crecimiento_inicial';
      } else {
        newState = 'germinacion';
      }
    }
    else if (formData.cultivosfechainicio) {
      // Si la fecha de siembra está en el futuro, sigue en espera
      const siembraDate = new Date(`${formData.cultivosfechainicio}T08:00:00`).getTime();
      const now = new Date().getTime();
      
      if (siembraDate > now) {
        newState = 'en_espera';
      } else {
        if (cultivo.cultivosmetodo === 'planton') newState = 'crecimiento_inicial';
        else newState = 'germinacion';
      }
    }

    if (newState !== formData.cultivosestado) {
      setFormData((prev: any) => ({ ...prev, cultivosestado: newState }));
      saveField('cultivosestado', newState);
    }
  }, [
    formData.cultivosfechainicio, 
    formData.cultivosfechagerminacion, 
    formData.cultivosfechatrasplante, 
    formData.cultivosfechacrecimiento, 
    formData.cultivosfecharecoleccion, 
    formData.cultivosfechafinalizacion,
    cultivo
  ]);

  useEffect(() => {
    if (formData.cultivosestado === 'en_espera' && formData.cultivosfechainicio) {
      const calculateDiff = () => {
        try {
          const now = new Date();
          const targetStr = formData.cultivosfechainicio;
          // Si el string es sólo YYYY-MM-DD, al añadirle T08:00:00 evitamos problemas de zona horaria
          const target = new Date(`${targetStr}T08:00:00`);
          
          if (isNaN(target.getTime())) {
            setCountdownStr('Fecha inválida');
            return;
          }

          const diff = target.getTime() - now.getTime();
          if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            setCountdownStr(`Faltan ${days}d y ${hours}h`);
          } else {
            setCountdownStr('¡Es hora de sembrar!');
          }
        } catch (e) {
          setCountdownStr('Calculando...');
        }
      };
      
      calculateDiff();
      const interval = setInterval(calculateDiff, 1000 * 60);
      return () => clearInterval(interval);
    } else {
      setCountdownStr(null);
    }
  }, [formData.cultivosestado, formData.cultivosfechainicio]);

  const handleDeleteCultivo = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cultivo por completo? Esta acción no se puede deshacer.')) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/user/cultivos/${cultivoId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      if (res.ok) {
        router.push(`/dashboard/mis-plantas/${cultivo.xcultivosidvariedades}`);
      } else {
        alert('Error al eliminar el cultivo');
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al eliminar cultivo');
      setLoading(false);
    }
  };

  if (loading || !cultivo) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando cultivo...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ── Navegación ── */}
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => {
            if (from === 'dashboard') {
              router.push('/dashboard');
            } else {
              router.push(`/dashboard/mis-plantas/${cultivo.xcultivosidvariedades}`);
            }
          }}
          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {from === 'dashboard' ? '← Volver al Dashboard' : '← Volver a la Planta'}
        </button>

        <div style={{ 
          padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
          background: saveStatus === 'saving' ? '#fef08a' : saveStatus === 'saved' ? '#dcfce7' : '#f1f5f9',
          color: saveStatus === 'saving' ? '#854d0e' : saveStatus === 'saved' ? '#166534' : '#64748b',
          transition: 'all 0.3s'
        }}>
          {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'saved' ? '✓ Guardado' : 'Todos los cambios guardados'}
        </div>
      </div>

      {/* ── Subheader Integrado ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>🌱</span> Cultivo Nº {cultivo.cultivosnumerocoleccion || cultivo.idcultivos}
            {saveStatus === 'saving' && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>Guardando...</span>}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '1rem', fontStyle: 'italic' }}>
            {cultivo.especiesnombre} {cultivo.variedad_nombre && cultivo.variedad_nombre !== cultivo.especiesnombre ? ` - ${cultivo.variedad_nombre}` : ''}
          </p>
        </div>
        <button 
          onClick={handleDeleteCultivo}
          style={{ 
            background: 'rgba(239, 68, 68, 0.9)', border: '1px solid rgba(252, 165, 165, 0.5)', color: 'white', 
            padding: '8px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.2s', alignSelf: 'center'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#dc2626'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'}
        >
          🗑️ Eliminar Cultivo
        </button>
      </div>

      <div style={{ 
        background: '#fff', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        {/* Pestañas */}
        <div style={{ padding: '0 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px' }}>
          <div 
            onClick={() => setActiveTab('ficha')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'ficha' ? '3px solid #0f766e' : '3px solid transparent', color: activeTab === 'ficha' ? '#0f766e' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            ✏️ Ficha del Cultivo
          </div>
          <div 
            onClick={() => setActiveTab('tareas')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'tareas' ? '3px solid #ef4444' : '3px solid transparent', color: activeTab === 'tareas' ? '#ef4444' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            🔔 Tareas Pendientes
          </div>
          <div 
            onClick={() => setActiveTab('completadas')}
            style={{ padding: '16px 0', borderBottom: activeTab === 'completadas' ? '3px solid #10b981' : '3px solid transparent', color: activeTab === 'completadas' ? '#10b981' : '#64748b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
            ✅ Labores Realizadas
          </div>
        </div>

        {activeTab === 'ficha' && (
          <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Sección Superior: Detalles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.2rem' }}>Información Principal</h3>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ margin: 0 }}>Estado del Cultivo</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {countdownStr && (
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#0ea5e9', background: '#e0f2fe', padding: '4px 10px', borderRadius: '12px' }}>
                        ⏳ {countdownStr}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const isDead = formData.cultivosestado === 'perdido';
                        const nextState = isDead ? 'en_espera' : 'perdido';
                        setFormData((prev: any) => ({ ...prev, cultivosestado: nextState }));
                        saveField('cultivosestado', nextState);
                      }}
                      style={{ background: formData.cultivosestado === 'perdido' ? '#ef4444' : '#fee2e2', color: formData.cultivosestado === 'perdido' ? 'white' : '#ef4444', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
                    >
                      {formData.cultivosestado === 'perdido' ? '☠️ Restaurar Vida' : '☠️ Marcar Perdido'}
                    </button>
                  </div>
                </div>
                <select 
                  name="cultivosestado" 
                  value={formData.cultivosestado} 
                  onChange={handleChange}
                  disabled
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '1rem', background: '#f8fafc', color: '#475569', cursor: 'not-allowed', appearance: 'none' }}
                >
                  <option value="en_espera">⏳ En espera de siembra</option>
                  <option value="germinacion">🌱 Fase de Germinación</option>
                  <option value="crecimiento_inicial">🪴 Crecimiento Inicial</option>
                  <option value="crecimiento">🌿 Crecimiento Firme</option>
                  <option value="recoleccion">🍅 En Recolección</option>
                  <option value="finalizado">✅ Finalizado</option>
                  <option value="perdido">💀 Perdido / Muerto</option>
                </select>
                <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>* Se calcula automáticamente según la línea temporal de abajo.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group">
                  <label>Cantidad (Plantas)</label>
                  <input 
                    type="number" min="1" name="cultivoscantidad" 
                    value={formData.cultivoscantidad} 
                    onChange={handleChange}
                    onBlur={handleBlurSave}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div className="form-group">
                  <label>Método de Cultivo</label>
                  {!formData.cultivosfechainicio || (new Date(`${formData.cultivosfechainicio}T08:00:00`).getTime() > new Date().getTime()) ? (
                    <select 
                      name="cultivosmetodo"
                      value={formData.cultivosmetodo || cultivo.cultivosmetodo}
                      onChange={handleChange}
                      onBlur={handleBlurSave}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                    >
                      <option value="siembra_directa">Siembra Directa</option>
                      <option value="semillero">Siembra en Semillero</option>
                      <option value="planton">Plantón</option>
                    </select>
                  ) : (
                    <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', color: '#475569', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500 }}>
                        {{
                          'siembra_directa': 'Siembra Directa',
                          'semillero': 'Siembra en Semillero',
                          'planton': 'Plantón'
                        }[(formData.cultivosmetodo || cultivo.cultivosmetodo) as 'siembra_directa'|'semillero'|'planton'] || (formData.cultivosmetodo || cultivo.cultivosmetodo).replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', background: '#f1f5f9', padding: '2px 6px', borderRadius: '10px' }}>Bloqueado (Siembra activa)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Ubicación (Bancal, Maceta...)</label>
                <input 
                  list="ubicaciones-dashboard"
                  type="text" name="cultivosubicacion" 
                  placeholder="Ej: Bancal 3, Maceta balcón..."
                  value={formData.cultivosubicacion} 
                  onChange={handleChange}
                  onBlur={handleBlurSave}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <datalist id="ubicaciones-dashboard">
                  <option value="Bancal" />
                  <option value="Maceta" />
                  <option value="Jardinera" />
                  <option value="Mesa de cultivo" />
                  <option value="Invernadero" />
                </datalist>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.2rem' }}>Observaciones / Notas de Campo</h3>
              <textarea 
                name="cultivosobservaciones" 
                rows={6}
                placeholder="Anota plagas, evolución, sabor..."
                value={formData.cultivosobservaciones} 
                onChange={handleChange}
                onBlur={handleBlurSave}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Sección Inferior: Hitos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '30px 20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ position: 'relative', marginBottom: '30px' }}>
                <h3 style={{ margin: 0, color: '#0f766e', fontSize: '1.4rem', textAlign: 'center', fontWeight: '800' }}>📅 Línea de Tiempo del Cultivo</h3>
                <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setIsSimulating(!isSimulating)}
                    style={{ background: isSimulating ? '#eff6ff' : 'white', border: `1px solid ${isSimulating ? '#3b82f6' : '#e2e8f0'}`, color: isSimulating ? '#1d4ed8' : '#475569', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    title="Activar el simulador de tiempo"
                  >
                    <span>⏱️</span> {isSimulating ? 'Cerrar Simulador' : 'Simular'}
                  </button>
                  <button 
                    onClick={() => setShowAllAlerts(!showAllAlerts)}
                    style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                    title={showAllAlerts ? 'Ocultar los cuadros de aviso de labores' : 'Mostrar los cuadros de aviso de labores'}
                  >
                    <span>{showAllAlerts ? '👁️' : '🙈'}</span> {showAllAlerts ? 'Ocultar Avisos' : 'Mostrar Avisos'}
                  </button>
                  {(ignoredPautas.length > 0 || forcedPautas.length > 0) && (
                    <button 
                      onClick={handleResetAlerts}
                      style={{ background: 'white', border: '1px solid #e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                      title="Devolver los avisos a su configuración original"
                    >
                      <span>🔄</span> Restaurar Avisos
                    </button>
                  )}
                </div>
              </div>

              {/* SIMULADOR DE TIEMPO */}
              {isSimulating && (
                <div style={{ background: '#fff', border: '2px dashed #3b82f6', borderRadius: '12px', padding: '16px', marginBottom: '30px', animation: 'fadeIn 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ⏱️ Simulador de Tiempo (Viaje al Futuro)
                    </h4>
                    <span style={{ fontWeight: 'bold', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '8px' }}>
                      +{timeOffsetDays} días ({new Date((cultivo?.cultivosfechacreacion ? new Date(cultivo.cultivosfechacreacion).getTime() : Date.now()) + (timeOffsetDays * 86400000)).toLocaleDateString()})
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="365" 
                    value={timeOffsetDays} 
                    onChange={e => setTimeOffsetDays(parseInt(e.target.value))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: '#3b82f6' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    <span>Registro ({cultivo?.cultivosfechacreacion ? new Date(cultivo.cultivosfechacreacion).toLocaleDateString() : 'Día 0'})</span>
                    <span>Medio año</span>
                    <span>1 año</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
                    <button onClick={() => setTimeOffsetDays(Math.max(0, timeOffsetDays - 7))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>-7 días</button>
                    <button onClick={() => setTimeOffsetDays(Math.max(0, timeOffsetDays - 1))} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>-1 día</button>
                    <button onClick={() => setTimeOffsetDays(Math.min(365, timeOffsetDays + 1))} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>+1 día</button>
                    <button onClick={() => setTimeOffsetDays(Math.min(365, timeOffsetDays + 7))} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>+7 días</button>
                    <button onClick={() => setTimeOffsetDays(Math.min(365, timeOffsetDays + 30))} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}>+1 Mes</button>
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#475569' }}>
                    Al mover la barra, la línea de tiempo se adelantará simulando el paso de los días. Las fases se irán completando y los avisos irán "saltando".
                  </p>
                </div>
              )}

              <style dangerouslySetInnerHTML={{__html: `
                .timeline-container { position: relative; max-width: 1000px; margin: 0 auto; }
                /* Diseño unificado a flex para adaptar altura dinámica */
                .timeline-item { position: relative; width: 100%; display: flex; box-sizing: border-box; padding-bottom: 40px; }
                .timeline-left { width: 50%; min-width: 350px; padding: 10px 80px 0 0; position: relative; box-sizing: border-box; text-align: right; }
                .timeline-right { width: 45%; padding-left: 20px; padding-top: 10px; display: flex; flex-direction: column; gap: 8px; }
                
                /* Segmentos de línea vertical */
                .timeline-left::after { 
                  content: ''; 
                  position: absolute; 
                  width: 6px; 
                  background: linear-gradient(to bottom, #10b981 var(--line-fill, 0%), #cbd5e1 var(--line-fill, 0%)); 
                  top: 40px; 
                  height: 100%; 
                  z-index: 1; 
                  border-radius: 4px; 
                  right: 23px;
                }
                .timeline-item:last-child .timeline-left::after { display: none; } 
                
                /* Connector lines horizontales */
                .timeline-left::before { 
                  content: ''; 
                  position: absolute; 
                  top: 38px; 
                  width: 20px; 
                  height: 4px; 
                  background-color: var(--connector-color, #cbd5e1); 
                  z-index: 1; 
                  right: 31px;
                }
                
                /* The Circle */
                .timeline-icon { position: absolute; width: 50px; height: 50px; border-radius: 50%; background: white; border: 4px solid; top: 15px; z-index: 2; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); right: 1px; }
                
                .timeline-content { padding: 20px; background-color: white; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; z-index: 3; text-align: right; }
                
                @media screen and (max-width: 768px) {
                  .timeline-item { flex-direction: column; }
                  .timeline-left { width: 100%; min-width: auto; padding-right: 60px; }
                  .timeline-left::after { right: 18px; }
                  .timeline-left::before { width: 15px; right: 23px; }
                  .timeline-icon { right: 0; width: 40px; height: 40px; border-width: 3px; font-size: 1rem; }
                  .timeline-right { width: 100%; padding-left: 0; padding-top: 15px; }
                }
              `}} />

              <div className="timeline-container">
                {(() => {
                  const parseTime = (dateStr: string) => {
                    if (!dateStr) return null;
                    // For inputs of type date, appending T12:00:00 makes it robust against timezone shifts
                    const d = new Date(`${dateStr}T12:00:00`);
                    return isNaN(d.getTime()) ? null : d.getTime();
                  };
                  
                  const baseTRegistro = cultivo.cultivosfechacreacion ? new Date(cultivo.cultivosfechacreacion).getTime() : Date.now();
                  const simulatedNow = isSimulating ? baseTRegistro + (timeOffsetDays * 86400000) : Date.now();
                  const tRegistro = baseTRegistro;
                  const endOfToday = new Date(simulatedNow).setHours(23, 59, 59, 999);
                  
                  const tSiembra = parseTime(formData.cultivosfechainicio);
                  const isSiembraRealizada = !!tSiembra && tSiembra <= endOfToday;
                  
                  const tGerminacion = parseTime(formData.cultivosfechagerminacion);
                  const isGerminacionRealizada = !!tGerminacion && tGerminacion <= endOfToday;
                  
                  const tTrasplante = parseTime(formData.cultivosfechatrasplante);
                  const isTrasplanteRealizado = !!tTrasplante && tTrasplante <= endOfToday;
                  
                  const tCrecimiento = parseTime(formData.cultivosfechacrecimiento);
                  const isCrecimientoRealizado = !!tCrecimiento && tCrecimiento <= endOfToday;
                  
                  const tFructificacion = parseTime(formData.cultivosfechafructificacion);
                  const isFructificacionRealizada = !!tFructificacion && tFructificacion <= endOfToday;
                  
                  const tRecoleccion = parseTime(formData.cultivosfecharecoleccion);
                  const isRecoleccionRealizada = !!tRecoleccion && tRecoleccion <= endOfToday;

                  const tFinalizacion = parseTime(formData.cultivosfechafinalizacion);
                  const isFinalizacionRealizada = !!tFinalizacion && tFinalizacion <= endOfToday;
                  
                  // Lógica en cascada de permisos
                  const canGerminacion = isSiembraRealizada;
                  const canTrasplante = cultivo.cultivosmetodo === 'semillero' ? isGerminacionRealizada : isSiembraRealizada;
                  
                  let canCrecimiento = isSiembraRealizada;
                  if (cultivo.cultivosmetodo === 'semillero') canCrecimiento = isTrasplanteRealizado;
                  else if (cultivo.cultivosmetodo === 'siembra_directa') canCrecimiento = isGerminacionRealizada;
                  
                  const canFructificacion = isCrecimientoRealizado;
                  const canRecoleccion = isFructificacionRealizada || isCrecimientoRealizado;
                  const canFinalizacion = isSiembraRealizada;
                  
                  // Cálculo de estimaciones dinámicas (cascada de desfases)
                  const DAY_MS = 86400000;
                  const dGerm = cultivo.dias_germinacion || 0;
                  const dTras = Math.max(0, (cultivo.dias_trasplante || 0) - dGerm);
                  const dCrec = cultivo.dias_crecimiento || 0;
                  const dCrecFromGerm = Math.max(0, dCrec - dGerm);
                  const dFruc = Math.max(0, (cultivo.dias_fructificacion || 0) - dCrec);
                  const dReco = Math.max(0, (cultivo.dias_recoleccion || 0) - (cultivo.dias_fructificacion || 0));
                  
                  const actSiembra = tSiembra;
                  const estGerminacion = actSiembra ? actSiembra + dGerm * DAY_MS : null;
                  const baseGerminacion = tGerminacion || estGerminacion;
                  
                  const estTrasplante = baseGerminacion ? baseGerminacion + dTras * DAY_MS : null;
                  const baseTrasplante = tTrasplante || estTrasplante;
                  
                  const estCrecimiento = cultivo.cultivosmetodo === 'semillero' 
                    ? (baseTrasplante ? baseTrasplante + dCrec * DAY_MS : null)
                    : (baseGerminacion ? baseGerminacion + dCrecFromGerm * DAY_MS : null);
                  const baseCrecimiento = tCrecimiento || estCrecimiento;
                  
                  const estFructificacion = baseCrecimiento ? baseCrecimiento + dFruc * DAY_MS : null;
                  const baseFructificacion = tFructificacion || estFructificacion;
                  
                  const estRecoleccion = baseFructificacion ? baseFructificacion + dReco * DAY_MS : null;
                  const baseRecoleccion = tRecoleccion || estRecoleccion;

                  const renderEstimate = (timestampEstimado: number | null | undefined, isEnabled: boolean) => {
                    if (!timestampEstimado) return null;
                    const estimatedDate = new Date(timestampEstimado);
                    
                    // Calcular días exactos de diferencia respecto a hoy
                    const todayAtMidnight = new Date().setHours(0,0,0,0);
                    const diffDays = Math.round((timestampEstimado - todayAtMidnight) / 86400000);
                    
                    let timeText = '';
                    if (diffDays === 0) timeText = '(Hoy)';
                    else if (diffDays === 1) timeText = '(Mañana)';
                    else if (diffDays === -1) timeText = '(Ayer)';
                    else if (diffDays > 1) timeText = `(en ${diffDays} días)`;
                    else timeText = `(hace ${Math.abs(diffDays)} días)`;

                    return (
                      <div style={{ fontSize: '0.8rem', color: isEnabled ? '#64748b' : '#94a3b8', marginTop: '6px', textAlign: 'center', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                        <span>⏱️</span> Estimado: {estimatedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} <span style={{ fontWeight: 600 }}>{timeText}</span>
                      </div>
                    );
                  };

                  const allItems = [
                    {
                      id: 'registro',
                      icon: '📝',
                      color: '#10b981', // Siempre realizado, en verde
                      title: 'Registro',
                      timestamp: tRegistro,
                      content: <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>{cultivo.cultivosfechacreacion ? new Date(cultivo.cultivosfechacreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sistema anterior'}</div>,
                      show: true
                    },
                    {
                      id: 'presiembra',
                      icon: '⛏️',
                      color: parseTime(formData.cultivosfechainicio) ? '#10b981' : '#cbd5e1',
                      title: 'Presiembra',
                      timestamp: parseTime(formData.cultivosfechainicio) ? parseTime(formData.cultivosfechainicio)! - 1000 : tRegistro + 1000, 
                      content: (
                        <div style={{ padding: '8px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                          Preparación previa de terreno y materiales.
                        </div>
                      ),
                      show: true
                    },
                    {
                      id: 'siembra',
                      icon: '🏁',
                      color: '#3b82f6',
                      title: {
                        'siembra_directa': 'Siembra Directa',
                        'semillero': 'Siembra en Semillero',
                        'planton': 'Plantón'
                      }[(formData.cultivosmetodo || cultivo.cultivosmetodo) as 'siembra_directa'|'semillero'|'planton'] || 'Inicio',
                      timestamp: parseTime(formData.cultivosfechainicio),
                      content: (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" name="cultivosfechainicio" value={formData.cultivosfechainicio} onChange={handleChange} onBlur={handleBlurSave} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: formData.cultivosfechainicio ? '2px solid #93c5fd' : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b' }} />
                            {!formData.cultivosfechainicio && <button onClick={() => handleSetToday('cultivosfechainicio')} style={{ padding: '0 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>✓ Hoy</button>}
                          </div>
                          {(!formData.cultivosfechainicio || new Date(`${formData.cultivosfechainicio}T00:00:00`).getTime() > new Date().setHours(0,0,0,0)) && (
                            <button 
                              type="button"
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setFormData((prev: any) => ({ ...prev, cultivosfechainicio: today }));
                                saveField('cultivosfechainicio', today);
                                if (formData.cultivosestado === 'en_espera') {
                                  const nextState = cultivo.cultivosmetodo === 'planton' ? 'crecimiento' : 'germinacion';
                                  setFormData((prev: any) => ({ ...prev, cultivosestado: nextState }));
                                  setTimeout(() => saveField('cultivosestado', nextState), 200);
                                }
                              }}
                              style={{ padding: '8px', fontSize: '0.85rem', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'all 0.2s' }}
                            >
                              🌱 ¡Sembrar Hoy!
                            </button>
                          )}
                        </div>
                      ),
                      show: true
                    },
                    {
                      id: 'pregerminacion',
                      icon: '💧',
                      color: tSiembra ? '#38bdf8' : '#cbd5e1',
                      title: 'Pre-Germinación',
                      timestamp: tSiembra ? tSiembra + 1000 : null,
                      content: (
                        <div style={{ padding: '8px', borderRadius: '6px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: '0.85rem', textAlign: 'center' }}>
                          Mantenimiento de humedad y condiciones hasta brotar.
                        </div>
                      ),
                      show: cultivo.cultivosmetodo === 'semillero' || cultivo.cultivosmetodo === 'siembra_directa'
                    },
                    {
                      id: 'germinacion',
                      icon: '🌱',
                      color: formData.cultivosfechagerminacion ? '#10b981' : '#cbd5e1',
                      title: 'Germinación',
                      timestamp: baseGerminacion,
                      content: (
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" disabled={!canGerminacion} name="cultivosfechagerminacion" value={formData.cultivosfechagerminacion} onChange={handleChange} onBlur={handleBlurSave} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: formData.cultivosfechagerminacion ? '2px solid #6ee7b7' : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', opacity: canGerminacion ? 1 : 0.5, cursor: canGerminacion ? 'text' : 'not-allowed' }} />
                            {!formData.cultivosfechagerminacion && <button onClick={() => handleSetToday('cultivosfechagerminacion')} disabled={!canGerminacion} style={{ padding: '0 12px', background: canGerminacion ? '#10b981' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', cursor: canGerminacion ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>✓ Hoy</button>}
                          </div>
                          {!canGerminacion && !tSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere siembra previa</div>}
                          {!!tSiembra && !formData.cultivosfechagerminacion && renderEstimate(estGerminacion, canGerminacion)}
                        </div>
                      ),
                      show: cultivo.cultivosmetodo === 'semillero' || cultivo.cultivosmetodo === 'siembra_directa'
                    },
                    {
                      id: 'trasplante',
                      icon: '🪴',
                      color: formData.cultivosfechatrasplante ? '#8b5cf6' : '#cbd5e1',
                      title: 'Trasplante',
                      timestamp: baseTrasplante,
                      content: (
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" disabled={!canTrasplante} name="cultivosfechatrasplante" value={formData.cultivosfechatrasplante} onChange={handleChange} onBlur={handleBlurSave} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: formData.cultivosfechatrasplante ? '2px solid #c4b5fd' : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', opacity: canTrasplante ? 1 : 0.5, cursor: canTrasplante ? 'text' : 'not-allowed' }} />
                            {!formData.cultivosfechatrasplante && <button onClick={() => handleSetToday('cultivosfechatrasplante')} disabled={!canTrasplante} style={{ padding: '0 12px', background: canTrasplante ? '#8b5cf6' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', cursor: canTrasplante ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>✓ Hoy</button>}
                          </div>
                          {!canTrasplante && !tSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere paso previo</div>}
                          {!!tSiembra && !formData.cultivosfechatrasplante && renderEstimate(estTrasplante, canTrasplante)}
                        </div>
                      ),
                      show: cultivo.cultivosmetodo === 'semillero'
                    },
                    {
                      id: 'crecimiento_inicial',
                      icon: '🪴',
                      color: (cultivo.cultivosmetodo === 'planton' && formData.cultivosfechainicio) || (tGerminacion && new Date().getTime() >= tGerminacion + 7*24*60*60*1000) ? '#34d399' : '#cbd5e1',
                      title: 'Crecimiento Inicial',
                      timestamp: cultivo.cultivosmetodo === 'planton' ? tSiembra : (tGerminacion ? tGerminacion + 7*24*60*60*1000 : null),
                      content: (
                        <div style={{ padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#475569', fontSize: '0.9rem', textAlign: 'center' }}>
                          {cultivo.cultivosmetodo === 'planton' ? (
                            tSiembra ? <>Comienza el <br/><strong style={{ color: '#10b981' }}>{new Date(tSiembra).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</strong><br/><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Fase automática al plantar)</span></> : 'Pendiente de plantación'
                          ) : (
                            tGerminacion ? (
                              <>Comienza el <br/><strong style={{ color: '#10b981' }}>{new Date(tGerminacion + 7*24*60*60*1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</strong><br/><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>(Fase automática 1 semana post-germinación)</span></>
                            ) : (
                              <>
                                Pendiente de germinación
                                {!!tSiembra && !!cultivo.dias_germinacion && (
                                  <div style={{ marginTop: '2px' }}>
                                    {renderEstimate(estGerminacion ? estGerminacion + 7*DAY_MS : null, true)}
                                  </div>
                                )}
                              </>
                            )
                          )}
                        </div>
                      ),
                      show: true
                    },
                    {
                      id: 'crecimiento',
                      icon: '🌿',
                      color: formData.cultivosfechacrecimiento ? '#22c55e' : '#cbd5e1',
                      title: 'Crecimiento Firme',
                      timestamp: baseCrecimiento,
                      content: (
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" disabled={!canCrecimiento} name="cultivosfechacrecimiento" value={formData.cultivosfechacrecimiento} onChange={handleChange} onBlur={handleBlurSave} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: formData.cultivosfechacrecimiento ? '2px solid #86efac' : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', opacity: canCrecimiento ? 1 : 0.5, cursor: canCrecimiento ? 'text' : 'not-allowed' }} />
                            {!formData.cultivosfechacrecimiento && <button onClick={() => handleSetToday('cultivosfechacrecimiento')} disabled={!canCrecimiento} style={{ padding: '0 12px', background: canCrecimiento ? '#22c55e' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', cursor: canCrecimiento ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>✓ Hoy</button>}
                          </div>
                          {!canCrecimiento && !tSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere paso previo</div>}
                          {!!tSiembra && !formData.cultivosfechacrecimiento && renderEstimate(estCrecimiento, canCrecimiento)}
                        </div>
                      ),
                      show: true
                    },
                    {
                      id: 'fructificacion',
                      icon: '🌸',
                      color: formData.cultivosfechafructificacion ? '#ec4899' : '#cbd5e1',
                      title: 'Floración / Fructificación',
                      timestamp: baseFructificacion,
                      content: (
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" disabled={!canFructificacion} name="cultivosfechafructificacion" value={formData.cultivosfechafructificacion} onChange={handleChange} onBlur={handleBlurSave} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: formData.cultivosfechafructificacion ? '2px solid #f472b6' : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', opacity: canFructificacion ? 1 : 0.5, cursor: canFructificacion ? 'text' : 'not-allowed' }} />
                            {!formData.cultivosfechafructificacion && <button onClick={() => handleSetToday('cultivosfechafructificacion')} disabled={!canFructificacion} style={{ padding: '0 12px', background: canFructificacion ? '#ec4899' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', cursor: canFructificacion ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>✓ Hoy</button>}
                          </div>
                          {!canFructificacion && !tSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere Crecimiento Firme</div>}
                          {!!tSiembra && !formData.cultivosfechafructificacion && renderEstimate(estFructificacion, canFructificacion)}
                        </div>
                      ),
                      show: true
                    },
                    {
                      id: 'recoleccion',
                      icon: '🍅',
                      color: formData.cultivosfecharecoleccion ? '#f97316' : '#cbd5e1',
                      title: 'Inicio Recolección',
                      timestamp: estRecoleccion || baseRecoleccion,
                      content: (
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" disabled={!canRecoleccion} name="cultivosfecharecoleccion" value={formData.cultivosfecharecoleccion} onChange={handleChange} onBlur={handleBlurSave} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: formData.cultivosfecharecoleccion ? '2px solid #fdba74' : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', opacity: canRecoleccion ? 1 : 0.5, cursor: canRecoleccion ? 'text' : 'not-allowed' }} />
                            {!formData.cultivosfecharecoleccion && <button onClick={() => handleSetToday('cultivosfecharecoleccion')} disabled={!canRecoleccion} style={{ padding: '0 12px', background: canRecoleccion ? '#f97316' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', cursor: canRecoleccion ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>✓ Hoy</button>}
                          </div>
                          {!canRecoleccion && !tSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere Crecimiento Firme</div>}
                          {!!tSiembra && !formData.cultivosfecharecoleccion && renderEstimate(estRecoleccion, canRecoleccion)}
                        </div>
                      ),
                      show: true
                    },
                    {
                      id: 'finalizacion',
                      icon: '🛑',
                      color: formData.cultivosfechafinalizacion ? '#ef4444' : '#cbd5e1',
                      title: 'Finalización',
                      timestamp: baseRecoleccion ? baseRecoleccion + (Math.max(0, (cultivo.duracion_total || 0) - (cultivo.dias_recoleccion || 0))) * DAY_MS : null,
                      content: (
                        <div style={{ position: 'relative' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="date" disabled={!canFinalizacion} name="cultivosfechafinalizacion" value={formData.cultivosfechafinalizacion} onChange={handleChange} onBlur={handleBlurSave} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: formData.cultivosfechafinalizacion ? '2px solid #fca5a5' : '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: '#1e293b', opacity: canFinalizacion ? 1 : 0.5, cursor: canFinalizacion ? 'text' : 'not-allowed' }} />
                            {!formData.cultivosfechafinalizacion && <button onClick={() => handleSetToday('cultivosfechafinalizacion')} disabled={!canFinalizacion} style={{ padding: '0 12px', background: canFinalizacion ? '#ef4444' : '#cbd5e1', color: 'white', border: 'none', borderRadius: '8px', cursor: canFinalizacion ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>✓ Hoy</button>}
                          </div>
                          {!canFinalizacion && !tSiembra && <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '6px', textAlign: 'center' }}>Requiere siembra previa</div>}
                          {!!tSiembra && !formData.cultivosfechafinalizacion && renderEstimate(baseRecoleccion ? baseRecoleccion + (Math.max(0, (cultivo.duracion_total || 0) - (cultivo.dias_recoleccion || 0))) * DAY_MS : null, canFinalizacion)}
                        </div>
                      ),
                      show: true
                    }
                  ];

                  const visibleItems = allItems.filter(i => i.show);
                  const now = simulatedNow;

                  return visibleItems.map((item, index) => {
                    const isLeft = index % 2 === 0;
                    const nextItem = visibleItems[index + 1];
                    
                    let fillPercent = 0;
                    if (item.timestamp && nextItem?.timestamp) {
                      if (now >= nextItem.timestamp) fillPercent = 100;
                      else if (now <= item.timestamp) fillPercent = 0;
                      else {
                        fillPercent = ((now - item.timestamp) / (nextItem.timestamp - item.timestamp)) * 100;
                      }
                    } else if (item.timestamp && now >= item.timestamp) {
                      fillPercent = 100;
                    }
                    
                    const isReached = item.timestamp && now >= item.timestamp;
                    const connectorColor = isReached ? item.color : '#cbd5e1';

                    const phasePautas = pautas.filter(p => {
                      if (item.id === 'registro') return p.laborespautafase === 'general' || p.laborespautafase === 'presiembra';
                      if (item.id === 'siembra') return p.laborespautafase === 'siembra' || p.laborespautafase === 'pregerminacion';
                      if (item.id === 'germinacion') return p.laborespautafase === 'germinacion';
                      if (item.id === 'trasplante') return p.laborespautafase === 'trasplante';
                      if (item.id === 'crecimiento') return p.laborespautafase === 'crecimiento' || p.laborespautafase === 'crecimiento_inicial';
                      if (item.id === 'fructificacion') return p.laborespautafase === 'fructificacion';
                      if (item.id === 'recoleccion') return p.laborespautafase === 'recoleccion';
                      if (item.id === 'finalizacion') return p.laborespautafase === 'finalizacion';
                      return false;
                    });

                    return (
                      <div 
                        key={item.id} 
                        className={`timeline-item ${isLeft ? 'left' : 'right'}`}
                        style={{ 
                          '--line-fill': `${Math.round(fillPercent)}%`,
                          '--connector-color': connectorColor 
                        } as React.CSSProperties}
                      >
                        <div className="timeline-left">
                          <div className="timeline-icon" style={{ borderColor: isReached ? item.color : '#cbd5e1', background: isReached ? 'white' : '#f8fafc' }}>
                            <span style={{ filter: isReached ? 'none' : 'grayscale(100%) opacity(50%)' }}>{item.icon}</span>
                          </div>
                          <div className="timeline-content" style={{ 
                            border: isReached ? `2px solid ${item.color}` : '1px solid #e2e8f0',
                            boxShadow: isReached ? `0 4px 12px ${item.color}25` : '0 4px 10px rgba(0,0,0,0.03)',
                            background: isReached ? '#ffffff' : '#f8fafc',
                            transition: 'all 0.3s ease'
                          }}>
                            <h4 style={{ margin: '0 0 12px 0', color: isReached ? '#0f172a' : '#94a3b8', fontSize: '1.1rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              {item.title}
                              {isReached && <span style={{ fontSize: '0.9rem', color: item.color }}>✓</span>}
                            </h4>
                            <div style={{ opacity: isReached ? 1 : 0.85 }}>
                              {item.content}
                            </div>
                          </div>
                        </div>

                        {showAllAlerts && phasePautas.length > 0 && (
                          <div className="timeline-right">
                            {phasePautas.map(p => {
                              const isGloballyInactive = p.laborespautaactivosino === 0;
                              const isIgnored = ignoredPautas.includes(p.idlaborespauta);
                              const isForced = forcedPautas.includes(p.idlaborespauta);
                              const isCurrentlyActive = (isGloballyInactive ? isForced : !isIgnored);

                              return (
                              <div key={p.idlaborespauta} style={{ position: 'relative', background: '#fff', borderRadius: '10px', padding: '12px', borderLeft: `4px solid ${p.laborescolor || '#3b82f6'}`, boxShadow: isReached ? `0 4px 12px ${p.laborescolor || '#3b82f6'}40` : '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left', opacity: isCurrentlyActive ? (isReached ? 1 : 0.4) : 0.2, transition: 'all 0.4s ease', transform: isReached ? 'scale(1.02)' : 'scale(1)' }}>
                                <div style={{ fontSize: '1.4rem', marginTop: '-2px', filter: isReached ? 'none' : 'grayscale(100%)' }}>
                                  {(() => {
                                    let icon = p.laboresicono || '📋';
                                    if (icon.startsWith('mdi-')) {
                                      const MDI_TO_EMOJI: Record<string, string> = {
                                        'mdi-water': '💧', 'mdi-sprout': '🌱', 'mdi-leaf': '🍃', 'mdi-flower': '🌺',
                                        'mdi-tree': '🌳', 'mdi-scissors-cutting': '✂️', 'mdi-tractor': '🚜',
                                        'mdi-shovel': '⛏️', 'mdi-shield-bug': '🛡️', 'mdi-spray': '💦',
                                        'mdi-weather-sunny': '☀️', 'mdi-thermometer': '🌡️', 'mdi-basket': '🧺',
                                        'mdi-hand-water': '🖐️', 'mdi-format-list-bulleted': '🏷️', 'mdi-bottle-tonic-plus': '🧪'
                                      };
                                      icon = MDI_TO_EMOJI[icon] || '🌱';
                                    }
                                    return icon;
                                  })()}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#1e293b', textDecoration: isCurrentlyActive ? 'none' : 'line-through' }}>
                                    Aviso de {p.laboresnombre ? p.laboresnombre.toLowerCase() : 'labor'} — {p.laborespautafrecuenciadias ? `CADA ${p.laborespautafrecuenciadias} DÍAS` : 'PUNTUAL'}
                                  </div>
                                  {p.laborespautanotasia && (
                                    <div 
                                      style={{ marginTop: '4px', fontSize: '0.8rem', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      onClick={() => handleExpandClick(p.idlaborespauta)}
                                    >
                                      <span style={{ transform: expandedPautas.includes(p.idlaborespauta) ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
                                      {expandedPautas.includes(p.idlaborespauta) ? 'Ocultar explicación' : '¿En qué consiste?'}
                                    </div>
                                  )}
                                  {expandedPautas.includes(p.idlaborespauta) && p.laborespautanotasia && (
                                    <div style={{ marginTop: '8px', padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.85rem', color: '#475569', borderLeft: `2px solid ${p.laborescolor || '#cbd5e1'}`, lineHeight: '1.4' }}>
                                      {p.laborespautanotasia}
                                    </div>
                                  )}
                                </div>

                                {/* Toggle Switch */}
                                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                                  <button
                                    onClick={() => handleToggleClick(p.idlaborespauta)}
                                    style={{
                                      width: '36px', height: '20px', borderRadius: '10px',
                                      background: !isCurrentlyActive ? '#cbd5e1' : '#10b981',
                                      border: 'none', cursor: 'pointer', position: 'relative',
                                      transition: 'background 0.3s', padding: 0
                                    }}
                                  >
                                    <div style={{
                                      width: '16px', height: '16px', borderRadius: '50%', background: 'white',
                                      position: 'absolute', top: '2px', left: !isCurrentlyActive ? '2px' : '18px',
                                      transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                    }} />
                                  </button>

                                  {showToggleMenu === p.idlaborespauta && (
                                    <div style={{
                                      position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                      background: 'white', padding: '12px', borderRadius: '12px',
                                      boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0',
                                      zIndex: 50, width: '240px'
                                    }}>
                                      <div style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', color: '#0f172a' }}>
                                        {isCurrentlyActive ? '¿Silenciar aviso?' : '¿Activar aviso?'}
                                      </div>
                                      
                                      <button 
                                        onClick={() => applyToggle(p.idlaborespauta, 'cultivo', !isCurrentlyActive)} 
                                        style={{ display: 'block', width: '100%', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', marginBottom: '6px', textAlign: 'left', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                                      >
                                        🌱 Solo para este cultivo
                                      </button>
                                      
                                      <button 
                                        onClick={() => applyToggle(p.idlaborespauta, 'variedad', !isCurrentlyActive)} 
                                        style={{ display: 'block', width: '100%', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
                                      >
                                        🌍 Para toda la variedad
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )})}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          </div>

          </div>
        )}

        {activeTab === 'tareas' && (() => {
          const avisosPendientes = (cultivo?.avisos || []).filter((a: any) => !ignoredPautas.includes(a.pauta.idlaborespauta));
          
          if (avisosPendientes.length === 0) {
            return (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    📋 Tareas Programadas
                  </h2>
                </div>
                <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎉</div>
                  <h3 style={{ margin: '0 0 8px', color: '#334155' }}>¡Todo al día!</h3>
                  <p style={{ margin: 0, color: '#64748b' }}>No tienes tareas pendientes para este cultivo en este momento.</p>
                </div>
              </div>
            );
          }

          const FASE_ORDER = [
            'Semillero', 'Germinación', 'Desarrollo Inicial', 'Crecimiento Firme',
            'Pre-floración', 'Floración', 'Desarrollo del Fruto', 'Cosecha Temprana',
            'Plena Cosecha', 'Cosecha Tardía', 'Senescencia', 'Post-cosecha'
          ];
          const FASE_NAMES: Record<string, string> = {
            'registro': 'Registro', 'siembra': 'Siembra', 'presiembra': 'Pre-Siembra',
            'pregerminacion': 'Pre-Germinación', 'germinacion': 'Germinación',
            'semillero': 'Semillero', 'trasplante': 'Trasplante',
            'desarrollo_inicial': 'Desarrollo Inicial', 'crecimiento_inicial': 'Crecimiento Inicial',
            'crecimiento': 'Crecimiento Firme', 'pre_floracion': 'Pre-floración', 'floracion': 'Floración',
            'fructificacion': 'Fructificación', 'desarrollo_fruto': 'Desarrollo del Fruto',
            'cosecha_temprana': 'Cosecha Temprana', 'recoleccion': 'Recolección',
            'plena_cosecha': 'Plena Cosecha', 'cosecha_tardia': 'Cosecha Tardía',
            'senescencia': 'Senescencia', 'post_cosecha': 'Post-cosecha',
            'mantenimiento': 'Mantenimiento General', 'general': 'General'
          };

          const grouped = avisosPendientes.reduce((acc: any, a: any) => {
            const phaseStr = a.faseActual || 'general';
            const phaseKey = phaseStr.toLowerCase();
            const displayName = FASE_NAMES[phaseKey] || phaseStr;
            if (!acc[displayName]) acc[displayName] = [];
            acc[displayName].push(a);
            return acc;
          }, {});

          const sortedPhases = Object.keys(grouped).sort((a, b) => {
            const idxA = FASE_ORDER.indexOf(a);
            const idxB = FASE_ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          return (
            <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📋 Tareas Programadas
                </h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedPhases.map(phase => (
                  <div key={phase} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div 
                      style={{ padding: '16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expandedPhases.includes(phase) ? '1px solid #e2e8f0' : 'none' }}
                      onClick={() => setExpandedPhases(prev => prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase])}
                    >
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🌿 {phase}
                        <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>
                          {grouped[phase].length}
                        </span>
                      </h3>
                      <span style={{ color: '#94a3b8' }}>{expandedPhases.includes(phase) ? '▲' : '▼'}</span>
                    </div>

                    {expandedPhases.includes(phase) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {grouped[phase].map((a: any, i: number) => {
                          let icon = a.pauta.laboresicono || '📋';
                          if (icon.startsWith('mdi-')) {
                            const MDI_TO_EMOJI: Record<string, string> = {
                              'mdi-water': '💧', 'mdi-sprout': '🌱', 'mdi-leaf': '🍃', 'mdi-flower': '🌺',
                              'mdi-tree': '🌳', 'mdi-scissors-cutting': '✂️', 'mdi-tractor': '🚜',
                              'mdi-shovel': '⛏️', 'mdi-shield-bug': '🛡️', 'mdi-spray': '💦',
                              'mdi-weather-sunny': '☀️', 'mdi-thermometer': '🌡️', 'mdi-basket': '🧺',
                              'mdi-hand-water': '🖐️', 'mdi-format-list-bulleted': '🏷️', 'mdi-bottle-tonic-plus': '🧪'
                            };
                            icon = MDI_TO_EMOJI[icon] || '🌱';
                          }

                          const isExpanded = expandedPautas.includes(a.pauta.idlaborespauta);

                          return (
                            <div key={i} style={{ borderBottom: i < grouped[phase].length - 1 ? '1px solid #f1f5f9' : 'none', padding: '0', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.2s', borderLeft: `4px solid ${a.pauta.laborescolor || '#3b82f6'}` }}>
                              {/* Compact Header */}
                              <div 
                                style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: isExpanded ? '#f8fafc' : 'white' }}
                                onClick={() => setExpandedPautas(prev => isExpanded ? prev.filter(id => id !== a.pauta.idlaborespauta) : [...prev, a.pauta.idlaborespauta])}
                              >
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                                  <div style={{ fontSize: '2rem' }}>{icon}</div>
                                  <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      {a.pauta.laboresnombre}
                                    </h4>
                                    
                                    {!isExpanded && a.pauta.laborespautanotasia && (
                                      <div style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#0f172a', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        — {a.pauta.laborespautanotasia.substring(0, 100)}...
                                      </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                      <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f1f5f9', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                                        Fase: {a.faseActual}
                                      </div>
                                      {a.fechaEmision && (
                                        <div style={{ fontSize: '0.75rem', color: '#b45309', background: '#fef3c7', display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontWeight: '500' }}>
                                          Emitida: {new Date(a.fechaEmision).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsDone(a.pauta.idlaborespauta, a.faseActual, a.fechaEmision);
                                    }}
                                    style={{ 
                                      background: isSimulating ? '#f1f5f9' : '#10b981', 
                                      color: isSimulating ? '#94a3b8' : 'white', 
                                      border: 'none', padding: '8px 16px', borderRadius: '8px', 
                                      fontWeight: 'bold', fontSize: '0.9rem', cursor: isSimulating ? 'not-allowed' : 'pointer',
                                      display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
                                      boxShadow: isSimulating ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)'
                                    }}
                                    title={isSimulating ? 'Desactiva el simulador para marcar tareas' : 'Marcar labor como completada'}
                                  >
                                    ✓ Completar
                                  </button>
                                  <span style={{ color: '#94a3b8', padding: '4px' }}>
                                    {isExpanded ? '▲' : '▼'}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Expanded Details */}
                              {isExpanded && (
                                <div>
                                  <div style={{ padding: '0 16px 16px 16px' }}>
                                    <InlineLaborPhotos 
                                      isPending={true}
                                      idcultivos={cultivoId}
                                      idpauta={a.pauta.idlaborespauta}
                                      fechaEmision={a.fechaEmision}
                                      userEmail={userEmail!}
                                      setLightboxUrl={setLightboxUrl}
                                    />
                                  </div>
                                  <div style={{ padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', color: '#334155', fontSize: '0.95rem' }}>
                                    {a.pauta.laborespautanotasia && (
                                      <div style={{ marginBottom: '12px', color: '#0f172a', fontWeight: '500', lineHeight: '1.6' }}>
                                        {a.pauta.laborespautanotasia}
                                      </div>
                                    )}
                                    <div style={{ fontStyle: 'italic', color: '#64748b', fontSize: '0.9rem' }}>
                                      {a.pauta.laboresdescripcion || 'Sin descripción general.'}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {activeTab === 'completadas' && (() => {
          const FASE_ORDER = [
            'Semillero', 'Germinación', 'Desarrollo Inicial', 'Crecimiento Firme',
            'Pre-floración', 'Floración', 'Desarrollo del Fruto', 'Cosecha Temprana',
            'Plena Cosecha', 'Cosecha Tardía', 'Senescencia', 'Post-cosecha'
          ];
          const FASE_NAMES: Record<string, string> = {
            'registro': 'Registro', 'siembra': 'Siembra', 'presiembra': 'Pre-Siembra',
            'pregerminacion': 'Pre-Germinación', 'germinacion': 'Germinación',
            'semillero': 'Semillero', 'trasplante': 'Trasplante',
            'desarrollo_inicial': 'Desarrollo Inicial', 'crecimiento_inicial': 'Crecimiento Inicial',
            'crecimiento': 'Crecimiento Firme', 'pre_floracion': 'Pre-floración', 'floracion': 'Floración',
            'fructificacion': 'Fructificación', 'desarrollo_fruto': 'Desarrollo del Fruto',
            'cosecha_temprana': 'Cosecha Temprana', 'recoleccion': 'Recolección',
            'plena_cosecha': 'Plena Cosecha', 'cosecha_tardia': 'Cosecha Tardía',
            'senescencia': 'Senescencia', 'post_cosecha': 'Post-cosecha',
            'mantenimiento': 'Mantenimiento General', 'general': 'General'
          };
          
          const grouped = avisosCompletados.reduce((acc: any, ac: any) => {
            const phaseStr = ac.fase || 'general';
            const phaseKey = phaseStr.toLowerCase();
            const displayName = FASE_NAMES[phaseKey] || phaseStr;
            if (!acc[displayName]) acc[displayName] = [];
            acc[displayName].push(ac);
            return acc;
          }, {});

          const sortedPhases = Object.keys(grouped).sort((a, b) => {
            const idxA = FASE_ORDER.indexOf(a);
            const idxB = FASE_ORDER.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
          });

          return (
          <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <h2 style={{ margin: '0 0 24px', fontSize: '1.5rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✅ Labores Realizadas
            </h2>
            
            {sortedPhases.length === 0 ? (
              <div style={{ background: 'white', borderRadius: '16px', padding: '40px 20px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌱</div>
                <h3 style={{ margin: '0 0 8px', color: '#334155' }}>Aún no hay labores completadas</h3>
                <p style={{ margin: 0, color: '#64748b' }}>Las tareas que vayas marcando aparecerán organizadas aquí.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedPhases.map(phase => (
                  <div key={phase} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <div 
                      style={{ padding: '16px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', borderBottom: expandedPhases.includes(phase) ? '1px solid #e2e8f0' : 'none' }}
                      onClick={() => setExpandedPhases(prev => prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase])}
                    >
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        🌿 {phase}
                        <span style={{ fontSize: '0.8rem', background: '#e2e8f0', color: '#475569', padding: '2px 8px', borderRadius: '12px' }}>
                          {grouped[phase].length}
                        </span>
                      </h3>
                      <span style={{ color: '#94a3b8' }}>{expandedPhases.includes(phase) ? '▲' : '▼'}</span>
                    </div>

                    {expandedPhases.includes(phase) && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {grouped[phase].map((ac: any, i: number) => {
                          const pautaRef = pautas.find(p => p.idlaborespauta === ac.idpauta);
                          if (!pautaRef) return null;
                          
                          let icon = pautaRef.laboresicono || '📋';
                          if (icon.startsWith('mdi-')) {
                            const MDI_TO_EMOJI: Record<string, string> = {
                              'mdi-water': '💧', 'mdi-sprout': '🌱', 'mdi-leaf': '🍃', 'mdi-flower': '🌺',
                              'mdi-tree': '🌳', 'mdi-scissors-cutting': '✂️', 'mdi-tractor': '🚜',
                              'mdi-shovel': '⛏️', 'mdi-shield-bug': '🛡️', 'mdi-spray': '💦',
                              'mdi-weather-sunny': '☀️', 'mdi-thermometer': '🌡️', 'mdi-basket': '🧺',
                              'mdi-hand-water': '🖐️', 'mdi-format-list-bulleted': '🏷️', 'mdi-bottle-tonic-plus': '🧪'
                            };
                            icon = MDI_TO_EMOJI[icon] || '🌱';
                          }

                          return (
                            <div key={i} style={{ padding: '0', borderBottom: i < grouped[phase].length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                              <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '1.5rem', filter: 'grayscale(1)', opacity: 0.7 }}>{icon}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h4 style={{ margin: '0 0 2px', fontSize: '1.1rem', color: '#475569', textDecoration: 'line-through' }}>
                                      {pautaRef.laboresnombre}
                                    </h4>
                                    <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                                      ✓ Completado
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    Fecha: {ac.fechaRealizacion ? new Date(ac.fechaRealizacion).toLocaleDateString() : 'Registrada'}
                                  </span>
                                </div>
                              </div>

                              <div style={{ padding: '0 16px 16px 16px' }}>
                                <InlineLaborPhotos 
                                  isPending={false}
                                  idcultivos={cultivoId}
                                  idpauta={ac.idpauta}
                                  fechaEmision=""
                                  idcultivosavisos={ac.id}
                                  userEmail={userEmail!}
                                  setLightboxUrl={setLightboxUrl}
                                />
                              </div>
                              
                              <div style={{ padding: '12px 16px', background: '#f8fafc', borderTop: '1px solid #f1f5f9', fontSize: '0.9rem', color: '#475569' }}>
                                {pautaRef.laborespautanotasia && (
                                  <div style={{ marginBottom: '6px', fontWeight: 'bold', color: '#334155' }}>
                                    {pautaRef.laborespautanotasia}
                                  </div>
                                )}
                                <div style={{ fontStyle: 'italic' }}>
                                  {pautaRef.laboresdescripcion || 'Sin descripción general.'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          );
        })()}


      {/* Lightbox Global */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999999, cursor: 'zoom-out'
          }}
        >
          <img src={lightboxUrl} alt="Vista ampliada" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '8px' }} />
        </div>
      )}
  
</div>
    </div>
  );
}

