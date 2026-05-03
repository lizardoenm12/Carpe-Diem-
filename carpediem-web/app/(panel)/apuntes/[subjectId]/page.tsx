"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc, collection, deleteDoc, doc, getDoc, getDocs,
  query, where, updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useParams, useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";
import { getPoemaAleatorio, type NivelEmocional } from "@/lib/poemas";

/* ─── TYPES ─── */

type Subject = { id?: string; uid: string; name: string; createdAt?: any };

type SubjectFile = {
  id?: string; uid: string; subjectId: string;
  fileName: string; fileType: string; downloadURL: string; storagePath: string;
};

type ChatMessage = { role: "user" | "captain"; text: string };

type Topic = {
  id: string; subjectId: string; nombre: string;
  semaforo: "rojo" | "amarillo" | "verde" | "sin_evaluar";
};

type Pregunta = { pregunta: string; opciones: string[]; correcta: string };


/* ─── SEMÁFORO ENTENDIMIENTO ─── */

const SEMAFORO_CONFIG = {
  rojo:        { bg: "#FEF0EE", borde: "#E87A6A", texto: "#7a1a10", label: "Necesita repasar", emoji: "🔴" },
  amarillo:    { bg: "#FDFBEA", borde: "#E8C84A", texto: "#7a6020", label: "En proceso",       emoji: "🟡" },
  verde:       { bg: "#E2F2E2", borde: "#3a7a3a", texto: "#1a5a1a", label: "Dominado",         emoji: "🟢" },
  sin_evaluar: { bg: "#f5f5f0", borde: "#ddd",    texto: "#888",    label: "Sin evaluar",      emoji: "⚪" },
};

const calcularSemaforo = (correctas: number): Topic["semaforo"] => {
  if (correctas >= 8) return "verde";
  if (correctas >= 5) return "amarillo";
  return "rojo";
};

/* ─── COMPONENT ─── */

