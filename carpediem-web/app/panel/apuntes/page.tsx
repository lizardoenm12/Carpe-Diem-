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
  const router = useRouter();
  const user = auth.currentUser;

  const fetchSubjects = async () => {
    if (!user) return;

    const q = query(
      collection(db, COLLECTIONS.subjects),
      where("uid", "==", user.uid)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setSubjects(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const createSubject = async () => {
    if (!newSubject.trim()) return;

    try {
      await addDoc(collection(db, COLLECTIONS.subjects), {
        uid: user?.uid,
        name: newSubject,
        createdAt: new Date(),
      });

      setNewSubject("");
      setShowModal(false);
      fetchSubjects();
    } catch (error) {
      console.error("Error creando materia:", error);
    }
  };

  return (
    <>
      <h1 style={{ fontSize: "28px", marginBottom: "20px" }}>📚 Apuntes</h1>

      <button
        onClick={() => setShowModal(true)}
        style={{
          marginBottom: "20px",
          padding: "10px 16px",
          borderRadius: "10px",
          background: "#6AA5EC",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        + Agregar materia
      </button>

      {loading ? (
        <p>Cargando...</p>
      ) : subjects.length === 0 ? (
        <p>No tienes materias aún</p>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {subjects.map((s) => (
            <div
              key={s.id}
              onClick={() => router.push(`/apuntes/${s.id}`)}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#F6F8FB",
                cursor: "pointer",
              }}
            >
              <strong>{s.name}</strong>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "300px",
            }}
          >
            <h3>Crear materia</h3>

            <input
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Nombre de la materia"
              style={{
                width: "100%",
                marginTop: "10px",
                padding: "8px",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />

            <div style={{ marginTop: "16px", display: "flex", gap: "10px" }}>
              <button onClick={createSubject}>Guardar</button>
              <button onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}