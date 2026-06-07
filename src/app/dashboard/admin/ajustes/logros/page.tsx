'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export default function LogrosAdminPage() {
  const router = useRouter();
  const [logros, setLogros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { loadLogros(); }, []);

  const loadLogros = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ajustes/logros');
      const data = await res.json();
      if (res.ok) setLogros(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleChange = (index: number, field: string, value: any) => {
    const updated = [...logros];
    if (field.startsWith('req_') || field === 'descuento_pro') {
      value = value === '' ? 0 : parseInt(value) || 0;
    }
    updated[index] = { ...updated[index], [field]: value };
    setLogros(updated);
  };

  // Auto-guardado onBlur: guarda la fila completa al perder foco
  const handleBlurSave = useCallback(async (index: number) => {
    const row = logros[index];
    if (!row) return;
    try {
      setSaveStatus('saving');
      const res = await fetch('/api/admin/ajustes/logros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([row])
      });
      if (res.ok) {
        setSaveStatus('saved');
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    }
    // Limpiar indicador tras 2 segundos
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
  }, [logros]);

  // Color progresivo por nivel
  const getLevelStyle = (nivel: number): { bg: string; text: string; border: string } => {
    const map: Record<number, { bg: string; text: string; border: string }> = {
      1:  { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
      2:  { bg: '#f0fdf4', text: '#166534', border: '#bbf7d0' },
      3:  { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
      4:  { bg: '#e0f2fe', text: '#075985', border: '#7dd3fc' },
      5:  { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
      6:  { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
      7:  { bg: '#fae8ff', text: '#86198f', border: '#e879f9' },
      8:  { bg: '#fff7ed', text: '#9a3412', border: '#fdba74' },
      9:  { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
      10: { bg: '#fefce8', text: '#854d0e', border: '#fde047' },
    };
    return map[nivel] || map[1];
  };

  return (
    <div className="dashboard-content" style={{ padding: '20px' }}>
      {/* ── Botón Volver ── */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ── Header Banner ── */}
      <div style={{ background: 'linear-gradient(135deg, #0f766e, #10b981)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>🏆 Gamificación y Rangos</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Requisitos, descuentos y cuotas de mantenimiento de cada nivel del ecosistema
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.4)' }}>
              <span style={{ fontSize: '1.1rem' }}>📊</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{logros.length} Rangos</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: saveStatus === 'saving' ? 'rgba(255,255,255,0.3)' : saveStatus === 'saved' ? 'rgba(74,222,128,0.3)' : saveStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.15)',
              borderRadius: '10px', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.3)',
              transition: 'all 0.3s', opacity: saveStatus === 'idle' ? 0.7 : 1,
            }}>
              <span style={{ fontSize: '0.85rem' }}>
                {saveStatus === 'saving' ? '⏳' : saveStatus === 'saved' ? '✅' : saveStatus === 'error' ? '❌' : '💾'}
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? 'Guardado' : saveStatus === 'error' ? 'Error' : 'Auto-guardado activo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Cargando rangos del ecosistema...</p>
      ) : (
        <div style={{ background: 'white', borderRadius: '12px', overflowX: 'auto', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '12px 8px', width: '50px', textAlign: 'center' }}>Nv.</th>
                <th style={{ padding: '12px', width: '280px' }}>Rango & Privilegios</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Meses de antigüedad">📅 Antig.</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Semillas">🌾 Sem.</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Siembras">🪴 Siem.</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Recolecciones">🧺 Rec.</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Especies">🧬 Esp.</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Fotos">📸 Fot.</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Mensajes chat">💬 Msj.</th>
                <th style={{ padding: '12px 6px', textAlign: 'center' }} title="Artículos Blog">📝 Blog</th>
                <th style={{ padding: '12px 6px', textAlign: 'center', background: '#ecfdf5', borderLeft: '2px solid #a7f3d0', color: '#065f46', fontWeight: 700 }}>🎁 Dto.%</th>
                <th style={{ padding: '12px 6px', textAlign: 'center', background: '#fef2f2', borderLeft: '2px solid #fca5a5', color: '#991b1b', fontWeight: 700 }}>⏳ Mant./Mes</th>
              </tr>
            </thead>
            <tbody>
              {logros.map((l, idx) => {
                const lc = getLevelStyle(l.logrosnivel);
                return (
                  <tr key={l.idlogros} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                    {/* NIVEL */}
                    <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '10px',
                        background: lc.bg, color: lc.text, border: `2px solid ${lc.border}`,
                        fontWeight: 900
                      }}>
                        {l.logrosnivel}
                      </span>
                    </td>

                    {/* RANGO & PRIVILEGIOS */}
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="text"
                          value={l.logrosicono}
                          onChange={(e) => handleChange(idx, 'logrosicono', e.target.value)}
                          style={{ width: '40px', fontSize: '1.5rem', textAlign: 'center', background: 'transparent', border: '1px solid transparent', borderRadius: '8px', outline: 'none', cursor: 'pointer', padding: '4px', transition: 'all 0.2s' }}
                          onFocus={(e) => { e.currentTarget.style.border = '1px solid #a7f3d0'; e.currentTarget.style.background = '#f0fdf4'; }}
                          onBlur={(e) => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent'; }}
                          title="Icono del rango"
                        />
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            value={l.logrosnombre}
                            onChange={(e) => handleChange(idx, 'logrosnombre', e.target.value)}
                            style={{ width: '100%', fontWeight: 700, color: '#1e293b', background: 'transparent', border: '1px solid transparent', borderRadius: '6px', outline: 'none', padding: '4px 8px', transition: 'all 0.2s' }}
                            onFocus={(e) => { e.currentTarget.style.border = '1px solid #a7f3d0'; e.currentTarget.style.background = '#f0fdf4'; }}
                            onBlur={(e) => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent'; }}
                          />
                          <input
                            type="text"
                            value={l.privilegios || ''}
                            onChange={(e) => handleChange(idx, 'privilegios', e.target.value)}
                            placeholder="Sin privilegios extra"
                            style={{ width: '100%', color: '#6366f1', fontWeight: 600, background: 'transparent', border: '1px solid transparent', borderRadius: '6px', outline: 'none', padding: '2px 8px', transition: 'all 0.2s', marginTop: '2px' }}
                            onFocus={(e) => { e.currentTarget.style.border = '1px solid #c7d2fe'; e.currentTarget.style.background = '#eef2ff'; }}
                            onBlur={(e) => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent'; }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* INPUTS NUMÉRICOS */}
                    {(['req_antiguedad_meses', 'req_semillas', 'req_siembras', 'req_recolecciones', 'req_especies', 'req_fotos', 'req_mensajes', 'req_blogs'] as const).map((field) => (
                      <td key={field} style={{ padding: '6px', textAlign: 'center' }}>
                        <input
                          type="number" min="0"
                          value={l[field]}
                          onChange={(e) => handleChange(idx, field, e.target.value)}
                          style={{
                            width: '58px', textAlign: 'center', padding: '6px 4px', borderRadius: '8px',
                            border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600,
                            color: '#334155', background: '#f8fafc', transition: 'all 0.2s',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.background = '#ecfdf5'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                      </td>
                    ))}

                    {/* DESCUENTO PRO (columna verde) */}
                    <td style={{ padding: '6px', textAlign: 'center', background: '#f0fdf4', borderLeft: '2px solid #a7f3d0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <input
                          type="number" min="0" max="100"
                          value={l.descuento_pro}
                          onChange={(e) => handleChange(idx, 'descuento_pro', e.target.value)}
                          style={{
                            width: '58px', textAlign: 'center', padding: '6px 4px', borderRadius: '8px',
                            outline: 'none', transition: 'all 0.2s',
                            background: l.descuento_pro > 0 ? '#dcfce7' : '#f8fafc',
                            color: l.descuento_pro === 100 ? '#15803d' : l.descuento_pro > 0 ? '#166534' : '#94a3b8',
                            fontWeight: l.descuento_pro > 0 ? 800 : 600,
                            border: l.descuento_pro > 0 ? '1px solid #86efac' : '1px solid #e2e8f0',
                          }}
                          onFocus={(e) => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(34,197,94,0.15)'; }}
                          onBlur={(e) => { e.currentTarget.style.borderColor = l.descuento_pro > 0 ? '#86efac' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                        {l.descuento_pro === 100 && (
                          <span style={{ fontWeight: 900, color: '#15803d', background: '#bbf7d0', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.5px' }}>FREE</span>
                        )}
                      </div>
                    </td>

                    {/* MANTENIMIENTO MENSUAL (columna roja) */}
                    <td style={{ padding: '6px', textAlign: 'center', background: l.req_mantenimiento_mensual > 0 ? '#fef2f2' : 'transparent', borderLeft: '2px solid #fca5a5' }}>
                      <input
                        type="number" min="0"
                        value={l.req_mantenimiento_mensual}
                        onChange={(e) => handleChange(idx, 'req_mantenimiento_mensual', e.target.value)}
                        style={{
                          width: '58px', textAlign: 'center', padding: '6px 4px', borderRadius: '8px',
                          outline: 'none', transition: 'all 0.2s',
                          background: l.req_mantenimiento_mensual > 0 ? '#fee2e2' : '#f8fafc',
                          color: l.req_mantenimiento_mensual > 0 ? '#991b1b' : '#94a3b8',
                          fontWeight: l.req_mantenimiento_mensual > 0 ? 800 : 600,
                          border: l.req_mantenimiento_mensual > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)'; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = l.req_mantenimiento_mensual > 0 ? '#fca5a5' : '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
                      />
                    </td>
                  </tr>
                );
              })}
              {logros.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No hay rangos configurados.</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Leyenda */}
          <div style={{ display: 'flex', gap: '20px', padding: '16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#a7f3d0', border: '1px solid #4ade80', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>🎁 Descuento en Suscripción PRO</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#fca5a5', border: '1px solid #f87171', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>⏳ Acciones mínimas/mes para no entrar en estado Latente</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#c7d2fe', border: '1px solid #818cf8', display: 'inline-block' }}></span>
              <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>Texto violeta = Privilegios de moderación</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
