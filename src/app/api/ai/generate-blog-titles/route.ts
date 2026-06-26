import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getUserByEmail } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { pdfUrl, instructions, especieNombre, contexto, existingTitles } = await request.json();

    const tipoEntidad = contexto?.tipo || 'especie';
    const nombreEntidad = contexto?.nombre || especieNombre || 'agricultura';
    
    const contextoTexto = tipoEntidad === 'labor' 
      ? `la labor agrícola "${nombreEntidad}"` 
      : tipoEntidad === 'variedad' 
        ? `la variedad "${nombreEntidad}"` 
        : `la especie "${nombreEntidad}"`;

    if (!pdfUrl) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY no configurada' }, { status: 500 });
    }

    // 1. Fetch PDF and convert to Base64
    let base64Pdf = '';
    try {
      const pdfRes = await fetch(pdfUrl);
      if (!pdfRes.ok) throw new Error('No se pudo descargar el PDF');
      const arrayBuffer = await pdfRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const isPdf = buffer.toString('utf-8', 0, 5) === '%PDF-';
      if (!isPdf) {
        console.error('El archivo descargado no es un PDF válido. URL:', pdfUrl);
        throw new Error('El archivo descargado no es un PDF válido');
      }
      base64Pdf = buffer.toString('base64');
    } catch (e: any) {
      console.error("Error descargando PDF:", e);
      return NextResponse.json({ error: 'Error al descargar el PDF de origen: ' + e.message }, { status: 500 });
    }

    const prompt = `Actúa como un experto redactor de blogs agronómicos y de jardinería moderna, especializado en SEO y copywriting.
Vas a analizar el documento PDF adjunto sobre ${contextoTexto}.

INSTRUCCIONES ADICIONALES DEL USUARIO:
Si el usuario indica instrucciones específicas, dales PRIORIDAD MÁXIMA para definir el tono o enfoque de los títulos: "${instructions || 'Ninguna instrucción adicional'}".

${existingTitles && existingTitles.length > 0 ? `REGLA DE ORO (PROHIBICIÓN ESTRICTA): A continuación te paso una lista de los títulos que YA HAN SIDO GENERADOS anteriormente para este contexto. Está TERMINANTEMENTE PROHIBIDO proponer títulos que sean idénticos, muy similares o que repitan la misma estructura que estos:
[Títulos Existentes: ${existingTitles.join(' | ')}]
Debes ser creativo y buscar ángulos, enfoques y palabras completamente nuevas que no se hayan usado en los títulos existentes.` : ''}

TU OBJETIVO:
Propón exactamente 4 títulos SEO atractivos para un futuro artículo de blog basado en este documento.
Reglas para los títulos:
- Deben ser concisos, atractivos y tener "gancho" para clics (Clickbait ético agronómico).
- Al menos 2 de ellos DEBEN ser interrogativos y dejar una duda final (ej: "¿Por qué fracasa la siembra del tomate? El secreto está en...").
- Los otros pueden ser listas, guías definitivas o descubrimientos.
- No excedas los 80 caracteres por título.

Devuelve EXCLUSIVAMENTE un JSON válido con la siguiente estructura, sin texto markdown ni explicaciones adicionales: 4 títulos. Ejemplo:
[
  "¿Cuándo podar el tomate? El error que arruina tu cosecha",
  "Guía definitiva para cultivar calabacín en huertos urbanos",
  "¿Por qué se pudren los pimientos? Descubre el motivo oculto",
  "5 secretos de riego que multiplicarán tu producción"
]`;

    const payload = {
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'application/pdf', data: base64Pdf } }
        ]
      }],
      generationConfig: { 
        temperature: 0.7,
        responseMimeType: "application/json"
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini error:', errorText);
      return NextResponse.json({ error: 'Error al generar títulos con IA' }, { status: 500 });
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON
    let parsedData: string[] = [];
    try {
      let jsonString = textOutput.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsedData = JSON.parse(jsonString);
    } catch(e) {
      console.error('Error parseando JSON de títulos Gemini:', e);
      return NextResponse.json({ error: 'La IA no devolvió un formato válido' }, { status: 500 });
    }

    // Log the AI usage
    const email = request.headers.get('x-user-email');
    if (email) {
      try {
        const user = await getUserByEmail(email);
        if (user) {
          await pool.query(`
            INSERT INTO historialia (xhistorialiaidusuarios, historialiamodulo, historialiaprompt, historialiarespuesta, historialiaexito)
            VALUES (?, 'generador-titulos-blog', ?, ?, 1)
          `, [user.id, prompt, JSON.stringify(parsedData)]);
        }
      } catch (logErr) {
        console.error('Error logging AI interaction:', logErr);
      }
    }

    return NextResponse.json({ success: true, titles: parsedData });
  } catch (error: any) {
    console.error('Error en generate-blog-titles:', error);
    return NextResponse.json({ error: 'Error interno del servidor: ' + (error.message || String(error)) }, { status: 500 });
  }
}
