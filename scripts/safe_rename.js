const fs = require('fs');
const file = 'src/components/admin/EspecieForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const safeReplacements = [
  // State
  { search: /plagas: any\[\]/g, replace: 'afecciones: any[]' },
  { search: /plagas: \[\]/g, replace: 'afecciones: []' },
  { search: /plagas: true/g, replace: 'afecciones: true' },
  { search: /masterPlagas/g, replace: 'masterAfecciones' },
  { search: /setMasterPlagas/g, replace: 'setMasterAfecciones' },

  // API endpoints
  { search: /'\/api\/admin\/plagas'/g, replace: "'/api/admin/afecciones'" },
  { search: /data\.plagas/g, replace: 'data.afecciones' },

  // Properties of the object
  { search: /idplagas/g, replace: 'idafecciones' },
  { search: /plagasnombre/g, replace: 'afeccionesnombre' },
  { search: /plagastipo/g, replace: 'afeccionescategoria' },
  { search: /xespeciesplagasidplagas/g, replace: 'xespeciesafeccionesidafecciones' },
  { search: /xrelacionesplagasideplaga/g, replace: 'xespeciesafeccionesidafecciones' },
  { search: /especiesplagasnivelriesgo/g, replace: 'especiesafeccionesnivelriesgo' },
  { search: /especiesplagasnotasespecificas/g, replace: 'especiesafeccionesnotasespecificas' },

  // UI Texts
  { search: /🐛 Plagas y Enf\./g, replace: '🦠 Afecciones' },
  { search: /'plagas'/g, replace: "'afecciones'" },
  { search: /activeTab === 'plagas'/g, replace: "activeTab === 'afecciones'" },

  // Relations array
  { search: /relaciones\.plagas/g, replace: 'relaciones.afecciones' },
  { search: /newPla/g, replace: 'newAfe' },
  
  // AI assistant mapping
  { search: /aiConfigTabs\.plagas/g, replace: 'aiConfigTabs.afecciones' },
  { search: /aiProposal\.plagas_asociadas/g, replace: 'aiProposal.afecciones_asociadas' },
  { search: /proposal\.plagas_asociadas/g, replace: 'proposal.afecciones_asociadas' },
  
  // Section headers
  { search: /SECCIÓN PLAGAS/g, replace: 'SECCIÓN AFECCIONES' },
  { search: /Plagas \/ Enfermedades Asociadas/g, replace: 'Afecciones Asociadas' },
  { search: /Selecciona plaga o enfermedad/g, replace: 'Selecciona afección' },
  { search: /Añadir Plaga/g, replace: 'Añadir Afección' }
];

for (const { search, replace } of safeReplacements) {
  content = content.replace(search, replace);
}

// Very careful targeted fixes for `p` mapping inside the afecciones array
// Let's use string replace on specific known lines

// The rels object initialization
content = content.replace(
  'beneficiosas: data.beneficiosas || [],\n        perjudiciales: data.perjudiciales || [],\n        plagas: data.afecciones || []',
  'beneficiosas: data.beneficiosas || [],\n        perjudiciales: data.perjudiciales || [],\n        afecciones: data.afecciones || []'
);

// We didn't change the iterator variable 'p', we just leave it as 'p' for now to avoid TS errors.
// It's perfectly fine to iterate `afecciones.map(p => p.afeccionesnombre)`.
// This prevents the cascading variable name errors.

fs.writeFileSync(file, content, 'utf8');
console.log('Safe script executed');
