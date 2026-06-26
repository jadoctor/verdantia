import pool from './src/lib/db';

async function run() {
  try {
    const [rows]: any = await pool.query('SELECT idfasescultivo, fasescultivonombre, fasescultivoorden FROM fasescultivo ORDER BY fasescultivoorden ASC');
    
    let counter = 1;
    for (const row of rows) {
      let newOrder = counter;
      if (row.fasescultivonombre === 'Perdido') {
        newOrder = 99; // Mantener siempre al final
      } else {
        counter++;
      }
      await pool.query('UPDATE fasescultivo SET fasescultivoorden = ? WHERE idfasescultivo = ?', [newOrder, row.idfasescultivo]);
      console.log(`✅ FasesCultivo actualizado: ${row.fasescultivonombre} -> Orden ${newOrder}`);
    }
    console.log('🎉 Todas las fases han sido reordenadas correctamente.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
