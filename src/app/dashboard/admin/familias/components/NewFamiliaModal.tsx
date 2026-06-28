import React from 'react';
import PremiumCancelButton from '@/components/ui/PremiumCancelButton';
import PremiumSaveButton from '@/components/ui/PremiumSaveButton';

interface NewFamiliaModalProps {
  showNewForm: boolean;
  setShowNewForm: (val: boolean) => void;
  newFamilia: any;
  setNewFamilia: (val: any) => void;
  saving: boolean;
  handleCreateNew: (e: React.FormEvent) => void;
}

export function NewFamiliaModal({
  showNewForm, setShowNewForm, newFamilia, setNewFamilia, saving, handleCreateNew
}: NewFamiliaModalProps) {
  if (!showNewForm) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <form onSubmit={handleCreateNew} style={{
        background: 'white', borderRadius: '16px', padding: '28px', maxWidth: '500px',
        width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🧬 Nueva Familia Botánica
        </h2>
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Nombre *</label>
              <input type="text" value={newFamilia.familiasnombre} onChange={e => setNewFamilia((p: any) => ({ ...p, familiasnombre: e.target.value }))}
                placeholder="Solanáceas" required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>N. Científico</label>
              <input type="text" value={newFamilia.familiasnombrecientifico} onChange={e => setNewFamilia((p: any) => ({ ...p, familiasnombrecientifico: e.target.value }))}
                placeholder="Solanaceae"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Grupo Rotación *</label>
              <input type="text" value={newFamilia.familiasgruporotacion} onChange={e => setNewFamilia((p: any) => ({ ...p, familiasgruporotacion: e.target.value }))}
                placeholder="solanaceas" required
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Años Descanso</label>
              <input type="number" value={newFamilia.familiasanosdescanso} onChange={e => setNewFamilia((p: any) => ({ ...p, familiasanosdescanso: parseInt(e.target.value) || 3 }))}
                min="1" max="10"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Emoji</label>
              <input type="text" value={newFamilia.familiasemoji} onChange={e => setNewFamilia((p: any) => ({ ...p, familiasemoji: e.target.value }))}
                maxLength={4}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1.2rem', textAlign: 'center', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'end' }}>
            <div style={{ flex: '1 1 280px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Notas</label>
              <input type="text" value={newFamilia.familiasnotas || ''} onChange={e => setNewFamilia((p: any) => ({ ...p, familiasnotas: e.target.value }))}
                placeholder="Notas sobre rotación..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Color</label>
              <input type="color" value={newFamilia.familiascolor} onChange={e => setNewFamilia((p: any) => ({ ...p, familiascolor: e.target.value }))}
                style={{ width: '48px', height: '38px', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', padding: '2px' }} />
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
          <PremiumCancelButton onClick={() => setShowNewForm(false)} />
          <PremiumSaveButton 
            isLoading={saving} 
            loadingText="Creando..." 
            text="✅ Crear Familia" 
          />
        </div>
      </form>
    </div>
  );
}
