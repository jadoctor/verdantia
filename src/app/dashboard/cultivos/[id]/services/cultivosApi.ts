// src/app/dashboard/cultivos/[id]/services/cultivosApi.ts

export const cultivosApi = {
  get: async (id: string, email: string) => {
    const res = await fetch(`/api/user/cultivos/${id}?_t=${Date.now()}`, {
      headers: { 'x-user-email': email },
      cache: 'no-store'
    });
    if (!res.ok) throw new Error('Error fetching cultivo');
    return res.json();
  },

  update: async (id: string, email: string, data: any) => {
    const res = await fetch(`/api/user/cultivos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Error al actualizar cultivo');
    }
    return res.json();
  },

  delete: async (id: string, email: string) => {
    const res = await fetch(`/api/user/cultivos/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-email': email },
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Error al eliminar cultivo');
    }
    return res.json();
  },

  completarLabor: async (id: string, email: string, data: any) => {
    const res = await fetch(`/api/user/cultivos/${id}/completar-labor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Error al completar labor');
    return res.json();
  },

  updatePhase: async (id: string, email: string, idfase: number, fecha: string | null) => {
    const res = await fetch(`/api/user/cultivos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email,
      },
      body: JSON.stringify({ action: 'update_fase', idfase, fecha }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Error al actualizar fase');
    }
    return res.json();
  }
};
