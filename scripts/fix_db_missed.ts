import pool from '../src/lib/db';

async function fixMissing() {
  const connection = await pool.getConnection();
  try {
    console.log('Fixing missing DB renames...');
    
    // Check if table variedadesusuarios exists and rename to variedadesvegetalesusuarios
    try {
      await connection.query('RENAME TABLE variedadesusuarios TO variedadesvegetalesusuarios');
      console.log('Renamed variedadesusuarios to variedadesvegetalesusuarios');
    } catch (e) {
      console.log('Table variedadesusuarios might already be renamed or doesn\'t exist');
    }

    // Now rename columns in variedadesvegetalesusuarios
    try {
      const [cols] = await connection.query('SHOW COLUMNS FROM variedadesvegetalesusuarios');
      for (const col of cols as any[]) {
        const oldName = col.Field;
        if (oldName.includes('variedades') || oldName.includes('idespecies')) {
          let newName = oldName.replace('variedades', 'variedadesvegetales');
          newName = newName.replace('idespecies', 'idespeciesvegetales');
          if (oldName !== newName) {
            await connection.query(`ALTER TABLE variedadesvegetalesusuarios RENAME COLUMN ${oldName} TO ${newName}`);
            console.log(`Renamed col ${oldName} to ${newName}`);
          }
        }
      }
    } catch (e) { console.log('Error renaming cols in variedadesvegetalesusuarios', e); }

    // Did I rename especiesusuarios to especiesvegetalesusuarios? 
    // In code it says: FROM especiesusuarios eu WHERE eu.xespeciesvegetalesusuariosidespeciesvegetales
    // That means code expects table to be `especiesusuarios` but column to be `xespeciesvegetalesusuariosidespeciesvegetales`! 
    // Let's actually rename the table to `especiesvegetalesusuarios` for consistency!
    try {
      await connection.query('RENAME TABLE especiesusuarios TO especiesvegetalesusuarios');
      console.log('Renamed especiesusuarios to especiesvegetalesusuarios');
    } catch (e) {
      console.log('Table especiesusuarios might already be renamed');
    }

    // Now rename columns in especiesvegetalesusuarios
    try {
      const [cols] = await connection.query('SHOW COLUMNS FROM especiesvegetalesusuarios');
      for (const col of cols as any[]) {
        const oldName = col.Field;
        let newName = oldName.replace('especies', 'especiesvegetales');
        if (oldName !== newName) {
          await connection.query(`ALTER TABLE especiesvegetalesusuarios RENAME COLUMN ${oldName} TO ${newName}`);
          console.log(`Renamed col ${oldName} to ${newName}`);
        }
      }
    } catch (e) { console.log('Error renaming cols in especiesvegetalesusuarios', e); }
    
    // I need to rename any secondary tables that I forgot, like:
    // especiesafecciones -> especiesvegetalesafecciones ?
    // The code said: `FROM especiesafecciones ea WHERE ea.xespeciesvegetalesafeccionesidespeciesvegetales`
    // Let's just fix the columns in those tables to match `xespeciesvegetales...`
    const dependentTables = [
      'especiesafecciones', 'especiesfases', 'especiessinonimos', 
      'especiesplagas', 'especieslabores', 'especiesclimas', 'especiesasociaciones'
    ];
    for (const table of dependentTables) {
      try {
        const [cols] = await connection.query(`SHOW COLUMNS FROM ${table}`);
        for (const col of cols as any[]) {
          const oldName = col.Field;
          let newName = oldName.replace('especies', 'especiesvegetales');
          if (oldName !== newName && oldName.startsWith('xespecies')) {
            await connection.query(`ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`);
            console.log(`Renamed col ${oldName} to ${newName} in ${table}`);
          }
        }
      } catch (e) { console.log(`Error checking ${table}`, e); }
    }

    console.log('Done!');
  } finally {
    connection.release();
  }
}

fixMissing().catch(console.error);
