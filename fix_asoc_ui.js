const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace beneficiosas list items
content = content.replace(
  /\{relaciones\.beneficiosas\.map\(\(b: any, idx: number\) => \(\r\n\s*<li key=\{idx\} style=\{\{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' \}\}>\r\n\s*<div><strong>\{b\.especie_destino_nombre\}<\/strong> \{b\.asociacionesbeneficiosasmotivo \? `- \$\{b\.asociacionesbeneficiosasmotivo\}` : ''\}<\/div>\r\n\s*<button type="button" onClick=\{\(\) => \{\r\n\s*const updated = \{ \.\.\.relaciones, beneficiosas: relaciones\.beneficiosas\.filter\(\(_: any, i: number\) => i !== idx\) \};\r\n\s*setRelaciones\(updated\);\r\n\s*saveRelacionesNow\(updated\);\r\n\s*\}\} style=\{\{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' \}\}>Eliminar<\/button>\r\n\s*<\/li>\r\n\s*\)\)}/,
  `{relaciones.beneficiosas.map((b: any, idx: number) => (
                    <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                      <div><strong>{b.especie_destino_nombre}</strong></div>
                      <input type="text" value={b.asociacionesbeneficiosasmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e) => {
                        const updatedBen = relaciones.beneficiosas.map((bb: any, i: number) => i === idx ? { ...bb, asociacionesbeneficiosasmotivo: e.target.value } : bb);
                        setRelaciones({ ...relaciones, beneficiosas: updatedBen });
                        setRelacionesDirty(true);
                      }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      <button type="button" onClick={() => {
                        const updated = { ...relaciones, beneficiosas: relaciones.beneficiosas.filter((_: any, i: number) => i !== idx) };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>\u{1F5D1}\u{FE0F}</button>
                    </li>
                  ))}`
);

// Replace perjudiciales list items
content = content.replace(
  /\{relaciones\.perjudiciales\.map\(\(p: any, idx: number\) => \(\r\n\s*<li key=\{idx\} style=\{\{ padding: '10px', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' \}\}>\r\n\s*<div><strong>\{p\.especie_destino_nombre\}<\/strong> \{p\.asociacionesperjudicialesmotivo \? `- \$\{p\.asociacionesperjudicialesmotivo\}` : ''\}<\/div>\r\n\s*<button type="button" onClick=\{\(\) => \{\r\n\s*const updated = \{ \.\.\.relaciones, perjudiciales: relaciones\.perjudiciales\.filter\(\(_: any, i: number\) => i !== idx\) \};\r\n\s*setRelaciones\(updated\);\r\n\s*saveRelacionesNow\(updated\);\r\n\s*\}\} style=\{\{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' \}\}>Eliminar<\/button>\r\n\s*<\/li>\r\n\s*\)\)}/,
  `{relaciones.perjudiciales.map((p: any, idx: number) => (
                    <li key={idx} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '12px', alignItems: 'center' }}>
                      <div><strong>{p.especie_destino_nombre}</strong></div>
                      <input type="text" value={p.asociacionesperjudicialesmotivo || ''} placeholder="Motivo de la asociación..." onChange={(e) => {
                        const updatedPer = relaciones.perjudiciales.map((pp: any, i: number) => i === idx ? { ...pp, asociacionesperjudicialesmotivo: e.target.value } : pp);
                        setRelaciones({ ...relaciones, perjudiciales: updatedPer });
                        setRelacionesDirty(true);
                      }} onBlur={() => { saveRelacionesNow(relaciones); }} style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                      <button type="button" onClick={() => {
                        const updated = { ...relaciones, perjudiciales: relaciones.perjudiciales.filter((_: any, i: number) => i !== idx) };
                        setRelaciones(updated);
                        saveRelacionesNow(updated);
                      }} style={{ color: '#ef4444', border: 'none', background: '#fee2e2', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>\u{1F5D1}\u{FE0F}</button>
                    </li>
                  ))}`
);

fs.writeFileSync(file, content);
console.log('Asociaciones updated with editable motivo fields.');
