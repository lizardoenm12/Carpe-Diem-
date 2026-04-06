"use client";
import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/firebase";
import Sidebar from "@/components/Sidebar";

const genAI = new GoogleGenerativeAI("AIzaSyAKBuQjtSd82HubZGARSK0PAWRoNnX4WXk");

type Mensaje = {
  rol: "usuario" | "capitan";
  texto: string;
};

export default function Capitan() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    { rol: "capitan", texto: "Soy el Capitán, tu tutor de estudio en Carpe Diem. Siempre puedes llamartme con un buen ¡Oh Capitán, mi Capitán!" }
  ]);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const user = auth.currentUser;

  const enviar = async () => {
    if (!input.trim() || cargando) return;
    const pregunta = input.trim();
    setInput("");
    setMensajes(prev => [...prev, { rol: "usuario", texto: pregunta }]);
    setCargando(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
      const prompt = `Eres el Capitán, un tutor de estudio empático y motivador de la app Carpe Diem, inspirada en "Dead Poets Society". 
      Tu misión es ayudar a estudiantes (especialmente neurodivergentes) a estudiar sin estrés.
      Hablas de forma cálida, directa y alentadora. Nunca juzgas. Siempre fragmentas las tareas en pasos pequeños.
      El usuario se llama ${user?.displayName || "estudiante"}.
      Pregunta del usuario: ${pregunta}`;

      const result = await model.generateContent(prompt);
      const respuesta = result.response.text();
      setMensajes(prev => [...prev, { rol: "capitan", texto: respuesta }]);
    } catch (error) {
      console.error(error);
      setMensajes(prev => [...prev, { rol: "capitan", texto: "Lo siento, tuve un problema. ¿Puedes intentarlo de nuevo?" }]);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main style={{display:"flex",minHeight:"100vh",background:"#F5F5DC"}}>
      <Sidebar />
      <section style={{flex:1,display:"flex",flexDirection:"column",maxHeight:"100vh"}}>

        <div style={{padding:"24px 32px",borderBottom:"0.5px solid #e0e0e0",background:"white"}}>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"20px"}}>⏳</div>
            <div>
              <p style={{fontSize:"15px",fontWeight:"500",margin:"0"}}>El Capitán</p>
              <p style={{fontSize:"12px",color:"#aaa",margin:"0"}}>Tu tutor de estudio · Carpe Diem</p>
            </div>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"24px 32px",display:"flex",flexDirection:"column",gap:"16px"}}>
          {mensajes.map((m, i) => (
            <div key={i} style={{display:"flex",justifyContent:m.rol==="usuario"?"flex-end":"flex-start"}}>
              {m.rol === "capitan" && (
                <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",marginRight:"10px",flexShrink:0,alignSelf:"flex-end"}}>⏳</div>
              )}
              <div style={{maxWidth:"65%",padding:"12px 16px",borderRadius:m.rol==="usuario"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.rol==="usuario"?"#B2D8B2":"white",border:m.rol==="capitan"?"0.5px solid #e0e0e0":"none"}}>
                <p style={{fontSize:"14px",margin:"0",lineHeight:"1.6",color:m.rol==="usuario"?"#27500A":"#444",whiteSpace:"pre-wrap"}}>{m.texto}</p>
              </div>
            </div>
          ))}
          {cargando && (
            <div style={{display:"flex",justifyContent:"flex-start"}}>
              <div style={{width:"32px",height:"32px",borderRadius:"10px",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"16px",marginRight:"10px"}}>⏳</div>
              <div style={{padding:"12px 16px",borderRadius:"16px 16px 16px 4px",background:"white",border:"0.5px solid #e0e0e0"}}>
                <p style={{fontSize:"14px",color:"#aaa",margin:"0"}}>El Capitán está pensando...</p>
              </div>
            </div>
          )}
        </div>

        <div style={{padding:"16px 32px",background:"white",borderTop:"0.5px solid #e0e0e0",display:"flex",gap:"12px"}}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && enviar()}
            placeholder="Escríbele al Capitán..."
            style={{flex:1,padding:"12px 16px",borderRadius:"12px",border:"0.5px solid #ddd",fontSize:"14px",outline:"none"}}
          />
          <button
            onClick={enviar}
            disabled={!input.trim() || cargando}
            style={{padding:"12px 20px",borderRadius:"12px",background:input.trim()?"#B2D8B2":"#e0e0e0",border:"none",fontSize:"14px",fontWeight:"500",color:input.trim()?"#27500A":"#999",cursor:input.trim()?"pointer":"not-allowed"}}
          >
            Enviar
          </button>
        </div>
      </section>
    </main>
  );
}