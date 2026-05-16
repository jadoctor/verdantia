'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import '@/components/admin/EspecieForm.css';

export default function CultivoDashboard() {
  const router = useRouter();
  const params = useParams();
  const cultivoId = params.id as string;
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cultivo, setCultivo] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

  const loadCultivo = async (email: string, id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/cultivos/${id}`, { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        const c = data.cultivo;
        setCultivo(c);
        setFormData({
          cultivosestado: c.cultivosestado || '',
          cultivoscantidad: c.cultivoscantidad || 1,
          cultivosubicacion: c.cultivosubicacion || '',
          cultivosfechainicio: c.cultivosfechainicio ? new Date(c.cultivosfechainicio).toISOString().split('T')[0] : '',
          cultivosfechagerminacion: c.cultivosfechagerminacion ? new Date(c.cultivosfechagerminacion).toISOString().split('T')[0] : '',
          cultivosfechatrasplante: c.cultivosfechatrasplante ? new Date(c.cultivosfechatrasplante).toISOString().split('T')[0] : '',
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
          onClick={() => router.push(`/dashboard/mis-plantas/${cultivo.xcultivosidvariedades}`)}
          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          ← Volver a la Planta
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
        {/* Pestaña Principal (Fake Tab) */}
        <div style={{ padding: '0 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '24px' }}>
          <div style={{ padding: '16px 0', borderBottom: '3px solid #0f766e', color: '#0f766e', fontWeight: 'bold', fontSize: '1rem' }}>
            ✏️ Ficha del Cultivo
          </div>
        </div>

        <div style={{ padding: '30px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
          
          {/* Columna Izquierda: Detalles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px', color: '#0f172a', fontSize: '1.2rem' }}>Información Principal</h3>
              
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Estado del Cultivo</label>
                <select 
                  name="cultivosestado" 
                  value={formData.cultivosestado} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: 'white' }}
                >
                  <option value="en_espera">⏳ En espera de siembra</option>
                  <option value="germinacion">🌱 Germinación</option>
                  <option value="crecimiento">🌿 Crecimiento</option>
                  <option value="recoleccion">🍅 En Recolección</option>
                  <option value="finalizado">✅ Finalizado</option>
                  <option value="perdido">💀 Perdido / Muerto</option>
                </select>
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
                  <label>Método Original</label>
                  <div style={{ padding: '10px', background: '#e2e8f0', borderRadius: '8px', color: '#475569', textTransform: 'capitalize' }}>
                    {cultivo.cultivosmetodo.replace('_', ' ')}
                  </div>
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

          {/* Columna Derecha: Hitos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #6ee7b7' }}>
              <h3 style={{ margin: '0 0 16px', color: '#065f46', fontSize: '1.2rem' }}>📅 Línea de Tiempo del Cultivo</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#94a3b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📝</div>
                  <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#475569', fontWeight: 600 }}>Fecha de Registro</label>
                    <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b' }}>
                      {cultivo.cultivosfechacreacion ? new Date(cultivo.cultivosfechacreacion).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sistema anterior'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🏁</div>
                  <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#047857', fontWeight: 600 }}>Fecha de Inicio / Siembra</label>
                    <input 
                      type="date" name="cultivosfechainicio" 
                      value={formData.cultivosfechainicio} 
                      onChange={handleChange} onBlur={handleBlurSave}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}
                    />
                  </div>
                </div>

                {(cultivo.cultivosmetodo === 'semillero' || cultivo.cultivosmetodo === 'siembra_directa') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: formData.cultivosfechagerminacion ? '#10b981' : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'all 0.3s' }}>🌱</div>
                    <div style={{ flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: formData.cultivosfechagerminacion ? '#047857' : '#64748b', fontWeight: 600 }}>Fecha de Germinación</label>
                      <input 
                        type="date" name="cultivosfechagerminacion" 
                        value={formData.cultivosfechagerminacion} 
                        onChange={handleChange} onBlur={handleBlurSave}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                )}

                {cultivo.cultivosmetodo === 'semillero' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: formData.cultivosfechatrasplante ? '#10b981' : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'all 0.3s' }}>🪴</div>
                    <div style={{ flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', color: formData.cultivosfechatrasplante ? '#047857' : '#64748b', fontWeight: 600 }}>Fecha de Trasplante</label>
                      <input 
                        type="date" name="cultivosfechatrasplante" 
                        value={formData.cultivosfechatrasplante} 
                        onChange={handleChange} onBlur={handleBlurSave}
                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: formData.cultivosfechafinalizacion ? '#10b981' : '#cbd5e1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', transition: 'all 0.3s' }}>🛑</div>
                  <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: formData.cultivosfechafinalizacion ? '#047857' : '#64748b', fontWeight: 600 }}>Fecha de Finalización</label>
                    <input 
                      type="date" name="cultivosfechafinalizacion" 
                      value={formData.cultivosfechafinalizacion} 
                      onChange={handleChange} onBlur={handleBlurSave}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

              </div>
            </div>
            
            {/* Here we could add Labores specific to the Cultivo or future Photo grid for the crop */}
            
          </div>

        </div>
      </div>
    </div>
  );
}
