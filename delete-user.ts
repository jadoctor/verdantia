import pool from './src/lib/db';
import { getAdminAuth } from './src/lib/firebase/admin';

async function deleteUser(email: string) {
  try {
    const adminAuth = getAdminAuth();
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(user.uid, { email: undefined }); // Workaround if deleteUser is not directly exposed on AdminAuth type, or just delete it:
    // Wait, let's cast getAdminAuth() as any to call deleteUser since it's not strictly typed in admin.ts
    const anyAuth: any = adminAuth;
    await anyAuth.deleteUser(user.uid);
    console.log('Firebase Auth DELETED');
  } catch(e: any) {
    console.log('Firebase Auth No encontrado:', e.message);
  }
  
  try {
    const [rows]: any = await pool.query('SELECT idusuarios FROM usuarios WHERE usuariosemail = ?', [email]);
    if (rows.length > 0) {
      await pool.query('DELETE FROM usuarios WHERE idusuarios = ?', [rows[0].idusuarios]);
      console.log('MySQL DELETED');
    } else {
      console.log('MySQL No encontrado');
    }
  } catch(e: any) {
    console.log('MySQL Error:', e.message);
  }
  
  process.exit(0);
}

deleteUser('jomano4256@hilostar.com');
