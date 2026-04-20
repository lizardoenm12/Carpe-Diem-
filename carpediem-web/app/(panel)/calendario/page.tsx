"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

type Evento = {
  id: string;
  titulo: string;
  fecha: string;
  tipo: "examen" | "tarea" | "proyecto" | "personal";
  uid: string;
  completado?: boolean;
};

const colores = {
  examen: { bg: "#FEF0EE", border: "#E87A6A", punto: "#E87A6A", label: "Examen" },
  tarea: { bg: "#FDFBEA", border: "#E8C84A", punto: "#E8C84A", label: "Tarea" },
  proyecto: { bg: "#EDF3FE", border: "#6A9AE8", punto: "#6A9AE8", label: "Proyecto" },
  personal: { bg: "#F0FAF4", border: "#7DBF9E", punto: "#7DBF9E", label: "Personal" },
};

const getMensaje = (titulo: string, dias: number) => {
  if (dias === 0) return `¡Hoy es ${titulo}! Tú puedes. 💪`;
  if (dias === 1) return `Mañana es ${titulo}. ¿Todo listo?`;
  if (dias <= 3) return `${titulo} en ${dias} días. ¡Último repaso!`;
  if (dias <= 7) return `${titulo} en ${dias} días. Esta semana es clave.`;
  if (dias <= 14) return `${titulo} en 2 semanas. Buen momento para empezar.`;
  return null;
};

const getGradiente = (dias: number) => {
  if (dias <= 1) return "#E87A6A";
  if (dias <= 3) return "#E8A157";
  if (dias <= 7) return "#E8C84A";
  if (dias <= 14) return "#7DBF9E";
  return "#B2D8B2";
};

