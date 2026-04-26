import pool from './src/lib/db';

async function downgradeRole() {
  try {
    await pool.query("UPDATE usuarios SET usuariosroles = 'visitante' WHERE usuariosemail = 'saludporalimentos@gmail.com'");
    console.log('Role downgraded to visitante successfully.');
  } catch (err) {
    console.error('Error updating role:', err);
  } finally {
    process.exit(0);
  }
}

downgradeRole();
