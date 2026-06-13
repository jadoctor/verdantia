import React from 'react';
import { useProfileData } from '../hooks/useProfileData';

interface RolesTabProps {
  profileData: ReturnType<typeof useProfileData>;
}

export function RolesTab({ profileData }: RolesTabProps) {
  const roles = profileData.profile?.roles ? profileData.profile.roles.split(',').map(r => r.trim()) : [];
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', animation: 'fadeIn 0.3s ease' }}>
      <h3 style={{ margin: '0 0 16px 0', color: '#0f766e', fontSize: '1.1rem', fontWeight: 800 }}>👑 Roles</h3>
      <div className="accordion-body">
        <label className="section-label">Roles Actuales Aprobados</label>
        <div className="roles-display" style={{ marginTop: '10px' }}>
          {roles.map((rol) => (
            <span key={rol} className="role-tag" style={{ marginRight: '8px' }}>✅ {rol}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
