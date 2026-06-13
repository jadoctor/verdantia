const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'srv2070.hstgr.io',
  user: 'u117557593_Verdantia',
  password: 'Hostingerja0334&',
  database: 'u117557593_Verdantia',
}).promise();

async function main() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Update laborespauta references
    console.log("Migrating laborespauta references from 'postsiembra' to 'pregerminacion'...");
    const [updateResult] = await connection.query(
      "UPDATE laborespauta SET laborespautafase = 'pregerminacion' WHERE laborespautafase = 'postsiembra'"
    );
    console.log(`Updated ${updateResult.affectedRows} rows in laborespauta.`);

    // 2. Delete postsiembra phase
    console.log("Deleting 'postsiembra' from fasescultivo...");
    const [deleteResult] = await connection.query(
      "DELETE FROM fasescultivo WHERE fasescultivoclave = 'postsiembra'"
    );
    console.log(`Deleted ${deleteResult.affectedRows} rows from fasescultivo.`);

    await connection.commit();
    console.log("Transaction committed successfully!");
  } catch (error) {
    await connection.rollback();
    console.error("Error occurred, transaction rolled back:", error);
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch(console.error);
