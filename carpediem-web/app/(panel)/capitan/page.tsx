"use client";

import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";

type Mensaje = {
  rol: "usuario" | "capitan";
  texto: string;
};

export default function Capitan() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      rol: "capitan",
      texto:
        "Soy el Capitán, tu tutor de estudio en Carpe Diem. Siempre puedes llamarme con un buen ¡Oh Capitán, mi Capitán!",
    },
  ]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [savingChat, setSavingChat] = useState(false);
  const [input, setInput] = useState("");
  const [cargando, setCargando] = useState(false);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const mensajesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (mensajesRef.current) {
      mensajesRef.current.scrollTop = mensajesRef.current.scrollHeight;
    }
  }, [mensajes, cargando]);

  const enviar = async () => {
    if (!input.trim() || cargando) return;

    const pregunta = input.trim();
    setInput("");

    const nuevoMensajeUsuario: Mensaje = {
      rol: "usuario",
      texto: pregunta,
    };

    setMensajes((prev) => [...prev, nuevoMensajeUsuario]);
    setCargando(true);

    try {
      const response = await fetch("/api/capitan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: pregunta,
          subjectName: null,
          userName: currentUser?.displayName || currentUser?.email || "estudiante",
          uid: currentUser?.uid || null,
          history: mensajes.map((m) => ({
            role: m.rol === "usuario" ? "user" : "captain",
            text: m.texto,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error desconocido");
      }

      setMensajes((prev) => [
        ...prev,
        {
          rol: "capitan",
          texto: data.reply || "No hubo respuesta.",
        },
      ]);
    } catch (error) {
      console.error(error);
      setMensajes((prev) => [
        ...prev,
        {
          rol: "capitan",
          texto:
            "Tuve un problema al responder. Revisa la configuración de Gemini o la API route.",
        },
      ]);
    } finally {
      setCargando(false);
    }
  };
  const fetchSubjects = async () => {
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, COLLECTIONS.subjects),
      where("uid", "==", currentUser.uid)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setSubjects(data);
  } catch (error) {
    console.error("Error cargando materias:", error);
  }
  };
  const openSaveModal = async () => {
  await fetchSubjects();
  setShowSaveModal(true);
};
const saveChatToSubject = async (subjectId: string, subjectName: string) => {
  if (!currentUser) {
    alert("No hay sesión activa.");
    return;
  }

  if (mensajes.length === 0) {
    alert("No hay conversación para guardar.");
    return;
  }

  setSavingChat(true);

  try {
    const firstUserMessage =
      mensajes.find((m) => m.rol === "usuario")?.texto ||
      `Chat guardado en ${subjectName}`;

    const title =
      firstUserMessage.length > 50
        ? firstUserMessage.slice(0, 50) + "..."
        : firstUserMessage;

    const chatRef = await addDoc(collection(db, COLLECTIONS.subjectChats), {
      uid: currentUser.uid,
      subjectId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    for (const mensaje of mensajes) {
      await addDoc(collection(db, COLLECTIONS.subjectChatMessages), {
        chatId: chatRef.id,
        uid: currentUser.uid,
        subjectId,
        role: mensaje.rol === "usuario" ? "user" : "captain",
        text: mensaje.texto,
        createdAt: new Date(),
      });
    }

    setShowSaveModal(false);
    alert(`Conversación guardada en ${subjectName}.`);
  } catch (error) {
    console.error("Error guardando conversación:", error);
    alert("Hubo un error al guardar la conversación.");
  } finally {
    setSavingChat(false);
  }
};

  return (
    <div className="capitan-shell">
      <div className="capitan-header">
        <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          width: "100%",
      }}
    >

    </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "#E1F5EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            ⏳
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: "500", margin: 0 }}>
              El Capitán
            </p>
            <p style={{ fontSize: "12px", color: "#aaa", margin: 0 }}>
              Tu tutor de estudio · Carpe Diem
            </p>
          </div>
        </div>
      
      </div>

      <div ref={mensajesRef} className="capitan-messages">
        {mensajes.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.rol === "usuario" ? "flex-end" : "flex-start",
              marginBottom: "16px",
            }}
          >
            {m.rol === "capitan" && (
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "10px",
                  background: "#E1F5EE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  marginRight: "10px",
                  flexShrink: 0,
                  alignSelf: "flex-end",
                }}
              >
                ⏳
              </div>
            )}

            <div
              style={{
                maxWidth: "65%",
                padding: "12px 16px",
                borderRadius:
                  m.rol === "usuario"
                    ? "16px 16px 4px 16px"
                    : "16px 16px 16px 4px",
                background: m.rol === "usuario" ? "#B2D8B2" : "white",
                border: m.rol === "capitan" ? "0.5px solid #e0e0e0" : "none",
              }}
            >
              <p
                style={{
                  fontSize: "14px",
                  margin: 0,
                  lineHeight: "1.6",
                  color: m.rol === "usuario" ? "#27500A" : "#444",
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.texto}
              </p>
            </div>
            
          </div>
        ))}

        {cargando && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "16px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "#E1F5EE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                marginRight: "10px",
              }}
            >
              ⏳
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "16px 16px 16px 4px",
                background: "white",
                border: "0.5px solid #e0e0e0",
              }}
            >
              <p style={{ fontSize: "14px", color: "#aaa", margin: 0 }}>
                El Capitán está pensando...
              </p>
            </div>
          </div>
        )}
        
      </div>

      <div className="capitan-inputbar">
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => e.key === "Enter" && enviar()}
    placeholder="Escríbele al Capitán..."
    style={{
      flex: 1,
      padding: "12px 16px",
      borderRadius: "14px",
      border: "1px solid #D6E2F1",
      fontSize: "14px",
      outline: "none",
      background: "white",
    }}
  />

  <button
  onClick={openSaveModal}
  title="Guardar en apuntes"
  style={{
    border: "none",
    background: "transparent",
    padding: 0,
    cursor: "pointer",
  }}
