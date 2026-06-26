const fs = require('fs');

const files = [
  'src/app/api/admin/especies/[id]/route.ts',
  'src/app/api/admin/especies/[id]/relaciones/route.ts',
  'src/app/api/admin/especies/route.ts'
];

const replacements = [
  { search: /plagas/g, replace: 'afecciones' },
  { search: /Plagas/g, replace: 'Afecciones' },
  { search: /plagasnombre/g, replace: 'afeccionesnombre' },
  { search: /plagastipo/g, replace: 'afeccionescategoria' },
  { search: /idplagas/g, replace: 'idafecciones' },
  { search: /xespeciesplagasidespecies/g, replace: 'xespeciesafeccionesidespecies' },
  { search: /xespeciesplagasidplagas/g, replace: 'xespeciesafeccionesidafecciones' },
  { search: /especiesplagasnivelriesgo/g, replace: 'especiesafeccionesnivelriesgo' },
  { search: /especiesplagasnotasespecificas/g, replace: 'especiesafeccionesnotasespecificas' },
  { search: /xrelacionesplagasideplaga/g, replace: 'xespeciesafeccionesidafecciones' },
  { search: /relacionesplagasriesgo/g, replace: 'especiesafeccionesnivelriesgo' },
  { search: /relacionesplagasnotas/g, replace: 'especiesafeccionesnotasespecificas' },
  { search: /ep\./g, replace: 'ea.' }, // From especiesplagas ep to especiesafecciones ea
  { search: /p\./g, replace: 'a.' },  // From plagas p to afecciones a
  { search: /total_especiesplagas/g, replace: 'total_especiesafecciones' }
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    for (const { search, replace } of replacements) {
      content = content.replace(search, replace);
    }
    
    // Fix any collateral damage to variable names if any
    content = content.replace(/especiesafecciones ep/g, 'especiesafecciones ea');
    content = content.replace(/afecciones p /g, 'afecciones a ');
    content = content.replace(/ea\.xafeccionesidafecciones/g, 'ea.xespeciesafeccionesidafecciones');
    content = content.replace(/afecciones a ON ea\.xespeciesafeccionesidafecciones = a\.idafecciones/g, 'afecciones a ON ea.xespeciesafeccionesidafecciones = a.idafecciones');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
  }
}
