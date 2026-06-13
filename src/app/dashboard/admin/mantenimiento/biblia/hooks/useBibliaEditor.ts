import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { bibliaApi } from '../services/bibliaApi';

export function useBibliaEditor() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [rulesContent, setRulesContent] = useState<string>('');
  const [originalRulesContent, setOriginalRulesContent] = useState<string>('');
  const [loadingRules, setLoadingRules] = useState<boolean>(false);
  const [savingRules, setSavingRules] = useState<boolean>(false);
  const [rulesStatus, setRulesStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rulesError, setRulesError] = useState<string | null>(null);

  const loadRules = async (email: string) => {
    setLoadingRules(true);
    setRulesError(null);
    setRulesStatus('idle');
    try {
      const data = await bibliaApi.getRules(email);
      setRulesContent(data.content || '');
      setOriginalRulesContent(data.content || '');
    } catch (err: any) {
      setRulesError(err.message || 'Error de conexión');
    } finally {
      setLoadingRules(false);
    }
  };

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkResize = () => setIsMobile(window.innerWidth <= 768);
      checkResize();
      window.addEventListener('resize', checkResize);
      return () => window.removeEventListener('resize', checkResize);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
        loadRules(user.email);
      } else {
        setUserEmail(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveRules = async () => {
    if (!userEmail || savingRules) return;
    setSavingRules(true);
    setRulesStatus('idle');
    setRulesError(null);
    try {
      const data = await bibliaApi.saveRules(userEmail, rulesContent);
      if (data.success) {
        setRulesStatus('success');
        setOriginalRulesContent(rulesContent);
        setTimeout(() => setRulesStatus('idle'), 3000);
      } else {
        setRulesStatus('error');
        setRulesError(data.error || 'Error al guardar las normas');
      }
    } catch (err: any) {
      setRulesStatus('error');
      setRulesError(err.message || 'Error de conexión');
    } finally {
      setSavingRules(false);
    }
  };

  const handleDiscard = () => {
    setRulesContent(originalRulesContent);
  };

  const hasChanges = rulesContent !== originalRulesContent;

  return {
    userEmail,
    rulesContent,
    setRulesContent,
    originalRulesContent,
    loadingRules,
    savingRules,
    rulesStatus,
    rulesError,
    loadRules,
    handleSaveRules,
    handleDiscard,
    hasChanges,
    isMobile
  };
}
