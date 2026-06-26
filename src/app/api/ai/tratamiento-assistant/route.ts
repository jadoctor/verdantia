import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { nombre, customPrompt, categories } = await request.json();

    if (!nombre) {
      return NextResponse.json({ error: 'Falta el nombre del tratamiento' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key de IA no configurada' }, { status: 500 });
    }

    const fieldsRequested = categories || {};
    const promptFields: string[] = [];

    if (fieldsRequested.tratamientostipo) {
      promptFields.push(`"tratamientostipo": "Devuelve un string separado por comas con una o más de estas opciones: 'ecológico', 'orgánico', 'químico', 'biológico', 'físico'"`);
    }
    if (fieldsRequested.tratamientosaccion) {
      promptFields.push(`"tratamientosaccion": "Devuelve un string separado por comas con una o más de estas opciones: 'preventivo', 'curativo', 'sistémico', 'erradicante'"`);
    }
    if (fieldsRequested.tratamientosdosis) {
      promptFields.push(`"tratamientosdosis": "Dosis recomendada estándar (ej. 5ml/L agua)"`);
    }
    if (fieldsRequested.tratamientosfrecuencia) {
      promptFields.push(`"tratamientosfrecuencia": "Frecuencia típica (ej. Cada 15 días)"`);
    }
    if (fieldsRequested.tratamientoscarencia) {
      promptFields.push(`"tratamientoscarencia": "Plazo de seguridad en días o indicación de sin carencia"`);
    }
    if (fieldsRequested.tratamientosmecanismo) {
      promptFields.push(`"tratamientosmecanismo": "Explicación técnica detallada de cómo actúa"`);
    }
    if (fieldsRequested.tratamientosdescripcion) {
      promptFields.push(`"tratamientosdescripcion": "Descripción resumida general"`);
    }
    if (fieldsRequested.tratamientospreparacion) {
      promptFields.push(`"tratamientospreparacion": "Cómo se prepara y uso genérico"`);
    }
    if (fieldsRequested.tratamientosprecauciones) {
      promptFields.push(`"tratamientosprecauciones": "Precauciones de toxicidad y aplicación"`);
    }

    const prompt = `
      Eres un ingeniero agrónomo experto en tratamientos fitosanitarios ecológicos y químicos.
      Analiza el siguiente tratamiento agrícola: "${nombre}".
      
      Debes devolver un JSON estructurado con la siguiente información:
      {
        ${promptFields.join(',\n        ')}
      }

      Requisitos estrictos agronómicos:
      - Devuelve ÚNICAMENTE código JSON válido.
      - Sé preciso y profesional.
      - Si no tienes la información exacta, devuelve null en ese campo, pero no inventes.
      - IMPORTANTE: Reserva el término "biológico" ESTRICTAMENTE para organismos vivos (ej. depredadores, bacterias, hongos entomopatógenos como Bacillus thuringiensis). Los extractos botánicos (como el Aceite de Neem, Piretrinas, etc.) NO son biológicos, deben catalogarse como "ecológico" y/o "orgánico".
      
      Instrucciones adicionales del usuario: ${customPrompt || 'Ninguna'}
    `;

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

    return NextResponse.json({ success: true, data: parsed });

  } catch (error: any) {
    console.error('Error fetching AI data:', error);
    return NextResponse.json({ error: error.message || 'Error al comunicarse con la IA' }, { status: 500 });
  }
}
