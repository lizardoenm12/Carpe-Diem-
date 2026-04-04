import Link from "next/link";
export default function Dashboard() {
  const emotions = [
    { label: "Furioso", color: "#EE9A8D", icon: "😠" },
    { label: "Enojado", color: "#F2AB87", icon: "☹️" },
    { label: "Molesto", color: "#F2C16B", icon: "😐" },
    { label: "Triste", color: "#EADC7B", icon: "😢" },
    { label: "Ansioso", color: "#D8DD87", icon: "😟" },
    { label: "Feliz", color: "#9ED39E", icon: "♡" }
  ];

  return (
    <main className="dashboard-page">

      <aside className="sidebar">
        <div className="side-icon active">🏠</div>
        <div className="side-icon">📅</div>
        <div className="side-icon">🎮</div>
        <div className="side-icon">⏳</div>
        <div className="side-icon">🧘</div>
      </aside>

      <section className="main-content">
        <div style={{ marginBottom: "20px" }}>
          <Link href="/">
          <button className="back-btn">← Volver al Login</button>
          </Link>
        </div>

        <h1 className="top-title">Tu Espacio de Calma</h1>
        <p className="top-subtitle">Un día a la vez, un paso a la vez</p>

        <div className="content-card">

          <h2 className="section-title">Termómetro Emocional</h2>
          <p className="section-subtitle">
            ¿Cómo te sientes en este momento?
          </p>

          <div className="emotion-grid">
            {emotions.map((e) => (
              <div key={e.label} className="emotion-card">

                <div
                  className="emotion-icon"
                  style={{ background: e.color }}
                >
                  {e.icon}
                </div>

                <p className="emotion-label">{e.label}</p>

              </div>
            ))}
          </div>

        </div>

      </section>

    </main>
  );
}