export const tratamientoEditApi = {
  fetchPlantasParte: async (userEmail: string) => {
    const res = await fetch('/api/admin/plantasparte', { headers: { 'x-user-email': userEmail } });
    if (!res.ok) throw new Error('Error fetching plantasparte');
    return res.json();
  },

  fetchTratamiento: async (userEmail: string) => {
    const res = await fetch('/api/admin/tratamientos', {
      headers: { 'x-user-email': userEmail },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Error fetching tratamiento');
    return res.json();
  },

  saveTratamiento: async (id: string, data: any, userEmail: string) => {
    const url = id !== 'nuevo' ? `/api/admin/tratamientos/${id}` : '/api/admin/tratamientos';
    const method = id !== 'nuevo' ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail
      },
      body: JSON.stringify(data),
      keepalive: true
    });

    if (!res.ok) throw new Error('Error saving tratamiento');
    return res.json();
  },

  deleteTratamiento: async (id: string, userEmail: string) => {
    const res = await fetch(`/api/admin/tratamientos/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-email': userEmail }
    });
    if (!res.ok) throw new Error('Error deleting tratamiento');
    return res;
  },

  setPrimaryPhoto: async (id: string, photoId: number, userEmail: string) => {
    const res = await fetch(`/api/admin/tratamientos/${id}/photos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
      body: JSON.stringify({ photoId, action: 'setPrimary' })
    });
    if (!res.ok) throw new Error('Error setting primary photo');
    return res;
  }
};