>
  <img
    src="/icons/guardar.png"
    alt="guardar"
    style={{
      width: "40px",
      height: "40px",
      borderRadius: "10px",
    }}
  />
</button>

  <button
    onClick={enviar}
    disabled={!input.trim() || cargando}
    style={{
      padding: "12px 18px",
      borderRadius: "14px",
      background: input.trim()
        ? "linear-gradient(135deg, #6AA5EC, #7EB7F2)"
        : "#E6ECF3",
      color: input.trim() ? "white" : "#8A98AA",
      border: "none",
      fontSize: "14px",
      fontWeight: 700,
      cursor: input.trim() ? "pointer" : "not-allowed",
      boxShadow: input.trim()
        ? "0 10px 20px rgba(106, 165, 236, 0.22)"
        : "none",
    }}
  >
    Enviar
  </button>
</div>
      {showSaveModal && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(44, 62, 80, 0.28)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
      zIndex: 100,
    }}
  >
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "420px",
        border: "1px solid #E3EBF5",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
      }}
    >
      <h3 style={{ margin: "0 0 8px", color: "#4C6FA8" }}>
        Guardar en apuntes
      </h3>
      <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#7B8CA8" }}>
        Elige una materia donde quieras guardar esta conversación.
      </p>

      {subjects.length === 0 ? (
        <div
          style={{
            background: "#F6F8FB",
            borderRadius: "12px",
            padding: "14px",
            color: "#7B8CA8",
            fontSize: "14px",
            marginBottom: "16px",
          }}
        >
          No tienes materias disponibles todavía.
        </div>
      ) : (
        <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => saveChatToSubject(subject.id, subject.name)}
              disabled={savingChat}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: "12px",
                border: "1px solid #E3EBF5",
                background: "#F7FAFE",
                color: "#4C6FA8",
                cursor: savingChat ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {subject.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button
          onClick={() => setShowSaveModal(false)}
          disabled={savingChat}
          style={{
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #D6E2F1",
            background: "white",
            color: "#6F809C",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}