'use client';
import React, { useState, useEffect } from 'react';
import EspecieForm from '@/components/admin/EspecieForm';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function NuevaEspeciePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <EspecieForm especieId={null} userEmail={userEmail} />
    </div>
  );
}
