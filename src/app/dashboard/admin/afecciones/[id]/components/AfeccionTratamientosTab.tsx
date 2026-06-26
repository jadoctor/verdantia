'use client';
import React, { useState, useEffect } from 'react';

interface AfeccionTratamientosTabProps {
  afeccionId: string;
  userEmail: string | null;
}

export default function AfeccionTratamientosTab({ afeccionId, userEmail }: AfeccionTratamientosTabProps) {
  const [vinculos, setVinculos] = useState<any[]>([]);
  const [disponibles, setDisponibles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedTratamiento, setSelectedTratamiento] = useState('');
  const [dosis, setDosis] = useState('');
  const [aplicacion, setAplicacion] = useState('');
  const [eficacia, setEficacia] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (afeccionId !== 'nueva' && userEmail) {
      fetchData();
    }
  }, [afeccionId, userEmail]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vinculosRes, dispRes] = await Promise.all([
        fetch(`/api/admin/afecciones/${afeccionId}/tratamientos`, { headers: { 'x-user-email': userEmail || '' } }),
        fetch(`/api/admin/tratamientos`, { headers: { 'x-user-email': userEmail || '' } })
      ]);

      if (vinculosRes.ok) {
        const data = await vinculosRes.json();
        setVinculos(data.afeccionestratamientos || []);
      }
      
      if (dispRes.ok) {
        const dataDisp = await dispRes.json();
        setDisponibles(dataDisp.tratamientos || []);
      }
    } catch (error) {
      console.error('Error fetching tratamientos data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVinculo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTratamiento) return;

    setIsAdding(true);
    try {
      const res = await fetch(`/api/admin/afecciones/${afeccionId}/tratamientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail || '' },
        body: JSON.stringify({
          xafeccionestratamientosidtratamientos: selectedTratamiento,
          afeccionestratamientosdosis: dosis,
          afeccionestratamientosaplicacion: aplicacion,
          afeccionestratamientoseficacia: eficacia
        })
      });

      if (res.ok) {
        setSelectedTratamiento('');
        setDosis('');
        setAplicacion('');
        setEficacia('');
        await fetchData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Error al vincular el tratamiento.');
      }
    } catch (error) {
      console.error('Error adding vinculo:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteVinculo = async (idRel: number) => {
    if (!confirm('¿Seguro que deseas quitar este tratamiento de la afección?')) return;
    try {
      const res = await fetch(`/api/admin/afecciones/${afeccionId}/tratamientos?id=${idRel}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail || '' }
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting vinculo:', error);
    }
  };

  // Filtrar los disponibles que ya están vinculados
  const opcionesDisponibles = disponibles.filter(
    (t) => !vinculos.some((v) => v.xafeccionestratamientosidtratamientos === t.idtratamientos)
  );

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Cargando tratamientos...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Añadir nuevo vínculo */}
      <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>➕</span> Vincular Nuevo Tratamiento
        </h3>
        
        <form onSubmit={handleAddVinculo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Seleccionar Tratamiento Maestro *</label>
            <select 
              required
              value={selectedTratamiento} 
              onChange={(e) => setSelectedTratamiento(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            >
              <option value="">-- Elige un tratamiento del catálogo --</option>
              {opcionesDisponibles.map(t => (
                <option key={t.idtratamientos} value={t.idtratamientos}>
                  {t.tratamientosnombre} ({t.tratamientostipo})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Dosis (Específica para esta afección)</label>
            <input 
              type="text" 
              value={dosis} 
              onChange={(e) => setDosis(e.target.value)}
              placeholder="Ej: 2ml por Litro de agua"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Eficacia Esperada</label>
            <select 
              value={eficacia} 
              onChange={(e) => setEficacia(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
            >
              <option value="">No especificada</option>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="erradicacion">Erradicación</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>Método / Notas de Aplicación</label>
            <textarea 
              value={aplicacion} 
              onChange={(e) => setAplicacion(e.target.value)}
              placeholder="Ej: Pulverizar al atardecer mojando bien el envés de las hojas."
              rows={2}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button 
              type="submit" 
              disabled={isAdding || !selectedTratamiento}
              style={{ 
                background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', 
                borderRadius: '8px', fontWeight: 'bold', cursor: (!selectedTratamiento || isAdding) ? 'not-allowed' : 'pointer',
                opacity: (!selectedTratamiento || isAdding) ? 0.6 : 1
              }}
            >
              {isAdding ? 'Vinculando...' : 'Vincular Tratamiento'}
            </button>
          </div>

        </form>
      </div>

      {/* Lista de tratamientos vinculados */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', color: '#1e293b' }}>
          Tratamientos Actuales ({vinculos.length})
        </h3>

        {vinculos.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
            <span style={{ fontSize: '2.5rem' }}>🧪</span>
            <p style={{ color: '#64748b', marginTop: '12px', fontWeight: 500 }}>No hay tratamientos vinculados a esta afección.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {vinculos.map((v) => (
              <div key={v.idafeccionestratamientos} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                      {v.tratamientosnombre}
                    </span>
                    <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {v.tratamientostipo}
                    </span>
                    {v.afeccionestratamientoseficacia && (
                      <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        Eficacia: {v.afeccionestratamientoseficacia}
                      </span>
                    )}
                  </div>
                  
                  {v.afeccionestratamientosdosis && (
                    <p style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#475569' }}>
                      <strong>Dosis:</strong> {v.afeccionestratamientosdosis}
                    </p>
                  )}
                  {v.afeccionestratamientosaplicacion && (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', fontStyle: 'italic' }}>
                      📝 {v.afeccionestratamientosaplicacion}
                    </p>
                  )}
                </div>
                
                <button 
                  onClick={() => handleDeleteVinculo(v.idafeccionestratamientos)}
                  style={{ background: '#fee2e2', color: '#991b1b', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
