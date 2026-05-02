import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

export async function POST(req: NextRequest) {
  try {
    const { archivoBase64, mimeType, subjectId, uid } = await req.json();

    if (!archivoBase64 || !mimeType) {
      return NextResponse.json(
        { error: "Falta el archivo o el tipo MIME." },
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

    const prompt = `Eres un asistente académico. Se te proporciona el programa o syllabus de un curso universitario.

Tu tarea es extraer ÚNICAMENTE la lista de temas o unidades que se estudiarán durante el curso.

Reglas estrictas:
- Devuelve SOLO un JSON válido, sin markdown, sin backticks, sin texto adicional.
- El JSON debe tener exactamente este formato: { "temas": ["Tema 1", "Tema 2", "Tema 3"] }
- Cada tema debe ser una cadena de texto corta y descriptiva (máximo 60 caracteres).
- No incluyas fechas, semanas, créditos, nombres de profesores ni información administrativa.
- Si el documento no parece ser un programa de curso, devuelve: { "temas": [] }
- Extrae entre 3 y 20 temas máximo.`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: archivoBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000,
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

    let parsed: { temas: string[] };
    try {
      parsed = JSON.parse(limpio);
    } catch {
      console.error("Error parseando respuesta de Gemini:", limpio);
      return NextResponse.json(
        { error: "La IA no devolvió un formato válido. Intenta con otro archivo." },
        { status: 422 }
      );
    }

    if (!Array.isArray(parsed.temas)) {
      return NextResponse.json(
        { error: "Formato inesperado en la respuesta de la IA." },
        { status: 422 }
      );
    }

    const temas = parsed.temas
      .map((t: string) => t.trim())
      .filter((t: string) => t.length > 0)
      .slice(0, 20);

    return NextResponse.json({ temas });
  } catch (err) {
    console.error("Error en /api/apuntes-programa:", err);
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}