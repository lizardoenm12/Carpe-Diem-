"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const emociones = [
  { label: "Genial", emoji: "✨", color: "#52C788", fondo: "#EDFBF3", nivel: 6, descripcion: "Me siento con energía y listo para todo" },
  { label: "Tranquilo", emoji: "🌿", color: "#7DBF9E", fondo: "#F0FAF4", nivel: 5, descripcion: "Estoy bien, en calma y enfocado" },
  { label: "Nervioso", emoji: "🌤️", color: "#E8C84A", fondo: "#FDFBEA", nivel: 4, descripcion: "Siento algo de inquietud o preocupación" },
  { label: "Agobiado", emoji: "🍂", color: "#E8A157", fondo: "#FEF6ED", nivel: 3, descripcion: "Hay demasiado y no sé por dónde empezar" },
  { label: "Frustrado", emoji: "🌧️", color: "#E87A6A", fondo: "#FEF0EE", nivel: 2, descripcion: "Las cosas no están saliendo como quiero" },
  { label: "Burnout", emoji: "🌑", color: "#C45C5C", fondo: "#FAF0F0", nivel: 1, descripcion: "Estoy agotado, necesito descansar" },
];

export default function Dashboard() {
  const [emocionSeleccionada, setEmocionSeleccionada] = useState<number | null>(null);
  const [mostrarContenido, setMostrarContenido] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [yaHizoCheckin, setYaHizoCheckin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const checkinDoc = await getDoc(doc(db, "checkins", `${user.uid}_${new Date().toDateString()}`));
        if (checkinDoc.exists()) {
          setYaHizoCheckin(true);
          setMostrarContenido(true);
        }
      }
    });
    return unsubscribe;
  }, []);

  const seleccionarEmocion = async (index: number) => {
    setEmocionSeleccionada(index);
    const emocion = emociones[index];
    if (currentUser) {
      await setDoc(doc(db, "checkins", `${currentUser.uid}_${new Date().toDateString()}`), {
        uid: currentUser.uid,
        emocion: emocion.label,
        nivel: emocion.nivel,
        fecha: new Date(),
      });
    }
    setTimeout(() => setMostrarContenido(true), 400);
  };

  if (mostrarContenido) {
    return (
      <main style={{display:"flex",minHeight:"100vh",background:"#F5F5DC"}}>
        <aside style={{width:"64px",background:"white",borderRight:"0.5px solid #e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"24px",gap:"16px"}}>
          {["🏠","📅","🎮","⏳","🧘"].map((icon, i) => (
            <div key={i} style={{width:"40px",height:"40px",borderRadius:"10px",background:i===0?"#E1F5EE":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",cursor:"pointer"}}>
              {icon}
            </div>
          ))}
        </aside>
        <section style={{flex:1,padding:"32px"}}>
          <h1 style={{fontSize:"24px",fontWeight:"500",margin:"0 0 4px"}}>Tu Espacio de Calma</h1>
          <p style={{fontSize:"14px",color:"#888",margin:"0 0 32px"}}>Un día a la vez, un paso a la vez</p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px"}}>
            <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0"}}>
              <p style={{fontSize:"12px",color:"#aaa",margin:"0 0 6px"}}>📚 Apuntes</p>
              <p style={{fontSize:"14px",color:"#444",margin:"0"}}>Tus notas organizadas</p>
            </div>
            <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0"}}>
              <p style={{fontSize:"12px",color:"#aaa",margin:"0 0 6px"}}>📅 Calendario</p>
              <p style={{fontSize:"14px",color:"#444",margin:"0"}}>Tus próximas entregas</p>
            </div>
            <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0"}}>
              <p style={{fontSize:"12px",color:"#aaa",margin:"0 0 6px"}}>🎮 Juegos</p>
              <p style={{fontSize:"14px",color:"#444",margin:"0"}}>Repasa sin estrés</p>
            </div>
            <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0"}}>
              <p style={{fontSize:"12px",color:"#aaa",margin:"0 0 6px"}}>⏳ Racha</p>
              <p style={{fontSize:"14px",color:"#444",margin:"0"}}>Sigue tu progreso</p>
            </div>
          </div>

          <div style={{marginTop:"24px",background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0"}}>
            <p style={{fontSize:"13px",color:"#aaa",margin:"0 0 6px"}}>✨ Carpe Diem IA</p>
            <p style={{fontSize:"14px",color:"#555",margin:"0",lineHeight:"1.6"}}>
              {emocionSeleccionada !== null
                ? `Hoy te sientes ${emociones[emocionSeleccionada].label.toLowerCase()}. ${emociones[emocionSeleccionada].nivel >= 4 ? "¡Perfecto momento para estudiar! Vamos a aprovechar esta energía." : emociones[emocionSeleccionada].nivel >= 2 ? "Tomaremos las cosas con calma hoy. Un paso a la vez." : "Tu bienestar es lo primero. Descansa, mañana seguimos."}`
                : "Bienvenido de vuelta. Hoy también puedes dar un pequeño paso."
              }
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{display:"flex",minHeight:"100vh",background:"#F5F5DC"}}>
      <aside style={{width:"64px",background:"white",borderRight:"0.5px solid #e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"24px",gap:"16px"}}>
        {["🏠","📅","🎮","⏳","🧘"].map((icon, i) => (
          <div key={i} style={{width:"40px",height:"40px",borderRadius:"10px",background:i===0?"#E1F5EE":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",cursor:"pointer"}}>
            {icon}
          </div>
        ))}
      </aside>
      <section style={{flex:1,padding:"32px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <h1 style={{fontSize:"22px",fontWeight:"500",margin:"0 0 4px",textAlign:"center"}}>¿Cómo llegaste hoy?</h1>
        <p style={{fontSize:"13px",color:"#888",margin:"0 0 28px",textAlign:"center"}}>Tu respuesta ajusta tu sesión de estudio</p>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",width:"100%",maxWidth:"420px"}}>
          {emociones.map((e, i) => (
            <div
              key={i}
              onClick={() => seleccionarEmocion(i)}
              style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 16px",borderRadius:"12px",border:`0.5px solid ${e.color}`,background:emocionSeleccionada===i?e.fondo:"white",cursor:"pointer",transition:"all 0.2s"}}
            >
              <span style={{fontSize:"22px"}}>{e.emoji}</span>
              <div>
                <p style={{fontSize:"14px",fontWeight:"500",color:"#333",margin:"0 0 2px"}}>{e.label}</p>
                <p style={{fontSize:"12px",color:"#888",margin:"0"}}>{e.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}