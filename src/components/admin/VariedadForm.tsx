'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import VariedadMediaManager from './VariedadMediaManager';
import './EspecieForm.css';

interface VariedadFormProps {
  variedadId: string | null;
}

export default function VariedadForm({ variedadId }: VariedadFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const especieIdQuery = searchParams.get('especieId');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [especies, setEspecies] = useState<any[]>([]);
  const [genericData, setGenericData] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState('basicos');

  const [formData, setFormData] = useState<any>({
    variedadesnombre: '',
    xvariedadesidespecies: especieIdQuery || '',
    variedadesdescripcion: '',
    variedadestamano: 'mediano',
    variedadesdiasgerminacion: '',
    variedadesviabilidadsemilla: '',
    variedadesdiashastafructificacion: '',
    variedadesdiashastatrasplante: '',
    variedadesdiashastarecoleccion: '',
    variedadestemperaturaminima: '',
    variedadestemperaturaoptima: '',
    variedadestemperaturamaxima: '',
    variedadesmarcoplantas: '',
    variedadesmarcofilas: '',
    variedadesprofundidadsiembra: '',
    variedadesprofundidadtrasplante: '',
    variedadessemillerodesde: '',
    variedadessemillerohasta: '',
    variedadessiembradirectadesde: '',
    variedadessiembradirectahasta: '',
    variedadestrasplantedesde: '',
    variedadestrasplantehasta: '',
    variedadesrecolecciondesde: '',
    variedadesrecoleccionhasta: '',
    variedadesvisibilidadsino: 1,
    variedadesautosuficiencia: '',
    variedadesautosuficienciaparcial: '',
    variedadesautosuficienciaconserva: '',
    variedadesicono: '',
    variedadesphsuelo: '',
    variedadesnecesidadriego: '',
    variedadestiposiembra: '',
    variedadesvolumenmaceta: '',
    variedadesluzsolar: '',
    variedadescaracteristicassuelo: '',
    variedadesdificultad: '',
    variedadeshistoria: ''
  });

  const [originalData, setOriginalData] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'no-changes'>('idle');

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
    if (userEmail) {
      loadMasterData();
      if (variedadId) {
        loadVariedad();
      } else {
        setLoading(false);
        const initData = { ...formData, xvariedadesidespecies: especieIdQuery || '' };
        setFormData(initData);
        setOriginalData(initData);
      }
    }
  }, [userEmail, variedadId]);

  useEffect(() => {
    if (formData.xvariedadesidespecies && userEmail) {
      loadGenericData(formData.xvariedadesidespecies);
    } else {
      setGenericData(null);
    }
  }, [formData.xvariedadesidespecies, userEmail]);

  useEffect(() => {
    if (originalData) {
      const isDifferent = JSON.stringify(formData) !== JSON.stringify(originalData);
      setHasChanges(isDifferent);
    }
  }, [formData, originalData]);

  const loadMasterData = async () => {
    try {
      const res = await fetch('/api/admin/especies', { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      setEspecies(data.especies || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadGenericData = async (especieId: string) => {
    try {
      const res = await fetch(`/api/admin/variedades/generica/${especieId}`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      setGenericData(data.generica || null);
    } catch (e) {
      console.error('Error cargando variedad genérica', e);
    }
  };

  const loadVariedad = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/variedades/${variedadId}`, { headers: { 'x-user-email': userEmail! } });
      const data = await res.json();
      if (data.variedad) {
        setFormData(data.variedad);
        setOriginalData(data.variedad);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked ? 1 : 0 : value
    }));
  };

  const handleBlurSave = () => {
    if (saveStatus === 'idle' || saveStatus === 'saved') {
      if (JSON.stringify(formData) === JSON.stringify(originalData)) {
        setSaveStatus('no-changes');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }
  };

  const saveVariedad = async () => {
    if (!hasChanges) {
      setSaveStatus('no-changes');
      setTimeout(() => setSaveStatus('idle'), 2000);
      return;
    }
    
    setSaveStatus('saving');
    try {
      const method = variedadId ? 'PUT' : 'POST';
      const url = variedadId ? `/api/admin/variedades/${variedadId}` : '/api/admin/variedades';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        setOriginalData({ ...formData });
        setHasChanges(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        if (!variedadId) {
          router.push(`/dashboard/admin/variedades/${data.id}`);
        }
      } else {
        alert(data.error || 'Error al guardar');
        setSaveStatus('idle');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar la variedad.');
      setSaveStatus('idle');
    }
  };

  const FieldCompare = ({ label, field, type = 'number', width = '100%' }: { label: string, field: string, type?: string, width?: string }) => {
    const isDifferent = genericData && genericData[field] !== formData[field] && formData[field] !== '' && formData[field] !== null;

    return (
      <div className="form-group" style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>{label}</label>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Valor Especie Base */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type={type} 
              value={genericData ? (genericData[field] || '') : ''} 
              disabled 
              style={{ width, padding: '10px', borderRadius: '8px', border: '1px dashed #cbd5e1', background: '#f8fafc', color: '#94a3b8', fontSize: '0.9rem' }}
            />
            {genericData && <span style={{ position: 'absolute', top: '-10px', right: '10px', background: '#e2e8f0', color: '#64748b', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Estándar Especie</span>}
          </div>

          <div style={{ color: '#cbd5e1', fontSize: '1.2rem' }}>➡️</div>

          {/* Valor Variedad Editada */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input 
              type={type} 
              name={field}
              value={formData[field] || ''} 
              onChange={handleChange} 
              onBlur={handleBlurSave}
              placeholder="Hereda del estándar"
              style={{ width, padding: '10px', borderRadius: '8px', border: isDifferent ? '1px solid #7c3aed' : '1px solid #cbd5e1', background: isDifferent ? '#f5f3ff' : 'white', fontWeight: isDifferent ? 'bold' : 'normal', color: '#0f172a' }}
            />
            {isDifferent && <span style={{ position: 'absolute', top: '-10px', right: '10px', background: '#7c3aed', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Sobrescrito</span>}
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando variedad...</div>;

  return (
    <>
      <div style={{ marginBottom: '16px', padding: '0 4px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
        <button type="button" onClick={() => router.push('/dashboard/admin/variedades')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🧬 Volver a Variedades
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <form style={{ flex: 1, background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', position: 'relative' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {variedadId ? '🧬 Editar Sub-Variedad' : '🧬 Nueva Sub-Variedad'}
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                type="button" 
                onClick={saveVariedad} 
                className={`btn-primary ${saveStatus === 'no-changes' ? 'success' : ''}`}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? '⏳ Guardando...' : saveStatus === 'no-changes' ? '✓ Sin cambios' : '💾 Guardar Variedad'}
              </button>
            </div>
          </div>

          <div className="form-tabs">
            <button type="button" className={activeTab === 'basicos' ? 'active' : ''} onClick={() => setActiveTab('basicos')}>📋 Datos Básicos</button>
            <button type="button" className={activeTab === 'fisiologia' ? 'active' : ''} onClick={() => setActiveTab('fisiologia')}>🌱 Fisiología</button>
            <button type="button" className={activeTab === 'calendarios' ? 'active' : ''} onClick={() => setActiveTab('calendarios')}>📅 Calendarios</button>
            <button type="button" className={activeTab === 'autosuficiencia' ? 'active' : ''} onClick={() => setActiveTab('autosuficiencia')}>⚖️ Autosuficiencia</button>
            <button type="button" className={activeTab === 'adjuntos' ? 'active' : ''} onClick={() => setActiveTab('adjuntos')}>📎 Adjuntos</button>
          </div>

          <div className="form-tab-content">
            
            {activeTab === 'basicos' && (
              <div className="grid-form">
                <div className="form-group full">
                  <label>Nombre de la Variedad *</label>
                  <input type="text" name="variedadesnombre" required value={formData.variedadesnombre} onChange={handleChange} onBlur={handleBlurSave} />
                </div>
                <div className="form-group">
                  <label>Especie Padre (Gold Standard) *</label>
                  <select name="xvariedadesidespecies" required value={formData.xvariedadesidespecies} onChange={handleChange} onBlur={handleBlurSave} style={{ border: '1px solid #7c3aed', background: '#f5f3ff', fontWeight: 'bold' }}>
                    <option value="">Selecciona la especie madre...</option>
                    {especies.map(e => <option key={e.idespecies} value={e.idespecies}>{e.especiesnombre}</option>)}
                  </select>
                  {genericData && <p style={{ margin: '6px 0 0', fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>✓ Conectado a {genericData.especiesnombre}</p>}
                </div>
                <div className="form-group">
                  <label>Tamaño General</label>
                  <select name="variedadestamano" value={formData.variedadestamano} onChange={handleChange} onBlur={handleBlurSave}>
                    <option value="pequeno">Pequeño</option>
                    <option value="mediano">Mediano</option>
                    <option value="grande">Grande</option>
                  </select>
                </div>
                <div className="form-group full">
                  <label>Descripción y Notas</label>
                  <textarea name="variedadesdescripcion" rows={4} value={formData.variedadesdescripcion} onChange={handleChange} onBlur={handleBlurSave} />
                </div>
              </div>
            )}

            {activeTab === 'fisiologia' && (
              <div className="grid-form" style={{ maxWidth: '800px', gridTemplateColumns: '1fr' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>Compara y sobrescribe los valores genéricos de la especie padre. Si dejas un campo vacío, la variedad utilizará el valor estándar.</p>
                <FieldCompare label="Días a Germinación" field="variedadesdiasgerminacion" type="number" />
                <FieldCompare label="Días a Trasplante" field="variedadesdiashastatrasplante" type="number" />
                <FieldCompare label="Días a Primer Fruto" field="variedadesdiashastafructificacion" type="number" />
                <FieldCompare label="Días a Recolección Final" field="variedadesdiashastarecoleccion" type="number" />
              </div>
            )}

            {activeTab === 'calendarios' && (
              <div className="grid-form" style={{ maxWidth: '800px', gridTemplateColumns: '1fr' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '15px' }}>Meses recomendados (1 = Enero, 12 = Diciembre).</p>
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px', color: '#0f766e', fontSize: '1rem' }}>Siembra Semillero</h3>
                  <FieldCompare label="Mes Inicio" field="variedadessemillerodesde" type="number" />
                  <FieldCompare label="Mes Fin" field="variedadessemillerohasta" type="number" />
                </div>
                <div style={{ background: '#fdf4ff', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #fbcfe8' }}>
                  <h3 style={{ margin: '0 0 16px', color: '#be185d', fontSize: '1rem' }}>Siembra Directa</h3>
                  <FieldCompare label="Mes Inicio" field="variedadessiembradirectadesde" type="number" />
                  <FieldCompare label="Mes Fin" field="variedadessiembradirectahasta" type="number" />
                </div>
                <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                  <h3 style={{ margin: '0 0 16px', color: '#1d4ed8', fontSize: '1rem' }}>Recolección</h3>
                  <FieldCompare label="Mes Inicio" field="variedadesrecolecciondesde" type="number" />
                  <FieldCompare label="Mes Fin" field="variedadesrecoleccionhasta" type="number" />
                </div>
              </div>
            )}

            {activeTab === 'autosuficiencia' && (
              <div className="grid-form" style={{ maxWidth: '800px', gridTemplateColumns: '1fr' }}>
                <FieldCompare label="Plantas para Autosuficiencia Completa (por persona)" field="variedadesautosuficiencia" type="number" />
                <FieldCompare label="Plantas para Consumo Parcial (por persona)" field="variedadesautosuficienciaparcial" type="number" />
                <FieldCompare label="Plantas para Conserva (por persona)" field="variedadesautosuficienciaconserva" type="number" />
              </div>
            )}

            {activeTab === 'adjuntos' && (
              <div className="grid-form">
                <VariedadMediaManager 
                  variedadId={variedadId!} 
                  userEmail={userEmail!} 
                  variedadNombre={formData.variedadesnombre}
                  especieNombre={especies.find(e => e.idespecies == formData.xvariedadesidespecies)?.especiesnombre || genericData?.especiesnombre || 'Especie'}
                />
              </div>
            )}

          </div>
        </form>
      </div>
    </>
  );
}
