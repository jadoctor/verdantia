export interface BackupApiResponse {
  success?: boolean;
  added?: string[];
  modified?: string[];
  commitMessage?: string;
  nextVersion?: string;
  error?: string;
}

export const mantenimientoApi = {
  async getChangesPreview(email: string): Promise<BackupApiResponse> {
    const res = await fetch(`/api/admin/mantenimiento/backup?t=${Date.now()}`, {
      headers: { 'x-user-email': email }
    });
    if (!res.ok) throw new Error('Error al cargar la vista previa de cambios');
    return res.json();
  },

  async openBackupsFolder(email: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/admin/mantenimiento/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email,
      },
      body: JSON.stringify({ action: 'open_backups_folder' }),
    });
    if (!res.ok) throw new Error('No se pudo abrir la carpeta');
    return res.json();
  },

  async openOneDriveFolder(email: string): Promise<{ success: boolean }> {
    const res = await fetch('/api/admin/mantenimiento/backup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': email,
      },
      body: JSON.stringify({ action: 'open_onedrive_folder' }),
    });
    if (!res.ok) throw new Error('No se pudo abrir la carpeta OneDrive');
    return res.json();
  }
};
