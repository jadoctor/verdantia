import React from 'react';
import { getMediaUrl } from '@/lib/media-url';
import PremiumTableHeader from '@/components/ui/PremiumTableHeader';
import PremiumEditButton from '@/components/ui/PremiumEditButton';

interface TratamientosTableProps {
  filteredTratamientos: any[];
  sortedTratamientos: any[];
  loading: boolean;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
  handleSort: (key: string) => void;
  getCompleteness: (t: any) => { pct: number; color: string };
  parseTags: (val: string) => string[];
  router: any;
}

export function TratamientosTable({
  filteredTratamientos,
  sortedTratamientos,
  loading,
  searchTerm,
  setSearchTerm,
  sortConfig,
  handleSort,
  getCompleteness,
  parseTags,
  router
}: TratamientosTableProps) {

  const getTipoColor = (tipo: string) => {
    switch (tipo?.toLowerCase().trim()) {
      case 'ecológico': return { bg: '#dcfce7', color: '#166534' };
      case 'orgánico': return { bg: '#fef9c3', color: '#854d0e' };
      case 'químico': return { bg: '#fee2e2', color: '#991b1b' };
      case 'biológico': return { bg: '#d1fae5', color: '#065f46' };
      case 'físico': return { bg: '#f3e8ff', color: '#6b21a8' };
      default: return { bg: '#f3f4f6', color: '#475569' };
    }
  };

  const getAccionColor = (accion: string) => {
    switch (accion?.toLowerCase().trim()) {
      case 'preventivo': return { bg: '#dbeafe', color: '#1e40af' };
      case 'curativo': return { bg: '#fce7f3', color: '#9d174d' };
      case 'sistémico': return { bg: '#e0e7ff', color: '#3730a3' };
      case 'erradicante': return { bg: '#fef2f2', color: '#b91c1c' };
      default: return { bg: '#f3f4f6', color: '#475569' };
    }
  };

  const getTratamientoIcon = (nombre: string, tipo: string) => {
    const n = (nombre || '').toLowerCase();
    if (n.includes('jabón')) return '🧼';
    if (n.includes('neem')) return '💧';
    if (n.includes('diatomeas')) return '🏜️';
    if (n.includes('ajo') || n.includes('guindilla')) return '🧄';
    if (n.includes('cola de caballo')) return '🌿';
    if (n.includes('cobre')) return '🥉';
    if (n.includes('azufre')) return '🟡';
    if (n.includes('bicarbonato')) return '🧂';
    if (n.includes('bacillus') || n.includes('bt')) return '🐛';
    if (n.includes('trichoderma')) return '🦠';
    if (n.includes('nematodos')) return '🪱';
    if (n.includes('ortigas')) return '🍵';

    switch (tipo?.toLowerCase()) {
      case 'ecológico': return '🍃';
      case 'químico': return '🧪';
      case 'preventivo': return '🛡️';
      case 'físico': return '✂️';
      default: return '💊';
    }
  };

  return (
    <>
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre o tipo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '14px 14px 14px 44px', borderRadius: '12px', 
              border: '1px solid #e2e8f0', fontSize: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        {loading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(255,255,255,0.65)', zIndex: 10,
            display: 'flex', justifyContent: 'center', alignItems: 'center', borderRadius: '16px'
          }}>
            <div className="loading-spinner" style={{ width: '40px', height: '40px', borderTopColor: '#3b82f6' }}></div>
          </div>
        )}

        {filteredTratamientos.length > 0 ? (
          <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto', opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Icono</th>
                  <PremiumTableHeader sortKey="tratamientosnombre" currentSortConfig={sortConfig} onSort={handleSort} label="Nombre" />
                  <PremiumTableHeader sortKey="tratamientostipo" currentSortConfig={sortConfig} onSort={handleSort} label="Naturaleza" />
                  <PremiumTableHeader sortKey="tratamientosaccion" currentSortConfig={sortConfig} onSort={handleSort} label="Modo de Acción" />
                  <PremiumTableHeader label="Vías de Aplicación" sortable={false} />
                  <PremiumTableHeader sortKey="_completeness" currentSortConfig={sortConfig} onSort={handleSort} label="Completitud" />
                  <PremiumTableHeader label="Acciones" sortable={false} style={{ textAlign: 'right' }} />
                </tr>
              </thead>
              <tbody>
                {sortedTratamientos.map((tratamiento, i) => {
                  const comp = getCompleteness(tratamiento);
                  const tipos = parseTags(tratamiento.tratamientostipo);
                  const acciones = parseTags(tratamiento.tratamientosaccion);
                  
                  return (
                    <tr key={tratamiento.idtratamientos} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                      <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: i % 2 === 0 ? 'white' : '#f8fafc', width: '80px', minWidth: '80px', textAlign: 'center', verticalAlign: 'middle', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/admin/tratamientos/${tratamiento.idtratamientos}`)} title="Editar Tratamiento">
                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: '2rem', overflow: 'hidden' }}>
                          {tratamiento.primaryPhoto ? (
                            <img src={getMediaUrl(tratamiento.primaryPhoto)} alt={tratamiento.tratamientosnombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            getTratamientoIcon(tratamiento.tratamientosnombre, tratamiento.tratamientostipo)
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                        {tratamiento.tratamientosnombre}
                        {!tratamiento.tratamientosactivo && <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: '#e2e8f0', color: '#64748b', padding: '2px 6px', borderRadius: '4px' }}>Inactivo</span>}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {tipos.length > 0 ? tipos.map(t => {
                            const c = getTipoColor(t);
                            return <span key={t} style={{ background: c.bg, color: c.color, padding: '3px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{t}</span>;
                          }) : <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {acciones.length > 0 ? acciones.map(a => {
                            const c = getAccionColor(a);
                            return <span key={a} style={{ background: c.bg, color: c.color, padding: '3px 8px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>{a}</span>;
                          }) : <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {tratamiento.partes && tratamiento.partes.length > 0 ? (
                            tratamiento.partes.map((p: any) => (
                              <span key={p.idplantasparte} title={p.plantaspartenombre} style={{
                                background: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: '4px'
                              }}>
                                <span>{p.plantasparteemoji}</span> {p.plantaspartenombre}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Sin definir</span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${comp.pct}%`, height: '100%', background: comp.color, borderRadius: '4px', transition: 'width 0.3s ease' }} />
                          </div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: comp.color, minWidth: '36px', textAlign: 'right' }}>{comp.pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
                          <PremiumEditButton onClick={() => router.push(`/dashboard/admin/tratamientos/${tratamiento.idtratamientos}`)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
              <span style={{ fontSize: '3rem' }}>🧪</span>
              <h3 style={{ color: '#475569', marginTop: '16px' }}>No hay tratamientos registrados</h3>
            </div>
          )
        )}
      </div>
    </>
  );
}
