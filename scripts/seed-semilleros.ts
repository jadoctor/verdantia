import pool from '../src/lib/db';

async function run() {
  try {
    console.log("Limpiando la tabla semilleros...");
    await pool.query('TRUNCATE TABLE semilleros');

    console.log("Insertando registros comerciales reales...");
    
    const records = [
      // Hortícolas
      ['Bandeja EPS 216 Alvéolos', 'bandeja_alveolos', 216, 15, 3.2, '60x40x4 cm', 'Troncopiramidal', 0, 'EPS (Porexpan)', 1, 'Alta densidad. Ideal para cebollas, puerros o lechugas.'],
      ['Bandeja EPS 150 Alvéolos', 'bandeja_alveolos', 150, 22, 3.3, '60x40x5 cm', 'Troncopiramidal', 0, 'EPS (Porexpan)', 1, 'Uso estándar para hortícolas de ciclo corto.'],
      ['Bandeja Plástico 104 Alvéolos', 'bandeja_alveolos', 104, 35, 3.6, '54x28x4 cm', 'Cilíndrico', 0, 'Plástico flexible PET', 1, 'Muy común en semilleros comerciales para tomate y pimiento.'],
      ['Bandeja Plástico 60 Alvéolos', 'bandeja_alveolos', 60, 130, 7.8, '54x28x6 cm', 'Cuadrada', 0, 'Plástico rígido', 1, 'Ideal para cucurbitáceas (calabacín, melón, sandía) que necesitan más espacio.'],
      ['Bandeja EPS 28 Alvéolos', 'bandeja_alveolos', 28, 170, 4.7, '60x40x6 cm', 'Troncopiramidal', 0, 'EPS (Porexpan)', 1, 'Alvéolos muy grandes para hortalizas que estarán más tiempo en semillero.'],
      
      // Forestales
      ['Bandeja Forestal 60 Alvéolos', 'bandeja_alveolos', 60, 200, 12.0, '60x40x12 cm', 'Cónico profundo', 1, 'Plástico rígido HDPE', 1, 'Forestal pequeña. Con estrías antiespiralización.'],
      ['Bandeja Forestal 54 Alvéolos', 'bandeja_alveolos', 54, 250, 13.5, '60x40x15 cm', 'Cónico profundo', 1, 'Plástico rígido HDPE', 1, 'Excelente para árboles autóctonos.'],
      ['Bandeja Forestal 40 Alvéolos', 'bandeja_alveolos', 40, 300, 12.0, '60x40x16 cm', 'Cónico profundo', 1, 'Plástico rígido HDPE', 1, 'Para frutales y especies de raíz pivotante profunda.'],
      ['Bandeja Forestal 28 Alvéolos', 'bandeja_alveolos', 28, 400, 11.2, '60x40x18 cm', 'Cónico profundo', 1, 'Plástico rígido HDPE', 1, 'Máxima profundidad para árboles de crecimiento rápido.'],
      
      // Jiffys
      ['Jiffy Turba 24mm', 'pastilla_turba', 1, 15, 0.015, '2.4x2.4x4 cm', 'Cilíndrico', 0, 'Turba y malla biodegradable', 0, 'Muy pequeño, para semillas minúsculas.'],
      ['Jiffy Turba 33mm', 'pastilla_turba', 1, 25, 0.025, '3.3x3.3x4 cm', 'Cilíndrico', 0, 'Turba y malla biodegradable', 0, 'Tamaño estándar para huerto urbano.'],
      ['Jiffy Turba 41mm', 'pastilla_turba', 1, 40, 0.040, '4.1x4.1x4.5 cm', 'Cilíndrico', 0, 'Turba y malla biodegradable', 0, 'Para semillas de tomate, pimiento, berenjena.'],
      ['Jiffy Coco 44mm', 'pastilla_turba', 1, 50, 0.050, '4.4x4.4x5 cm', 'Cilíndrico', 0, 'Fibra de coco y malla', 0, 'Mayor aireación radicular, retiene menos agua que la turba.'],
      
      // Macetas
      ['Maceta Cuadrada 7x7x8', 'maceta_individual', 1, 250, 0.25, '7x7x8 cm', 'Cuadrada', 0, 'Plástico termoformado', 1, 'Para repicar plántulas desde bandeja plana o jiffy.'],
      ['Maceta Cuadrada 9x9x10', 'maceta_individual', 1, 500, 0.50, '9x9x10 cm', 'Cuadrada', 0, 'Plástico rígido', 1, 'El estándar en viveros para vender plantones hortícolas.'],
      ['Maceta Redonda 14cm', 'maceta_individual', 1, 1500, 1.50, '14x14x12 cm', 'Cilíndrica', 0, 'Plástico rígido', 1, 'Macetón para plantones desarrollados o frutales pequeños.'],
      
      // Biodegradables
      ['Maceta Biodegradable 6cm', 'biodegradable', 1, 100, 0.10, '6x6x6 cm', 'Cilíndrica o Cuadrada', 0, 'Pulpa de papel/cartón', 0, 'Se entierra directamente con la planta para evitar estrés radicular.'],
      ['Maceta Biodegradable 8cm', 'biodegradable', 1, 200, 0.20, '8x8x8 cm', 'Cilíndrica o Cuadrada', 0, 'Pulpa de papel/cartón', 0, 'Mayor tamaño, ideal para cucurbitáceas que no soportan bien el trasplante a raíz desnuda.'],
      
      // Bandejas Planas
      ['Bandeja Plana de Germinación', 'bandeja_plana', 1, 15000, 15.0, '60x40x7 cm', 'Sin alvéolos', 0, 'Plástico rígido', 1, 'Se llena de sustrato y se siembra a voleo para repicar posteriormente.']
    ];

    const query = `
      INSERT INTO semilleros (
        semillerosnombre, semillerostipo, semilleroscantidadalveolos, semillerosvolumenalveolocc,
        semillerosvolumentotallitros, semillerosdimensiones, semillerosformaalveolo,
        semillerosantiespiralizacion, semillerosmaterial, semillerosreutilizable, semillerosobservaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const record of records) {
      await pool.query(query, record);
    }

    console.log(`¡Éxito! Se han insertado ${records.length} modelos de semilleros y contenedores en la base de datos.`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

run();