export default function SubjectDetailPage() {
  const params    = useParams();
  const router    = useRouter();
  const fileInputRef      = useRef<HTMLInputElement | null>(null);
  const programaInputRef  = useRef<HTMLInputElement | null>(null);
  const chatEndRef        = useRef<HTMLDivElement | null>(null);

  const subjectId  = params.subjectId as string;
  const currentUser = auth.currentUser;

  /* ─── STATE ─── */
  const [subject, setSubject]           = useState<Subject | null>(null);
  const [files, setFiles]               = useState<SubjectFile[]>([]);
  const [savedChats, setSavedChats]     = useState<any[]>([]);
  const [topics, setTopics]             = useState<Topic[]>([]);
  const [nivelEmocion, setNivelEmocion] = useState(5);

  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState(false);
  const [subiendoPrograma, setSubiendoPrograma] = useState(false);

  /* Chat */
  const [question, setQuestion]         = useState("");
  const [messages, setMessages]         = useState<ChatMessage[]>([{
    role: "captain",
    text: "Hola. Soy el Capitán. Este chat pertenece a esta materia. Puedes hacer preguntas y luego guardar la conversación aquí mismo.",
  }]);
  const [enviando, setEnviando]         = useState(false);
  const [activeChatTitle, setActiveChatTitle] = useState<string | null>(null);
  const [chatsAbiertos, setChatsAbiertos]     = useState(false);

  /* Nuevo tema manual */
  const [nuevoTema, setNuevoTema]       = useState("");
  const [agregandoTema, setAgregandoTema] = useState(false);

  /* Quiz modal */
  const [quizAbierto, setQuizAbierto]         = useState(false);
  const [topicActivo, setTopicActivo]         = useState<Topic | null>(null);
  const [preguntasQuiz, setPreguntasQuiz]     = useState<Pregunta[]>([]);
  const [preguntaActual, setPreguntaActual]   = useState(0);
  const [respuestas, setRespuestas]           = useState<string[]>([]);
  const [respuestaElegida, setRespuestaElegida] = useState<string | null>(null);
  const [quizTerminado, setQuizTerminado]     = useState(false);
  const [cargandoQuiz, setCargandoQuiz]       = useState(false);
  const [errorQuiz, setErrorQuiz]             = useState("");

  /* ─── LOAD ─── */

  useEffect(() => {
    const cargar = async () => {
      if (!subjectId) return;
      setLoading(true);
      try {
        /* Checkin emocional */
        if (currentUser) {
          const snapC = await getDoc(doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`));
          if (snapC.exists()) setNivelEmocion(snapC.data().nivel ?? 5);
        }
        await fetchSubject();
        await fetchFiles();
        await fetchSavedChats();
        await fetchTopics();
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, [subjectId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ─── FETCH ─── */

  const fetchSubject = async () => {
    const snap = await getDoc(doc(db, COLLECTIONS.subjects, subjectId));
    setSubject(snap.exists() ? { id: snap.id, ...snap.data() as Omit<Subject,"id"> } : null);
  };

  const fetchFiles = async () => {
    const snap = await getDocs(query(collection(db, COLLECTIONS.subjectFiles), where("subjectId","==",subjectId)));
    setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubjectFile)));
  };

  const fetchSavedChats = async () => {
    const snap = await getDocs(query(collection(db, COLLECTIONS.subjectChats), where("subjectId","==",subjectId)));
    setSavedChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchTopics = async () => {
    const snap = await getDocs(query(collection(db, "subjectTopics"), where("subjectId","==",subjectId)));
    setTopics(snap.docs.map(d => ({ id: d.id, ...d.data() } as Topic)));
  };

  /* ─── ARCHIVOS ─── */

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 5 * 1024 * 1024) { alert("Máximo 5MB por archivo."); return; }
    setUploading(true);
    try {
      const path = `subjects/${currentUser.uid}/${subjectId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await addDoc(collection(db, COLLECTIONS.subjectFiles), {
        uid: currentUser.uid, subjectId, fileName: file.name,
        fileType: file.type, downloadURL, storagePath: path, createdAt: new Date(),
      });
      await fetchFiles();
    } catch (err) { console.error(err); alert("Error subiendo archivo."); }
    finally { setUploading(false); e.target.value = ""; }
  };

  /* ─── PROGRAMA DEL CURSO ─── */

  const handleProgramaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    if (file.size > 10 * 1024 * 1024) { alert("Máximo 10MB para el programa."); return; }

    const tiposValidos = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
    if (!tiposValidos.includes(file.type)) { alert("Solo se aceptan PDF, PNG, JPG o WEBP."); return; }

    setSubiendoPrograma(true);
    try {
      /* Convertir a base64 */
      const base64 = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res((reader.result as string).split(",")[1]);
        reader.onerror = () => rej(new Error("Error leyendo archivo"));
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/apuntes-programa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archivoBase64: base64, mimeType: file.type,
          subjectId, uid: currentUser.uid,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.temas) {
        alert(data.error ?? "No se pudieron extraer los temas. Intenta con otro archivo.");
        return;
      }

      if (data.temas.length === 0) {
        alert("La IA no encontró temas en este archivo. ¿Es realmente un programa de curso?");
        return;
      }

      /* Guardar cada tema en Firestore */
      for (const nombre of data.temas as string[]) {
        await addDoc(collection(db, "subjectTopics"), {
          subjectId, nombre, semaforo: "sin_evaluar", creadoEn: new Date(),
        });
      }

      await fetchTopics();
      alert(`✅ Se extrajeron ${data.temas.length} temas del programa.`);
    } catch (err) {
      console.error(err);
      alert("Error procesando el programa del curso.");
    } finally {
      setSubiendoPrograma(false);
      e.target.value = "";
    }
  };

  /* ─── TEMAS MANUALES ─── */

  const agregarTemaManualment = async () => {
    if (!nuevoTema.trim() || !currentUser) return;
    try {
      await addDoc(collection(db, "subjectTopics"), {
        subjectId, nombre: nuevoTema.trim(), semaforo: "sin_evaluar", creadoEn: new Date(),
      });
      setNuevoTema("");
      setAgregandoTema(false);
      await fetchTopics();
    } catch (e) { console.error(e); }
  };

  const eliminarTopic = async (id: string) => {
    if (!confirm("¿Eliminar este tema?")) return;
    await deleteDoc(doc(db, "subjectTopics", id));
    await fetchTopics();
  };

  /* ─── CHAT ─── */

  const handleSendQuestion = async () => {
    if (!question.trim() || enviando) return;
    const userMsg: ChatMessage = { role: "user", text: question.trim() };
    setMessages(prev => [...prev, userMsg]);
    setQuestion("");
    setEnviando(true);

    try {
      const res = await fetch("/api/capitan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: userMsg.text,
          contexto: `Estás ayudando con la materia "${subject?.name}". Responde como el Capitán Keating.`,
          nivelEmocion,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "captain", text: data.respuesta ?? "Hmm, déjame pensar en eso..." }]);
    } catch {
      setMessages(prev => [...prev, { role: "captain", text: "No pude conectarme ahora. Intenta de nuevo." }]);
    } finally { setEnviando(false); }
  };

  const saveCurrentChat = async () => {
    if (!currentUser) return;
    const hasUser = messages.some(m => m.role === "user");
    if (!hasUser) { alert("Escribe algo primero."); return; }
    try {
      const firstMsg = messages.find(m => m.role === "user")?.text ?? subject?.name ?? "Chat";
      const title = firstMsg.length > 50 ? firstMsg.slice(0,50) + "..." : firstMsg;
      const chatRef = await addDoc(collection(db, COLLECTIONS.subjectChats), {
        uid: currentUser.uid, subjectId, title, createdAt: new Date(), updatedAt: new Date(),
      });
      for (const m of messages) {
        await addDoc(collection(db, COLLECTIONS.subjectChatMessages), {
          chatId: chatRef.id, uid: currentUser.uid, subjectId,
          role: m.role, text: m.text, createdAt: new Date(),
        });
      }
      await fetchSavedChats();
      alert("Conversación guardada.");
    } catch (e) { console.error(e); }
  };

const openSavedChat = async (chat: any) => {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.subjectChatMessages),
      where("chatId", "==", chat.id)
    )
  );

  const loaded = snap.docs
    .map(d => {
      const data = d.data();
      return {
        role: (data.role === "user" ? "user" : "captain") as "user" | "captain",
        text: data.text as string,
        orden: data.createdAt?.seconds ?? 0,
      };
    })
    .sort((a, b) => a.orden - b.orden)
    .map(({ role, text }) => ({ role, text }));

  setMessages(loaded);
  setActiveChatTitle(chat.title ?? "Conversación guardada");
  setChatsAbiertos(false);
};

  const deleteChat = async (chatId: string) => {
    if (!confirm("¿Eliminar esta conversación?")) return;
    const snap = await getDocs(query(collection(db, COLLECTIONS.subjectChatMessages), where("chatId","==",chatId)));
    for (const m of snap.docs) await deleteDoc(doc(db, COLLECTIONS.subjectChatMessages, m.id));
    await deleteDoc(doc(db, COLLECTIONS.subjectChats, chatId));
    await fetchSavedChats();
  };

  /* ─── QUIZ ─── */

  const abrirQuiz = async (topic: Topic) => {
    setTopicActivo(topic);
    setQuizAbierto(true);
    setCargandoQuiz(true);
    setErrorQuiz("");
    setPreguntaActual(0);
    setRespuestas([]);
    setRespuestaElegida(null);
    setQuizTerminado(false);

    try {
      const res = await fetch("/api/apuntes-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tema: topic.nombre, subjectName: subject?.name }),
      });
      const data = await res.json();
      if (!res.ok || !data.preguntas) {
        setErrorQuiz(data.error ?? "Error generando el cuestionario.");
        return;
      }
      setPreguntasQuiz(data.preguntas);
    } catch {
      setErrorQuiz("No se pudo conectar con la IA. Intenta de nuevo.");
    } finally { setCargandoQuiz(false); }
  };

  const elegirRespuesta = (letra: string) => {
    if (respuestaElegida) return;
    setRespuestaElegida(letra);
  };

  const siguientePregunta = () => {
    const nuevasRespuestas = [...respuestas, respuestaElegida ?? ""];
    setRespuestas(nuevasRespuestas);
    setRespuestaElegida(null);

    if (preguntaActual + 1 >= preguntasQuiz.length) {
      finalizarQuiz(nuevasRespuestas);
    } else {
      setPreguntaActual(prev => prev + 1);
    }
  };

  const finalizarQuiz = async (todasRespuestas: string[]) => {
    setQuizTerminado(true);
    const correctas = todasRespuestas.filter((r,i) => r === preguntasQuiz[i]?.correcta).length;
    const nuevoSemaforo = calcularSemaforo(correctas);

    try {
      if (topicActivo) {
        await updateDoc(doc(db, "subjectTopics", topicActivo.id), { semaforo: nuevoSemaforo });
        if (currentUser) {
          await addDoc(collection(db, "subjectQuizResults"), {
            subjectId, topicId: topicActivo.id,
            puntaje: correctas, total: preguntasQuiz.length,
            semaforo: nuevoSemaforo, fecha: new Date(), uid: currentUser.uid,
          });
        }
        await fetchTopics();
      }
    } catch (e) { console.error(e); }
  };

  const cerrarQuiz = () => {
    setQuizAbierto(false);
    setTopicActivo(null);
    setPreguntasQuiz([]);
    setPreguntaActual(0);
    setRespuestas([]);
    setRespuestaElegida(null);
    setQuizTerminado(false);
    setErrorQuiz("");
  };

  /* ─── COLORES ─── */

  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const colorTexto  = getTextoPrincipal(nivelEmocion);
  const colorSecund = getTextoSecundario(nivelEmocion);
  const poema       = getPoemaAleatorio(nivelEmocion as NivelEmocional);

  const correctasFinales = respuestas.filter((r,i) => r === preguntasQuiz[i]?.correcta).length;

  /* ─── LOADING ─── */

  if (loading) {
    return (
      <div style={{ background: bgPage, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <p style={{ color: colorTexto, fontSize:"16px" }}>Cargando materia...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div style={{ background: bgPage, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <p style={{ color: colorTexto }}>La materia no existe.</p>
      </div>
    );
  }

  /* ─── RENDER ─── */

  return (
    <div className="page-scroll" style={{ background: bgPage, minHeight:"100vh", transition:"background 0.6s ease", padding:"32px" }}>

      {/* Botón volver */}
      <button
        onClick={() => router.push("/apuntes")}
        style={{ marginBottom:"20px", padding:"8px 16px", borderRadius:"8px", border:"0.5px solid #c8d8b8", background:"transparent", color:colorTexto, cursor:"pointer", fontSize:"13px", fontWeight:500 }}
      >
        ← Volver a materias
      </button>

      {/* Título + poema */}
      <div style={{ marginBottom:"28px" }}>
        <p style={{ fontSize:"12px", color:colorSecund, margin:"0 0 4px" }}>Apuntes / Materia</p>
        <h1 style={{ fontSize:"32px", margin:"0 0 16px", color:colorTexto, fontWeight:800 }}>{subject.name}</h1>
        <div style={{ borderLeft:"3px solid #B2D8B2", paddingLeft:"16px" }}>
          <p style={{ fontStyle:"italic", fontSize:"15px", color:colorSecund, margin:"0 0 4px", lineHeight:1.7, whiteSpace:"pre-line" }}>
            "{poema.texto}"
          </p>
          <p style={{ fontSize:"12px", color:colorSecund, margin:0, opacity:0.75 }}>— {poema.autor}, {poema.obra}</p>
        </div>
      </div>

      {/* Grid principal */}
      <div style={{ display:"grid", gridTemplateColumns:"1.2fr 0.8fr", gap:"24px", alignItems:"start" }}>

        {/* ── COLUMNA IZQUIERDA ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

          {/* Temas del programa */}
          <section style={{ background:"rgba(255,255,255,0.85)", borderRadius:"16px", padding:"24px", border:`0.5px solid ${borderCard}`, backdropFilter:"blur(8px)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px", flexWrap:"wrap", gap:"10px" }}>
              <div>
                <h2 style={{ fontSize:"17px", margin:"0 0 4px", color:colorTexto, fontWeight:700 }}>Temas del programa</h2>
                <p style={{ fontSize:"13px", color:colorSecund, margin:0 }}>Haz click en "Cuestionario" para evaluar tu entendimiento</p>
              </div>
              <button
                onClick={() => setAgregandoTema(true)}
                style={{ padding:"8px 14px", borderRadius:"8px", background:"#B2D8B2", border:"none", color:colorTexto, fontSize:"12px", fontWeight:600, cursor:"pointer" }}
              >
                + Agregar tema
              </button>
            </div>

            {/* Input nuevo tema */}
            {agregandoTema && (
              <div style={{ display:"flex", gap:"8px", marginBottom:"14px" }}>
                <input
                  value={nuevoTema}
                  onChange={e => setNuevoTema(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && agregarTemaManualment()}
                  placeholder="Nombre del tema..."
                  autoFocus
                  style={{ flex:1, padding:"10px 12px", borderRadius:"10px", border:"0.5px solid #c8d8b8", fontSize:"13px", outline:"none", color:colorTexto }}
                />
                <button onClick={agregarTemaManualment} style={{ padding:"10px 14px", borderRadius:"10px", background:colorTexto, color:"white", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:600 }}>Guardar</button>
                <button onClick={() => { setAgregandoTema(false); setNuevoTema(""); }} style={{ padding:"10px 14px", borderRadius:"10px", background:"transparent", border:"0.5px solid #ddd", color:"#888", cursor:"pointer", fontSize:"13px" }}>✕</button>
              </div>
            )}

            {topics.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 0", color:colorSecund }}>
                <p style={{ fontSize:"14px", margin:"0 0 8px" }}>Aún no hay temas.</p>
                <p style={{ fontSize:"13px", margin:0 }}>Sube el programa del curso o agrega temas manualmente.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {topics.map(topic => {
                  const sc = SEMAFORO_CONFIG[topic.semaforo];
                  return (
                    <div
                      key={topic.id}
                      style={{ background:sc.bg, borderRadius:"12px", padding:"14px 16px", border:`0.5px solid ${sc.borde}`, display:"flex", alignItems:"center", gap:"12px" }}
                    >
                      <span style={{ fontSize:"16px", flexShrink:0 }}>{sc.emoji}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ margin:"0 0 2px", fontSize:"14px", fontWeight:600, color:sc.texto, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                          {topic.nombre}
                        </p>
                        <p style={{ margin:0, fontSize:"11px", color:sc.texto, opacity:0.75 }}>{sc.label}</p>
                      </div>
                      <div style={{ display:"flex", gap:"6px", flexShrink:0 }}>
                        <button
                          onClick={() => abrirQuiz(topic)}
                          style={{ padding:"6px 12px", borderRadius:"8px", background:"white", border:`0.5px solid ${sc.borde}`, color:sc.texto, fontSize:"12px", fontWeight:600, cursor:"pointer" }}
                        >
                          Cuestionario
                        </button>
                        <button
                          onClick={() => eliminarTopic(topic.id)}
                          style={{ padding:"6px 8px", borderRadius:"8px", background:"transparent", border:"0.5px solid #eee", color:"#ccc", fontSize:"12px", cursor:"pointer" }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ── COLUMNA DERECHA ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

          {/* Chat El Capitán */}
          <section style={{ background:"rgba(255,255,255,0.85)", borderRadius:"16px", padding:"24px", border:`0.5px solid ${borderCard}`, backdropFilter:"blur(8px)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"12px", gap:"10px" }}>
              <div>
                <h2 style={{ fontSize:"17px", margin:"0 0 4px", color:colorTexto, fontWeight:700 }}>⏳ ¡Oh Capitán, Mi Capitán!</h2>
                <p style={{ fontSize:"12px", color:colorSecund, margin:0 }}>
                  {activeChatTitle ? `Conversación: ${activeChatTitle}` : "Pregunta sobre esta materia"}
                </p>
              </div>
              <div style={{ display:"flex", gap:"6px" }}>
                <button
                  onClick={() => setChatsAbiertos(!chatsAbiertos)}
                  style={{ padding:"6px 10px", borderRadius:"8px", border:"0.5px solid #c8d8b8", background:"transparent", color:colorTexto, fontSize:"11px", cursor:"pointer" }}
                >
                  {chatsAbiertos ? "▲ Chats" : "▼ Chats"}
                </button>
                <button
                  onClick={saveCurrentChat}
                  style={{ padding:"6px 10px", borderRadius:"8px", background:"#B2D8B2", border:"none", color:colorTexto, fontSize:"11px", fontWeight:600, cursor:"pointer" }}
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Chats guardados colapsables */}
            {chatsAbiertos && (
              <div style={{ marginBottom:"12px", borderRadius:"10px", border:"0.5px solid #e0e0e0", overflow:"hidden" }}>
                {savedChats.length === 0 ? (
                  <p style={{ padding:"12px", fontSize:"12px", color:"#aaa", margin:0 }}>Sin conversaciones guardadas.</p>
                ) : (
                  savedChats.map(chat => (
                    <div key={chat.id} style={{ display:"flex", alignItems:"center", gap:"8px", padding:"10px 12px", borderBottom:"0.5px solid #f0f0f0" }}>
                      <span style={{ flex:1, fontSize:"12px", color:"#444", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{chat.title ?? "Sin título"}</span>
                      <button onClick={() => openSavedChat(chat)} style={{ padding:"4px 10px", borderRadius:"6px", background:"#E2F2E2", border:"none", color:colorTexto, fontSize:"11px", cursor:"pointer", fontWeight:600 }}>Abrir</button>
                      <button onClick={() => deleteChat(chat.id)} style={{ padding:"4px 8px", borderRadius:"6px", background:"#fee", border:"none", color:"#b04b4b", fontSize:"11px", cursor:"pointer" }}>✕</button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Mensajes */}
            <div style={{ minHeight:"200px", maxHeight:"280px", overflowY:"auto", borderRadius:"12px", background:"#f8faf6", padding:"12px", marginBottom:"12px", display:"flex", flexDirection:"column", gap:"10px" }}>
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth:"85%",
                  background: msg.role === "user" ? "#B2D8B2" : "white",
                  color: msg.role === "user" ? colorTexto : "#444",
                  border: msg.role === "captain" ? "0.5px solid #e0e0e0" : "none",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  padding:"10px 14px", fontSize:"13px", lineHeight:1.6,
                }}>
                  {msg.text}
                </div>
              ))}
              {enviando && (
                <div style={{ alignSelf:"flex-start", background:"white", border:"0.5px solid #e0e0e0", borderRadius:"16px 16px 16px 4px", padding:"10px 14px", fontSize:"13px", color:"#aaa" }}>
                  El Capitán está pensando...
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            {/* Input chat */}
            <div style={{ display:"flex", gap:"8px" }}>
              <input
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendQuestion()}
                placeholder="¡Oh Capitán, mi Capitán!..."
                style={{ flex:1, padding:"10px 12px", borderRadius:"10px", border:"0.5px solid #c8d8b8", fontSize:"13px", outline:"none", color:colorTexto }}
              />
              <button
                onClick={handleSendQuestion}
                disabled={enviando || !question.trim()}
                style={{ padding:"10px 14px", borderRadius:"10px", background: question.trim() ? "#B2D8B2" : "#eee", border:"none", color: question.trim() ? colorTexto : "#aaa", cursor: question.trim() ? "pointer" : "not-allowed", fontSize:"13px", fontWeight:600 }}
              >
                Enviar
              </button>
            </div>
          </section>

          {/* Subir archivos */}
          <section style={{ background:"rgba(255,255,255,0.85)", borderRadius:"16px", padding:"24px", border:`0.5px solid ${borderCard}`, backdropFilter:"blur(8px)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"14px", flexWrap:"wrap", gap:"8px" }}>
              <div>
                <h2 style={{ fontSize:"17px", margin:"0 0 4px", color:colorTexto, fontWeight:700 }}>📎 Subir archivos</h2>
                <p style={{ fontSize:"12px", color:colorSecund, margin:0 }}>PDFs e imágenes de tus apuntes</p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                style={{ padding:"8px 14px", borderRadius:"8px", background: uploading ? "#eee" : "#B2D8B2", border:"none", color: uploading ? "#aaa" : colorTexto, fontSize:"12px", fontWeight:600, cursor: uploading ? "not-allowed" : "pointer" }}
              >
                {uploading ? "Subiendo..." : "+ Subir"}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} style={{ display:"none" }}/>

            {files.length === 0 ? (
              <div style={{ background:"#f8faf6", borderRadius:"10px", padding:"16px", color:colorSecund, fontSize:"13px", textAlign:"center" }}>
                Aún no hay archivos subidos.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                {files.map(file => (
                  <div key={file.id} style={{ display:"flex", alignItems:"center", gap:"10px", padding:"10px 12px", borderRadius:"10px", background:"#f8faf6", border:"0.5px solid #e8ede8" }}>
                    <span style={{ fontSize:"14px" }}>📄</span>
                    <span style={{ flex:1, fontSize:"12px", color:"#444", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{file.fileName}</span>
                    <a href={file.downloadURL} target="_blank" rel="noreferrer" style={{ fontSize:"11px", color:colorTexto, fontWeight:600, textDecoration:"none", padding:"4px 10px", borderRadius:"6px", background:"#E2F2E2" }}>Ver</a>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Subir programa del curso */}
          <section style={{ background:"rgba(255,255,255,0.85)", borderRadius:"16px", padding:"24px", border:`0.5px solid ${borderCard}`, backdropFilter:"blur(8px)" }}>
            <h2 style={{ fontSize:"17px", margin:"0 0 4px", color:colorTexto, fontWeight:700 }}>📋 Programa del curso</h2>
            <p style={{ fontSize:"12px", color:colorSecund, margin:"0 0 14px", lineHeight:1.6 }}>
              Sube el syllabus en PDF o imagen y la IA extraerá los temas automáticamente.
            </p>
            <input ref={programaInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleProgramaChange} style={{ display:"none" }}/>
            <button
              onClick={() => programaInputRef.current?.click()}
              disabled={subiendoPrograma}
              style={{ width:"100%", padding:"12px", borderRadius:"10px", background: subiendoPrograma ? "#eee" : "#E2F2E2", border:`0.5px solid ${subiendoPrograma ? "#ddd" : "#3a7a3a"}`, color: subiendoPrograma ? "#aaa" : "#1a5a1a", fontSize:"13px", fontWeight:600, cursor: subiendoPrograma ? "not-allowed" : "pointer" }}
            >
              {subiendoPrograma ? "⏳ Extrayendo temas..." : "📤 Subir programa del curso"}
            </button>
            {subiendoPrograma && (
              <p style={{ fontSize:"12px", color:colorSecund, margin:"8px 0 0", textAlign:"center", fontStyle:"italic" }}>
                El Capitán está leyendo tu programa...
              </p>
            )}
          </section>

        </div>
      </div>

      {/* ── MODAL QUIZ ── */}
      {quizAbierto && (
        <div
          onClick={e => { if (e.target === e.currentTarget) cerrarQuiz(); }}
          style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"20px" }}
        >
          <div style={{ background:"white", borderRadius:"20px", padding:"32px", width:"100%", maxWidth:"520px", maxHeight:"90vh", overflowY:"auto", border:"0.5px solid #d0d8c8", boxShadow:"0 24px 60px rgba(0,0,0,0.15)" }}>

            {/* Header modal */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"20px" }}>
              <div>
                <h3 style={{ margin:"0 0 4px", color:colorTexto, fontSize:"18px", fontWeight:700 }}>Cuestionario</h3>
                <p style={{ margin:0, fontSize:"13px", color:colorSecund }}>{topicActivo?.nombre}</p>
              </div>
              <button onClick={cerrarQuiz} style={{ background:"transparent", border:"none", fontSize:"20px", color:"#aaa", cursor:"pointer", lineHeight:1 }}>✕</button>
            </div>

            {/* Cargando */}
            {cargandoQuiz && (
              <div style={{ textAlign:"center", padding:"40px 0" }}>
                <p style={{ color:colorSecund, fontStyle:"italic", fontSize:"14px" }}>El Capitán está preparando tus preguntas...</p>
              </div>
            )}

            {/* Error */}
            {errorQuiz && !cargandoQuiz && (
              <div style={{ textAlign:"center", padding:"20px 0" }}>
                <p style={{ color:"#b04b4b", fontSize:"14px", marginBottom:"16px" }}>{errorQuiz}</p>
                <button onClick={() => topicActivo && abrirQuiz(topicActivo)} style={{ padding:"10px 20px", borderRadius:"10px", background:"#B2D8B2", border:"none", color:colorTexto, fontWeight:600, cursor:"pointer" }}>
                  Intentar de nuevo
                </button>
              </div>
            )}

            {/* Quiz en curso */}
            {!cargandoQuiz && !errorQuiz && !quizTerminado && preguntasQuiz.length > 0 && (
              <>
                {/* Progreso */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
                  <span style={{ fontSize:"12px", color:colorSecund, fontWeight:600 }}>
                    Pregunta {preguntaActual + 1} de {preguntasQuiz.length}
                  </span>
                  <div style={{ flex:1, height:"4px", background:"#f0f0e8", borderRadius:"2px", margin:"0 12px" }}>
                    <div style={{ height:"4px", background:"#B2D8B2", borderRadius:"2px", width:`${((preguntaActual+1)/preguntasQuiz.length)*100}%`, transition:"width 0.3s" }}/>
                  </div>
                </div>

                {/* Pregunta */}
                <p style={{ fontSize:"15px", color:colorTexto, fontWeight:600, marginBottom:"18px", lineHeight:1.6 }}>
                  {preguntasQuiz[preguntaActual].pregunta}
                </p>

                {/* Opciones */}
                <div style={{ display:"flex", flexDirection:"column", gap:"10px", marginBottom:"20px" }}>
                  {preguntasQuiz[preguntaActual].opciones.map(opcion => {
                    const letra = opcion.charAt(0);
                    const esElegida  = respuestaElegida === letra;
                    const esCorrecta = respuestaElegida && letra === preguntasQuiz[preguntaActual].correcta;
                    const esIncorrecta = respuestaElegida && esElegida && letra !== preguntasQuiz[preguntaActual].correcta;

                    let bg    = "white";
                    let borde = "#e0e0e0";
                    let color = "#333";
                    if (esCorrecta)   { bg = "#E2F2E2"; borde = "#3a7a3a"; color = "#1a5a1a"; }
                    if (esIncorrecta) { bg = "#FEF0EE"; borde = "#E87A6A"; color = "#7a1a10"; }
                    if (esElegida && !esIncorrecta && !esCorrecta) { bg = "#E2F2E2"; borde = "#3a7a3a"; }

                    return (
                      <button
                        key={opcion}
                        onClick={() => elegirRespuesta(letra)}
                        style={{ padding:"12px 16px", borderRadius:"12px", border:`1.5px solid ${borde}`, background:bg, color, fontSize:"14px", textAlign:"left", cursor: respuestaElegida ? "default" : "pointer", transition:"all 0.2s", fontWeight: esElegida ? 600 : 400 }}
                      >
                        {opcion}
                      </button>
                    );
                  })}
                </div>

                {/* Botón siguiente */}
                <button
                  onClick={siguientePregunta}
                  disabled={!respuestaElegida}
                  style={{ width:"100%", padding:"12px", borderRadius:"12px", background: respuestaElegida ? colorTexto : "#eee", color: respuestaElegida ? "white" : "#aaa", border:"none", fontSize:"14px", fontWeight:600, cursor: respuestaElegida ? "pointer" : "not-allowed" }}
                >
                  {preguntaActual + 1 === preguntasQuiz.length ? "Ver resultado" : "Siguiente →"}
                </button>
              </>
            )}

            {/* Resultado final */}
            {quizTerminado && (
              <div style={{ textAlign:"center" }}>
                {(() => {
                  const sc = SEMAFORO_CONFIG[calcularSemaforo(correctasFinales)];
                  return (
                    <>
                      <div style={{ fontSize:"48px", marginBottom:"12px" }}>{sc.emoji}</div>
                      <h4 style={{ margin:"0 0 8px", fontSize:"22px", color:colorTexto }}>{sc.label}</h4>
                      <p style={{ fontSize:"16px", color:colorSecund, margin:"0 0 4px" }}>
                        {correctasFinales} de {preguntasQuiz.length} correctas
                      </p>
                      <p style={{ fontSize:"13px", color:colorSecund, margin:"0 0 24px", fontStyle:"italic" }}>
                        {correctasFinales >= 8 ? "¡Excelente dominio del tema!" : correctasFinales >= 5 ? "Vas bien, sigue repasando." : "Este tema necesita más atención. ¡Tú puedes!"}
                      </p>
                      <div style={{ background:sc.bg, borderRadius:"12px", padding:"14px", border:`0.5px solid ${sc.borde}`, marginBottom:"20px" }}>
                        <p style={{ margin:0, fontSize:"13px", color:sc.texto }}>
                          El semáforo de <strong>{topicActivo?.nombre}</strong> se actualizó a: <strong>{sc.label}</strong>
                        </p>
                      </div>
                      <button onClick={cerrarQuiz} style={{ width:"100%", padding:"12px", borderRadius:"12px", background:colorTexto, color:"white", border:"none", fontSize:"14px", fontWeight:600, cursor:"pointer" }}>
                        Volver a temas
                      </button>
                    </>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}