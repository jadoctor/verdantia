const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Actualizando planes en la BD...");
    
    // 1. Gratuito (Actualizar id=1)
    await connection.query('UPDATE suscripciones SET suscripcionesnombre = ?, suscripcionesprecio = ? WHERE idsuscripciones = 1', ['Gratuito', '0.00']);
    
    // 2. Esencial (Actualizar id=2)
    await connection.query('UPDATE suscripciones SET suscripcionesnombre = ?, suscripcionesprecio = ? WHERE idsuscripciones = 2', ['Esencial', '4.99']);
    
    // 3. Avanzado (Actualizar id=3)
    await connection.query('UPDATE suscripciones SET suscripcionesnombre = ?, suscripcionesprecio = ? WHERE idsuscripciones = 3', ['Avanzado', '9.99']);
    
    // 4. Premium (Insertar id=4 si no existe)
    await connection.query(`
      INSERT INTO suscripciones (idsuscripciones, suscripcionesnombre, suscripcionesprecio, suscripcionesmesesduracion, suscripcionesactiva) 
      VALUES (4, 'Premium', '14.99', 1, 1) 
      ON DUPLICATE KEY UPDATE suscripcionesnombre='Premium', suscripcionesprecio='14.99'
    `);

    console.log("Planes actualizados a: Gratuito, Esencial, Avanzado, Premium");

    console.log("Reinyectando la Matriz de Reglas de Avisos para 4 planes...");

    const rules = [
      // Gratuito (id: 1)
      { sub: 1, aviso: 1, estado: 1 }, // Blogs: Obligado
      { sub: 1, aviso: 5, estado: 1 }, // Promo: Obligado
      { sub: 1, aviso: 2, estado: 2 }, // Tareas: Bloqueado
      { sub: 1, aviso: 3, estado: 2 }, // Biodinamica: Bloqueado
      { sub: 1, aviso: 4, estado: 2 }, // Meteo: Bloqueado
      { sub: 1, aviso: 6, estado: 1 }, // Sistema: Obligado

      // Esencial (id: 2)
      { sub: 2, aviso: 1, estado: 0 }, // Blogs: Opcional
      { sub: 2, aviso: 5, estado: 1 }, // Promo: Obligado
      { sub: 2, aviso: 2, estado: 0 }, // Tareas: Opcional
      { sub: 2, aviso: 3, estado: 2 }, // Biodinamica: Bloqueado
      { sub: 2, aviso: 4, estado: 2 }, // Meteo: Bloqueado
      { sub: 2, aviso: 6, estado: 1 }, // Sistema: Obligado

      // Avanzado (id: 3)
      { sub: 3, aviso: 1, estado: 0 }, // Blogs: Opcional
      { sub: 3, aviso: 5, estado: 0 }, // Promo: Opcional
      { sub: 3, aviso: 2, estado: 0 }, // Tareas: Opcional
      { sub: 3, aviso: 3, estado: 0 }, // Biodinamica: Opcional
      { sub: 3, aviso: 4, estado: 2 }, // Meteo: Bloqueado
      { sub: 3, aviso: 6, estado: 1 }, // Sistema: Obligado

      // Premium (id: 4)
      { sub: 4, aviso: 1, estado: 0 }, // Blogs: Opcional
      { sub: 4, aviso: 5, estado: 0 }, // Promo: Opcional
      { sub: 4, aviso: 2, estado: 0 }, // Tareas: Opcional
      { sub: 4, aviso: 3, estado: 0 }, // Biodinamica: Opcional
      { sub: 4, aviso: 4, estado: 0 }, // Meteo: Opcional
      { sub: 4, aviso: 6, estado: 1 }, // Sistema: Obligado
    ];

    for (const r of rules) {
      await connection.query(`
        INSERT INTO suscripcionestiposavisos (xsuscripcionestiposavisosidsuscripciones, xsuscripcionestiposavisosidtiposavisos, suscripcionestiposavisosestado)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE suscripcionestiposavisosestado = VALUES(suscripcionestiposavisosestado)
      `, [r.sub, r.aviso, r.estado]);
    }

    console.log("¡Hecho!");

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await connection.end();
  }
}

main();
