"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { COLLECTIONS } from "@/lib/firestore_colections";
import { useRouter } from "next/navigation";

export default function ApuntesPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  const fetchSubjects = async (uid: string) => {
    try {
      const q = query(
        collection(db, COLLECTIONS.subjects),
        where("uid", "==", uid)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setSubjects(data);
    } catch (error) {
      console.error("Error cargando materias:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSubjects(currentUser.uid);
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const createSubject = async () => {
    if (!newSubject.trim()) {
      alert("Escribe un nombre para la materia.");
      return;
    }

    if (!currentUser) {
      alert("No hay sesión activa.");
      return;
    }

    try {
      await addDoc(collection(db, COLLECTIONS.subjects), {
        uid: currentUser.uid,
        name: newSubject.trim(),
        createdAt: new Date(),
      });

      setNewSubject("");
      setShowModal(false);
      fetchSubjects(currentUser.uid);
    } catch (error) {
      console.error("Error creando materia:", error);
      alert("Hubo un error al guardar la materia.");
    }
  };

  const deleteSubject = async (subjectId: string, subjectName: string) => {
  const confirmar = confirm(
    `¿Seguro que quieres eliminar "${subjectName}"? Se borrarán también sus archivos registrados, chats y mensajes.`
  );

  if (!confirmar) return;

  try {
    const filesQuery = query(
      collection(db, COLLECTIONS.subjectFiles),
      where("subjectId", "==", subjectId)
    );
    const filesSnap = await getDocs(filesQuery);

    for (const fileDoc of filesSnap.docs) {
      await deleteDoc(doc(db, COLLECTIONS.subjectFiles, fileDoc.id));
    }

    const chatsQuery = query(
      collection(db, COLLECTIONS.subjectChats),
      where("subjectId", "==", subjectId)
    );
    const chatsSnap = await getDocs(chatsQuery);

    for (const chatDoc of chatsSnap.docs) {
      const messagesQuery = query(
        collection(db, COLLECTIONS.subjectChatMessages),
        where("chatId", "==", chatDoc.id)
      );
      const messagesSnap = await getDocs(messagesQuery);

      for (const msgDoc of messagesSnap.docs) {
        await deleteDoc(doc(db, COLLECTIONS.subjectChatMessages, msgDoc.id));
      }

      await deleteDoc(doc(db, COLLECTIONS.subjectChats, chatDoc.id));
    }

    await deleteDoc(doc(db, COLLECTIONS.subjects, subjectId));

    if (currentUser) {
      fetchSubjects(currentUser.uid);
    }

    alert("Materia eliminada con todo su contenido.");
  } catch (error) {
    console.error("Error eliminando materia completa:", error);
    alert("No se pudo eliminar la materia completa.");
  }
  
};

  return (
    <div className="page-scroll">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
          marginBottom: "28px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "34px" }}>📚</span>
            <h1
              style={{
                fontSize: "38px",
                margin: 0,
                color: "#4C6FA8",
                fontWeight: 800,
              }}
            >
              Apuntes
            </h1>
          </div>

          <p style={{ margin: 0, fontSize: "15px", color: "#6E86B3" }}>
            Organiza tus materias y centraliza tus archivos de estudio.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "12px 18px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #6AA5EC, #7EB7F2)",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            boxShadow: "0 12px 24px rgba(106, 165, 236, 0.24)",
          }}
        >
          + Agregar materia
        </button>
      </div>

      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.82), rgba(244,248,252,0.95))",
          borderRadius: "24px",
          padding: "28px",
          border: "1px solid #DCE8F6",
          minHeight: "460px",
          boxShadow: "0 18px 40px rgba(76, 111, 168, 0.08)",
        }}
      >
        {loading ? (
          <p style={{ color: "#7B8CA8" }}>Cargando materias...</p>
        ) : subjects.length === 0 ? (
          <div
            style={{
              minHeight: "340px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "#7B8CA8",
            }}
          >
            <div style={{ fontSize: "46px", marginBottom: "12px" }}>🗂️</div>
            <p style={{ fontSize: "17px", margin: "0 0 6px" }}>
              Aún no tienes materias creadas.
            </p>
            <p style={{ fontSize: "14px", margin: 0 }}>
              Agrega una materia para comenzar a organizar tus apuntes.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
            }}
          >
            {subjects.map((s) => (
              <div
                key={s.id}
                style={{
                  position: "relative",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.96), rgba(242,247,253,0.96))",
                  border: "1px solid #DCE8F6",
                  borderRadius: "22px",
                  padding: "22px",
                  minHeight: "190px",
                  boxShadow: "0 14px 28px rgba(76, 111, 168, 0.08)",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSubject(s.id, s.name);
                  }}
                  title="Eliminar materia"
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    border: "1px solid #F1C7C7",
                    background: "#FFF5F5",
                    color: "#B04B4B",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  ×
                </button>

                <div
                  onClick={() => router.push(`/apuntes/${s.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "15px",
                      background: "#E8F4FF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "25px",
                      marginBottom: "18px",
                    }}
                  >
                    📘
                  </div>

                  <h3
                    style={{
                      margin: "0 0 10px",
                      fontSize: "22px",
                      color: "#3F66A3",
                      fontWeight: 800,
                    }}
                  >
                    {s.name}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      fontSize: "14px",
                      color: "#6E86B3",
                      lineHeight: "1.6",
                      maxWidth: "90%",
                    }}
                  >
                    Archivos, conversaciones del Capitán y cuestionarios de esta
                    materia.
                  </p>

                  <div
                    style={{
                      marginTop: "18px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 11px",
                      borderRadius: "999px",
                      background: "#EEF5FB",
                      color: "#4C6FA8",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Entrar →
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(44, 62, 80, 0.28)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "18px",
              width: "100%",
              maxWidth: "400px",
              border: "1px solid #E3EBF5",
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#4C6FA8" }}>
              Crear materia
            </h3>

            <p
              style={{
                margin: "0 0 16px",
                fontSize: "14px",
                color: "#7B8CA8",
              }}
            >
              Agrega el nombre de una materia para organizar tus archivos,
              conversaciones y cuestionarios.
            </p>

            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Ej. Física, Cálculo, Química..."
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #D6E2F1",
                fontSize: "14px",
                outline: "none",
                marginBottom: "16px",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowModal(false)}
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

              <button
                onClick={createSubject}
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#6AA5EC",
                  color: "white",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}