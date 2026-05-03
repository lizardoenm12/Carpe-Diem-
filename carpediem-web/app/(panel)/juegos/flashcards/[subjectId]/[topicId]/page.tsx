"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, addDoc, query, where } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";

/* ─── TYPES ─── */

type Flashcard = {
  pregunta: string;
  respuesta: string;
  dificultad: "facil" | "medio" | "dificil";
};

type EstadoCarta = "pregunta" | "respuesta";

/* ─── DIFICULTAD CONFIG ─── */

const DIFICULTAD_CONFIG = {
  facil:   { bg: "#E2F2E2", borde: "#3a7a3a", texto: "#1a5a1a", label: "Fácil",   emoji: "🟢" },
  medio:   { bg: "#FDFBEA", borde: "#E8C84A", texto: "#7a6020", label: "Medio",   emoji: "🟡" },
  dificil: { bg: "#FEF0EE", borde: "#E87A6A", texto: "#7a1a10", label: "Difícil", emoji: "🔴" },
};

/* ─── COMPONENT ─── */

export default function FlashcardsJuegoPage() {
  const params      = useParams();
  const router      = useRouter();
  const currentUser = auth.currentUser;

  const subjectId = params.subjectId as string;
  const topicId   = params.topicId   as string;

  /* ─── STATE ─── */
  const [nivelEmocion, setNivelEmocion] = useState(5);
  const [subjectName, setSubjectName]   = useState("");
  const [topicNombre, setTopicNombre]   = useState("");

  const [flashcards, setFlashcards]     = useState<Flashcard[]>([]);
  const [indiceActual, setIndiceActual] = useState(0);
  const [estadoCarta, setEstadoCarta]   = useState<EstadoCarta>("pregunta");
  const [completadas, setCompletadas]   = useState<Set<number>>(new Set());
  const [juegoTerminado, setJuegoTerminado] = useState(false);

  const [cargando, setCargando]   = useState(true);
  const [error, setError]         = useState("");
  const [volteando, setVolteando] = useState(false);

  /* ─── LOAD ─── */

  useEffect(() => {
    const cargar = async () => {
      if (!currentUser) return;
      setCargando(true);
      setError("");
      try {
        // Nivel emocional
        const snapC = await getDoc(
          doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`)
        );
        if (snapC.exists()) setNivelEmocion(snapC.data().nivel ?? 5);

        // Nombre de la materia
        const snapS = await getDoc(doc(db, COLLECTIONS.subjects, subjectId));
        if (snapS.exists()) setSubjectName(snapS.data().name ?? "");

        // Nombre del tema
        const snapT = await getDoc(doc(db, "subjectTopics", topicId));
        if (snapT.exists()) setTopicNombre(snapT.data().nombre ?? "");

        // Flashcards — caché en Firestore primero
        const snapCache = await getDocs(
          query(
            collection(db, "flashcards"),
            where("subjectId", "==", subjectId),
            where("topicId",   "==", topicId)
          )
        );

        let cards: Flashcard[] = [];

        if (!snapCache.empty) {
          cards = snapCache.docs.map(d => d.data() as Flashcard);
        } else {
          // Pedir a la IA
          const subjectNombre = snapS.exists() ? snapS.data().name : "";
          const temaNombre    = snapT.exists()  ? snapT.data().nombre : "";

          const res = await fetch("/api/apuntes-flashcards", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tema: temaNombre, subjectName: subjectNombre }),
          });
          const data = await res.json();

          if (!res.ok || !data.flashcards) {
            setError(data.error ?? "Error generando flashcards. Intenta de nuevo.");
            return;
          }
          cards = data.flashcards;

          // Guardar en caché
          for (const card of cards) {
            await addDoc(collection(db, "flashcards"), {
              ...card,
              subjectId,
              topicId,
              uid:      currentUser.uid,
              creadoEn: new Date(),
            });
          }
        }

        // Mezclar
        setFlashcards([...cards].sort(() => Math.random() - 0.5));
      } catch (e) {
        console.error(e);
        setError("Error al cargar las flashcards. Intenta de nuevo.");
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [subjectId, topicId]);

  /* ─── ACCIONES ─── */

  const voltearCarta = () => {
    if (volteando) return;
    setVolteando(true);
    setTimeout(() => {
      setEstadoCarta(prev => prev === "pregunta" ? "respuesta" : "pregunta");
      setVolteando(false);
    }, 150);
  };

  const marcarYAvanzar = (sabia: boolean) => {
    const nuevas = new Set(completadas);
    if (sabia) nuevas.add(indiceActual);
    setCompletadas(nuevas);

    if (indiceActual + 1 >= flashcards.length) {
      setJuegoTerminado(true);
    } else {
      setEstadoCarta("pregunta");
      setIndiceActual(prev => prev + 1);
    }
  };

  const reiniciar = () => {
    setFlashcards(prev => [...prev].sort(() => Math.random() - 0.5));
    setIndiceActual(0);
    setEstadoCarta("pregunta");
    setCompletadas(new Set());
    setJuegoTerminado(false);
  };

  /* ─── COLORES ─── */

  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const colorTexto  = getTextoPrincipal(nivelEmocion);
  const colorSecund = getTextoSecundario(nivelEmocion);

  const cardActual   = flashcards[indiceActual];
  const difConfig    = cardActual ? DIFICULTAD_CONFIG[cardActual.dificultad] : null;
  const totalSabidas = completadas.size;
  const porcentaje   = flashcards.length > 0 ? Math.round((totalSabidas / flashcards.length) * 100) : 0;

  /* ─── LOADING ─── */

  if (cargando) {
    return (
      <div style={{ background: bgPage, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
        <p style={{ color: colorTexto, fontSize: "15px", margin: 0 }}>⏳ El Capitán está preparando tus cards...</p>
        <p style={{ color: colorSecund, fontSize: "13px", fontStyle: "italic", margin: 0 }}>Esto solo tarda la primera vez</p>
      </div>
    );
  }

  /* ─── ERROR ─── */

  if (error) {
    return (
      <div style={{ background: bgPage, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ background: "rgba(255,255,255,0.9)", borderRadius: "16px", padding: "32px", maxWidth: "400px", width: "100%", border: `0.5px solid ${borderCard}`, textAlign: "center" }}>
          <p style={{ fontSize: "32px", margin: "0 0 12px" }}>😕</p>
          <p style={{ color: colorTexto, fontSize: "15px", fontWeight: 600, margin: "0 0 8px" }}>Algo salió mal</p>
          <p style={{ color: colorSecund, fontSize: "13px", margin: "0 0 24px" }}>{error}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "12px", borderRadius: "12px", background: "#B2D8B2", border: "none", color: colorTexto, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              Intentar de nuevo
            </button>
            <button
              onClick={() => router.push("/juegos/flashcards")}
              style={{ padding: "12px", borderRadius: "12px", background: "transparent", border: `0.5px solid ${borderCard}`, color: colorSecund, fontSize: "13px", cursor: "pointer" }}
            >
              ← Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── RESULTADO FINAL ─── */

  if (juegoTerminado) {
    const mensajeFinal =
      porcentaje >= 80 ? "¡Excelente! Las dominas." :
      porcentaje >= 50 ? "Bien encaminada. Sigue repasando." :
                         "Este tema pide más atención. ¡Tú puedes!";

    return (
      <div style={{ background: bgPage, minHeight: "100vh", transition: "background 0.6s ease", display: "flex", alignItems: "center", justifyContent: "center", padding: "32px" }}>
        <div style={{ background: "rgba(255,255,255,0.92)", borderRadius: "20px", padding: "40px 36px", maxWidth: "420px", width: "100%", border: `0.5px solid ${borderCard}`, textAlign: "center", backdropFilter: "blur(8px)" }}>

          <div style={{ fontSize: "52px", marginBottom: "16px" }}>
            {porcentaje >= 80 ? "🏆" : porcentaje >= 50 ? "📈" : "🌱"}
          </div>
          <h2 style={{ fontSize: "22px", color: colorTexto, margin: "0 0 8px", fontWeight: 800 }}>
            Ronda terminada
          </h2>
          <p style={{ fontSize: "32px", fontWeight: 800, color: colorTexto, margin: "0 0 4px" }}>
            {totalSabidas} / {flashcards.length}
          </p>
          <p style={{ fontSize: "14px", color: colorSecund, margin: "0 0 8px" }}>{topicNombre}</p>
          <p style={{ fontSize: "14px", color: colorSecund, margin: "0 0 24px" }}>{mensajeFinal}</p>

          {/* Barra de progreso */}
          <div style={{ height: "8px", background: "#f0f0e8", borderRadius: "4px", marginBottom: "28px", overflow: "hidden" }}>
            <div style={{
              height: "8px", borderRadius: "4px", transition: "width 0.6s ease",
              width: `${porcentaje}%`,
              background: porcentaje >= 80 ? "#3a7a3a" : porcentaje >= 50 ? "#E8C84A" : "#E87A6A",
            }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={reiniciar}
              style={{ padding: "12px", borderRadius: "12px", background: "#B2D8B2", border: "none", color: colorTexto, fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              🔀 Otra ronda (mezcladas)
            </button>
            <button
              onClick={() => router.push("/juegos/flashcards")}
              style={{ padding: "12px", borderRadius: "12px", background: "transparent", border: `0.5px solid ${borderCard}`, color: colorSecund, fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
            >
              ← Elegir otro tema
            </button>
          </div>

        </div>
      </div>
    );
  }

  /* ─── JUEGO ACTIVO ─── */

  return (
    <div className="page-scroll" style={{ background: bgPage, minHeight: "100vh", transition: "background 0.6s ease", padding: "32px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <button
            onClick={() => router.push("/juegos/flashcards")}
            style={{ background: "transparent", border: "none", color: colorSecund, fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "4px", display: "block" }}
          >
            ← Volver
          </button>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: colorTexto }}>
            {topicNombre}
          </h2>
          <p style={{ margin: 0, fontSize: "12px", color: colorSecund }}>{subjectName}</p>
        </div>

        {/* Progreso */}
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 6px", fontSize: "13px", color: colorSecund, fontWeight: 600 }}>
            {indiceActual + 1} / {flashcards.length}
          </p>
          <div style={{ width: "160px", height: "6px", background: "#f0f0e8", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{
              height: "6px", borderRadius: "3px", background: "#B2D8B2",
              width: `${((indiceActual + 1) / flashcards.length) * 100}%`,
              transition: "width 0.3s ease",
            }} />
          </div>
        </div>
      </div>

      {/* ── CARTA ── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
        <div
          onClick={voltearCarta}
          style={{
            width: "100%", maxWidth: "560px", minHeight: "280px",
            background: "rgba(255,255,255,0.92)", borderRadius: "20px",
            border: `0.5px solid ${estadoCarta === "respuesta" ? (difConfig?.borde ?? borderCard) : borderCard}`,
            backdropFilter: "blur(8px)", cursor: "pointer",
            display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
            padding: "36px 32px", textAlign: "center", gap: "16px",
            transition: "all 0.15s ease",
            opacity: volteando ? 0 : 1,
            transform: volteando ? "scale(0.97)" : "scale(1)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          }}
        >
          {/* Badge */}
          <div style={{
            padding: "4px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            background: estadoCarta === "pregunta" ? "#f0f4ec" : (difConfig?.bg ?? "#f0f4ec"),
            color:      estadoCarta === "pregunta" ? colorSecund  : (difConfig?.texto ?? colorSecund),
            border:     `0.5px solid ${estadoCarta === "pregunta" ? borderCard : (difConfig?.borde ?? borderCard)}`,
          }}>
            {estadoCarta === "pregunta"
              ? "Pregunta — toca para revelar"
              : `${difConfig?.emoji} ${difConfig?.label}`
            }
          </div>

          {/* Texto */}
          <p style={{
            fontSize: estadoCarta === "pregunta" ? "18px" : "16px",
            fontWeight: estadoCarta === "pregunta" ? 700 : 500,
            color: estadoCarta === "pregunta" ? colorTexto : "#333",
            margin: 0, lineHeight: 1.65,
          }}>
            {estadoCarta === "pregunta" ? cardActual.pregunta : cardActual.respuesta}
          </p>

          {estadoCarta === "pregunta" && (
            <p style={{ fontSize: "12px", color: colorSecund, margin: 0, opacity: 0.7 }}>
              Piénsalo primero, luego toca 👆
            </p>
          )}
        </div>
      </div>

      {/* ── Botones sabía / no sabía ── */}
      {estadoCarta === "respuesta" && (
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", maxWidth: "560px", margin: "0 auto" }}>
          <button
            onClick={() => marcarYAvanzar(false)}
            style={{ flex: 1, padding: "14px", borderRadius: "14px", background: "#FEF0EE", border: "0.5px solid #E87A6A", color: "#7a1a10", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            😅 No lo sabía
          </button>
          <button
            onClick={() => marcarYAvanzar(true)}
            style={{ flex: 1, padding: "14px", borderRadius: "14px", background: "#E2F2E2", border: "0.5px solid #3a7a3a", color: "#1a5a1a", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            ✅ ¡Lo sabía!
          </button>
        </div>
      )}

      {estadoCarta === "pregunta" && (
        <p style={{ textAlign: "center", fontSize: "12px", color: colorSecund, marginTop: "12px", opacity: 0.7 }}>
          Toca la carta para ver la respuesta
        </p>
      )}

    </div>
  );
}