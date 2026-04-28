'use client';
import React, { useState, useEffect } from 'react';
import EspecieForm from '@/components/admin/EspecieForm';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function EditarEspeciePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // No renderizamos el formulario hasta que Firebase haya resuelto el usuario
  // Esto evita que loadAttachments se ejecute con userEmail=null y aborte silenciosamente
  if (!authReady) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🌿</div>
        <p>Cargando especie...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <EspecieForm especieId={resolvedParams.id} userEmail={userEmail} />
    </div>
  );
}
