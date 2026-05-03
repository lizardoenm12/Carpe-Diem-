"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";
import { getPoemaAleatorio, type NivelEmocional } from "@/lib/poemas";

/* ─── CATÁLOGO DE JUEGOS ─── */

type Juego = {
  id: string;
  emoji: string;
  titulo: string;
  descripcion: string;
  estado: "disponible" | "proximamente";
  ruta: string;
};

const JUEGOS: Juego[] = [
  {
    id: "flashcards",
    emoji: "🃏",
    titulo: "Flashcards",
    descripcion: "La IA genera tarjetas de repaso desde los temas de tu materia. Voltea, recuerda y evalúate.",
    estado: "disponible",
    ruta: "/juegos/flashcards",
  },
  {
    id: "crucigrama",
    emoji: "🔤",
    titulo: "Crucigrama",
    descripcion: "Próximamente — un crucigrama generado desde los conceptos clave de tus apuntes.",
    estado: "proximamente",
    ruta: "",
  },
  {
    id: "trivia",
    emoji: "⚡",
    titulo: "Trivia rápida",
    descripcion: "Próximamente — responde 5 preguntas contra el reloj para repasar antes de un examen.",
    estado: "proximamente",
    ruta: "",
  },
];

/* ─── COMPONENT ─── */

export default function JuegosIndexPage() {
  const router      = useRouter();
  const currentUser = auth.currentUser;

  const [nivelEmocion, setNivelEmocion] = useState(5);
  const [cargando, setCargando]         = useState(true);

  const poemaRef = useRef<ReturnType<typeof getPoemaAleatorio> | null>(null);

  useEffect(() => {
    const cargar = async () => {
      if (!currentUser) { setCargando(false); return; }
      try {
        const snapC = await getDoc(
          doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`)
        );
        const nivel = snapC.exists() ? (snapC.data().nivel ?? 5) : 5;
        setNivelEmocion(nivel);
        poemaRef.current = getPoemaAleatorio(nivel as NivelEmocional);
      } catch (e) { console.error(e); }
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const colorTexto  = getTextoPrincipal(nivelEmocion);
  const colorSecund = getTextoSecundario(nivelEmocion);
  const poema       = poemaRef.current;

  if (cargando) {
    return (
      <div style={{ background: bgPage, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: colorTexto, fontSize: "15px" }}>Cargando juegos...</p>
      </div>
    );
  }

  return (
    <div className="page-scroll" style={{ background: bgPage, minHeight: "100vh", transition: "background 0.6s ease", padding: "32px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "12px", color: colorSecund, margin: "0 0 4px" }}>Juegos</p>
        <h1 style={{ fontSize: "32px", margin: "0 0 16px", color: colorTexto, fontWeight: 800 }}>
          Aprende jugando
        </h1>
        {poema && (
          <div style={{ borderLeft: "3px solid #B2D8B2", paddingLeft: "16px" }}>
            <p style={{ fontStyle: "italic", fontSize: "15px", color: colorSecund, margin: "0 0 4px", lineHeight: 1.7, whiteSpace: "pre-line" }}>
              "{poema.texto}"
            </p>
            <p style={{ fontSize: "12px", color: colorSecund, margin: 0, opacity: 0.75 }}>
              — {poema.autor}, {poema.obra}
            </p>
          </div>
        )}
      </div>

      {/* ── Grid de juegos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
        {JUEGOS.map(juego => (
          <div
            key={juego.id}
            onClick={() => juego.estado === "disponible" && router.push(juego.ruta)}
            style={{
              background: "rgba(255,255,255,0.85)",
              borderRadius: "16px",
              padding: "24px",
              border: `0.5px solid ${borderCard}`,
              backdropFilter: "blur(8px)",
              cursor: juego.estado === "disponible" ? "pointer" : "default",
              opacity: juego.estado === "proximamente" ? 0.6 : 1,
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
            }}
            onMouseEnter={e => {
              if (juego.estado === "disponible") {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            {/* Emoji + badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
              <span style={{ fontSize: "32px" }}>{juego.emoji}</span>
              {juego.estado === "proximamente" && (
                <span style={{
                  fontSize: "10px", fontWeight: 700, padding: "3px 8px",
                  borderRadius: "20px", background: "#f0f0e8",
                  color: colorSecund, border: `0.5px solid ${borderCard}`,
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Próximamente
                </span>
              )}
              {juego.estado === "disponible" && (
                <span style={{
                  fontSize: "10px", fontWeight: 700, padding: "3px 8px",
                  borderRadius: "20px", background: "#E2F2E2",
                  color: "#1a5a1a", border: "0.5px solid #3a7a3a",
                  textTransform: "uppercase", letterSpacing: "0.05em",
                }}>
                  Disponible
                </span>
              )}
            </div>

            <h2 style={{ fontSize: "17px", fontWeight: 700, color: colorTexto, margin: "0 0 8px" }}>
              {juego.titulo}
            </h2>
            <p style={{ fontSize: "13px", color: colorSecund, margin: "0 0 16px", lineHeight: 1.6 }}>
              {juego.descripcion}
            </p>

            {juego.estado === "disponible" && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: colorTexto }}>Jugar</span>
                <span style={{ fontSize: "12px", color: colorTexto }}>→</span>
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}