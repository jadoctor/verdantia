import pool from '../src/lib/db';

async function main() {
  try {
    console.log('Creating cultivosubicaciones table...');
    
    // Create the new table following naming conventions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`cultivosubicaciones\` (
        \`idcultivosubicaciones\` int(11) NOT NULL AUTO_INCREMENT,
        \`xcultivosubicacionesidcultivos\` int(11) NOT NULL,
        \`xcultivosubicacionesidbancales\` int(11) NOT NULL,
        \`cultivosubicacionesposicionx\` float NOT NULL,
        \`cultivosubicacionesposiciony\` float NOT NULL,
        \`cultivosubicacionesfecha\` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`idcultivosubicaciones\`),
        KEY \`fk_cultubic_cultivos\` (\`xcultivosubicacionesidcultivos\`),
        KEY \`fk_cultubic_bancales\` (\`xcultivosubicacionesidbancales\`),
        CONSTRAINT \`fk_cultubic_cultivos\` FOREIGN KEY (\`xcultivosubicacionesidcultivos\`) REFERENCES \`cultivos\` (\`idcultivos\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_cultubic_bancales\` FOREIGN KEY (\`xcultivosubicacionesidbancales\`) REFERENCES \`bancales\` (\`idbancales\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('Table created successfully. Migrating existing data...');
    
    // Migrate data from cultivos to cultivosubicaciones
    // We only migrate crops that have a bed assigned and a valid X,Y coordinate
    const [result]: any = await pool.query(`
      INSERT INTO cultivosubicaciones (
        xcultivosubicacionesidcultivos, 
        xcultivosubicacionesidbancales, 
        cultivosubicacionesposicionx, 
        cultivosubicacionesposiciony
      )
      SELECT 
        idcultivos, 
        xcultivosidbancales, 
        cultivosposicionx, 
        cultivosposiciony 
      FROM cultivos 
      WHERE xcultivosidbancales IS NOT NULL 
        AND cultivosposicionx IS NOT NULL 
        AND cultivosposiciony IS NOT NULL
        AND idcultivos NOT IN (SELECT xcultivosubicacionesidcultivos FROM cultivosubicaciones);
    `);
    
    console.log(`Migration complete. Rows inserted: ${result.affectedRows}`);
    
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    process.exit(0);
  }
}

main();
