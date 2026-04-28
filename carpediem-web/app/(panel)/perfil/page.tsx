"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";

export default function PerfilPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [studyStyle, setStudyStyle] = useState("mixto");
  const [preferredIntensity, setPreferredIntensity] = useState("suave");
  const [currentGoal, setCurrentGoal] = useState("organizacion");
  const [streakDays, setStreakDays] = useState(0);
  const [totalStudyActions, setTotalStudyActions] = useState(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) { setLoading(false); return; }
      try {
        const ref = doc(db, COLLECTIONS.userProfiles, currentUser.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setStudyStyle(data.studyStyle || "mixto");
          setPreferredIntensity(data.preferredIntensity || "suave");
          setCurrentGoal(data.currentGoal || "organizacion");
          setStreakDays(data.streakDays || 0);
          setTotalStudyActions(data.totalStudyActions || 0);
        } else {
          await setDoc(ref, {
            uid: currentUser.uid,
            displayName: currentUser.displayName || "",
            email: currentUser.email || "",
            studyStyle: "mixto",
            preferredIntensity: "suave",
            currentGoal: "organizacion",
            streakDays: 0,
            totalStudyActions: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
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

  const saveProfile = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      await setDoc(
        doc(db, COLLECTIONS.userProfiles, currentUser.uid),
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || "",
          email: currentUser.email || "",
          studyStyle,
          preferredIntensity,
          currentGoal,
          streakDays,
          totalStudyActions,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      showToast("Perfil guardado correctamente.");
    } catch (error) {
      console.error("Error guardando perfil:", error);
      showToast("No se pudo guardar el perfil.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const getInitials = (name: string) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U";

  const goalLabels: Record<string, string> = {
    organizacion: "Organización",
    examen: "Preparar examen",
    tareas: "Terminar tareas",
    repaso: "Repasar contenido",
  };

  const styleLabels: Record<string, string> = {
    visual: "Visual",
    lectura: "Lectura",
    practico: "Práctico",
    mixto: "Mixto",
  };

  const intensityLabels: Record<string, string> = {
    suave: "Suave",
    normal: "Normal",
    intensa: "Intensa",
  };

  if (loading) {
    return (
      <div className="perfil-loading">
        <div className="perfil-loading-dot" />
        <span>Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="perfil-page">

      {/* Header */}
      <div className="perfil-header">
        <h1 className="perfil-title">Mi perfil</h1>
        <p className="perfil-subtitle">Personaliza cómo Carpe Diem adapta tu estudio.</p>
      </div>

      <div className="perfil-grid">

        {/* ── Tarjeta usuario ── */}
        <div className="profile-card">

          {/* Banner */}
          <div className="perfil-banner">
            <div className="perfil-banner-gradient" />
            <div className="perfil-banner-pattern" />
          </div>

          {/* Avatar */}
          <div className="perfil-avatar-wrap">
            <div className="perfil-avatar">
              {getInitials(currentUser?.displayName || "Usuario")}
            </div>
          </div>

          {/* Info */}
          <div className="perfil-user-info">
            <h2 className="perfil-user-name">
              {currentUser?.displayName || "Usuario"}
            </h2>
            <p className="perfil-user-email">
              {currentUser?.email || "Sin correo"}
            </p>
            <span className="perfil-goal-tag">
              🎯 {goalLabels[currentGoal] || currentGoal}
            </span>
          </div>

          {/* Stats */}
          <div className="perfil-stats-row">
            <div className="perfil-stat-item">
              <span className="perfil-stat-value">🔥 {streakDays}</span>
              <span className="perfil-stat-label">días de racha</span>
            </div>
            <div className="perfil-stat-divider" />
            <div className="perfil-stat-item">
              <span className="perfil-stat-value">{totalStudyActions}</span>
              <span className="perfil-stat-label">acciones</span>
            </div>
            <div className="perfil-stat-divider" />
            <div className="perfil-stat-item">
              <span className="perfil-stat-value">{styleLabels[studyStyle]}</span>
              <span className="perfil-stat-label">estilo</span>
            </div>
          </div>

          {/* Logout */}
          <div className="perfil-logout-wrap">
            <button onClick={handleLogout} className="perfil-logout-btn">
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* ── Preferencias ── */}
        <div className="perfil-prefs-card profile-card">
          <h2 className="perfil-prefs-title">Preferencias de estudio</h2>
          <p className="perfil-prefs-subtitle">
            Carpe Diem usará estos datos para personalizar tus sesiones.
          </p>

          {/* Forma de estudio */}
          <div className="perfil-field-group">
            <label className="perfil-field-label">Forma de estudio</label>
            <div className="perfil-option-grid">
              {(["visual", "lectura", "practico", "mixto"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setStudyStyle(v)}
                  className={`perfil-option-btn ${studyStyle === v ? "active" : ""}`}
                >
                  {v === "visual"   && "👁️ "}
                  {v === "lectura"  && "📖 "}
                  {v === "practico" && "✏️ "}
                  {v === "mixto"    && "🔀 "}
                  {styleLabels[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Intensidad */}
          <div className="perfil-field-group">
            <label className="perfil-field-label">Intensidad preferida</label>
            <div className="perfil-intensity-row">
              {(["suave", "normal", "intensa"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setPreferredIntensity(v)}
                  className={`perfil-intensity-btn ${preferredIntensity === v ? "active" : ""}`}
                >
                  {v === "suave"   && "🌱 "}
                  {v === "normal"  && "⚡ "}
                  {v === "intensa" && "🚀 "}
                  {intensityLabels[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div className="perfil-field-group">
            <label className="perfil-field-label">Objetivo actual</label>
            <select
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
              className="perfil-select"
            >
              <option value="organizacion">🗂️ Organización</option>
              <option value="examen">📝 Preparar examen</option>
              <option value="tareas">✅ Terminar tareas</option>
              <option value="repaso">🔁 Repasar contenido</option>
            </select>
          </div>

          {/* Guardar */}
          <button
            onClick={saveProfile}
            disabled={saving}
            className="perfil-save-btn"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type === "error" ? "toast-error" : "toast-success"}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.msg}
        </div>
      )}
    </div>
  );
}