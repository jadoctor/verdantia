import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ruler, Sparkles, MapPin, Layers, Calendar, Info } from 'lucide-react';
import { getMediaUrl } from '@/lib/media-url';
import { SpeciesIcon } from '@/components/ui/SpeciesIcon';

interface GardenMapProps {
  misCultivos: any[];
  profile: any;
}

export default function GardenMap({ misCultivos, profile }: GardenMapProps) {
  const [bancales, setBancales] = useState<any[]>([]);
  const [maxSpace, setMaxSpace] = useState(10);
  const [usedSpace, setUsedSpace] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hoveredCrop, setHoveredCrop] = useState<any | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const fetchBancales = async () => {
      try {
        const email = profile?.email;
        if (!email) return;

        const res = await fetch('/api/user/bancales', {
          headers: { 'x-user-email': email }
        });
        if (res.ok) {
          const data = await res.json();
          setBancales(data.bancales || []);
          setMaxSpace(data.maxSpace || 10);
          setUsedSpace(data.usedSpace || 0);
        }
      } catch (e) {
        console.error('Error fetching bancales:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchBancales();
  }, [profile, misCultivos]);

  // Filter active crops (in progress / active)
  const activeCrops = misCultivos.filter(
    (c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido'
  );

  // Group crops by bed
  // If the user has no real beds, all active crops go to the "virtual" bed.
  const hasRealBancales = bancales.length > 0;

  const getBancalesToRender = () => {
    if (hasRealBancales) {
      return bancales;
    }
    // Fallback: standard virtual bed sized based on maxSpace
    let w = 4;
    let l = 2.5;
    if (maxSpace === 50) { w = 10; l = 5; }
    else if (maxSpace === 200) { w = 20; l = 10; }
    else if (maxSpace === 1000) { w = 50; l = 20; }

    return [{
      idbancales: 'virtual',
      bancalesnombre: 'Bancal Estándar (Plan Virtual)',
      bancalesancho: w,
      bancaleslargo: l,
      bancalesforma: 'rectangular',
      bancalessigpacsuperficie: maxSpace,
      isVirtual: true
    }];
  };

  const getCropsForBancal = (bancalId: string | number) => {
    if (bancalId === 'virtual') {
      // In virtual mode, all crops map to the virtual bed
      return activeCrops;
    }
    return activeCrops.filter((c: any) => c.xcultivosidbancales === bancalId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Offset for tooltip placement
    setTooltipPos({
      x: e.clientX + 15,
      y: e.clientY + 15
    });
  };

  if (loading) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
        <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid #cbd5e1', borderTopColor: '#0f766e', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
        <p style={{ margin: 0, fontSize: '0.85rem' }}>Generando mapa botánico del huerto...</p>
      </div>
    );
  }

  const renderedBancales = getBancalesToRender();

  return (
    <div style={{
      background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px',
      padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      marginTop: '2rem', animation: 'fadeIn 0.3s ease', position: 'relative'
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🗺️</span> Mapa Gráfico del Huerto (A Escala)
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            {hasRealBancales
              ? `Planificación visual de tus ${bancales.length} bancales reales con densidades de cultivo a escala.`
              : 'Previsualización en el Bancal Estándar. Configura tus bancales físicos para ajustar las escalas reales.'
            }
          </p>
        </div>
        {!hasRealBancales && (
          <button
            onClick={() => router.push('/dashboard/perfil?tab=bancales')}
            style={{
              background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0',
              padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex',
              alignItems: 'center', gap: '4px', transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}
          >
            <Sparkles size={12} /> Diseñar Bancales Reales
          </button>
        )}
      </div>

      {/* Grid of Beds */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
        {renderedBancales.map(bancal => {
          const crops = getCropsForBancal(bancal.idbancales);
          const w = bancal.bancalesancho || 4;
          const l = bancal.bancaleslargo || 2.5;
          const area = w * l;
          
          // Compute scales for SVG viewport (we target 300x200 viewBox)
          const maxDimension = Math.max(w, l);
          const scale = 150 / maxDimension;
          
          const svgWidth = w * scale;
          const svgHeight = l * scale;
          const offsetX = (300 - svgWidth) / 2;
          const offsetY = (200 - svgHeight) / 2;

          return (
            <div key={bancal.idbancales} style={{
              border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px',
              background: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.01)'
            }}>
              {/* Header Bed */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, color: '#0f766e', fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {bancal.bancalesnombre}
                    {!bancal.isVirtual && (
                      <button
                        onClick={() => router.push(`/dashboard/bancales/${bancal.idbancales}`)}
                        style={{
                          background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
                          cursor: 'pointer', borderRadius: '6px', padding: '2px 6px', fontSize: '0.65rem',
                          display: 'inline-flex', alignItems: 'center', gap: '2px', fontWeight: 700,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#dcfce7';
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = '#f0fdf4';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Abrir Diseñador Interactivo"
                      >
                        📐 Diseñar
                      </button>
                    )}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    <Ruler size={10} />
                    <span>{w}m × {l}m ({area.toFixed(1)} m²)</span>
                    {bancal.isVirtual && (
                      <span style={{
                        background: '#e0f2fe', color: '#0369a1', fontSize: '0.65rem',
                        fontWeight: 700, padding: '1px 5px', borderRadius: '4px'
                      }}>Plan Virtual</span>
                    )}
                  </div>
                </div>
                <span style={{
                  background: '#f1f5f9', color: '#475569', fontSize: '0.7rem',
                  fontWeight: 700, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase'
                }}>
                  {crops.length} Cultivos
                </span>
              </div>

              {/* Graphic Canvas SVG */}
              <div style={{
                position: 'relative', width: '100%', height: '200px', background: '#f8fafc',
                borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden'
              }}>
                <svg width="100%" height="100%" viewBox="0 0 300 200" style={{ display: 'block' }}>
                  <defs>
                    <pattern id="mapGrid" width="15" height="15" patternUnits="userSpaceOnUse">
                      <path d="M 15 0 L 0 0 0 15" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                    </pattern>
                  </defs>
                  
                  {/* Grid background */}
                  <rect width="100%" height="100%" fill="url(#mapGrid)" />
                  
                  {/* Bed Shape Outline Container */}
                  {bancal.bancalesforma === 'rectangular' && (
                    <rect
                      x={offsetX} y={offsetY}
                      width={svgWidth} height={svgHeight}
                      rx="6" fill="#f0fdf4" fillOpacity="0.4"
                      stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"
                    />
                  )}

                  {bancal.bancalesforma === 'circular' && (
                    <circle
                      cx="150" cy="100"
                      r={Math.min(svgWidth, svgHeight) / 2}
                      fill="#f0fdf4" fillOpacity="0.4"
                      stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"
                    />
                  )}

                  {bancal.bancalesforma === 'trapezoidal' && (
                    <polygon
                      points={`
                        ${offsetX + svgWidth * 0.2},${offsetY} 
                        ${offsetX + svgWidth * 0.8},${offsetY} 
                        ${offsetX + svgWidth},${offsetY + svgHeight} 
                        ${offsetX},${offsetY + svgHeight}
                      `}
                      fill="#f0fdf4" fillOpacity="0.4"
                      stroke="#10b981" strokeWidth="2" strokeDasharray="3 3"
                    />
                  )}

                  {/* Cultivos / Plants inside */}
                  {crops.map((c: any) => {
                    // Coordinates relative to bed frame
                    const px = c.cultivosposicionx !== null ? parseFloat(c.cultivosposicionx) : 50;
                    const py = c.cultivosposiciony !== null ? parseFloat(c.cultivosposiciony) : 50;
                    
                    // Map % to actual SVG bed bounds
                    // We map 0-100% to offsetX -> offsetX+svgWidth
                    const cx = offsetX + (px / 100) * svgWidth;
                    const cy = offsetY + (py / 100) * svgHeight;

                    // Plant scaling framework radius
                    // radius (m) = marcoplantas/200
                    // SVG pixels radius = (radius_m / bed_ancho) * svgWidth
                    const frame = Math.max(parseFloat(c.especiesmarcoplantas) || 30, 20);
                    let r = ((frame / 200) / w) * svgWidth;
                    // Clamp radius between 10px and 22px for balanced visual representation
                    r = Math.min(Math.max(r, 10), 22);

                    const isHarvestReady = c.cultivosestado === 'recoleccion' || c.cultivosestado === 'produccion';
                    const isSprout = c.cultivosestado === 'germinacion' || c.cultivosestado === 'en_espera';

                    return (
                      <g key={c.idcultivos}
                        onMouseEnter={() => setHoveredCrop(c)}
                        onMouseLeave={() => setHoveredCrop(null)}
                        onMouseMove={handleMouseMove}
                        style={{ cursor: 'pointer' }}
                        onClick={() => router.push(`/dashboard/cultivos/${c.idcultivos}?from=dashboard`)}
                      >
                        {/* Outer Glow Halo for status feedback */}
                        {isHarvestReady && (
                          <circle
                            cx={cx} cy={cy} r={r + 4}
                            fill="#10b981" fillOpacity="0.2"
                            stroke="#059669" strokeWidth="1"
                            style={{ transformOrigin: `${cx}px ${cy}px`, animation: 'pulse 2s infinite' }}
                          />
                        )}
                        {isSprout && (
                          <circle
                            cx={cx} cy={cy} r={r + 3}
                            fill="#f59e0b" fillOpacity="0.15"
                            stroke="#d97706" strokeWidth="1"
                            strokeDasharray="2 2"
                          />
                        )}

                        {/* Plant Circle */}
                        <circle
                          cx={cx} cy={cy} r={r}
                          fill="url(#plantGrad)"
                          stroke={isHarvestReady ? '#059669' : '#047857'}
                          strokeWidth="1.5"
                          filter="drop-shadow(0 2px 4px rgba(0,0,0,0.06))"
                        />

                        {/* Gradients */}
                        <defs>
                          <radialGradient id="plantGrad" cx="30%" cy="30%" r="70%">
                            <stop offset="0%" stopColor="#86efac" />
                            <stop offset="70%" stopColor="#15803d" />
                            <stop offset="100%" stopColor="#14532d" />
                          </radialGradient>
                          <style>{`
                            @keyframes pulse {
                              0% { transform: scale(0.95); opacity: 0.7; }
                              50% { transform: scale(1.05); opacity: 0.9; }
                              100% { transform: scale(0.95); opacity: 0.7; }
                            }
                          `}</style>
                        </defs>

                        {/* Plant Emoji Icon */}
                        <text
                          x={cx} y={cy + 4}
                          textAnchor="middle"
                          fontSize={`${r * 1.1}px`}
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >
                          {c.especiesicono && !c.especiesicono.startsWith('/') ? c.especiesicono : '🌱'}
                        </text>

                        {/* Mini Collection Number Badge */}
                        <circle
                          cx={cx + r * 0.7} cy={cy - r * 0.7} r="6"
                          fill="#334155" stroke="white" strokeWidth="1"
                        />
                        <text
                          x={cx + r * 0.7} y={cy - r * 0.7 + 2}
                          textAnchor="middle" fill="white"
                          fontSize="6px" fontWeight="bold"
                          style={{ userSelect: 'none', pointerEvents: 'none' }}
                        >
                          {c.cultivosnumerocoleccion || '1'}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {/* Visual Planner Link Overlay */}
                {!bancal.isVirtual && (
                  <button
                    onClick={() => router.push(`/dashboard/bancales/${bancal.idbancales}`)}
                    style={{
                      position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
                      color: 'white', border: '1px solid rgba(255,255,255,0.15)',
                      padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem',
                      fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      gap: '6px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 20
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#10b981';
                      e.currentTarget.style.borderColor = '#10b981';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.85)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    }}
                  >
                    <span>📐</span> Planificar en Lienzo
                  </button>
                )}

                {/* Empty State Bed */}
                {crops.length === 0 && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', background: 'rgba(248, 250, 252, 0.75)'
                  }}>
                    <span style={{ fontSize: '1.25rem', opacity: 0.7 }}>🕳️</span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '4px' }}>
                      Bancal libre para plantar.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Tooltip Component */}
      {hoveredCrop && (
        <div style={{
          position: 'fixed', left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px`,
          zIndex: 99999, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px',
          padding: '12px 14px', width: '220px', color: 'white',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)', pointerEvents: 'none',
          animation: 'fadeIn 0.15s ease'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '6px' }}>
            <SpeciesIcon icon={hoveredCrop.especiesicono || '🌱'} size="1.5rem" />
            <div>
              <div style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: 800, textTransform: 'uppercase' }}>
                Nº {hoveredCrop.cultivosnumerocoleccion || hoveredCrop.idcultivos}
              </div>
              <h5 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>{hoveredCrop.especiesnombre}</h5>
            </div>
          </div>

          {/* Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem', color: '#cbd5e1' }}>
            <div>
              <strong>Variedad:</strong> {hoveredCrop.variedad_nombre || 'Común'}
            </div>
            <div>
              <strong>Cantidad:</strong> {hoveredCrop.cultivoscantidad} plantas
            </div>
            <div>
              <strong>Fase:</strong> <span style={{
                color: hoveredCrop.cultivosestado === 'recoleccion' ? '#34d399' : '#fbbf24',
                fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem'
              }}>{hoveredCrop.cultivosestado}</span>
            </div>
            {hoveredCrop.cultivosfechainicio && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', color: '#94a3b8', fontSize: '0.7rem' }}>
                <Calendar size={10} />
                <span>Iniciado el {new Date(hoveredCrop.cultivosfechainicio).toLocaleDateString('es-ES')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
