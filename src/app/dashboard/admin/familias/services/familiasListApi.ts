export const fetchFamiliasData = async () => {
  const res = await fetch('/api/admin/familias');
  if (!res.ok) throw new Error('Error fetching familias');
  const data = await res.json();
  return data.familias || [];
};

export const createFamiliaData = async (data: any) => {
  const res = await fetch('/api/admin/familias', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Error al crear familia');
  }
  return await res.json();
};

export const toggleFamiliaActive = async (id: number, currentActive: number) => {
  if (currentActive === 1) {
    await fetch(`/api/admin/familias/${id}`, { method: 'DELETE' });
  } else {
    await fetch(`/api/admin/familias/${id}`, { method: 'PATCH' });
  }
};

export const deleteFamiliaHard = async (id: number) => {
  await fetch(`/api/admin/familias/${id}?hard=true`, { method: 'DELETE' });
};
