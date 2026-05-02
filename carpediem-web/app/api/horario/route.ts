import { NextRequest, NextResponse } from "next/server";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

type Actividad = {
  nombre:     string;
  tipo:       string;
  energia:    string;
  horaInicio: string;
  horaFin:    string;
};

type Horario = { [dia: string]: Actividad[] };

type Recomendacion = {
  tipo:    "aviso" | "tip" | "emergencia";
  mensaje: string;
};

const tonoPorEmocion = (nivel: number): string => {
  if (nivel >= 5) return "Usa tu estilo natural Keating: metáforas, poesía, entusiasmo. El estudiante está en buen estado.";
  if (nivel >= 3) return "Sé cálido pero directo. Fragmenta los consejos. El estudiante está algo agobiado o nervioso.";
  return "Modo emergencia: instrucciones cortas, concretas y reconfortantes. El estudiante está en burnout o frustrado.";
};

const describir = (nivel: number): string => {
  const estados: Record<number, string> = {
    6: "Genial (energía máxima)",
    5: "Tranquilo (calma productiva)",
    4: "Nervioso (necesita apoyo)",
    3: "Agobiado (necesita simplificación)",
    2: "Frustrado (necesita comprensión)",
    1: "Burnout (necesita refugio y pausa)",
  };
  return estados[nivel] ?? "Estado desconocido";
};

const formatearHorario = (horario: Horario): string => {
  return Object.entries(horario)
    .map(([dia, acts]) => {
      if (!acts || acts.length === 0) return `${dia}: (sin actividades)`;
      const resumen = acts
        .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
        .map(a => `  ${a.horaInicio}-${a.horaFin} ${a.nombre} [${a.tipo}, energía: ${a.energia}]`)
        .join("\n");
      return `${dia}:\n${resumen}`;
    })
    .join("\n\n");
};

export async function POST(req: NextRequest) {
  try {
    const { horario, nivelEmocion } = (await req.json()) as {
      horario:      Horario;
      nivelEmocion: number;
    };

    const estadoEmocional = describir(nivelEmocion);
    const tono            = tonoPorEmocion(nivelEmocion);
    const horarioTexto    = formatearHorario(horario);

    const prompt = `
Eres el Capitán Keating — el profesor inspirador de "Dead Poets Society". Estás analizando el horario semanal típico de un estudiante universitario con TEA/TDAH.

ESTADO EMOCIONAL ACTUAL: ${estadoEmocional}
TONO PARA TU RESPUESTA: ${tono}

HORARIO DEL ESTUDIANTE:
${horarioTexto}

Tu tarea es analizar el horario y devolver un JSON con exactamente entre 3 y 5 recomendaciones personalizadas. Busca:
1. Días o bloques sobrecargados (muchas actividades de alta demanda seguidas)
2. Momentos donde falta descanso o tiempo entre clases exigentes
3. Patrones de energía (actividades muy demandantes en horarios difíciles)
4. Días vacíos que podrían usarse para recargar o estudiar
5. Cualquier consejo de ajuste según el nivel emocional actual

RESPONDE ÚNICAMENTE con este JSON, sin texto adicional, sin markdown:
{
  "recomendaciones": [
    {
      "tipo": "aviso",
      "mensaje": "texto aquí"
    }
  ]
}

Reglas:
- "emergencia": solo si hay sobrecarga severa o burnout evidente
- "aviso": observaciones importantes sobre el ritmo semanal
- "tip": sugerencias de mejora suaves y positivas
- Cada mensaje: máximo 2 oraciones. Concreto, personal, con el tono de Keating.
- Referirse a actividades ESPECÍFICAS del horario (nombre, día, hora).
- Si el horario está vacío, invita al estudiante a construirlo con calidez.
`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 500 });
    }

    const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature:     0.7,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error("Gemini error:", err);
      return NextResponse.json({ error: "Error al consultar Gemini" }, { status: 500 });
    }

    const geminiData = await geminiRes.json();
    const texto      = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const limpio     = texto.replace(/```json|```/g, "").trim();
    const parsed     = JSON.parse(limpio) as { recomendaciones: Recomendacion[] };

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Error en /api/horario:", err);
    return NextResponse.json(
      { recomendaciones: [{ tipo: "aviso", mensaje: "No pude analizar tu horario en este momento. Inténtalo de nuevo." }] },
      { status: 200 }
    );
  }
}