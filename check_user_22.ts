import pool from './src/lib/db';

async function check() {
  try {
    const [rows] = await pool.query(`
      SELECT 
        u.idusuarios, 
        u.usuariosnombre, 
        s.suscripcionesnombre, 
        us.usuariossuscripcionesestado,
        us.usuariossuscripcionesorigen
      FROM usuarios u
      LEFT JOIN usuariossuscripciones us ON u.idusuarios = us.xusuariossuscripcionesidusuarios
      LEFT JOIN suscripciones s ON us.xusuariossuscripcionesidsuscripciones = s.idsuscripciones
      WHERE u.idusuarios = 22
    `);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
check();
