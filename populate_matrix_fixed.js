const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Creando tabla suscripcionestiposavisos...");
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS \`suscripcionestiposavisos\` (
        \`idsuscripcionestiposavisos\` int NOT NULL AUTO_INCREMENT,
        \`xsuscripcionestiposavisosidsuscripciones\` int NOT NULL,
        \`xsuscripcionestiposavisosidtiposavisos\` int NOT NULL,
        \`suscripcionestiposavisosestado\` int NOT NULL DEFAULT '0' COMMENT '0: Opcional, 1: Obligatorio, 2: Bloqueado',
        PRIMARY KEY (\`idsuscripcionestiposavisos\`),
        UNIQUE KEY \`susc_tipoaviso_UNIQUE\` (\`xsuscripcionestiposavisosidsuscripciones\`,\`xsuscripcionestiposavisosidtiposavisos\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    const rules = [
      // B+ (id: 1)
      { sub: 1, aviso: 1, estado: 1 }, // Blogs: Obligado
      { sub: 1, aviso: 5, estado: 1 }, // Promo: Obligado
      { sub: 1, aviso: 2, estado: 2 }, // Tareas: Bloqueado
      { sub: 1, aviso: 3, estado: 2 }, // Biodinamica: Bloqueado
      { sub: 1, aviso: 4, estado: 2 }, // Meteo: Bloqueado
      { sub: 1, aviso: 6, estado: 1 }, // Sistema: Obligado

      // Normal (id: 2)
      { sub: 2, aviso: 1, estado: 0 }, // Blogs: Opcional
      { sub: 2, aviso: 5, estado: 1 }, // Promo: Obligado
      { sub: 2, aviso: 2, estado: 0 }, // Tareas: Opcional
      { sub: 2, aviso: 3, estado: 2 }, // Biodinamica: Bloqueado
      { sub: 2, aviso: 4, estado: 2 }, // Meteo: Bloqueado
      { sub: 2, aviso: 6, estado: 1 }, // Sistema: Obligado

      // Premium (id: 3)
      { sub: 3, aviso: 1, estado: 0 }, // Blogs: Opcional
      { sub: 3, aviso: 5, estado: 0 }, // Promo: Opcional
      { sub: 3, aviso: 2, estado: 0 }, // Tareas: Opcional
      { sub: 3, aviso: 3, estado: 0 }, // Biodinamica: Opcional
      { sub: 3, aviso: 4, estado: 0 }, // Meteo: Opcional
      { sub: 3, aviso: 6, estado: 1 }, // Sistema: Obligado
    ];

    console.log("Inyectando matriz de reglas en suscripcionestiposavisos...");
    for (const r of rules) {
      await connection.query(`
        INSERT INTO suscripcionestiposavisos (xsuscripcionestiposavisosidsuscripciones, xsuscripcionestiposavisosidtiposavisos, suscripcionestiposavisosestado)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE suscripcionestiposavisosestado = VALUES(suscripcionestiposavisosestado)
      `, [r.sub, r.aviso, r.estado]);
    }

    console.log("¡Matriz inyectada perfectamente!");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

main();
