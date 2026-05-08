const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace the calculator block
const oldCalc = `{/* CALCULADORA */}
              {(() => {
                const pFresco = parseFloat(formData.especiesautosuficiencia) || 0;
                const pConserva = parseFloat(formData.especiesautosuficienciaconserva) || 0;
                const totalPFresco = pFresco * calcPersonas;
                const totalPConserva = pConserva * calcPersonas;`;

const newCalc = `{/* CALCULADORA */}
              {(() => {
                const pParcial = parseFloat(formData.especiesautosuficienciaparcial) || 0;
                const pFresco = parseFloat(formData.especiesautosuficiencia) || 0;
                const pConserva = parseFloat(formData.especiesautosuficienciaconserva) || 0;
                const totalPParcial = pParcial * calcPersonas;
                const totalPFresco = pFresco * calcPersonas;
                const totalPConserva = pConserva * calcPersonas;`;

content = content.replace(oldCalc, newCalc);

// Add m2Parcial calculation
content = content.replace(
  'const m2Fresco = totalPFresco * areaPlant;\r\n                const m2Conserva = totalPConserva * areaPlant;',
  'const m2Parcial = totalPParcial * areaPlant;\r\n                const m2Fresco = totalPFresco * areaPlant;\r\n                const m2Conserva = totalPConserva * areaPlant;'
);

// Replace the 2-card grid with 3-card grid
content = content.replace(
  "gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'",
  "gridTemplateColumns: 'repeat(3, 1fr)'"
);

// Replace old "Solo Consumo en Fresco" card title and add Parcial card before it
const oldFirstCard = `<div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>\u{1F331} Solo Consumo en Fresco</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPFresco.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Fresco > 0 ? \`\${m2Fresco.toFixed(2)} m\u00B2\` : '--- m\u00B2'}</strong>
                      </div>`;

const newFirstCards = `<div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>\u{1F331} Parcial</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPParcial.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Parcial > 0 ? \`\${m2Parcial.toFixed(2)} m\u00B2\` : '--- m\u00B2'}</strong>
                      </div>

                      <div style={{ background: '#fff', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#15803d', borderBottom: '1px solid #bbf7d0', paddingBottom: '10px' }}>\u{1F96C} Completa</h4>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Plantas Necesarias</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d', display: 'block', marginBottom: '10px' }}>{totalPFresco.toFixed(1)}</strong>
                        <span style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>Terreno Necesario</span>
                        <strong style={{ fontSize: '1.8rem', color: '#15803d' }}>{m2Fresco > 0 ? \`\${m2Fresco.toFixed(2)} m\u00B2\` : '--- m\u00B2'}</strong>
                      </div>`;

content = content.replace(oldFirstCard, newFirstCards);

// Rename the conserva card
content = content.replace(
  '\u{1F96B} Fresco + Conserva (Total)</h4>',
  '\u{1F96B} Conserva</h4>'
);
content = content.replace('Plantas Totales Necesarias', 'Plantas Necesarias');
content = content.replace('Terreno Total Necesario', 'Terreno Necesario');

fs.writeFileSync(file, content);
console.log('Calculator updated to 3 cards.');
