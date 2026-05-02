"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  doc, setDoc, getDoc,
  collection, query, where, limit, getDocs, orderBy
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";

// --- TIPOS Y CONSTANTES ---
const TIPOS_COLOR: Record<string, { color: string; texto: string; emoji: string }> = {
  clase:     { color: "#DCF0F5", texto: "#2a6a7c", emoji: "📖" },
  estudio:   { color: "#E2F2E2", texto: "#2a6a2a", emoji: "✏️" },
  trabajo:   { color: "#FAF0DC", texto: "#7a6020", emoji: "💼" },
  descanso:  { color: "#EEF7F2", texto: "#2a6a48", emoji: "🌿" },
  personal:  { color: "#FAF0EC", texto: "#7a4030", emoji: "🌟" },
  ejercicio: { color: "#E8F5EE", texto: "#2a6a40", emoji: "🏃" },
};

const emociones = [
  { label: "Genial",    emoji: "✨", color: "#52C788", fondo: "#EDFBF3", nivel: 6, descripcion: "Me siento con energía y listo para todo" },
  { label: "Tranquilo", emoji: "🌿", color: "#7DBF9E", fondo: "#F0FAF4", nivel: 5, descripcion: "Estoy bien, en calma y enfocado" },
  { label: "Nervioso",  emoji: "🌤️", color: "#E8C84A", fondo: "#FDFBEA", nivel: 4, descripcion: "Siento algo de inquietud o preocupación" },
  { label: "Agobiado",  emoji: "🍂", color: "#E8A157", fondo: "#FEF6ED", nivel: 3, descripcion: "Hay demasiado y no sé por dónde empezar" },
  { label: "Frustrado", emoji: "🌧️", color: "#E87A6A", fondo: "#FEF0EE", nivel: 2, descripcion: "Las cosas no están saliendo como quiero" },
  { label: "Burnout",   emoji: "🌑", color: "#C45C5C", fondo: "#FAF0F0", nivel: 1, descripcion: "Estoy agotado, necesito descansar" },
];

const toDate = (fecha: any): Date => {
  if (!fecha) return new Date(0);
  if (fecha instanceof Date) return fecha;
  if (typeof fecha.toDate === "function") return fecha.toDate();
  if (fecha.seconds !== undefined) return new Date(fecha.seconds * 1000);
  return new Date(fecha);
};

const horaAMin = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + (mm || 0);
};

const DIAS_ES    = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DIAS_GRID  = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const DIAS_CORTO = ["L","Ma","Mi","J","V","S","D"];
const HORAS_MINI = Array.from({ length: 14 }, (_, i) => i + 8);
const ALTURA_MINI = 40;

type Actividad = { id: string; nombre: string; tipo: string; horaInicio: string; horaFin: string; };
type Evento    = { id: string; titulo: string; fecha: any; tipo: string; completado?: boolean; };
type Horario   = { [dia: string]: Actividad[] };

