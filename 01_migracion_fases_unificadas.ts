import pool from './src/lib/db.ts';

const fasesUnificadas = [
  { clave: 'creacion', nombre: 'Fase de Creación', orden: 1, color: '#94a3b8', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Timestamp automático al registrar el cultivo.' },
  { clave: 'planificacion', nombre: 'Planificación', orden: 2, color: '#cbd5e1', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Periodo de preparación previa al inicio físico.' },
  { clave: 'siembra', nombre: 'Siembra (Semilla)', orden: 3, color: '#8b5cf6', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día exacto en que la semilla toca la tierra.' },
  { clave: 'adquisicion', nombre: 'Adquisición (Plantón)', orden: 4, color: '#a78bfa', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día en que se compra el plantón físico.' },
  { clave: 'pregerminacion', nombre: 'Pre-germinación', orden: 5, color: '#c4b5fd', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Latencia de la semilla bajo tierra.' },
  { clave: 'germinacion', nombre: 'Germinación', orden: 6, color: '#60a5fa', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día que asoma el primer brote a la superficie.' },
  { clave: 'postgerminacion', nombre: 'Post-germinación', orden: 7, color: '#93c5fd', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Desarrollo de las primeras hojas verdaderas.' },
  { clave: 'hitoplanton', nombre: 'Alcanza Rango Plantón', orden: 8, color: '#34d399', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día que la plántula tiene el tamaño de plantón.' },
  { clave: 'semillero', nombre: 'Etapa de Plantón', orden: 9, color: '#10b981', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Desarrollo en entorno protegido/maceta (Semillero).' },
  { clave: 'trasplante', nombre: 'Plantación / Trasplante', orden: 10, color: '#059669', icono: '📍', tipo: 'Hito', esfin: 0, desc: 'Día exacto de traslado al suelo definitivo.' },
  { clave: 'enraizamiento', nombre: 'Enraizamiento', orden: 11, color: '#047857', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Adaptación y desarrollo radicular en suelo.' },
  { clave: 'crecimiento', nombre: 'Crecimiento Vegetativo', orden: 12, color: '#84cc16', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Desarrollo masivo de tallos y hojas.' },
  { clave: 'floracion', nombre: 'Floración', orden: 13, color: '#fbbf24', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Polinización y cuajado.' },
  { clave: 'cosecha', nombre: 'Cosecha', orden: 14, color: '#f59e0b', icono: '⏳', tipo: 'Fase', esfin: 0, desc: 'Época de recolección de frutos.' },
  { clave: 'finalizado', nombre: 'Finalizado', orden: 15, color: '#475569', icono: '🏁', tipo: 'Hito Final', esfin: 1, desc: 'Conclusión natural del ciclo.' },
  { clave: 'perdido', nombre: 'Perdido', orden: 99, color: '#ef4444', icono: '🥀', tipo: 'Hito Final', esfin: 1, desc: 'Fracaso en cualquier punto del ciclo.' }
];

async function run() {
  try {
    console.log('Iniciando migración de Fases Unificadas...');

    // 1. Asegurar que existe la columna 'fasescultivotipo'
    try {
      await pool.query("ALTER TABLE fasescultivo ADD COLUMN fasescultivotipo VARCHAR(20) DEFAULT 'Fase'");
      console.log("Columna 'fasescultivotipo' añadida con éxito.");
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("La columna 'fasescultivotipo' ya existe.");
      } else {
        throw e;
      }
    }

    // 2. Asegurar que existe la columna 'fasescultivoesfin' (por si acaso)
    try {
      await pool.query("ALTER TABLE fasescultivo ADD COLUMN fasescultivoesfin TINYINT(1) DEFAULT 0");
      console.log("Columna 'fasescultivoesfin' añadida con éxito.");
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("La columna 'fasescultivoesfin' ya existe.");
      } else {
        throw e;
      }
    }

    // 3. Renombrar claves antiguas a las nuevas para evitar fallos de Foreign Key
    console.log("Renombrando claves antiguas...");
    const renames = [
      { old: 'planificado', new: 'planificacion' },
      { old: 'germinando', new: 'germinacion' },
      { old: 'produccion', new: 'cosecha' }
    ];

    for (const r of renames) {
      await pool.query("UPDATE fasescultivo SET fasescultivoclave = ? WHERE fasescultivoclave = ?", [r.new, r.old]);
      // 4. Actualizar laborespauta al mismo tiempo
      await pool.query("UPDATE laborespauta SET laborespautafase = ? WHERE laborespautafase = ?", [r.new, r.old]);
    }

    // 5. Insertar o Actualizar el diccionario maestro
    console.log("Actualizando el diccionario maestro de fases...");
    for (const f of fasesUnificadas) {
      const [existing]: any = await pool.query("SELECT idfasescultivo FROM fasescultivo WHERE fasescultivoclave = ?", [f.clave]);
      
      if (existing.length > 0) {
        // Actualizar
        await pool.query(
          "UPDATE fasescultivo SET fasescultivonombre = ?, fasescultivoorden = ?, fasescultivocolor = ?, fasescultivoicono = ?, fasescultivotipo = ?, fasescultivoesfin = ?, fasescultivodescripcion = ? WHERE fasescultivoclave = ?",
          [f.nombre, f.orden, f.color, f.icono, f.tipo, f.esfin, f.desc, f.clave]
        );
      } else {
        // Insertar nuevo
        await pool.query(
          "INSERT INTO fasescultivo (fasescultivoclave, fasescultivonombre, fasescultivoorden, fasescultivocolor, fasescultivoicono, fasescultivotipo, fasescultivoesfin, fasescultivodescripcion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [f.clave, f.nombre, f.orden, f.color, f.icono, f.tipo, f.esfin, f.desc]
        );
      }
    }

    console.log("Migración completada con éxito. Catálogo de fases al día.");

  } catch (err) {
    console.error("Error durante la migración:", err);
  } finally {
    process.exit(0);
  }
}

run();
