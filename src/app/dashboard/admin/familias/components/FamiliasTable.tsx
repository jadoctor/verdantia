import React from 'react';
import { FamiliaList } from '../types';

interface FamiliasTableProps {
  familias: FamiliaList[];
  loading: boolean;
  focusedRowId: number | null;
  handleEdit: (id: number) => void;
  handleToggleActive: (id: number, currentActive: number) => void;
  handleHardDelete: (id: number, nombre: string) => void;
  sortConfig?: { key: string, direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
}

export function FamiliasTable({
  familias, loading, focusedRowId, handleEdit, handleToggleActive, handleHardDelete, sortConfig, onSort
}: FamiliasTableProps) {
  const calculateCompletion = (f: FamiliaList) => {
    const parseArrayField = (val: any) => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.replace(/[\[\]"]/g, '').split(',').filter(Boolean);
      return [val];
    };

    const validFields = [
      !!f.familiasnombrecientifico,
      !!f.familiasgruporotacion,
      typeof f.familiasanosdescanso === 'number' && f.familiasanosdescanso > 0,
      !!f.familiasemoji,
      !!f.familiascolor,
      !!f.familiasdescripcion,
      parseArrayField(f.familiasprecedentes).length > 0,
      parseArrayField(f.familiassucesores).length > 0,
      !!f.familiasnotas
    ];
    const validCount = validFields.filter(Boolean).length;
    return Math.round((validCount / validFields.length) * 100);
  };

  const renderSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span style={{ color: '#cbd5e1', marginLeft: '4px', fontSize: '0.8rem' }}>↕️</span>;
    return sortConfig.direction === 'asc' ? <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔼</span> : <span style={{ marginLeft: '4px', fontSize: '0.8rem' }}>🔽</span>;
  };

  const getHeaderStyle = (key: string) => ({
    padding: '12px 16px',
    textAlign: 'left' as const,
    fontWeight: 700,
    color: '#374151',
    whiteSpace: 'nowrap' as const,
    cursor: 'pointer',
    userSelect: 'none' as const
  });

  return (
    <div style={{ position: 'relative', padding: '0 20px 20px' }}>
      {/* Overlay de carga (Regla 7: sin desmontar tabla) */}
      {loading && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(255,255,255,0.65)', display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 10, borderRadius: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#059669',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}

      <div style={{ overflowX: 'auto', width: '100%', opacity: loading ? 0.6 : 1, transition: 'opacity 0.3s' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap', position: 'sticky', left: 0, zIndex: 2, background: '#f1f5f9' }}></th>
              <th onClick={() => onSort && onSort('familiasnombre')} style={getHeaderStyle('familiasnombre')}>Familia {renderSortIndicator('familiasnombre')}</th>
              <th onClick={() => onSort && onSort('familiasnombrecientifico')} style={getHeaderStyle('familiasnombrecientifico')}>N. Científico {renderSortIndicator('familiasnombrecientifico')}</th>
              <th onClick={() => onSort && onSort('familiasgruporotacion')} style={getHeaderStyle('familiasgruporotacion')}>Grupo Rotación {renderSortIndicator('familiasgruporotacion')}</th>
              <th onClick={() => onSort && onSort('familiasanosdescanso')} style={{ ...getHeaderStyle('familiasanosdescanso'), textAlign: 'center' }}>Años {renderSortIndicator('familiasanosdescanso')}</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Completado</th>
              <th onClick={() => onSort && onSort('total_especies')} style={{ ...getHeaderStyle('total_especies'), textAlign: 'center' }}>Especies {renderSortIndicator('total_especies')}</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Color</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {familias.length === 0 && !loading && (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🧬</div>
                  No hay familias para mostrar
                </td>
              </tr>
            )}
            {familias.map((f, idx) => (
              <tr key={f.idfamilias}
                id={`familia-row-${f.idfamilias}`}
                style={{
                  background: focusedRowId === f.idfamilias ? '#d1fae5' : (idx % 2 === 0 ? 'white' : '#f8fafc'),
                  borderBottom: '1px solid #f1f5f9',
                  opacity: f.familiasactivosino === 0 ? 0.55 : 1,
                  transition: 'background 0.5s',
                  boxShadow: focusedRowId === f.idfamilias ? 'inset 0 0 0 2px #10b981' : 'none',
                }}
                onMouseOver={e => { if (focusedRowId !== f.idfamilias) e.currentTarget.style.background = '#f0fdf4'; }}
                onMouseOut={e => { if (focusedRowId !== f.idfamilias) e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8fafc'; }}
              >
                {/* Emoji */}
                <td style={{ padding: '8px', position: 'sticky', left: 0, zIndex: 1, background: 'inherit', width: '80px', minWidth: '80px', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleEdit(f.idfamilias)} title="Editar Familia">
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', margin: '0 auto', fontSize: '2rem', background: '#f1f5f9' }}>
                    {f.familiasemoji}
                  </div>
                </td>
                {/* Nombre */}
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                  {f.familiasnombre}
                  {f.familiasactivosino === 0 && (
                    <span style={{ marginLeft: '8px', fontSize: '0.7rem', background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '10px' }}>Inactiva</span>
                  )}
                </td>
                {/* Científico */}
                <td style={{ padding: '12px 16px', color: '#64748b', fontStyle: 'italic' }}>
                  {f.familiasnombrecientifico || '—'}
                </td>
                {/* Grupo */}
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: '#f1f5f9', padding: '4px 10px', borderRadius: '12px',
                    fontSize: '0.8rem', fontWeight: 600, color: '#475569',
                  }}>
                    {f.familiasgruporotacion}
                  </span>
                </td>
                {/* Años */}
                <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                  {f.familiasanosdescanso}
                </td>
                {/* Completado */}
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  {(() => {
                    const pct = calculateCompletion(f);
                    const is100 = pct === 100;
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: is100 ? '#047857' : '#b45309' }}>
                          {pct}%
                        </span>
                        <div style={{ width: '40px', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: is100 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '3px' }} />
                        </div>
                      </div>
                    );
                  })()}
                </td>
                {/* Especies */}
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span style={{
                    background: f.total_especies > 0 ? '#dbeafe' : '#f1f5f9',
                    color: f.total_especies > 0 ? '#1d4ed8' : '#94a3b8',
                    padding: '4px 12px', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    {f.total_especies}
                  </span>
                </td>
                {/* Color */}
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{
                    width: '28px', height: '28px', borderRadius: '50%', background: f.familiascolor,
                    margin: '0 auto', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                  }} title={f.familiascolor} />
                </td>
                {/* Acciones */}
                <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    <button onClick={() => handleEdit(f.idfamilias)} title="Editar"
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>
                      ✏️ Editar
                    </button>
                    {f.familiasactivosino === 1 ? (
                      <button onClick={() => handleToggleActive(f.idfamilias, 1)} title="Inhabilitar"
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fbbf24', background: '#fef3c7', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
                        ⏸️
                      </button>
                    ) : (
                      <button onClick={() => handleToggleActive(f.idfamilias, 0)} title="Reactivar"
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #34d399', background: '#d1fae5', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#065f46' }}>
                        ▶️
                      </button>
                    )}
                    <button onClick={() => handleHardDelete(f.idfamilias, f.familiasnombre)} title="Eliminar"
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: '#fee2e2', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#991b1b' }}>
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
