const mysql = require('mysql2/promise');

async function insertBlog() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    console.log("Conexión establecida con la base de datos Hostinger...");

    const blogSlug = 'guia-definitiva-no-laboreo';
    const blogTitulo = 'La Guía Definitiva del No Laboreo: Cultivar sin Arar para Regenerar tu Suelo';
    const blogResumen = 'Descubre el poder del No-Till y el método No-Dig: una revolución biológica que ahorra agua, elimina malas hierbas y multiplica la fertilidad de tu huerto.';
    
    const blogJson = {
      titulo: blogTitulo,
      resumen: blogResumen,
      tags: ["No-Till", "No-Dig", "Permacultura", "Regenerativo", "SueloSaludable"],
      ficha_rapida: [
        {icono: "🍂", label: "Filosofía", valor: "Cero arado"},
        {icono: "💧", label: "Ahorro Hídrico", valor: "Hasta 70%"},
        {icono: "🐛", label: "Vida del Suelo", valor: "Máxima"},
        {icono: "🌾", label: "Control Malezas", valor: "Natural"},
        {icono: "💰", label: "Costes Operativos", valor: "Bajísimos"},
        {icono: "⚡", label: "Esfuerzo Físico", valor: "Mínimo"}
      ],
      introduccion: "Durante siglos nos han enseñado que arar y voltear la tierra es indispensable para sembrar. Sin embargo, la ciencia del suelo moderna y la permacultura han demostrado lo contrario: **el laboreo constante destruye la microbiología nativa, erosiona el suelo y disipa el agua**. La técnica del **No Laboreo** (No-Till/No-Dig) imita el ciclo natural de la naturaleza, permitiendo que sean las lombrices y las micorrizas quienes preparen y abonen el suelo por ti.",
      secciones: [
        {
          titulo_h2: "🍂 ¿Por qué el arado convencional daña el suelo a largo plazo?",
          contenido_markdown: "El volteo mecánico rompe las **redes de micorrizas** (hongos benéficos que alimentan las raíces) y expone la vida biológica interna al sol, eliminando lombrices y bacterias beneficiosas. Además, el peso de la maquinaria compacta las capas inferiores creando la temida **suela de labor**, una capa arcillosa impenetrable que estanca el agua y asfixia las raíces en épocas húmedas, secando el suelo por completo en verano.\n\nAl no labrar, los canales de las raíces muertas y las galerías de las lombrices se conservan intactos, sirviendo como tuberías biológicas naturales para un drenaje impecable y una oxigenación constante.",
          imagen_posicion: "derecha",
          imagen_ruta: "/soil-comparison-diagram.png",
          imagen_alt: "Esquema comparativo de laboreo convencional vs no laboreo",
          imagen_title: "Comparativa de estructuras de suelo"
        },
        {
          titulo_h2: "🌱 El estándar de oro: Cómo funciona el método No-Dig",
          contenido_markdown: "Inventado por pioneros como Charles Dowding, el **No-Dig** (sin excavar) se basa en ahogar las malas hierbas nativas y depositar la nutrición puramente en superficie. El procedimiento básico consiste en:\n\n1. **Segar a ras de suelo:** Sin arrancar raíces.\n2. **Barrera de cartón:** Colocar cartón biodegradable humedecido para eliminar luz y malezas.\n3. **Capa de compost:** Depositar de 10 a 15 cm de compost de alta calidad directamente sobre el cartón.\n4. **Siembra directa:** Trasplantar las plántulas directamente sobre el compost fértil.\n\nEn pocos meses, las lombrices consumirán el cartón y mezclarán de manera uniforme el compost con el suelo virgen de abajo, creando una estructura mullida, esponjosa y rica en humus listísima para prosperar.\n\nTambién puedes ver a continuación un excelente video tutorial explicativo del método No-Dig paso a paso de la mano de Charles Dowding:",
          imagen_posicion: "izquierda",
          imagen_ruta: "/soil-layers-diagram.png",
          imagen_alt: "Capas de suelo método no-dig",
          imagen_title: "Capas de bancal No-Dig",
          video_youtube_url: "https://www.youtube.com/watch?v=55RT2RSqoCY&pp=ygUXbm8gbGFib3JlbyBkZSBsYSB0aWVycmE%3D"
        }
      ],
      consejos: {
        titulo: "💡 Claves para tener éxito en tu transición al No Laboreo",
        items: [
          "**Acolchado constante** — La tierra desnuda es un suelo enfermo. Mantén siempre una cobertura de paja o compost para evitar la evaporación.",
          "**Paciencia inicial** — Si vienes de un suelo muy compactado por años de arado, los primeros meses requerirán paciencia mientras la biología despierta.",
          "**Aireación vertical si es crítico** — Si la tierra está extremadamente dura al inicio, usa una horca de doble mango (broadfork) para abrir grietas sin voltear los perfiles."
        ]
      },
      cta: {
        titulo: "¿Listo para dejar que la naturaleza trabaje por ti?",
        subtitulo: "Configura tus preferencias de laboreo en tu perfil y recibe notificaciones y consejos específicos para tu forma de cultivar.",
        boton_primario: "⚙️ Ir a Mi Perfil",
        boton_secundario: "📖 Explorar Variedades"
      },
      tags: ["No-Till", "No-Dig", "Permacultura", "Regenerativo"],
      hero_imagen: "/soil-layers-diagram.png"
    };

    // Primero comprobar si ya existe para no duplicar
    const [existing] = await connection.execute('SELECT idblog FROM blog WHERE blogslug = ?', [blogSlug]);
    
    if (existing.length > 0) {
      console.log("El blog ya existe. Actualizando contenido...");
      await connection.execute(
        `UPDATE blog SET 
          blogtitulo = ?, 
          blogresumen = ?, 
          blogcontenido = ?, 
          blogimagen = ?, 
          blogestado = 'publicado',
          blogfechapublicacion = COALESCE(blogfechapublicacion, NOW())
        WHERE blogslug = ?`,
        [blogTitulo, blogResumen, JSON.stringify(blogJson), '/soil-layers-diagram.png', blogSlug]
      );
      console.log("¡Blog actualizado exitosamente!");
    } else {
      console.log("Insertando nuevo blog...");
      await connection.execute(
        `INSERT INTO blog 
          (blogslug, blogtitulo, blogresumen, blogcontenido, blogimagen, blogestado, blogfechacreacion, blogfechapublicacion) 
        VALUES (?, ?, ?, ?, ?, 'publicado', NOW(), NOW())`,
        [blogSlug, blogTitulo, blogResumen, JSON.stringify(blogJson), '/soil-layers-diagram.png']
      );
      console.log("¡Blog insertado exitosamente con estado PUBLICADO!");
    }

  } catch (error) {
    console.error("Error interactuando con la base de datos:", error);
  } finally {
    await connection.end();
  }
}

insertBlog();
