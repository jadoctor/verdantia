import React from 'react';
import { useProfileSecurity } from '../hooks/useProfileSecurity';

interface AchievementModalsProps {
  securityData: ReturnType<typeof useProfileSecurity>;
}

export function AchievementModals({ securityData }: AchievementModalsProps) {
  const {
    unlockedAchievement,
    setUnlockedAchievement,
    lostAchievement,
    setLostAchievement,
    isUnderage
  } = securityData;
  return (
    <>
      {/* ── MODAL DE LOGRO DESBLOQUEADO ── */}
      {unlockedAchievement && (
        <div className="achievement-modal-overlay">
          <div className="achievement-modal">
            <div className="achievement-icon-wrapper">
              <span>🧑‍🌾</span>
            </div>
            <h2>¡Enhorabuena!</h2>
            <p>Has desbloqueado el logro <strong>{unlockedAchievement}</strong> al completar tu perfil.</p>
            <p className="achievement-desc">Ya no eres un simple Visitante. Ahora tienes permisos para empezar a registrar semillas y crear tus propios huertos. ¡Bienvenido oficialmente a Verdantia!</p>
            
            {isUnderage && (
              <div className="highlight-box highlight-amber" style={{ margin: '15px 0', textAlign: 'left', fontSize: '0.85rem' }}>
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <span><strong>Aviso legal:</strong> Al tener menos de 18 años, tu cuenta ha sido configurada con protección al menor. Tienes pleno acceso a la comunidad, pero <strong>no podrás adquirir suscripciones de pago</strong>.</span>
              </div>
            )}

            <button className="btn btn-primary" onClick={() => setUnlockedAchievement(null)} style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '10px' }}>
              ¡A cultivar!
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL DE LOGRO PERDIDO ── */}
      {lostAchievement && (
        <div className="achievement-modal-overlay">
          <div className="achievement-modal" style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(239, 68, 68, 0.2)' }}>
            <div className="achievement-icon-wrapper" style={{ background: 'linear-gradient(135deg, #fee2e2, #fca5a5)', border: '4px solid #ef4444', boxShadow: '0 10px 25px rgba(239, 68, 68, 0.4)' }}>
              <span style={{ filter: 'grayscale(100%)' }}>🧳</span>
            </div>
            <h2 style={{ color: '#b91c1c' }}>Rango Perdido</h2>
            <p>Has perdido el logro <strong>{lostAchievement}</strong> al eliminar datos obligatorios de tu perfil.</p>
            <p className="achievement-desc" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>Has vuelto a ser un Visitante. Para recuperar tus permisos de siembra y tus insignias, vuelve a rellenar tu Nombre y Fecha de Nacimiento.</p>
            <button className="btn btn-danger" onClick={() => setLostAchievement(null)} style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
