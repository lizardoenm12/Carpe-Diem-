import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";

export async function POST(req: Request) {
  try {
    const { message, subjectName, history, userName, uid } = await req.json();

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

    let profileContext = "No hay perfil personalizado disponible.";

    if (uid) {
      try {
        const profileRef = doc(db, COLLECTIONS.userProfiles, uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const profile = profileSnap.data();

          profileContext = `
Perfil de estudio del usuario:
- Forma de estudio: ${profile.studyStyle || "mixto"}
- Intensidad preferida: ${profile.preferredIntensity || "suave"}
- Objetivo actual: ${profile.currentGoal || "organización"}
- Racha actual: ${profile.streakDays || 0} días
- Acciones de estudio: ${profile.totalStudyActions || 0}
`;
        }
      } catch (error) {
        console.error("No se pudo cargar el perfil del usuario:", error);
      }
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

Debes adaptar tu respuesta al perfil del usuario:
${profileContext}

Reglas de adaptación:
- Si la intensidad es "suave", responde con pasos pequeños y baja presión.
- Si la intensidad es "normal", responde equilibrando explicación y acción.
- Si la intensidad es "intensa", puedes ser más exigente y directo.
- Si la forma de estudio es "visual", usa esquemas, listas o mapas mentales textuales.
- Si la forma de estudio es "lectura", explica con texto ordenado.
- Si la forma de estudio es "practico", da ejercicios o acciones concretas.
- Si la forma de estudio es "mixto", combina explicación breve + ejemplo + pasos.

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
        const errorMessage = String(error?.message || "");

        const retriable =
          status === 503 ||
          errorMessage.includes("503") ||
          errorMessage.toLowerCase().includes("high demand") ||
          errorMessage.toLowerCase().includes("service unavailable");

        if (!retriable || attempt === 3) break;

        await wait(1200 * attempt);
      }
    }

    console.error("Error real en /api/capitan:", lastError);
    const anyError = lastError as any;
    const errorMessage =
      anyError?.message || "Error desconocido al llamar a Gemini.";

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: anyError?.status || 500 }
    );
  } catch (error) {
    console.error("Error en /api/capitan:", error);
    return NextResponse.json(
      { error: "Hubo un problema generando la respuesta." },
      { status: 500 }
    );
  }
}