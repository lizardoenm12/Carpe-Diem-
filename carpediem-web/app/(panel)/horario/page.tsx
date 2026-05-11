"use client";
 
import { useState, useEffect, useCallback } from "react";import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";
 
/* ─── CONFIG ─── */
 
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_CORTO = ["L", "Ma", "Mi", "J", "V", "S", "D"];
 
const HORAS_GRID = Array.from({ length: 16 }, (_, i) => i + 7);
 
const TIPOS = {
  clase:     { label: "Clase",     color: "#DCF0F5", texto: "#5292a1", emoji: "📖" },
  estudio:   { label: "Estudio",   color: "#E2F2E2", texto: "#58b058", emoji: "✏️" },
  trabajo:   { label: "Trabajo",   color: "#FAF0DC", texto: "#8a7030", emoji: "💼" },
  descanso:  { label: "Descanso",  color: "#EEF7F2", texto: "#4a946c", emoji: "🌿" },
  personal:  { label: "Personal",  color: "#FAF0EC", texto: "#a05d4b", emoji: "🌟" },
  ejercicio: { label: "Ejercicio", color: "#E8F5EE", texto: "#80b693", emoji: "🏃" },
};
 
const ENERGIA = {
  muy_baja: { label: "Agotador",    emoji: "🪫", color: "#DED8D4", texto: "#3A3030" },
  baja:     { label: "Cansado",     emoji: "😔", color: "#E2DDD8", texto: "#383230" },
  media:    { label: "Neutro",      emoji: "😐", color: "#E2E0D8", texto: "#383620" },
  alta:     { label: "Manejable",   emoji: "🙂", color: "#D8E2DC", texto: "#283A2E" },
  muy_alta: { label: "Energizante", emoji: "⚡", color: "#D4E2DA", texto: "#243A2C" },
};
 
/* ─── TYPES ─── */
 
type TipoActividad = keyof typeof TIPOS;
type NivelEnergia  = keyof typeof ENERGIA;
 
type Actividad = {
  id:         string;
  nombre:     string;
  tipo:       TipoActividad;
  energia:    NivelEnergia;
  horaInicio: string;
  horaFin:    string;
};
 
type Horario = { [dia: string]: Actividad[] };
 
type Recomendacion = {
  tipo:    "aviso" | "tip" | "emergencia";
  mensaje: string;
};
 
const horarioVacio = (): Horario =>
  Object.fromEntries(DIAS.map(d => [d, []]));
 
/* ─── HELPERS DE HORA ─── */
 
const horaAMinutos = (h: string): number => {
  const [hh, mm] = h.split(":").map(Number);
  if (isNaN(hh) || isNaN(mm)) return 0;
  return hh * 60 + mm;
};
 
const minutosAPixels = (minutos: number, pxPorHora: number) =>
  (minutos / 60) * pxPorHora;
 
const esHoraValida = (h: string): boolean => {
  if (!/^\d{1,2}:\d{2}$/.test(h)) return false;
  const [hh, mm] = h.split(":").map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
};
 
const a12h = (h: string): string => {
  if (!esHoraValida(h)) return h;
  const [hh, mm] = h.split(":").map(Number);
  const periodo = hh < 12 ? "AM" : "PM";
  const hora12  = hh % 12 === 0 ? 12 : hh % 12;
  return `${hora12}:${String(mm).padStart(2, "0")} ${periodo}`;
};
 
const formatHora = (h: string, usar24h: boolean): string =>
  usar24h ? h : a12h(h);

// Convierte hora 24h a componentes para el selector
const parsearHora = (h: string): { hora: number; minuto: number; periodo: "AM" | "PM" } => {
  const [hh, mm] = h.split(":").map(Number);
  const periodo: "AM" | "PM" = hh < 12 ? "AM" : "PM";
  const hora12 = hh % 12 === 0 ? 12 : hh % 12;
  return { hora: hora12, minuto: mm, periodo };
};

