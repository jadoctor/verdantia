'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { getMediaUrl } from '@/lib/media-url';
import IniciarCultivoModal from '@/components/user/IniciarCultivoModal';
import DashboardAlertsWidget from '@/components/user/DashboardAlertsWidget';
import { processAlertas } from '@/lib/alertas-utils';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { SeedWizardModal } from '@/components/SeedWizardModal';
import { PlantWizardModal } from '@/components/PlantWizardModal';

interface Planta {
  idvariedades: number;
  xvariedadesidvariedadorigen?: number;
  xvariedadesidespecies?: number;
  nombre: string;
  descripcion: string;
  icono: string;
  dificultad: string;
  especiesnombre: string;
  especiesicono: string;
  nombre_gold: string;
  es_generica: number;
  foto: string | null;
  campos_personalizados: number;
  cultivos_lista?: any;
  semillas_lista?: any;
  semillas_count?: number;
  semillas_colecciones?: string | null;
  variedadesvisibilidadsino?: number;
  origen_visibilidad?: number;
}

interface CatalogoEspecie {
  idespecies: number;
  especiesnombre: string;
  especiesnombrecientifico: string;
  especiesfamilia: string;
  especiestipo: string;
  especiesicono: string;
  especiesdescripcion: string;
  especiesdificultad: string;
  foto: string | null;
  total_variedades: number;
}

interface CatalogoVariedad {
  idvariedades: number;
  variedadesnombre: string;
  variedadesdescripcion: string;
  variedadesicono: string;
  variedadesesgenerica: number;
  variedadesdificultad: string;
  foto: string | null;
}

const FILTER_TAGS = [
  { id: 'all', label: '📋 Todas' },
  { id: 'activas', label: '✅ Activas' },
  { id: 'inactivas', label: '💤 Inactivas' },
  { id: 'has_cultivos', label: '🌱 Con Cultivos' },
  { id: 'has_semillas', label: '🎒 Con Semillas' },
  { id: 'dif_facil', label: '🟢 Fácil' },
  { id: 'dif_media', label: '🟡 Media' },
  { id: 'dif_dificil', label: '🔴 Difícil' }
];

