import mysql from 'mysql2/promise';

const uniqueIconMap = {
  creacion: '✨',
  planificacion: '🧭',
  siembra: '🫘',
  adquisicion: '🪙',
  pregerminacion: '💤',
  germinacion: '🐣',
  postgerminacion: '🍃',
  semillero: '🛡️',
  trasplante: '🕳️',
  enraizamiento: '⚓',
  inicio_crecimiento: '📈',
  crecimiento: '🌳',
  primeras_flores: '🌸',
  floracion: '🌼',
  primera_cosecha: '✂️',
  cosecha: '🍎',
  finalizado: '🏁',
  perdido: '🥀'
};

async function main() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Actualizando iconos de fases a emojis 100% únicos...");
    for (const [clave, icono] of Object.entries(uniqueIconMap)) {
      const [res] = await pool.query(
        'UPDATE fasescultivo SET fasescultivoicono = ? WHERE fasescultivoclave = ?',
        [icono, clave]
      );
      console.log(`Fase '${clave}': asignado icono '${icono}'. Filas afectadas: ${res.affectedRows}`);
    }
    console.log("¡Iconos únicos de fases actualizados correctamente!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    pool.end();
  }
}

main();
