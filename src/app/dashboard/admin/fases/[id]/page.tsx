'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function FaseCultivoEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = React.use(params);
  const isNew = resolvedParams.id === 'nueva';
  
  const [formData, setFormData] = useState({
    fasescultivoclave: '',
    fasescultivonombre: '',
    fasescultivoorden: 1,
    fasescultivocolor: '#3b82f6',
    fasescultivoicono: '🌱',
    fasescultivodescripcion: '',
    fasescultivoesfin: 0
  });
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userEmail && !isNew) {
      loadFase();
    }
  }, [userEmail, isNew]);

  const loadFase = async () => {
    try {
      const res = await fetch(`/api/admin/fases/${resolvedParams.id}`, {
        headers: { 'x-user-email': userEmail! }
      });
      const data = await res.json();
      if (data.fase) {
        setFormData(data.fase);
      } else {
        alert('Fase no encontrada');
        router.push('/dashboard/admin/fases');
      }
    } catch (e) {
      console.error(e);
      alert('Error cargando la fase');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked ? 1 : 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.fasescultivoclave || !formData.fasescultivonombre || !formData.fasescultivoorden) {
      alert('La clave, el nombre y el orden son obligatorios.');
      return;
    }
    
    setSaving(true);
    try {
      const res = await fetch(isNew ? `/api/admin/fases` : `/api/admin/fases/${resolvedParams.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail!
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (data.success) {
        router.push('/dashboard/admin/fases');
      } else {
        alert('Error: ' + data.error);
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar la fase');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando datos de la fase...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => router.push('/dashboard/admin/fases')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginBottom: '20px' }}>
        🔙 Volver a Fases
      </button>

      <div style={{ background: 'white', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h2 style={{ marginTop: 0, color: '#0f172a', fontSize: '1.5rem', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '12px' }}>
          {isNew ? '✨ Crear Nueva Fase de Cultivo' : `✏️ Editar Fase: ${formData.fasescultivonombre}`}
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Nombre (Público)</label>
            <input 
              type="text" name="fasescultivonombre" value={formData.fasescultivonombre} onChange={handleChange}
              placeholder="Ej: Germinación / Semillero"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Clave Interna (Código)</label>
            <input 
              type="text" name="fasescultivoclave" value={formData.fasescultivoclave} onChange={handleChange}
              placeholder="Ej: germinacion"
              disabled={!isNew && ['planificado', 'germinando', 'semillero', 'crecimiento', 'produccion', 'finalizado', 'perdido'].includes(formData.fasescultivoclave)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', background: (!isNew && ['planificado', 'germinando', 'semillero', 'crecimiento', 'produccion', 'finalizado', 'perdido'].includes(formData.fasescultivoclave)) ? '#f1f5f9' : 'white' }}
            />
            <small style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Las claves del sistema no deben modificarse.</small>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Orden cronológico</label>
            <input 
              type="number" name="fasescultivoorden" value={formData.fasescultivoorden} onChange={handleChange}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Icono (Emoji)</label>
            <input 
              type="text" name="fasescultivoicono" value={formData.fasescultivoicono} onChange={handleChange}
              placeholder="🌱"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', textAlign: 'center' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Color UI</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="color" name="fasescultivocolor" value={formData.fasescultivocolor} onChange={handleChange}
                style={{ width: '50px', height: '40px', padding: '0', borderRadius: '8px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
              />
              <span style={{ fontFamily: 'monospace', color: '#64748b' }}>{formData.fasescultivocolor}</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#475569', fontSize: '0.9rem' }}>Descripción para el usuario</label>
          <textarea 
            name="fasescultivodescripcion" value={formData.fasescultivodescripcion || ''} onChange={handleChange}
            placeholder="Breve explicación de lo que ocurre en esta fase..."
            rows={3}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '30px', padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input 
            type="checkbox" 
            id="fasescultivoesfin"
            name="fasescultivoesfin" 
            checked={formData.fasescultivoesfin === 1} 
            onChange={handleChange}
            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
          />
          <div>
            <label htmlFor="fasescultivoesfin" style={{ display: 'block', fontWeight: 'bold', color: '#991b1b', fontSize: '1rem', cursor: 'pointer' }}>
              🏁 Es una "Fase Final" (Fin de Ciclo)
            </label>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#b91c1c' }}>
              Marcar esta casilla indica que al entrar en esta fase, el cultivo ha terminado (ya sea por muerte, finalización natural, etc.)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '2px solid #f1f5f9', paddingTop: '20px' }}>
          <button 
            onClick={() => router.push('/dashboard/admin/fases')} 
            style={{ padding: '10px 20px', borderRadius: '8px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving}
            style={{ padding: '10px 24px', borderRadius: '8px', background: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)' }}
          >
            {saving ? 'Guardando...' : (isNew ? '💾 Crear Fase' : '💾 Guardar Cambios')}
          </button>
        </div>
      </div>
    </div>
  );
}
