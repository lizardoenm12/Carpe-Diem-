"use client";

import { useEffect, useState } from "react";
import {
  collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";
import { useRouter } from "next/navigation";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";


export default function ApuntesPage() {
  const [subjects, setSubjects]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [newSubject, setNewSubject]     = useState("");
  const [currentUser, setCurrentUser]   = useState(auth.currentUser);
  const [nivelEmocion, setNivelEmocion] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const snapC = await getDoc(doc(db, "checkins", `${user.uid}_${new Date().toDateString()}`));
          if (snapC.exists()) setNivelEmocion(snapC.data().nivel ?? 5);
        } catch(e) { console.error(e); }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchSubjects = async (uid: string) => {
    try {
      const q = query(collection(db, COLLECTIONS.subjects), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      setSubjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) { console.error("Error cargando materias:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (currentUser) fetchSubjects(currentUser.uid);
    else setLoading(false);
  }, [currentUser]);

  const createSubject = async () => {
    if (!newSubject.trim()) { alert("Escribe un nombre para la materia."); return; }
    if (!currentUser) { alert("No hay sesión activa."); return; }
    try {
      await addDoc(collection(db, COLLECTIONS.subjects), {
        uid: currentUser.uid, name: newSubject.trim(), createdAt: new Date(),
      });
      setNewSubject(""); setShowModal(false);
      fetchSubjects(currentUser.uid);
    } catch (error) { console.error(error); alert("Hubo un error al guardar la materia."); }
  };

  const deleteSubject = async (subjectId: string, subjectName: string) => {
    const confirmar = confirm(`¿Seguro que quieres eliminar "${subjectName}"? Se borrarán también sus archivos registrados, chats y mensajes.`);
    if (!confirmar) return;
    try {
      const filesSnap = await getDocs(query(collection(db, COLLECTIONS.subjectFiles), where("subjectId","==",subjectId)));
      for (const f of filesSnap.docs) await deleteDoc(doc(db, COLLECTIONS.subjectFiles, f.id));

      const chatsSnap = await getDocs(query(collection(db, COLLECTIONS.subjectChats), where("subjectId","==",subjectId)));
      for (const c of chatsSnap.docs) {
        const msgsSnap = await getDocs(query(collection(db, COLLECTIONS.subjectChatMessages), where("chatId","==",c.id)));
        for (const m of msgsSnap.docs) await deleteDoc(doc(db, COLLECTIONS.subjectChatMessages, m.id));
        await deleteDoc(doc(db, COLLECTIONS.subjectChats, c.id));
      }

      await deleteDoc(doc(db, COLLECTIONS.subjects, subjectId));
      if (currentUser) fetchSubjects(currentUser.uid);
      alert("Materia eliminada con todo su contenido.");
    } catch (error) { console.error(error); alert("No se pudo eliminar la materia completa."); }
  };

  /* ── COLORES ── */
  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const colorTitulo = getTextoPrincipal(nivelEmocion);   // ← NUEVO
  const colorSub    = getTextoSecundario(nivelEmocion);  // ← NUEVO
  const bgCard      = "rgba(255,255,255,0.85)";

  return (
    <div className="page-scroll" style={{ background:bgPage, minHeight:"100vh", transition:"background 0.6s ease", padding:"32px" }}>

      {/* ── Header ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"16px", marginBottom:"28px", flexWrap:"wrap" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
            <span style={{ fontSize:"34px" }}>📚</span>
            {/* ── CAMBIO 1: h1 usa colorTitulo ── */}
            <h1 style={{ fontSize:"32px", margin:0, color:colorTitulo, fontWeight:800 }}>Apuntes</h1>
          </div>
          {/* ── CAMBIO 2: subtítulo usa colorSub ── */}
          <p style={{ margin:0, fontSize:"14px", color:colorSub }}>
            Organiza tus materias y centraliza tus archivos de estudio.
          </p>
        </div>
        {/* ── CAMBIO 3: botón "+ Agregar materia" usa colorTitulo ── */}
        <button
          onClick={() => setShowModal(true)}
          style={{ padding:"12px 18px", borderRadius:"14px", background:"#B2D8B2", color:colorTitulo, border:"none", cursor:"pointer", fontWeight:700, fontSize:"14px", boxShadow:"0 4px 16px rgba(178,216,178,0.4)" }}
        >
          + Agregar materia
        </button>
      </div>

      {/* ── Contenedor materias ── */}
      <section style={{ background:bgCard, borderRadius:"24px", padding:"28px", border:`0.5px solid ${borderCard}`, minHeight:"460px", boxShadow:"0 8px 32px rgba(39,80,10,0.06)", backdropFilter:"blur(8px)" }}>
        {loading ? (
          // ── CAMBIO 4: "Cargando materias..." usa colorSub ── */}
          <p style={{ color:colorSub }}>Cargando materias...</p>
        ) : subjects.length === 0 ? (
          <div style={{ minHeight:"340px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", color:"#8aac7a" }}>
            <div style={{ fontSize:"46px", marginBottom:"12px" }}>🗂️</div>
            {/* ── CAMBIO 5: texto vacío principal usa colorTitulo ── */}
            <p style={{ fontSize:"17px", margin:"0 0 6px", color:colorTitulo }}>Aún no tienes materias creadas.</p>
            {/* ── CAMBIO 6: texto vacío secundario usa colorSub ── */}
            <p style={{ fontSize:"14px", margin:0, color:colorSub }}>Agrega una materia para comenzar a organizar tus apuntes.</p>
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))", gap:"20px" }}>
            {subjects.map(s => (
              <div
                key={s.id}
                style={{ position:"relative", background:"rgba(255,255,255,0.95)", border:`0.5px solid ${borderCard}`, borderRadius:"20px", padding:"22px", minHeight:"190px", boxShadow:"0 6px 20px rgba(39,80,10,0.06)", overflow:"hidden" }}
              >
                {/* Botón eliminar — intacto */}
                <button
                  onClick={e => { e.stopPropagation(); deleteSubject(s.id, s.name); }}
                  title="Eliminar materia"
                  style={{ position:"absolute", top:"14px", right:"14px", width:"30px", height:"30px", borderRadius:"50%", border:"0.5px solid #f0c8c8", background:"#fff5f5", color:"#b04b4b", cursor:"pointer", fontWeight:700, fontSize:"16px" }}
                >
                  ×
                </button>

                <div onClick={() => router.push(`/apuntes/${s.id}`)} style={{ cursor:"pointer" }}>
                  <div style={{ width:"48px", height:"48px", borderRadius:"14px", background:"#E2F2E2", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", marginBottom:"16px" }}>
                    📗
                  </div>
                  {/* ── CAMBIO 7: nombre materia usa colorTitulo ── */}
                  <h3 style={{ margin:"0 0 10px", fontSize:"20px", color:colorTitulo, fontWeight:700 }}>
                    {s.name}
                  </h3>
                  {/* ── CAMBIO 8: descripción card usa colorSub ── */}
                  <p style={{ margin:0, fontSize:"13px", color:colorSub, lineHeight:1.6, maxWidth:"90%" }}>
                    Archivos, conversaciones del Capitán y cuestionarios de esta materia.
                  </p>
                  {/* ── CAMBIO 9: badge "Entrar →" usa colorTitulo ── */}
                  <div style={{ marginTop:"18px", display:"inline-flex", alignItems:"center", gap:"6px", padding:"7px 14px", borderRadius:"999px", background:"#E2F2E2", color:colorTitulo, fontSize:"12px", fontWeight:700 }}>
                    Entrar →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modal nueva materia ── */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", display:"flex", justifyContent:"center", alignItems:"center", padding:"20px", zIndex:50 }}>
          <div style={{ background:"white", padding:"28px", borderRadius:"20px", width:"100%", maxWidth:"400px", border:`0.5px solid ${borderCard}`, boxShadow:"0 20px 50px rgba(0,0,0,0.1)" }}>
            {/* ── CAMBIO 10: "Crear materia" usa colorTitulo ── */}
            <h3 style={{ margin:"0 0 8px", color:colorTitulo, fontSize:"18px", fontWeight:700 }}>Crear materia</h3>
            {/* ── CAMBIO 11: descripción modal usa colorSub ── */}
            <p style={{ margin:"0 0 16px", fontSize:"14px", color:colorSub }}>
              Agrega el nombre de una materia para organizar tus archivos, conversaciones y cuestionarios.
            </p>
            {/* ── CAMBIO 12: input color texto usa colorTitulo ── */}
            <input
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === "Enter" && createSubject()}
              placeholder="Ej. Física, Cálculo, Química..."
              style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:`0.5px solid ${borderCard}`, fontSize:"14px", outline:"none", marginBottom:"16px", boxSizing:"border-box", color:colorTitulo }}
            />
            <div style={{ display:"flex", justifyContent:"flex-end", gap:"10px" }}>
              {/* Cancelar — intacto */}
              <button
                onClick={() => setShowModal(false)}
                style={{ padding:"10px 16px", borderRadius:"10px", border:`0.5px solid ${borderCard}`, background:"transparent", color:"#6b8c5a", cursor:"pointer", fontSize:"13px" }}
              >
                Cancelar
              </button>
              {/* ── CAMBIO 13: botón Guardar usa colorTitulo ── */}
              <button
                onClick={createSubject}
                style={{ padding:"10px 16px", borderRadius:"10px", border:"none", background:"#B2D8B2", color:colorTitulo, fontWeight:700, cursor:"pointer", fontSize:"13px" }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}