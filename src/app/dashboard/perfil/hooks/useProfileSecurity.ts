import React, { useState, useEffect, useCallback } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { useSearchParams } from 'next/navigation';
import { perfilApi } from '../services/perfilApi';
import { UserProfile } from './useProfileData';

export function useProfileSecurity(
  profile: UserProfile | null,
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>,
  showToast: (msg: string) => void
) {
  const [privacidadAceptada, setPrivacidadAceptada] = useState(true);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [motivoLibre, setMotivoLibre] = useState('');
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  // Achievements/Logros states
  const [unlockedAchievement, setUnlockedAchievement] = useState<string | null>(null);
  const [lostAchievement, setLostAchievement] = useState<string | null>(null);
  const [isUnderage, setIsUnderage] = useState<boolean>(false);
  const [achievementsHistory, setAchievementsHistory] = useState<any[]>([]);

  const searchParams = useSearchParams();

  const loadAchievementsHistory = useCallback(async (userId: number) => {
    try {
      const data = await perfilApi.loadAchievementsHistory(userId);
      setAchievementsHistory(data.logros || []);
    } catch (err: any) {
      console.error('Error cargando historial de logros:', err);
    }
  }, []);

  useEffect(() => {
    if (profile?.id) {
      loadAchievementsHistory(profile.id);
    }
  }, [profile?.id, loadAchievementsHistory]);

  // Handle achievement query parameters
  useEffect(() => {
    const achievement = searchParams.get('achievement');
    const underage = searchParams.get('underage');
    if (achievement) {
      setUnlockedAchievement(achievement);
      if (underage === '1') setIsUnderage(true);
      window.history.replaceState({}, '', '/dashboard/perfil');
      if (profile?.id) {
        loadAchievementsHistory(profile.id);
      }
    }
  }, [searchParams, profile?.id, loadAchievementsHistory]);

  const handlePasswordReset = async () => {
    if (!profile?.email) return;
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setPasswordResetSent(true);
      showToast('📧 Email de restablecimiento enviado a ' + profile.email);
    } catch (err: any) {
      showToast('❌ Error al enviar email: ' + err.message);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!auth.currentUser?.email) return;
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      alert('Se va a solicitar acceso a tu lector de huellas o reconocimiento facial. Sigue las instrucciones de tu pantalla.');
      
      const options = await perfilApi.registerPasskeyGenerate(auth.currentUser.email, profile?.nombre);
      let attResp;
      try {
        attResp = await startRegistration(options);
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          return console.log('Cancelado');
        }
        throw err;
      }

      const verifyRes = await perfilApi.registerPasskeyVerify(auth.currentUser.email, attResp);
      if (verifyRes.success || verifyRes.ok !== false) {
        alert('✅ ¡Huella o biometría registrada con éxito!');
        if (profile) {
          setProfile({ ...profile, passkeysCount: (profile.passkeysCount || 0) + 1 });
        }
      } else {
        throw new Error(verifyRes.error || 'Fallo en servidor');
      }
    } catch (err: any) {
      alert('Error al vincular Passkey: ' + err.message);
    }
  };

  const handleCancelAccount = () => {
    if (!motivoBaja) {
      showToast('⚠️ Selecciona un motivo de baja.');
      return;
    }
    const paso1 = confirm('⚠️ ¿Estás seguro de que quieres eliminar tu cuenta?\n\nTus datos personales se destruirán tras 30 días. Esta acción es irreversible pasado ese plazo.');
    if (!paso1) return;
    const paso2 = confirm('🔴 ÚLTIMA CONFIRMACIÓN\n\nEsta acción significará la pérdida permanente de tu identidad en la plataforma.\n\n¿Realmente deseas continuar?');
    if (!paso2) return;
    showToast('🔴 Solicitud de borrado enviada. Tu cuenta entrará en periodo de gracia de 30 días.');
  };

  return {
    privacidadAceptada,
    setPrivacidadAceptada,
    motivoBaja,
    setMotivoBaja,
    motivoLibre,
    setMotivoLibre,
    passwordResetSent,
    handlePasswordReset,
    handleRegisterPasskey,
    handleCancelAccount,
    unlockedAchievement,
    setUnlockedAchievement,
    lostAchievement,
    setLostAchievement,
    isUnderage,
    achievementsHistory,
    loadAchievementsHistory
  };
}
