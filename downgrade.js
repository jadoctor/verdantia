const mysql = require('mysql2/promise');
require('@next/env').loadEnvConfig(process.cwd());

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Buscar superadministrador
    const [users] = await connection.query("SELECT idusuarios, usuariosemail, usuariosnombre FROM usuarios WHERE usuariosroles LIKE '%superadministrador%' LIMIT 1");
    if (users.length === 0) {
      console.log('No superadmin found');
      return;
    }
    const admin = users[0];
    console.log('Superadmin:', admin.usuariosemail);

    // Buscar ID de plan gratuito
    const [subs] = await connection.query("SELECT idsuscripciones FROM suscripciones WHERE suscripcionesnombre = 'Gratuito' LIMIT 1");
    const freeSubId = subs[0].idsuscripciones;

    // Desactivar la suscripción actual
    await connection.query("UPDATE usuariossuscripciones SET usuariossuscripcionesestado = 'cancelada' WHERE xusuariossuscripcionesidusuarios = ?", [admin.idusuarios]);

    // Insertar nueva suscripción gratuita
    await connection.query(`
      INSERT INTO usuariossuscripciones 
      (xusuariossuscripcionesidusuarios, xusuariossuscripcionesidsuscripciones, usuariossuscripcionesfechainicio, usuariossuscripcionesestado) 
      VALUES (?, ?, NOW(), 'activa')
    `, [admin.idusuarios, freeSubId]);

    console.log('Downgraded superadmin to Gratuito');
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}
run();