export default function Calendario() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState<"examen"|"tarea"|"proyecto"|"personal">("examen");
  const [guardando, setGuardando] = useState(false);
  const [vistaCalendario, setVistaCalendario] = useState(true);
  const [mesActual, setMesActual] = useState(new Date());
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) cargarEventos(user.uid);
    });
    return unsubscribe;
  }, []);

  const cargarEventos = async (uid: string) => {
    const q = query(collection(db, "eventos"), where("uid", "==", uid), orderBy("fecha"));
    const snap = await getDocs(q);
    setEventos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Evento)));
  };

  const agregarEvento = async () => {
    if (!nuevoTitulo || !nuevaFecha || !currentUser) return;
    setGuardando(true);
    try {
      await addDoc(collection(db, "eventos"), {
        titulo: nuevoTitulo,
        fecha: nuevaFecha,
        tipo: nuevoTipo,
        uid: currentUser.uid,
        completado: false,
      });
      setNuevoTitulo("");
      setNuevaFecha("");
      setMostrarForm(false);
      cargarEventos(currentUser.uid);
    } catch (error) {
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  const toggleCompletado = async (evento: Evento) => {
    try {
      await updateDoc(doc(db, "eventos", evento.id), {
        completado: !evento.completado,
      });
      setEventos(prev => prev.map(e => e.id === evento.id ? {...e, completado: !e.completado} : e));
    } catch (error) {
      console.error(error);
    }
  };

  const getDias = (fecha: string) => {
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    const evento = new Date(fecha + "T00:00:00");
    return Math.round((evento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getDiasEnMes = () => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1).getDay();
    const diasEnMes = new Date(year, month + 1, 0).getDate();
    const offset = primerDia === 0 ? 6 : primerDia - 1;
    return { diasEnMes, offset };
  };

  const getEventosDelDia = (dia: number) => {
    const year = mesActual.getFullYear();
    const month = String(mesActual.getMonth() + 1).padStart(2, "0");
    const diaStr = String(dia).padStart(2, "0");
    const fechaStr = `${year}-${month}-${diaStr}`;
    return eventos.filter(e => e.fecha === fechaStr);
  };

  const nombreMes = mesActual.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  const { diasEnMes, offset } = getDiasEnMes();
  const hoy = new Date();
  const eventosFuturos = eventos.filter(e => getDias(e.fecha) >= 0);
  const eventosSemana = eventosFuturos.filter(e => getDias(e.fecha) <= 7);
  const eventoProximos = eventosFuturos.filter(e => getDias(e.fecha) > 7).slice(0, 8);
  const mensajes = eventosFuturos.slice(0,3).map(e => getMensaje(e.titulo, getDias(e.fecha))).filter(Boolean);

  const CheckItem = ({ evento }: { evento: Evento }) => {
    const c = colores[evento.tipo];
    const dias = getDias(evento.fecha);
    return (
      <div style={{display:"flex",alignItems:"flex-start",gap:"10px",padding:"8px 0",borderBottom:"0.5px solid #f5f5f5"}}>
        <div
          onClick={() => toggleCompletado(evento)}
          style={{width:"16px",height:"16px",borderRadius:"4px",border:`1.5px solid ${evento.completado ? c.punto : "#ddd"}`,background:evento.completado ? c.punto : "white",cursor:"pointer",flexShrink:0,marginTop:"2px",display:"flex",alignItems:"center",justifyContent:"center"}}
        >
          {evento.completado && <span style={{color:"white",fontSize:"10px",fontWeight:"700"}}>✓</span>}
        </div>
        <div style={{flex:1}}>
          <p style={{fontSize:"12px",fontWeight:"500",color:evento.completado?"#bbb":"#444",margin:"0 0 2px",textDecoration:evento.completado?"line-through":"none"}}>{evento.titulo}</p>
          <p style={{fontSize:"10px",color:"#bbb",margin:"0"}}>{dias === 0 ? "Hoy" : dias === 1 ? "Mañana" : `En ${dias} días`} · {c.label}</p>
        </div>
      </div>
    );
  };

  return (
    <main style={{display:"flex",minHeight:"100vh",background:"#F5F5DC"}}>
    

      <section style={{flex:1,padding:"32px",display:"flex",gap:"24px",alignItems:"flex-start"}}>

        <div style={{flex:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <h1 style={{fontSize:"22px",fontWeight:"500",margin:"0"}}>Calendario</h1>
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={() => setVistaCalendario(!vistaCalendario)} style={{padding:"8px 14px",borderRadius:"8px",background:"white",border:"0.5px solid #ddd",fontSize:"12px",cursor:"pointer",color:"#555"}}>
                {vistaCalendario ? "Vista lista" : "Vista calendario"}
              </button>
              <button onClick={() => setMostrarForm(!mostrarForm)} style={{padding:"8px 16px",borderRadius:"8px",background:"#B2D8B2",border:"none",fontSize:"13px",fontWeight:"500",color:"#27500A",cursor:"pointer"}}>
                + Agregar evento
              </button>
            </div>
          </div>
          <p style={{fontSize:"13px",color:"#888",margin:"0 0 20px"}}>Tus fechas importantes</p>

          {mensajes.length > 0 && (
            <div style={{background:"white",borderRadius:"16px",padding:"16px 20px",border:"0.5px solid #e0e0e0",marginBottom:"20px"}}>
              <p style={{fontSize:"12px",color:"#aaa",margin:"0 0 8px"}}>✨ Carpe Diem IA</p>
              {mensajes.map((m, i) => (
                <p key={i} style={{fontSize:"14px",color:"#555",margin:"0 0 4px",lineHeight:"1.6"}}>{m}</p>
              ))}
            </div>
          )}

          {mostrarForm && (
            <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0",marginBottom:"20px"}}>
              <p style={{fontSize:"14px",fontWeight:"500",margin:"0 0 14px"}}>Nuevo evento</p>
              <input value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} placeholder="Nombre del evento" style={{width:"100%",padding:"10px",borderRadius:"8px",border:"0.5px solid #ddd",fontSize:"13px",marginBottom:"10px",boxSizing:"border-box"}}/>
              <div style={{display:"flex",gap:"10px",marginBottom:"10px"}}>
                <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} style={{flex:1,padding:"10px",borderRadius:"8px",border:"0.5px solid #ddd",fontSize:"13px"}}/>
                <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value as any)} style={{flex:1,padding:"10px",borderRadius:"8px",border:"0.5px solid #ddd",fontSize:"13px"}}>
                  <option value="examen">Examen</option>
                  <option value="tarea">Tarea</option>
                  <option value="proyecto">Proyecto</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <button onClick={agregarEvento} disabled={!nuevoTitulo||!nuevaFecha||guardando} style={{width:"100%",padding:"10px",borderRadius:"8px",background:"#B2D8B2",border:"none",fontSize:"13px",fontWeight:"500",color:"#27500A",cursor:"pointer"}}>
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </div>
          )}

          {vistaCalendario && (
            <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0",marginBottom:"20px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
                <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()-1))} style={{padding:"6px 12px",borderRadius:"8px",background:"transparent",border:"0.5px solid #ddd",cursor:"pointer",fontSize:"16px"}}>‹</button>
                <p style={{fontSize:"15px",fontWeight:"500",margin:"0",textTransform:"capitalize"}}>{nombreMes}</p>
                <button onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth()+1))} style={{padding:"6px 12px",borderRadius:"8px",background:"transparent",border:"0.5px solid #ddd",cursor:"pointer",fontSize:"16px"}}>›</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px",marginBottom:"4px"}}>
                {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
                  <div key={d} style={{textAlign:"center",fontSize:"11px",color:"#aaa",padding:"4px 0",fontWeight:"500"}}>{d}</div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:"2px"}}>
                {Array.from({length: offset}).map((_, i) => (
                  <div key={`empty-${i}`} style={{minHeight:"52px"}}/>
                ))}
                {Array.from({length: diasEnMes}).map((_, i) => {
                  const dia = i + 1;
                  const eventosHoy = getEventosDelDia(dia);
                  const esHoy = hoy.getDate()===dia && hoy.getMonth()===mesActual.getMonth() && hoy.getFullYear()===mesActual.getFullYear();
                  return (
                    <div key={dia} style={{minHeight:"52px",padding:"4px",borderRadius:"8px",background:esHoy?"#E1F5EE":"transparent",border:esHoy?"0.5px solid #7DBF9E":"0.5px solid transparent"}}>
                      <p style={{fontSize:"12px",fontWeight:esHoy?"500":"400",color:esHoy?"#085041":"#444",margin:"0 0 3px",textAlign:"center"}}>{dia}</p>
                      <div style={{display:"flex",flexWrap:"wrap",gap:"2px",justifyContent:"center"}}>
                        {eventosHoy.map(e => (
                          <div key={e.id} title={e.titulo} style={{width:"8px",height:"8px",borderRadius:"50%",background:colores[e.tipo].punto,opacity:e.completado?0.3:1}}/>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{display:"flex",gap:"12px",marginTop:"12px",flexWrap:"wrap"}}>
                {Object.entries(colores).map(([key, c]) => (
                  <div key={key} style={{display:"flex",alignItems:"center",gap:"5px"}}>
                    <div style={{width:"8px",height:"8px",borderRadius:"50%",background:c.punto}}/>
                    <span style={{fontSize:"11px",color:"#888"}}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {eventosFuturos.filter(e => !e.completado).length === 0 ? (
              <div style={{background:"white",borderRadius:"16px",padding:"24px",border:"0.5px solid #e0e0e0",textAlign:"center"}}>
                <p style={{fontSize:"14px",color:"#aaa",margin:"0"}}>No tienes eventos próximos. ¡Agrega uno!</p>
              </div>
            ) : (
              eventosFuturos.filter(e => !e.completado).map(e => {
                const dias = getDias(e.fecha);
                const c = colores[e.tipo];
                return (
                  <div key={e.id} style={{background:"white",borderRadius:"16px",padding:"16px 20px",border:`0.5px solid ${c.border}`,display:"flex",alignItems:"center",gap:"16px"}}>
                    <div style={{width:"6px",height:"48px",borderRadius:"3px",background:getGradiente(dias),flexShrink:0}}/>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"4px"}}>
                        <p style={{fontSize:"14px",fontWeight:"500",color:"#333",margin:"0"}}>{e.titulo}</p>
                        <span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"20px",background:c.bg,color:c.border,border:`0.5px solid ${c.border}`}}>{c.label}</span>
                      </div>
                      <p style={{fontSize:"12px",color:"#888",margin:"0"}}>{new Date(e.fecha+"T00:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})}</p>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <p style={{fontSize:"20px",fontWeight:"500",color:getGradiente(dias),margin:"0"}}>{dias}</p>
                      <p style={{fontSize:"11px",color:"#aaa",margin:"0"}}>días</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div style={{width:"260px",flexShrink:0,position:"sticky",top:"32px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"20px",border:"0.5px solid #e0e0e0"}}>

            <p style={{fontSize:"14px",fontWeight:"500",color:"#333",margin:"0 0 2px"}}>Esta semana</p>
            <p style={{fontSize:"11px",color:"#aaa",margin:"0 0 12px"}}>{eventosSemana.length} evento{eventosSemana.length !== 1 ? "s" : ""}</p>
            {eventosSemana.length === 0 ? (
              <p style={{fontSize:"12px",color:"#bbb",margin:"0 0 16px"}}>Sin eventos esta semana 🌿</p>
            ) : (
              <div style={{marginBottom:"4px"}}>
                {eventosSemana.map(e => <CheckItem key={e.id} evento={e} />)}
              </div>
            )}

            <div style={{borderTop:"0.5px solid #f0f0f0",marginTop:"16px",paddingTop:"16px"}}>
              <p style={{fontSize:"14px",fontWeight:"500",color:"#333",margin:"0 0 2px"}}>Próximamente</p>
              <p style={{fontSize:"11px",color:"#aaa",margin:"0 0 12px"}}>{eventoProximos.length} evento{eventoProximos.length !== 1 ? "s" : ""}</p>
              {eventoProximos.length === 0 ? (
                <p style={{fontSize:"12px",color:"#bbb",margin:"0"}}>Sin eventos próximos 🌿</p>
              ) : (
                <div>
                  {eventoProximos.map(e => <CheckItem key={e.id} evento={e} />)}
                </div>
              )}
            </div>

            <div style={{borderTop:"0.5px solid #f0f0f0",marginTop:"16px",paddingTop:"16px"}}>
              <p style={{fontSize:"13px",fontWeight:"500",color:"#333",margin:"0 0 10px"}}>Leyenda</p>
              {Object.entries(colores).map(([key, c]) => (
                <div key={key} style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"8px"}}>
                  <div style={{width:"10px",height:"10px",borderRadius:"50%",background:c.punto}}/>
                  <p style={{fontSize:"12px",color:"#555",margin:"0"}}>{c.label}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </section>
    </main>
  );
}