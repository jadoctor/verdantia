const mysql = require('mysql2/promise');

async function alterTable() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  const query = `
    ALTER TABLE datosadjuntos
    ADD COLUMN xdatosadjuntosidtratamientos INT DEFAULT NULL,
    ADD CONSTRAINT fk_datosadjuntos_tratamientos 
    FOREIGN KEY (xdatosadjuntosidtratamientos) REFERENCES tratamientos(idtratamientos) ON DELETE CASCADE;
  `;

  try {
    await pool.query(query);
    console.log('Column xdatosadjuntosidtratamientos added successfully.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error altering table:', error.message);
    }
  } finally {
    await pool.end();
  }
}

alterTable();
