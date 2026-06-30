import React from 'react';

interface AsociacionesTabProps {
  relaciones: {
    beneficiosas: any[];
    perjudiciales: any[];
    afecciones: any[];
  };
  setRelaciones: React.Dispatch<React.SetStateAction<any>>;
  setRelacionesDirty: React.Dispatch<React.SetStateAction<boolean>>;
  relacionesSaveStatus: 'idle' | 'saving' | 'saved' | 'no-changes';
  masterEspecies: any[];
  masterAfecciones: any[];
  saveRelacionesNow: (updatedData: any) => Promise<void>;
  especieId: string | null;
  isMobile: boolean;
  activeTab: string;
}

export default function AsociacionesTab({
  relaciones,
  setRelaciones,
  setRelacionesDirty,
  relacionesSaveStatus,
  masterEspecies,
  masterAfecciones,
  saveRelacionesNow,
  especieId,
  isMobile,
  activeTab
}: any) {
  return (
    <div className="grid-form" style={{ display: activeTab === 'asociaciones' ? 'grid' : 'none' }}>
      <div className="form-group full">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Asociaciones Beneficiosas</h4>
          {relacionesSaveStatus !== 'idle' && (
            <span style={{
              fontSize: '0.85rem', fontWeight: 'bold', padding: '4px 10px', borderRadius: '12px',
              color: relacionesSaveStatus === 'no-changes' ? '#10b981' : '#64748b',
              background: relacionesSaveStatus === 'no-changes' ? '#dcfce7' : '#f1f5f9',
              transition: 'all 0.3s'
            }}>
              {relacionesSaveStatus === 'saving' ? '⏳ Guardando...' : '✓ Guardado'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <select id="selBen" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="">Selecciona especie...</option>
            {masterEspecies.filter((e: any) => e.idespeciesvegetales.toString() !== especieId).map((e: any) => <option key={e.idespeciesvegetales} value={e.idespeciesvegetales}>{e.especiesvegetalesnombre}</option>)}
          </select>
          <input type="text" id="motivoBen" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          <button type="button" onClick={() => {
            const sel = document.getElementById('selBen') as HTMLSelectElement | null;
            const mot = document.getElementById('motivoBen') as HTMLInputElement | null;
            if (!sel || !sel.value) return;
            if (relaciones.beneficiosas.some((b: any) => b.xasociacionesbeneficiosasidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
            const sp = masterEspecies.find((e: any) => e.idespeciesvegetales.toString() === sel.value);
            const updated = {
              ...relaciones,
              beneficiosas: [...relaciones.beneficiosas, {
                xasociacionesbeneficiosasidespeciedestino: parseInt(sel.value),
                especie_destino_nombre: sp?.especiesvegetalesnombre,
                asociacionesbeneficiosasmotivo: mot?.value || ''
              }]
            };
            setRelaciones(updated);
            saveRelacionesNow(updated);
            if (sel) sel.value = '';
            if (mot) mot.value = '';
          }} style={{ padding: '8px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {relaciones.beneficiosas.map((b: any, idx: number) => (
            <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
              <div><strong>{b.especie_destino_nombre}</strong></div>
              <input type="text" value={b.asociacionesbeneficiosasmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const updatedBen = relaciones.beneficiosas.map((bb: any, i: number) => i === idx ? { ...bb, asociacionesbeneficiosasmotivo: e.target.value } : bb);
                setRelaciones({ ...relaciones, beneficiosas: updatedBen });
                setRelacionesDirty(true);
              }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <button type="button" onClick={() => {
                const updated = { ...relaciones, beneficiosas: relaciones.beneficiosas.filter((_: any, i: number) => i !== idx) };
                setRelaciones(updated);
                saveRelacionesNow(updated);
              }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
            </li>
          ))}
          {relaciones.beneficiosas.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones beneficiosas.</p>}
        </ul>
      </div>

      <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', marginBottom: '10px' }}>Asociaciones Perjudiciales</h4>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <select id="selPer" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="">Selecciona especie...</option>
            {masterEspecies.filter((e: any) => e.idespeciesvegetales.toString() !== especieId).map((e: any) => <option key={e.idespeciesvegetales} value={e.idespeciesvegetales}>{e.especiesvegetalesnombre}</option>)}
          </select>
          <input type="text" id="motivoPer" placeholder="Motivo (opcional)" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          <button type="button" onClick={() => {
            const sel = document.getElementById('selPer') as HTMLSelectElement | null;
            const mot = document.getElementById('motivoPer') as HTMLInputElement | null;
            if (!sel || !sel.value) return;
            if (relaciones.perjudiciales.some((p: any) => p.xasociacionesperjudicialesidespeciedestino.toString() === sel.value)) { alert('Ya añadida'); return; }
            const sp = masterEspecies.find((e: any) => e.idespeciesvegetales.toString() === sel.value);
            const updated = {
              ...relaciones,
              perjudiciales: [...relaciones.perjudiciales, {
                xasociacionesperjudicialesidespeciedestino: parseInt(sel.value),
                especie_destino_nombre: sp?.especiesvegetalesnombre,
                asociacionesperjudicialesmotivo: mot?.value || ''
              }]
            };
            setRelaciones(updated);
            saveRelacionesNow(updated);
            if (sel) sel.value = '';
            if (mot) mot.value = '';
          }} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {relaciones.perjudiciales.map((p: any, idx: number) => (
            <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
              <div><strong>{p.especie_destino_nombre}</strong></div>
              <input type="text" value={p.asociacionesperjudicialesmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const updatedPer = relaciones.perjudiciales.map((pp: any, i: number) => i === idx ? { ...pp, asociacionesperjudicialesmotivo: e.target.value } : pp);
                setRelaciones({ ...relaciones, perjudiciales: updatedPer });
                setRelacionesDirty(true);
              }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <button type="button" onClick={() => {
                const updated = { ...relaciones, perjudiciales: relaciones.perjudiciales.filter((_: any, i: number) => i !== idx) };
                setRelaciones(updated);
                saveRelacionesNow(updated);
              }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
            </li>
          ))}
          {relaciones.perjudiciales.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay asociaciones perjudiciales.</p>}
        </ul>
      </div>

      {/* SECCIÓN AFECCIONES */}
      <div className="form-group full" style={{ marginTop: '20px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', marginBottom: '10px' }}>Afecciones Asociadas</h4>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <select id="selPla" style={{ flex: 1, minWidth: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="">Selecciona afección...</option>
            {masterAfecciones.map((p: any) => <option key={p.idafecciones} value={p.idafecciones}>{p.afeccionesnombre} ({p.afeccionescategoria})</option>)}
          </select>
          <select id="riesgoPla" style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
            <option value="baja">Riesgo Bajo</option>
            <option value="media">Riesgo Medio</option>
            <option value="alta">Riesgo Alto</option>
          </select>
          <input type="text" id="notasPla" placeholder="Notas (opcional)" style={{ flex: 2, minWidth: '200px', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
          <button type="button" onClick={() => {
            const sel = document.getElementById('selPla') as HTMLSelectElement | null;
            const r = document.getElementById('riesgoPla') as HTMLSelectElement | null;
            const n = document.getElementById('notasPla') as HTMLInputElement | null;
            if (!sel || !sel.value) return;
            if (relaciones.afecciones.some((p: any) => p.xespeciesvegetalesplagasidafecciones.toString() === sel.value)) { alert('Ya añadida'); return; }
            const pla = masterAfecciones.find((p: any) => p.idafecciones.toString() === sel.value);
            const updated = {
              ...relaciones,
              afecciones: [...relaciones.afecciones, {
                xespeciesvegetalesplagasidafecciones: parseInt(sel.value),
                afeccionesnombre: pla?.afeccionesnombre,
                afeccionescategoria: pla?.afeccionescategoria,
                especiesafeccionesnivelriesgo: r?.value || 'media',
                especiesafeccionesnotasespecificas: n?.value || ''
              }]
            };
            setRelaciones(updated);
            saveRelacionesNow(updated);
            if (sel) sel.value = '';
            if (n) n.value = '';
            if (r) r.value = 'media';
          }} style={{ padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Añadir Afección</button>
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {relaciones.afecciones.map((p: any, idx: number) => (
            <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'auto auto 1fr auto', gap: '12px', alignItems: 'center' }}>
              <div>
                <strong>{p.afeccionesnombre}</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({p.afeccionescategoria})</span>
              </div>
              <select value={p.especiesafeccionesnivelriesgo || 'media'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                const updatedPlagas = relaciones.afecciones.map((pl: any, i: number) => i === idx ? { ...pl, especiesafeccionesnivelriesgo: e.target.value } : pl);
                const updated = { ...relaciones, afecciones: updatedPlagas };
                setRelaciones(updated);
                saveRelacionesNow(updated);
              }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: p.especiesafeccionesnivelriesgo === 'alta' ? '#ef4444' : p.especiesafeccionesnivelriesgo === 'baja' ? '#10b981' : '#f59e0b', cursor: 'pointer', minWidth: '130px' }}>
                <option value="baja">🟢 Riesgo Bajo</option>
                <option value="media">🟡 Riesgo Medio</option>
                <option value="alta">🔴 Riesgo Alto</option>
              </select>
              <input type="text" value={p.especiesafeccionesnotasespecificas || ''} placeholder="Descripción del daño..." onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const updatedPlagas = relaciones.afecciones.map((pl: any, i: number) => i === idx ? { ...pl, especiesafeccionesnotasespecificas: e.target.value } : pl);
                setRelaciones({ ...relaciones, afecciones: updatedPlagas });
                setRelacionesDirty(true);
              }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <button type="button" onClick={() => {
                const updated = { ...relaciones, afecciones: relaciones.afecciones.filter((_: any, i: number) => i !== idx) };
                setRelaciones(updated);
                saveRelacionesNow(updated);
              }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
            </li>
          ))}
          {relaciones.afecciones.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>No hay plagas vinculadas.</p>}
        </ul>
      </div>
    </div>
  );
}
