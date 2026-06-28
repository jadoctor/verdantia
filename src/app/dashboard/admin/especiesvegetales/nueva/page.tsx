'use client';
// Responsividad controlada en EspecieVegetalForm (isMobile, @media, innerWidth)
import React, { useState, useEffect } from 'react';
import EspecieVegetalForm from '@/components/admin/EspecieVegetalForm';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function NuevaEspeciePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkResize = () => setIsMobile(window.innerWidth <= 768);
    checkResize();
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, []);

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
    <div style={{ padding: isMobile ? '0px' : '20px', width: '100%' }}>
      <EspecieVegetalForm especieId={null} userEmail={userEmail} />
    </div>
  );
}
