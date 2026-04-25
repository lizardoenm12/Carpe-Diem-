import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { message, subjectName, history, userName } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Falta el mensaje del usuario." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No existe GEMINI_API_KEY en el entorno." },
        { status: 500 }
      );
    }

    if (!modelName) {
      return NextResponse.json(
        { error: "No existe GEMINI_MODEL en el entorno." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const formattedHistory = Array.isArray(history)
      ? history
          .map((m: { role: string; text: string }) => {
            const role = m.role === "user" ? "Usuario" : "Capitán";
            return `${role}: ${m.text}`;
          })
          .join("\n")
      : "";

    const prompt = `
Eres "El Capitán", tutor de estudio de la app Carpe Diem.

Tu estilo:
- claro
- directo
- empático
- útil para estudiar
- divides tareas en pasos pequeños
- no inventas si falta contexto
- respondes en español

Contexto:
Usuario: ${userName || "estudiante"}
Materia: ${subjectName || "sin materia especificada"}

Historial reciente:
${formattedHistory || "Sin historial previo"}

Pregunta del usuario:
${message}
`;

    async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let lastError: unknown;

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    lastError = error;

    const status = error?.status || error?.statusCode;
    const message = String(error?.message || "");

    const retriable =
      status === 503 ||
      message.includes("503") ||
      message.toLowerCase().includes("high demand") ||
      message.toLowerCase().includes("service unavailable");

    if (!retriable || attempt === 3) {
      break;
    }

    await wait(1200 * attempt);
  }
}

console.error("Error en /api/capitan:", lastError);
return NextResponse.json(
  { error: "Gemini está saturado temporalmente. Intenta de nuevo en unos segundos." },
  { status: 503 }

);
  } catch (error) {
    console.error("Error en /api/capitan:", error);
    return NextResponse.json(
      { error: "Hubo un problema generando la respuesta." },
      { status: 500 }
    
    );
  }
  
}