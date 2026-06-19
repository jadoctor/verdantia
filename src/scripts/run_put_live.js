const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
    port: 3306
  });

  // Let's query current records for species 3
  const [current] = await conn.query("SELECT * FROM especiesconsumidores WHERE xespeciesconsumidoresidespecies = 3");
  console.log("Current rows in DB:", current.length);

  // Payload to insert multiple parts
  const nextConsumos = [
    // Update existing one
    {
      idespeciesconsumidores: 11,
      xespeciesconsumidoresidespecies: 3,
      xespeciesconsumidoresidconsumidores: 1,
      especiesconsumidoresesapto: 1,
      xespeciesconsumidoresidplantasparte: 2,
      especiesconsumidoresnotas: 'Test frutos'
    },
    // New ones
    {
      idespeciesconsumidores: null,
      xespeciesconsumidoresidespecies: 3,
      xespeciesconsumidoresidconsumidores: 1,
      especiesconsumidoresesapto: 0,
      xespeciesconsumidoresidplantasparte: 1,
      especiesconsumidoresnotas: 'Test hojas'
    },
    {
      idespeciesconsumidores: null,
      xespeciesconsumidoresidespecies: 3,
      xespeciesconsumidoresidconsumidores: 1,
      especiesconsumidoresesapto: 0,
      xespeciesconsumidoresidplantasparte: 4,
      especiesconsumidoresnotas: 'Test tallo'
    }
  ];

  await conn.beginTransaction();
  try {
    for (const c of nextConsumos) {
      if (c.idespeciesconsumidores) {
        console.log(`Updating id: ${c.idespeciesconsumidores}`);
        await conn.query(`
          UPDATE especiesconsumidores SET 
            xespeciesconsumidoresidconsumidores = ?,
            especiesconsumidoresesapto = ?,
            xespeciesconsumidoresidplantasparte = ?,
            especiesconsumidoresnotas = ?
          WHERE idespeciesconsumidores = ? AND xespeciesconsumidoresidespecies = ?
        `, [
          c.xespeciesconsumidoresidconsumidores,
          c.especiesconsumidoresesapto,
          c.xespeciesconsumidoresidplantasparte,
          c.especiesconsumidoresnotas,
          c.idespeciesconsumidores,
          3
        ]);
      } else {
        console.log(`Inserting new part: ${c.xespeciesconsumidoresidplantasparte}`);
        await conn.query(`
          INSERT INTO especiesconsumidores (
            xespeciesconsumidoresidespecies,
            xespeciesconsumidoresidconsumidores,
            especiesconsumidoresesapto,
            xespeciesconsumidoresidplantasparte,
            especiesconsumidoresnotas
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          3,
          c.xespeciesconsumidoresidconsumidores,
          c.especiesconsumidoresesapto,
          c.xespeciesconsumidoresidplantasparte,
          c.especiesconsumidoresnotas
        ]);
      }
    }
    await conn.commit();
    console.log("Transaction successfully committed!");
  } catch (err) {
    await conn.rollback();
    console.error("Transaction rolled back! ERROR:", err);
  } finally {
    await conn.end();
  }
}

run().catch(console.error);
