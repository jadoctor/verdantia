import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  const updates = [
    { id: 1, name: 'Tiempo de Planificación' }, // antes Fase Planificación
    { id: 15, name: 'Tiempo de Germinación' }, // antes Fase de Pregerminación
    { id: 16, name: 'Tiempo de Postgerminación' }, // antes Fase Postgerminación
    { id: 3, name: 'Tiempo de Plantón / Semillero' }, // antes Fase de Plantón
    { id: 11, name: 'Tiempo de Posplantación (Enraizamiento)' }, // antes Fase Posplantación
    { id: 4, name: 'Tiempo de Crecimiento Vegetativo' }, // antes Fase Crecimiento Vegetativo
    { id: 12, name: 'Tiempo de Floración' }, // antes Fase Floración
    { id: 5, name: 'Tiempo de Cosecha' }, // antes Fase Cosecha
  ];

  for (const update of updates) {
    await pool.query("UPDATE fasescultivo SET fasescultivonombre = ? WHERE idfasescultivo = ?", [update.name, update.id]);
    console.log(`Updated ID ${update.id} to ${update.name}`);
  }

  console.log('Done');
  pool.end();
}

main();
