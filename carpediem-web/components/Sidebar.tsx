"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const items = [
  { icon: "🏠", ruta: "/dashboard", label: "Inicio" },
  { icon: "📅", ruta: "/calendario", label: "Calendario" },
  { icon: "📚", ruta: "/apuntes", label: "Apuntes" },
  { icon: "⏳", ruta: "/capitan", label: "El Capitán" },
  { icon: "🎮", ruta: "/juegos", label: "Juegos" },
  { icon: "🔥", ruta: "/racha", label: "Racha" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
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

  const userEmail = currentUser?.email || "Sin correo";

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
          <span className="sidebar-user-avatar">{userInitial}</span>

          <div className="sidebar-user-meta">
            <p className="sidebar-user-name">{userName}</p>
            <p className="sidebar-user-role">{userEmail}</p>
          </div>
        </div>

        {showMenu && (
          <div className="sidebar-user-menu">
            <button
              className="sidebar-user-menu-btn"
              onClick={() => router.push("/configuracion")}
            >
              Configuración
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