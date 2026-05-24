import pool from './src/lib/db';

async function alterTable() {
  try {
    await pool.query("ALTER TABLE usuariossuscripciones ADD COLUMN usuariossuscripcionesorigen ENUM('pago_directo', 'trial_inicial', 'degradacion_trial', 'degradacion_pago', 'asignado_admin') DEFAULT 'asignado_admin' NOT NULL");
    console.log("Column usuariossuscripcionesorigen added successfully.");
  } catch(e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists.");
    } else {
      console.error(e);
    }
  }
  process.exit(0);
}
alterTable();
