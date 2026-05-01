'use client';

import React, { useState, useEffect } from 'react';

interface PlagaFormProps {
  plagaId: string | null;
  userEmail: string;
  onClose: () => void;
}

const defaultFormData = {
  plagasnombre: '',
  plagasnombrecientifico: '',
  plagastipo: 'insecto',
  plagasdescripcion: '',
  plagascontrolorganico: ''
};

export default function PlagaForm({ plagaId, userEmail, onClose }: PlagaFormProps) {
  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'no-changes'>('idle');

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);

  useEffect(() => {
    if (plagaId) {
      fetchPlaga();
    }
  }, [plagaId]);

  const fetchPlaga = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/plagas`, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        const plaga = data.plagas?.find((p: any) => p.idplagas.toString() === plagaId);
        if (plaga) {
          const loadedData = {
            plagasnombre: plaga.plagasnombre || '',
            plagasnombrecientifico: plaga.plagasnombrecientifico || '',
            plagastipo: plaga.plagastipo || 'insecto',
            plagasdescripcion: plaga.plagasdescripcion || '',
            plagascontrolorganico: plaga.plagascontrolorganico || ''
          };
          setFormData(loadedData);
          setInitialData(loadedData);
        }
      }
    } catch (error) {
      console.error('Error fetching plaga:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    setSaveStatus('idle');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isDirty && saveStatus !== 'saving') {
      setSaveStatus('no-changes');
      setTimeout(onClose, 800);
      return;
    }

    setSaveStatus('saving');
    try {
      const url = plagaId ? `/api/admin/plagas/${plagaId}` : '/api/admin/plagas';
      const method = plagaId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setInitialData(formData);
        setSaveStatus('idle');
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'Error al guardar');
        setSaveStatus('idle');
      }
    } catch (error) {
      console.error('Error saving plaga:', error);
      alert('Error de conexión');
      setSaveStatus('idle');
    }
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#1e293b' }}>
          {plagaId ? 'Editar Plaga/Enfermedad' : 'Nueva Plaga/Enfermedad'}
        </h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Cargando datos...</div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre Común *</label>
              <input 
                type="text" name="plagasnombre" required
                value={formData.plagasnombre} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                placeholder="Ej: Pulgón Verde"
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Nombre Científico</label>
              <input 
                type="text" name="plagasnombrecientifico" 
                value={formData.plagasnombrecientifico} onChange={handleChange}
                style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', fontStyle: 'italic' }}
                placeholder="Ej: Myzus persicae"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Tipo de Amenaza</label>
            <select 
              name="plagastipo" value={formData.plagastipo} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
            >
              <option value="insecto">Insecto / Ácaro</option>
              <option value="hongo">Hongo</option>
              <option value="bacteria">Bacteria</option>
              <option value="virus">Virus</option>
              <option value="mamifero">Mamífero / Ave</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Descripción / Cómo Detectarlo</label>
            <textarea 
              name="plagasdescripcion" rows={3}
              value={formData.plagasdescripcion} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Aparecen colonias en los brotes tiernos..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Control Ecológico Recomendado</label>
            <textarea 
              name="plagascontrolorganico" rows={3}
              value={formData.plagascontrolorganico} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Aplicar jabón potásico al 2% al atardecer..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600' }}>
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={saveStatus === 'saving'}
              style={{ 
                padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', color: 'white',
                background: saveStatus === 'no-changes' ? '#10b981' : saveStatus === 'saving' ? '#94a3b8' : '#3b82f6',
                transition: 'all 0.2s'
              }}>
              {saveStatus === 'no-changes' ? '✓ Sin cambios' : saveStatus === 'saving' ? 'Guardando...' : 'Guardar Plaga'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
