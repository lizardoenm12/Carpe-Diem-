"use client";

import { useEffect, useState, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut, updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";
import { getBgColor, getBorderCard, getTextoPrincipal, getTextoSecundario } from "@/lib/semaforo";
import { getPoemaEstable, NivelEmocional } from "@/lib/poemas";

export default function PerfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser]             = useState(auth.currentUser);
  const [loading, setLoading]                     = useState(true);
  const [saving, setSaving]                       = useState(false);
  const [uploadingPhoto, setUploadingPhoto]       = useState(false);
  const [photoURL, setPhotoURL]                   = useState<string | null>(null);
  const [toast, setToast]                         = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [nivelEmocion, setNivelEmocion]           = useState(5);
  const [studyStyle, setStudyStyle]               = useState("mixto");
  const [preferredIntensity, setPreferredIntensity] = useState("suave");
  const [currentGoal, setCurrentGoal]             = useState("organizacion");
  const [totalStudyActions, setTotalStudyActions] = useState(0);
  const [displayName, setDisplayName]             = useState("");
  const [tonoCapitan, setTonoCapitan]             = useState("poetico");
  const [notaCapitan, setNotaCapitan]             = useState("");
  const [frasePersonal, setFrasePersonal]         = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) {
        setDisplayName(user.displayName || "");
        // Prioridad: foto personalizada en Auth, luego Google photo
        setPhotoURL(user.photoURL || null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) { setLoading(false); return; }
      try {
        const snapC = await getDoc(doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`));
        if (snapC.exists()) setNivelEmocion(snapC.data().nivel ?? 5);

        const ref2  = doc(db, COLLECTIONS.userProfiles, currentUser.uid);
        const snap = await getDoc(ref2);
        if (snap.exists()) {
          const data = snap.data();
          setStudyStyle(data.studyStyle || "mixto");
          setPreferredIntensity(data.preferredIntensity || "suave");
          setCurrentGoal(data.currentGoal || "organizacion");
          setTotalStudyActions(data.totalStudyActions || 0);
          setTonoCapitan(data.tonoCapitan || "poetico");
          setNotaCapitan(data.notaCapitan || "");
          setFrasePersonal(data.frasePersonal || "");
          if (data.displayName) setDisplayName(data.displayName);
          // Si guardamos una foto personalizada en Firestore, tiene prioridad
          if (data.photoURL) setPhotoURL(data.photoURL);
        } else {
          await setDoc(ref2, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "",
            email: currentUser.email || "",
            photoURL: currentUser.photoURL || "",
            studyStyle: "mixto", preferredIntensity: "suave",
            currentGoal: "organizacion", totalStudyActions: 0,
            tonoCapitan: "poetico", notaCapitan: "", frasePersonal: "",
            createdAt: new Date(), updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [currentUser]);

  /* ── Subir foto ── */
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    // Validar tipo y tamaño (máx 3MB)
    if (!file.type.startsWith("image/")) {
      showToast("Solo se permiten imágenes.", "error");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast("La imagen no puede superar 3MB.", "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      // Subir a Firebase Storage en avatars/{uid}
      const storageRef = ref(storage, `avatars/${currentUser.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // Actualizar Firebase Auth
      await updateProfile(currentUser, { photoURL: url });
      await currentUser.reload();
      setCurrentUser(auth.currentUser);

      // Guardar en Firestore también
      await setDoc(
        doc(db, COLLECTIONS.userProfiles, currentUser.uid),
        { photoURL: url, updatedAt: new Date() },
        { merge: true }
      );

      setPhotoURL(url);
      showToast("Foto actualizada correctamente.");
    } catch (error) {
      console.error("Error subiendo foto:", error);
      showToast("No se pudo subir la foto. Intenta de nuevo.", "error");
    } finally {
      setUploadingPhoto(false);
      // Limpiar el input para que pueda subir la misma foto de nuevo si quiere
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      if (displayName.trim() && displayName.trim() !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: displayName.trim() });
        await currentUser.reload();
        setCurrentUser(auth.currentUser);
      }
      await setDoc(
        doc(db, COLLECTIONS.userProfiles, currentUser.uid),
        {
          uid: currentUser.uid,
          displayName: displayName.trim() || currentUser.displayName || "",
          email: currentUser.email || "",
          studyStyle, preferredIntensity, currentGoal,
          totalStudyActions, tonoCapitan, notaCapitan, frasePersonal,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      showToast("Cambios guardados correctamente.");
    } catch (error) {
      console.error("Error guardando perfil:", error);
      showToast("No se pudo guardar. Intenta de nuevo.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const getInitials = (name: string) =>
    name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  const goalLabels: Record<string, string> = {
    organizacion: "Organizar mi estudio",
    examen:       "Preparar un examen",
    tareas:       "Terminar mis tareas",
    repaso:       "Repasar contenido",
  };

  const styleLabels: Record<string, string> = {
    visual: "Visual", lectura: "Lectura", practico: "Práctico", mixto: "Mixto",
  };

  const intensityLabels: Record<string, string> = {
    suave: "Suave", normal: "Normal", intensa: "Intensa",
  };

  const tonoLabels: Record<string, { label: string; desc: string; emoji: string }> = {
    poetico: { label: "Poético",  desc: "Metáforas, versos y mucho entusiasmo", emoji: "📜" },
    directo: { label: "Directo",  desc: "Frases cortas, claras y sin rodeos",   emoji: "⚡" },
    mixto:   { label: "Mixto",    desc: "Adapta su tono según cómo estés",      emoji: "🌿" },
  };

  const bgPage      = getBgColor(nivelEmocion);
  const borderCard  = getBorderCard(nivelEmocion);
  const colorTitulo = getTextoPrincipal ? getTextoPrincipal(nivelEmocion) : "#27500A";
  const colorSub    = getTextoSecundario ? getTextoSecundario(nivelEmocion) : "#6b8c5a";

  let poema = { texto: "", autor: "", obra: "" };
  try {
    poema = getPoemaEstable(nivelEmocion as NivelEmocional, new Date().toDateString());
  } catch(e) {}

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="perfil-loading-dot" />
        <span>Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="page-scroll" style={{ background:bgPage, transition:"background 0.6s ease", fontFamily:"'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth:"1100px", margin:"0 auto" }}>

        {/* ── Header ── */}
        <div style={{ marginBottom:"32px" }}>
          <h1 style={{ fontSize:"32px", fontWeight:800, margin:"0 0 6px", color:colorTitulo, letterSpacing:"-0.5px" }}>
            Mi perfil
          </h1>
          <p style={{ fontSize:"15px", color:colorSub, margin:"0 0 16px" }}>
            Personaliza cómo Carpe Diem adapta tu estudio.
          </p>
          {poema.texto && (
            <div style={{ borderLeft:`3px solid ${borderCard}`, paddingLeft:"14px" }}>
              <p style={{ fontStyle:"italic", fontSize:"13px", color:colorSub, margin:"0 0 3px", lineHeight:1.7, whiteSpace:"pre-line" }}>
                "{poema.texto}"
              </p>
              <p style={{ fontSize:"11px", color:colorSub, margin:0, opacity:0.7 }}>
                — {poema.autor}, <span style={{ fontStyle:"italic" }}>{poema.obra}</span>
              </p>
            </div>
          )}
        </div>

        {/* ── Grid 2 columnas ── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"24px", alignItems:"start" }}>

          {/* ═══════════════ COLUMNA IZQUIERDA ═══════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

            {/* Card usuario */}
            <div style={{ background:"white", borderRadius:"24px", border:`1px solid ${borderCard}`, overflow:"hidden", boxShadow:`0 4px 24px ${borderCard}40` }}>

              {/* Banner */}
              <div style={{ height:"110px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg, ${colorTitulo} 0%, ${borderCard} 100%)` }}/>
                <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.10) 0%, transparent 40%)" }}/>
              </div>

              {/* Avatar con botón de edición */}
              <div style={{ padding:"0 24px", marginTop:"-36px", position:"relative", zIndex:1, display:"flex", alignItems:"flex-end", gap:"10px" }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  {/* Foto o iniciales */}
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt="Foto de perfil"
                      style={{ width:"72px", height:"72px", borderRadius:"50%", border:"4px solid white", boxShadow:`0 4px 16px ${colorTitulo}40`, objectFit:"cover", display:"block" }}
                    />
                  ) : (
                    <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:`linear-gradient(135deg, ${colorTitulo}, ${colorSub})`, border:"4px solid white", boxShadow:`0 4px 16px ${colorTitulo}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", fontWeight:800, color:"white" }}>
                      {getInitials(displayName || currentUser?.displayName || "U")}
                    </div>
                  )}

                  {/* Botón cámara — sobre el avatar */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    title="Cambiar foto"
                    style={{ position:"absolute", bottom:"2px", right:"2px", width:"22px", height:"22px", borderRadius:"50%", background:colorTitulo, border:"2px solid white", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:"11px", lineHeight:1, boxShadow:"0 2px 6px rgba(0,0,0,0.15)" }}
                  >
                    {uploadingPhoto ? "⏳" : "📷"}
                  </button>
                </div>

                {/* Input oculto */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display:"none" }}
                />

                {/* Hint subir foto */}
                {uploadingPhoto && (
                  <p style={{ fontSize:"12px", color:colorSub, margin:"0 0 6px", fontStyle:"italic" }}>
                    Subiendo foto...
                  </p>
                )}
              </div>

              {/* Info */}
              <div style={{ padding:"14px 24px 0" }}>
                <h2 style={{ fontSize:"20px", fontWeight:700, color:colorTitulo, margin:"0 0 4px" }}>
                  {displayName || currentUser?.displayName || "Usuario"}
                </h2>
                <p style={{ fontSize:"13px", color:colorSub, margin:"0 0 8px" }}>
                  {currentUser?.email || "Sin correo"}
                </p>
                {frasePersonal ? (
                  <p style={{ fontStyle:"italic", fontSize:"13px", color:colorSub, margin:"0 0 10px", lineHeight:1.5 }}>
                    "{frasePersonal}"
                  </p>
                ) : (
                  <p style={{ fontSize:"12px", color:borderCard, margin:"0 0 10px", fontStyle:"italic" }}>
                    Sin frase personal aún — agrégala a la derecha 🌿
                  </p>
                )}
                <div style={{ display:"inline-block", background:`${borderCard}60`, color:colorTitulo, borderRadius:"20px", padding:"4px 12px", fontSize:"12px", fontWeight:600, marginBottom:"16px" }}>
                  🎯 {goalLabels[currentGoal] || currentGoal}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:"flex", alignItems:"center", margin:"0 24px 20px", background:bgPage, borderRadius:"16px", padding:"14px 0" }}>
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <span style={{ fontSize:"18px", fontWeight:800, color:colorTitulo }}>{totalStudyActions}</span>
                  <span style={{ fontSize:"11px", color:colorSub, textTransform:"uppercase", letterSpacing:"0.04em", fontWeight:500 }}>acciones</span>
                </div>
                <div style={{ width:"1px", height:"32px", background:borderCard }}/>
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <span style={{ fontSize:"18px", fontWeight:800, color:colorTitulo }}>{styleLabels[studyStyle]}</span>
                  <span style={{ fontSize:"11px", color:colorSub, textTransform:"uppercase", letterSpacing:"0.04em", fontWeight:500 }}>estilo</span>
                </div>
                <div style={{ width:"1px", height:"32px", background:borderCard }}/>
                <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:"4px" }}>
                  <span style={{ fontSize:"18px", fontWeight:800, color:colorTitulo }}>{tonoLabels[tonoCapitan]?.emoji}</span>
                  <span style={{ fontSize:"11px", color:colorSub, textTransform:"uppercase", letterSpacing:"0.04em", fontWeight:500 }}>tono</span>
                </div>
              </div>

              {/* Logout */}
              <div style={{ padding:"0 24px 24px" }}>
                <button
                  onClick={handleLogout}
                  style={{ width:"100%", padding:"11px", borderRadius:"14px", border:"1.5px solid #FAD8D8", background:"transparent", color:"#B04B4B", cursor:"pointer", fontWeight:600, fontSize:"14px", transition:"background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#FFF0F0")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>

            {/* Card hábitos de estudio */}
            <div style={{ background:"white", borderRadius:"24px", border:`1px solid ${borderCard}`, padding:"24px", boxShadow:`0 4px 24px ${borderCard}40` }}>
              <h3 style={{ fontSize:"16px", fontWeight:700, color:colorTitulo, margin:"0 0 18px" }}>
                Hábitos de estudio
              </h3>

              <div style={{ marginBottom:"20px" }}>
                <label style={labelStyle(colorSub)}>Forma de estudio</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                  {(["visual", "lectura", "practico", "mixto"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setStudyStyle(v)}
                      style={{ padding:"10px 14px", borderRadius:"12px", border:studyStyle===v ? `1.5px solid ${colorTitulo}` : `1.5px solid ${borderCard}`, background:studyStyle===v ? `${borderCard}50` : "#fafaf8", color:studyStyle===v ? colorTitulo : "#555", cursor:"pointer", fontSize:"13px", fontWeight:studyStyle===v ? 700 : 500, textAlign:"left", transition:"all 0.15s", fontFamily:"inherit" }}
                    >
                      {v==="visual"   && "👁️ "}
                      {v==="lectura"  && "📖 "}
                      {v==="practico" && "✏️ "}
                      {v==="mixto"    && "🔀 "}
                      {styleLabels[v]}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom:"20px" }}>
                <label style={labelStyle(colorSub)}>Intensidad preferida</label>
                <div style={{ display:"flex", gap:"8px" }}>
                  {(["suave", "normal", "intensa"] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setPreferredIntensity(v)}
                      style={{ flex:1, padding:"10px", borderRadius:"12px", border:preferredIntensity===v ? `1.5px solid ${colorTitulo}` : `1.5px solid ${borderCard}`, background:preferredIntensity===v ? `${borderCard}50` : "#fafaf8", color:preferredIntensity===v ? colorTitulo : "#555", cursor:"pointer", fontSize:"13px", fontWeight:preferredIntensity===v ? 700 : 500, textAlign:"center", transition:"all 0.15s", fontFamily:"inherit" }}
                    >
                      {v==="suave"   && "🌱 "}
                      {v==="normal"  && "⚡ "}
                      {v==="intensa" && "🚀 "}
                      {intensityLabels[v]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={labelStyle(colorSub)}>Meta actual</label>
                <select
                  value={currentGoal}
                  onChange={e => setCurrentGoal(e.target.value)}
                  style={{ width:"100%", padding:"12px 14px", borderRadius:"12px", border:`1.5px solid ${borderCard}`, background:"#fafaf8", backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%236AA5EC' viewBox='0 0 16 16'%3E%3Cpath d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E")`, backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center", color:colorTitulo, fontSize:"14px", fontWeight:500, fontFamily:"inherit", appearance:"none", cursor:"pointer", outline:"none", boxSizing:"border-box" }}
                >
                  <option value="organizacion">🗂️ Organizar mi estudio</option>
                  <option value="examen">📝 Preparar un examen</option>
                  <option value="tareas">✅ Terminar mis tareas</option>
                  <option value="repaso">🔁 Repasar contenido</option>
                </select>
              </div>
            </div>
          </div>

          {/* ═══════════════ COLUMNA DERECHA ═══════════════ */}
          <div style={{ display:"flex", flexDirection:"column", gap:"20px" }}>

            {/* Card identidad */}
            <div style={{ background:"white", borderRadius:"24px", border:`1px solid ${borderCard}`, padding:"24px", boxShadow:`0 4px 24px ${borderCard}40` }}>
              <h3 style={{ fontSize:"16px", fontWeight:700, color:colorTitulo, margin:"0 0 18px" }}>
                Tu identidad
              </h3>

              <div style={{ marginBottom:"20px" }}>
                <label style={labelStyle(colorSub)}>Nombre para mostrar</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="¿Cómo quieres que te llame el Capitán?"
                  style={inputStyle(borderCard, colorTitulo)}
                />
              </div>

              <div style={{ background:`${bgPage}`, borderRadius:"14px", padding:"16px", border:`1px dashed ${borderCard}` }}>
                <label style={labelStyle(colorSub)}>✨ Tu frase personal</label>
                <p style={{ fontSize:"12px", color:colorSub, margin:"0 0 10px" }}>
                  Aparece en tu perfil. Una cita, un mantra, lo que quieras.
                </p>
                <input
                  value={frasePersonal}
                  onChange={e => setFrasePersonal(e.target.value)}
                  placeholder="Ej: Un día a la vez. · Carpe Diem."
                  maxLength={100}
                  style={inputStyle(borderCard, colorTitulo)}
                />
                <p style={{ fontSize:"11px", color:colorSub, margin:"4px 0 0", textAlign:"right" }}>
                  {frasePersonal.length}/100
                </p>
              </div>
            </div>

            {/* Card El Capitán */}
            <div style={{ background:"white", borderRadius:"24px", border:`1px solid ${borderCard}`, padding:"24px", boxShadow:`0 4px 24px ${borderCard}40` }}>
              <h3 style={{ fontSize:"16px", fontWeight:700, color:colorTitulo, margin:"0 0 4px" }}>
                ⏳ El Capitán
              </h3>
              <p style={{ fontSize:"13px", color:colorSub, margin:"0 0 18px" }}>
                Personaliza cómo se comunica contigo.
              </p>

              <div style={{ marginBottom:"20px" }}>
                <label style={labelStyle(colorSub)}>Tono del Capitán</label>
                <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                  {(["poetico", "directo", "mixto"] as const).map(v => {
                    const t = tonoLabels[v];
                    const activo = tonoCapitan === v;
                    return (
                      <button
                        key={v}
                        onClick={() => setTonoCapitan(v)}
                        style={{ display:"flex", alignItems:"center", gap:"12px", padding:"12px 14px", borderRadius:"12px", border:activo ? `1.5px solid ${colorTitulo}` : `1.5px solid ${borderCard}`, background:activo ? `${borderCard}50` : "#fafaf8", cursor:"pointer", textAlign:"left", transition:"all 0.15s", fontFamily:"inherit" }}
                      >
                        <span style={{ fontSize:"20px" }}>{t.emoji}</span>
                        <div>
                          <p style={{ margin:0, fontSize:"13px", fontWeight:600, color:activo ? colorTitulo : "#555" }}>{t.label}</p>
                          <p style={{ margin:0, fontSize:"11px", color:colorSub }}>{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle(colorSub)}>Nota para el Capitán</label>
                <textarea
                  value={notaCapitan}
                  onChange={e => setNotaCapitan(e.target.value)}
                  placeholder="¿Algo que el Capitán deba saber? Ej: Me cuesta concentrarme más de 30 minutos seguidos."
                  rows={3}
                  style={{ ...inputStyle(borderCard, colorTitulo), resize:"vertical", lineHeight:1.6 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Botón guardar ── */}
        <div style={{ marginTop:"28px", display:"flex", justifyContent:"center" }}>
          <button
            onClick={saveProfile}
            disabled={saving}
            style={{ width:"100%", maxWidth:"480px", padding:"15px", borderRadius:"14px", border:"none", background:`linear-gradient(135deg, ${colorTitulo}, ${colorSub})`, color:"white", fontSize:"15px", fontWeight:700, fontFamily:"inherit", cursor:saving ? "not-allowed" : "pointer", opacity:saving ? 0.7 : 1, boxShadow:`0 4px 16px ${colorTitulo}40`, letterSpacing:"0.02em", transition:"opacity 0.2s" }}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

        <div style={{ height:"40px" }}/>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:"32px", right:"32px", display:"flex", alignItems:"center", gap:"10px", padding:"14px 20px", borderRadius:"14px", fontSize:"14px", fontWeight:600, fontFamily:"inherit", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:9999, background:toast.type==="error" ? "#FDEAEA" : "#E8F7EE", color:toast.type==="error" ? "#B04B4B" : "#1E6B3E", border:toast.type==="error" ? "1px solid #F5B8B8" : "1px solid #B6E4C8" }}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
    </div>
  );
}

const labelStyle = (color: string): React.CSSProperties => ({
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "8px",
});

const inputStyle = (borderCard: string, colorTitulo: string): React.CSSProperties => ({
  width: "100%",
  padding: "11px 14px",
  borderRadius: "12px",
  border: `1.5px solid ${borderCard}`,
  background: "#fafaf8",
  fontSize: "14px",
  color: colorTitulo,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
  marginBottom: 0,
});