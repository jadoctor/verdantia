import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import pool from '@/lib/db';

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

export async function POST(request: Request) {
// const user = await authenticateSuperadmin(request);
  // if (!user) {
  //   return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  // }

  try {
    const { nombre, customPrompt, selectedTabs } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: 'Falta el nombre de la especie' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    const [fasesRows]: any = await pool.query("SELECT idfasescultivo, fasescultivonombre FROM fasescultivo WHERE fasescultivotipo = 'Fase' ORDER BY fasescultivoorden ASC");
    const fasesStr = fasesRows.map((f: any) => `- ID ${f.idfasescultivo}: ${f.fasescultivonombre}`).join('\n');

    const [familiasRows]: any = await pool.query("SELECT idfamilias, familiasnombre FROM familias");
    const familiasStr = familiasRows.map((f: any) => `- ID ${f.idfamilias}: ${f.familiasnombre}`).join('\n');

    const [consumidoresRows]: any = await pool.query('SELECT idconsumidores, consumidoresnombre FROM consumidores WHERE consumidoresactivo = 1');
    const consumidoresList = consumidoresRows.map((c: any) => `${c.idconsumidores}:${c.consumidoresnombre}`).join(', ');

    const tabs = selectedTabs || ['taxonomia', 'cultivo', 'fases', 'biodinamica', 'asociaciones', 'textos', 'consumos', 'pautas'];

    const promptFields: string[] = [];

    if (tabs.includes('consumos')) {
      promptFields.push(`- usos_consumo (array de objetos. Para CADA uno de los consumidores listados, debes evaluar de forma individual e independiente cada parte relevante de la planta. Si hay partes que son aptas y partes que son tóxicas o que requieren moderación, debes generar un objeto separado para cada una de las partes de la planta evaluadas para ese consumidor. Formato de cada objeto: {"idconsumidor": <ID>, "nombre": "<Nombre>", "parte": "<parte_de_la_planta>", "apto": "<apto / con_moderacion / no_apto>", "notas": "<Explicación breve>"}.
  * El campo "parte" debe ser estrictamente uno de los siguientes strings: "Hojas", "Frutos", "Raíz", "Tallo", "Flores", "Semillas", "Toda la planta".
  * El campo "apto" debe ser estrictamente uno de los siguientes strings: "apto", "con_moderacion", "no_apto".)`);
    }

    if (tabs.includes('taxonomia')) {
      promptFields.push(`- especiesnombrecientifico (string, ej: Solanum lycopersicum)
- xespeciesidfamilias (entero o null, elige obligatoriamente el ID de una de estas familias si pertenece a ella, si no encaja con ninguna pon null. Lista de familias disponibles:\\n\${familiasStr})
- especiestipo (array de strings, elige entre: hortaliza, fruta, aromatica, leguminosa, cereal, adventicia)
- especiesciclo (array de strings, elige entre: anual, bianual, perenne)
- especiescolor (string, color fenotípico base, ej: Rojo)
- especiestamano (string, elige entre: pequeno, mediano, grande)
- especiesicono (string con un único emoji representativo de la especie, ej: 🍅 o 🥕 o 🥦 o 🍓)
- especiesporteplanta (string, elige entre: rastrero, arbusto, mata, trepador, erecto — Describe la forma de crecimiento natural de la planta)`);
    }

    if (tabs.includes('fases')) {
      promptFields.push(`- fases_duracion (objeto cuyas claves son los IDs de las siguientes fases, y sus valores son la duración en DÍAS. Solo incluye las fases que apliquen al ciclo normal de la planta, omitiendo las que no apliquen poniendo 0 o no incluyéndolas. OBLIGATORIO. Estas son las fases disponibles:\\n\${fasesStr}\\nEjemplo: {"1": 8, "2": 30, "3": 45})
- especiesfechasemillerodesde (entero del mes, 1 a 12, null si no aplica)
- especiesfechasemillerohasta (entero del mes, 1 a 12, null si no aplica)
- especiesfechasiembradirectadesde (entero del mes, 1 a 12, null si no aplica)
- especiesfechasiembradirectahasta (entero del mes, 1 a 12, null si no aplica)
- especiestrasplantedesde (entero del mes, 1 a 12, null si no aplica)
- especiestrasplantehasta (entero del mes, 1 a 12, null si no aplica)
- especiesfecharecolecciondesde (entero del mes, 1 a 12)
- especiesfecharecoleccionhasta (entero del mes, 1 a 12)`);
    }

    if (tabs.includes('cultivo')) {
      promptFields.push(`- especiestemperaturaminima (numero decimal, ej: 10.5)
- especiestemperaturaoptima (numero decimal, ej: 25.0)
- especiestemperaturamaxima (numero decimal, ej: 35.0)
- especiesmarcoplantas (entero en cm, ej: 40)
- especiesmarcofilas (entero en cm, ej: 80)
- especiesmarcomargen (entero en cm, margen desde el borde del bancal. Aconseja aproximadamente la mitad del marco entre plantas, ej: 20)
- especiesprofundidadsiembra (numero decimal en cm, ej: 1.0)
- especiesprofundidadtrasplante (numero decimal en cm, ej: 5.0)
- especiesphminimosuelo (numero decimal con 1 decimal, el valor MÍNIMO del rango de pH ideal, ej: 6.0)
- especiesphmaximosuelo (numero decimal con 1 decimal, el valor MÁXIMO del rango de pH ideal, ej: 6.8)
- especiesnecesidadriego (string, elige entre: baja, media, alta)
- especiestiposiembra (array de strings, OBLIGATORIO. DEBES SER EXHAUSTIVO e incluir TODAS las formas viables de propagar la planta. Valores permitidos: "directa", "semillero", "planton", "esqueje", "bulbo", "division". Para plantas como el tomate o pimiento DEBES marcar "directa", "semillero", "planton" y también "esqueje" (por los chupones). Si es de semilla incluye casi siempre "directa" y "semillero". Si se vende en viveros incluye "planton". Devuelve un array con TODAS las que apliquen)
- especiestiposiembrapreferente (array de strings, OBLIGATORIO. De las opciones devueltas en el array anterior, indica cuáles son las formas más habituales, recomendadas o exitosas. Ej: ["semillero", "planton"])
- especiesvolumenmaceta (numero entero en litros, ej: 10)
- especiesemillerovolumendesde (numero entero en cc, volumen mínimo del alveolo de germinación INICIAL. Evalúa la anatomía de la semilla. Ej: la mayoría de hortalizas germinan mejor en espacios muy reducidos de 10cc a 30cc para evitar asfixia radicular)
- especiesemillerovolumenhasta (numero entero en cc, volumen máximo del alveolo de germinación INICIAL. ATENCIÓN: No confundas con la maceta de repicado. Ej: un tomate NUNCA debe germinarse en 200cc porque se asfixia; su alveolo máximo inicial debe rondar los 50cc-75cc. Limita el volumen estrictamente a la fase de cotiledones o primeras hojas verdaderas)
- especiesluzsolar (string, elige entre: pleno_sol, semisombra, sombra)
- especiescaracteristicassuelo (string, ej: franco-arcilloso, bien drenado)
- especiesdificultad (string, elige entre: baja, media, alta)
- especiesresistenciahelada (string, elige entre: nula, baja, media, alta — Indica la tolerancia de la especie a las heladas. 'nula' = muere con la primera helada, 'alta' = soporta heladas severas)
- especiesnecesidadtutoraje (string, elige entre: no, opcional, obligatorio — ¿Necesita la planta una estructura de soporte/tutor?)
- especiesgerminaroscuridad (boolean, true si la semilla necesita OSCURIDAD para germinar -fotoblástica negativa, se entierra-, false si necesita LUZ -fotoblástica positiva, se deja en superficie-. Si no hay requisito especial, devolver null)`);
    }

    if (tabs.includes('textos')) {
      promptFields.push(`- especiesviabilidadsemilla (entero aproximado en años, ej: 4)
- especiespeso1000semillas (numero, usa punto decimal solo si es necesario, sin ceros extra, ej: 1.5 o 5)
- especieshistoria (string, una breve historia de 2 párrafos sobre su origen)
- especiesdescripcion (string, consejos breves de cultivo)
- especiesfuentesinformacion (string, IMPORTANTE: Proporciona SOLO 2 URLs absolutas, reales y comprobables. 1) La página de Wikipedia de la especie usando el nombre científico (ej: https://es.wikipedia.org/wiki/Solanum_lycopersicum). 2) La URL oficial de Wikipedia sobre Agricultura Biodinámica para justificar el calendario lunar: https://es.wikipedia.org/wiki/Agricultura_biodin%C3%A1mica )
- especiesautosuficiencia (entero, plantas estimadas por persona al año para consumo COMPLETO en fresco, es decir, cubrir el 100% de la demanda anual)
- especiesautosuficienciaparcial (entero, plantas estimadas por persona para un consumo PARCIAL/básico, aproximadamente un 30-40% de la demanda, solo para complementar la compra)
- especiesautosuficienciaconserva (entero, plantas estimadas por persona al año con conserva, incluye fresco + producción extra para conservar)
- especiesrendimientoestimado (string, estimación de rendimiento por planta o por m², ej: "3-5 kg/planta" o "2 kg/m²")
- especiespartecosechable (array de strings, OBLIGATORIO. Indica TODAS las partes comestibles/cosechables. Valores permitidos: "fruto", "hoja", "raiz", "bulbo", "tallo", "flor", "semilla". Ej: el tomate=["fruto"], la borraja=["hoja","flor"], la cebolla=["bulbo","hoja"])`);
    }

    if (tabs.includes('biodinamica')) {
      promptFields.push(`- especiesbiodinamicacategoria (string, elige UNO entre: fruto, raiz, hoja, flor — según la parte comestible/ornamental principal. NOTA: este valor se almacenará como 'especiesorganocomestible' en la BD, pero devuélvelo con la clave 'especiesorganocomestible')
- especiesbiodinamicafasesiembra (string, elige entre: Ascendente, Descendente — en biodinámica la siembra suele ser Ascendente)
- especiesbiodinamicafasetrasplante (string, elige entre: Ascendente, Descendente — el trasplante suele ser Descendente)
- especiesbiodinamicanotas (string, 1-2 frases sobre la relación entre la categoría de la planta y los perigeos/nodos)
- especieslunarfasesiembra (string, elige entre: Creciente, Menguante, Nueva, Llena — según el calendario lunar tradicional)
- especieslunarfasetrasplante (string, elige entre: Creciente, Menguante, Nueva, Llena)
- especieslunarobservaciones (string, 1-2 frases concisas sobre por qué se elige esa fase lunar tradicional, y qué evitar)`);
    }

    if (tabs.includes('asociaciones')) {
      promptFields.push(`- asociaciones_beneficiosas (array de objetos {nombre: string, motivo: string}, solo nombres comunes exactos y específicos, NUNCA uses términos genéricos como "hierbas aromáticas", DEBES decir especies concretas. El motivo debe explicar brevemente POR QUÉ es beneficiosa, ej: [{"nombre": "Albahaca", "motivo": "Repele pulgones y mejora el sabor"}, {"nombre": "Cebolla", "motivo": "Ahuyenta plagas por su olor"}])
- asociaciones_perjudiciales (array de objetos {nombre: string, motivo: string}, solo nombres comunes exactos, NUNCA genéricos. El motivo debe explicar POR QUÉ es perjudicial, ej: [{"nombre": "Patata", "motivo": "Compiten por nutrientes y comparten enfermedades"}, {"nombre": "Hinojo", "motivo": "Inhibe el crecimiento por alelopatía"}])
- plagas_asociadas (array de objetos {nombre: string, riesgo: string, notas: string}, solo nombres comunes específicos. El riesgo debe ser "baja", "media" o "alta". Las notas deben describir brevemente el daño o síntoma, ej: [{"nombre": "Pulgón", "riesgo": "alta", "notas": "Coloniza brotes tiernos y transmite virus"}, {"nombre": "Oídio", "riesgo": "media", "notas": "Hongo blanco en hojas, reduce fotosíntesis"}])`);
    }

    if (tabs.includes('pautas')) {
      promptFields.push(`- especiespreparacionconvencional (entero aproximado en días de antelación necesarios para preparar el terreno en laboreo convencional, ej: 15)
- especiespreparacionminima (entero aproximado en días de antelación necesarios para preparar el terreno en laboreo mínimo, ej: 10)
- especiespreparacionnolaboreo (entero aproximado en días de antelación necesarios para preparar el terreno en no laboreo, ej: 5)`);
    }

    let prompt = "Eres un experto botánico y agrónomo. Necesito que me devuelvas EXCLUSIVAMENTE un objeto JSON válido con los datos de cultivo de la especie \"" + nombre + "\".\n";
    prompt += "No incluyas markdown, ni comillas invertidas, solo el JSON puro.\n";
    
    if (customPrompt) {
      prompt += "\nINSTRUCCIONES ADICIONALES DEL USUARIO:\n" + customPrompt + "\nMUY IMPORTANTE: Aunque estas instrucciones te pidan ignorar u omitir ciertos datos (como requerimientos agronómicos o cultivo), DEBES mantener intacta la estructura JSON. Para los campos que debes ignorar o que no aplican, simplemente asígnales el valor null, pero NO elimines las claves del JSON ni rompas la sintaxis.\n";
    }

    if (tabs.includes('consumos')) {
      prompt += "\nAdemás, debes evaluar la comestibilidad y toxicidad de esta planta para los siguientes consumidores activos en nuestra granja:\n[" + consumidoresList + "]\n";
    }

    prompt += "\nLas claves esperadas en el JSON son:\n" + promptFields.join('\n') + "\n\nRecuerda: SOLO JSON válido, nada de formato adicional.";

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error('Error de Gemini API: ' + errorText);
    }

    const data = await res.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    try {
      require('fs').appendFileSync('AI_DEBUG.txt', '\n\n=== AI RESPONSE ===\n' + textResponse + '\n\n');
    } catch(e) {}

    if (!textResponse) {
      throw new Error('Respuesta vacía de IA');
    }

    // Clean markdown code blocks if any
    const match = textResponse.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('No se pudo extraer JSON de la respuesta: ' + textResponse);
    }
    const cleanJson = match[0];
    const parsed = JSON.parse(cleanJson);

    // Normalize fases_duracion keys to be database phase IDs
    if (parsed.fases_duracion && typeof parsed.fases_duracion === 'object') {
      const normalized: Record<string, any> = {};
      const [allFases]: any = await pool.query("SELECT idfasescultivo, fasescultivoclave, fasescultivonombre FROM fasescultivo");
      
      Object.entries(parsed.fases_duracion).forEach(([key, val]) => {
        // 1. Direct ID match
        const matchedById = allFases.find((f: any) => f.idfasescultivo.toString() === key);
        if (matchedById) {
          normalized[matchedById.idfasescultivo.toString()] = val;
          return;
        }
        
        // 2. Clave match (slug/key name)
        const matchedByClave = allFases.find((f: any) => f.fasescultivoclave.toLowerCase().trim() === key.toLowerCase().trim());
        if (matchedByClave) {
          normalized[matchedByClave.idfasescultivo.toString()] = val;
          return;
        }

        // 3. Name match
        const matchedByName = allFases.find((f: any) => f.fasescultivonombre.toLowerCase().trim() === key.toLowerCase().trim());
        if (matchedByName) {
          normalized[matchedByName.idfasescultivo.toString()] = val;
          return;
        }

        // 4. Custom mappings for common variations
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey.includes('pregerminacion') || lowerKey === 'germinacion' || lowerKey.includes('germina')) {
          const f = allFases.find((x: any) => x.fasescultivoclave === 'pregerminacion');
          if (f) {
            normalized[f.idfasescultivo.toString()] = val;
            return;
          }
        }
        if (lowerKey.includes('postgerminacion') || lowerKey.includes('postgermina')) {
          const f = allFases.find((x: any) => x.fasescultivoclave === 'postgerminacion');
          if (f) {
            normalized[f.idfasescultivo.toString()] = val;
            return;
          }
        }
        if (lowerKey.includes('semillero')) {
          const f = allFases.find((x: any) => x.fasescultivoclave === 'semillero');
          if (f) {
            normalized[f.idfasescultivo.toString()] = val;
            return;
          }
        }
        if (lowerKey.includes('crecimiento')) {
          const f = allFases.find((x: any) => x.fasescultivoclave === 'crecimiento');
          if (f) {
            normalized[f.idfasescultivo.toString()] = val;
            return;
          }
        }
        if (lowerKey.includes('cosecha')) {
          const f = allFases.find((x: any) => x.fasescultivoclave === 'cosecha');
          if (f) {
            normalized[f.idfasescultivo.toString()] = val;
            return;
          }
        }
        if (lowerKey.includes('enraizamiento') || lowerKey.includes('posplantacion')) {
          const f = allFases.find((x: any) => x.fasescultivoclave === 'enraizamiento');
          if (f) {
            normalized[f.idfasescultivo.toString()] = val;
            return;
          }
        }
        if (lowerKey.includes('floracion')) {
          const f = allFases.find((x: any) => x.fasescultivoclave === 'floracion');
          if (f) {
            normalized[f.idfasescultivo.toString()] = val;
            return;
          }
        }
      });
      parsed.fases_duracion = normalized;
    }

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error in AI Assistant:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
