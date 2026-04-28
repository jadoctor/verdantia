'use client';
import React, { useState, useEffect } from 'react';
import LaborForm from '@/components/admin/LaborForm';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { useParams } from 'next/navigation';

export default function EditarLaborPage() {
  const params = useParams();
  const id = params?.id as string;
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

  if (!id) return <div>ID no vǭlido</div>;

  return (
    <div style={{ padding: '0px', height: '100%' }}>
      <LaborForm laborId={id} userEmail={userEmail} />
    </div>
  );
}
