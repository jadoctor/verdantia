export async function fetchProfile(email: string) {
  const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
  return res;
}

export async function registerProfile(uid: string, email: string) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ uid, email, nombre: '', apellidos: '' }),
  });
  return res;
}

export async function fetchMisLogros(userId: number) {
  const res = await fetch(`/api/perfil/logros?userId=${userId}`);
  if (!res.ok) throw new Error('Error al cargar mis logros');
  const data = await res.json();
  return data.logros || [];
}

export async function fetchTodosLogros() {
  const res = await fetch('/api/admin/ajustes/logros');
  if (!res.ok) throw new Error('Error al cargar logros globales');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchMisCultivos(email: string) {
  const res = await fetch('/api/user/cultivos', {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al cargar cultivos');
  const data = await res.json();
  return data.cultivos || [];
}

export async function fetchMisSemillas(email: string) {
  const res = await fetch('/api/user/semillas', {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al cargar semillas');
  const data = await res.json();
  return data.semillas || [];
}

export async function fetchMisMensajes(email: string) {
  const res = await fetch('/api/user/comunidad', {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al cargar comunidad');
  const data = await res.json();
  return data.mensajes || [];
}

export async function deleteCrop(email: string, cropId: number) {
  const res = await fetch(`/api/user/cultivos/${cropId}`, {
    method: 'DELETE',
    headers: { 'x-user-email': email }
  });
  return res;
}

export async function deleteSeed(email: string, seedId: number) {
  const res = await fetch(`/api/user/semillas/${seedId}`, {
    method: 'DELETE',
    headers: { 'x-user-email': email }
  });
  return res;
}

export async function updateSeed(email: string, seedId: number, body: any) {
  const res = await fetch(`/api/user/semillas/${seedId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': email
    },
    body: JSON.stringify(body)
  });
  return res;
}

export async function fetchCatalogo(email: string) {
  const res = await fetch('/api/user/catalogo', {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al cargar catálogo');
  const data = await res.json();
  return data.especies || [];
}

export async function fetchCatalogoVariedades(email: string, especieId: number) {
  const res = await fetch(`/api/user/catalogo/${especieId}/variedades`, {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al cargar variedades');
  const data = await res.json();
  return data.variedades || [];
}

export async function fetchNextSeedNumero(email: string, ubicacion: string = '') {
  const res = await fetch(`/api/user/semillas/next-numero?ubicacion=${encodeURIComponent(ubicacion)}`, {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al cargar número de colección');
  const data = await res.json();
  return data.nextNumero;
}

export async function createSeed(email: string, body: any) {
  const res = await fetch('/api/user/semillas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': email
    },
    body: JSON.stringify(body)
  });
  return res;
}

export async function createCrop(email: string, body: any) {
  const res = await fetch('/api/user/cultivos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': email
    },
    body: JSON.stringify(body)
  });
  return res;
}
