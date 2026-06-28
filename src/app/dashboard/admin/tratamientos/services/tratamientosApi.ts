export const tratamientosApi = {
  getTratamientos: async (userEmail: string) => {
    const response = await fetch('/api/admin/tratamientos', {
      headers: { 'x-user-email': userEmail || '' },
      cache: 'no-store'
    });
    if (!response.ok) {
      throw new Error('Error fetching tratamientos');
    }
    return response.json();
  }
};
