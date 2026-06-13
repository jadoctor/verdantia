export interface FaseFormData {
  fasescultivoclave: string;
  fasescultivonombre: string;
  fasescultivoorden: number;
  fasescultivocolor: string;
  fasescultivoicono: string;
  fasescultivodescripcion: string;
  fasescultivoesfin: number;
  fasescultivotipo: string;
  fasescultivodesde: string;
  fasescultivohasta: string;
}

export const fasesApi = {
  async getAllFases(email: string) {
    const res = await fetch('/api/admin/fases', {
      headers: { 'x-user-email': email }
    });
    if (!res.ok) throw new Error('Error fetching all fases');
    return res.json();
  },

  async getFaseById(id: string, email: string) {
    const res = await fetch(`/api/admin/fases/${id}`, {
      headers: { 'x-user-email': email }
    });
    if (!res.ok) throw new Error('Error fetching fase details');
    return res.json();
  },

  async saveFase(id: string, isNew: boolean, data: FaseFormData, email: string) {
    const res = await fetch(isNew ? `/api/admin/fases` : `/api/admin/fases/${id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error saving fase');
    return res.json();
  }
};
