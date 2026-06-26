const fs = require('fs');

const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  { search: /plagas: any\[\]/g, replace: 'afecciones: any[]' },
  { search: /plagas: \[\]/g, replace: 'afecciones: []' },
  { search: /plagas: true/g, replace: 'afecciones: true' },
  { search: /plagas: false/g, replace: 'afecciones: false' },
  { search: /masterPlagas/g, replace: 'masterAfecciones' },
  { search: /setMasterPlagas/g, replace: 'setMasterAfecciones' },
  { search: /'\/api\/admin\/plagas'/g, replace: "'/api/admin/afecciones'" },
  { search: /data\.plagas/g, replace: 'data.afecciones' },
  { search: /idplagas/g, replace: 'idafecciones' },
  { search: /plagasnombre/g, replace: 'afeccionesnombre' },
  { search: /plagastipo/g, replace: 'afeccionescategoria' },
  { search: /plagasestado/g, replace: 'afeccionesactivo' },
  { search: /xespeciesplagasidplagas/g, replace: 'xespeciesafeccionesidafecciones' },
  { search: /xrelacionesplagasideplaga/g, replace: 'xespeciesafeccionesidafecciones' },
  { search: /especiesplagasnivelriesgo/g, replace: 'especiesafeccionesnivelriesgo' },
  { search: /especiesplagasnotasespecificas/g, replace: 'especiesafeccionesnotasespecificas' },
  { search: /🐛 Plagas y Enf\./g, replace: '🦠 Afecciones' },
  { search: /'plagas'/g, replace: "'afecciones'" },
  { search: /relaciones\.plagas/g, replace: 'relaciones.afecciones' },
  { search: /newPla/g, replace: 'newAfe' },
  { search: /masterP\./g, replace: 'masterA.' },
  { search: /masterP =/g, replace: 'masterA =' },
  { search: /masterP\[/g, replace: 'masterA[' },
  { search: /pla\?/g, replace: 'afe?' },
  { search: /pla\./g, replace: 'afe.' },
  { search: /pl\./g, replace: 'af.' },
  { search: /pl \=\>/g, replace: 'af =>' },
  { search: /p\.afeccionesnombre/g, replace: 'af.afeccionesnombre' },
  { search: /p\.afeccionescategoria/g, replace: 'af.afeccionescategoria' },
  { search: /p\.idafecciones/g, replace: 'af.idafecciones' },
  { search: /aiConfigTabs\.plagas/g, replace: 'aiConfigTabs.afecciones' },
  { search: /aiProposal\.plagas_asociadas/g, replace: 'aiProposal.afecciones_asociadas' },
  { search: /proposal\.plagas_asociadas/g, replace: 'proposal.afecciones_asociadas' },
  { search: /SECCIÓN PLAGAS/g, replace: 'SECCIÓN AFECCIONES' },
  { search: /Plagas \/ Enfermedades Asociadas/g, replace: 'Afecciones Asociadas' },
  { search: /Selecciona plaga o enfermedad/g, replace: 'Selecciona afección' },
  { search: /Añadir Plaga/g, replace: 'Añadir Afección' }
];

for (const { search, replace } of replacements) {
  content = content.replace(search, replace);
}

// Fix any lingering 'p' references in the map function that got partially renamed
content = content.replace(/\{p\./g, '{af.');
content = content.replace(/\(p\)/g, '(af)');
content = content.replace(/\(p =\>/g, '(af =>');
content = content.replace(/p\?/g, 'af?');

fs.writeFileSync(file, content, 'utf8');
console.log('EspecieForm.tsx updated!');
