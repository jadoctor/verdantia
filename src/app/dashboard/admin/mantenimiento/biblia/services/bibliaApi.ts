export interface BibliaApiResponse {
  success?: boolean;
  content?: string;
  error?: string;
}

export const bibliaApi = {
  async getRules(email: string): Promise<BibliaApiResponse> {
    const res = await fetch(`/api/admin/mantenimiento/normas?t=${Date.now()}`, {
      headers: { 'x-user-email': email },
      cache: 'no-store'
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Error al cargar las normas');
    }
    return res.json();
  },

  async saveRules(email: string, content: string): Promise<BibliaApiResponse> {
    const res = await fetch('/api/admin/mantenimiento/normas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email,
      },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Error al guardar las normas');
    }
    return data;
  }
};
