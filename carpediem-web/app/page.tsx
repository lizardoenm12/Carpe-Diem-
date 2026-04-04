"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  const handleEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh"}}>Cargando...</div>;

  return (
    <main style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"#F5F5DC"}}>
      <div style={{background:"white",borderRadius:"16px",padding:"32px",width:"100%",maxWidth:"380px",border:"0.5px solid #e0e0e0"}}>
        
        <div style={{textAlign:"center",marginBottom:"24px"}}>
          <div style={{width:"56px",height:"56px",borderRadius:"16px",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
            <span style={{fontSize:"24px"}}>🌿</span>
          </div>
          <h1 style={{fontSize:"20px",fontWeight:"500",margin:"0 0 4px"}}>Carpe Diem</h1>
          <p style={{fontSize:"13px",color:"#888",margin:"0"}}>Tu compañero de estudio adaptativo</p>
        </div>

        <form onSubmit={handleEmail} style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <input
            name="email"
            type="email"
            placeholder="Correo electrónico"
            required
            style={{padding:"10px 14px",borderRadius:"8px",border:"0.5px solid #ddd",fontSize:"14px"}}
          />
          <input
            name="password"
            type="password"
            placeholder="Contraseña"
            required
            style={{padding:"10px 14px",borderRadius:"8px",border:"0.5px solid #ddd",fontSize:"14px"}}
          />
          <button
            type="submit"
            style={{padding:"10px",borderRadius:"8px",background:"#B2D8B2",border:"none",fontSize:"14px",fontWeight:"500",color:"#27500A",cursor:"pointer"}}
          >
            Iniciar sesión
          </button>
        </form>

        <div style={{textAlign:"center",margin:"16px 0",fontSize:"12px",color:"#aaa"}}>o</div>

        <button
          onClick={handleGoogle}
          style={{width:"100%",padding:"10px",borderRadius:"8px",background:"white",border:"0.5px solid #ddd",fontSize:"14px",cursor:"pointer"}}
        >
          Continuar con Google
        </button>

        <p style={{textAlign:"center",fontSize:"12px",color:"#aaa",marginTop:"16px"}}>
          ¿No tienes cuenta? <a href="#" style={{color:"#1D9E75"}}>Regístrate</a>
        </p>
      </div>
    </main>
  );
}