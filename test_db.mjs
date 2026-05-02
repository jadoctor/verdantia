import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({
    host: '34.175.111.133',
    user: 'root',
    password: 'Verdantiaja0334&',
    database: 'semillas_db',
    ssl: { rejectUnauthorized: false }
  });
  
  // 1. Get the PDF for Zucchini (idespecies = 10)
  const [pdfs] = await pool.query(`
    SELECT iddatosadjuntos, datosadjuntosnombreoriginal, datosadjuntostitulo 
    FROM datosadjuntos 
    WHERE xdatosadjuntosidespecies = 10 AND datosadjuntostipo = 'documento'
  `);
  console.log("=== PDFs DEL CALABACIN ===");
  console.log(pdfs);

  // 2. Get the latest Blogs for Zucchini
  const [blogs] = await pool.query(`
    SELECT idblog, blogtitulo, xblogidespecies, blogcontenido 
    FROM blog 
    WHERE xblogidespecies = 10 
    ORDER BY idblog DESC LIMIT 3
  `);
  console.log("\n=== ÚLTIMOS BLOGS DEL CALABACIN ===");
  
  const parsedBlogs = blogs.map(b => {
      let parsedContent = b.blogcontenido;
      if (typeof parsedContent === 'string') {
          try { parsedContent = JSON.parse(parsedContent); } catch(e) {}
      }
      return {
          idblog: b.idblog,
          blogtitulo: b.blogtitulo,
          xblogidespecies: b.xblogidespecies,
          pdf_source_id: parsedContent?.pdf_source_id || 'NOT FOUND IN JSON'
      }
  });
  console.log(parsedBlogs);

  process.exit(0);
}

run();
