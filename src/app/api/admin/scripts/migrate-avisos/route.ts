import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    await pool.query('ALTER TABLE tiposavisos ADD COLUMN tiposavisosmetodo VARCHAR(20) DEFAULT "in-app"');
    
    // Set Boletin to email
    await pool.query('UPDATE tiposavisos SET tiposavisosmetodo = "email" WHERE tiposavisosnombre LIKE "%Boletín%"');
    
    // Set Tareas to in-app
    await pool.query('UPDATE tiposavisos SET tiposavisosmetodo = "in-app" WHERE tiposavisosnombre LIKE "%Tareas%"');

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      return NextResponse.json({ success: true, message: 'Column already exists' });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
