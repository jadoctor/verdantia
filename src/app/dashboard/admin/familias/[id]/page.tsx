'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

interface Familia {
  idfamilias: number;
  familiasnombre: string;
  familiasnombrecientifico: string | null;
  familiasgruporotacion: string;
  familiasanosdescanso: number;
  familiascolor: string;
  familiasemoji: string;
  familiasnotas: string | null;
  familiasprecedentes: number[] | null;
  familiassucesores: number[] | null;
  familiasactivosino: number;
  familiasdescripcion?: string | null;
}

interface FamiliaMin {
  idfamilias: number;
  familiasnombre: string;
  familiasgruporotacion: string;
  familiasemoji: string;
  familiascolor: string;
}

interface Especie {
  idespecies: number;
  especiesnombre: string;
  especiesicono: string;
  especiesvisibilidadsino: number;
}

export default function EditarFamiliaPage() {
  const router = useRouter();
  const params = useParams();
  const familiaId = params.id as string;

  const [familia, setFamilia] = useState<Familia | null>(null);
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [todasFamilias, setTodasFamilias] = useState<FamiliaMin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalType, setAiModalType] = useState<'rotacion' | 'general'>('rotacion');
  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiExtraInstructions, setAiExtraInstructions] = useState('');
  const [aiSeconds, setAiSeconds] = useState(0);
  const [aiProposals, setAiProposals] = useState<any>(null);
  const [aiAcceptedFields, setAiAcceptedFields] = useState<Record<string, boolean>>({});
  const [aiArraySelections, setAiArraySelections] = useState<Record<string, string[]>>({});
  const [activeTab, setActiveTab] = useState<string>('datos');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef(false);

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

  const fetchFamilia = useCallback(async () => {
    if (!userEmail) return;
    try {
      const res = await fetch(`/api/admin/familias/${familiaId}`, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setFamilia(data.familia);
        setEspecies(data.especies || []);
        setTodasFamilias(data.todasFamilias || []);
      }
    } catch (err) {
      console.error('Error fetching familia:', err);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [familiaId, userEmail]);

  useEffect(() => { if (userEmail) fetchFamilia(); }, [fetchFamilia, userEmail]);

  // ═══ Auto-Save con debounce (Regla 8) ═══
  const autoSave = useCallback(async (data: Partial<Familia>) => {
    if (!hasLoadedRef.current || !userEmail) return;
    setSaveStatus('saving');
    try {
      const res = await fetch(`/api/admin/familias/${familiaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [familiaId, userEmail]);

  const handleChange = (field: string, value: any) => {
    setFamilia(prev => {
      if (!prev) return prev;
      const updated = { ...prev, [field]: value };

      // Debounce auto-save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        autoSave(updated);
      }, 800);

      return updated;
    });
  };

  const toggleRotacion = (campo: 'familiasprecedentes' | 'familiassucesores', id: number) => {
    setFamilia(prev => {
      if (!prev) return prev;
      let arrayActual: any = prev[campo] || [];
      if (typeof arrayActual === 'string') {
        arrayActual = arrayActual.replace(/[\[\]"]/g, '').split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
      } else if (!Array.isArray(arrayActual)) {
        arrayActual = [arrayActual];
      }
      
      let nuevoArray;
      if (arrayActual.includes(id)) {
        nuevoArray = arrayActual.filter((val: number) => val !== id);
      } else {
        nuevoArray = [...arrayActual, id];
      }

      const updated = { ...prev, [campo]: nuevoArray };
      
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        autoSave(updated);
      }, 800);

      return updated;
    });
  };

  const renderSelectores = (campo: 'familiasprecedentes' | 'familiassucesores', titulo: string, descripcion: string) => {
    if (!familia) return null;
    let seleccionados: any = familia[campo] || [];
    if (typeof seleccionados === 'string') {
      seleccionados = seleccionados.replace(/[\[\]"]/g, '').split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
    } else if (!Array.isArray(seleccionados)) {
      seleccionados = [seleccionados];
    }

    return (
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '4px' }}>{titulo}</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px' }}>{descripcion}</p>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {todasFamilias.filter(f => f.idfamilias !== familia.idfamilias).map(f => {
            const isSelected = seleccionados.includes(f.idfamilias);
            return (
              <button
                key={f.idfamilias}
                onClick={() => toggleRotacion(campo, f.idfamilias)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px',
                  borderRadius: '20px', border: `1px solid ${isSelected ? f.familiascolor : '#e2e8f0'}`,
                  background: isSelected ? `${f.familiascolor}15` : 'white',
                  color: isSelected ? '#0f172a' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.2s',
                  fontWeight: isSelected ? 600 : 400,
                  boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  fontSize: '0.85rem'
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{f.familiasemoji}</span>
                {f.familiasnombre}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleAIAssist = async () => {
    if (!familia || !userEmail) return;
    setIsAILoading(true);
    setAiError(null);
    setAiSeconds(0);
    const intervalId = setInterval(() => setAiSeconds(s => s + 1), 1000);
    try {
      const endpoint = aiModalType === 'general' ? '/api/ai/familia-general-assistant' : '/api/ai/familia-assistant';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({ nombre: familia.familiasnombre, customPrompt: aiExtraInstructions })
      });
      clearInterval(intervalId);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error AI');
      
      setAiProposals(json.data);
      
      if (aiModalType === 'general') {
        setAiAcceptedFields({
          familiasnombrecientifico: true,
          familiasgruporotacion: true,
          familiasanosdescanso: true,
          familiasemoji: true,
          familiascolor: true,
          familiasdescripcion: true
        });
        setAiArraySelections({});
      } else {
        setAiAcceptedFields({
          familiasanosdescanso: true,
          familiasnotas: true
        });
        setAiArraySelections({
          familiasprecedentes: (json.data.familiasprecedentes || []).map(String),
          familiassucesores: (json.data.familiassucesores || []).map(String)
        });
      }
    } catch (e: any) {
      clearInterval(intervalId);
      setAiError(e.message);
    } finally {
      setIsAILoading(false);
    }
  };

  const applyAIProposals = () => {
    if (!familia || !aiProposals) return;
    const newFamilia = { ...familia };
    Object.keys(aiAcceptedFields).forEach(key => {
      if (aiAcceptedFields[key] && aiProposals[key] !== undefined) {
        (newFamilia as any)[key] = aiProposals[key];
      }
    });
    // Apply array selections
    newFamilia.familiasprecedentes = aiArraySelections['familiasprecedentes'] ? aiArraySelections['familiasprecedentes'].map(Number) : newFamilia.familiasprecedentes;
    newFamilia.familiassucesores = aiArraySelections['familiassucesores'] ? aiArraySelections['familiassucesores'].map(Number) : newFamilia.familiassucesores;

    setFamilia(newFamilia);
    autoSave(newFamilia);
    setActiveTab(aiModalType === 'general' ? 'datos' : 'rotacion');
    setShowAiModal(false);
  };

  const renderAiDiff = (key: string, label: string) => {
    const isSelected = !!aiAcceptedFields[key];
    const toggle = () => setAiAcceptedFields(prev => ({ ...prev, [key]: !prev[key] }));
    const oldValue = familia?.[key as keyof Familia];
    const newValue = aiProposals?.[key];

    let oldDisplay = oldValue;
    let newDisplay = newValue;

    const isMatching = String(oldDisplay) === String(newDisplay);

    const renderValue = (val: any) => {
      if (key === 'familiascolor') {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: String(val || '#000'), border: '1px solid #cbd5e1' }} />
            <span>{String(val || 'Vacío')}</span>
          </div>
        );
      }
      if (key === 'familiasemoji') {
        return <span style={{ fontSize: '1.5rem' }}>{String(val || '❓')}</span>;
      }
      return <span style={{ whiteSpace: 'pre-wrap' }}>{String(val || 'Vacío')}</span>;
    };

    return (
      <div style={{ padding: '12px', background: isSelected ? '#f0fdf4' : 'white', border: `1px solid ${isSelected ? '#86efac' : '#e2e8f0'}`, borderRadius: '8px', marginBottom: '8px', display: 'flex', alignItems: 'stretch', gap: '12px', cursor: 'pointer', transition: 'all 0.2s' }} onClick={toggle}>
        <div style={{ flex: 1 }}>
          <strong style={{ display: 'block', fontSize: '0.95rem', color: '#1e293b', marginBottom: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>{label}</strong>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#fff1f2', padding: '10px', borderRadius: '6px', border: '1px solid #fecdd3' }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: '#be123c', marginBottom: '6px', textTransform: 'uppercase' }}>Actual</span>
              <div style={{ fontSize: '0.85rem', color: '#881337', lineHeight: '1.4' }}>{renderValue(oldDisplay)}</div>
            </div>
            
            <div style={{ background: isMatching ? '#f8fafc' : '#f0fdf4', padding: '10px', borderRadius: '6px', border: `1px solid ${isMatching ? '#e2e8f0' : '#bbf7d0'}` }}>
              <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'bold', color: isMatching ? '#64748b' : '#15803d', marginBottom: '6px', textTransform: 'uppercase' }}>Propuesta IA {isMatching && '(Coincide)'}</span>
              <div style={{ fontSize: '0.85rem', color: isMatching ? '#475569' : '#166534', lineHeight: '1.4', fontWeight: isMatching ? 'normal' : '500' }}>{renderValue(newDisplay)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #e2e8f0', paddingLeft: '16px', minWidth: '90px' }}>
           <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: isSelected ? '#166534' : '#64748b', marginBottom: '8px' }}>{isSelected ? '✅ APLICAR' : '❌ IGNORAR'}</span>
           <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer', transform: 'scale(1.3)' }} />
        </div>
      </div>
    );
  };

  const renderAiArrayDiff = (key: 'familiasprecedentes' | 'familiassucesores', label: string) => {
    const oldArr = familia?.[key] ? String(familia[key]).replace(/[\[\]"]/g, '').split(',').map(s=>s.trim()).filter(Boolean) : [];
    const newArr = (aiProposals?.[key] || []).map(String);
    const allIds = Array.from(new Set([...oldArr, ...newArr]));

    if (allIds.length === 0) return null;

    const allSelected = allIds.length > 0 && allIds.every(id => aiArraySelections[key]?.includes(id));
    const toggleAll = () => {
      setAiArraySelections(prev => {
        return { ...prev, [key]: allSelected ? [] : [...allIds] };
      });
    };

    return (
      <div style={{ padding: '16px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '12px' }}>
          <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>{label}</strong>
          <button type="button" onClick={toggleAll} style={{ fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '4px 8px', color: '#475569', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}>
            {allSelected ? '➖ Desmarcar Grupo' : '➕ Seleccionar Grupo'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {allIds.map(id => {
            const isOld = oldArr.includes(id);
            const isNew = newArr.includes(id);
            const isSelected = aiArraySelections[key]?.includes(id);
            const name = todasFamilias.find(f => String(f.idfamilias) === id)?.familiasnombre || id;

            const toggle = () => {
              setAiArraySelections(prev => {
                const current = prev[key] || [];
                return { ...prev, [key]: current.includes(id) ? current.filter(x => x !== id) : [...current, id] };
              });
            };

            let statusBadge = null;
            if (isOld && isNew) statusBadge = <span style={{ fontSize: '0.7rem', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>COINCIDE</span>;
            else if (isNew && !isOld) statusBadge = <span style={{ fontSize: '0.7rem', background: '#dcfce7', color: '#166534', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>NUEVO DE IA</span>;
            else if (isOld && !isNew) statusBadge = <span style={{ fontSize: '0.7rem', background: '#ffe4e6', color: '#be123c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>IA SUGIERE ELIMINAR</span>;

            let actionLabel = null;
            if (isOld && isNew) {
              actionLabel = isSelected ? <span style={{ color: '#166534', fontWeight: 'bold' }}>✅ Mantener</span> : <span style={{ color: '#be123c', fontWeight: 'bold' }}>❌ Quitar</span>;
            } else if (isNew && !isOld) {
              actionLabel = isSelected ? <span style={{ color: '#166534', fontWeight: 'bold' }}>✨ Añadir</span> : <span style={{ color: '#64748b', fontWeight: 'bold' }}>❌ Ignorar</span>;
            } else if (isOld && !isNew) {
              actionLabel = isSelected ? <span style={{ color: '#ca8a04', fontWeight: 'bold' }}>⚠️ Mantener</span> : <span style={{ color: '#be123c', fontWeight: 'bold' }}>🗑️ Borrar</span>;
            }

            return (
              <div key={id} onClick={toggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: isSelected ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isSelected ? '#86efac' : '#e2e8f0'}`, borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.95rem', color: isSelected ? '#166534' : '#475569', fontWeight: isSelected ? '600' : 'normal', minWidth: '120px' }}>{name}</span>
                  {statusBadge}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ fontSize: '0.85rem', width: '90px', textAlign: 'right' }}>{actionLabel}</span>
                  <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#059669', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!familia) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Familia no encontrada</div>;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db',
    fontSize: '0.9rem', transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: '4px', display: 'block',
  };

  return (
    <div style={{ width: '100%', padding: '0' }}>
      {/* ═══ Navegación Jerárquica Superior (Regla 8) ═══ */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <button onClick={() => router.push('/dashboard')}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          🏠 Volver al Inicio
        </button>
        <button onClick={() => router.push('/dashboard/admin/familias')}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
          🔙 Volver a Familias
        </button>
      </div>

      {/* ═══ Subheader Contextual + Autoguardado (Regla 8) ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #059669, #10b981)',
        padding: '20px 28px',
        color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {familia.familiasemoji} Editando: {familia.familiasnombre}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: saveStatus === 'saving' ? 'rgba(255,255,255,0.2)' : saveStatus === 'saved' ? 'rgba(255,255,255,0.3)' : saveStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'transparent',
            padding: '6px 14px', borderRadius: '20px', transition: 'all 0.3s',
            fontSize: '0.8rem', fontWeight: 600,
          }}>
            {saveStatus === 'saving' && '⏳ Guardando...'}
            {saveStatus === 'saved' && '✅ Guardado'}
            {saveStatus === 'error' && '❌ Error al guardar'}
            {saveStatus === 'idle' && <span style={{ opacity: 0.7 }}>💾 Auto-Save</span>}
          </div>
        </div>
      </div>

      {/* ═══ Action Bar Global ═══ */}
      <div style={{ padding: '16px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => setShowCheckModal(true)}
          style={{
            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
            color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold',
            height: '38px', padding: '0 16px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          🔍 Chekeo
        </button>
      </div>

      {/* ═══ Pestañas (Regla 8: controladas por CSS, NO condicional React) ═══ */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid #e2e8f0', padding: '0 20px', background: '#fafafa' }}>
        {[
          { key: 'datos', label: '📋 Datos Generales' },
          { key: 'rotacion', label: '🔄 Rotación' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '12px 20px', border: 'none', cursor: 'pointer', fontWeight: 600,
              fontSize: '0.85rem', transition: 'all 0.2s', background: 'transparent',
              borderBottom: activeTab === tab.key ? '3px solid #059669' : '3px solid transparent',
              color: activeTab === tab.key ? '#059669' : '#64748b',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ Contenido pestañas (Regla 8: TODAS renderizadas, display CSS) ═══ */}
      <div style={{ padding: '24px 20px' }}>

        {/* TAB: Datos Generales */}
        <div style={{ display: activeTab === 'datos' ? 'block' : 'none' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setAiModalType('general'); setShowAiModal(true); setAiProposals(null); setAiExtraInstructions(''); }}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold',
                  height: '38px', padding: '0 16px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                ✨ Asistente IA
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Nombre de la Familia *</label>
                <input type="text" value={familia.familiasnombre || ''} onChange={e => handleChange('familiasnombre', e.target.value)}
                  style={inputStyle} placeholder="Solanáceas" />
              </div>
              <div>
                <label style={labelStyle}>Nombre Científico</label>
                <input type="text" value={familia.familiasnombrecientifico || ''} onChange={e => handleChange('familiasnombrecientifico', e.target.value)}
                  style={{ ...inputStyle, fontStyle: 'italic' }} placeholder="Solanaceae" />
              </div>
              <div>
                <label style={labelStyle}>Grupo de Rotación *</label>
                <input type="text" value={familia.familiasgruporotacion || ''} onChange={e => handleChange('familiasgruporotacion', e.target.value)}
                  style={inputStyle} placeholder="solanaceas" />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Clave que agrupa familias para la rotación</span>
              </div>
              <div>
                <label style={labelStyle}>Años de Descanso</label>
                <input type="number" value={familia.familiasanosdescanso ?? 3} onChange={e => handleChange('familiasanosdescanso', parseInt(e.target.value) || 3)}
                  min="1" max="10" style={inputStyle} />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Años mínimos antes de repetir en el mismo bancal</span>
              </div>
              <div>
                <label style={labelStyle}>Emoji Representativo</label>
                <input type="text" value={familia.familiasemoji || ''} onChange={e => handleChange('familiasemoji', e.target.value)}
                  maxLength={4} style={{ ...inputStyle, fontSize: '1.5rem', textAlign: 'center', width: '80px' }} />
              </div>
              <div>
                <label style={labelStyle}>Color Identificativo</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="color" value={familia.familiascolor || '#64748b'} onChange={e => handleChange('familiascolor', e.target.value)}
                    style={{ width: '48px', height: '38px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>{familia.familiascolor}</span>
                  <div style={{ width: '60px', height: '24px', borderRadius: '12px', background: familia.familiascolor, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={labelStyle}>Descripción e Información General</label>
              <textarea value={familia.familiasdescripcion || ''} onChange={e => handleChange('familiasdescripcion', e.target.value)}
                rows={4} placeholder="Descripción botánica, características generales del grupo, clima ideal..."
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

            {/* Especies Asociadas a continuación */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#374151', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🌍 Especies Asociadas ({especies.length})
              </h3>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {especies.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🌿</div>
                    <p style={{ fontSize: '1rem' }}>No hay especies asignadas a esta familia</p>
                    <p style={{ fontSize: '0.85rem' }}>Puedes asignar especies desde el formulario de edición de cada especie</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700 }}>Icono</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700 }}>Especie</th>
                          <th style={{ padding: '10px 16px', textAlign: 'center', fontWeight: 700 }}>Estado</th>
                          <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {especies.map((esp, idx) => (
                          <tr key={esp.idespecies} style={{ background: idx % 2 === 0 ? 'white' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px', fontSize: '1.3rem' }}>{esp.especiesicono || '🌱'}</td>
                            <td style={{ padding: '10px 16px', fontWeight: 600 }}>{esp.especiesnombre}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600,
                                background: esp.especiesvisibilidadsino === 1 ? '#d1fae5' : '#fee2e2',
                                color: esp.especiesvisibilidadsino === 1 ? '#065f46' : '#991b1b',
                              }}>
                                {esp.especiesvisibilidadsino === 1 ? 'Visible' : 'Oculta'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                              <button onClick={() => router.push(`/dashboard/admin/especies/${esp.idespecies}`)}
                                style={{ padding: '5px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                              >
                                ✏️ Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TAB: Rotación (Recomendaciones) */}
        <div style={{ display: activeTab === 'rotacion' ? 'block' : 'none' }}>
          <div style={{ background: 'white', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            
            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={() => { setAiModalType('rotacion'); setShowAiModal(true); setAiPromptOpen(false); setAiProposals(null); setAiExtraInstructions(''); }}
                disabled={isAILoading}
                style={{ 
                  height: '38px',
                  padding: '0 16px', 
                  background: isAILoading ? 'linear-gradient(135deg, #475569, #1e293b)' : 'linear-gradient(135deg, #8b5cf6, #6d28d9)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  cursor: isAILoading ? 'not-allowed' : 'pointer', 
                  fontSize: '0.9rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(109, 40, 217, 0.2)',
                  flexShrink: 0
                }}
              >
                {isAILoading ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                    Pensando...
                  </>
                ) : (
                  <>✨ Asistente IA Rotaciones</>
                )}
              </button>
              {aiError && <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{aiError}</span>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '2.5rem', background: '#f0fdf4', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px' }}>🔄</div>
              <div>
                <h2 style={{ margin: '0 0 4px', color: '#0f172a', fontSize: '1.3rem' }}>Motor de Recomendaciones de Rotación</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Define qué familias botánicas son beneficiosas antes o después de plantar <strong>{familia.familiasnombre}</strong>.</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px', alignItems: 'start' }}>
              <div>
                {renderSelectores('familiasprecedentes', '⬅️ Cultivos Precedentes', `¿Qué se recomienda plantar ANTES de ${familia.familiasnombre}?`)}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
                 <span style={{ fontSize: '3rem', marginBottom: '8px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>{familia.familiasemoji}</span>
                 <strong style={{ fontSize: '1.3rem', color: '#0f172a' }}>{familia.familiasnombre}</strong>
                 <span style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '8px', background: '#e2e8f0', padding: '4px 12px', borderRadius: '12px' }}>Grupo: {familia.familiasgruporotacion}</span>
                 <span style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px', background: '#e2e8f0', padding: '4px 12px', borderRadius: '12px' }}>Descanso: {familia.familiasanosdescanso} años</span>
              </div>

              <div>
                {renderSelectores('familiassucesores', '➡️ Cultivos Sucesores', `¿Qué se recomienda plantar DESPUÉS de ${familia.familiasnombre}?`)}
              </div>
            </div>

            {/* Notas de Rotación movidas a esta pestaña */}
            <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
              <label style={{ ...labelStyle, fontSize: '1rem', color: '#0f172a' }}>Notas sobre Rotación y Cultivo</label>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#64748b' }}>Anotaciones sobre rotación, plagas comunes o asociaciones favorables para esta familia.</p>
              <textarea value={familia.familiasnotas || ''} onChange={e => handleChange('familiasnotas', e.target.value)}
                rows={4} placeholder="Escribe aquí las notas..."
                style={{ ...inputStyle, resize: 'vertical' }} />
            </div>

          </div>
        </div>
      </div>

      {/* ── Asistente IA Config Modal (Regla 10) ── */}
      {showAiModal && (
        <div className="ai-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
          <div className="ai-modal-content" style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div className="ai-modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <h2 style={{ color: 'white', margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {aiModalType === 'general' ? '✨ Asistente IA Datos Generales' : '🌱 Asistente IA Rotaciones'}
              </h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {aiProposals ? (
                  <button
                    type="button"
                    onClick={applyAIProposals}
                    style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)', transition: 'all 0.2s' }}
                  >
                    ✅ Aplicar Selección
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isAILoading}
                    onClick={handleAIAssist}
                    style={{
                      padding: '8px 16px', background: isAILoading ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)',
                      color: 'white', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '8px', fontWeight: 'bold',
                      cursor: isAILoading ? 'not-allowed' : 'pointer', fontSize: '0.9rem', transition: 'all 0.2s'
                    }}
                  >
                    {isAILoading ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '1rem' }}>⏳</span>
                        Analizando... {aiSeconds}s
                      </span>
                    ) : '🚀 Analizar'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Cancelar
                </button>
              </div>
            </div>

            {aiProposals ? (
              <div className="ai-modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#0f172a' }}>Revisión de Propuestas</h3>
                <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: '#64748b' }}>La IA ha generado las siguientes sugerencias. Selecciona cuáles quieres aplicar.</p>
                {aiModalType === 'general' ? (
                  <>
                    {renderAiDiff('familiasnombrecientifico', 'Nombre Científico')}
                    {renderAiDiff('familiasgruporotacion', 'Grupo de Rotación')}
                    {renderAiDiff('familiasanosdescanso', 'Años de Descanso')}
                    {renderAiDiff('familiasemoji', 'Emoji Representativo')}
                    {renderAiDiff('familiascolor', 'Color Identificativo')}
                    {renderAiDiff('familiasdescripcion', 'Descripción e Información General')}
                  </>
                ) : (
                  <>
                    {renderAiDiff('familiasanosdescanso', 'Años de Descanso')}
                    {renderAiDiff('familiasnotas', 'Notas de Rotación')}
                    {renderAiArrayDiff('familiasprecedentes', 'Cultivos Precedentes (Selección Individual)')}
                    {renderAiArrayDiff('familiassucesores', 'Cultivos Sucesores (Selección Individual)')}
                  </>
                )}
                
              </div>
            ) : (
              <div className="ai-modal-body" style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: '#1e293b', fontSize: '1.05rem' }}>
                    {aiModalType === 'general' ? `Autocompletar datos para ` : `Generar rotaciones para `}
                    <span style={{ color: '#7c3aed' }}>"{familia?.familiasnombre}"</span>
                  </p>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
                    {aiModalType === 'general' ?
                      'La IA analizará la familia botánica y completará automáticamente sus datos taxonómicos, visuales y agronómicos descriptivos.' :
                      'La IA analizará la familia botánica y propondrá sus cultivos precedentes y sucesores ideales basándose en el consumo de nutrientes y susceptibilidad a plagas.'
                    }
                  </p>
                </div>

                {/* Prompt colapsable */}
                <div style={{ marginBottom: '20px', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setAiPromptOpen(!aiPromptOpen)}
                    style={{ width: '100%', padding: '10px 16px', background: '#f1f5f9', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '600', color: '#475569', fontSize: '0.9rem' }}
                  >
                    <span>📋 Instrucciones del Prompt (técnico)</span>
                    <span style={{ transform: aiPromptOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                  </button>
                  {aiPromptOpen && (
                    <div style={{ padding: '12px 16px', background: '#1e293b', color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace', maxHeight: '200px', overflowY: 'auto', lineHeight: '1.5' }}>
                      {aiModalType === 'general' ? 
                        'La IA recibirá el nombre de la familia actual. Su tarea será identificar el nombre científico, grupo de rotación, años de descanso, un emoji y color representativos, y una descripción enciclopédica detallada. Se le exigirá formato JSON estricto.' :
                        'La IA recibirá el nombre de la familia actual. Su tarea será identificar el grupo de rotación, el tiempo de descanso recomendado, y sugerir qué familias plantar antes y después. Se le exigirá formato JSON estricto.'
                      }
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: '0' }}>
                  <h4 style={{ margin: '0 0 8px', color: '#1e293b', fontSize: '1rem' }}>💬 Instrucciones extra para la IA</h4>
                  <textarea
                    value={aiExtraInstructions}
                    onChange={e => setAiExtraInstructions(e.target.value)}
                    placeholder="Ej. 'Asegúrate de incluir Leguminosas como cultivo precedente...'"
                    rows={4}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.5', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de Chequeo de Completado ── */}
      {showCheckModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', zIndex: 10500, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(12px) saturate(180%)' }} onClick={() => setShowCheckModal(false)}>
          <div style={{ background: 'white', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1) inset' }} onClick={e => e.stopPropagation()}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '24px 32px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ color: 'white', margin: 0, fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  📊 Estado de Completado
                </h2>
                <button type="button" onClick={() => setShowCheckModal(false)} style={{ color: 'white', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', opacity: 0.85, transition: 'opacity 0.2s' }}>✖</button>
              </div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
                Revisión de los campos obligatorios y recomendados de la familia <strong style={{ color: 'white' }}>{familia.familiasnombre}</strong>.
              </p>
            </div>

            <div style={{ padding: '32px', overflowY: 'auto', flex: 1, background: '#f8fafc' }}>
              {(() => {
                const parseArrayField = (val: any) => {
                  if (!val) return [];
                  if (Array.isArray(val)) return val;
                  if (typeof val === 'string') return val.replace(/[\[\]"]/g, '').split(',').filter(Boolean);
                  return [val];
                };

                const fields = [
                  { key: 'familiasnombrecientifico', label: 'Nombre Científico', group: 'Datos Generales', valid: !!familia.familiasnombrecientifico },
                  { key: 'familiasgruporotacion', label: 'Grupo de Rotación', group: 'Datos Generales', valid: !!familia.familiasgruporotacion },
                  { key: 'familiasanosdescanso', label: 'Años de Descanso', group: 'Datos Generales', valid: typeof familia.familiasanosdescanso === 'number' && familia.familiasanosdescanso > 0 },
                  { key: 'familiasemoji', label: 'Emoji Representativo', group: 'Datos Generales', valid: !!familia.familiasemoji },
                  { key: 'familiascolor', label: 'Color Identificativo', group: 'Datos Generales', valid: !!familia.familiascolor },
                  { key: 'familiasdescripcion', label: 'Descripción', group: 'Datos Generales', valid: !!familia.familiasdescripcion },
                  { key: 'familiasprecedentes', label: 'Cultivos Precedentes', group: 'Rotación', valid: parseArrayField(familia.familiasprecedentes).length > 0 },
                  { key: 'familiassucesores', label: 'Cultivos Sucesores', group: 'Rotación', valid: parseArrayField(familia.familiassucesores).length > 0 },
                  { key: 'familiasnotas', label: 'Notas de Rotación', group: 'Rotación', valid: !!familia.familiasnotas }
                ];
                
                const validCount = fields.filter(f => f.valid).length;
                const totalCount = fields.length;
                const percentage = Math.round((validCount / totalCount) * 100);
                
                const grouped = fields.reduce((acc, field) => {
                  if (!acc[field.group]) acc[field.group] = [];
                  acc[field.group].push(field);
                  return acc;
                }, {} as Record<string, typeof fields>);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: '12px' }}>
                        <div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completado General</span>
                          <div style={{ fontSize: '2rem', fontWeight: 800, color: percentage === 100 ? '#10b981' : '#f59e0b', lineHeight: 1 }}>{percentage}%</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>{validCount} de {totalCount} campos</span>
                        </div>
                      </div>
                      <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: percentage === 100 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', width: `${percentage}%`, transition: 'width 0.5s ease-out', borderRadius: '4px' }}></div>
                      </div>
                      {percentage === 100 && (
                        <div style={{ marginTop: '16px', padding: '12px', background: '#ecfdf5', color: '#047857', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🎉 ¡Familia completada al 100%! Excelente trabajo.
                        </div>
                      )}
                    </div>

                    {Object.entries(grouped).map(([groupName, groupFields]) => (
                      <div key={groupName}>
                        <h3 style={{ fontSize: '1.05rem', color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '16px' }}>{groupName}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                          {groupFields.map(field => (
                            <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: field.valid ? '#f0fdf4' : '#fff7ed', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${field.valid ? '#bbf7d0' : '#ffedd5'}` }}>
                              <span style={{ fontSize: '1.2rem' }}>{field.valid ? '✅' : '❌'}</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 500, color: field.valid ? '#166534' : '#9a3412' }}>{field.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            
            <div style={{ padding: '16px 32px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCheckModal(false)} style={{ padding: '10px 24px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
