const mysql = require('mysql2/promise');

async function seedTratamientos() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  const tratamientos = [
    // Insecticidas
    {
      n: 'Jabón Potásico',
      t: 'Ecológico / Contacto',
      d: 'Insecticida de contacto que reblandece el exoesqueleto de insectos de caparazón blando (pulgón, mosca blanca, cochinilla).',
      pr: '10-20 ml por litro de agua. Pulverizar bien por el envés de las hojas al atardecer.',
      pc: 'Evitar aplicarlo a pleno sol para no quemar las hojas. No afecta a las abejas.'
    },
    {
      n: 'Aceite de Neem',
      t: 'Ecológico / Sistémico',
      d: 'Actúa como repelente e inhibidor del crecimiento de insectos y ácaros. Muy potente si se combina con Jabón Potásico.',
      pr: '3-5 ml por litro de agua + 5ml de jabón potásico (como emulsionante).',
      pc: 'Aplicar en horas de baja insolación. Puede ser tóxico en dosis muy altas.'
    },
    {
      n: 'Tierra de Diatomeas',
      t: 'Ecológico / Físico',
      d: 'Microalgas fosilizadas que actúan de forma mecánica, rasgando y deshidratando a insectos rastreros (hormigas, caracoles, orugas).',
      pr: 'Espolvorear directamente sobre el sustrato o tallo (polvo seco), o diluir 20g por litro de agua.',
      pc: 'Pierde eficacia si se moja (vuelve a actuar al secarse). Usar mascarilla al espolvorear.'
    },
    {
      n: 'Extracto de Ajo y Guindilla',
      t: 'Ecológico / Repelente',
      d: 'Repelente natural muy efectivo contra pulgones, ácaros y minadores gracias a sus compuestos azufrados.',
      pr: 'Triturar 5 dientes de ajo + 2 guindillas en 1L de agua. Macerar 24h, colar y pulverizar.',
      pc: 'Irrita ojos y mucosas. Usar guantes y gafas durante la preparación.'
    },

    // Funguicidas
    {
      n: 'Decocción de Cola de Caballo',
      t: 'Ecológico / Preventivo',
      d: 'Alto contenido en sílice que refuerza la pared celular de la planta, previniendo hongos como el oídio y el mildiu.',
      pr: 'Hervir 100g de planta seca en 1L de agua durante 30 min. Diluir 1:5 en agua para pulverizar.',
      pc: 'Aplicar de forma preventiva cada 15 días, especialmente en épocas de alta humedad.'
    },
    {
      n: 'Funguicida de Cobre',
      t: 'Convencional / Ecológico',
      d: 'Tratamiento tradicional de amplio espectro contra el mildiu, roya y botrytis.',
      pr: 'Disolver la dosis del fabricante (aprox. 3g/L) en agua. Pulverizar cubriendo bien la planta.',
      pc: 'Toxico por acumulación en el suelo. Respetar los plazos de seguridad antes de cosecha.'
    },
    {
      n: 'Azufre en Polvo / Mojable',
      t: 'Convencional / Ecológico',
      d: 'Funguicida preventivo y curativo estrella contra el oídio y efectivo también contra los ácaros (araña roja).',
      pr: 'Espolvoreo directo a primera hora de la mañana, o diluido en agua (azufre mojable) a 2-3 g/L.',
      pc: 'ATENCIÓN: Quema las hojas si se aplica a temperaturas superiores a 28°C-30°C.'
    },
    {
      n: 'Bicarbonato Sódico',
      t: 'Ecológico / Curativo',
      d: 'Altera el pH de la superficie de la hoja, deteniendo la expansión de hongos ya instalados (especialmente oídio).',
      pr: '1 cucharada sopera de bicarbonato + unas gotas de jabón potásico en 1L de agua.',
      pc: 'No abusar, ya que puede acumular sodio en el suelo a largo plazo.'
    },

    // Biológico
    {
      n: 'Bacillus thuringiensis (BT)',
      t: 'Control Biológico',
      d: 'Bacteria grampositiva cuyo cristal proteico es letal para las larvas de lepidópteros (orugas, tuta absoluta).',
      pr: '1-2 gramos por litro de agua. Pulverizar a última hora de la tarde cubriendo el envés.',
      pc: 'Altamente específico para orugas. Se degrada rápidamente con la luz UV solar.'
    },
    {
      n: 'Trichoderma harzianum',
      t: 'Control Biológico',
      d: 'Hongo beneficioso que coloniza las raíces y compite por el espacio, aniquilando a hongos patógenos del suelo (Fusarium, Pythium).',
      pr: 'Mezclar con el sustrato en el momento de la siembra o diluir en agua de riego.',
      pc: 'No aplicar junto a funguicidas químicos o de cobre, ya que matarían a la Trichoderma.'
    },
    {
      n: 'Nematodos Entomopatógenos',
      t: 'Control Biológico',
      d: 'Microorganismos que parasitan y destruyen larvas que viven en el suelo o tallos (gusano del alambre, larvas de mosca).',
      pr: 'Disolver la esponja con nematodos en agua y aplicar en riego sobre el sustrato húmedo.',
      pc: 'El suelo debe mantenerse húmedo durante 2 semanas. Sensibles al calor extremo.'
    },

    // Biopreparados
    {
      n: 'Purín de Ortigas',
      t: 'Ecológico / Biostimulante',
      d: 'Fermento rico en nitrógeno, hierro y microorganismos. Actúa como abono foliar, estimulante y repelente de ácaros.',
      pr: 'Macerar 1kg de ortiga fresca en 10L de agua durante 10-15 días (hasta que deje de burbujear). Diluir 1:10 para riego o 1:20 para foliar.',
      pc: 'Olor muy fuerte durante fermentación. Filtrar muy bien antes de usar en pulverizador.'
    }
  ];

  for (const t of tratamientos) {
    try {
      const query = `
        INSERT INTO tratamientos (
          tratamientosnombre, tratamientostipo, tratamientosdescripcion,
          tratamientospreparacion, tratamientosprecauciones
        ) VALUES (?, ?, ?, ?, ?)
      `;
      await pool.query(query, [t.n, t.t, t.d, t.pr, t.pc]);
      console.log(`Insertado: ${t.n}`);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY' || err.message.includes('Duplicate')) {
        console.log(`Saltando (ya existe): ${t.n}`);
      } else {
        console.error(`Error insertando ${t.n}:`, err.message);
      }
    }
  }

  await pool.end();
  console.log('Seed de tratamientos completado.');
}

seedTratamientos();
