import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const { tema, subjectName } = await req.json();

    if (!tema || !subjectName) {
      return NextResponse.json(
        { error: "Faltan el tema o el nombre de la materia." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY no configurada." },
        { status: 500 }
      );
    }

    const prompt = `Eres un profesor universitario experto en "${subjectName}". 
Debes crear un cuestionario de evaluación sobre el tema: "${tema}".

Genera exactamente 10 preguntas de opción múltiple para evaluar el entendimiento del estudiante.

Reglas estrictas:
- Devuelve SOLO un JSON válido, sin markdown, sin backticks, sin texto adicional.
- El JSON debe tener exactamente este formato:
{
  "preguntas": [
    {
      "pregunta": "¿Texto de la pregunta?",
      "opciones": ["A. Opción A", "B. Opción B", "C. Opción C", "D. Opción D"],
      "correcta": "A"
    }
  ]
}
- Cada pregunta debe tener exactamente 4 opciones etiquetadas A, B, C, D.
- El campo "correcta" debe ser solo la letra: "A", "B", "C" o "D".
- Las preguntas deben ser variadas: conceptuales, de aplicación y de análisis.
- Nivel universitario, claro y sin ambigüedades.
- No repitas preguntas similares.
- Genera exactamente 10 preguntas, ni más ni menos.`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      return NextResponse.json(
        { error: "Error al consultar Gemini." },
        { status: 500 }
      );
    }

    const geminiData = await geminiRes.json();
    const texto = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const limpio = texto.replace(/```json|```/g, "").trim();

    let parsed: {
      preguntas: { pregunta: string; opciones: string[]; correcta: string }[];
    };

    try {
      parsed = JSON.parse(limpio);
    } catch {
      console.error("Error parseando respuesta de Gemini:", limpio);
      return NextResponse.json(
        { error: "La IA no devolvió un formato válido. Intenta de nuevo." },
        { status: 422 }
      );
    }

    if (!Array.isArray(parsed.preguntas)) {
      return NextResponse.json(
        { error: "Formato inesperado en la respuesta de la IA." },
        { status: 422 }
      );
    }

    const preguntas = parsed.preguntas
      .filter(
        (p) =>
          p.pregunta &&
          Array.isArray(p.opciones) &&
          p.opciones.length === 4 &&
          ["A", "B", "C", "D"].includes(p.correcta)
      )
      .slice(0, 10);

    if (preguntas.length < 5) {
      return NextResponse.json(
        { error: "La IA no generó suficientes preguntas válidas. Intenta de nuevo." },
        { status: 422 }
      );
    }

    return NextResponse.json({ preguntas });
  } catch (err) {
    console.error("Error en /api/apuntes-quiz:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}