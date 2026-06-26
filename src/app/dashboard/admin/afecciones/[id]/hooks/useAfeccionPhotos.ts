'use client';
import { useState, useEffect } from 'react';

export function useAfeccionPhotos(id: string, userEmail: string | null) {
  const [photos, setPhotos] = useState<any[]>([]);

  const fetchPhotos = async () => {
    if (!id || id === 'nueva' || !userEmail) return;
    try {
      const res = await fetch(`/api/admin/afecciones/${id}/photos`, {
        headers: { 'x-user-email': userEmail }
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [id, userEmail]);

  return { photos, refreshPhotos: fetchPhotos };
}
