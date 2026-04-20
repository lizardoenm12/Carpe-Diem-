"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const emociones = [
  { label: "Genial", emoji: "✨", color: "#52C788", fondo: "#EDFBF3", nivel: 6 },
  { label: "Tranquilo", emoji: "🌿", color: "#7DBF9E", fondo: "#F0FAF4", nivel: 5 },
  { label: "Nervioso", emoji: "🌤️", color: "#E8C84A", fondo: "#FDFBEA", nivel: 4 },
  { label: "Agobiado", emoji: "🍂", color: "#E8A157", fondo: "#FEF6ED", nivel: 3 },
  { label: "Frustrado", emoji: "🌧️", color: "#E87A6A", fondo: "#FEF0EE", nivel: 2 },
  { label: "Burnout", emoji: "🌑", color: "#C45C5C", fondo: "#FAF0F0", nivel: 1 },
];

export default function Checkin() {
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const guardar = async () => {
    if (seleccionado === null || !currentUser) return;
    setGuardando(true);
    try {
      const emocion = emociones[seleccionado];
      await setDoc(doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`), {
        uid: currentUser.uid,
        emocion: emocion.label,
        nivel: emocion.nivel,
        fecha: new Date(),
      });
      router.push("/dashboard");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5DC",padding:"24px"}}>
      <div style={{background:"white",borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"420px",border:"0.5px solid #e0e0e0",textAlign:"center"}}>
        <p style={{fontSize:"13px",color:"#aaa",margin:"0 0 4px"}}>Buenos días</p>
        <h2 style={{fontSize:"20px",fontWeight:"500",margin:"0 0 6px"}}>¿Cómo llegaste hoy?</h2>
        <p style={{fontSize:"13px",color:"#888",margin:"0 0 24px"}}>Tu respuesta ajusta tu sesión de estudio</p>

        <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"24px"}}>
          {emociones.map((e, i) => (
            <div
              key={i}
              onClick={() => setSeleccionado(i)}
              style={{display:"flex",alignItems:"center",gap:"14px",padding:"12px 16px",borderRadius:"10px",border:seleccionado===i?`1.5px solid ${e.color}`:"0.5px solid #ddd",background:seleccionado===i?e.fondo:"white",cursor:"pointer"}}
            >
              <span style={{fontSize:"24px"}}>{e.emoji}</span>
              <span style={{fontSize:"14px",color:"#444",fontWeight:seleccionado===i?"500":"400"}}>{e.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={guardar}
          disabled={seleccionado === null || guardando}
          style={{width:"100%",padding:"12px",borderRadius:"8px",background:seleccionado!==null?"#B2D8B2":"#e0e0e0",border:"none",fontSize:"14px",fontWeight:"500",color:seleccionado!==null?"#27500A":"#999",cursor:seleccionado!==null?"pointer":"not-allowed"}}
        >
          {guardando ? "Guardando..." : "Ver mi plan de hoy"}
        </button>
      </div>
    </main>
  );
}