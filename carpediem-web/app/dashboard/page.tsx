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

const getMensajeIA = (nivel: number, nombre: string) => {
  const n = nombre ? nombre.split(" ")[0] : "amig@";
  if (nivel >= 5) return `¡Hola ${n}! Tu energía está increíble hoy. Es un momento perfecto para atacar ese tema difícil. ¿Empezamos con algo retador?`;
  if (nivel === 4) return `Hola ${n}, veo que estás un poco nervioso/a. No pasa nada — hoy haremos cosas manejables. Un paso a la vez.`;
  if (nivel === 3) return `Hola ${n}, entiendo que hay mucho. Vamos a dividirlo en piezas pequeñas. Hoy solo necesitas hacer una cosa.`;
  if (nivel === 2) return `Hola ${n}, las cosas no siempre salen como queremos. Hoy vamos con calma — un juego relajante puede ayudar.`;
  return `Hola ${n}, tu bienestar es lo primero. Hoy solo descansa. Mañana seguimos juntos.`;
};

const Sidebar = ({ onNavigate, actual }: { onNavigate: (ruta: string) => void, actual: string }) => {
  const rutas = ["/dashboard", "/calendario", "/juegos", "/racha", "/bienestar"];
  const iconos = ["🏠","📅","🎮","⏳","🧘"];
  return (
    <aside style={{width:"64px",background:"white",borderRight:"0.5px solid #e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"24px",gap:"16px",minHeight:"100vh"}}>
      {iconos.map((icon, i) => (
        <div key={i} onClick={() => onNavigate(rutas[i])} style={{width:"40px",height:"40px",borderRadius:"10px",background:actual===rutas[i]?"#E1F5EE":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",cursor:"pointer"}}>
          {icon}
        </div>
      ))}
    </aside>
  );
};

export default function Dashboard() {
  const [emocionSeleccionada, setEmocionSeleccionada] = useState<number | null>(null);
  const [mostrarContenido, setMostrarContenido] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [nivelEmocion, setNivelEmocion] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        setNombreUsuario(user.displayName || "");
        const checkinDoc = await getDoc(doc(db, "checkins", `${user.uid}_${new Date().toDateString()}`));
        if (checkinDoc.exists()) {
          setNivelEmocion(checkinDoc.data().nivel);
          setMostrarContenido(true);
        }
      }
    });
    return unsubscribe;
  }, []);

  const seleccionarEmocion = async (index: number) => {
    setEmocionSeleccionada(index);
    const emocion = emociones[index];
    setNivelEmocion(emocion.nivel);
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

  const getBgColor = () => {
    if (nivelEmocion >= 5) return "#EDFBF3";
    if (nivelEmocion === 4) return "#FDFBEA";
    if (nivelEmocion === 3) return "#FEF6ED";
    if (nivelEmocion === 2) return "#FEF0EE";
    if (nivelEmocion === 1) return "#FAF0F0";
    return "#F5F5DC";
  };

  if (mostrarContenido) {
    return (
      <main style={{display:"flex",minHeight:"100vh",background:getBgColor(),transition:"background 0.5s"}}>
        <Sidebar onNavigate={(ruta) => router.push(ruta)} actual="/dashboard" />
        <section style={{flex:1,padding:"32px"}}>
          <h1 style={{fontSize:"22px",fontWeight:"500",margin:"0 0 4px"}}>
            {nombreUsuario ? `Hola, ${nombreUsuario.split(" ")[0]} 👋` : "Tu Espacio de Calma"}
          </h1>
          <p style={{fontSize:"13px",color:"#888",margin:"0 0 28px"}}>Un día a la vez, un paso a la vez</p>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:"16px",marginBottom:"24px"}}>
            {[
              { icon:"📚", titulo:"Apuntes", desc:"Tus notas organizadas", ruta:"/apuntes" },
              { icon:"📅", titulo:"Calendario", desc:"Tus próximas entregas", ruta:"/calendario" },
              { icon:"🎮", titulo:"Juegos", desc:"Repasa sin estrés", ruta:"/juegos" },
              { icon:"⏳", titulo:"Racha", desc:"Sigue tu progreso", ruta:"/racha" },
            ].map((item) => (
              <div key={item.titulo} onClick={() => router.push(item.ruta)} style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0",cursor:"pointer"}}>
                <p style={{fontSize:"13px",color:"#aaa",margin:"0 0 6px"}}>{item.icon} {item.titulo}</p>
                <p style={{fontSize:"14px",color:"#444",margin:"0",fontWeight:"500"}}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0"}}>
            <p style={{fontSize:"12px",color:"#aaa",margin:"0 0 8px"}}>✨ Carpe Diem IA</p>
            <p style={{fontSize:"14px",color:"#555",margin:"0",lineHeight:"1.7"}}>
              {getMensajeIA(nivelEmocion, nombreUsuario)}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{display:"flex",minHeight:"100vh",background:"#F5F5DC"}}>
      <Sidebar onNavigate={(ruta) => router.push(ruta)} actual="/dashboard" />
      <section style={{flex:1,padding:"32px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <h1 style={{fontSize:"22px",fontWeight:"500",margin:"0 0 4px",textAlign:"center"}}>¿Cómo llegaste hoy?</h1>
        <p style={{fontSize:"13px",color:"#888",margin:"0 0 28px",textAlign:"center"}}>Tu respuesta ajusta tu sesión de estudio</p>
        <div style={{display:"flex",flexDirection:"column",gap:"10px",width:"100%",maxWidth:"420px"}}>
          {emociones.map((e, i) => (
            <div key={i} onClick={() => seleccionarEmocion(i)} style={{display:"flex",alignItems:"center",gap:"14px",padding:"14px 16px",borderRadius:"12px",border:`0.5px solid ${e.color}`,background:emocionSeleccionada===i?e.fondo:"white",cursor:"pointer"}}>
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