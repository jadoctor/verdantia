const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  console.log("Añadiendo la columna fasescultivoduracion a la tabla fasescultivo...");
  try {
    await pool.query("ALTER TABLE fasescultivo ADD COLUMN fasescultivoduracion INT NULL");
    console.log("¡Columna añadida con éxito!");
  } catch (err) {
    if (err.code === 'ER_DUP_COLUMN_NAME') {
      console.log("La columna ya existe en la base de datos.");
    } else {
      throw err;
    }
  }

  // Establecer duraciones estándar predefinidas
  const updates = [
    { clave: 'pregerminacion', duracion: 7 },
    { clave: 'postgerminacion', duracion: 15 },
    { clave: 'semillero', duracion: 30 },
    { clave: 'enraizamiento', duracion: 10 },
    { clave: 'crecimiento', duracion: 45 },
    { clave: 'floracion', duracion: 20 },
    { clave: 'cosecha', duracion: 30 }
  ];

  for (const up of updates) {
    await pool.query(
      "UPDATE fasescultivo SET fasescultivoduracion = ? WHERE fasescultivoclave = ?",
      [up.duracion, up.clave]
    );
    console.log(`Duración estándar de la fase '${up.clave}' establecida a ${up.duracion} días.`);
  }

  await pool.end();
  console.log("Migración completada.");
}

main().catch(console.error);
