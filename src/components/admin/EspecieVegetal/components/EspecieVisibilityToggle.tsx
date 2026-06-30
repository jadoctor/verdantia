import React from 'react';

interface EspecieVisibilityToggleProps {
  visibilidad: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function EspecieVisibilityToggle({ visibilidad, onChange }: EspecieVisibilityToggleProps) {
  return (
    <div
      style={{
        background: visibilidad ? '#ecfdf5' : '#f1f5f9',
        borderRadius: '12px',
        padding: '16px 24px',
        marginBottom: '24px',
        border: `1px solid ${visibilidad ? '#10b981' : '#cbd5e1'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        transition: 'all 0.3s',
      }}
    >
      <label
        style={{
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          color: '#334155',
          margin: 0,
          fontSize: '1.1rem',
        }}
      >
        <input
          type="checkbox"
          name="especiesvegetalesvisibilidadsino"
          checked={!!visibilidad}
          onChange={onChange}
          style={{ width: '22px', height: '22px', accentColor: '#10b981' }}
        />
        Especie con Visibilidad Global (Pública)
      </label>
    </div>
  );
}
