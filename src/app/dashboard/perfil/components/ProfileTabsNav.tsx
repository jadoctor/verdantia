import React from 'react';

interface ProfileTabsNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function ProfileTabsNav({ activeTab, setActiveTab }: ProfileTabsNavProps) {
  const tabs = [
    { id: 'perfil', label: '👤 Datos Personales' },
    { id: 'fotos', label: '📸 Fotos de Perfil' },
    { id: 'comunicaciones', label: '🔔 Comunicaciones' },
    { id: 'cultivo', label: '🌾 Preferencias de Cultivo' },
    { id: 'bancales', label: '🚜 Bancales (SIGPAC)' },
    { id: 'seguridad', label: '🔒 Seguridad & Privacidad' },
    { id: 'suscripcion', label: '⭐ Suscripción' },
    { id: 'logros', label: '🏆 Logros' },
    { id: 'roles', label: '👑 Roles' },
    { id: 'usoia', label: '✨ Uso de IA' },
    { id: 'cuenta', label: '⚠️ Eliminar Cuenta' }
  ];

  return (
    <div className="profile-tabs-nav">
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`profile-tab-btn ${isActive ? 'is-active' : ''}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
