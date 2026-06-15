import { Familia } from '../types';

export const fetchFamiliaData = async (familiaId: string, userEmail: string) => {
  const res = await fetch(`/api/admin/familias/${familiaId}`, {
    headers: { 'x-user-email': userEmail }
  });
  if (!res.ok) throw new Error('Error fetching familia data');
  return await res.json();
};

export const updateFamiliaData = async (familiaId: string, data: Partial<Familia>, userEmail: string) => {
  const res = await fetch(`/api/admin/familias/${familiaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Error updating familia data');
  return res;
};

export const fetchAiAssistant = async (endpoint: string, nombre: string, customPrompt: string, userEmail: string) => {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
    body: JSON.stringify({ nombre, customPrompt })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Error AI');
  return json.data;
};
