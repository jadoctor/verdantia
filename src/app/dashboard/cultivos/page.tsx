'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { getMediaUrl } from '@/lib/media-url';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';
import { Trash2 } from 'lucide-react';

export default function CultivosDashboard() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cultivos, setCultivos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');

  // Custom Modal State for Confirming Delete
  const [uiModal, setUiModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    cropId: number | null;
  }>({
    show: false,
    title: '',
    message: '',
    cropId: null,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadCultivos(user.email);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);

  const loadCultivos = async (email: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/user/cultivos', { headers: { 'x-user-email': email } });
      if (res.ok) {
        const data = await res.json();
        setCultivos(data.cultivos || []);
      }
    } catch (e) {
      console.error('Error cargando cultivos:', e);
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (c: any) => {
    setUiModal({
      show: true,
      title: 'Eliminar Cultivo',
      message: `¿Estás seguro de que quieres eliminar el cultivo Nº ${c.cultivosnumerocoleccion || c.idcultivos} de ${c.especiesnombre}? Esta acción no se puede deshacer.`,
      cropId: c.idcultivos,
    });
  };

  const executeDelete = async () => {
    if (!uiModal.cropId || !userEmail) return;
    const cropId = uiModal.cropId;
    setUiModal({ show: false, title: '', message: '', cropId: null });

    try {
      const res = await fetch(`/api/user/cultivos/${cropId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail },
      });
      if (res.ok) {
        loadCultivos(userEmail);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error al eliminar el cultivo');
      }
    } catch (e) {
      console.error('Error de red al eliminar cultivo:', e);
      alert('Error de conexión');
    }
  };

  // Helper values
  const activeCropsCount = cultivos.filter(
    (c) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido'
  ).length;
  const finishedCropsCount = cultivos.filter((c) => c.cultivosestado === 'finalizado').length;
  const lostCropsCount = cultivos.filter((c) => c.cultivosestado === 'perdido').length;

  const filteredCrops = cultivos.filter((c) => {
    // Filter by Search Term
    const searchMatch =
      !searchTerm ||
      c.especiesnombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.variedad_nombre && c.variedad_nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by Status Tab
    let statusMatch = true;
    if (selectedStatus !== 'todos') {
      if (selectedStatus === 'activos') {
        statusMatch = c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido';
      } else {
        statusMatch = c.cultivosestado === selectedStatus;
      }
    }

    return searchMatch && statusMatch;
  });

  const getStatusCount = (id: string) => {
    if (id === 'todos') return cultivos.length;
    if (id === 'activos') return activeCropsCount;
    return cultivos.filter(c => c.cultivosestado === id).length;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'germinacion':
        return '🌱 Germinación';
      case 'crecimiento':
        return '🌿 Crecimiento';
      case 'recoleccion':
        return '🧺 Recolección';
      case 'en_espera':
        return '⏳ En espera';
      case 'trasplante':
        return '🪴 Trasplante';
      case 'finalizado':
        return '✅ Finalizado';
      case 'perdido':
        return '❌ Perdido';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'germinacion':
        return { bg: '#fef3c7', text: '#92400e', progress: '#f59e0b', percent: 25 };
      case 'crecimiento':
        return { bg: '#d1fae5', text: '#065f46', progress: '#10b981', percent: 65 };
      case 'recoleccion':
        return { bg: '#fce7f3', text: '#9d174d', progress: '#ec4899', percent: 85 };
      case 'en_espera':
        return { bg: '#e0e7ff', text: '#3730a3', progress: '#6366f1', percent: 10 };
      case 'trasplante':
        return { bg: '#f3e8ff', text: '#6b21a8', progress: '#a855f7', percent: 40 };
      case 'finalizado':
        return { bg: '#dcfce7', text: '#15803d', progress: '#22c55e', percent: 100 };
      case 'perdido':
        return { bg: '#fee2e2', text: '#991b1b', progress: '#ef4444', percent: 100 };
      default:
        return { bg: '#f1f5f9', text: '#475569', progress: '#94a3b8', percent: 50 };
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'semillero':
        return '📥 Semillero';
      case 'siembra_directa':
        return '🌍 Siembra Directa';
      case 'trasplante_directo':
        return '🪴 Trasplante Directo';
      default:
        return method ? method.replace('_', ' ') : 'Desconocido';
    }
  };

  const getOriginLabel = (origin: string) => {
    switch (origin) {
      case 'semilla_inventario':
        return '🌾 Semilla del Banco';
      case 'semilla_nueva':
        return '🛒 Semilla Nueva';
      case 'plantel_comprado':
        return '🛍️ Plantel Comprado';
      case 'plantel_regalado':
        return '🎁 Plantel Regalado';
      case 'esqueje':
        return '✂️ Esqueje';
      default:
        return origin ? origin.replace('_', ' ') : 'Desconocido';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ color: '#64748b' }}>Cargando tus cultivos...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Botón Volver */}
      <div style={{ marginBottom: '16px' }}>
        <button 
          onClick={() => router.push('/dashboard')} 
          style={{ 
            background: 'white', 
            border: '1px solid #cbd5e1', 
            color: '#475569', 
            padding: '6px 14px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 600, 
            fontSize: '0.85rem', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseOut={e => e.currentTarget.style.background = 'white'}
        >
          🏠 Volver al Inicio
        </button>
      </div>

      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>🚜 Mis Cultivos</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              Historial y seguimiento del ciclo de vida de tus siembras y plantaciones
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard?startCrop=true')}
            style={{ 
              padding: '10px 20px', 
              borderRadius: '8px', 
              background: 'white', 
              color: '#15803d', 
              border: 'none', 
              cursor: 'pointer', 
              fontWeight: 700, 
              fontSize: '0.95rem', 
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            ➕ Iniciar Cultivo
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Cultivos Activos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{activeCropsCount}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Cultivos Finalizados</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{finishedCropsCount}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Cultivos Perdidos</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{lostCropsCount}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Registros</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{cultivos.length}</div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Search Input */}
        <div>
          <input 
            type="text"
            placeholder="🔍 Buscar por especie o variedad (ej: tomate, lechuga...)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#15803d'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'todos', label: '🌍 Todos' },
            { id: 'activos', label: '🌿 Activos' },
            { id: 'en_espera', label: '⏳ En Espera' },
            { id: 'germinacion', label: '🌱 Germinación' },
            { id: 'trasplante', label: '🪴 Trasplante' },
            { id: 'crecimiento', label: '🌿 Crecimiento' },
            { id: 'recoleccion', label: '🧺 Recolección' },
            { id: 'finalizado', label: '✅ Finalizados' },
            { id: 'perdido', label: '❌ Perdidos' },
          ].map((tab) => {
            const isSelected = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: isSelected ? '1px solid #15803d' : '1px solid #e2e8f0',
                  background: isSelected ? '#f0fdf4' : 'white',
                  color: isSelected ? '#15803d' : '#475569',
                  fontWeight: isSelected ? 'bold' : 'normal',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseOut={e => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {tab.label} ({getStatusCount(tab.id)})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid List of Crops */}
      {filteredCrops.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '2px dashed #cbd5e1' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚜</div>
          <h3 style={{ margin: '0 0 8px', color: '#334155' }}>No se encontraron cultivos</h3>
          <p style={{ color: '#64748b', margin: 0 }}>
            {searchTerm || selectedStatus !== 'todos' 
              ? 'Prueba a cambiar los filtros de búsqueda.' 
              : 'Aún no has registrado ningún cultivo. ¡Haz clic en "Sembrar / Iniciar Cultivo" para empezar!'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredCrops.map((c) => {
            const statusConfig = getStatusColor(c.cultivosestado);
            return (
              <div 
                key={c.idcultivos}
                style={{ 
                  background: 'white', 
                  borderRadius: '16px', 
                  border: '1px solid #e2e8f0', 
                  padding: '16px', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)';
                }}
              >
                {/* Top Section */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  {/* Photo or SpeciesIcon */}
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '12px', 
                    overflow: 'hidden', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                    backgroundColor: '#f1f5f9', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {c.foto ? (
                      <img src={getMediaUrl(c.foto)} alt={c.variedad_nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" loading="lazy" />
                    ) : (
                      <SpeciesIcon icon={c.especiesicono || '🌱'} size="1.8rem" />
                    )}
                  </div>

                  {/* Cultivo Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.65rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        Nº {c.cultivosnumerocoleccion || c.idcultivos}
                      </span>
                      <span style={{ 
                        fontSize: '0.75rem', 
                        background: statusConfig.bg, 
                        color: statusConfig.text, 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}>
                        {getStatusLabel(c.cultivosestado)}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.especiesnombre}
                    </h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Variedad: {c.variedad_nombre || 'Común'}
                    </p>
                  </div>
                </div>

                {/* Details Section */}
                <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px 12px', fontSize: '0.8rem', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 12px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>📅 Inicio:</span> {formatDate(c.cultivosfechainicio)}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>📍 Zona:</span> {c.cultivosubicacion || 'Sin asignar'}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>🧬 Origen:</span> {c.cultivosorigen ? getOriginLabel(c.cultivosorigen) : '-'}
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>📥 Método:</span> {c.cultivosmetodo ? getMethodLabel(c.cultivosmetodo) : '-'}
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#94a3b8' }}>🔢 Cantidad:</span> {c.cultivoscantidad || 1} plantas
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>
                    <span>Progreso del cultivo</span>
                    <span style={{ fontWeight: 'bold', color: statusConfig.progress }}>{statusConfig.percent}%</span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${statusConfig.percent}%`, background: statusConfig.progress, borderRadius: '3px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>

                {/* Bottom Actions */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                  <button 
                    onClick={() => router.push(`/dashboard/cultivos/${c.idcultivos}?from=cultivos`)}
                    style={{
                      background: '#15803d',
                      color: 'white',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#166534'}
                    onMouseOut={e => e.currentTarget.style.background = '#15803d'}
                  >
                    Ver Ficha Completa
                  </button>

                  <button 
                    onClick={() => triggerDelete(c)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#fee2e2'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                    title="Eliminar Cultivo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {uiModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: '16px', width: '90%', maxWidth: '420px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ background: '#fef2f2', padding: '16px 24px', borderBottom: '1px solid #fee2e2' }}>
              <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ {uiModal.title}
              </h3>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: 0, color: '#475569', lineHeight: '1.5', fontSize: '0.95rem' }}>{uiModal.message}</p>
            </div>
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setUiModal({ ...uiModal, show: false, cropId: null })}
                style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                style={{ padding: '8px 16px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
