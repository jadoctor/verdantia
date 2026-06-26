const mysql = require('mysql2/promise');

async function mapTratamientos() {
  const pool = mysql.createPool({
    host: 'srv2070.hstgr.io',
    user: 'u117557593_Verdantia',
    password: 'Hostingerja0334&',
    database: 'u117557593_Verdantia',
  });

  // ID Plantas:
  // 1: Hojas, 2: Frutos, 3: Raíz, 4: Tallo, 5: Flores, 6: Semillas, 7: Toda la planta
  
  const mappings = [
    { t: 1, p: [1, 4] },       // Jabón Potásico -> Hojas, Tallo
    { t: 2, p: [1, 3] },       // Aceite de Neem -> Hojas, Raíz
    { t: 3, p: [1, 3, 4] },    // Tierra de Diatomeas -> Hojas, Raíz, Tallo
    { t: 4, p: [1, 2] },       // Ajo y Guindilla -> Hojas, Frutos
    { t: 5, p: [1] },          // Cola de Caballo -> Hojas
    { t: 6, p: [1, 4] },       // Cobre -> Hojas, Tallo
    { t: 7, p: [1, 2] },       // Azufre -> Hojas, Frutos
    { t: 8, p: [1, 2] },       // Bicarbonato -> Hojas, Frutos
    { t: 9, p: [1, 2] },       // BT -> Hojas, Frutos
    { t: 10, p: [3, 4] },      // Trichoderma -> Raíz, Tallo
    { t: 11, p: [3] },         // Nematodos -> Raíz
    { t: 12, p: [1, 3] },      // Purín de ortigas -> Hojas, Raíz
  ];

  try {
    await pool.query('DELETE FROM tratamientosplantasparte'); // Clear first
    for (const m of mappings) {
      if (m.p.length > 0) {
        const values = m.p.map(idp => [m.t, idp]);
        await pool.query('INSERT INTO tratamientosplantasparte (xtratamientosplantasparteidtratamientos, xtratamientosplantasparteidplantasparte) VALUES ?', [values]);
      }
    }
    console.log('Mappings inserted successfully.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

mapTratamientos();
