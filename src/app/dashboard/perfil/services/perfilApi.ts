export const perfilApi = {
  async searchLocation(query: string, type: 'cp' | 'ciudad') {
    const res = await fetch(`/api/location/search?q=${encodeURIComponent(query)}&type=${type}`);
    if (!res.ok) throw new Error('Error buscando localización');
    return res.json();
  },

  async loadPhotos(userId: number) {
    const res = await fetch(`/api/perfil/photos?userId=${userId}`);
    if (!res.ok) throw new Error('Error cargando fotos');
    return res.json();
  },

  async loadAchievementsHistory(userId: number) {
    const res = await fetch(`/api/perfil/logros?userId=${userId}`);
    if (!res.ok) throw new Error('Error cargando logros');
    return res.json();
  },

  async loadAvisos(email: string) {
    const res = await fetch(`/api/perfil/avisos?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Error cargando avisos');
    return res.json();
  },

  async saveAviso(email: string, payload: { tipo: 'maestro' | 'labor'; avisoId?: number; laborId?: number; activo: number }) {
    const res = await fetch('/api/perfil/avisos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...payload })
    });
    if (!res.ok) throw new Error('Error guardando aviso');
    return res.json();
  },

  async checkPlanDegradation(userId: number) {
    const res = await fetch('/api/auth/check-plan-degradation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Error comprobando degradación de plan');
    return res.json();
  },

  async loadUserProfile(email: string) {
    const res = await fetch(`/api/auth/profile?email=${encodeURIComponent(email)}`);
    if (!res.ok) throw new Error('Error cargando perfil de usuario');
    return res.json();
  },

  async uploadPhoto(payload: { userId: number; storagePath: string; faceX: number; faceY: number; faceZoom: number; nombreOriginal: string }) {
    const res = await fetch('/api/perfil/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error subiendo metadatos de la foto');
    return res.json();
  },

  async setPhotoPrimary(photoId: number, userId: number) {
    const res = await fetch('/api/perfil/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, userId, action: 'setPrincipal' })
    });
    if (!res.ok) throw new Error('Error al establecer foto principal');
    return res.json();
  },

  async deletePhoto(photoId: number) {
    const res = await fetch(`/api/perfil/photos?photoId=${photoId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error eliminando foto');
    return res.json();
  },

  async savePhotoEdits(photoId: number, userId: number, resumen: string) {
    const res = await fetch('/api/perfil/photos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId, userId, action: 'updateMeta', resumen })
    });
    if (!res.ok) throw new Error('Error guardando metadatos de edición de foto');
    return res.json();
  },

  async updateProfile(email: string, fields: Record<string, any>) {
    const res = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ...fields })
    });
    if (!res.ok) throw new Error('Error actualizando perfil');
    return res.json();
  },

  async registerPasskeyGenerate(email: string, displayName?: string) {
    const res = await fetch('/api/auth/webauthn/register/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });
    if (!res.ok) throw new Error('Error generando opción para Passkey');
    return res.json();
  },

  async registerPasskeyVerify(email: string, registrationResponse: any) {
    const res = await fetch('/api/auth/webauthn/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, registrationResponse }),
    });
    if (!res.ok) throw new Error('Error verificando Passkey');
    return res.json();
  },

  async sendVerificationEmail(email: string, nombre: string, sexo: string) {
    const res = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nombre, sexo }),
    });
    if (!res.ok) throw new Error('Error al enviar email de verificación');
    return res.json();
  },

  async updateEmail(currentEmail: string, newEmail: string) {
    const res = await fetch('/api/auth/update-email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentEmail, newEmail })
    });
    if (!res.ok) throw new Error('Error al actualizar email');
    return res.json();
  }
};
