import React from 'react';

interface CultivoTabsProps {
  activeTab: 'ficha' | 'tareas' | 'completadas' | 'fotos';
  setActiveTab: (tab: 'ficha' | 'tareas' | 'completadas' | 'fotos') => void;
  pendingTasksCount: number;
  completedTasksCount?: number;
}

export default function CultivoTabs({ activeTab, setActiveTab, pendingTasksCount, completedTasksCount = 0 }: CultivoTabsProps) {
  return (
    <div className="cultivo-tabs" style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', overflowX: 'auto', gap: '16px' }}>
      <button 
        onClick={() => setActiveTab('ficha')}
        style={{
          background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontSize: '1rem',
          fontWeight: activeTab === 'ficha' ? 'bold' : 'normal',
          color: activeTab === 'ficha' ? '#10b981' : '#64748b',
          borderBottom: activeTab === 'ficha' ? '3px solid #10b981' : '3px solid transparent',
          whiteSpace: 'nowrap'
        }}
      >
        📄 Ficha del Cultivo
      </button>
      <button 
        onClick={() => setActiveTab('tareas')}
        style={{
          background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontSize: '1rem',
          fontWeight: activeTab === 'tareas' ? 'bold' : 'normal',
          color: activeTab === 'tareas' ? '#10b981' : '#64748b',
          borderBottom: activeTab === 'tareas' ? '3px solid #10b981' : '3px solid transparent',
          whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px'
        }}
      >
        📝 Tareas Pendientes
        {pendingTasksCount > 0 && (
          <span style={{ background: '#ef4444', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            {pendingTasksCount}
          </span>
        )}
      </button>
      <button 
        onClick={() => setActiveTab('completadas')}
        style={{
          background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontSize: '1rem',
          fontWeight: activeTab === 'completadas' ? 'bold' : 'normal',
          color: activeTab === 'completadas' ? '#10b981' : '#64748b',
          borderBottom: activeTab === 'completadas' ? '3px solid #10b981' : '3px solid transparent',
          whiteSpace: 'nowrap'
        }}
      >
        ✅ Historial
        {completedTasksCount > 0 && (
          <span style={{ background: '#16a34a', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '6px' }}>
            {completedTasksCount}
          </span>
        )}
      </button>
      <button 
        onClick={() => setActiveTab('fotos')}
        style={{
          background: 'none', border: 'none', padding: '12px 16px', cursor: 'pointer', fontSize: '1rem',
          fontWeight: activeTab === 'fotos' ? 'bold' : 'normal',
          color: activeTab === 'fotos' ? '#10b981' : '#64748b',
          borderBottom: activeTab === 'fotos' ? '3px solid #10b981' : '3px solid transparent',
          whiteSpace: 'nowrap'
        }}
      >
        📷 Fotos
      </button>
    </div>
  );
}