export default function MisPlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [alertasHoy, setAlertasHoy] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Wizard state (now delegated to PlantWizardModal)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  
  // State for new crop modal
  const [modalNuevoCultivoPlanta, setModalNuevoCultivoPlanta] = useState<Planta | null>(null);
  const [modalNuevoCultivoSeedId, setModalNuevoCultivoSeedId] = useState<number | undefined>(undefined);

  const [showSeedWizard, setShowSeedWizard] = useState(false);
  const [modalNuevoSemillaPlanta, setModalNuevoSemillaPlanta] = useState<Planta | null>(null);

  // Filter and search states
  const [filterSearch, setFilterSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('activas');

  const filteredPlantas = plantas.filter(p => {
    // 1. Search text filter
    const searchLower = filterSearch.toLowerCase().trim();
    if (searchLower) {
      const matchNombre = p.nombre && p.nombre.toLowerCase().includes(searchLower);
      const matchEspecie = p.especiesnombre && p.especiesnombre.toLowerCase().includes(searchLower);
      const matchNombreGold = p.nombre_gold && p.nombre_gold.toLowerCase().includes(searchLower);
      if (!matchNombre && !matchEspecie && !matchNombreGold) {
        return false;
      }
    }

    // 2. Active/Inactive base filter
    const isActive = Number(p.variedadesvisibilidadsino ?? 1) !== 0;
    if (selectedFilter === 'inactivas') {
      if (isActive) return false;
    } else if (selectedFilter === 'all') {
      // Mostrar tanto activas como inactivas
    } else {
      if (!isActive) return false;
    }

    // 3. Tag category filter
    if (selectedFilter === 'all' || selectedFilter === 'activas' || selectedFilter === 'inactivas') return true;

    if (selectedFilter === 'has_cultivos') {
      let cultivos: any[] = [];
      try {
        if (typeof p.cultivos_lista === 'string') cultivos = JSON.parse(p.cultivos_lista);
        else if (Array.isArray(p.cultivos_lista)) cultivos = p.cultivos_lista;
      } catch (e) {}
      return cultivos.length > 0;
    }

    if (selectedFilter === 'has_semillas') {
      let seeds: any[] = [];
      try {
        if (typeof p.semillas_lista === 'string') seeds = JSON.parse(p.semillas_lista);
        else if (Array.isArray(p.semillas_lista)) seeds = p.semillas_lista;
      } catch (e) {}
      return seeds.length > 0;
    }

    if (selectedFilter === 'dif_facil') {
      return p.dificultad?.toLowerCase() === 'fácil' || p.dificultad?.toLowerCase() === 'facil';
    }

    if (selectedFilter === 'dif_media') {
      return p.dificultad?.toLowerCase() === 'media';
    }

    if (selectedFilter === 'dif_dificil') {
      return p.dificultad?.toLowerCase() === 'difícil' || p.dificultad?.toLowerCase() === 'dificil';
    }

    return true;
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push('/login'); return; }
      setUserEmail(user.email);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (userEmail) {
      loadPlantas();
      // Abrir wizard automáticamente si viene de ?wizard=true
      if (searchParams.get('wizard') === 'true') {
        setWizardOpen(true);
      }
    }
  }, [userEmail]);

  const loadPlantas = async () => {
    try {
      const res = await fetch('/api/user/plantas', { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
        const data = await res.json();
        setPlantas(data.plantas || []);
      }
      const resAlertas = await fetch('/api/user/cultivos/alertas-hoy', { headers: { 'x-user-email': userEmail! } });
      if (resAlertas.ok) {
        const dataAlertas = await resAlertas.json();
        setAlertasHoy(processAlertas(dataAlertas.cultivos || []));
      }
    } catch (e) { console.error('Error loading plantas:', e); }
    finally { setLoading(false); }
  };

  const openWizard = () => {
    setWizardOpen(true);
  };

  const deletePlanta = async (id: number, forceInactivate?: boolean) => {
    const p = plantas.find(item => item.idvariedades === id);
    const hasSeeds = p && (p.semillas_count || 0) > 0;
    const isInactivating = hasSeeds || forceInactivate;
    const confirmMessage = isInactivating 
      ? 'Esta planta se inactivará de tu huerto. Conservará sus semillas pero no se mostrará en tu huerto. ¿Seguro que quieres inactivar esta planta?'
      : '¿Seguro que quieres eliminar esta planta de tu huerto?';
    if (!confirm(confirmMessage)) return;
    setDeleting(id);
    try {
      const url = `/api/user/plantas/${id}${isInactivating ? '?inactivate=true' : ''}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      if (res.ok) {
        await loadPlantas();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al procesar la solicitud');
      }
    } catch (e) { console.error('Error deleting:', e); }
    finally { setDeleting(null); }
  };

  const reactivatePlanta = async (id: number) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/plantas/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail!
        },
        body: JSON.stringify({
          variedadesvisibilidadsino: 1
        })
      });
      if (res.ok) {
        await loadPlantas();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al reactivar la planta');
      }
    } catch (e) {
      console.error('Error reactivating plant:', e);
    } finally {
      setDeleting(null);
    }
  };

  const inactivateSemilla = async (id: number, numero: any) => {
    if (!confirm(`¿Seguro que quieres inactivar la Semilla Nº ${numero}? No aparecerá en tus listas de semillas activas.`)) return;
    try {
      const res = await fetch(`/api/user/semillas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': userEmail!
        },
        body: JSON.stringify({
          semillasactivosino: 0
        })
      });
      if (res.ok) {
        await loadPlantas();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al inactivar la semilla');
      }
    } catch (e) {
      console.error('Error inactivating seed:', e);
    }
  };

  const deleteSemilla = async (id: number, numero: any) => {
    if (!confirm(`¿Seguro que quieres eliminar permanentemente la Semilla Nº ${numero}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await fetch(`/api/user/semillas/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': userEmail!
        }
      });
      if (res.ok) {
        await loadPlantas();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar la semilla');
      }
    } catch (e) {
      console.error('Error deleting seed:', e);
    }
  };

  const deleteCultivo = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este cultivo?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/user/cultivos/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });
      if (res.ok) {
        await loadPlantas();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar el cultivo');
      }
    } catch (e) { console.error('Error deleting cultivo:', e); }
    finally { setDeleting(null); }
  };



  if (loading) return <p className="loading-text">Cargando tus plantas...</p>;

  return (
    <div style={{ width: '100%' }}>
      {/* ── Botonera superior de Navegación (Gold Standard) ── */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'white', border: '1px solid #cbd5e1', color: '#475569',
            padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex',
            alignItems: 'center', gap: '6px', transition: 'all 0.2s'
          }}
          onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
          onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
        >
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ── Subheader Integrado con Degradado y Acciones (Gold Standard) ── */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46, #10b981)',
        borderRadius: '16px', padding: '24px 28px', marginBottom: '24px',
        color: 'white', boxShadow: '0 4px 15px rgba(6, 95, 70, 0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', flexWrap: 'wrap', gap: '32px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌱</span> Mis Hortalizas
            </h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              {plantas.length} {plantas.length === 1 ? 'planta' : 'plantas'} en tu huerto
            </p>
          </div>
          <button
            onClick={openWizard}
            style={{
              background: 'white', color: '#065f46', border: 'none',
              padding: '12px 24px', borderRadius: '12px', fontWeight: 800,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            }}
          >
            ➕ Añadir nueva planta
          </button>
        </div>
      </div>

      {/* Estado vacío */}
      {plantas.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          borderRadius: '16px', border: '2px dashed #86efac'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🌿</div>
          <h2 style={{ color: '#166534', margin: '0 0 8px' }}>Tu huerto está vacío</h2>
          <p style={{ color: '#15803d', maxWidth: 400, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Empieza añadiendo tu primera planta. Podrás personalizar sus datos, labores y calendario.
          </p>
          <button
            onClick={openWizard}
            style={{
              background: '#10b981', color: 'white', border: 'none',
              padding: '14px 28px', borderRadius: '12px', fontWeight: 700,
              cursor: 'pointer', fontSize: '1rem'
            }}
          >
            🌱 Añadir mi primera planta
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      {plantas.length > 0 && (
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '28px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Fila 1: Búsqueda */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', color: '#94a3b8' }}>🔍</span>
            <input
              type="text"
              placeholder="Buscar plantas por nombre, variedad original o hortaliza..."
              value={filterSearch}
              onChange={e => setFilterSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: '12px',
                border: '2px solid #e2e8f0',
                fontSize: '0.95rem',
                fontWeight: 500,
                color: '#1e293b',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={e => e.target.style.borderColor = '#10b981'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch('')}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem',
                  fontWeight: 'bold', padding: '4px'
                }}
              >
                ✖
              </button>
            )}
          </div>

          {/* Fila 2: Filtros de Tags */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', marginRight: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Filtrar:
            </span>
            {FILTER_TAGS.map(tag => {
              const isActive = selectedFilter === tag.id;
              
              // Colores premium según el tipo de tag y estado activo
              let badgeBg = '#f1f5f9';
              let badgeColor = '#475569';
              let activeBg = '#065f46';
              let activeColor = 'white';

              if (tag.id === 'dif_facil') {
                badgeBg = '#f0fdf4';
                badgeColor = '#166534';
                activeBg = '#166534';
              } else if (tag.id === 'dif_media') {
                badgeBg = '#fef9c3';
                badgeColor = '#854d0e';
                activeBg = '#854d0e';
              } else if (tag.id === 'dif_dificil') {
                badgeBg = '#fef2f2';
                badgeColor = '#991b1b';
                activeBg = '#991b1b';
              } else if (tag.id === 'activas') {
                badgeBg = '#f0fdf4';
                badgeColor = '#166534';
                activeBg = '#059669';
              } else if (tag.id === 'inactivas') {
                badgeBg = '#f8fafc';
                badgeColor = '#64748b';
                activeBg = '#475569';
              }

              return (
                <button
                  key={tag.id}
                  onClick={() => setSelectedFilter(tag.id)}
                  style={{
                    background: isActive ? activeBg : badgeBg,
                    color: isActive ? activeColor : badgeColor,
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: isActive ? '0 4px 10px rgba(0,0,0,0.1)' : 'none'
                  }}
                  onMouseOver={e => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.filter = 'brightness(0.95)';
                    }
                  }}
                  onMouseOut={e => {
                    if (!isActive) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.filter = 'none';
                    }
                  }}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid de plantas agrupado por especies */}
      {plantas.length > 0 && filteredPlantas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {Array.from(new Set(filteredPlantas.map(p => p.especiesnombre))).sort().map(especieNombre => {
            const plantasDeEspecie = filteredPlantas.filter(p => p.especiesnombre === especieNombre);
            const especieIcono = plantasDeEspecie[0].especiesicono || '🌱';
            return (
              <div key={especieNombre}>
                <h2 style={{ fontSize: '1.4rem', color: '#166534', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #bbf7d0', paddingBottom: '8px' }}>
                  <SpeciesIcon icon={especieIcono} size="1.8rem" /> {especieNombre}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {plantasDeEspecie.map(p => {
                    let cultivos: any[] = [];
                    try {
                      if (typeof p.cultivos_lista === 'string') cultivos = JSON.parse(p.cultivos_lista);
                      else if (Array.isArray(p.cultivos_lista)) cultivos = p.cultivos_lista;
                    } catch (e) {}
                    const hasCultivos = cultivos.length > 0;

                    return (
                    <div key={p.idvariedades} style={{
                      background: 'var(--bg-card)', borderRadius: '16px',
                      border: '1px solid var(--border-color)', overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s',
                      cursor: 'pointer', position: 'relative'
                    }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                      onClick={() => router.push(`/dashboard/mis-plantas/${p.idvariedades}`)}
                    >
                      {/* Header de la tarjeta */}
                      <div style={{ padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 700 }}>
                            {p.especiesnombre}
                          </span>
                          {Number(p.variedadesvisibilidadsino ?? 1) === 0 && (
                            <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#64748b', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                              💤 Inactiva
                            </span>
                          )}
                          {Number(p.origen_visibilidad ?? 1) === 0 && (
                            <span style={{ fontSize: '0.65rem', background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }} title="Esta variedad ha sido descatalogada del catálogo general por el administrador.">
                              🚫 Descatalogada
                            </span>
                          )}
                        </div>
                        {!p.es_generica && (
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            🏷️ {p.nombre_gold}
                          </span>
                        )}
                      </div>

                      {/* Foto */}
                      <div style={{ height: 160, background: p.foto ? '#000' : 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                        {p.foto && (
                          <img src={getMediaUrl(p.foto)} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                          {/* Titulo / Variedad */}
                          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.nombre}</h3>
                        </div>

                        {/* Detalles de Cultivos y Semillas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                          
                          {/* Sección Cultivos */}
                          <div>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Cultivos activos:</span>
                            {hasCultivos ? (
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {cultivos.map((c: any) => {
                                    let dotColor = '#3b82f6'; // en_espera
                                    let estadoTexto = 'En espera';
                                    if (c.estado === 'perdido') { dotColor = '#ef4444'; estadoTexto = 'Perdido'; }
                                    else if (c.estado === 'finalizado') { dotColor = '#10b981'; estadoTexto = 'Finalizado'; }
                                    else if (c.estado === 'recoleccion') { dotColor = '#f97316'; estadoTexto = 'Recolección'; }
                                    else if (c.estado === 'crecimiento' || c.estado === 'crecimiento_inicial') { dotColor = '#22c55e'; estadoTexto = 'Crecimiento'; }
                                    else if (c.estado === 'germinacion') { dotColor = '#84cc16'; estadoTexto = 'Germinación'; }
                                    
                                    return (
                                      <div 
                                        key={c.id} 
                                        style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'transparent', padding: '4px', borderRadius: '8px', transition: 'background 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/cultivos/${c.id}`); }}
                                        title={`Ir al Cultivo Nº ${c.numero}`}
                                      >
                                        <div 
                                          style={{ 
                                            fontSize: '0.75rem', background: '#f8fafc', color: '#334155', 
                                            padding: '4px 10px', borderRadius: '12px', border: '1px solid #cbd5e1',
                                            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontWeight: 500,
                                            width: 'fit-content'
                                          }}
                                        >
                                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, display: 'inline-block' }} />
                                          <span style={{ fontWeight: 700 }}>C. {c.numero}</span> 
                                          {c.cantidad && (
                                            <>
                                              <span style={{ color: '#94a3b8' }}>•</span>
                                              <span style={{ color: '#64748b' }}>{c.cantidad} ud.</span>
                                            </>
                                          )}
                                          <span style={{ color: '#64748b' }}>|</span> <span style={{ color: dotColor, fontWeight: 600 }}>{estadoTexto}</span>
                                          
                                          <div 
                                            onClick={(e) => { e.stopPropagation(); deleteCultivo(c.id); }}
                                            title="Eliminar cultivo"
                                            style={{ 
                                              marginLeft: '4px',
                                              width: '20px', height: '20px', borderRadius: '50%', 
                                              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', 
                                              display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                              fontSize: '0.8rem', opacity: 0.7, transition: 'all 0.2s',
                                              cursor: deleting === c.id ? 'wait' : 'pointer'
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                                            onMouseOut={e => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                          >
                                            {deleting === c.id ? '⏳' : '✖'}
                                          </div>
                                        </div>
                                        
                                        {/* Línea vertical y tareas pendientes */}
                                        {(() => {
                                          const cropAlerts = alertasHoy.filter((a: any) => a.cultivo.idcultivos === c.id);
                                          if (cropAlerts.length === 0) return null;
                                          
                                          return (
                                            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', marginLeft: '12px', paddingLeft: '16px', marginTop: '4px', gap: '6px' }}>
                                              {/* Conector horizontal */}
                                              <div style={{ position: 'absolute', left: '0', top: '-6px', bottom: '10px', borderLeft: '2px solid #cbd5e1' }} />
                                              
                                              {cropAlerts.map((a: any, idx: number) => {
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
                                                return (
                                                  <div key={idx} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#475569' }}>
                                                    {/* Conector horizontal */}
                                                    <div style={{ position: 'absolute', left: '-16px', top: '50%', width: '12px', borderTop: '2px solid #cbd5e1' }} />
                                                    
                                                    <span style={{ fontSize: '0.85rem', position: 'relative', zIndex: 1 }}>{icon}</span>
                                                    <span style={{ fontWeight: 600, color: a.pauta.laborescolor || '#3b82f6' }}>{a.pauta.laboresnombre}</span>
                                                    {a.fechaEmision && (
                                                      <span style={{ fontSize: '0.65rem', color: '#94a3b8', marginLeft: '4px' }}>({new Date(a.fechaEmision).toLocaleDateString()})</span>
                                                    )}
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    );
                                })}
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin cultivos activos</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setModalNuevoCultivoPlanta(p); }}
                                  style={{
                                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981',
                                    padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold'
                                  }}
                                  title="Iniciar cultivo de esta planta"
                                >
                                  + Añadir Cultivo
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Sección Semillas */}
                          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Semillas en banco:</span>
                            {(() => {
                              let seeds: any[] = [];
                              try {
                                if (typeof p.semillas_lista === 'string') seeds = JSON.parse(p.semillas_lista);
                                else if (Array.isArray(p.semillas_lista)) seeds = p.semillas_lista;
                              } catch (e) {}
                              const hasSeeds = seeds.length > 0;

                              if (!hasSeeds) {
                                return (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin semillas activas</span>
                                    <button
                                      onClick={(e) => { 
                                        e.stopPropagation(); 
                                        setModalNuevoSemillaPlanta(p);
                                        setShowSeedWizard(true); 
                                      }}
                                      style={{
                                        background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6',
                                        padding: '2px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 'bold'
                                      }}
                                      title="Añadir semilla de esta variedad"
                                    >
                                      + Añadir Semilla
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  {seeds.map((s: any) => (
                                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '4px 8px', borderRadius: '8px' }}>
                                      <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 'bold' }}>
                                        Semilla Nº {s.numero} {s.stock !== null && `(${s.stock} uds)`}
                                      </span>
                                      <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                                        <button
                                          onClick={() => router.push(`/dashboard/semillas/${s.id}`)}
                                          style={{ background: 'white', border: '1px solid #86efac', color: '#166534', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                          title="Editar esta semilla"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => {
                                            setModalNuevoCultivoSeedId(s.id);
                                            setModalNuevoCultivoPlanta(p);
                                          }}
                                          style={{ background: '#10b981', border: 'none', color: 'white', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                          title="Iniciar cultivo desde esta semilla"
                                        >
                                          🌱
                                        </button>
                                        <button
                                          onClick={() => inactivateSemilla(s.id, s.numero)}
                                          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#64748b', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                          title="Inactivar esta semilla"
                                        >
                                          💤
                                        </button>
                                        {Number(s.cultivos_count || 0) === 0 ? (
                                          <button
                                            onClick={() => deleteSemilla(s.id, s.numero)}
                                            style={{ background: 'white', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'pointer' }}
                                            title="Eliminar esta semilla"
                                          >
                                            🗑️
                                          </button>
                                        ) : (
                                          <button
                                            disabled
                                            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#cbd5e1', borderRadius: '4px', padding: '2px 6px', fontSize: '0.75rem', cursor: 'not-allowed', opacity: 0.5 }}
                                            title="No se puede eliminar (tiene cultivos asociados)"
                                          >
                                            🗑️
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                      </div>

                      {/* Botón Añadir (arriba a la izquierda del eliminar) */}
                      {hasCultivos && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setModalNuevoCultivoPlanta(p); }}
                          style={{
                            position: 'absolute', top: 8, right: 48,
                            background: 'rgba(16, 185, 129, 0.9)', color: 'white', border: 'none',
                            padding: '0 12px', height: 28, borderRadius: '14px',
                            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', opacity: 0.9,
                            transition: 'opacity 0.2s, background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                          onMouseOver={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(5, 150, 105, 1)'; }}
                          onMouseOut={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.background = 'rgba(16, 185, 129, 0.9)'; }}
                          title="Añadir nuevo cultivo de esta planta"
                        >
                          + Añadir Cultivo
                        </button>
                      )}

                      {/* Delete / Inactivate / Reactivate buttons */}
                      {Number(p.variedadesvisibilidadsino ?? 1) === 0 ? (
                        <>
                          {/* Reactivate button (🔋): shown for inactive plants */}
                          <button
                            onClick={(e) => { e.stopPropagation(); reactivatePlanta(p.idvariedades); }}
                            disabled={deleting === p.idvariedades}
                            style={{
                              position: 'absolute', top: 8,
                              right: (p.semillas_count || 0) === 0 ? 48 : 8,
                              background: '#ffffff', color: '#10b981', border: '1px solid #a7f3d0',
                              width: 32, height: 32, borderRadius: '50%',
                              cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.borderColor = '#86efac'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#a7f3d0'; }}
                            title="Reactivar en el huerto"
                          >
                            🔋
                          </button>

                          {/* Delete button (🗑️): only shown if it has no seeds */}
                          {(p.semillas_count || 0) === 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePlanta(p.idvariedades, false); }}
                              disabled={deleting === p.idvariedades}
                              style={{
                                position: 'absolute', top: 8, right: 8,
                                background: '#ffffff', color: '#ef4444', border: '1px solid #fca5a5',
                                width: 32, height: 32, borderRadius: '50%',
                                cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
                              onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                              title="Eliminar del huerto"
                            >
                              🗑️
                            </button>
                          )}
                        </>
                      ) : !hasCultivos ? (
                        <>
                          {/* Inactivate button (💤): always shown if no active crops */}
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePlanta(p.idvariedades, true); }}
                            disabled={deleting === p.idvariedades}
                            style={{
                              position: 'absolute', top: 8,
                              right: (p.semillas_count || 0) === 0 ? 48 : 8,
                              background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1',
                              width: 32, height: 32, borderRadius: '50%',
                              cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
                              alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                            onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            title="Inactivar del huerto"
                          >
                            💤
                          </button>

                          {/* Delete button (🗑️): only shown if it has no seeds */}
                          {(p.semillas_count || 0) === 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); deletePlanta(p.idvariedades, false); }}
                              disabled={deleting === p.idvariedades}
                              style={{
                                position: 'absolute', top: 8, right: 8,
                                background: '#ffffff', color: '#ef4444', border: '1px solid #fca5a5',
                                width: 32, height: 32, borderRadius: '50%',
                                cursor: 'pointer', fontSize: '0.9rem', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                                transition: 'all 0.2s'
                              }}
                              onMouseOver={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.borderColor = '#f87171'; }}
                              onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#fca5a5'; }}
                              title="Eliminar del huerto"
                            >
                              🗑️
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            alert("No puedes eliminar una planta que tiene cultivos asociados. Elimina los cultivos primero."); 
                          }}
                          style={{
                            position: 'absolute', top: 8, right: 8,
                            background: '#f8fafc', color: '#cbd5e1', border: '1px solid #e2e8f0',
                            width: 32, height: 32, borderRadius: '50%',
                            cursor: 'not-allowed', fontSize: '0.9rem', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', opacity: 0.5
                          }}
                          title="No se puede eliminar (tiene cultivos asociados)"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Sin resultados al aplicar filtros */}
      {plantas.length > 0 && filteredPlantas.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          borderRadius: '16px', border: '2px dashed #cbd5e1',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          animation: 'fadeInDown 0.3s'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔍</div>
          <h2 style={{ color: '#475569', margin: '0 0 8px', fontWeight: 800 }}>Sin resultados para tu búsqueda</h2>
          <p style={{ color: '#94a3b8', maxWidth: 460, margin: '0 auto 1.5rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            No encontramos ninguna planta en tu huerto que coincida con el término "{filterSearch}" o con el filtro seleccionado.
          </p>
          <button
            onClick={() => { setFilterSearch(''); setSelectedFilter('all'); }}
            style={{
              background: '#065f46', color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: '12px', fontWeight: 700,
              cursor: 'pointer', fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(6, 95, 70, 0.2)',
              transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Resetear filtros
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* WIZARD: Añadir nueva planta             */}
      {/* ═══════════════════════════════════════ */}
      <PlantWizardModal
        show={wizardOpen}
        onClose={() => setWizardOpen(false)}
        userEmail={userEmail || undefined}
        onSuccess={async ({ id, startCultivo }) => {
          setWizardOpen(false);
          await loadPlantas();
          router.push(`/dashboard/mis-plantas/${id}${startCultivo ? '?startCultivo=true' : ''}`);
        }}
      />

      {/* Modal Añadir Cultivo */}
      {modalNuevoCultivoPlanta !== null && userEmail && (
        <IniciarCultivoModal
          isOpen={true}
          onClose={() => {
            setModalNuevoCultivoPlanta(null);
            setModalNuevoCultivoSeedId(undefined);
            loadPlantas(); // Recargar por si se añadió el cultivo
          }}
          plantaId={modalNuevoCultivoPlanta.idvariedades}
          xvariedadesidvariedadorigen={modalNuevoCultivoPlanta.xvariedadesidvariedadorigen}
          initialSeedId={modalNuevoCultivoSeedId}
          plantaNombre={modalNuevoCultivoPlanta.nombre || modalNuevoCultivoPlanta.especiesnombre || 'Planta'}
          calendarioSolar={
            (modalNuevoCultivoPlanta as any).semillerodesde !== undefined 
              ? {
                  semillerodesde: (modalNuevoCultivoPlanta as any).semillerodesde,
                  semillerohasta: (modalNuevoCultivoPlanta as any).semillerohasta,
                  siembradirectadesde: (modalNuevoCultivoPlanta as any).siembradirectadesde,
                  siembradirectahasta: (modalNuevoCultivoPlanta as any).siembradirectahasta,
                  trasplantedesde: (modalNuevoCultivoPlanta as any).trasplantedesde,
                  trasplantehasta: (modalNuevoCultivoPlanta as any).trasplantehasta,
                }
              : undefined
          }
          tiposiembra={(modalNuevoCultivoPlanta as any).tiposiembra}
          peso1000semillas={(modalNuevoCultivoPlanta as any).especiespeso1000semillas}
          userEmail={userEmail}
        />
      )}

      {/* Modal Asistente de Semillas */}
      {showSeedWizard && modalNuevoSemillaPlanta && (
        <SeedWizardModal
          show={true}
          onClose={() => {
            setShowSeedWizard(false);
            setModalNuevoSemillaPlanta(null);
            loadPlantas();
          }}
          onSuccess={() => {
            setShowSeedWizard(false);
            setModalNuevoSemillaPlanta(null);
            loadPlantas();
          }}
          initialEspecieId={modalNuevoSemillaPlanta.xvariedadesidespecies}
          initialVariedadId={modalNuevoSemillaPlanta.xvariedadesidvariedadorigen}
        />
      )}
    </div>
  );
}
