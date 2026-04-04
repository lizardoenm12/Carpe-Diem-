"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

const pasos = [
  { titulo: "Tus apuntes, ordenados", descripcion: "Sube PDFs, fotos de notas o conecta tus apps. La IA los organiza por ti.", icono: "📚" },
  { titulo: "Tu tiempo, bajo control", descripcion: "El calendario detecta exámenes y tareas cercanas. Sin sorpresas de último minuto.", icono: "📅" },
  { titulo: "A tu ritmo, a tu manera", descripcion: "La app aprende cómo estudias mejor y se adapta a ti cada día.", icono: "🌿" },
];

export default function Onboarding() {
  const [paso, setPaso] = useState(0);
  const [perfil, setPerfil] = useState("");
  const [metodo, setMetodo] = useState("");
  const [enPerfil, setEnPerfil] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const siguiente = () => {
    if (paso < pasos.length - 1) setPaso(paso + 1);
    else setEnPerfil(true);
  };

  const guardarPerfil = async () => {
    if (!currentUser) {
      alert("No hay sesión activa.");
      router.push("/");
      return;
    }
    setGuardando(true);
    try {
      await setDoc(doc(db, "users", currentUser.uid), {
        perfil,
        metodo,
        onboardingComplete: true,
        creadoEn: new Date(),
      });
      router.push("/checkin");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setGuardando(false);
    }
  };

  if (enPerfil) {
    return (
      <main style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5DC",padding:"24px"}}>
        <div style={{background:"white",borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"400px",border:"0.5px solid #e0e0e0"}}>
          <h2 style={{fontSize:"18px",fontWeight:"500",margin:"0 0 6px"}}>Cuéntanos sobre ti</h2>
          <p style={{fontSize:"13px",color:"#888",margin:"0 0 20px"}}>Solo tarda 1 minuto</p>
          <p style={{fontSize:"13px",color:"#555",margin:"0 0 8px"}}>¿Cómo te describes?</p>
          <div style={{display:"flex",flexDirection:"column",gap:"8px",marginBottom:"20px"}}>
            {["Neurodivergente (TDAH / TEA)", "Neurotípico", "No estoy seguro/a"].map((op) => (
              <div key={op} onClick={() => setPerfil(op)} style={{padding:"10px 14px",borderRadius:"8px",border:perfil===op?"1.5px solid #1D9E75":"0.5px solid #ddd",background:perfil===op?"#E1F5EE":"white",cursor:"pointer",fontSize:"13px",color:perfil===op?"#085041":"#555"}}>
                {op}
              </div>
            ))}
          </div>
          <p style={{fontSize:"13px",color:"#555",margin:"0 0 8px"}}>Método de estudio preferido</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginBottom:"24px"}}>
            {["Pomodoro", "Feynman", "Active Recall", "No sé aún"].map((op) => (
              <div key={op} onClick={() => setMetodo(op)} style={{padding:"6px 14px",borderRadius:"20px",border:metodo===op?"1.5px solid #1D9E75":"0.5px solid #ddd",background:metodo===op?"#E1F5EE":"white",cursor:"pointer",fontSize:"12px",color:metodo===op?"#085041":"#555"}}>
                {op}
              </div>
            ))}
          </div>
          <button onClick={guardarPerfil} disabled={!perfil||!metodo||guardando} style={{width:"100%",padding:"12px",borderRadius:"8px",background:perfil&&metodo?"#B2D8B2":"#e0e0e0",border:"none",fontSize:"14px",fontWeight:"500",color:perfil&&metodo?"#27500A":"#999",cursor:perfil&&metodo?"pointer":"not-allowed"}}>
            {guardando ? "Guardando..." : "Empezar"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5DC",padding:"24px"}}>
      <div style={{background:"white",borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"400px",border:"0.5px solid #e0e0e0",textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"16px"}}>
          <span onClick={() => router.push("/checkin")} style={{fontSize:"12px",color:"#aaa",cursor:"pointer"}}>Saltar</span>
        </div>
        <div style={{fontSize:"48px",marginBottom:"16px"}}>{pasos[paso].icono}</div>
        <div style={{display:"flex",justifyContent:"center",gap:"6px",marginBottom:"20px"}}>
          {pasos.map((_, i) => (
            <div key={i} style={{width:"8px",height:"8px",borderRadius:"50%",background:i===paso?"#B2D8B2":"#e0e0e0"}}/>
          ))}
        </div>
        <h2 style={{fontSize:"18px",fontWeight:"500",margin:"0 0 10px"}}>{pasos[paso].titulo}</h2>
        <p style={{fontSize:"13px",color:"#888",margin:"0 0 28px",lineHeight:"1.6"}}>{pasos[paso].descripcion}</p>
        <button onClick={siguiente} style={{width:"100%",padding:"12px",borderRadius:"8px",background:"#B2D8B2",border:"none",fontSize:"14px",fontWeight:"500",color:"#27500A",cursor:"pointer"}}>
          {paso < pasos.length - 1 ? "Siguiente" : "Continuar"}
        </button>
      </div>
    </main>
  );
}