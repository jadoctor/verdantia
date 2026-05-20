export const processAlertas = (cultivos: any[], overrideNow?: number) => {
  const now = overrideNow || Date.now();
  const DAY_MS = 86400000;
  const finalAlerts: any[] = [];

  const parseTime = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr.split('T')[0] + 'T12:00:00');
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  for (const c of cultivos) {
    if (!c.pautas || c.pautas.length === 0) continue;

    const tRegistro = c.cultivosfechacreacion ? new Date(c.cultivosfechacreacion).getTime() : now;
    const tSiembra = parseTime(c.cultivosfechainicio);
    
    const dGerm = c.dias_germinacion || 0;
    const dTras = Math.max(0, (c.dias_trasplante || 0) - dGerm);
    const dCrec = c.dias_crecimiento || 0;
    const dCrecFromGerm = Math.max(0, dCrec - dGerm);
    const dFruc = Math.max(0, (c.dias_fructificacion || 0) - dCrec);
    const dReco = Math.max(0, (c.dias_recoleccion || 0) - (c.dias_fructificacion || 0));

    const isSemillero = c.cultivosmetodo === 'semillero';
    const baseGerminacion = tSiembra ? tSiembra + dGerm * DAY_MS : null;
    const estGerminacion = parseTime(c.cultivosfechagerminacion) || baseGerminacion;

    const baseTrasplante = estGerminacion ? estGerminacion + dTras * DAY_MS : null;
    
    let baseCrecimiento = null;
    if (isSemillero) baseCrecimiento = (parseTime(c.cultivosfechatrasplante) || baseTrasplante) ? (parseTime(c.cultivosfechatrasplante) || baseTrasplante)! + (c.dias_crecimiento ? (c.dias_crecimiento - (c.dias_trasplante || 0)) * DAY_MS : 0) : null;
    else baseCrecimiento = estGerminacion ? estGerminacion + dCrecFromGerm * DAY_MS : null;

    const estCrecimiento = parseTime(c.cultivosfechacrecimiento) || baseCrecimiento;
    const baseFructificacion = estCrecimiento ? estCrecimiento + dFruc * DAY_MS : null;
    const estFructificacion = parseTime(c.cultivosfechafructificacion) || baseFructificacion;
    const estRecoleccion = parseTime(c.cultivosfecharecoleccion) || (estFructificacion ? estFructificacion + dReco * DAY_MS : null);
    const estFinalizacion = parseTime(c.cultivosfechafinalizacion);

    const items = [
      { id: 'registro', ts: tRegistro },
      { id: 'siembra', ts: tSiembra },
      { id: 'germinacion', ts: estGerminacion },
      { id: 'trasplante', ts: isSemillero ? baseTrasplante : null },
      { id: 'crecimiento', ts: estCrecimiento },
      { id: 'fructificacion', ts: estFructificacion },
      { id: 'recoleccion', ts: estRecoleccion },
      { id: 'finalizacion', ts: estFinalizacion }
    ].filter(i => i.ts !== null);

    let currentPhaseId = 'registro';
    for (const item of items) {
      if (now >= item.ts!) {
        currentPhaseId = item.id;
      } else {
        break;
      }
    }
    
    if (currentPhaseId === 'finalizacion') continue;

    const phaseMap: Record<string, string[]> = {
      'registro': ['general', 'presiembra'],
      'siembra': ['siembra', 'pregerminacion'],
      'germinacion': ['germinacion'],
      'trasplante': ['trasplante'],
      'crecimiento': ['crecimiento', 'crecimiento_inicial'],
      'fructificacion': ['fructificacion'],
      'recoleccion': ['recoleccion']
    };

    const validDbPhases = phaseMap[currentPhaseId] || [];

    const ignored = (() => { try { return JSON.parse(c.cultivosalertas_ignoradas || '[]'); } catch { return []; } })();
    const forced = (() => { try { return JSON.parse(c.cultivosalertas_forzadas || '[]'); } catch { return []; } })();

    for (const p of c.pautas) {
      // Filtrado Arquitectónico por Contexto (Origen de la planta)
      const cMetodo = c.cultivosmetodo; // 'siembra_directa', 'semillero', 'planton'
      const isCultivoSemilla = cMetodo === 'siembra_directa' || cMetodo === 'semillero';
      const isCultivoPlanton = cMetodo === 'planton';
      
      const pMetodo = p.laborespautametodo || 'ambos'; // 'ambos', 'semilla', 'planton'
      
      if (pMetodo === 'semilla' && !isCultivoSemilla) continue;
      if (pMetodo === 'planton' && !isCultivoPlanton) continue;

      // Determinar el timestamp base de la fase de la labor
      let baseTs = tRegistro;
      switch (p.laborespautafase) {
        case 'siembra':
        case 'pregerminacion':
        case 'presiembra':
          baseTs = tSiembra || tRegistro;
          break;
        case 'germinacion':
          baseTs = estGerminacion || tRegistro;
          break;
        case 'trasplante':
          baseTs = (isSemillero ? baseTrasplante : estGerminacion) || tRegistro;
          break;
        case 'crecimiento':
        case 'crecimiento_inicial':
          baseTs = estCrecimiento || tRegistro;
          break;
        case 'fructificacion':
          baseTs = estFructificacion || tRegistro;
          break;
        case 'recoleccion':
          baseTs = estRecoleccion || tRegistro;
          break;
        case 'general':
        default:
          baseTs = tRegistro;
          break;
      }

      // Aplicar el offset (en días)
      let pautaTs = baseTs + (p.laborespautaoffset || 0) * DAY_MS;
      
      // Regla de "Caducidad" (Sustituye a la antigua regla de "tope"):
      // Si la fecha teórica en la que debería haberse ejecutado esta labor (pautaTs) 
      // es anterior al momento en que el usuario registró el cultivo (tRegistro),
      // significa que el usuario ha llegado tarde (no cumplió el pre-aviso necesario 
      // o registró una planta ya crecida). Por tanto, la descartamos para no generar "spam".
      if (pautaTs < tRegistro) {
        continue;
      }

      // La labor es visible si ya pasamos su fecha objetivo calculada
      // Y además pertenece a una fase <= a la actual (o si el offset la adelantó)
      // Para evitar que labores de recolección salgan meses después de terminadas, 
      // mantenemos cierta adherencia a validDbPhases, a menos que el offset la haga "temprana".
      const isTimeTriggered = now >= pautaTs;
      
      // Una labor es válida si es su tiempo (isTimeTriggered) Y (es de la fase actual o es pasada y no completada).
      // Verdantia originalmente solo mostraba validDbPhases. 
      // Para respetar eso pero permitir offsets anticipados:
      const phaseOrder = ['registro', 'siembra', 'germinacion', 'trasplante', 'crecimiento', 'fructificacion', 'recoleccion', 'finalizacion'];
      
      const getPhaseIndexForPauta = (fase: string) => {
        if (fase === 'general' || fase === 'presiembra') return 0; // registro
        if (fase === 'siembra' || fase === 'pregerminacion') return 1;
        if (fase === 'germinacion') return 2;
        if (fase === 'trasplante') return 3;
        if (fase === 'crecimiento' || fase === 'crecimiento_inicial') return 4;
        if (fase === 'fructificacion') return 5;
        if (fase === 'recoleccion') return 6;
        return 7;
      };

      const pautaPhaseIndex = getPhaseIndexForPauta(p.laborespautafase);
      const currentPhaseIndex = phaseOrder.indexOf(currentPhaseId);

      // Aparece si: 
      // 1. Ya llegó su fecha calculada (con offset)
      // 2. Y su fase teórica es menor o igual a la fase en la que estamos (o estamos en una fase anterior pero el offset ya la activó).
      if (isTimeTriggered && pautaPhaseIndex <= currentPhaseIndex + (p.laborespautaoffset < 0 ? 10 : 0)) {
        
        // Si el offset no es negativo, respetamos que solo aparezca en su fase (comportamiento original de Verdantia)
        // Para no arrastrar labores no completadas por siempre si el usuario no quiere.
        if ((p.laborespautaoffset || 0) >= 0 && !validDbPhases.includes(p.laborespautafase)) {
          // Si estamos en fructificacion y la labor era de siembra, y no tiene offset anticipado agresivo, 
          // quizás no deberíamos mostrarla a menos que el usuario lo fuerce? 
          // Verdantia original omitía tareas de fases pasadas. Mantendremos eso.
          // continue; 
        }

        const isGloballyInactive = p.laborespautaactivosino === 0;
        const isIgnored = ignored.includes(p.idlaborespauta);
        const isForced = forced.includes(p.idlaborespauta);
        const isCurrentlyActive = isGloballyInactive ? isForced : !isIgnored;

        let isCompleted = false;
        if (c.avisosCompletados) {
          isCompleted = c.avisosCompletados.some((ac: any) => ac.idpauta === p.idlaborespauta);
        }

        if (isCurrentlyActive && !isCompleted && (validDbPhases.includes(p.laborespautafase) || (isTimeTriggered && (p.laborespautaoffset || 0) < 0 && pautaPhaseIndex > currentPhaseIndex))) {
          finalAlerts.push({
            cultivo: c,
            pauta: p,
            faseActual: currentPhaseId,
            fechaEmision: new Date(pautaTs).toISOString()
          });
        }
      }
    }
  }

  // Sort final alerts logically
  const logicalOrder: Record<string, number> = {
    'Laboreo': 1,
    'Abonado': 2,
    'Siembra': 3,
    'Transplante': 3,
    'Trasplante': 3,
    'Acolchado': 4,
    'Riego': 5
  };

  finalAlerts.sort((a, b) => {
    // 1. By emision date
    const tA = new Date(a.fechaEmision).getTime();
    const tB = new Date(b.fechaEmision).getTime();
    if (tA !== tB) return tA - tB;

    // 2. By logical order
    const orderA = logicalOrder[a.pauta.laboresnombre] || 10;
    const orderB = logicalOrder[b.pauta.laboresnombre] || 10;
    if (orderA !== orderB) return orderA - orderB;

    // 3. Alphabetical fallback
    return a.pauta.laboresnombre.localeCompare(b.pauta.laboresnombre);
  });

  return finalAlerts;
};
