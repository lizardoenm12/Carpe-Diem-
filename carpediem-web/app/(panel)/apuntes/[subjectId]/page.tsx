"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
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
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "captain",
      text: "Hola. Soy el Capitán. Cuando esta materia tenga archivos procesados, podré ayudarte a estudiar este contenido.",
    },
  ]);

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

  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      await fetchSubject();
      await fetchFiles();
      setLoading(false);
    };

    if (subjectId) {
      loadPage();
    }
  }, [subjectId]);

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!currentUser) {
      alert("No hay sesión activa.");
      return;
    }

    if (!subjectId) {
      alert("No se encontró la materia.");
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
      if (event.target) {
        event.target.value = "";
      }
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
          ? "Todavía no tengo archivos de esta materia para responder con contexto. Cuando se suban y procesen, podré ayudarte mejor."
          : "La conexión real con Gemini se implementará después. Por ahora esta es la estructura visual del chat contextual de la materia.",
    };

    setMessages((prev) => [...prev, userMessage, captainMessage]);
    setQuestion("");
  };

  const handleGenerateQuiz = () => {
    setQuizGenerated(true);
  };

  if (loading) return <p>Cargando materia...</p>;

  if (!subject) return <p>La materia no existe.</p>;

  return (
    <div>
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
          <div
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
                <h2 style={{ fontSize: "18px", margin: "0 0 4px" }}>Archivos</h2>
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
                      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{file.fileName}</p>
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
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "0.5px solid #e0e0e0",
            }}
          >
            <h2 style={{ fontSize: "18px", margin: "0 0 8px" }}>Preguntar al Capitán</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 16px" }}>
              Este espacio servirá para conversar con la IA usando el contexto de esta materia.
            </p>

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
                    border: msg.role === "captain" ? "0.5px solid #e0e0e0" : "none",
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
          </div>
        </div>

        <div>
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "24px",
              border: "0.5px solid #e0e0e0",
            }}
          >
            <h2 style={{ fontSize: "18px", margin: "0 0 8px" }}>Cuestionario</h2>
            <p style={{ fontSize: "13px", color: "#888", margin: "0 0 16px", lineHeight: "1.6" }}>
              Aquí se generará un cuestionario usando los archivos subidos o el contexto trabajado con el Capitán.
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
                  minHeight: "180px",
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
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    background: "#FDFBEA",
                    borderRadius: "12px",
                    padding: "14px",
                    border: "0.5px solid #ead37f",
                  }}
                >
                  <p style={{ fontWeight: 600, margin: "0 0 8px" }}>
                    1. ¿Cuál es la idea principal del material cargado?
                  </p>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Cuestionario visual pendiente de conectar con IA.
                  </p>
                </div>

                <div
                  style={{
                    background: "#FDFBEA",
                    borderRadius: "12px",
                    padding: "14px",
                    border: "0.5px solid #ead37f",
                  }}
                >
                  <p style={{ fontWeight: 600, margin: "0 0 8px" }}>
                    2. ¿Qué concepto necesita más repaso?
                  </p>
                  <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
                    Esta sección se llenará después con contenido real generado por Gemini.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}