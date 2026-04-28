'use client';
import React, { useState, useEffect } from 'react';
import LaborForm from '@/components/admin/LaborForm';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function NuevaLaborPage() {
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
    <div style={{ padding: '0px', height: '100%' }}>
      <LaborForm laborId={null} userEmail={userEmail} />
    </div>
  );
}
