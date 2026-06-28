export async function getEspecies(email: string, filterTipo?: string, filter?: string) {
  const queryParams = new URLSearchParams();
  if (filterTipo) queryParams.set('tipo', filterTipo);
  if (filter) queryParams.set('filter', filter);
  const res = await fetch(`/api/admin/especiesvegetales?${queryParams.toString()}`, {
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al obtener especies');
  return res.json();
}

export async function deleteEspecie(id: string, email: string) {
  const res = await fetch(`/api/admin/especiesvegetales/${id}`, {
    method: 'DELETE',
    headers: { 'x-user-email': email }
  });
  if (!res.ok) throw new Error('Error al eliminar/inhabilitar especie');
  return res.json();
}

export async function reactivateEspecie(id: string, email: string) {
  const res = await fetch(`/api/admin/especiesvegetales/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': email
    },
    body: JSON.stringify({ especiesvegetalesvisibilidadsino: 1 })
  });
  if (!res.ok) throw new Error('Error al reactivar especie');
  return res.json();
}
