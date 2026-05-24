import pool from '../src/lib/db.js';

async function run() {
  try {
    console.log('Actualizando iconos de logros...');
    
    const updates = [
      [1, '🌾'],
      [2, '🌱'],
      [3, '🪴'],
      [4, '🌻'],
      [5, '🍅'],
      [6, '🧑‍🌾'],
      [7, '⚜️'],
      [8, '🦉'],
      [9, '🛡️'],
      [10, '👑'],
    ];

    for (const [nivel, icono] of updates) {
      await pool.query('UPDATE logros SET logrosicono = ? WHERE logrosnivel = ?', [icono, nivel]);
      console.log(`  Nivel ${nivel} → ${icono}`);
    }

    console.log('Iconos actualizados con éxito.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

run();
