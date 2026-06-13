// ── Servicio API: Asuntos Pendientes ──────────────────────────────────────────
// Toda la comunicación con el backend pasa por aquí.
// Los hooks y el page.tsx no deben contener fetch() directos.

export async function fetchPendientes(tab: string): Promise<any[]> {
  const res = await fetch(`/api/admin/asuntos-pendientes?tab=${tab}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Error al cargar pendientes');
  return res.json();
}

export async function fetchUserStats(usuarioId: number): Promise<any> {
  const res = await fetch(`/api/admin/usuarios/${usuarioId}/stats`, { cache: 'no-store' });
  if (!res.ok) return {};
  return res.json();
}

export async function postValidarFoto(fotoId: number): Promise<void> {
  const res = await fetch('/api/admin/asuntos-pendientes/validar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fotoId }),
  });
  if (!res.ok) throw new Error('Error al validar');
}

export async function postRestaurarFoto(fotoId: number): Promise<void> {
  const res = await fetch('/api/admin/asuntos-pendientes/restaurar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fotoId }),
  });
  if (!res.ok) throw new Error('Error al restaurar');
}

export async function postRechazarFoto(fotoId: number, motivo: string, esSancionGrave: boolean): Promise<void> {
  const res = await fetch('/api/admin/asuntos-pendientes/rechazar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fotoId, motivo, esSancionGrave }),
  });
  if (!res.ok) throw new Error('Error al rechazar');
}

export async function postRechazarRecurso(fotoId: number, motivo: string): Promise<void> {
  const res = await fetch('/api/admin/asuntos-pendientes/rechazar-recurso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fotoId, motivo }),
  });
  if (!res.ok) throw new Error('Error al rechazar recurso');
}

export async function postGuardarMetadatosJson(fotoId: number, metadatos: object): Promise<void> {
  const res = await fetch('/api/admin/asuntos-pendientes/metadatos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fotoId, metadatos }),
  });
  if (!res.ok) throw new Error('Error al guardar metadatos');
}
