import React from 'react';

interface SinonimoItem {
  idespeciesvegetalessinonimos: string | number | null;
  especiessinonimosnombre: string;
  xespeciesvegetalessinonimosididiomas: string | number;
  xespeciesvegetalessinonimosidpaises: string | number;
  especiessinonimosnotas?: string;
  especiessinonimostexto?: string;
}

interface TaxonomiaTabProps {
  sinonimos: SinonimoItem[];
  setSinonimos: React.Dispatch<React.SetStateAction<SinonimoItem[]>>;
  sinonimosDirty: boolean;
  setSinonimosDirty: React.Dispatch<React.SetStateAction<boolean>>;
  masterIdiomas: any[];
  masterPaises: any[];
  saveSinonimosNow: () => Promise<void>;
  sinonimosAiLoading: boolean;
  especieId: string | null;
  TABLE_MIN_WIDTH: number;
  activeTab: string;
}

export default function TaxonomiaTab({
  sinonimos,
  setSinonimos,
  sinonimosDirty,
  setSinonimosDirty,
  masterIdiomas,
  masterPaises,
  saveSinonimosNow,
  sinonimosAiLoading,
  especieId,
  TABLE_MIN_WIDTH,
  activeTab
}: TaxonomiaTabProps) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'taxonomia' ? 'grid' : 'none' }}>
      {/* SECCIÓN SINÓNIMOS */}
      <div className="form-group full" style={{ marginTop: '10px', paddingTop: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>🗣️ Sinónimos y Nombres Locales</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setSinonimos([
                  ...sinonimos,
                  {
                    idespeciesvegetalessinonimos: null,
                    especiessinonimosnombre: '',
                    xespeciesvegetalessinonimosididiomas: '',
                    xespeciesvegetalessinonimosidpaises: '',
                    especiessinonimosnotas: ''
                  }
                ]);
                setSinonimosDirty(true);
              }}
              style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              + Añadir Manualmente
            </button>
            {sinonimosDirty && (
              <button
                type="button"
                onClick={saveSinonimosNow}
                style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.4)' }}
              >
                💾 Guardar Cambios
              </button>
            )}
          </div>
        </div>

        {sinonimos.length === 0 && !sinonimosAiLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
            <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay sinónimos registrados.</p>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Usa el botón "✨ Asistente IA" de la barra superior para que la Inteligencia Artificial busque sinónimos por ti.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: TABLE_MIN_WIDTH }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '12px', textAlign: 'center', width: '10%' }}>Acciones</th>
                  <th style={{ padding: '12px', textAlign: 'left', width: '30%' }}>Nombre / Sinónimo</th>
                  <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Idioma</th>
                  <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>País / Región</th>
                  <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Notas</th>
                </tr>
              </thead>
              <tbody>
                {sinonimos.map((s, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: s.idespeciesvegetalessinonimos === null ? '#fefce8' : 'transparent' }}>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          const sinToDelete = sinonimos[index];
                          const newSin = [...sinonimos];
                          newSin.splice(index, 1);
                          setSinonimos(newSin);
                          if (sinToDelete.idespeciesvegetalessinonimos && especieId) {
                            try {
                              await fetch(`/api/admin/especiesvegetales/${especieId}/sinonimos?id=${sinToDelete.idespeciesvegetalessinonimos}`, { method: 'DELETE' });
                            } catch (err) {
                              console.error('Error borrando sinónimo:', err);
                            }
                          }
                        }}
                        style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={s.especiessinonimosnombre}
                        onChange={e => {
                          const newSin = [...sinonimos];
                          newSin[index].especiessinonimosnombre = e.target.value;
                          setSinonimos(newSin);
                          setSinonimosDirty(true);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        placeholder="Ej. Palta"
                      />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={s.xespeciesvegetalessinonimosididiomas || ''}
                        onChange={e => {
                          const newSin = [...sinonimos];
                          newSin[index].xespeciesvegetalessinonimosididiomas = e.target.value;
                          setSinonimos(newSin);
                          setSinonimosDirty(true);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="">-- Sin especificar --</option>
                        {masterIdiomas.map(i => (
                          <option key={i.ididiomas} value={i.ididiomas}>{i.idiomasnombre}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={s.xespeciesvegetalessinonimosidpaises || ''}
                        onChange={e => {
                          const newSin = [...sinonimos];
                          newSin[index].xespeciesvegetalessinonimosidpaises = e.target.value;
                          setSinonimos(newSin);
                          setSinonimosDirty(true);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                      >
                        <option value="">-- Sin especificar --</option>
                        {masterPaises.map(p => (
                          <option key={p.idpaises} value={p.idpaises}>{p.paisesnombre}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input
                        type="text"
                        value={s.especiessinonimosnotas || s.especiessinonimostexto || ''}
                        onChange={e => {
                          const newSin = [...sinonimos];
                          newSin[index].especiessinonimosnotas = e.target.value;
                          newSin[index].especiessinonimostexto = e.target.value;
                          setSinonimos(newSin);
                          setSinonimosDirty(true);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                        placeholder="Notas opcionales"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
