import React from 'react';

interface AlimentacionTabProps {
  alimentacion: any[];
  setAlimentacion: React.Dispatch<React.SetStateAction<any[]>>;
  alimentacionDirty: boolean;
  setAlimentacionDirty: React.Dispatch<React.SetStateAction<boolean>>;
  masterAnimales: any[];
  masterPlantasPartes: any[];
  saveAlimentacionNow: (data: any[]) => Promise<void>;
  especieId: string | null;
  isMobile: boolean;
  TABLE_MIN_WIDTH: number;
  activeTab: string;
  alimentacionFiltroAnimal: string;
  setAlimentacionFiltroAnimal: React.Dispatch<React.SetStateAction<string>>;
  alimentacionFiltroAptitud: string;
  setAlimentacionFiltroAptitud: React.Dispatch<React.SetStateAction<string>>;
}

export default function AlimentacionTab({
  alimentacion,
  setAlimentacion,
  alimentacionDirty,
  setAlimentacionDirty,
  masterAnimales,
  masterPlantasPartes,
  saveAlimentacionNow,
  especieId,
  isMobile,
  TABLE_MIN_WIDTH,
  activeTab,
  alimentacionFiltroAnimal,
  setAlimentacionFiltroAnimal,
  alimentacionFiltroAptitud,
  setAlimentacionFiltroAptitud
}: AlimentacionTabProps) {
  return (
    <div style={{ display: activeTab === 'alimentacion' ? 'block' : 'none' }}>
      {/* Barra de filtros + Añadir */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', background: 'white', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', flexWrap: 'wrap', alignItems: 'center' }}>
        {alimentacion.length > 0 && (
          <>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b' }}>🔍 Filtrar:</span>
            <select
              value={alimentacionFiltroAnimal || ''}
              onChange={(e) => setAlimentacionFiltroAnimal(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
            >
              <option value="">Animal...</option>
              {masterAnimales.map((mc: any) => <option key={mc.idespeciesanimales} value={mc.idespeciesanimales}>{mc.especiesanimalesnombre}</option>)}
            </select>
            <select
              value={alimentacionFiltroAptitud || ''}
              onChange={(e) => setAlimentacionFiltroAptitud(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', color: '#475569', background: '#fff', cursor: 'pointer' }}
            >
              <option value="">Aptitud...</option>
              <option value="1">✅ Apto</option>
              <option value="2">⚠️ Moderado</option>
              <option value="0">❌ Tóxico</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setAlimentacionFiltroAnimal('');
                setAlimentacionFiltroAptitud('');
              }}
              style={{ padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#64748b', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              Restablecer
            </button>
            <div style={{ flex: 1 }} />
          </>
        )}
        <button
          type="button"
          onClick={() => {
            setAlimentacion([
              ...alimentacion,
              {
                idespeciesvegetalesanimales: null,
                xespeciesvegetalesanimalesidespeciesanimales: '',
                xespeciesvegetalesanimalesidplantasparte: '',
                especiesanimalesnombre: '',
                especiesanimalespartes: '',
                especiesanimalesconsumo: 1, // apto
                especiesanimalesnotas: ''
              }
            ]);
            setAlimentacionDirty(true);
          }}
          style={{ padding: '8px 16px', background: '#0f766e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Añadir Fila
        </button>
        {alimentacionDirty && (
          <button
            type="button"
            onClick={() => saveAlimentacionNow(alimentacion)}
            style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(16,185,129,0.4)' }}
          >
            💾 Guardar Alimentación
          </button>
        )}
      </div>

      {alimentacion.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
          <p style={{ color: '#64748b', fontSize: '1.1rem', margin: '0 0 10px 0' }}>No hay relaciones de alimentación registradas para animales.</p>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Usa el botón "✨ Asistente IA" para buscar qué animales consumen esta especie de forma segura.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: TABLE_MIN_WIDTH }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '12px', textAlign: 'center', width: '8%' }}>Acciones</th>
                <th style={{ padding: '12px', textAlign: 'left', width: '22%' }}>Especie Animal</th>
                <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Aptitud de Consumo</th>
                <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Parte Planta</th>
                <th style={{ padding: '12px', textAlign: 'left', width: '30%' }}>Notas / Advertencias</th>
              </tr>
            </thead>
            <tbody>
              {alimentacion.map((c, index) => {
                // Aplicar filtros locales
                if (alimentacionFiltroAnimal && String(c.xespeciesvegetalesanimalesidespeciesanimales) !== alimentacionFiltroAnimal) return null;
                if (alimentacionFiltroAptitud && String(c.especiesanimalesconsumo) !== alimentacionFiltroAptitud) return null;

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #e2e8f0', background: c.idespeciesvegetalesanimales === null ? '#fefce8' : 'transparent' }}>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={async () => {
                          const itemToDelete = alimentacion[index];
                          const newCon = [...alimentacion];
                          newCon.splice(index, 1);
                          setAlimentacion(newCon);
                          if (itemToDelete.idespeciesvegetalesanimales && especieId) {
                            try {
                              await fetch(`/api/admin/especiesvegetales/${especieId}/alimentacion?id=${itemToDelete.idespeciesvegetalesanimales}`, { method: 'DELETE' });
                            } catch (err) {
                              console.error('Error borrando alimentacion:', err);
                            }
                          }
                        }}
                        style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={c.xespeciesvegetalesanimalesidespeciesanimales || ''}
                        onChange={e => {
                          const newCon = [...alimentacion];
                          const val = e.target.value ? Number(e.target.value) : '';
                          newCon[index].xespeciesvegetalesanimalesidespeciesanimales = val;
                          const matchAnimal = masterAnimales.find(a => a.idespeciesanimales === val);
                          newCon[index].especiesanimalesnombre = matchAnimal ? matchAnimal.especiesanimalesnombre : '';
                          setAlimentacion(newCon);
                          setAlimentacionDirty(true);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {masterAnimales.map(a => (
                          <option key={a.idespeciesanimales} value={a.idespeciesanimales}>
                            {a.especiesanimalesnombre} ({a.especiesanimalesgrupo})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={c.especiesanimalesconsumo !== undefined ? c.especiesanimalesconsumo : ''}
                        onChange={e => {
                          const newCon = [...alimentacion];
                          newCon[index].especiesanimalesconsumo = e.target.value === '' ? '' : Number(e.target.value);
                          setAlimentacion(newCon);
                          setAlimentacionDirty(true);
                        }}
                        style={{
                          width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white',
                          fontWeight: 'bold',
                          color: c.especiesanimalesconsumo === 1 ? '#10b981' : c.especiesanimalesconsumo === 2 ? '#f59e0b' : c.especiesanimalesconsumo === 0 ? '#ef4444' : 'inherit'
                        }}
                      >
                        <option value="1">✅ Apto / Beneficioso</option>
                        <option value="2">⚠️ Moderado / Con Cautela</option>
                        <option value="0">❌ Tóxico / Evitar</option>
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <select
                        value={c.xespeciesvegetalesanimalesidplantasparte || (c.especiesanimalespartes ? (masterPlantasPartes.find(p => p.plantaspartenombre.toLowerCase() === c.especiesanimalespartes.toLowerCase())?.idplantasparte || '') : '')}
                        onChange={e => {
                          const newCon = [...alimentacion];
                          const val = e.target.value ? Number(e.target.value) : '';
                          newCon[index].xespeciesvegetalesanimalesidplantasparte = val;
                          const matchPart = masterPlantasPartes.find(p => p.idplantasparte === val);
                          newCon[index].especiesanimalespartes = matchPart ? matchPart.plantaspartenombre : '';
                          setAlimentacion(newCon);
                          setAlimentacionDirty(true);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white' }}
                      >
                        <option value="">-- Seleccionar --</option>
                        {masterPlantasPartes.map(pp => (
                          <option key={pp.idplantasparte} value={pp.idplantasparte}>
                            {pp.plantasparteemoji} {pp.plantaspartenombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <textarea
                        value={c.especiesanimalesnotas || ''}
                        onChange={e => {
                          const newCon = [...alimentacion];
                          newCon[index].especiesanimalesnotas = e.target.value;
                          setAlimentacion(newCon);
                          setAlimentacionDirty(true);
                        }}
                        style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px', resize: 'vertical', fontFamily: 'inherit' }}
                        rows={2}
                        placeholder="Tóxico en crudo, apto cocinado..."
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
