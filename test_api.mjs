import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const id = "10";
    const [rows] = await pool.query(`
      SELECT 
        b.idblog, b.blogslug, b.blogtitulo, b.blogresumen, b.blogimagen, 
        b.blogestado, b.blogcontenido, b.blogfechacreacion, b.blogfechapublicacion,
        u.nombre as autor_nombre
      FROM blog b
      LEFT JOIN usuarios u ON b.xblogidusuarios = u.idusuarios
      WHERE b.xblogidespecies = ?
      ORDER BY b.idblog DESC
    `, [id]);

    const blogs = (rows).map((row) => {
      let pdfSourceId = null;
      let heroAlt = '';
      try {
        if (row.blogcontenido) {
          const content = typeof row.blogcontenido === 'string' 
            ? JSON.parse(row.blogcontenido) 
            : row.blogcontenido;
          pdfSourceId = content.pdf_source_id || null;
          heroAlt = content.hero_imagen_alt || '';
        }
      } catch (e) {
        console.log("Error en row:", row.idblog, e.message);
      }
      
      return {
        id: row.idblog,
        pdfSourceId: pdfSourceId
      };
    });
    console.log("SUCCESS:", blogs);
  } catch(e) {
    console.error("FAIL:", e);
  }

  process.exit(0);
}

run();
