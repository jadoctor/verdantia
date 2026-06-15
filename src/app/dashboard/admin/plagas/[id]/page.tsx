'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import VariedadMediaManager from '@/components/admin/VariedadMediaManager';

export default function EditarPlagaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [activeTab, setActiveTab] = useState('detalles');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Form State
  const defaultFormData = {
    plagasnombre: '',
    plagasnombrecientifico: '',
    plagastipo: 'insecto',
    plagasdescripcion: '',
    plagascontrolorganico: ''
  };
  const [formData, setFormData] = useState<any>(defaultFormData);
  const [initialData, setInitialData] = useState<any>(defaultFormData);
  const [loading, setLoading] = useState(true);

  // Debounce ref
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkResize = () => setIsMobile(window.innerWidth <= 768);
      checkResize();
      window.addEventListener('resize', checkResize);
      return () => window.removeEventListener('resize', checkResize);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        setAuthReady(true);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (authReady && userEmail) {
      if (resolvedParams.id !== 'nueva') {
        fetchPlaga();
      } else {
        setLoading(false);
      }
    }
  }, [authReady, userEmail, resolvedParams.id]);

  const fetchPlaga = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/plagas`, {
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        const data = await res.json();
        const plaga = data.plagas?.find((p: any) => p.idplagas.toString() === resolvedParams.id);
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

  const autoSave = async (dataToSave: any) => {
    setSaveStatus('saving');
    try {
      const url = resolvedParams.id !== 'nueva' ? `/api/admin/plagas/${resolvedParams.id}` : '/api/admin/plagas';
      const method = resolvedParams.id !== 'nueva' ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail || ''
        },
        body: JSON.stringify(dataToSave)
      });

      if (res.ok) {
        if (resolvedParams.id === 'nueva') {
          const data = await res.json();
          if (data.id) {
            router.replace(`/dashboard/admin/plagas/${data.id}`);
          }
        } else {
          setInitialData(dataToSave);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
      } else {
        setSaveStatus('idle');
        console.error('Error auto-guardando');
      }
    } catch (e) {
      setSaveStatus('idle');
      console.error(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };
    setFormData(newData);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(newData);
    }, 1200);
  };

  if (!authReady || loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🐛</div>
        <p>Cargando plaga...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', padding: isMobile ? '0' : '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Navegación Hierárquica */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', padding: isMobile ? '10px' : '0' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          🏠 Volver al Inicio
        </button>
        <button onClick={() => router.push('/dashboard/admin/plagas')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
          🔙 Volver a Plagas
        </button>
      </div>

      {/* Subheader Contextual y Autoguardado */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: isMobile ? '0' : '16px', padding: isMobile ? '20px' : '24px 28px', color: 'white', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 800 }}>
            🐛 {resolvedParams.id === 'nueva' ? 'Nueva Plaga' : formData.plagasnombre || 'Edición de Plaga'}
          </h1>
          <p style={{ margin: '4px 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Gestión de la ficha botánica de amenaza</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px' }}>
          {saveStatus === 'saving' && <span style={{ fontSize: '0.85rem', color: '#fbbf24', fontWeight: 'bold' }}>⏳ Guardando...</span>}
          {saveStatus === 'saved' && <span style={{ fontSize: '0.85rem', color: '#34d399', fontWeight: 'bold' }}>✅ Guardado</span>}
          {saveStatus === 'idle' && <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>✓ Al día</span>}
        </div>
      </div>

      {/* Botón Chequeo (Regla 18) - opcional si el sistema lo requiere, omitido por ahora si no aplica a plagas, pero se puede poner. Omitido porque no había validación previa, pero pondremos las Pestañas */}
      
      {/* Pestañas Controladas por CSS (Regla 8) */}
      <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', gap: '2px', overflowX: 'auto', padding: isMobile ? '0 10px' : '0' }}>
        <button onClick={() => setActiveTab('detalles')} style={{ padding: '12px 24px', background: activeTab === 'detalles' ? 'white' : '#f8fafc', border: '1px solid #e2e8f0', borderBottom: activeTab === 'detalles' ? '2px solid #3b82f6' : 'none', color: activeTab === 'detalles' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: 'bold', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
          📝 Detalles
        </button>
        <button onClick={() => setActiveTab('fotos')} style={{ padding: '12px 24px', background: activeTab === 'fotos' ? 'white' : '#f8fafc', border: '1px solid #e2e8f0', borderBottom: activeTab === 'fotos' ? '2px solid #3b82f6' : 'none', color: activeTab === 'fotos' ? '#3b82f6' : '#64748b', cursor: 'pointer', fontWeight: 'bold', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
          📷 Fotos
        </button>
      </div>

      {/* Contenido Pestañas (CSS display) */}
      <div style={{ background: 'white', borderRadius: isMobile ? '0' : '16px', padding: isMobile ? '16px' : '32px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: isMobile ? 'none' : '1px solid #e2e8f0' }}>
        
        {/* TAB 1: Detalles */}
        <div style={{ display: activeTab === 'detalles' ? 'block' : 'none' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Descripción / Cómo Detectarlo</label>
            <textarea 
              name="plagasdescripcion" rows={4}
              value={formData.plagasdescripcion} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Aparecen colonias en los brotes tiernos..."
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '600', color: '#475569' }}>Control Ecológico Recomendado</label>
            <textarea 
              name="plagascontrolorganico" rows={4}
              value={formData.plagascontrolorganico} onChange={handleChange}
              style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem', resize: 'vertical' }}
              placeholder="Ej: Aplicar jabón potásico al 2% al atardecer..."
            />
          </div>

        </div>

        {/* TAB 2: Fotos */}
        <div style={{ display: activeTab === 'fotos' ? 'block' : 'none' }}>
          {resolvedParams.id === 'nueva' ? (
            <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
              Guarda un nombre para la plaga primero antes de poder subir fotos.
            </div>
          ) : (
            <VariedadMediaManager 
              variedadId={resolvedParams.id} 
              userEmail={userEmail || ''} 
              variedadNombre={formData.plagasnombre}
              especieNombre="Plaga"
              apiBasePath={`/api/admin/plagas/${resolvedParams.id}`}
              section="photos"
            />
          )}
        </div>

      </div>
    </div>
  );
}
