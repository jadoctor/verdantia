const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  try {
    console.log("1. Modificando ENUM cultivosestado de la tabla cultivos...");
    await pool.query(`
      ALTER TABLE cultivos 
      MODIFY COLUMN cultivosestado ENUM('en_espera', 'germinacion', 'crecimiento_inicial', 'crecimiento', 'fructificacion', 'recoleccion', 'produccion', 'finalizado', 'perdido') 
      NOT NULL DEFAULT 'en_espera'
    `);
    console.log("¡ENUM cultivosestado modificado con éxito!");

    console.log("2. Insertando/actualizando las fases y los nuevos hitos en fasescultivo...");
    
    // Lista de todas las fases y hitos unificados y actualizados
    const fases = [
      { clave: 'creacion', nombre: 'Hito Creación', orden: 1, color: '#94a3b8', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Timestamp automático al registrar el cultivo.', desde: null, hasta: null },
      { clave: 'planificacion', nombre: 'Fase Planificación', orden: 2, color: '#cbd5e1', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Periodo de preparación previa al inicio físico.', desde: 'creacion', hasta: 'siembra,adquisicion' },
      { clave: 'siembra', nombre: 'Hito Siembra', orden: 3, color: '#8b5cf6', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día exacto en que la semilla toca la tierra.', desde: null, hasta: null },
      { clave: 'adquisicion', nombre: 'Hito Adquisición (Plantón)', orden: 4, color: '#a78bfa', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día en que se compra el plantón físico.', desde: null, hasta: null },
      { clave: 'pregerminacion', nombre: 'Fase de Pregerminación', orden: 5, color: '#c4b5fd', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Latencia de la semilla bajo tierra.', desde: 'siembra', hasta: 'germinacion' },
      { clave: 'germinacion', nombre: 'Hito Germinación', orden: 6, color: '#60a5fa', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día que asoma el primer brote a la superficie.', desde: null, hasta: null },
      { clave: 'postgerminacion', nombre: 'Fase Postgerminación', orden: 7, color: '#93c5fd', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Desarrollo de las primeras hojas verdaderas.', desde: 'germinacion', hasta: 'trasplante,inicio_crecimiento' },
      { clave: 'semillero', nombre: 'Fase de Plantón', orden: 9, color: '#10b981', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Desarrollo en entorno protegido/maceta (Semillero).', desde: 'adquisicion', hasta: 'trasplante' },
      { clave: 'trasplante', nombre: 'Hito Plantación', orden: 10, color: '#059669', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día exacto de traslado al suelo definitivo.', desde: null, hasta: null },
      { clave: 'enraizamiento', nombre: 'Fase Posplantación', orden: 11, color: '#047857', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Adaptación y desarrollo radicular en suelo.', desde: 'trasplante', hasta: 'inicio_crecimiento' },
      { clave: 'inicio_crecimiento', nombre: 'Hito Inicio Crecimiento', orden: 12, color: '#10b981', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día que comienza el crecimiento vegetativo firme.', desde: null, hasta: null },
      { clave: 'crecimiento', nombre: 'Fase Crecimiento Vegetativo', orden: 13, color: '#84cc16', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Desarrollo masivo de tallos y hojas.', desde: 'inicio_crecimiento', hasta: 'primeras_flores' },
      { clave: 'primeras_flores', nombre: 'Hito Primeras Flores', orden: 14, color: '#f59e0b', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día que aparecen los primeros botones florales o flores.', desde: null, hasta: null },
      { clave: 'floracion', nombre: 'Fase Floración', orden: 15, color: '#fbbf24', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Polinización y cuajado.', desde: 'primeras_flores', hasta: 'primera_cosecha' },
      { clave: 'primera_cosecha', nombre: 'Hito Primera Cosecha', orden: 16, color: '#fdba74', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día de la primera recolección de frutos.', desde: null, hasta: null },
      { clave: 'cosecha', nombre: 'Fase Cosecha', orden: 17, color: '#f59e0b', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Época de recolección de frutos.', desde: 'primera_cosecha', hasta: 'finalizado' },
      { clave: 'finalizado', nombre: 'Finalizado', orden: 18, color: '#475569', icono: '🏁', tipo: 'Hito Final', esfin: 1, desc: 'Conclusión natural del ciclo.', desde: null, hasta: null },
      { clave: 'perdido', nombre: 'Perdido', orden: 99, color: '#ef4444', icono: '🥀', tipo: 'Hito Final', esfin: 1, desc: 'Fracaso en cualquier punto del ciclo.', desde: null, hasta: null }
    ];

    for (const f of fases) {
      const [existing] = await pool.query('SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = ?', [f.clave]);
      if (existing.length > 0) {
        await pool.query(`
          UPDATE fasescultivo 
          SET fasescultivonombre = ?, 
              fasescultivoorden = ?, 
              fasescultivocolor = ?, 
              fasescultivoicono = ?, 
              fasescultivotipo = ?, 
              fasescultivoesfin = ?, 
              fasescultivodescripcion = ?,
              fasescultivodesde = ?,
              fasescultivohasta = ?
          WHERE fasescultivoclave = ?
        `, [f.nombre, f.orden, f.color, f.icono, f.tipo, f.esfin, f.desc, f.desde, f.hasta, f.clave]);
        console.log(`Fase actualizada: ${f.clave}`);
      } else {
        await pool.query(`
          INSERT INTO fasescultivo (fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivocolor, fasescultivoicono, fasescultivotipo, fasescultivoesfin, fasescultivodescripcion, fasescultivodesde, fasescultivohasta)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [f.clave, f.nombre, f.orden, f.color, f.icono, f.tipo, f.esfin, f.desc, f.desde, f.hasta]);
        console.log(`Nueva fase insertada: ${f.clave}`);
      }
    }

    console.log("¡Migración de base de datos finalizada correctamente!");
  } catch (err) {
    console.error("Error durante la migración:", err);
  } finally {
    await pool.end();
  }
}

run();
