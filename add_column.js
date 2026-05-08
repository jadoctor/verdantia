const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  // 1. Comprobar columnas existentes
  const [cols] = await conn.query("SHOW COLUMNS FROM especies LIKE 'especiesautosuficiencia%'");
  console.log('Columnas existentes:');
  console.log(JSON.stringify(cols, null, 2));

  // 2. Crear la nueva columna si no existe
  const exists = cols.some(c => c.Field === 'especiesautosuficienciaparcial');
  if (!exists) {
    await conn.query("ALTER TABLE especies ADD COLUMN especiesautosuficienciaparcial DECIMAL(10,2) DEFAULT NULL AFTER especiesautosuficiencia");
    console.log('\n✅ Columna especiesautosuficienciaparcial CREADA con éxito.');
  } else {
    console.log('\n⚠️ La columna especiesautosuficienciaparcial ya existía.');
  }

  await conn.end();
})();