export default function Dashboard() {
  const [emocionSeleccionada, setEmocionSeleccionada] = useState<number | null>(null);
  const [mostrarContenido, setMostrarContenido]       = useState(false);
  const [currentUser, setCurrentUser]                 = useState(auth.currentUser);
  const [nombreUsuario, setNombreUsuario]             = useState("");
  const [nivelEmocion, setNivelEmocion]               = useState(5);
  const [horarioCompleto, setHorarioCompleto]         = useState<Horario>({});
  const [actividadesHoy, setActividadesHoy]           = useState<Actividad[]>([]);
  const [proximosEventos, setProximosEventos]         = useState<Evento[]>([]);
  const [diaResaltado, setDiaResaltado]               = useState("");
  
  // --- NUEVOS ESTADOS DE INTELIGENCIA ADAPTATIVA ---
  const [mensajeCapitanIA, setMensajeCapitanIA]       = useState("");
  const [metodoEstudio, setMetodoEstudio]             = useState("Pomodoro");

  const router = useRouter();
  const diaActualNombre = DIAS_ES[new Date().getDay()];

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (!user) return;
      setNombreUsuario(user.displayName || "");
      setDiaResaltado(diaActualNombre);
      const checkinDoc = await getDoc(doc(db, "checkins", `${user.uid}_${new Date().toDateString()}`));
      if (checkinDoc.exists()) {
        setNivelEmocion(checkinDoc.data().nivel ?? 5);
        setMostrarContenido(true);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!mostrarContenido || !currentUser) return;
    
    const cargarInteligenciaCapitan = async () => {
      try {
        // 1. Obtener método de estudio preferido
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const metodo = userDoc.exists() ? userDoc.data().metodo : "Pomodoro";
        setMetodoEstudio(metodo);

        // 2. Analizar historial de 14 días para detectar patrones
        const hace14Dias = new Date();
        hace14Dias.setDate(hace14Dias.getDate() - 14);

        const qPatron = query(
          collection(db, "checkins"),
          where("uid", "==", currentUser.uid),
          where("fecha", ">=", hace14Dias),
          orderBy("fecha", "desc")
        );
        
        const snapPatron = await getDocs(qPatron);
        const registros = snapPatron.docs.map(d => d.data());
        const n = nombreUsuario ? nombreUsuario.split(" ")[0] : "Jess";
        
        // 3. Generar mensaje proactivo del Capitán basado en datos
        if (registros.length > 0) {
          const diaSemanaHoy = new Date().getDay();
          const historicoMismoDia = registros.filter(r => toDate(r.fecha).getDay() === diaSemanaHoy);
          const sumaNivel = historicoMismoDia.reduce((acc, curr) => acc + curr.nivel, 0);
          const promedioHoy = historicoMismoDia.length > 0 ? sumaNivel / historicoMismoDia.length : 5;

          if (promedioHoy < 3) {
            setMensajeCapitanIA(`Hola ${n}. He notado que los ${DIAS_ES[diaSemanaHoy]} suelen ser agotadores para ti. ¿Qué tal si hoy priorizamos el descanso y tareas ligeras?`);
          } else if (nivelEmocion < 3 && metodo === "Pomodoro") {
            setMensajeCapitanIA(`Veo que hoy el ánimo está bajo, ${n}. Pomodoro puede ser mucha presión; intentemos sesiones de estudio libre sin reloj hoy.`);
          } else if (nivelEmocion >= 5) {
            setMensajeCapitanIA(`¡Oh Capitán, mi Capitán! Tienes una energía increíble hoy, ${n}. Es el momento ideal para avanzar en tus retos más grandes.`);
          } else {
            setMensajeCapitanIA(`Hola ${n}. Un paso a la vez es suficiente por hoy. Recuerda que estoy aquí para ayudarte a dividir tus tareas.`);
          }
        } else {
          setMensajeCapitanIA(`¡Bienvenida, ${n}! Estoy aprendiendo de tus ritmos. Por ahora, cuéntame: ¿en qué puedo ayudarte a enfocar tu mente hoy?`);
        }
      } catch (e) { console.error("Error Capitan IA:", e); }
    };

    const cargarModulos = async () => {
      try {
        const snapH = await getDoc(doc(db, "horarios", currentUser.uid));
        if (snapH.exists()) {
          const h = snapH.data() as Horario;
          setHorarioCompleto(h);
          setActividadesHoy((h[diaActualNombre] ?? []).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)));
        }
        const snapE = await getDocs(query(
          collection(db, "eventos"),
          where("uid", "==", currentUser.uid),
          where("completado", "==", false),
          limit(20)
        ));
        const eventos = snapE.docs
          .map(d => ({ id: d.id, ...d.data() } as Evento))
          .filter(e => toDate(e.fecha) >= new Date())
          .sort((a, b) => toDate(a.fecha).getTime() - toDate(b.fecha).getTime())
          .slice(0, 4);
        setProximosEventos(eventos);
      } catch(e) { console.error(e); }
    };

    cargarInteligenciaCapitan();
    cargarModulos();
  }, [mostrarContenido, currentUser, nivelEmocion, nombreUsuario]);

  const seleccionarEmocion = async (index: number) => {
    setEmocionSeleccionada(index);
    const emocion = emociones[index];
    setNivelEmocion(emocion.nivel);
    if (currentUser) {
      await setDoc(doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`), {
        uid: currentUser.uid, emocion: emocion.label, nivel: emocion.nivel, fecha: new Date()
      });
      // Sincronizamos con el perfil de usuario para acceso global
      await setDoc(doc(db, "users", currentUser.uid), { nivelActual: emocion.nivel }, { merge: true });
    }
    setTimeout(() => setMostrarContenido(true), 400);
  };

  const formatearFecha = (fecha: any) => {
    const d = toDate(fecha);
    const diff = Math.ceil((d.getTime() - new Date().getTime()) / (1000*60*60*24));
    if (diff === 0) return "Hoy";
    if (diff === 1) return "Mañana";
    if (diff <= 7)  return `En ${diff} días`;
    return d.toLocaleDateString("es-GT", { day: "numeric", month: "short" });
  };

  const urgenciaColor = (fecha: any) => {
    const diff = Math.ceil((toDate(fecha).getTime() - new Date().getTime()) / (1000*60*60*24));
    if (diff <= 1) return "#E87A6A";
    if (diff <= 3) return "#E8A157";
    if (diff <= 7) return "#E8C84A";
    return "#7DBF9E";
  };

  const horaActual      = new Date().getHours() * 60 + new Date().getMinutes();
  const actividadActual = actividadesHoy.find(a =>
    horaAMin(a.horaInicio) <= horaActual && horaActual < horaAMin(a.horaFin)
  );
  const actividadesDiaResalt = (horarioCompleto[diaResaltado] ?? [])
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const colorTitulo = getTextoPrincipal(nivelEmocion);   // ← NUEVO
  const colorSub    = getTextoSecundario(nivelEmocion);  // ← NUEVO

  if (!mostrarContenido) {
    return (
      <main style={{ display:"flex", minHeight:"100vh", background:"#F5F5DC" }}>
        <section style={{ flex:1, padding:"32px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <h1 style={{ fontSize:"24px", fontWeight:500, margin:"0 0 6px", textAlign:"center", color:"#27500A" }}>¿Cómo llegaste hoy?</h1>
          <p style={{ fontSize:"14px", color:"#888", margin:"0 0 32px", textAlign:"center" }}>Tu respuesta ajusta tu sesión de estudio</p>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px", width:"100%", maxWidth:"440px" }}>
            {emociones.map((e, i) => (
              <div
                key={i}
                onClick={() => seleccionarEmocion(i)}
                style={{ display:"flex", alignItems:"center", gap:"16px", padding:"16px 20px", borderRadius:"14px", border:`1px solid ${e.color}`, background: emocionSeleccionada===i ? e.fondo : "white", cursor:"pointer", transition:"background 0.2s" }}
              >
                <span style={{ fontSize:"28px" }}>{e.emoji}</span>
                <div>
                  <p style={{ fontSize:"15px", fontWeight:500, color:"#333", margin:"0 0 3px" }}>{e.label}</p>
                  <p style={{ fontSize:"13px", color:"#888", margin:0 }}>{e.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display:"flex", minHeight:"100vh", background:bgPage, transition:"background 0.6s ease" }}>
      <div className="page-scroll">
        <section style={{ flex:1, padding:"32px" }}>

          {/* ── CAMBIO 1: color del h1 ahora viene del semáforo ── */}
          <h1 style={{ fontSize:"24px", fontWeight:800, margin:"0 0 4px", color: colorTitulo }}>
            {nombreUsuario ? `Hola, ${nombreUsuario.split(" ")[0]} 👋` : "Tu Espacio de Calma"}
          </h1>
          {/* ── CAMBIO 2: color del subtítulo ahora viene del semáforo ── */}
          <p style={{ fontSize:"14px", color: colorSub, margin:"0 0 28px" }}>Un día a la vez, un paso a la vez</p>

          {/* ── CARDS MÓDULOS ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"16px", marginBottom:"24px" }}>

            {/* CAPITÁN CON INTELIGENCIA ADAPTATIVA */}
            <div onClick={() => router.push("/capitan")} style={{ 
              background:"white", 
              borderRadius:"16px", 
              padding:"20px", 
              border:`1.5px solid ${borderCard}`,
              cursor:"pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <p style={{ fontSize:"13px", color:"#aaa", margin:0 }}>⏳ El Capitán</p>
                <span style={{ fontSize: "10px", background: "#f0f7f0", color: "#95bd79", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>Modo Adaptativo</span>
              </div>
              <p style={{ fontSize:"14px", color:"#444", margin:0, lineHeight:1.7 }}>
                {mensajeCapitanIA || "¡Oh Capitán, mi Capitán! Estoy analizando tu semana para guiarte mejor hoy..."}
              </p>
            </div>

            <div onClick={() => router.push("/calendario")} style={{ background:"white", borderRadius:"16px", padding:"20px", border:`0.5px solid #eee`, cursor:"pointer" }}>
              <p style={{ fontSize:"13px", color:"#aaa", margin:"0 0 10px" }}>📅 Próximos eventos</p>
              {proximosEventos.length === 0 ? (
                <p style={{ fontSize:"14px", color:"#bbb", margin:0 }}>Sin entregas próximas ✓</p>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {proximosEventos.slice(0, 3).map(ev => (
                    <div key={ev.id} style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:urgenciaColor(ev.fecha), flexShrink:0 }}/>
                      <span style={{ fontSize:"13px", color:"#444", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{ev.titulo}</span>
                      <span style={{ fontSize:"12px", color:urgenciaColor(ev.fecha), fontWeight:500, flexShrink:0 }}>{formatearFecha(ev.fecha)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div onClick={() => router.push("/apuntes")} style={{ background:"white", borderRadius:"16px", padding:"20px", border:`0.5px solid #eee`, cursor:"pointer" }}>
              <p style={{ fontSize:"13px", color:"#aaa", margin:"0 0 10px" }}>📚 Apuntes</p>
              <p style={{ fontSize:"14px", color:"#444", margin:"0 0 4px", fontWeight:500 }}>Tus notas organizadas</p>
              <p style={{ fontSize:"13px", color:"#888", margin:0 }}>Sube y organiza tu material</p>
            </div>

            <div onClick={() => router.push("/juegos")} style={{ background:"white", borderRadius:"16px", padding:"20px", border:`0.5px solid #eee`, cursor:"pointer" }}>
              <p style={{ fontSize:"13px", color:"#aaa", margin:"0 0 10px" }}>🎮 Juegos</p>
              <p style={{ fontSize:"14px", color:"#444", margin:"0 0 4px", fontWeight:500 }}>Repasa sin estrés</p>
              <p style={{ fontSize:"13px", color:"#888", margin:0 }}>Flashcards y ejercicios</p>
            </div>

          </div>

          {/* ── GRID SEMANAL (Tu diseño original intacto) ── */}
          <div style={{
            background: "white",
            borderRadius: "16px",
            border: `0.5px solid ${borderCard}`,
            marginBottom: "24px",
            overflow: "hidden",
            maxHeight: "440px",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{ padding:"16px 24px", borderBottom:`0.5px solid ${borderCard}`, display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <div>
                <p style={{ margin:0, fontSize:"13px", color:"#aaa" }}>🗓️ Semana típica</p>
                <p style={{ margin:"4px 0 0", fontSize:"16px", fontWeight:600, color:"#95bd79" }}>Panorama semanal</p>
              </div>
              <button
                onClick={() => router.push("/horario")}
                style={{ background:"transparent", border:`0.5px solid ${borderCard}`, borderRadius:"8px", padding:"8px 16px", fontSize:"13px", color:"#95bd79", cursor:"pointer" }}
              >
                Editar horario →
              </button>
            </div>

            <div style={{ flex:1, overflowY:"auto", overflowX:"auto" }}>
              <div style={{ minWidth:"600px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"48px repeat(7,1fr)", borderBottom:`0.5px solid ${borderCard}`, position:"sticky", top:0, background:"white", zIndex:2 }}>
                  <div/>
                  {DIAS_GRID.map((dia, i) => {
                    const esHoy    = dia === diaActualNombre;
                    const esResalt = dia === diaResaltado;
                    return (
                      <div
                        key={dia}
                        onClick={() => setDiaResaltado(dia)}
                        style={{ padding:"10px 4px", textAlign:"center", fontSize:"13px", fontWeight:esResalt?700:500, color:esResalt?"#95bd79":"#aaa", borderLeft:`0.5px solid ${borderCard}`, cursor:"pointer", background:esResalt?"rgba(178,216,178,0.2)":"transparent", borderBottom:esResalt?"2px solid #27500A":"2px solid transparent" }}
                      >
                        {DIAS_CORTO[i]}
                        {esHoy && <span style={{ display:"block", width:"6px", height:"6px", borderRadius:"50%", background:"#52C788", margin:"3px auto 0" }}/>}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"48px repeat(7,1fr)" }}>
                  <div>
                    {HORAS_MINI.map(hora => (
                      <div key={hora} style={{ height:`${ALTURA_MINI}px`, borderBottom:`0.5px solid ${borderCard}`, display:"flex", alignItems:"flex-start", justifyContent:"flex-end", paddingRight:"8px", paddingTop:"4px" }}>
                        <span style={{ fontSize:"11px", color:"#ccc" }}>{String(hora).padStart(2,"0")}:00</span>
                      </div>
                    ))}
                  </div>
                  {DIAS_GRID.map(dia => {
                    const esResalt = dia === diaResaltado;
                    return (
                      <div
                        key={dia}
                        onClick={() => setDiaResaltado(dia)}
                        style={{ borderLeft:`0.5px solid ${borderCard}`, position:"relative", background:esResalt?"rgba(178,216,178,0.1)":"transparent", cursor:"pointer" }}
                      >
                        {HORAS_MINI.map(hora => (
                          <div key={hora} style={{ height:`${ALTURA_MINI}px`, borderBottom:`0.5px solid ${borderCard}` }}/>
                        ))}
                        {(horarioCompleto[dia] ?? []).map(act => {
                          const inicioMin = horaAMin(act.horaInicio) - 8*60;
                          const durMin    = horaAMin(act.horaFin) - horaAMin(act.horaInicio);
                          if (inicioMin < 0 || durMin <= 0) return null;
                          const top    = (inicioMin / 60) * ALTURA_MINI;
                          const height = Math.max((durMin / 60) * ALTURA_MINI - 2, 16);
                          const tc     = TIPOS_COLOR[act.tipo] ?? { color:"#E8EDE8", texto:"#555", emoji:"📌" };
                          return (
                            <div
                              key={act.id}
                              title={`${act.nombre} · ${act.horaInicio}–${act.horaFin}`}
                              style={{ position:"absolute", top:`${top}px`, left:"3px", right:"3px", height:`${height}px`, background:tc.color, borderRadius:"6px", borderLeft:`3px solid ${tc.texto}`, overflow:"hidden", zIndex:2, padding:"3px 6px", boxSizing:"border-box" }}
                            >
                              {height >= 24 && (
                                <div style={{ display:"flex", alignItems:"center", gap:"3px" }}>
                                  <span style={{ fontSize:"13px" }}>{tc.emoji}</span>
                                  {height >= 36 && (
                                    <span style={{ fontSize:"11px", fontWeight:600, color:tc.texto, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.nombre}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ padding:"12px 24px", borderTop:`0.5px solid ${borderCard}`, display:"flex", gap:"8px", flexWrap:"wrap", alignItems:"center", minHeight:"48px", flexShrink:0, background:"white" }}>
              {actividadesDiaResalt.length > 0 ? (
                <>
                  <span style={{ fontSize:"13px", color:"#7DBF9E", fontWeight:600, marginRight:"4px" }}>{diaResaltado}:</span>
                  {actividadesDiaResalt.map(act => {
                    const tc = TIPOS_COLOR[act.tipo] ?? { color:"#E8EDE8", texto:"#555", emoji:"📌" };
                    return (
                      <span key={act.id} style={{ fontSize:"12px", background:tc.color, color:tc.texto, padding:"4px 12px", borderRadius:"20px", fontWeight:500 }}>
                        {tc.emoji} {act.nombre} · {act.horaInicio}
                      </span>
                    );
                  })}
                </>
              ) : (
                <span style={{ fontSize:"13px", color:"#ccc" }}>Sin actividades para {diaResaltado}</span>
              )}
            </div>
          </div>

          {/* ── HOY (Tu diseño original intacto) ── */}
          <div style={{ background:"white", borderRadius:"16px", border:`0.5px solid ${borderCard}`, overflow:"hidden", marginBottom:"32px" }}>
            <div style={{ padding:"16px 24px", borderBottom:`0.5px solid ${borderCard}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <p style={{ margin:0, fontSize:"13px", color:"#aaa" }}>📅 Hoy · {diaActualNombre}</p>
                <p style={{ margin:"4px 0 0", fontSize:"16px", fontWeight:600, color:"#95bd79" }}>Tu día de hoy</p>
              </div>
            </div>

            {actividadActual && (
              <div style={{ margin:"16px 24px 8px", padding:"14px 18px", background:TIPOS_COLOR[actividadActual.tipo]?.color ?? "#E8EDE8", borderRadius:"12px", borderLeft:`4px solid ${TIPOS_COLOR[actividadActual.tipo]?.texto ?? "#333"}` }}>
                <p style={{ margin:"0 0 4px", fontSize:"11px", color:TIPOS_COLOR[actividadActual.tipo]?.texto, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px" }}>Ahora mismo</p>
                <p style={{ margin:0, fontSize:"16px", fontWeight:600, color:TIPOS_COLOR[actividadActual.tipo]?.texto }}>
                  {TIPOS_COLOR[actividadActual.tipo]?.emoji} {actividadActual.nombre}
                </p>
                <p style={{ margin:"4px 0 0", fontSize:"13px", color:TIPOS_COLOR[actividadActual.tipo]?.texto, opacity:0.7 }}>
                  {actividadActual.horaInicio} – {actividadActual.horaFin}
                </p>
              </div>
            )}

            <div style={{ padding:"12px 24px 24px" }}>
              {actividadesHoy.length === 0 ? (
                <div style={{ textAlign:"center", padding:"32px 0" }}>
                  <p style={{ fontSize:"15px", color:"#aaa", margin:"0 0 12px" }}>No tienes actividades para hoy</p>
                  <button onClick={() => router.push("/horario")} style={{ background:"#B2D8B2", color:"#95bd79", border:"none", borderRadius:"8px", padding:"10px 20px", fontSize:"13px", fontWeight:500, cursor:"pointer" }}>Configurar horario</button>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {actividadesHoy.map(act => {
                    const ini       = horaAMin(act.horaInicio);
                    const isPasada = ini < horaActual;
                    const isActual = act.id === actividadActual?.id;
                    const tc       = TIPOS_COLOR[act.tipo] ?? { color:"#E8EDE8", texto:"#555", emoji:"📌" };
                    return (
                      <div key={act.id} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"12px 16px", borderRadius:"12px", background:isActual?tc.color:isPasada?"#fafaf8":"white", opacity:isPasada&&!isActual?0.5:1, border:isActual?`1px solid ${tc.texto}30`:`0.5px solid ${borderCard}` }}>
                        <div style={{ width:"4px", height:"40px", borderRadius:"2px", background:tc.color, border:`1.5px solid ${tc.texto}40`, flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <p style={{ margin:0, fontSize:"14px", fontWeight:isActual?600:400, color:isPasada?"#bbb":"#333" }}>{tc.emoji} {act.nombre}</p>
                          <p style={{ margin:"3px 0 0", fontSize:"12px", color:"#aaa" }}>{act.horaInicio} – {act.horaFin}</p>
                        </div>
                        {isPasada && !isActual && <span style={{ fontSize:"14px", color:"#ddd" }}>✓</span>}
                        {isActual && <span style={{ fontSize:"12px", background:tc.color, color:tc.texto, padding:"3px 10px", borderRadius:"20px", fontWeight:600 }}>Ahora</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </section>
      </div>
    </main>
  );
}