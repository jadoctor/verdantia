export const laboresApi = {
  getLabores: async (userEmail: string) => {
    const res = await fetch('/api/admin/labores', {
      headers: { 'x-user-email': userEmail }
    });
    return res.json();
  },

  deleteLabor: async (id: number, userEmail: string) => {
    const res = await fetch(`/api/admin/labores/${id}`, {
      method: 'DELETE',
      headers: { 'x-user-email': userEmail }
    });
    return res.json();
  }
};
