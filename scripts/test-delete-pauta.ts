import pool from '../src/lib/db';
import { DELETE } from '../src/app/api/admin/especies/[id]/pautas/[idPauta]/route';

async function run() {
  try {
    const [rows]: any = await pool.query('SELECT idlaborespauta FROM laborespauta WHERE xlaborespautaidespecies = 3 LIMIT 1');
    const id = rows[0].idlaborespauta;
    
    // Check if user is superadmin
    const [users]: any = await pool.query("SELECT usuariosemail, usuariosroles FROM usuarios WHERE usuariosroles LIKE '%superadministrador%' LIMIT 1");
    const adminEmail = users.length > 0 ? users[0].usuariosemail : 'admin@admin.com';
    
    const req = new Request(`http://localhost/api/admin/especies/3/pautas/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-email': adminEmail }
    });
    const res = await DELETE(req as any, { params: Promise.resolve({ id: '3', idPauta: String(id) }) });
    console.log(res.status, await res.json());
  } catch (e) {
    console.error(e);
  }
  process.exit(0);
}
run();
