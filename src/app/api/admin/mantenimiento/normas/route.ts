import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

const getAgentsFilePath = () => path.join(process.cwd(), 'AGENTS.md');

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const filePath = getAgentsFilePath();
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ content: '' });
    }

    const content = fs.readFileSync(filePath, 'utf8');
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Error al leer AGENTS.md:', error);
    return NextResponse.json({ error: 'Error al leer las normas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  try {
    const { content } = await request.json();
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Contenido inválido' }, { status: 400 });
    }

    const filePath = getAgentsFilePath();
    fs.writeFileSync(filePath, content, 'utf8');

    return NextResponse.json({ success: true, message: 'Normas de funcionamiento actualizadas con éxito' });
  } catch (error: any) {
    console.error('Error al guardar AGENTS.md:', error);
    return NextResponse.json({ error: 'Error al guardar las normas' }, { status: 500 });
  }
}
