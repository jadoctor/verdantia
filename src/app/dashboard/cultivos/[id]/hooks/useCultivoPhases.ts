export function useCultivoPhases(cultivo: any, isSimulating: boolean, timeOffsetDays: number) {
  if (!cultivo || !cultivo.masterFases) return null;

  const parseTime = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(`${dateStr}T12:00:00`);
    return isNaN(d.getTime()) ? null : d.getTime();
  };
  
  const baseTRegistro = cultivo.cultivosfechacreacion ? new Date(cultivo.cultivosfechacreacion).getTime() : Date.now();
  const simulatedNow = isSimulating ? baseTRegistro + (timeOffsetDays * 86400000) : Date.now();
  const endOfToday = new Date(simulatedNow).setHours(23, 59, 59, 999);
  const DAY_MS = 86400000;

  const { masterFases, fases_duracion, fases_historial, cultivosfechainicio } = cultivo;
  const tInicio = parseTime(cultivosfechainicio);
  
  const dynamicPhases: any[] = [];
  const alertasEstancamiento: any[] = [];
  
  let currentBaseTime = tInicio;
  let canNext = !!tInicio && tInicio <= endOfToday;

  masterFases.forEach((mf: any, index: number) => {
    const id = mf.idfasescultivo;
    const duracion = fases_duracion?.[id] || 0;
    
    // Si es la primera fase, su tiempo real base es el inicio del cultivo
    let realTime = fases_historial?.[id] ? parseTime(fases_historial[id]) : null;
    if (index === 0 && !realTime && tInicio) {
      realTime = tInicio;
    }

    const isRealizada = !!realTime && realTime <= endOfToday;

    let estimatedTime = currentBaseTime;
    
    let canAct = canNext;

    if (tInicio && !realTime && canAct && estimatedTime) {
      const todayAtMidnight = new Date(simulatedNow).setHours(0,0,0,0);
      const diffDays = Math.round((estimatedTime - todayAtMidnight) / DAY_MS);
      const delayLimitDays = Math.max(3, Math.round(duracion * 0.3)); 
      if (diffDays < -delayLimitDays) {
        alertasEstancamiento.push({
          id: `estancamiento-${mf.fasescultivonombre.toLowerCase()}`,
          idpauta: null,
          fase: mf.fasescultivonombre,
          tipo: 'estancamiento',
          titulo: `Posible Estancamiento: ${mf.fasescultivonombre}`,
          descripcion: `Tu cultivo lleva ${Math.abs(diffDays)} días de retraso respecto a la fecha esperada de ${mf.fasescultivonombre}. Te sugerimos revisar las condiciones del sustrato y clima.`,
          fechaEstimada: estimatedTime,
          color: '#dc2626',
          icono: '⚠️',
          prioridad: 100
        });
      }
    }

    dynamicPhases.push({
      ...mf,
      duracion,
      realTime,
      estimatedTime,
      isRealizada,
      canAct
    });

    if (realTime) {
      currentBaseTime = realTime + (duracion * DAY_MS);
      canNext = true;
    } else if (estimatedTime) {
      currentBaseTime = estimatedTime + (duracion * DAY_MS);
      canNext = false; 
    }
  });

  const getDaysInPhase = (phaseStart: number | null, phaseEnd: number | null) => {
    if (!phaseStart) return null;
    const end = phaseEnd ? phaseEnd : simulatedNow;
    return Math.floor((end - phaseStart) / DAY_MS);
  };

  return {
    tInicio,
    dynamicPhases,
    alertasEstancamiento,
    getDaysInPhase
  };
}
