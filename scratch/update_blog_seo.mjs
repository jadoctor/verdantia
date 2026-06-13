import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    // 1. Get the current blog content
    const [rows] = await pool.query('SELECT blogcontenido, blogtitulo, blogresumen FROM blog WHERE blogslug = "calendario-lunar"');
    if (rows.length === 0) {
      console.error('Blog article not found for slug "calendario-lunar"');
      return;
    }

    const blogRow = rows[0];
    let blogData = JSON.parse(blogRow.blogcontenido);

    // 2. Add/Update SEO tags for Hero image
    blogData.hero_imagen = "/blog/lunar_garden_hero.png";
    blogData.hero_imagen_alt = "Huerto sostenible bajo la luz de la luna llena y el cielo estrellado con cultivos florecientes";
    blogData.hero_imagen_title = "Huerto y Calendario Lunar de Verdantia";

    // 3. Add/Update SEO tags for each section image
    if (blogData.secciones && Array.isArray(blogData.secciones)) {
      blogData.secciones.forEach((sec) => {
        if (sec.imagen_ruta) {
          if (sec.imagen_ruta.includes('luna_nueva.png')) {
            sec.imagen_alt = "Ilustración de la Luna Nueva en el cielo oscuro nocturno";
            sec.imagen_title = "Fase de Luna Nueva";
          } else if (sec.imagen_ruta.includes('luna_creciente.png')) {
            sec.imagen_alt = "Ilustración de la Luna en fase de Cuarto Creciente en forma de D iluminada";
            sec.imagen_title = "Fase de Cuarto Creciente";
          } else if (sec.imagen_ruta.includes('luna_llena.png')) {
            sec.imagen_alt = "Ilustración de la Luna Llena brillante iluminando el cielo y la naturaleza";
            sec.imagen_title = "Fase de Luna Llena";
          } else if (sec.imagen_ruta.includes('luna_menguante.png')) {
            sec.imagen_alt = "Ilustración de la Luna en fase de Cuarto Menguante en forma de C iluminada";
            sec.imagen_title = "Fase de Cuarto Menguante";
          } else if (sec.imagen_ruta.includes('lunar_seedling.png')) {
            sec.imagen_alt = "Plántula creciendo en la tierra bajo una luz celestial y la influencia de la luna";
            sec.imagen_title = "Germinación y Trasplante con la Luna";
          }
        }
      });
    }

    // 4. Update the database
    await pool.query(`
      UPDATE blog SET blogcontenido = ? WHERE blogslug = 'calendario-lunar'
    `, [JSON.stringify(blogData)]);

    console.log('Blog article "calendario-lunar" updated successfully with SEO alt and title tags.');
  } catch(e) {
    console.error('Error updating blog SEO:', e);
  } finally {
    await pool.end();
  }
}

main();
