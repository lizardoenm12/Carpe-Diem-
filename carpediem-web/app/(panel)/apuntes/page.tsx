"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
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
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
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

  return (
    <>
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
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>📚</span>
            <h1 style={{ fontSize: "34px", margin: 0, color: "#4C6FA8" }}>Apuntes</h1>
          </div>

          <p style={{ margin: 0, fontSize: "14px", color: "#7B8CA8" }}>
            Organiza tus materias y centraliza tus archivos de estudio.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: "12px 18px",
            borderRadius: "12px",
            background: "#6AA5EC",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
            boxShadow: "0 8px 18px rgba(106, 165, 236, 0.18)",
          }}
        >
          + Agregar materia
        </button>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "18px",
          padding: "22px",
          border: "1px solid #E3EBF5",
          minHeight: "420px",
        }}
      >
        {loading ? (
          <p style={{ color: "#7B8CA8" }}>Cargando materias...</p>
        ) : subjects.length === 0 ? (
          <div
            style={{
              minHeight: "320px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              color: "#7B8CA8",
            }}
          >
            <div style={{ fontSize: "42px", marginBottom: "10px" }}>🗂️</div>
            <p style={{ fontSize: "16px", margin: "0 0 6px" }}>Aún no tienes materias creadas.</p>
            <p style={{ fontSize: "14px", margin: 0 }}>
              Agrega una materia para comenzar a subir archivos y estudiar con contexto.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            {subjects.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/apuntes/${s.id}`)}
                style={{
                  background: "#F7FAFE",
                  border: "1px solid #E3EBF5",
                  borderRadius: "16px",
                  padding: "18px",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: "22px", marginBottom: "10px" }}>📘</div>

                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "18px",
                    fontWeight: 600,
                    color: "#4C6FA8",
                  }}
                >
                  {s.name}
                </p>

                <p
                  style={{
                    margin: 0,
                    fontSize: "13px",
                    color: "#7B8CA8",
                    lineHeight: "1.5",
                  }}
                >
                  Entrar a materia, subir archivos y trabajar con el Capitán.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

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
              borderRadius: "16px",
              width: "100%",
              maxWidth: "380px",
              border: "1px solid #E3EBF5",
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", color: "#4C6FA8" }}>Crear materia</h3>
            <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#7B8CA8" }}>
              Agrega el nombre de una materia para organizar tus archivos.
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

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
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
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}