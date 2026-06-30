const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
  waitForConnections: true,
  connectionLimit: 2,
}).promise();

async function check() {
  const [prov] = await pool.query('SELECT COUNT(*) as c FROM provincias');
  const [pobl] = await pool.query('SELECT COUNT(*) as c FROM poblaciones');
  const [dir] = await pool.query('SELECT COUNT(*) as c FROM direcciones');
  
  const [cols] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' 
     AND COLUMN_NAME IN ('usuariosnif','usuariosrazonsocial','usuariostipocontribuyente','usuarios_stripe_subscription_id','usuariosmetodopagopref','usuariosfechaultimopago')`
  );

  console.log('=== VERIFICACIÓN ===');
  console.log('Provincias:', prov[0].c);
  console.log('Poblaciones:', pobl[0].c);
  console.log('Direcciones migradas:', dir[0].c);
  console.log('Nuevas columnas en usuarios:', cols.map(r => r.COLUMN_NAME).join(', '));

  // JOIN completo: direcciones → poblaciones → provincias → paises
  const [sample] = await pool.query(`
    SELECT 
      d.iddirecciones AS id,
      d.direccionestipo AS tipo,
      d.direccionesetiqueta AS etiqueta,
      d.direccionesnombre AS destinatario,
      p.poblacionesnombre AS ciudad,
      p.poblacionescodigopostal AS cp,
      pr.provinciasnombre AS provincia,
      pa.paisesnombre AS pais
    FROM direcciones d
    LEFT JOIN poblaciones p ON d.xdireccionesidpoblaciones = p.idpoblaciones
    LEFT JOIN provincias pr ON p.xpoblacionesidprovincias = pr.idprovincias
    LEFT JOIN paises pa ON pr.xprovinciasidpaises = pa.idpaises
    LIMIT 5
  `);

  console.log('\n=== EJEMPLO JOIN COMPLETO (direcciones → poblaciones → provincias → paises) ===');
  sample.forEach(r => {
    console.log(`  #${r.id} [${r.tipo}] "${r.etiqueta}" → ${r.destinatario} | ${r.ciudad} (${r.cp}), ${r.provincia}, ${r.pais}`);
  });

  await pool.end();
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
