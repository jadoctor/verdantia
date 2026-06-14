import mysql from 'mysql2/promise';

async function run() {
  const connection = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia'
  });

  try {
    console.log("Adding familiasdescripcion column...");
    await connection.execute("ALTER TABLE familias ADD COLUMN familiasdescripcion TEXT;");
    console.log("Column added successfully!");
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error("Error adding column:", error);
    }
  } finally {
    await connection.end();
  }
}

run();
