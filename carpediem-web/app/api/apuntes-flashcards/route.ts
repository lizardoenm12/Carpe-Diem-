import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const { tema, subjectName } = await req.json();

    if (!tema || !subjectName) {
      return NextResponse.json(
        { error: "Faltan datos: tema y subjectName son requeridos." },
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

    const prompt = `Eres un tutor experto creando flashcards de estudio para un estudiante universitario.

Materia: "${subjectName}"
Tema: "${tema}"

Genera exactamente 8 flashcards de estudio sobre este tema.
Cada flashcard debe tener:
- Una pregunta clara y concisa (máximo 2 líneas)
- Una respuesta completa pero resumida (máximo 3 líneas)
- Un nivel de dificultad: "facil", "medio" o "dificil"

Reglas estrictas:
- Devuelve SOLO un JSON válido, sin markdown, sin backticks, sin texto adicional.
- Formato exacto:
{
  "flashcards": [
    {
      "pregunta": "¿Texto de la pregunta?",
      "respuesta": "Texto de la respuesta.",
      "dificultad": "facil"
    }
  ]
}`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
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

    let parsed: { flashcards: { pregunta: string; respuesta: string; dificultad: string }[] };

    try {
      parsed = JSON.parse(limpio);
    } catch {
      console.error("Error parseando respuesta de Gemini:", limpio);
      return NextResponse.json(
        { error: "La IA no devolvió un formato válido. Intenta de nuevo." },
        { status: 422 }
      );
    }

    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      return NextResponse.json(
        { error: "Formato inesperado en la respuesta de la IA." },
        { status: 422 }
      );
    }

    const flashcards = parsed.flashcards
      .filter((f) => f.pregunta && f.respuesta && f.dificultad)
      .slice(0, 8);

    return NextResponse.json({ flashcards });
  } catch (err) {
    console.error("Error en /api/apuntes-flashcards:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}