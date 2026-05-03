"use client";

import { useEffect, useRef, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";
import { getPoemaAleatorio, type NivelEmocional } from "@/lib/poemas";

/* ─── TYPES ─── */

type Subject = { id: string; name: string };
type Topic   = { id: string; nombre: string; semaforo: string };

/* ─── SEMÁFORO EMOJI ─── */

const semaforoEmoji = (s: string) =>
  s === "verde" ? "🟢" : s === "amarillo" ? "🟡" : s === "rojo" ? "🔴" : "⚪";

/* ─── COMPONENT ─── */

export default function FlashcardsIndexPage() {
  const router      = useRouter();
  const currentUser = auth.currentUser;

  const [nivelEmocion, setNivelEmocion]         = useState(5);
  const [subjects, setSubjects]                 = useState<Subject[]>([]);
  const [subjectElegida, setSubjectElegida]     = useState<Subject | null>(null);
  const [topics, setTopics]                     = useState<Topic[]>([]);
  const [cargandoUI, setCargandoUI]             = useState(true);
  const [cargandoTemas, setCargandoTemas]       = useState(false);

  const poemaRef = useRef<ReturnType<typeof getPoemaAleatorio> | null>(null);

  /* ─── LOAD INICIAL ─── */

  useEffect(() => {
    const cargar = async () => {
      if (!currentUser) { setCargandoUI(false); return; }
      try {
        const snapC = await getDoc(
          doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`)
        );
        const nivel = snapC.exists() ? (snapC.data().nivel ?? 5) : 5;
        setNivelEmocion(nivel);
        poemaRef.current = getPoemaAleatorio(nivel as NivelEmocional);

        const snapS = await getDocs(
          query(collection(db, COLLECTIONS.subjects), where("uid", "==", currentUser.uid))
        );
        setSubjects(snapS.docs.map(d => ({ id: d.id, name: d.data().name })));
      } catch (e) { console.error(e); }
      finally { setCargandoUI(false); }
    };
    cargar();
  }, []);

  /* ─── LOAD TEMAS cuando cambia materia ─── */

  useEffect(() => {
    if (!subjectElegida) return;
    const cargarTemas = async () => {
      setCargandoTemas(true);
      try {
        const snap = await getDocs(
          query(collection(db, "subjectTopics"), where("subjectId", "==", subjectElegida.id))
        );
        setTopics(snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre, semaforo: d.data().semaforo })));
      } catch (e) { console.error(e); }
      finally { setCargandoTemas(false); }
    };
    cargarTemas();
  }, [subjectElegida]);

  /* ─── COLORES ─── */

  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const colorTexto  = getTextoPrincipal(nivelEmocion);
  const colorSecund = getTextoSecundario(nivelEmocion);
  const poema       = poemaRef.current;

  if (cargandoUI) {
    return (
      <div style={{ background: bgPage, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: colorTexto, fontSize: "15px" }}>Cargando...</p>
      </div>
    );
  }

  /* ─── RENDER ─── */

  return (
    <div className="page-scroll" style={{ background: bgPage, minHeight: "100vh", transition: "background 0.6s ease", padding: "32px" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: "32px" }}>
        <button
          onClick={() => router.push("/juegos")}
          style={{ background: "transparent", border: "none", color: colorSecund, fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "8px", display: "block" }}
        >
          ← Juegos
        </button>
        <p style={{ fontSize: "12px", color: colorSecund, margin: "0 0 4px" }}>Juegos / Flashcards</p>
        <h1 style={{ fontSize: "32px", margin: "0 0 16px", color: colorTexto, fontWeight: 800 }}>
          🃏 Flashcards
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

      {/* ── Paso 1: Materias en cuadros ── */}
      <div style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: colorTexto, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          1 · Elige una materia
        </p>

        {subjects.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: `0.5px solid ${borderCard}`, textAlign: "center" }}>
            <p style={{ color: colorSecund, fontSize: "14px", margin: 0 }}>
              Aún no tienes materias. Créalas en{" "}
              <span
                onClick={() => router.push("/apuntes")}
                style={{ color: colorTexto, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
              >
                Apuntes
              </span>.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {subjects.map(s => {
              const elegida = subjectElegida?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSubjectElegida(elegida ? null : s)}
                  style={{
                    background: elegida ? colorTexto : "rgba(255,255,255,0.85)",
                    borderRadius: "16px",
                    padding: "20px",
                    border: `0.5px solid ${elegida ? colorTexto : borderCard}`,
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: elegida ? "0 6px 20px rgba(0,0,0,0.1)" : "none",
                  }}
                  onMouseEnter={e => {
                    if (!elegida) {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.07)";
                    }
                  }}
                  onMouseLeave={e => {
                    if (!elegida) {
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                    }
                  }}
                >
                  <p style={{ fontSize: "24px", margin: "0 0 10px" }}>📚</p>
                  <p style={{
                    fontSize: "14px", fontWeight: 700, margin: 0,
                    color: elegida ? "white" : colorTexto,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {s.name}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Paso 2: Temas en cuadros (aparece cuando hay materia elegida) ── */}
      {subjectElegida && (
        <div>
          <p style={{ fontSize: "13px", fontWeight: 700, color: colorTexto, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            2 · Elige un tema de{" "}
            <span style={{ textTransform: "none", fontWeight: 800 }}>{subjectElegida.name}</span>
          </p>

          {cargandoTemas ? (
            <p style={{ fontSize: "13px", color: colorSecund, fontStyle: "italic" }}>Cargando temas...</p>
          ) : topics.length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.85)", borderRadius: "16px", padding: "24px", border: `0.5px solid ${borderCard}`, textAlign: "center" }}>
              <p style={{ color: colorSecund, fontSize: "14px", margin: 0 }}>
                Esta materia no tiene temas. Agrégalos desde{" "}
                <span
                  onClick={() => router.push("/apuntes")}
                  style={{ color: colorTexto, fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}
                >
                  Apuntes
                </span>.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
              {topics.map(t => (
                <div
                  key={t.id}
                  onClick={() => router.push(`/juegos/flashcards/${subjectElegida.id}/${t.id}`)}
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: "16px",
                    padding: "20px",
                    border: `0.5px solid ${borderCard}`,
                    backdropFilter: "blur(8px)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.07)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                  }}
                >
                  <p style={{ fontSize: "20px", margin: "0 0 10px" }}>{semaforoEmoji(t.semaforo)}</p>
                  <p style={{
                    fontSize: "14px", fontWeight: 600, margin: "0 0 6px",
                    color: colorTexto,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {t.nombre}
                  </p>
                  <p style={{ fontSize: "11px", color: colorSecund, margin: 0 }}>
                    Tocar para jugar →
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}