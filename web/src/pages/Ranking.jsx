import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Ranking() {
  const [topUsers, setTopUsers] = useState([]);
  const [myData, setMyData] = useState(null); // Mis datos si NO estoy en el top 20
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    loadRanking();
  }, []);

  async function loadRanking() {
    // 1. Obtener mi ID
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    setMyId(userId);

    // 2. Obtener el TOP 20
    const { data: top20, error } = await supabase
      .from("v_user_points") // Asegúrate de que esta vista exista (la creamos en el paso anterior)
      .select("user_id, full_name, points, role")
      .order("points", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error cargando ranking:", error);
      setLoading(false);
      return;
    }

    setTopUsers(top20);

    // 3. Verificar si estoy en el Top 20
    if (userId) {
      const amIInTop = top20.find((u) => u.user_id === userId);

      // Si NO estoy en el top 20, necesito saber mis propios puntos para motivarme
      if (!amIInTop) {
        const { data: me } = await supabase
          .from("v_user_points")
          .select("points")
          .eq("user_id", userId)
          .single();
        
        if (me) {
          setMyData(me);
        }
      }
    }

    setLoading(false);
  }

  // Función para generar la frase motivadora
  function getMotivationMessage(myPoints, cutoffPoints) {
    const diff = cutoffPoints - myPoints;
    // Si la diferencia es pequeña (ej. menos de 50 pts, o sea 1 evento)
    if (diff <= 50) return "¡Estás a nada! 🔥 Un evento más y entras al Top.";
    if (diff <= 100) return "¡Ya casi! Estás a un par de eventos de la cima. 🚀";
    if (diff <= 200) return "Sigue sumando, vas por buen camino. 💪";
    return "¡A darle! Participa en más eventos para subir de nivel. 🏆";
  }

  if (loading) return <p style={{textAlign:"center", marginTop: 40}}>Cargando tabla de líderes...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 60 }}>
      <h2 style={{ color: "#2a2f58", textAlign: "center", marginBottom: 10 }}>🏆 Top 20 Trasciende</h2>
      <p style={{ textAlign: "center", color: "#666", marginBottom: 30, fontSize: "0.9rem" }}>
        Los estudiantes más activos del semestre.
      </p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {topUsers.map((u, index) => {
          const isMe = u.user_id === myId;
          
          // Icono según lugar
          let medal = null;
          if (index === 0) medal = "🥇";
          else if (index === 1) medal = "🥈";
          else if (index === 2) medal = "🥉";
          else medal = `#${index + 1}`;

          return (
            <div key={u.user_id} style={{
              background: isMe ? "linear-gradient(90deg, #2a2f58 0%, #3a4170 100%)" : "white",
              color: isMe ? "white" : "#333",
              padding: "15px 20px",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: isMe ? "0 10px 25px rgba(42, 47, 88, 0.3)" : "0 4px 10px rgba(0,0,0,0.05)",
              transform: isMe ? "scale(1.02)" : "scale(1)",
              border: isMe ? "none" : "1px solid #eee",
              zIndex: isMe ? 2 : 1
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <div style={{ fontWeight: 900, fontSize: "1.2rem", width: 40, textAlign: "center" }}>{medal}</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "bold", fontSize: "1rem" }}>{u.full_name}</span>
                    {/* Opcional: Mostrar rol si es staff */}
                    {(u.role === 'staff' || u.role === 'admin') && 
                      <span style={{ fontSize: "0.7rem", opacity: 0.8, textTransform: "uppercase" }}>Staff</span>
                    }
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                {u.points} <span style={{ fontSize: "0.7em", opacity: 0.8 }}>pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* === TARJETA MOTIVADORA (Solo si NO estás en el Top 20) === */}
      {myId && !topUsers.find(u => u.user_id === myId) && myData && topUsers.length > 0 && (
        <div style={{
          marginTop: 40,
          padding: 20,
          background: "linear-gradient(135deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%)", // Un gradiente llamativo
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
          textAlign: "center",
          color: "#c21f30",
          border: "2px dashed white"
        }}>
          <h3 style={{ margin: "0 0 10px 0", fontSize: "1.2rem" }}>🚧 Aún no estás en el Top 20</h3>
          <p style={{ margin: 0, fontWeight: "500" }}>
            Tienes <strong>{myData.points} pts</strong>.
            <br/>
            El puesto #20 tiene <strong>{topUsers[topUsers.length - 1].points} pts</strong>.
          </p>
          <div style={{ 
            marginTop: 15, 
            background: "rgba(255,255,255,0.6)", 
            padding: "10px", 
            borderRadius: 10,
            fontWeight: "bold",
            fontSize: "0.95rem"
          }}>
             {getMotivationMessage(myData.points, topUsers[topUsers.length - 1].points)}
          </div>
        </div>
      )}

      {/* Caso raro: No hay nadie en el ranking */}
      {topUsers.length === 0 && (
        <div style={{textAlign: "center", padding: 40, color: "#999"}}>
          Aún no hay registros en el ranking. ¡Sé el primero!
        </div>
      )}

    </div>
  );
}