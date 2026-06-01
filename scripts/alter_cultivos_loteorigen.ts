import pool from '../src/lib/db';

async function main() {
  try {
    console.log('Adding xcultivosidloteorigen to cultivos table...');
    await pool.query(`
      ALTER TABLE \`cultivos\`
      ADD COLUMN \`xcultivosidloteorigen\` int(11) DEFAULT NULL,
      ADD CONSTRAINT \`fk_cultivos_loteorigen\` 
      FOREIGN KEY (\`xcultivosidloteorigen\`) REFERENCES \`cultivos\`(\`idcultivos\`) ON DELETE SET NULL;
    `);
    console.log('Successfully altered cultivos table.');
  } catch (err: any) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column xcultivosidloteorigen already exists.');
    } else {
      console.error('Error altering table:', err);
    }
  } finally {
    process.exit(0);
  }
}

main();
