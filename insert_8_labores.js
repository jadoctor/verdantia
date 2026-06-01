const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  const labors = [
    {
      nombre: 'Ocultación (Tarping)',
      desc: 'Cubrir la cama de cultivo con lonas opacas durante varias semanas para matar malas hierbas y restos del cultivo anterior mediante falta de luz y calor.',
      icono: 'mdi-layers',
      color: '#1e293b',
      conv: 0, min: 1, no: 1
    },
    {
      nombre: 'Aporte de Compost en Superficie',
      desc: 'Añadir una capa gruesa de compost directamente sobre la superficie del suelo sin mezclarlo ni enterrarlo, dejando que los microorganismos lo integren.',
      icono: 'mdi-shovel',
      color: '#854d0e',
      conv: 0, min: 1, no: 1
    },
    {
      nombre: 'Rolado / Picado de Abono Verde',
      desc: 'Tumbar o segar un cultivo de cobertura y dejar los restos sobre la misma cama como acolchado muerto, sembrando directamente sobre él.',
      icono: 'mdi-tractor', // Or mdi-scissors-cutting
      color: '#16a34a',
      conv: 0, min: 1, no: 1
    },
    {
      nombre: 'Deshierbe Térmico (Lanzallamas)',
      desc: 'Quemar rápidamente los brotes de malas hierbas con un soplete agrícola antes de que emerja el cultivo principal.',
      icono: 'mdi-weather-sunny', // Fire equivalent
      color: '#ef4444',
      conv: 0, min: 1, no: 1
    },
    {
      nombre: 'Escarificado Superficial',
      desc: 'Romper únicamente la costra superficial del suelo (los primeros 2-3 cm) utilizando escardaderas de alambre para eliminar hierbas recién nacidas.',
      icono: 'mdi-pitchfork',
      color: '#d97706',
      conv: 1, min: 1, no: 0
    },
    {
      nombre: 'Arado Profundo / Subsolado',
      desc: 'Voltear las capas profundas de la tierra o romper la suela de labor empleando arados de vertedera o subsoladores tirados por tractor.',
      icono: 'mdi-tractor',
      color: '#b45309',
      conv: 1, min: 0, no: 0
    },
    {
      nombre: 'Fresado (Pase de Rotovator)',
      desc: 'Pulverizar y triturar la tierra finamente usando cuchillas rotativas para dejar un lecho de siembra perfecto, alterando la estructura del suelo.',
      icono: 'mdi-agriculture',
      color: '#ea580c',
      conv: 1, min: 0, no: 0
    },
    {
      nombre: 'Aporcado',
      desc: 'Arrastrar y amontonar tierra alrededor de la base del tallo de la planta para blanquear el tallo o fomentar raíces laterales.',
      icono: 'mdi-shovel',
      color: '#a16207',
      conv: 1, min: 1, no: 0
    }
  ];

  try {
    for (const labor of labors) {
      const q = `
        INSERT INTO labores (
          laboresnombre, 
          laboresdescripcion, 
          laboresicono, 
          laborescolor, 
          laboresactivosino, 
          laboresaplicaconvencional, 
          laboresaplicaminimo, 
          laboresaplicanolaboreo
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
      `;
      await pool.query(q, [labor.nombre, labor.desc, labor.icono, labor.color, labor.conv, labor.min, labor.no]);
    }
    console.log("All 8 labors inserted successfully.");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

run();
