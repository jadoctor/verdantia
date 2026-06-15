'use client';
import React, { useState, useEffect } from 'react';
import LaborForm from '@/components/admin/LaborForm';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function NuevaLaborPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

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
    <div style={{ padding: isMobile ? '10px' : '20px', height: '100%' }}>
      <LaborForm laborId={null} userEmail={userEmail} isMobile={isMobile} />
    </div>
  );
}
