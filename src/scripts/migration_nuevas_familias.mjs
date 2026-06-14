import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 2,
  connectTimeout: 10000,
});

async function run() {
  const conn = await pool.getConnection();
  console.log('✅ Conectado a la BD para ampliar familias\\n');

  try {
    // 1. Insertar las 4 nuevas familias si no existen
    const nuevasFamilias = [
      ['Lamiáceas',      'Lamiaceae',      'lamiaceas',      2, '#8b5cf6', '🌿', 'Menta, albahaca, romero, orégano. Atraen polinizadores y repelen plagas.'],
      ['Rosáceas',       'Rosaceae',       'rosaceas',       3, '#f43f5e', '🍓', 'Fresas, zarzamoras, rosales.'],
      ['Asparagáceas',   'Asparagaceae',   'asparagaceas',   1, '#10b981', '🎍', 'Espárragos. Cultivos perennes, requieren bancal permanente.'],
      ['Tropaeoláceas',  'Tropaeolaceae',  'tropaeolaceas',  1, '#fbbf24', '🏵️', 'Capuchina. Excelente planta trampa para pulgones.'],
    ];

    for (const [nombre, cientifico, grupo, anos, color, emoji, notas] of nuevasFamilias) {
      const [existing] = await conn.query(`SELECT idfamilias FROM familias WHERE familiasnombre = ?`, [nombre]);
      if (existing.length === 0) {
        await conn.query(
          `INSERT INTO familias (familiasnombre, familiasnombrecientifico, familiasgruporotacion, familiasanosdescanso, familiascolor, familiasemoji, familiasnotas) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [nombre, cientifico, grupo, anos, color, emoji, notas]
        );
        console.log(`✅ Familia insertada: ${nombre}`);
      } else {
        console.log(`⏭️  Familia ya existe: ${nombre}`);
      }
    }

    // 2. Mapear las 27 especies huérfanas
    const [todasFamilias] = await conn.query(`SELECT idfamilias, familiasnombre FROM familias`);
    
    // Función helper para obtener ID
    const getId = (nombreFamilia) => {
      const f = todasFamilias.find(x => x.familiasnombre === nombreFamilia);
      return f ? f.idfamilias : null;
    };

    const mapeo = [
      { especie: 'Maíz', familia: 'Gramíneas' },
      { especie: 'Judía', familia: 'Leguminosas' },
      { especie: 'Judías', familia: 'Leguminosas' },
      { especie: 'Frijol', familia: 'Leguminosas' },
      { especie: 'Frijoles', familia: 'Leguminosas' },
      { especie: 'Guisante', familia: 'Leguminosas' },
      { especie: 'Guisantes', familia: 'Leguminosas' },
      { especie: 'Capuchina', familia: 'Tropaeoláceas' },
      { especie: 'Caléndula', familia: 'Compuestas' },
      { especie: 'Manzanilla', familia: 'Compuestas' },
      { especie: 'Patata', familia: 'Solanáceas' },
      { especie: 'Hinojo', familia: 'Apiáceas' },
      { especie: 'Perejil', familia: 'Apiáceas' },
      { especie: 'Zanahoria', familia: 'Apiáceas' },
      { especie: 'Salvia', familia: 'Lamiáceas' },
      { especie: 'Menta', familia: 'Lamiáceas' },
      { especie: 'Remolacha', familia: 'Quenopodiáceas' },
      { especie: 'Rosal', familia: 'Rosáceas' },
      { especie: 'Rosas', familia: 'Rosáceas' },
      { especie: 'Rosa', familia: 'Rosáceas' },
      { especie: 'Rosales', familia: 'Rosáceas' },
      { especie: 'Fresa', familia: 'Rosáceas' },
      { especie: 'Espárrago', familia: 'Asparagáceas' },
      { especie: 'Espárragos', familia: 'Asparagáceas' },
      { especie: 'Col', familia: 'Crucíferas' },
      { especie: 'Repollo', familia: 'Crucíferas' },
      { especie: 'Brócoli', familia: 'Crucíferas' },
    ];

    let countAsignadas = 0;
    for (const item of mapeo) {
      const famId = getId(item.familia);
      if (famId) {
        const [res] = await conn.query(
          `UPDATE especies SET xespeciesidfamilias = ? WHERE especiesnombre = ? AND xespeciesidfamilias IS NULL`,
          [famId, item.especie]
        );
        if (res.affectedRows > 0) {
          console.log(`✅ Asignada especie '${item.especie}' a la familia '${item.familia}'`);
          countAsignadas += res.affectedRows;
        }
      } else {
        console.warn(`⚠️ No se encontró la familia '${item.familia}' para la especie '${item.especie}'`);
      }
    }
    
    console.log(`\\n✅ Migración completa. Especies enlazadas en este paso: ${countAsignadas}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
