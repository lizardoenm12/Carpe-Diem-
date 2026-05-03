// /api/apuntes-flashcards/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { tema, subjectName } = await req.json();

    if (!tema || !subjectName) {
      return NextResponse.json(
        { error: "Faltan datos: tema y subjectName son requeridos." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
Eres un tutor experto creando flashcards de estudio para un estudiante universitario.

Materia: "${subjectName}"
Tema: "${tema}"

Genera exactamente 8 flashcards de estudio sobre este tema.
Cada flashcard debe tener:
- Una pregunta clara y concisa (máximo 2 líneas)
- Una respuesta completa pero resumida (máximo 3 líneas)
- Un nivel de dificultad: "facil", "medio" o "dificil"

IMPORTANTE: Responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin backticks, sin explicaciones.

Formato exacto:
{
  "flashcards": [
    {
      "pregunta": "¿Texto de la pregunta?",
      "respuesta": "Texto de la respuesta.",
      "dificultad": "facil"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Limpiar posibles backticks que Gemini a veces agrega
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);

    if (!parsed.flashcards || !Array.isArray(parsed.flashcards)) {
      return NextResponse.json(
        { error: "La IA no devolvió el formato esperado." },
        { status: 500 }
      );
    }

    return NextResponse.json({ flashcards: parsed.flashcards });
  } catch (error) {
    console.error("Error generando flashcards:", error);
    return NextResponse.json(
      { error: "Error al generar las flashcards. Intenta de nuevo." },
      { status: 500 }
    );
  }
}