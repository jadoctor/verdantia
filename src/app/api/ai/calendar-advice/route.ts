import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { plantaNombre, calendarType, calendarioSolar } = await request.json();
    
    if (!plantaNombre || !calendarType || calendarType === 'Normal') {
      return NextResponse.json({ error: 'Faltan parámetros o calendario no aplicable' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No se encontró la API key de Gemini' }, { status: 500 });
    }

    const today = new Date();
    const currentMonth = today.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const nextMonth = nextMonthDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    // Calculadora de Fases Lunares exacta para evitar alucinaciones de la IA
    const LUNAR_MONTH = 29.53058867;
    const getMoonPhase = (date: Date) => {
      const diff = date.getTime() - new Date('2000-01-06T18:14:00Z').getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      return (days % LUNAR_MONTH) / LUNAR_MONTH;
    };

    let efemerides = '';
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const phase = getMoonPhase(d);
      let phaseName = 'Luna Nueva';
      if (phase > 0.05 && phase < 0.20) phaseName = 'Fase Creciente';
      else if (phase >= 0.20 && phase <= 0.30) phaseName = 'Cuarto Creciente';
      else if (phase > 0.30 && phase < 0.45) phaseName = 'Fase Creciente hacia Llena';
      else if (phase >= 0.45 && phase <= 0.55) phaseName = 'Luna Llena';
      else if (phase > 0.55 && phase < 0.70) phaseName = 'Fase Menguante';
      else if (phase >= 0.70 && phase <= 0.80) phaseName = 'Cuarto Menguante';
      else if (phase > 0.80 && phase <= 0.95) phaseName = 'Fase Menguante hacia Nueva';
      
      efemerides += `- ${d.toLocaleDateString('es-ES')}: ${phaseName}\n`;
    }

    const prompt = `
Eres un experto en agricultura ecológica, permacultura, y calendarios agrícolas.
El usuario quiere sembrar la planta/cultivo: "${plantaNombre}".
El usuario sigue el Calendario astronómico: "${calendarType}".
La fecha actual es ${today.toLocaleDateString('es-ES')} (${currentMonth}). El mes siguiente es ${nextMonth}.

CALENDARIO SOLAR GLOBAL DE LA ESPECIE (Temporada ideal genérica):
${calendarioSolar && (calendarioSolar.semillerodesde || calendarioSolar.siembradirectadesde || calendarioSolar.trasplantedesde) ? `
- Siembra en Semillero: del mes ${calendarioSolar.semillerodesde || '?'} al ${calendarioSolar.semillerohasta || '?'}
- Siembra Directa: del mes ${calendarioSolar.siembradirectadesde || '?'} al ${calendarioSolar.siembradirectahasta || '?'}
- Trasplante: del mes ${calendarioSolar.trasplantedesde || '?'} al ${calendarioSolar.trasplantehasta || '?'}

¡CRÍTICO!: Tu recomendación DEBE tener en cuenta el Calendario Solar de arriba. No des fechas favorables para sembrar o trasplantar si actualmente estamos fuera de la temporada ideal. 
OJO: Si el mes actual está dentro del rango de Semillero, de Siembra Directa O de Trasplante, ENTONCES SÍ ES TEMPORADA.
Si NO es época en absoluto para ninguno de esos métodos, indica que actualmente no es temporada y cuándo será la próxima época ideal, explicando qué fase lunar buscar.
` : 'No hay datos restrictivos de calendario solar estacional, asume temporada abierta y aplica las reglas lunares directamente.'}

DATOS ASTRONÓMICOS REALES (NO INVENTAR):
Usa esta lista exacta de fases lunares para los próximos 365 días para dar tu respuesta:
${efemerides}

Tu objetivo es decirle al usuario cuál es el PERIODO y DÍA EXACTO ideal para sembrar esta especie, basándote en las reglas del calendario ${calendarType}.

REGLAS DE CALENDARIO LUNAR (Si el calendario es 'Lunar'):
- Céntrate ÚNICAMENTE en las fases lunares (Creciente, Menguante, Nueva, Llena).
- Plantas que dan su cosecha sobre tierra (tomate, lechuga, etc): Sembrar en Cuarto Creciente.
- Plantas que dan su cosecha bajo tierra (zanahoria, rábano): Sembrar en Cuarto Menguante.
- ¡NO menciones días de "Raíz", "Hoja", "Flor" o "Fruto"! Eso es terminología biodinámica.

REGLAS DE CALENDARIO BIODINÁMICO (Si el calendario es 'Biodinámico'):
- Aplica las fases lunares Y ADEMÁS busca los días y constelaciones específicas de Raíz (Tierra), Hoja (Agua), Flor (Aire/Luz) o Fruto (Fuego), según el órgano principal de la planta.
- Usa la terminología biodinámica libremente.

INSTRUCCIONES DE RESPUESTA:
1. Responde ÚNICAMENTE con un JSON. Nada de explicaciones previas o texto fuera del JSON.
2. El JSON debe tener exactamente esta estructura:
{
  "recomendacion": "Un texto claro (máximo 3 frases) donde le dices al usuario por qué estas fechas son buenas. Si actualmente NO es temporada, dilo aquí claramente y explica cuándo será.",
  "fueraDeTemporada": true/false, // Pon a true SOLO SI el mes actual está completamente fuera tanto del rango de Semillero como del de Siembra Directa y Trasplante. Si al menos uno de esos rangos incluye el mes actual, pon false.
  "periodos": [
    // DEBES incluir OBLIGATORIAMENTE 2 objetos aquí. Si actualmente es temporada, los 2 próximos meses ideales. Si NO es temporada, busca en las efemérides cuándo será la próxima temporada ideal y pon los 2 primeros meses de esa futura temporada.
    {
      "mes": "Nombre del mes 1",
      "rango": "Del X al Y de [Mes]",
      "diaIdeal": "XX de [Mes] (ej: '24 de Mayo')",
      "fechaIso": "YYYY-MM-DD" // Fecha en formato ISO 8601 del día ideal.
    },
    {
      "mes": "Nombre del mes 2",
      "rango": "Del X al Y de [Mes]",
      "diaIdeal": "XX de [Mes] (ej: '11 de Junio')",
      "fechaIso": "YYYY-MM-DD"
    }
  ]
}
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          temperature: 0.3,
          responseMimeType: 'application/json' 
        }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AI Calendar Error]', res.status, errText);
      return NextResponse.json({ error: 'Error del motor de IA' }, { status: res.status });
    }

    const data = await res.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return NextResponse.json({ error: 'Respuesta vacía de la IA' }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(resultText);
    } catch (parseErr) {
      console.error('Error parseando JSON de Gemini:', resultText);
      return NextResponse.json({ error: 'Formato de respuesta inválido de IA' }, { status: 500 });
    }

    return NextResponse.json({ success: true, aiData: result });
  } catch (error: any) {
    console.error('Error in AI calendar:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
