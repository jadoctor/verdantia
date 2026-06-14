import fs from 'fs';

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

async function run() {
  try {
    const [especies] = await pool.query('SELECT idespecies, especiesnombre FROM especies');
    const [ben] = await pool.query('SELECT * FROM asociacionesbeneficiosas');
    const [perj] = await pool.query('SELECT * FROM asociacionesperjudiciales');
    
    const especiesMap = {};
    especies.forEach(e => {
      especiesMap[e.idespecies] = e.especiesnombre;
    });

    const results = {};

    const addAssoc = (id, type, targetId, motive) => {
      if (!especiesMap[id] || !especiesMap[targetId]) return;
      if (!results[especiesMap[id]]) {
        results[especiesMap[id]] = { beneficiosas: [], perjudiciales: [] };
      }
      results[especiesMap[id]][type].push({ target: especiesMap[targetId], motive });
    };

    ben.forEach(b => {
      addAssoc(b.xasociacionesbeneficiosasidespecieorigen, 'beneficiosas', b.xasociacionesbeneficiosasidespeciedestino, b.asociacionesbeneficiosasmotivo);
      addAssoc(b.xasociacionesbeneficiosasidespeciedestino, 'beneficiosas', b.xasociacionesbeneficiosasidespecieorigen, b.asociacionesbeneficiosasmotivo);
    });

    perj.forEach(p => {
      addAssoc(p.xasociacionesperjudicialesidespecieorigen, 'perjudiciales', p.xasociacionesperjudicialesidespeciedestino, p.asociacionesperjudicialesmotivo);
      addAssoc(p.xasociacionesperjudicialesidespeciedestino, 'perjudiciales', p.xasociacionesperjudicialesidespecieorigen, p.asociacionesperjudicialesmotivo);
    });

    // Deduplicate array inside each
    for (const esp in results) {
      const bSet = new Map();
      results[esp].beneficiosas.forEach(x => bSet.set(x.target, x.motive));
      results[esp].beneficiosas = Array.from(bSet.entries()).map(e => ({target: e[0], motive: e[1]}));

      const pSet = new Map();
      results[esp].perjudiciales.forEach(x => pSet.set(x.target, x.motive));
      results[esp].perjudiciales = Array.from(pSet.entries()).map(e => ({target: e[0], motive: e[1]}));
    }

    // Sort all species alphabetically
    const sortedAllEspecies = Object.values(especiesMap).sort();
    
    let markdown = '# 🤝 Asociaciones de Especies en Verdantia\\n\\n';
    markdown += 'A continuación se listan las especies que tienen **asociaciones registradas**, indicando el motivo agronómico de cada relación en formato tabular.\\n\\n';
    markdown += '| 🌱 Especie | ✅ Beneficiosas | ❌ Perjudiciales |\\n';
    markdown += '| :--- | :--- | :--- |\\n';

    const especiesConDatos = sortedAllEspecies.filter(esp => results[esp] && (results[esp].beneficiosas.length > 0 || results[esp].perjudiciales.length > 0));
    const especiesSinDatos = sortedAllEspecies.filter(esp => !results[esp] || (results[esp].beneficiosas.length === 0 && results[esp].perjudiciales.length === 0));

    especiesConDatos.forEach(esp => {
      let benStr = '-';
      if (results[esp].beneficiosas.length > 0) {
        benStr = results[esp].beneficiosas.map(b => `**${b.target}**: ${b.motive}`).join('<br><br>');
      }
      
      let perjStr = '-';
      if (results[esp].perjudiciales.length > 0) {
        perjStr = results[esp].perjudiciales.map(p => `**${p.target}**: ${p.motive}`).join('<br><br>');
      }

      markdown += `| **${esp}** | ${benStr} | ${perjStr} |\\n`;
    });

    markdown += `\\n## ⚠️ Especies sin asociaciones registradas aún:\\n`;
    markdown += especiesSinDatos.map(e => `- ${e}`).join('\\n') + '\\n';

    fs.writeFileSync('C:\\\\Users\\\\jaill\\\\.gemini\\\\antigravity-ide\\\\brain\\\\f8e21bb7-9fae-450b-918d-a51f7f541a58\\\\asociaciones.md', markdown);
    console.log("Archivo asociaciones.md generado con éxito.");

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
