'use client';

import { useState, useCallback, useEffect } from 'react';

export function useTratamientoPhotos(id: string, userEmail: string | null) {
  const [photos, setPhotos] = useState<any[]>([]);

  const fetchPhotos = useCallback(async () => {
    if (!userEmail || id === 'nuevo') return;
    try {
      const res = await fetch(`/api/admin/tratamientos/${id}/photos`, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  }, [id, userEmail]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  return { photos, refreshPhotos: fetchPhotos };
}
