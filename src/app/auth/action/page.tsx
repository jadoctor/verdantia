"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

function ActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState("Procesando tu solicitud...");
  const [error, setError] = useState("");

  // Password reset state
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");

  useEffect(() => {
    if (!mode || !oobCode) {
      setError("Enlace inválido o caducado.");
      return;
    }

    if (mode === "verifyEmail") {
      setStatus("Verificando tu correo electrónico...");
      applyActionCode(auth, oobCode)
        .then(async () => {
          setStatus("¡Correo verificado con éxito! Activando tu cuenta...");
          
          if (auth.currentUser) {
            await auth.currentUser.reload();
          }

          try {
            const email = auth.currentUser?.email;
            if (email) {
              const res = await fetch('/api/auth/on-verified', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
              });
              const data = await res.json();
              
              if (data.unlockedAchievement) {
                setStatus("🧑‍🌾 ¡Enhorabuena! Eres Campesino Aprendiz. Redirigiendo...");
                setTimeout(() => {
                  router.push(`/dashboard/perfil?achievement=${encodeURIComponent(data.unlockedAchievement)}&underage=${data.isUnderageLimitation ? '1' : '0'}`);
                }, 2000);
                return;
              }
            }
          } catch (err) {
            console.error('Error al activar cuenta:', err);
          }

          setTimeout(() => {
            router.push("/dashboard/perfil");
          }, 1500);
        })
        .catch((err) => {
          console.error(err);
          setError("El enlace de verificación es inválido, ya ha sido usado o ha caducado.");
        });
    } else if (mode === "resetPassword") {
      setStatus("Verificando enlace de recuperación...");
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setResetEmail(email);
          setShowResetForm(true);
          setStatus("");
        })
        .catch((err) => {
          console.error(err);
          setError("El enlace de recuperación es inválido, ya ha sido usado o ha caducado. Solicita uno nuevo desde el login.");
        });
    } else {
      setError("Operación no soportada.");
    }
  }, [mode, oobCode, router]);

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError("Introduce tu nueva contraseña.");
      return;
    }
    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setError("");
    setStatus("Cambiando contraseña...");

    try {
      await confirmPasswordReset(auth, oobCode!, newPassword);
      setResetDone(true);
      setShowResetForm(false);
      setStatus("✅ ¡Contraseña cambiada con éxito!");
      setTimeout(() => {
        router.push(`/login?email=${encodeURIComponent(resetEmail)}`);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/weak-password') {
        setError("La contraseña es demasiado débil. Usa al menos 6 caracteres.");
      } else if (err.code === 'auth/expired-action-code') {
        setError("El enlace ha caducado. Solicita uno nuevo desde el login.");
      } else {
        setError("Error al cambiar la contraseña: " + err.message);
      }
      setStatus("");
    }
  };

  return (
    <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', maxWidth: '420px', width: '100%' }}>
      <h1 style={{ color: '#0056b3', marginBottom: '20px', fontSize: '2rem' }}>🌱 Verdantia</h1>
      
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {showResetForm && (
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#1e293b' }}>🔑 Nueva contraseña</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '20px' }}>
            Establece una nueva contraseña para <strong>{resetEmail}</strong>
          </p>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>Nueva contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                style={{ width: '100%', padding: '10px 40px 10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.85rem' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleResetPassword}
            disabled={!newPassword || newPassword.length < 6}
            style={{
              width: '100%', padding: '12px',
              background: newPassword && newPassword.length >= 6 ? '#0056b3' : '#94a3b8',
              color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700,
              cursor: newPassword && newPassword.length >= 6 ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
          >
            Cambiar contraseña
          </button>
        </div>
      )}

      {!showResetForm && !error && status && (
        <div>
          <p style={{ color: '#1e293b', fontSize: '1.1rem' }}>{status}</p>
          {resetDone && (
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '10px' }}>Redirigiendo al login con tu email...</p>
          )}
          {status.includes('éxito') && !resetDone && (
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '10px' }}>Redirigiendo automáticamente a tu perfil...</p>
          )}
        </div>
      )}

      {!showResetForm && (error || resetDone) && (
        <button
          onClick={() => router.push('/login')}
          style={{ marginTop: '16px', padding: '10px 24px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
        >
          Ir al Login
        </button>
      )}
    </div>
  );
}

export default function AuthActionPage() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f4f6f9' }}>
      <Suspense fallback={<p>Cargando...</p>}>
        <ActionHandler />
      </Suspense>
    </div>
  );
}
