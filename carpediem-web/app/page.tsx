"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [esRegistro, setEsRegistro] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      const checkOnboarding = async () => {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists() || !userDoc.data()?.onboardingComplete) {
          router.push("/onboarding");
        } else {
          router.push("/checkin");
        }
      };
      checkOnboarding();
    }
  }, [user, loading, router]);

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (!userDoc.exists() || !userDoc.data()?.onboardingComplete) {
        router.push("/onboarding");
      } else {
        router.push("/checkin");
      }
    } catch (error) {
      console.error(error);
      setError("No se pudo iniciar sesión con Google. Permite los popups en tu navegador.");
    }
  };

  const handleEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      if (esRegistro) {
        await createUserWithEmailAndPassword(auth, email, password);
        router.push("/onboarding");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", auth.currentUser!.uid));
        if (!userDoc.exists() || !userDoc.data()?.onboardingComplete) {
          router.push("/onboarding");
        } else {
          router.push("/checkin");
        }
      }
    } catch (error: any) {
      if (error.code === "auth/invalid-credential") {
        setError("Correo o contraseña incorrectos.");
      } else if (error.code === "auth/email-already-in-use") {
        setError("Este correo ya está registrado. Inicia sesión.");
      } else if (error.code === "auth/weak-password") {
        setError("La contraseña debe tener al menos 6 caracteres.");
      } else {
        setError("Ocurrió un error. Intenta de nuevo.");
      }
    }
  };

  if (loading) return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#F5F5DC"}}>
      <p style={{color:"#888",fontSize:"14px"}}>Iniciando...</p>
    </div>
  );

  return (
    <main style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5DC"}}>
      <div style={{background:"white",borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"380px",border:"0.5px solid #e0e0e0"}}>
        
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{width:"56px",height:"56px",borderRadius:"16px",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:"24px"}}>🌿</div>
          <h1 style={{fontSize:"20px",fontWeight:"500",margin:"0 0 4px"}}>Carpe Diem</h1>
          <p style={{fontSize:"13px",color:"#888",margin:"0"}}>Tu compañero de estudio adaptativo</p>
        </div>

        <div style={{display:"flex",marginBottom:"20px",border:"0.5px solid #ddd",borderRadius:"8px",overflow:"hidden"}}>
          <button onClick={() => {setEsRegistro(false);setError("");}} style={{flex:1,padding:"8px",background:!esRegistro?"#E1F5EE":"white",border:"none",fontSize:"13px",cursor:"pointer",color:!esRegistro?"#085041":"#888",fontWeight:!esRegistro?"500":"400"}}>
            Iniciar sesión
          </button>
          <button onClick={() => {setEsRegistro(true);setError("");}} style={{flex:1,padding:"8px",background:esRegistro?"#E1F5EE":"white",border:"none",fontSize:"13px",cursor:"pointer",color:esRegistro?"#085041":"#888",fontWeight:esRegistro?"500":"400"}}>
            Registrarse
          </button>
        </div>

        <form onSubmit={handleEmail} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <input name="email" type="email" placeholder="Correo electrónico" required style={{padding:"10px 14px",borderRadius:"8px",border:"0.5px solid #ddd",fontSize:"14px"}}/>
          <input name="password" type="password" placeholder={esRegistro?"Contraseña (mín. 6 caracteres)":"Contraseña"} required style={{padding:"10px 14px",borderRadius:"8px",border:"0.5px solid #ddd",fontSize:"14px"}}/>
          {error && <p style={{fontSize:"12px",color:"#E87A6A",margin:"0"}}>{error}</p>}
          <button type="submit" style={{padding:"10px",borderRadius:"8px",background:"#B2D8B2",border:"none",fontSize:"14px",fontWeight:"500",color:"#27500A",cursor:"pointer"}}>
            {esRegistro ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>

        <div style={{textAlign:"center",margin:"16px 0",fontSize:"12px",color:"#aaa"}}>o</div>

        <button onClick={handleGoogle} style={{width:"100%",padding:"10px",borderRadius:"8px",background:"white",border:"0.5px solid #ddd",fontSize:"14px",cursor:"pointer"}}>
          Continuar con Google
        </button>

        {error && error.includes("popup") && (
          <p style={{fontSize:"11px",color:"#aaa",marginTop:"8px",textAlign:"center",lineHeight:"1.5"}}>
            Si el popup está bloqueado, busca el ícono de popup en la barra de direcciones y permítelo.
          </p>
        )}
      </div>
    </main>
  );
}