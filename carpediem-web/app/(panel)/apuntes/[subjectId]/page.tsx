"use client";

import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useParams, useRouter } from "next/navigation";
import { auth, db, storage } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";

type Subject = {
  id?: string;
  uid: string;
  name: string;
  description?: string;
  createdAt?: any;
};

type SubjectFile = {
  id?: string;
  uid: string;
  subjectId: string;
  fileName: string;
  fileType: string;
  downloadURL: string;
  storagePath: string;
  createdAt?: any;
};

type ChatMessage = {
  role: "user" | "captain";
  text: string;
};

export default function SubjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const subjectId = params.subjectId as string;
  const currentUser = auth.currentUser;

  const [subject, setSubject] = useState<Subject | null>(null);
  const [files, setFiles] = useState<SubjectFile[]>([]);
  const [savedChats, setSavedChats] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingChats, setLoadingChats] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "captain",
      text: "Hola. Soy el Capitán. Este chat pertenece a esta materia. Puedes hacer preguntas y luego guardar la conversación aquí mismo.",
    },
  ]);

  const [activeChatTitle, setActiveChatTitle] = useState<string | null>(null);
  const [quizGenerated, setQuizGenerated] = useState(false);

  const fetchSubject = async () => {
    try {
      const refDoc = doc(db, COLLECTIONS.subjects, subjectId);
      const snap = await getDoc(refDoc);

      if (snap.exists()) {
        setSubject({
          id: snap.id,
          ...(snap.data() as Omit<Subject, "id">),
        });
      } else {
        setSubject(null);
      }
    } catch (error) {
      console.error("Error cargando materia:", error);
      setSubject(null);
    }
  };

  const fetchFiles = async () => {
    try {
      const q = query(
        collection(db, COLLECTIONS.subjectFiles),
        where("subjectId", "==", subjectId)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as SubjectFile[];

      setFiles(data);
    } catch (error) {
      console.error("Error cargando archivos:", error);
    }
  };

  const fetchSavedChats = async () => {
    try {
      const q = query(
        collection(db, COLLECTIONS.subjectChats),
        where("subjectId", "==", subjectId)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setSavedChats(data);
    } catch (error) {
      console.error("Error cargando chats guardados:", error);
    } finally {
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setLoadingChats(true);

      await fetchSubject();
      await fetchFiles();
      await fetchSavedChats();

      setLoading(false);
    };

    if (subjectId) {
      loadPage();
    }
  }, [subjectId]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!currentUser) {
      alert("No hay sesión activa.");
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert("El archivo es muy grande. Máximo 5MB por ahora.");
      return;
    }

    setUploading(true);

    try {
      const cleanFileName = `${Date.now()}_${selectedFile.name}`;
      const storagePath = `subjects/${currentUser.uid}/${subjectId}/${cleanFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      await addDoc(collection(db, COLLECTIONS.subjectFiles), {
        uid: currentUser.uid,
        subjectId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        downloadURL,
        storagePath,
        createdAt: new Date(),
      });

      await fetchFiles();
      alert("Archivo subido correctamente.");
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      alert("Hubo un problema al subir el archivo.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleSendQuestion = () => {
    if (!question.trim()) return;

    const userMessage: ChatMessage = {
      role: "user",
      text: question.trim(),
    };

    const captainMessage: ChatMessage = {
      role: "captain",
      text:
        files.length === 0
          ? "Todavía no tengo archivos de esta materia para responder con contexto. Puedes seguir preguntando, pero cuando subas material podré ayudarte mejor."
          : "Por ahora este chat está listo visualmente. Luego conectaremos Gemini para responder con el contexto real de los archivos.",
    };

    setMessages((prev) => [...prev, userMessage, captainMessage]);
    setQuestion("");
  };

  const saveCurrentChat = async () => {
    if (!currentUser) {
      alert("No hay sesión activa.");
      return;
    }

    const hasUserMessage = messages.some((m) => m.role === "user");

    if (!hasUserMessage) {
      alert("Primero escribe algo en el chat antes de guardarlo.");
      return;
    }

    try {
      const firstUserMessage =
        messages.find((m) => m.role === "user")?.text ||
        `Chat de ${subject?.name || "materia"}`;

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

      for (const message of messages) {
        await addDoc(collection(db, COLLECTIONS.subjectChatMessages), {
          chatId: chatRef.id,
          uid: currentUser.uid,
          subjectId,
          role: message.role,
          text: message.text,
          createdAt: new Date(),
        });
      }

      await fetchSavedChats();
      alert("Conversación guardada en esta materia.");
    } catch (error) {
      console.error("Error guardando conversación:", error);
      alert("No se pudo guardar la conversación.");
    }
  };

  const openSavedChat = async (chat: any) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.subjectChatMessages),
        where("chatId", "==", chat.id)
      );

      const snapshot = await getDocs(q);
      const loadedMessages = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();

        return {
          role: data.role === "user" ? "user" : "captain",
          text: data.text,
          createdAt: data.createdAt,
        };
      }) as any[];

      loadedMessages.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return aTime - bTime;
      });

      setMessages(
        loadedMessages.map((m) => ({
          role: m.role,
          text: m.text,
        }))
      );

      setActiveChatTitle(chat.title || "Conversación guardada");
    } catch (error) {
      console.error("Error abriendo chat:", error);
      alert("No se pudo abrir la conversación.");
    }
  };

  const deleteChat = async (chatId: string) => {
    const confirmar = confirm("¿Seguro que quieres eliminar esta conversación?");
    if (!confirmar) return;

    try {
      const q = query(
        collection(db, COLLECTIONS.subjectChatMessages),
        where("chatId", "==", chatId)
      );

      const snapshot = await getDocs(q);

      for (const msg of snapshot.docs) {
        await deleteDoc(doc(db, COLLECTIONS.subjectChatMessages, msg.id));
      }

      await deleteDoc(doc(db, COLLECTIONS.subjectChats, chatId));

      await fetchSavedChats();
      alert("Conversación eliminada.");
    } catch (error) {
      console.error("Error eliminando conversación:", error);
      alert("No se pudo eliminar la conversación.");
    }
  };

  const handleGenerateQuiz = () => {
    setQuizGenerated(true);
  };

  if (loading) return <p>Cargando materia...</p>;

  if (!subject) return <p>La materia no existe.</p>;

  return (
    <div className="page-scroll">
      <button
        onClick={() => router.push("/apuntes")}
        style={{
          marginBottom: "16px",
          padding: "8px 14px",
          borderRadius: "8px",
          border: "none",
          background: "#6AA5EC",
          color: "white",
          cursor: "pointer",
        }}
      >
        ← Volver a materias
      </button>

      <div style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>
          Apuntes / Materia
        </p>
        <h1 style={{ fontSize: "30px", margin: 0 }}>{subject.name}</h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.15fr 0.85fr",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "0.5px solid #e0e0e0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                marginBottom: "16px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", margin: "0 0 4px" }}>
                  Archivos
                </h2>
                <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
                  Sube PDFs o imágenes para construir el contexto de estudio.
                </p>
              </div>

              <button
                onClick={handleFileButtonClick}
                disabled={uploading}
                style={{
                  padding: "10px 16px",
                  borderRadius: "10px",
                  background: uploading ? "#d9d9d9" : "#6AA5EC",
                  color: "white",
                  border: "none",
                  cursor: uploading ? "not-allowed" : "pointer",
                }}
              >
                {uploading ? "Subiendo..." : "+ Subir archivo"}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {files.length === 0 ? (
              <div
                style={{
                  background: "#F6F8FB",
                  borderRadius: "12px",
                  padding: "18px",
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                Aún no hay archivos subidos en esta materia.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {files.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "#F6F8FB",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
                        {file.fileName}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                        {file.fileType || "Tipo desconocido"}
                      </p>
                    </div>

                    <a
                      href={file.downloadURL}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        background: "white",
                        border: "1px solid #ddd",
                        fontSize: "13px",
                      }}
                    >
                      Ver archivo
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "0.5px solid #e0e0e0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "12px",
                marginBottom: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", margin: "0 0 8px" }}>
                  Chat de la materia
                </h2>
                <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
                  {activeChatTitle
                    ? `Conversación abierta: ${activeChatTitle}`
                    : "Haz preguntas y guarda la conversación dentro de esta materia."}
                </p>
              </div>

              <button
                onClick={saveCurrentChat}
                style={{
                  padding: "9px 12px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#6AA5EC",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                Guardar chat
              </button>
            </div>

            <div
              style={{
                minHeight: "240px",
                maxHeight: "320px",
                overflowY: "auto",
                borderRadius: "12px",
                background: "#F6F8FB",
                padding: "14px",
                marginBottom: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: msg.role === "user" ? "#B2D8B2" : "white",
                    color: msg.role === "user" ? "#27500A" : "#444",
                    border:
                      msg.role === "captain" ? "0.5px solid #e0e0e0" : "none",
                    borderRadius:
                      msg.role === "user"
                        ? "16px 16px 4px 16px"
                        : "16px 16px 16px 4px",
                    padding: "12px 14px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                  }}
                >
                  {msg.text}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Haz una pregunta sobre esta materia..."
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid #ddd",
                }}
              />
              <button
                onClick={handleSendQuestion}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "#B2D8B2",
                  color: "#27500A",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Enviar
              </button>
            </div>
          </section>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "0.5px solid #e0e0e0",
            }}
          >
            <h2 style={{ fontSize: "18px", margin: "0 0 8px" }}>
              Conversaciones guardadas
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#888",
                margin: "0 0 16px",
              }}
            >
              Chats del Capitán vinculados a esta materia.
            </p>

            {loadingChats ? (
              <p style={{ color: "#888", fontSize: "14px" }}>
                Cargando conversaciones...
              </p>
            ) : savedChats.length === 0 ? (
              <div
                style={{
                  background: "#F6F8FB",
                  borderRadius: "12px",
                  padding: "16px",
                  color: "#888",
                  fontSize: "14px",
                }}
              >
                Todavía no hay conversaciones guardadas en esta materia.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                {savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "12px",
                      background: "#F7FAFE",
                      border: "1px solid #E3EBF5",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontWeight: 600,
                        color: "#4C6FA8",
                      }}
                    >
                      {chat.title || "Conversación sin título"}
                    </p>

                    <p
                      style={{
                        margin: "0 0 12px",
                        fontSize: "12px",
                        color: "#7B8CA8",
                      }}
                    >
                      Chat guardado en esta materia
                    </p>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openSavedChat(chat)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#6AA5EC",
                          color: "white",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Abrir
                      </button>

                      <button
                        onClick={() => deleteChat(chat.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "10px",
                          border: "none",
                          background: "#FDEAEA",
                          color: "#B04B4B",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "0.5px solid #e0e0e0",
            }}
          >
            <h2 style={{ fontSize: "18px", margin: "0 0 8px" }}>
              Cuestionario
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#888",
                margin: "0 0 16px",
                lineHeight: "1.6",
              }}
            >
              Aquí se generará un cuestionario usando archivos o el contexto del
              chat.
            </p>

            <button
              onClick={handleGenerateQuiz}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#F2C16B",
                color: "#6A4A00",
                border: "none",
                cursor: "pointer",
                marginBottom: "14px",
              }}
            >
              Generar cuestionario
            </button>

            {!quizGenerated ? (
              <div
                style={{
                  minHeight: "150px",
                  borderRadius: "12px",
                  background: "#FDFBEA",
                  padding: "14px",
                  color: "#888",
                  fontSize: "14px",
                  lineHeight: "1.6",
                }}
              >
                Todavía no se ha generado un cuestionario para esta materia.
              </div>
            ) : (
              <div style={{ display: "grid", gap: "12px" }}>
                <div
                  style={{
                    background: "#FDFBEA",
                    borderRadius: "12px",
                    padding: "14px",
                    border: "0.5px solid #ead37f",
                  }}
                >
                  <p style={{ fontWeight: 600, margin: "0 0 8px" }}>
                    1. ¿Cuál es la idea principal del material o conversación?
                  </p>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Cuestionario visual pendiente de conectar con Gemini.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}