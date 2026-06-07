const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  // Solo caras - el número lo pone el componente RangoBadge
  const emojis = [
    '👶',      // Nivel 1 - Visitante
    '🤓',      // Nivel 2 - Campesino Aprendiz
    '🧑‍🔧',  // Nivel 3 - Sembrador Novato
    '👷',      // Nivel 4 - Cultivador
    '🧔‍♂️',  // Nivel 5 - Hortelano
    '🧑‍🌾',  // Nivel 6 - Agricultor Dedicado
    '🧓',      // Nivel 7 - Maestro de la Tierra
    '🧙‍♂️',  // Nivel 8 - Sabio de la Comunidad
    '💂',      // Nivel 9 - Guardián de Semilla
    '🤴'       // Nivel 10 - Leyenda Verde
  ];

  try {
    for (let i = 0; i < 10; i++) {
      await connection.query('UPDATE logros SET logrosicono = ? WHERE logrosnivel = ?', [emojis[i], i + 1]);
    }
    const [rows] = await connection.query('SELECT logrosnivel, logrosicono, logrosnombre FROM logros ORDER BY logrosnivel');
    console.log('=== BD actualizada: solo caras ===');
    rows.forEach(r => console.log(`Nivel ${r.logrosnivel}: ${r.logrosicono} - ${r.logrosnombre}`));
  } catch (e) { console.error(e); }
  await connection.end();
}
run();