// Convierte componentes del selector a hora 24h
const armarHora24 = (hora: number, minuto: number, periodo: "AM" | "PM"): string => {
  let hh = hora % 12;
  if (periodo === "PM") hh += 12;
  return `${String(hh).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
};

const ALTURA_HORA = 56;

/* ─── INPUT DE HORA ─── */

type InputHoraProps = {
  label: string;
  valor: string;           // siempre 24h internamente
  onChange: (nueva: string) => void;
  usar24h: boolean;
  borderCard: string;
  colorTitulo: string;
  colorSub: string;
  error?: boolean;
};

function InputHora({ label, valor, onChange, usar24h, borderCard, colorTitulo, colorSub, error }: InputHoraProps) {
  const { periodo } = parsearHora(valor);

  // Texto visible en el input — 24h o 12h según preferencia
  const [textoInput, setTextoInput] = useState(usar24h ? valor : a12h(valor).replace(/ AM| PM/, ""));

  // Cuando cambia el valor externo (ej. al abrir el modal) sincronizar
  useEffect(() => {
    setTextoInput(usar24h ? valor : a12h(valor).replace(/ AM| PM/, ""));
  }, [valor, usar24h]);

  const handleChange = (raw: string) => {
    setTextoInput(raw);
    if (usar24h) {
      // Intentar parsear directo
      const norm = normalizarHora24(raw);
      if (norm) onChange(norm);
    } else {
      // Combinar con el periodo actual para obtener 24h
      const norm = normalizarHora12(raw, periodo);
      if (norm) onChange(norm);
    }
  };

  const togglePeriodo = () => {
    const nuevoPeriodo: "AM" | "PM" = periodo === "AM" ? "PM" : "AM";
    const { hora, minuto } = parsearHora(valor);
    onChange(armarHora24(hora, minuto, nuevoPeriodo));
  };

  return (
    <div>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 600, color: colorSub, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        <input
          type="text"
          value={textoInput}
          onChange={e => handleChange(e.target.value)}
          placeholder={usar24h ? "14:30" : "2:30"}
          maxLength={5}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: "10px",
            border: error ? "1px solid #e87a6a" : `0.5px solid ${borderCard}`,
            background: "#fafaf5",
            fontSize: "15px",
            color: colorTitulo,
            fontFamily: "monospace",
            letterSpacing: "0.5px",
            outline: "none",
            boxSizing: "border-box" as const,
          }}
        />
        {/* Toggle AM/PM solo cuando NO es 24h */}
        {!usar24h && (
          <button
            onClick={togglePeriodo}
            style={{
              padding: "10px 10px",
              borderRadius: "10px",
              border: `0.5px solid ${borderCard}`,
              background: colorTitulo,
              color: "white",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            {periodo}
          </button>
        )}
      </div>
    </div>
  );
}

// Normaliza texto a hora 24h
const normalizarHora24 = (raw: string): string | null => {
  const limpio = raw.trim();
  let hh: number, mm: number;
  if (/^\d{3,4}$/.test(limpio)) {
    const s = limpio.padStart(4, "0");
    hh = parseInt(s.slice(0, 2));
    mm = parseInt(s.slice(2));
  } else if (/^\d{1,2}:\d{2}$/.test(limpio)) {
    [hh, mm] = limpio.split(":").map(Number);
  } else {
    return null;
  }
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

// Normaliza texto 12h + periodo a hora 24h
const normalizarHora12 = (raw: string, periodo: "AM" | "PM"): string | null => {
  const limpio = raw.trim();
  let hh: number, mm: number;
  if (/^\d{1,2}:\d{2}$/.test(limpio)) {
    [hh, mm] = limpio.split(":").map(Number);
  } else if (/^\d{1,2}$/.test(limpio)) {
    hh = parseInt(limpio); mm = 0;
  } else {
    return null;
  }
  if (hh < 1 || hh > 12 || mm < 0 || mm > 59) return null;
  return armarHora24(hh, mm, periodo);
};

/* ─── COMPONENT ─── */
 
export default function HorarioPage() {
  const router = useRouter();
 
  const [horario, setHorario]           = useState<Horario>(horarioVacio());
  const [nivelEmocion, setNivelEmocion] = useState<number>(5);
  const [guardando, setGuardando]       = useState(false);
  const [guardado, setGuardado]         = useState(false);
  const [cargando, setCargando]         = useState(true);
 
  const [usar24h, setUsar24h] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const guardado = localStorage.getItem("carpe_usar24h");
    return guardado === null ? true : guardado === "true";
  });
 
  const toggleFormato = () => {
    setUsar24h(prev => {
      const nuevo = !prev;
      localStorage.setItem("carpe_usar24h", String(nuevo));
      return nuevo;
    });
  };
 
  const [modalAbierto, setModalAbierto]   = useState(false);
  const [diaModal, setDiaModal]           = useState("Lunes");
  const [actividadEdit, setActividadEdit] = useState<Actividad | null>(null);
  const [nombre, setNombre]               = useState("");
  const [tipo, setTipo]                   = useState<TipoActividad>("clase");
  const [energia, setEnergia]             = useState<NivelEnergia>("media");
  const [horaInicio, setHoraInicio]       = useState("08:00");
  const [horaFin, setHoraFin]             = useState("09:00");
  const [errorHora, setErrorHora]         = useState<string | null>(null);
 
  const [recomendaciones, setRecomendaciones] = useState<Recomendacion[]>([]);
  const [cargandoIA, setCargandoIA]           = useState(false);
 
  const user = auth.currentUser;
 
  /* ─── LOAD ─── */
 
  useEffect(() => {
    const cargar = async () => {
      if (!user) return;
      setCargando(true);
      try {
        const snapH = await getDoc(doc(db, "horarios", user.uid));
        if (snapH.exists()) setHorario(snapH.data() as Horario);
 
        const snapC = await getDocs(
          query(
            collection(db, "checkins"),
            where("uid", "==", user.uid),
            orderBy("fecha", "desc"),
            limit(1)
          )
        );
        if (!snapC.empty) {
          const data = snapC.docs[0].data();
          setNivelEmocion(data.nivel ?? 5);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [user]);
 
  /* ─── GUARDAR ─── */
 
  const guardar = async () => {
    if (!user) return;
    setGuardando(true);
    try {
      await setDoc(doc(db, "horarios", user.uid), horario);
      setGuardado(true);
      setTimeout(() => setGuardado(false), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };
 
  /* ─── MODAL ─── */
 
  const abrirModal = (dia: string, hora?: string, act?: Actividad) => {
    setDiaModal(dia);
    setErrorHora(null);
    if (act) {
      setActividadEdit(act);
      setNombre(act.nombre);
      setTipo(act.tipo);
      setEnergia(act.energia);
      setHoraInicio(act.horaInicio);
      setHoraFin(act.horaFin);
    } else {
      setActividadEdit(null);
      setNombre("");
      setTipo("clase");
      setEnergia("media");
      const inicio = hora ?? "08:00";
      setHoraInicio(inicio);
      const [hh, mm] = inicio.split(":").map(Number);
      const finHH = Math.min(hh + 1, 23);
      setHoraFin(`${String(finHH).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
    }
    setModalAbierto(true);
  };
 
  const cerrarModal = () => {
    setModalAbierto(false);
    setActividadEdit(null);
    setErrorHora(null);
  };

  const guardarActividad = () => {
    if (horaAMinutos(horaInicio) >= horaAMinutos(horaFin)) {
      setErrorHora("La hora de fin debe ser posterior a la de inicio");
      return;
    }
    if (!nombre.trim()) return;
    setErrorHora(null);
    const nueva: Actividad = {
      id:         actividadEdit?.id ?? Date.now().toString(),
      nombre:     nombre.trim(),
      tipo,
      energia,
      horaInicio,
      horaFin,
    };
    setHorario(prev => {
      const actividadesHoy = (prev[diaModal] ?? []).filter(a => a.id !== nueva.id);
      return { ...prev, [diaModal]: [...actividadesHoy, nueva] };
    });
    cerrarModal();
  };
 
  const eliminarActividad = (dia: string, id: string) => {
    setHorario(prev => ({
      ...prev,
      [dia]: prev[dia].filter(a => a.id !== id),
    }));
  };
 
  /* ─── IA ─── */
 
  const pedirRecomendaciones = useCallback(async () => {
    setCargandoIA(true);
    try {
      const res = await fetch("/api/horario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ horario, nivelEmocion }),
      });
      const data = await res.json();
      setRecomendaciones(data.recomendaciones ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargandoIA(false);
    }
  }, [horario, nivelEmocion]);
 
  /* ─── COLORES ─── */
 
  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const bgCard      = "rgba(255,255,255,0.75)";
  const colorAccion = "#95bd79";
  const colorTitulo = getTextoPrincipal(nivelEmocion);
  const colorSub    = getTextoSecundario(nivelEmocion);

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "0.5px solid #d0d0c0",
    background: "#fafaf5",
    fontSize: "13px",
    color: colorTitulo,
    marginBottom: "14px",
    boxSizing: "border-box",
    outline: "none",
  };

  /* ─── RENDER ─── */
 
  if (cargando) {
    return (
      <div style={{ background: bgPage, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: colorTitulo, fontSize: "18px" }}>Cargando tu semana...</p>
      </div>
    );
  }
 
  return (
    <div style={{ background: bgPage, minHeight: "100vh", transition: "background 0.6s ease" }}>
 
      {/* HEADER */}
      <div style={{
        padding: "18px 24px",
        background: bgCard,
        backdropFilter: "blur(8px)",
        borderBottom: `0.5px solid ${borderCard}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 10,
        gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            title="Volver al Dashboard"
            style={{
              background: "transparent",
              border: `0.5px solid ${borderCard}`,
              borderRadius: "10px",
              padding: "7px 12px",
              fontSize: "13px",
              color: colorAccion,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 500,
              transition: "background 0.2s",
            }}
            onMouseEnter={e => (e.currentTarget.style.background = "#E1F5EE")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            ← Dashboard
          </button>
          <div>
            <h2 style={{ margin: 0, color: colorTitulo, fontSize: "20px", fontWeight: 600 }}>
              Mi semana típica
            </h2>
            <p style={{ margin: 0, fontSize: "12px", color: colorSub }}>
              Haz clic en cualquier bloque para añadir o editar actividades
            </p>
          </div>
        </div>
 
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Checkbox 24h */}
          <label style={{
            display: "flex", alignItems: "center", gap: "7px",
            cursor: "pointer", fontSize: "12px", color: colorSub,
            fontWeight: 500, userSelect: "none", padding: "6px 10px",
            borderRadius: "8px", border: `0.5px solid ${borderCard}`,
            background: "rgba(255,255,255,0.6)",
          }}>
            <input
              type="checkbox"
              checked={usar24h}
              onChange={toggleFormato}
              style={{ accentColor: colorAccion, width: "14px", height: "14px", cursor: "pointer" }}
            />
            Reloj 24 h
          </label>

          {/* ── NUEVO: botón + Nueva actividad ── */}
          <button
            onClick={() => abrirModal(DIAS[0])}
            style={{
              background: colorAccion,
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            + Nueva actividad
          </button>
 
          <button
            onClick={guardar}
            style={{
              background: guardado ? "#52C788" : colorAccion,
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              cursor: "pointer",
              fontWeight: 500,
              transition: "background 0.3s",
            }}
          >
            {guardado ? "✓ Guardado" : guardando ? "Guardando..." : "Guardar semana"}
          </button>
        </div>
      </div>
 
      <div style={{ padding: "20px 24px", display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", maxWidth: "1400px", margin: "0 auto" }}>
 
        {/* GRID SEMANAL */}
        <div style={{ background: bgCard, borderRadius: "16px", border: `0.5px solid ${borderCard}`, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)", borderBottom: `0.5px solid ${borderCard}` }}>
            <div style={{ padding: "10px 8px" }} />
            {DIAS.map((dia, i) => (
              <div key={dia} style={{
                padding: "10px 4px", textAlign: "center",
                fontSize: "12px", fontWeight: 600, color: colorTitulo,
                borderLeft: `0.5px solid ${borderCard}`,
              }}>
                <span style={{ display: "block" }}>{DIAS_CORTO[i]}</span>
                <span style={{ fontSize: "10px", color: colorSub, fontWeight: 400 }}>{dia}</span>
              </div>
            ))}
          </div>
 
          <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 200px)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "52px repeat(7, 1fr)" }}>
              <div>
                {HORAS_GRID.map(hora => {
                  const horaStr = `${String(hora).padStart(2, "0")}:00`;
                  return (
                    <div key={hora} style={{
                      height: `${ALTURA_HORA}px`, borderBottom: `0.5px solid ${borderCard}`,
                      display: "flex", alignItems: "flex-start",
                      justifyContent: "flex-end", paddingRight: "8px", paddingTop: "4px",
                    }}>
                      <span style={{ fontSize: "10px", color: "#9aac8a" }}>
                        {formatHora(horaStr, usar24h)}
                      </span>
                    </div>
                  );
                })}
              </div>
 
              {DIAS.map(dia => (
                <div key={dia} style={{ borderLeft: `0.5px solid ${borderCard}`, position: "relative" }}>
                  {HORAS_GRID.map(hora => (
                    <div
                      key={hora}
                      onClick={() => abrirModal(dia, `${String(hora).padStart(2, "0")}:00`)}
                      style={{ height: `${ALTURA_HORA}px`, borderBottom: `0.5px solid ${borderCard}`, cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(178,216,178,0.15)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    />
                  ))}
 
                  {(horario[dia] ?? []).map(act => {
                    const inicioMin = horaAMinutos(act.horaInicio) - 7 * 60;
                    const durMin    = horaAMinutos(act.horaFin) - horaAMinutos(act.horaInicio);
                    const top       = minutosAPixels(inicioMin, ALTURA_HORA);
                    const height    = minutosAPixels(durMin, ALTURA_HORA) - 2;
                    const tipoData  = TIPOS[act.tipo];
                    const energData = ENERGIA[act.energia];
                    return (
                      <div
                        key={act.id}
                        onClick={e => { e.stopPropagation(); abrirModal(dia, act.horaInicio, act); }}
                        style={{
                          position: "absolute", top: `${top}px`, left: "3px", right: "3px",
                          height: `${Math.max(height, 22)}px`, background: tipoData.color,
                          borderRadius: "8px", borderLeft: `3px solid ${tipoData.texto}`,
                          padding: "3px 6px", cursor: "pointer", overflow: "hidden",
                          zIndex: 2, boxSizing: "border-box",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.opacity = "0.85"; }}
                        onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "10px", fontWeight: 600, color: tipoData.texto, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%" }}>
                            {act.nombre}
                          </span>
                          <span style={{ fontSize: "10px" }}>{energData.emoji}</span>
                        </div>
                        {height > 30 && (
                          <div style={{ fontSize: "9px", color: tipoData.texto, opacity: 0.75, marginTop: "1px" }}>
                            {formatHora(act.horaInicio, usar24h)} – {formatHora(act.horaFin, usar24h)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
 
        {/* PANEL LATERAL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ background: bgCard, borderRadius: "16px", border: `0.5px solid ${borderCard}`, padding: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 600, color: colorTitulo, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Tipos de actividad
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {Object.entries(TIPOS).map(([key, val]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: val.color, border: `1px solid ${val.texto}40`, flexShrink: 0 }} />
                  <span style={{ fontSize: "12px", color: val.texto }}>{val.emoji} {val.label}</span>
                </div>
              ))}
            </div>
          </div>
 
          <div style={{ background: bgCard, borderRadius: "16px", border: `0.5px solid ${borderCard}`, padding: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 600, color: colorTitulo, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Nivel de energía
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {Object.entries(ENERGIA).map(([key, val]) => (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "14px" }}>{val.emoji}</span>
                  <span style={{ fontSize: "12px", color: colorSub }}>{val.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Botón El Capitán — movido al panel lateral */}
          <button
            onClick={pedirRecomendaciones}
            disabled={cargandoIA}
            style={{
              background: colorAccion, color: "white",
              border: "none", borderRadius: "12px",
              padding: "12px 14px", fontSize: "13px",
              cursor: cargandoIA ? "not-allowed" : "pointer",
              fontWeight: 600, opacity: cargandoIA ? 0.7 : 1,
            }}
          >
            {cargandoIA ? "Analizando..." : "⏳ Pedir consejo al Capitán"}
          </button>
 
          {recomendaciones.length > 0 && (
            <div style={{ background: bgCard, borderRadius: "16px", border: `0.5px solid ${borderCard}`, padding: "16px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: 600, color: colorTitulo, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                ⏳ El Capitán dice
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {recomendaciones.map((r, i) => {
                  const colores = {
                    aviso:      { bg: "#FEF6ED", borde: "#E8A157", texto: "#7a4010" },
                    tip:        { bg: "#EDFBF3", borde: "#52C788", texto: "#1a5a30" },
                    emergencia: { bg: "#FEF0EE", borde: "#E87A6A", texto: "#7a1a10" },
                  };
                  const c = colores[r.tipo];
                  return (
                    <div key={i} style={{
                      background: c.bg, border: `0.5px solid ${c.borde}`,
                      borderRadius: "10px", padding: "10px 12px",
                      fontSize: "12px", color: c.texto, lineHeight: 1.5,
                    }}>
                      {r.mensaje}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
 
          {cargandoIA && (
            <div style={{ background: bgCard, borderRadius: "16px", border: `0.5px solid ${borderCard}`, padding: "20px", textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: "13px", color: colorSub, fontStyle: "italic" }}>
                El Capitán está analizando tu semana...
              </p>
            </div>
          )}
        </div>
      </div>
 
      {/* ══════════════════════ MODAL ══════════════════════ */}
      {modalAbierto && (
        <div
          onClick={cerrarModal}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "20px", padding: "28px",
              width: "min(560px, 92vw)",
              border: `0.5px solid ${borderCard}`,
              maxHeight: "90vh", overflowY: "auto", overflowX: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h4 style={{ margin: 0, color: colorTitulo, fontSize: "16px", fontWeight: 600 }}>
                  {actividadEdit ? "Editar actividad" : "Nueva actividad"}
                </h4>
                <p style={{ margin: 0, fontSize: "12px", color: colorSub }}>{diaModal}</p>
              </div>
              {actividadEdit && (
                <button
                  onClick={() => { eliminarActividad(diaModal, actividadEdit.id); cerrarModal(); }}
                  style={{ background: "#fee", color: "#c45c5c", border: "0.5px solid #e0a0a0", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer" }}
                >
                  Eliminar
                </button>
              )}
            </div>

            {/* Selector de día — solo visible cuando se abre desde el botón del header */}
            {!actividadEdit && (
              <div style={{ marginBottom: "16px" }}>
                <label style={labelStyle(colorSub)}>Día</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {DIAS.map((dia, i) => (
                    <button
                      key={dia}
                      onClick={() => setDiaModal(dia)}
                      style={{
                        padding: "6px 10px", borderRadius: "8px", fontSize: "12px",
                        fontWeight: diaModal === dia ? 700 : 500, cursor: "pointer",
                        border: diaModal === dia ? `1.5px solid ${colorTitulo}` : `0.5px solid ${borderCard}`,
                        background: diaModal === dia ? colorTitulo : "white",
                        color: diaModal === dia ? "white" : colorSub,
                      }}
                    >
                      {DIAS_CORTO[i]}
                    </button>
                  ))}
                </div>
              </div>
            )}
 
            <label style={labelStyle(colorSub)}>Nombre de la actividad</label>
            <input
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Cálculo, Lectura, Almuerzo..."
              style={inputStyle}
              autoFocus
            />

            {/* ── Inputs de hora con toggle AM/PM ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <InputHora
                label="Inicio"
                valor={horaInicio}
                onChange={setHoraInicio}
                usar24h={usar24h}
                borderCard={borderCard}
                colorTitulo={colorTitulo}
                colorSub={colorSub}
                error={!!errorHora}
              />
              <InputHora
                label="Fin"
                valor={horaFin}
                onChange={val => { setHoraFin(val); setErrorHora(null); }}
                usar24h={usar24h}
                borderCard={borderCard}
                colorTitulo={colorTitulo}
                colorSub={colorSub}
                error={!!errorHora}
              />
            </div>

            {errorHora && (
              <p style={{ margin: "-8px 0 12px", fontSize: "11px", color: "#c45c5c" }}>
                ⚠️ {errorHora}
              </p>
            )}
 
            <label style={labelStyle(colorSub)}>Tipo de actividad</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "16px" }}>
              {Object.entries(TIPOS).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setTipo(key as TipoActividad)}
                  style={{
                    padding: "8px 6px", borderRadius: "10px",
                    border: tipo === key ? `2px solid ${val.texto}` : "1.5px solid transparent",
                    background: tipo === key ? val.color : "#f5f5f0",
                    color: tipo === key ? val.texto : "#888",
                    fontSize: "11px", cursor: "pointer",
                    fontWeight: tipo === key ? 600 : 400,
                  }}
                >
                  {val.emoji}<br />{val.label}
                </button>
              ))}
            </div>
 
            <label style={labelStyle(colorSub)}>¿Cuánta energía requiere?</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
              {Object.entries(ENERGIA).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setEnergia(key as NivelEnergia)}
                  style={{
                    padding: "8px 12px", borderRadius: "10px",
                    border: energia === key ? `1.5px solid ${val.texto}` : "1.5px solid transparent",
                    background: energia === key ? val.color : "#f5f5f0",
                    color: energia === key ? val.texto : "#888",
                    fontSize: "12px", cursor: "pointer",
                    fontWeight: energia === key ? 600 : 400,
                    display: "flex", alignItems: "center", gap: "8px", textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "16px" }}>{val.emoji}</span>
                  <span>{val.label}</span>
                </button>
              ))}
            </div>
 
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={cerrarModal}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", border: `0.5px solid ${borderCard}`, background: "transparent", color: "#666", fontSize: "13px", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={guardarActividad}
                disabled={!nombre.trim()}
                style={{
                  flex: 2, padding: "10px", borderRadius: "10px", border: "none",
                  background: nombre.trim() ? colorAccion : "#ccc",
                  color: "white", fontSize: "13px",
                  cursor: nombre.trim() ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
              >
                {actividadEdit ? "Guardar cambios" : "Agregar actividad"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
 
const labelStyle = (color: string): React.CSSProperties => ({
  display: "block",
  fontSize: "11px",
  fontWeight: 600,
  color,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: "6px",
});