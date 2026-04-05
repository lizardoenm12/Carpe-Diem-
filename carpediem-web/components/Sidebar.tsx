"use client";
import { useRouter, usePathname } from "next/navigation";

const items = [
  { icon: "🏠", ruta: "/dashboard", label: "Dashboard" },
  { icon: "📅", ruta: "/calendario", label: "Calendario" },
  { icon: "📚", ruta: "/apuntes", label: "Apuntes" },
  { icon: "⏳", ruta: "/capitan", label: "El Capitán" },
  { icon: "🎮", ruta: "/juegos", label: "Juegos" },
  { icon: "🔥", ruta: "/racha", label: "Racha" },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <aside style={{width:"64px",background:"white",borderRight:"0.5px solid #e0e0e0",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:"24px",gap:"16px",minHeight:"100vh",flexShrink:0}}>
      {items.map((item) => (
        <div
          key={item.ruta}
          onClick={() => router.push(item.ruta)}
          title={item.label}
          style={{width:"40px",height:"40px",borderRadius:"10px",background:pathname===item.ruta?"#E1F5EE":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"18px",cursor:"pointer",transition:"background 0.2s"}}
        >
          {item.icon}
        </div>
      ))}
    </aside>
  );
}