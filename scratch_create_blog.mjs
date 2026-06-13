import mysql from 'mysql2/promise';

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  const blogData = {
    hero_imagen: "/blog/lunar_garden_hero.png",
    resumen: "Descubre cómo las fases de la luna y sus movimientos afectan al desarrollo de tus cultivos, y aprende a sincronizar tus labores en el huerto para obtener plantas más sanas y productivas.",
    introduccion: "El ser humano ha observado el cielo desde los albores de la agricultura. Al igual que la luna ejerce una atracción magnética sobre los océanos provocando las mareas, la savia de las plantas también responde a estos sutiles tirones gravitacionales y lumínicos. Cultivar siguiendo el calendario lunar no es magia ni superstición; es sincronizarse con los ritmos naturales de la Tierra para potenciar el enraizamiento, el crecimiento vegetativo y la producción de frutos.",
    secciones: [
      {
        titulo_h2: "1. Las Fases Lunares y su Energía",
        contenido_markdown: "Para entender la agricultura lunar, primero debemos conocer a nuestra protagonista. El ciclo lunar dura aproximadamente 29.5 días y se divide en cuatro grandes fases, cada una con características visuales y energéticas distintas.",
        imagen_posicion: "ninguna"
      },
      {
        titulo_h2: "Luna Nueva",
        contenido_markdown: "La luna se interpone entre la Tierra y el Sol, por lo que su cara visible queda completamente a oscuras. En el cielo, apenas podemos distinguir su silueta oscura recortada contra las estrellas.\n\nEs el punto de inicio del ciclo, un momento de profunda interiorización energética. A partir de aquí, la luz comenzará a aumentar gradualmente cada noche.",
        imagen_posicion: "izquierda",
        imagen_ruta: "/blog/luna_nueva.png"
      },
      {
        titulo_h2: "Cuarto Creciente",
        contenido_markdown: "Aproximadamente 7 días después de la luna nueva, vemos la mitad de su disco iluminado. La luna tiene forma de letra 'D'.\n\nDurante estos días, la luz lunar aumenta de forma progresiva. Es una fase de expansión, dinamismo y crecimiento acelerado en la naturaleza.",
        imagen_posicion: "derecha",
        imagen_ruta: "/blog/luna_creciente.png"
      },
      {
        titulo_h2: "Luna Llena",
        contenido_markdown: "La fase más espectacular. La Tierra se encuentra entre el Sol y la Luna, por lo que vemos su disco completamente iluminado, brillando con fuerza y creando una atmósfera casi mágica en la noche.\n\nEs el pico máximo de la energía expansiva. Tras esta noche, la intensidad de la luz y la gravedad sobre la savia comenzarán a disminuir progresivamente.",
        imagen_posicion: "izquierda",
        imagen_ruta: "/blog/luna_llena.png"
      },
      {
        titulo_h2: "Cuarto Menguante",
        contenido_markdown: "Siete días después de la luna llena, volvems a ver la mitad del disco iluminado, pero esta vez en forma de 'C'.\n\nLa luz y la influencia de la luna decrecen paulatinamente, preparándose para desaparecer de nuevo en la siguiente Luna Nueva. Es una fase de contracción y retorno al origen.",
        imagen_posicion: "derecha",
        imagen_ruta: "/blog/luna_menguante.png"
      },
      {
        titulo_h2: "2. La Relación de las Fases con el Cultivo",
        contenido_markdown: "Una vez conocidas las fases, la regla de oro en el huerto es entender cómo esta luz y gravedad tiran de los fluidos internos de la planta (la savia).\n\n**A. Impacto en la Savia según la Fase Visual**\n\n*   **De Nueva a Llena (Fase Creciente):** A medida que la luz aumenta, la savia **asciende** desde las raíces hacia las hojas, ramas y frutos. \n    * *¿Qué plantar?* Plantas de hoja (lechugas, espinacas) y plantas de fruto (tomates, calabacines, pimientos).\n    * *¿Qué evitar?* Las podas, ya que la planta 'sangrará' demasiada savia al estar fluyendo por arriba.\n\n*   **De Llena a Nueva (Fase Menguante):** La luz disminuye, y la savia **desciende** hacia el sistema radicular, concentrando la vitalidad bajo tierra.\n    * *¿Qué plantar?* Todo tipo de raíces y tubérculos (zanahorias, patatas, remolachas, cebollas).\n    * *¿Qué hacer?* Es el momento perfecto para podar, arrancar malas hierbas o incorporar abono, ya que las raíces están receptivas y la parte aérea no sufre el corte.",
        imagen_posicion: "ninguna"
      },
      {
        titulo_h2: "El impacto del Ascenso y Descenso (El Ciclo Orbital)",
        contenido_markdown: "Además de las fases visuales (que dependen de la luz), existe un ciclo gravitacional: a lo largo del mes, la luna describe un arco cada vez más alto o más bajo en nuestro horizonte.\n\n1.  **Luna Ascendente (Savia Arriba):** Días excelentes para injertar, cortar esquejes o cosechar verduras de hoja y frutos. Su conservación será mucho mayor y su sabor más intenso.\n2.  **Luna Descendente (Savia Abajo):** Son los días clave para **cualquier labor que requiera contacto con la tierra**: siembra, trasplantes y preparación de bancales. Al estar la savia concentrada en la raíz, el shock del trasplante ('Tiempo de Enraizamiento') se reduce drásticamente.\n\n*Por este motivo, en Verdantia cruzamos estos datos astronómicos con las duraciones de cada fase de tu cultivo, intentando sugerirte los hitos críticos (como el día de plantar o sembrar) en días de Luna Descendente.*",
        imagen_posicion: "izquierda",
        imagen_ruta: "/blog/lunar_seedling.png"
      }
    ],
    consejos: {
      "titulo": "Resumen Práctico para el Huerto",
      "items": [
        "**Raíces gruesas:** Siembra y cosecha en Cuarto Menguante.",
        "**Hojas crujientes y frutos jugosos:** Siembra en Cuarto Creciente.",
        "**Trasplantes sin estrés:** Realízalos siempre en Luna Descendente.",
        "**Mantenimiento profundo:** Poda tus árboles y limpia bancales en Luna Menguante para no debilitar las plantas."
      ]
    },
    cta: {
      "titulo": "¿Listo para cultivar con las estrellas?",
      "subtitulo": "Verdantia ajusta matemáticamente tus tareas agrícolas al ritmo del universo.",
      "boton_primario": "Volver a mi Perfil",
      "boton_secundario": "Ver Calendario"
    },
    tags: ["Calendario Lunar", "Biodinámica", "Mareas y Savia", "Agricultura de Precisión"]
  };

  try {
    await pool.query(`
      UPDATE blog SET blogcontenido = ?, blogtitulo = ?, blogresumen = ? WHERE blogslug = 'calendario-lunar'
    `, [
      JSON.stringify(blogData),
      'Guía Práctica: Cultivar con el Calendario Lunar',
      'Aprende a sincronizar tus siembras y cosechas con las fases lunares para potenciar el rendimiento de tu huerto.'
    ]);
    console.log('Blog calendario-lunar expandido con éxito.');
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

main();
