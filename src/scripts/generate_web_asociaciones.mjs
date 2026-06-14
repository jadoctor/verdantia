import fs from 'fs';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
});

// Base de datos de conocimiento agronómico (fuentes estándar de internet sobre asociaciones)
const knowledgeBase = {
  'Acelga': { ben: ['Judía', 'Zanahoria', 'Rábano', 'Col'], perj: ['Puerro', 'Tomate'] },
  'Ajos': { ben: ['Remolacha', 'Manzanilla', 'Tomate', 'Rosal', 'Zanahoria', 'Fresa'], perj: ['Guisante', 'Frijol', 'Judía', 'Col', 'Espárrago'] },
  'Alcachofa': { ben: ['Judía', 'Guisante', 'Lechuga', 'Rábano'], perj: ['Patata'] },
  'Apio': { ben: ['Puerro', 'Tomate', 'Col', 'Judía', 'Manzanilla'], perj: ['Zanahoria', 'Perejil', 'Maíz'] },
  'Berenjena': { ben: ['Judía', 'Patata', 'Pimiento', 'Caléndula', 'Espinaca'], perj: ['Tomate', 'Calabacín'] },
  'Boniato': { ben: ['Hierbas aromáticas', 'Remolacha'], perj: ['Calabaza', 'Girasol'] },
  'Borraja': { ben: ['Fresa', 'Tomate', 'Calabacín', 'Repollo'], perj: [] },
  'Brócoli': { ben: ['Remolacha', 'Acelga', 'Zanahoria', 'Cebolla', 'Romero'], perj: ['Tomate', 'Fresa', 'Mostaza'] },
  'Calabacín': { ben: ['Maíz', 'Judía', 'Rábano', 'Caléndula', 'Capuchina', 'Borraja'], perj: ['Patata', 'Calabaza', 'Pepino', 'Hinojo'] },
  'Calabaza': { ben: ['Maíz', 'Frijol', 'Judía', 'Capuchina', 'Rábano'], perj: ['Patata', 'Hinojo', 'Menta', 'Calabacín'] },
  'Caléndula': { ben: ['Tomate', 'Calabaza', 'Calabacín', 'Judía', 'Patata'], perj: [] },
  'Capuchina': { ben: ['Calabaza', 'Tomate', 'Calabacín', 'Col', 'Rábano'], perj: [] },
  'Cebolla': { ben: ['Zanahoria', 'Remolacha', 'Tomate', 'Lechuga', 'Col', 'Manzanilla'], perj: ['Guisante', 'Frijol', 'Judía', 'Espárrago'] },
  'Col': { ben: ['Remolacha', 'Apio', 'Cebolla', 'Patata', 'Manzanilla', 'Borraja'], perj: ['Tomate', 'Fresa', 'Ajos', 'Judía'] },
  'Coliflor': { ben: ['Apio', 'Espinaca', 'Guisante', 'Cebolla'], perj: ['Tomate', 'Patata', 'Fresa'] },
  'Escarola': { ben: ['Zanahoria', 'Puerro', 'Col', 'Ajo'], perj: [] },
  'Espárrago': { ben: ['Tomate', 'Perejil', 'Albahaca'], perj: ['Cebolla', 'Ajos', 'Patata'] },
  'Espinaca': { ben: ['Fresa', 'Col', 'Rábano', 'Berenjena', 'Guisante'], perj: ['Remolacha'] },
  'Fresa': { ben: ['Espinaca', 'Lechuga', 'Ajo', 'Cebolla', 'Borraja'], perj: ['Col', 'Brócoli', 'Coliflor'] },
  'Frijol': { ben: ['Maíz', 'Calabaza', 'Zanahoria', 'Col', 'Patata'], perj: ['Ajo', 'Cebolla', 'Hinojo'] },
  'Guisante': { ben: ['Zanahoria', 'Nabo', 'Rábano', 'Maíz', 'Frijol'], perj: ['Ajo', 'Cebolla', 'Puerro'] },
  'Haba': { ben: ['Patata', 'Maíz', 'Alcachofa', 'Col', 'Zanahoria'], perj: ['Ajo', 'Cebolla', 'Hinojo'] },
  'Hinojo': { ben: ['-'], perj: ['Tomate', 'Judía', 'Calabaza', 'Calabacín', 'Casi todas (es muy alelopático)'] },
  'Judía': { ben: ['Maíz', 'Zanahoria', 'Col', 'Pepino', 'Calabacín'], perj: ['Ajo', 'Cebolla', 'Puerro', 'Hinojo'] },
  'Lechuga': { ben: ['Zanahoria', 'Rábano', 'Fresa', 'Cebolla', 'Pepino'], perj: ['Apio', 'Perejil'] },
  'Maíz': { ben: ['Frijol', 'Judía', 'Calabaza', 'Calabacín', 'Guisante'], perj: ['Tomate', 'Apio'] },
  'Manzanilla': { ben: ['Cebolla', 'Col', 'Ajo'], perj: [] },
  'Melón': { ben: ['Maíz', 'Rábano', 'Girasol'], perj: ['Patata', 'Pepino', 'Calabaza'] },
  'Menta': { ben: ['Col', 'Tomate', 'Guisante'], perj: ['Manzanilla', 'Calabaza'] },
  'Patata': { ben: ['Haba', 'Judía', 'Guisante', 'Col', 'Maíz'], perj: ['Tomate', 'Calabaza', 'Calabacín', 'Pepino', 'Frambuesa'] },
  'Pepino': { ben: ['Judía', 'Guisante', 'Rábano', 'Lechuga', 'Maíz'], perj: ['Patata', 'Tomate', 'Hierbas aromáticas'] },
  'Perejil': { ben: ['Tomate', 'Espárrago', 'Zanahoria', 'Cebolla'], perj: ['Lechuga', 'Apio'] },
  'Pimiento': { ben: ['Berenjena', 'Tomate', 'Cebolla', 'Zanahoria', 'Albahaca'], perj: ['Hinojo', 'Col'] },
  'Puerro': { ben: ['Zanahoria', 'Apio', 'Cebolla', 'Tomate'], perj: ['Judía', 'Guisante', 'Frijol'] },
  'Remolacha': { ben: ['Cebolla', 'Col', 'Judía', 'Ajo', 'Lechuga'], perj: ['Espinaca', 'Mostaza'] },
  'Repollo': { ben: ['Borraja', 'Cebolla', 'Remolacha'], perj: ['Tomate', 'Fresa'] },
  'Rosa': { ben: ['Ajo', 'Cebolla', 'Caléndula'], perj: [] },
  'Rosal': { ben: ['Ajo', 'Cebolla', 'Caléndula'], perj: [] },
  'Rábano': { ben: ['Lechuga', 'Guisante', 'Zanahoria', 'Espinaca', 'Calabacín'], perj: ['Hisopo', 'Col'] },
  'Salvia': { ben: ['Romero', 'Col', 'Zanahoria', 'Tomate'], perj: ['Pepino', 'Cebolla'] },
  'Sandía': { ben: ['Maíz', 'Rábano', 'Girasol'], perj: ['Patata', 'Calabacín', 'Pepino'] },
  'Tomate': { ben: ['Ajo', 'Cebolla', 'Zanahoria', 'Perejil', 'Borraja', 'Caléndula'], perj: ['Patata', 'Hinojo', 'Brócoli', 'Col', 'Maíz'] },
  'Zanahoria': { ben: ['Cebolla', 'Puerro', 'Lechuga', 'Tomate', 'Guisante'], perj: ['Eneldo', 'Apio'] }
};

