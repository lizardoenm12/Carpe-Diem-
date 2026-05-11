import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

// Extrae texto legible de un PDF sin dependencias externas.
// Busca cadenas de texto entre paréntesis (formato PDF interno) y
// secuencias de caracteres ASCII imprimibles.
function extraerTextoPDFNativo(buffer: Buffer): string {
  const contenido = buffer.toString("latin1");

  const textos: string[] = [];

  // Método 1: texto entre paréntesis — formato estándar PDF (Tj, TJ operators)
  const regexParentesis = /\(([^)]{2,200})\)/g;
  let match;
  while ((match = regexParentesis.exec(contenido)) !== null) {
    const texto = match[1]
      .replace(/\\n/g, " ")
      .replace(/\\r/g, " ")
      .replace(/\\t/g, " ")
      .replace(/\\\\/g, "\\")
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ")
      .trim();
    if (texto.length > 2) textos.push(texto);
  }

  // Método 2: bloques BT...ET (Text Objects en PDF)
  const regexBT = /BT([\s\S]{1,500}?)ET/g;
  while ((match = regexBT.exec(contenido)) !== null) {
    const bloque = match[1];
    const inner = /\(([^)]{2,200})\)/.exec(bloque);
    if (inner) {
      const texto = inner[1]
        .replace(/[^\x20-\x7E]/g, " ")
        .trim();
      if (texto.length > 2) textos.push(texto);
    }
  }

  const resultado = textos.join(" ").replace(/\s+/g, " ").trim();
  return resultado;
}

export async function POST(req: NextRequest) {
  try {
    const { archivoBase64, mimeType } = await req.json();

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

    // Convertir base64 a Buffer
    const buffer = Buffer.from(archivoBase64, "base64");

    // Extraer texto
    const textoExtraido = extraerTextoPDFNativo(buffer);

    if (!textoExtraido || textoExtraido.length < 30) {
      return NextResponse.json(
        { error: "No se pudo extraer texto del PDF. Intenta agregar los temas manualmente." },
        { status: 422 }
      );
    }

    // Truncar a 4000 caracteres
    const textoTruncado = textoExtraido.slice(0, 4000);

    const prompt = `Eres un asistente académico. Se te proporciona texto extraído de un programa o syllabus de un curso universitario.

Tu tarea es extraer ÚNICAMENTE la lista de temas o unidades que se estudiarán durante el curso.

Reglas estrictas:
- Devuelve SOLO un JSON válido, sin markdown, sin backticks, sin texto adicional.
- El JSON debe tener exactamente este formato: { "temas": ["Tema 1", "Tema 2", "Tema 3"] }
- Cada tema debe ser una cadena de texto corta y descriptiva (máximo 60 caracteres).
- No incluyas fechas, semanas, créditos, nombres de profesores ni información administrativa.
- Si el texto no parece ser un programa de curso, devuelve: { "temas": [] }
- Extrae entre 3 y 20 temas máximo.

Texto del programa:
${textoTruncado}`;

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
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

    const jsonMatch = texto.match(/\{[\s\S]*\}/);
    const limpio = jsonMatch ? jsonMatch[0].trim() : texto.replace(/```json|```/g, "").trim();

    let parsed: { temas: string[] };
    try {
      parsed = JSON.parse(limpio);
    } catch {
      console.error("Error parseando respuesta de Gemini:", limpio);
      return NextResponse.json(
        { error: "La IA no devolvió un formato válido. Intenta de nuevo." },
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