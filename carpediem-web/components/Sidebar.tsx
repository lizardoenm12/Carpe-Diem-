"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const items = [
  { icon: "🏠", ruta: "/dashboard", label: "Inicio" },
  { icon: "📅", ruta: "/calendario", label: "Calendario" },
  { icon: "📚", ruta: "/apuntes", label: "Apuntes" },
  { icon: "⏳", ruta: "/capitan", label: "El Capitán" },
  { icon: "🎮", ruta: "/juegos", label: "Juegos" },
];

export default function Sidebar() {
  const router   = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [showMenu, setShowMenu]       = useState(false);
  const [photoURL, setPhotoURL]       = useState<string | null>(null); // ← NUEVO

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);

      if (user) {
        // ── NUEVO: primero intentamos Firestore (foto personalizada) ──
        // Si el usuario subió una foto desde perfil, está en userProfiles/{uid}
        // Si no, usamos la foto de Auth (Google, etc.)
        try {
          const snap = await getDoc(doc(db, "userProfiles", user.uid));
          if (snap.exists() && snap.data().photoURL) {
            setPhotoURL(snap.data().photoURL);
          } else if (user.photoURL) {
            setPhotoURL(user.photoURL);
          } else {
            setPhotoURL(null);
          }
        } catch {
          // Si falla Firestore, fallback a Auth
          setPhotoURL(user.photoURL || null);
        }
      } else {
        setPhotoURL(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  const userName =
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Usuario";

  const userEmail   = currentUser?.email || "Sin correo";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <aside className="sidebar-hover">
      <div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">🌿</span>
          <span className="sidebar-brand-text">Carpe Diem</span>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => {
            const active = pathname === item.ruta;
            return (
              <button
                key={item.ruta}
                type="button"
                onClick={() => router.push(item.ruta)}
                className={`sidebar-link ${active ? "active" : ""}`}
                title={item.label}
              >
                <span className="sidebar-link-icon">{item.icon}</span>
                <span className="sidebar-link-text">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div
          className="sidebar-user-chip"
          onClick={() => setShowMenu((prev) => !prev)}
        >
          {/* ── CAMBIO: foto si existe, inicial si no ── */}
          {photoURL ? (
            <img
              src={photoURL}
              alt="Foto de perfil"
              className="sidebar-user-avatar"
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          ) : (
            <span className="sidebar-user-avatar">{userInitial}</span>
          )}

          <div className="sidebar-user-meta">
            <p className="sidebar-user-name">{userName}</p>
            <p className="sidebar-user-role">{userEmail}</p>
          </div>
        </div>

        {showMenu && (
          <div className="sidebar-user-menu">
            <button
              className="sidebar-user-menu-btn"
              onClick={() => router.push("/perfil")}
            >
              Perfil
            </button>

            <button
              className="sidebar-user-menu-btn logout"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}