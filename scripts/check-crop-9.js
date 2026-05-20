const mysql = require('mysql2/promise');

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    const [rows] = await pool.query(`
      SELECT 
        c.idcultivos,
        COALESCE(vu.variedadesdiasgerminacion, vg.variedadesdiasgerminacion, e.especiesdiasgerminacion) AS dias_germinacion,
        COALESCE(vu.variedadesdiashastatrasplante, vg.variedadesdiashastatrasplante, e.especiesdiashastatrasplante) AS dias_trasplante,
        COALESCE(vu.variedadesdiashastafructificacion, vg.variedadesdiashastafructificacion, e.especiesdiashastafructificacion) AS dias_crecimiento,
        COALESCE(vu.variedadesdiashastarecoleccion, vg.variedadesdiashastarecoleccion, e.especiesdiashastarecoleccion) AS dias_recoleccion
      FROM cultivos c
      JOIN variedades vu ON c.xcultivosidvariedades = vu.idvariedades
      LEFT JOIN variedades vg ON vu.xvariedadesidvariedadorigen = vg.idvariedades
      JOIN especies e ON vg.xvariedadesidespecies = e.idespecies OR vu.xvariedadesidespecies = e.idespecies
      WHERE c.idcultivos = 9
    `);
    console.log(rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}
main();
