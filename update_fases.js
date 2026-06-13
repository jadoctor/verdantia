import mysql from 'mysql2/promise';

async function updateFases() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log('Actualizando fasescultivonombre...');
    await connection.execute(`UPDATE fasescultivo SET fasescultivonombre = 'Plantación' WHERE fasescultivoclave = 'trasplante'`);
    await connection.execute(`UPDATE fasescultivo SET fasescultivonombre = 'Posplantación' WHERE fasescultivoclave = 'enraizamiento'`);
    console.log('Base de datos actualizada con éxito.');
  } catch (err) {
    console.error('Error al actualizar BD:', err);
  } finally {
    await connection.end();
  }
}

updateFases();
