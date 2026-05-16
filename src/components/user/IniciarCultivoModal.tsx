'use client';

import { useState, useEffect } from 'react';

const StepCard = ({ icon, title, desc, onClick, children, rightContent, outOfSeason, inSeason }: { icon?: string, title: string, desc?: string, onClick?: () => void, children?: React.ReactNode, rightContent?: React.ReactNode, outOfSeason?: boolean, inSeason?: boolean }) => {
  let bgColor = 'white';
  let borderColor = '#e2e8f0';
  let titleColor = '#1e293b';
  let hoverBorderColor = '#10b981';
  let hoverBoxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.1), 0 2px 4px -1px rgba(16, 185, 129, 0.06)';
  let normalBoxShadow = '0 2px 4px rgba(0,0,0,0.02)';
  let outBorderColor = '#e2e8f0';

  if (outOfSeason) {
    bgColor = '#fef2f2';
    borderColor = '#fca5a5';
    titleColor = '#991b1b';
    hoverBorderColor = '#ef4444';
    hoverBoxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.1)';
    outBorderColor = '#fca5a5';
  } else if (inSeason) {
    bgColor = '#f0fdf4';
    borderColor = '#6ee7b7';
    titleColor = '#065f46';
    hoverBorderColor = '#10b981';
    hoverBoxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.2)';
    outBorderColor = '#6ee7b7';
  }

  return (
    <div 
      onClick={onClick}
      style={{ 
        border: `1px solid ${borderColor}`, borderRadius: '12px', padding: '16px', cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s', display: 'flex', flexDirection: 'column', gap: '8px',
        background: bgColor, boxShadow: normalBoxShadow
      }}
      onMouseOver={e => { e.currentTarget.style.borderColor = hoverBorderColor; e.currentTarget.style.boxShadow = hoverBoxShadow; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = outBorderColor; e.currentTarget.style.boxShadow = normalBoxShadow; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {icon && <div style={{ fontSize: '2rem' }}>{icon}</div>}
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 2px', color: titleColor, fontSize: '1.05rem', fontWeight: 600 }}>
            {title}
            {outOfSeason && <span style={{ marginLeft: '8px', color: '#ef4444', fontSize: '0.85rem', fontWeight: 400 }}>⚠️ Fuera de temporada</span>}
            {inSeason && <span style={{ marginLeft: '8px', color: '#10b981', fontSize: '0.85rem', fontWeight: 400 }}>✨ Época ideal</span>}
          </h4>
          {desc && <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>{desc}</p>}
        </div>
        {rightContent && <div onClick={e => e.stopPropagation()}>{rightContent}</div>}
      </div>
      {children && (
        <div style={{ width: '100%', marginTop: '4px' }} onClick={e => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
};

const CalendarRow = ({ title, icon, desde, hasta }: { title: string, icon: string, desde: number, hasta: number }) => {
  if (!desde || !hasta) return null;
  
  const isMonthActive = (m: number) => {
    if (desde <= hasta) return m >= desde && m <= hasta;
    return m >= desde || m <= hasta; 
  };

  const currentMonth = new Date().getMonth() + 1;
  const meses = ['E','F','M','A','M','J','J','A','S','O','N','D'];
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }} title={`${title} (Verde claro = Pasado, Verde intenso = Presente/Futuro)`}>
      <span style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '2px', width: '60px' }}>
        <span>{icon}</span> {title}
      </span>
      <div style={{ display: 'flex', gap: '2px' }}>
        {meses.map((m, i) => {
          const monthNum = i + 1;
          const active = isMonthActive(monthNum);
          const isCurrentMonth = currentMonth === monthNum;
          
          const isPastMonth = monthNum < currentMonth;
          
          const bgActive = isPastMonth ? '#6ee7b7' : '#10b981';
          const borderActive = isPastMonth ? '#6ee7b7' : '#10b981';

          return (
            <div key={i} style={{
              width: '12px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: 'bold',
              background: active ? bgActive : '#f8fafc',
              color: active ? 'white' : '#cbd5e1',
              borderRadius: '2px',
              border: isCurrentMonth ? '2px solid #ef4444' : `1px solid ${active ? borderActive : '#e2e8f0'}`,
              position: 'relative',
              zIndex: isCurrentMonth ? 10 : 1
            }}>
              {m}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default function IniciarCultivoModal({
  isOpen,
  onClose,
  plantaId,
  plantaNombre,
  userEmail,
  calendarioSolar,
  viabilidadSemilla
}: {
  isOpen: boolean;
  onClose: () => void;
  plantaId: number;
  plantaNombre: string;
  userEmail: string;
  calendarioSolar?: any;
  viabilidadSemilla?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1);
  
  // Opciones temporales del wizard
  const [tipoPartida, setTipoPartida] = useState<'semilla' | 'plantel' | 'esqueje' | null>(null);
  
  const [formData, setFormData] = useState({
    origen: '',
    metodo: 'semillero',
    cantidad: 1,
    ubicacion: '',
    numerocoleccion: '',
    // Detalles sobre semilla comprada
    semillaslugarcompra: '',
    semillasmarca: '',
    semillasfechaenvasado: '',
    semillasfechacaducidad: '',
    semillascantidad: '',
    fechaInicio: new Date().toISOString().split('T')[0]
  });
  
  const [calendarType, setCalendarType] = useState('Normal');
  const [calendarAdvice, setCalendarAdvice] = useState<any>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState('');
  const [showDateOptions, setShowDateOptions] = useState(false);
  const [crearBanco, setCrearBanco] = useState(false);
  const [nextNumero, setNextNumero] = useState<number | null>(null);

  const fetchNextNumero = async () => {
    try {
      const res = await fetch('/api/user/semillas/next-numero', { headers: { 'x-user-email': userEmail! } });
      if (res.ok) {
         const data = await res.json();
         setNextNumero(data.nextNumero);
         handleNext({ numerocoleccion: String(data.nextNumero) });
      }
    } catch(e) { console.error(e); }
  };

  const isDateValidForMethod = (isoDate: string, metodo: string) => {
    if (!isoDate || !calendarioSolar) return true;
    const m = new Date(isoDate).getMonth() + 1;
    const checkRange = (d: number, h: number) => {
      if (!d || !h) return false;
      if (d <= h) return m >= d && m <= h;
      return m >= d || m <= h; 
    };
    if (metodo === 'semillero') return checkRange(calendarioSolar.semillerodesde, calendarioSolar.semillerohasta);
    if (metodo === 'siembra_directa') return checkRange(calendarioSolar.siembradirectadesde, calendarioSolar.siembradirectahasta);
    if (metodo === 'trasplante_directo') return checkRange(calendarioSolar.trasplantedesde, calendarioSolar.trasplantehasta);
    return true;
  };

  const getTimeLabel = (isoDate: string) => {
    if (!isoDate) return null;
    const target = new Date(isoDate);
    const now = new Date();
    target.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    
    if (diffDays > 0) return `⏳ En ${diffDays} días`;
    if (diffDays < 0) return `⏳ Hace ${Math.abs(diffDays)} días`;
    
    return null;
  };

  useEffect(() => {
    if (isOpen && userEmail) {
      console.log('Fetching profile for calendar type...', userEmail, plantaNombre);
      fetch(`/api/auth/profile?email=${encodeURIComponent(userEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data.profile?.tipoCalendario) {
            const calType = data.profile.tipoCalendario;
            setCalendarType(calType);
            console.log('Calendar type detected:', calType);
            
            // Si tiene un calendario avanzado, consultar la IA
            if (calType !== 'Normal' && plantaNombre) {
              console.log('Starting AI fetch for', plantaNombre);
              setLoadingAdvice(true);
              setAdviceError('');
              fetch('/api/ai/calendar-advice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plantaNombre, calendarType: calType, calendarioSolar })
              })
              .then(async (res) => {
                if (!res.ok) {
                  const errText = await res.text();
                  throw new Error(`Error HTTP: ${res.status} - ${errText}`);
                }
                return res.json();
              })
              .then(aiData => {
                console.log('AI response received:', aiData);
                if (aiData.success && aiData.aiData) {
                  setCalendarAdvice(aiData.aiData);
                } else {
                  setAdviceError(aiData.error || 'Respuesta inválida de IA');
                }
              })
              .catch(err => {
                console.error('Fetch AI error:', err);
                setAdviceError(err.message);
              })
              .finally(() => setLoadingAdvice(false));
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen, userEmail, plantaNombre, calendarioSolar]);

  if (!isOpen) return null;

  const handleNext = (updates: any) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleDownloadIcs = (dateIso: string, plantaNombre: string) => {
    if (!dateIso) return;
    const startDate = new Date(dateIso);
    if (isNaN(startDate.getTime())) return;
    
    // Configurar evento para las 10:00 AM
    startDate.setHours(10, 0, 0);
    const endDate = new Date(startDate);
    endDate.setHours(11, 0, 0);

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Verdantia//Calendario de Siembra//ES
BEGIN:VEVENT
UID:${startDate.getTime()}@verdantia.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:🌱 Sembrar ${plantaNombre} (Día Ideal)
DESCRIPTION:Día óptimo según el calendario lunar/biodinámico para iniciar el cultivo de ${plantaNombre}.
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `siembra-${plantaNombre.replace(/\s+/g, '-').toLowerCase()}-${dateIso}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFinish = async (updates: any) => {
    const finalData = { ...formData, ...updates };
    setLoading(true);

    try {
      let seedId = null;

      // Si es una semilla nueva comprada, creamos primero la entrada en la tabla semillas
      if (finalData.origen === 'semilla_nueva') {
        const seedBody: any = {
          xsemillasidvariedades: plantaId,
          semillasorigen: 'sobre_comprado',
          semillaslugarcompra: finalData.semillaslugarcompra,
          semillasmarca: finalData.semillasmarca,
          semillasfechaenvasado: finalData.semillasfechaenvasado,
          semillasfechacaducidad: finalData.semillasfechacaducidad,
          semillasstock: 'medio'
        };

        if (crearBanco) {
          const cantidad = parseInt(finalData.semillascantidad) || 0;
          seedBody.semillasstockinicial = cantidad;
          seedBody.semillasstockactual = cantidad;
          seedBody.semillasnumerocoleccion = nextNumero ? String(nextNumero) : null;
        }

        const seedRes = await fetch('/api/user/semillas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
          body: JSON.stringify(seedBody)
        });
        if (seedRes.ok) {
          const seedData = await seedRes.json();
          seedId = seedData.id;
        }
      }

      // Ahora creamos el cultivo
      const res = await fetch('/api/user/cultivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
        body: JSON.stringify({
          xcultivosidvariedades: plantaId,
          xcultivosidsemillas: seedId,
          cultivosorigen: finalData.origen,
          cultivosmetodo: finalData.metodo,
          cultivoscantidad: finalData.cantidad,
          cultivosubicacion: finalData.ubicacion || null,
          cultivosnumerocoleccion: finalData.numerocoleccion ? parseInt(finalData.numerocoleccion) : null,
          cultivosestado: finalData.fechaInicio > new Date().toISOString().split('T')[0] ? 'en_espera' : (finalData.metodo === 'semillero' ? 'germinacion' : 'crecimiento'),
          cultivosfechainicio: finalData.fechaInicio || new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          // Reset y cerrar
          setSuccess(false);
          setStep(1);
          setTipoPartida(null);
          onClose();
        }, 2500);
      } else {
        alert('Error al iniciar cultivo');
      }
    } catch (e) {
      console.error(e);
      alert('Error en la conexión');
    } finally {
      setLoading(false);
    }
  };

  const MiniCalendarSemillero = () => {
    if (!calendarioSolar || !calendarioSolar.semillerodesde || !calendarioSolar.semillerohasta) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <CalendarRow title="Semillero" icon="📥" desde={calendarioSolar.semillerodesde} hasta={calendarioSolar.semillerohasta} />
      </div>
    );
  };

  const MiniCalendarDirecta = () => {
    if (!calendarioSolar || !calendarioSolar.siembradirectadesde || !calendarioSolar.siembradirectahasta) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <CalendarRow title="Directa" icon="🌍" desde={calendarioSolar.siembradirectadesde} hasta={calendarioSolar.siembradirectahasta} />
      </div>
    );
  };

  const MiniCalendarTrasplante = () => {
    if (!calendarioSolar || !calendarioSolar.trasplantedesde || !calendarioSolar.trasplantehasta) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <CalendarRow title="Trasplante" icon="🪴" desde={calendarioSolar.trasplantedesde} hasta={calendarioSolar.trasplantehasta} />
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'white', padding: '30px', borderRadius: '20px',
        width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>🌱 Iniciar Cultivo</h2>
            <p style={{ margin: '4px 0 0', color: '#10b981', fontWeight: 600, fontSize: '0.9rem' }}>{plantaNombre}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>×</button>
        </div>

        {success ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>✅</div>
            <h3 style={{ color: '#10b981', margin: 0 }}>¡Cultivo iniciado!</h3>
            <p style={{ color: '#64748b', marginTop: '10px' }}>Tu planta ya está viva en el huerto y sus tareas generadas.</p>
          </div>
        ) : loading ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⏳</div>
            Preparando la tierra virtual...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* AVISO CALENDARIO LUNAR/BIODINAMICO (ENCABEZADO GLOBAL) */}
            {calendarType !== 'Normal' && step === 1 && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '16px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ fontSize: '1.8rem', marginTop: '-4px' }}>
                    {calendarType === 'Lunar' ? '🌕' : '🌍'}
                  </div>
                  <div style={{ width: '100%' }}>
                    <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#1e3a8a' }}>Asesor de Siembra {calendarType}</h4>
                    
                    {loadingAdvice ? (
                      <div style={{ color: '#3b82f6', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="spinner" style={{ fontSize: '1rem' }}>⏳</span> Analizando los astros y ciclos para <strong>{plantaNombre}</strong>...
                      </div>
                    ) : adviceError ? (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#dc2626', lineHeight: '1.4' }}>
                        Hubo un error cargando la IA: {adviceError}.
                      </p>
                    ) : calendarAdvice ? (
                      <>
                        {calendarAdvice.fueraDeTemporada && (
                          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '12px', color: '#991b1b', fontSize: '0.85rem', display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                            <div>
                              <strong>Fuera de Temporada</strong><br/>
                              El mes actual no es adecuado para la siembra de esta especie. Las fechas recomendadas abajo corresponden a la <strong>próxima temporada ideal</strong>.
                            </div>
                          </div>
                        )}
                        
                        <p style={{ margin: '0 0 12px', fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.4' }}>
                          {calendarAdvice.recomendacion}
                        </p>
                        
                        {/* Solo mostramos la tabla en el paso 1 para no saturar los demás pasos */}
                        {step === 1 && calendarAdvice.periodos && calendarAdvice.periodos.length > 0 && (
                          <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #bfdbfe', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
                                <tr>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#1e3a8a', fontWeight: 600 }}>Mes</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#1e3a8a', fontWeight: 600 }}>Periodo Favorable</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#1e3a8a', fontWeight: 600 }}>Día Ideal Absoluto</th>
                                  <th style={{ padding: '8px 12px', textAlign: 'center', color: '#1e3a8a', fontWeight: 600 }}>Método Válido</th>
                                </tr>
                              </thead>
                              <tbody>
                                {calendarAdvice.periodos.map((p: any, i: number) => {
                                  let validMethod = 'Todos';
                                  if (p.fechaIso && calendarioSolar) {
                                    const m = new Date(p.fechaIso).getMonth() + 1;
                                    const checkRange = (d: number, h: number) => {
                                      if (!d || !h) return false;
                                      if (d <= h) return m >= d && m <= h;
                                      return m >= d || m <= h; 
                                    };
                                    const isSemillero = checkRange(calendarioSolar.semillerodesde, calendarioSolar.semillerohasta);
                                    const isDirecta = checkRange(calendarioSolar.siembradirectadesde, calendarioSolar.siembradirectahasta);
                                    
                                    if (isSemillero && isDirecta) validMethod = 'Ambos';
                                    else if (isSemillero) validMethod = 'Solo Semillero';
                                    else if (isDirecta) validMethod = 'Solo Directa';
                                    else validMethod = '⚠️ Fuera de rango';
                                  }

                                  return (
                                    <tr key={i} style={{ borderBottom: i === calendarAdvice.periodos.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                                      <td style={{ padding: '8px 12px', color: '#334155', fontWeight: 500 }}>{p.mes}</td>
                                      <td style={{ padding: '8px 12px', color: '#475569' }}>{p.rango}</td>
                                      <td style={{ padding: '8px 12px', color: '#10b981', fontWeight: 'bold', textAlign: 'center' }}>🎯 {p.diaIdeal}</td>
                                      <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: '0.8rem', color: validMethod.includes('⚠️') ? '#dc2626' : '#3b82f6', fontWeight: 600 }}>{validMethod}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    ) : (
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#3b82f6', lineHeight: '1.4' }}>
                        Antes de sembrar, ten en cuenta las recomendaciones de tu calendario.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* PASO 1: TIPO DE PARTIDA */}
            {step === 1 && (
              <>
                <h3 style={{ margin: '0 0 8px', color: '#334155', fontSize: '1.1rem' }}>Paso 1: ¿De qué vas a partir?</h3>
                


                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                  <h4 style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Semilla</h4>
                  <StepCard 
                    title="Semillero"
                    rightContent={<MiniCalendarSemillero />}
                    outOfSeason={calendarAdvice && calendarAdvice.periodos && calendarAdvice.periodos.filter((p: any) => isDateValidForMethod(p.fechaIso, 'semillero')).length === 0}
                    inSeason={calendarAdvice && calendarAdvice.periodos && calendarAdvice.periodos.filter((p: any) => isDateValidForMethod(p.fechaIso, 'semillero')).length > 0}
                  >
                    {calendarAdvice && calendarAdvice.periodos && (() => {
                      const periodos = calendarAdvice.periodos.filter((p: any) => isDateValidForMethod(p.fechaIso, 'semillero'));
                      
                      return periodos.map((p: any, i: number) => {
                        const timeLabel = getTimeLabel(p.fechaIso);
                        return (
                          <div 
                            key={`ai-sem-${i}`}
                            onClick={e => { e.stopPropagation(); setTipoPartida('semilla'); handleNext({ metodo: 'semillero', fechaInicio: p.fechaIso }); setStep(2); }}
                            style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.7)', border: '1px solid #10b981', borderRadius: '6px', color: '#065f46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                          >
                            <span style={{ flex: 1 }}>🎯 Día Ideal: <strong>{p.diaIdeal}</strong> {timeLabel && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', marginLeft: '6px' }}>{timeLabel}</span>}</span>
                            <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '8px' }}>Elegir este día</span>
                          </div>
                        );
                      });
                    })()}

                    <div 
                      onClick={e => e.stopPropagation()}
                      style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.7)', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#475569', flex: 1 }}>📅 Sembrar hoy (o elegir):</span>
                      <input 
                        type="date"
                        value={formData.fechaInicio}
                        onChange={e => handleNext({ fechaInicio: e.target.value })}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#1e293b' }}
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTipoPartida('semilla');
                          handleNext({ metodo: 'semillero' });
                          setStep(2);
                        }}
                        style={{ background: '#64748b', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        Continuar
                      </button>
                    </div>
                  </StepCard>
                  <StepCard 
                    title="Siembra Directa"
                    rightContent={<MiniCalendarDirecta />}
                    outOfSeason={calendarAdvice && calendarAdvice.periodos && calendarAdvice.periodos.filter((p: any) => isDateValidForMethod(p.fechaIso, 'siembra_directa')).length === 0}
                    inSeason={calendarAdvice && calendarAdvice.periodos && calendarAdvice.periodos.filter((p: any) => isDateValidForMethod(p.fechaIso, 'siembra_directa')).length > 0}
                  >
                    {calendarAdvice && calendarAdvice.periodos && (() => {
                      const periodos = calendarAdvice.periodos.filter((p: any) => isDateValidForMethod(p.fechaIso, 'siembra_directa'));
                      
                      return periodos.map((p: any, i: number) => {
                        const timeLabel = getTimeLabel(p.fechaIso);
                        return (
                          <div 
                            key={`ai-dir-${i}`}
                            onClick={e => { e.stopPropagation(); setTipoPartida('semilla'); handleNext({ metodo: 'siembra_directa', fechaInicio: p.fechaIso }); setStep(2); }}
                            style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.7)', border: '1px solid #10b981', borderRadius: '6px', color: '#065f46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                          >
                            <span style={{ flex: 1 }}>🎯 Día Ideal: <strong>{p.diaIdeal}</strong> {timeLabel && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', marginLeft: '6px' }}>{timeLabel}</span>}</span>
                            <span style={{ background: '#10b981', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '8px' }}>Elegir este día</span>
                          </div>
                        );
                      });
                    })()}

                    <div 
                      onClick={e => e.stopPropagation()}
                      style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.7)', border: '1px solid #cbd5e1', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#475569', flex: 1 }}>📅 Sembrar hoy (o elegir):</span>
                      <input 
                        type="date"
                        value={formData.fechaInicio}
                        onChange={e => handleNext({ fechaInicio: e.target.value })}
                        style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem', color: '#1e293b' }}
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTipoPartida('semilla');
                          handleNext({ metodo: 'siembra_directa' });
                          setStep(2);
                        }}
                        style={{ background: '#64748b', color: 'white', padding: '4px 12px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        Continuar
                      </button>
                    </div>
                  </StepCard>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h4 style={{ margin: '8px 0 0', color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Planta Viva</h4>
                  <StepCard 
                    icon="🪴" title="Plantel"
                    onClick={() => { setTipoPartida('plantel'); setStep(2); }}
                    rightContent={<MiniCalendarTrasplante />}
                  />
                  <StepCard 
                    icon="🌿" title="Esqueje"
                    onClick={() => { setTipoPartida('esqueje'); handleNext({ origen: 'esqueje', metodo: 'trasplante_directo' }); setStep(3); }}
                  />
                </div>
              </>
            )}

            {/* PASO 2: ORIGEN ESPECÍFICO */}
            {step === 2 && tipoPartida === 'semilla' && (
              <>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', padding: 0 }}>← Atrás</button>
                
                <div style={{ background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: '8px', padding: '12px', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.5rem' }}>{formData.metodo === 'semillero' ? '📥' : '🌍'}</span>
                    <div>
                      <span style={{ color: '#065f46', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Método Elegido</span>
                      <h4 style={{ margin: 0, color: '#047857', fontSize: '1.05rem' }}>{formData.metodo === 'semillero' ? 'Semillero' : 'Siembra Directa'}</h4>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#065f46', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Día de Siembra</span>
                    <h4 style={{ margin: 0, color: '#047857', fontSize: '1.05rem' }}>
                      {formData.fechaInicio ? new Date(formData.fechaInicio + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) : ''}
                    </h4>
                    <button 
                      onClick={() => setStep(1)} 
                      style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0, marginTop: '2px', textDecoration: 'underline' }}
                    >
                      Cambiar fecha
                    </button>
                  </div>
                </div>

                <h3 style={{ margin: '16px 0 8px', color: '#334155', fontSize: '1.1rem' }}>Paso 2: ¿De dónde es la semilla?</h3>
                <StepCard 
                  icon="🤲" title="Propia / Intercambio"
                  onClick={() => { handleNext({ origen: 'semilla_inventario' }); setStep(3); }}
                />
                <StepCard 
                  icon="📦" title="Comprada"
                  onClick={() => { handleNext({ origen: 'semilla_nueva' }); }}
                  rightContent={
                    formData.origen === 'semilla_nueva' ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setStep(3); }}
                        style={{
                          background: '#10b981', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px',
                          fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer'
                        }}
                      >
                        Continuar →
                      </button>
                    ) : null
                  }
                >
                  {formData.origen === 'semilla_nueva' && (
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s ease' }}>
                      <h4 style={{ margin: '0 0 4px', color: '#475569', fontSize: '0.95rem' }}>Datos del Sobre (Opcional)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Marca / Nombre Comercial</label>
                          <input list="marcas" type="text" placeholder="Ej. Fito, Batlle..." value={formData.semillasmarca} onChange={e => handleNext({ semillasmarca: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          <datalist id="marcas">
                            <option value="Semillas Fitó" />
                            <option value="Semillas Batlle" />
                            <option value="Rocalba" />
                            <option value="Vilmorin" />
                            <option value="Clemente Viven" />
                            <option value="EuroGarden" />
                            <option value="Koprima" />
                          </datalist>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Lugar de compra</label>
                          <input list="lugares" type="text" placeholder="Ej. Leroy Merlin" value={formData.semillaslugarcompra} onChange={e => handleNext({ semillaslugarcompra: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                          <datalist id="lugares">
                            <option value="Leroy Merlin" />
                            <option value="Verdecora" />
                            <option value="Vivero local" />
                            <option value="Amazon" />
                            <option value="Lidl" />
                            <option value="Aldi" />
                            <option value="Ferretería local" />
                          </datalist>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Fecha Envasado</label>
                          <input 
                            type="month" 
                            value={formData.semillasfechaenvasado ? formData.semillasfechaenvasado.substring(0, 7) : ''} 
                            onChange={e => {
                              const val = e.target.value ? e.target.value + '-01' : '';
                              const updates: any = { semillasfechaenvasado: val };
                              
                              console.log('Calculando viabilidad:', val, viabilidadSemilla);
                              if (val) {
                                const anos = viabilidadSemilla ? Number(viabilidadSemilla) : 4;
                                const d = new Date(val);
                                d.setFullYear(d.getFullYear() + anos);
                                updates.semillasfechacaducidad = d.toISOString().split('T')[0];
                                console.log('Fecha caducidad calculada:', updates.semillasfechacaducidad);
                              }
                              handleNext(updates);
                            }} 
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Caducidad (Preferente)</label>
                          <input type="month" value={formData.semillasfechacaducidad ? formData.semillasfechacaducidad.substring(0, 7) : ''} onChange={e => handleNext({ semillasfechacaducidad: e.target.value ? e.target.value + '-01' : '' })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
                        </div>
                      </div>

                      <div style={{ background: crearBanco ? '#ecfdf5' : '#f1f5f9', padding: '12px', borderRadius: '8px', border: `1px solid ${crearBanco ? '#10b981' : '#cbd5e1'}`, marginTop: '8px', transition: 'all 0.3s ease' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: crearBanco ? '#065f46' : '#475569', fontSize: '0.9rem' }}>
                          <input 
                            type="checkbox" 
                            checked={crearBanco} 
                            onChange={(e) => { 
                              const checked = e.target.checked;
                              setCrearBanco(checked); 
                              if (checked && nextNumero === null) fetchNextNumero();
                              if (!checked) handleNext({ semillascantidad: '', numerocoleccion: '' });
                            }} 
                            style={{ transform: 'scale(1.2)' }}
                          />
                          🌱 Incorporar resto del sobre al Banco de Semillas
                        </label>
                        
                        {crearBanco && (
                          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857' }}>
                              Se guardarán en tu inventario digital. Número de colección asignado automáticamente: 
                              <strong style={{ marginLeft: '4px', background: '#d1fae5', padding: '2px 6px', borderRadius: '4px' }}>
                                #{nextNumero || '...'}
                              </strong>
                            </p>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Cantidad aprox. de semillas a guardar</label>
                              <input 
                                type="number" 
                                min="1"
                                placeholder="Ej. 50"
                                value={formData.semillascantidad} 
                                onChange={e => handleNext({ semillascantidad: e.target.value })} 
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }} 
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </StepCard>
              </>
            )}

            {step === 2 && tipoPartida === 'plantel' && (
              <>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', padding: 0 }}>← Atrás</button>
                <h3 style={{ margin: '8px 0', color: '#334155', fontSize: '1.1rem' }}>Paso 2: ¿Origen del plantel?</h3>
                <StepCard 
                  icon="🛒" title="Comprado en Vivero"
                  onClick={() => { handleNext({ origen: 'plantel_comprado', metodo: 'trasplante_directo' }); setStep(3); }}
                />
                <StepCard 
                  icon="🎁" title="Regalado / Intercambiado"
                  onClick={() => { handleNext({ origen: 'plantel_regalado', metodo: 'trasplante_directo' }); setStep(3); }}
                />
              </>
            )}



            {/* PASO 3: DETALLES Y CANTIDAD */}
            {step === 3 && (
              <>
                <button onClick={() => {
                  if (tipoPartida === 'esqueje') setStep(1);
                  else if (tipoPartida === 'plantel') setStep(2);
                  else if (tipoPartida === 'semilla') setStep(2);
                }} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', textAlign: 'left', padding: 0 }}>← Atrás</button>
                <h3 style={{ margin: '8px 0', color: '#334155', fontSize: '1.1rem' }}>Paso 3: Detalles y Cantidad</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Fecha de Siembra / Inicio */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}>📅 Día de Siembra Confirmado</h4>
                      <button 
                        onClick={() => setShowDateOptions(!showDateOptions)} 
                        style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                      >
                        {showDateOptions ? 'Cerrar opciones' : 'Cambiar fecha'}
                      </button>
                    </div>

                    {!showDateOptions && (
                      <div style={{ padding: '12px', background: '#ecfdf5', border: '2px solid #10b981', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                           <span style={{ fontWeight: 'bold', color: '#065f46', fontSize: '1.05rem', textTransform: 'capitalize' }}>
                              {formData.fechaInicio ? new Date(formData.fechaInicio + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}
                           </span>
                           <div style={{ fontSize: '0.8rem', color: '#047857', marginTop: '2px' }}>Día seleccionado para el inicio</div>
                         </div>
                         <span style={{ color: '#10b981', fontSize: '1.5rem' }}>✓</span>
                      </div>
                    )}
                    
                    {showDateOptions && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', animation: 'fadeIn 0.3s ease' }}>
                        {/* Opciones del Asesor IA filtradas por método elegido */}
                        {calendarAdvice?.periodos?.filter((p: any) => isDateValidForMethod(p.fechaIso, formData.metodo)).map((p: any, i: number) => {
                          const timeLabel = getTimeLabel(p.fechaIso);
                          return (
                            <button 
                              key={`ai-${i}`}
                              onClick={() => { handleNext({ fechaInicio: p.fechaIso }); setShowDateOptions(false); }}
                              style={{ 
                                padding: '12px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer',
                                background: formData.fechaInicio === p.fechaIso ? '#ecfdf5' : 'white',
                                border: `2px solid ${formData.fechaInicio === p.fechaIso ? '#10b981' : '#cbd5e1'}`,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                              }}
                            >
                              <div>
                                <span style={{ fontWeight: 'bold', color: '#0f172a' }}>🎯 Día Ideal Absoluto ({formData.metodo === 'semillero' ? 'Semillero' : formData.metodo === 'siembra_directa' ? 'Siembra Directa' : 'Trasplante'}): {p.diaIdeal} {timeLabel && <span style={{ background: '#fef08a', color: '#854d0e', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', marginLeft: '6px' }}>{timeLabel}</span>}</span>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{p.rango} ({p.mes})</div>
                              </div>
                              {formData.fechaInicio === p.fechaIso && <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>}
                            </button>
                          );
                        })}

                        {/* Fecha Personalizada / Hoy */}
                        <div style={{ 
                          padding: '12px', borderRadius: '8px',
                          background: (!calendarAdvice?.periodos?.some((p: any) => p.fechaIso === formData.fechaInicio)) ? '#eff6ff' : 'white',
                          border: `2px solid ${(!calendarAdvice?.periodos?.some((p: any) => p.fechaIso === formData.fechaInicio)) ? '#3b82f6' : '#cbd5e1'}`
                        }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Otra fecha / Calendario manual:</div>
                          <input 
                            type="date" 
                            value={formData.fechaInicio}
                            onChange={e => { handleNext({ fechaInicio: e.target.value }); }}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #94a3b8' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cantidad y Ubicación */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Cantidad</label>
                      <input 
                        type="number" min="1" required
                        value={formData.cantidad}
                        onChange={e => handleNext({ cantidad: parseInt(e.target.value) || 1 })}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1rem' }}
                      />
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Nº de plantas o semillas.</p>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Ubicación</label>
                      <input 
                        list="ubicaciones-list"
                        type="text" 
                        placeholder="Ej: Bancal 1"
                        value={formData.ubicacion || ''}
                        onChange={e => handleNext({ ubicacion: e.target.value })}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e2e8f0', fontSize: '1rem' }}
                      />
                      <datalist id="ubicaciones-list">
                        <option value="Bancal" />
                        <option value="Maceta" />
                        <option value="Jardinera" />
                        <option value="Mesa de cultivo" />
                        <option value="Invernadero" />
                      </datalist>
                      <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>Selecciona o escribe una.</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleFinish({})}
                    style={{
                      background: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '12px',
                      fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer', marginTop: '8px'
                    }}
                  >
                    🚀 ¡Plantarlo ya!
                  </button>
                </div>
              </>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