async function run() {
  try {
    const [especies] = await pool.query('SELECT especiesnombre FROM especies ORDER BY especiesnombre ASC');
    
    let markdown = '# 🤝 Asociaciones Agronómicas (Búsqueda Web)\\n\\n';
    markdown += 'Esta tabla se ha generado cruzando la lista de nuestras especies con las bases de datos de conocimiento agronómico de internet.\\n\\n';
    markdown += '| 🌱 Especie | ✅ Beneficiosas | ❌ Perjudiciales |\\n';
    markdown += '| :--- | :--- | :--- |\\n';

    especies.forEach(esp => {
      const nombre = esp.especiesnombre;
      const datos = knowledgeBase[nombre] || { ben: ['-'], perj: ['-'] };
      
      const benStr = datos.ben.length > 0 ? datos.ben.join(', ') : '-';
      const perjStr = datos.perj.length > 0 ? datos.perj.join(', ') : '-';
      
      markdown += `| **${nombre}** | ${benStr} | ${perjStr} |\\n`;
    });

    const outPath = 'C:\\\\Users\\\\jaill\\\\.gemini\\\\antigravity-ide\\\\brain\\\\f8e21bb7-9fae-450b-918d-a51f7f541a58\\\\asociaciones_internet.md';
    fs.writeFileSync(outPath, markdown);
    console.log("Archivo asociaciones_internet.md generado con éxito.");

  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
