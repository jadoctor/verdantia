const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the old plaga list rendering with new editable grid layout
const oldPlagaList = `<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.plagas.map((p: any, idx: number) => (
                    <li key={idx} style={{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{p.plagasnombre}</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({p.plagastipo})</span> 
                        <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span> 
                        <span style={{ fontWeight: 'bold', textTransform: 'capitalize', color: p.especiesplagasnivelriesgo === 'alta' ? '#ef4444' : p.especiesplagasnivelriesgo === 'baja' ? '#10b981' : '#f59e0b' }}>Riesgo {p.especiesplagasnivelriesgo}</span>
                        {p.especiesplagasnotasespecificas ? \` - \${p.especiesplagasnotasespecificas}\` : ''}
                      </div>
                      <button type="button" onClick={() => {
                        const updated = { ...relaciones, plagas: relaciones.plagas.filter((_: any, i: number) => i !== idx) };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>Eliminar</button>
                    </li>
                  ))}`;

const newPlagaList = `<ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {relaciones.plagas.map((p: any, idx: number) => (
                    <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: '1fr auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <strong>{p.plagasnombre}</strong> <span style={{ color: '#64748b', fontSize: '0.85rem' }}>({p.plagastipo})</span>
                      </div>
                      <select value={p.especiesplagasnivelriesgo || 'media'} onChange={(e) => {
                        const updatedPlagas = relaciones.plagas.map((pl: any, i: number) => i === idx ? { ...pl, especiesplagasnivelriesgo: e.target.value } : pl);
                        const updated = { ...relaciones, plagas: updatedPlagas };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: p.especiesplagasnivelriesgo === 'alta' ? '#ef4444' : p.especiesplagasnivelriesgo === 'baja' ? '#10b981' : '#f59e0b', cursor: 'pointer', minWidth: '130px' }}>
                        <option value="baja">🟢 Riesgo Bajo</option>
                        <option value="media">🟡 Riesgo Medio</option>
                        <option value="alta">🔴 Riesgo Alto</option>
                      </select>
                      <input type="text" value={p.especiesplagasnotasespecificas || ''} placeholder="Descripción del daño..." onChange={(e) => {
                        const updatedPlagas = relaciones.plagas.map((pl: any, i: number) => i === idx ? { ...pl, especiesplagasnotasespecificas: e.target.value } : pl);
                        setRelaciones({ ...relaciones, plagas: updatedPlagas });
                        setRelacionesDirty(true);
                      }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      <button type="button" onClick={() => {
                        const updated = { ...relaciones, plagas: relaciones.plagas.filter((_: any, i: number) => i !== idx) };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                    </li>
                  ))}`;

if (content.includes(oldPlagaList)) {
  content = content.replace(oldPlagaList, newPlagaList);
  console.log('Plaga list replaced successfully.');
} else {
  console.log('Could not find exact match. Trying regex...');
  // Use regex to find and replace
  content = content.replace(
    /(<ul style=\{\{ listStyle: 'none', padding: 0, margin: 0 \}\}>\s*\{relaciones\.plagas\.map\(\(p: any, idx: number\) =>[\s\S]*?}>Eliminar<\/button>\s*<\/li>\s*\)\))\}/,
    newPlagaList + '}'
  );
  console.log('Regex replacement attempted.');
}

fs.writeFileSync(file, content);
