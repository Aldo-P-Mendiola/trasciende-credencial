import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Ranking() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  useEffect(() => {
    (async () => {
      // 1. Obtener mi ID
      const { data: { user } } = await supabase.auth.getUser();
      setMyId(user?.id);

      // 2. Seguridad: Si es 'student', lo sacamos (aunque App.jsx ya lo hace)
      if (user) {
        const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        if (data?.role === 'student') return; // Stop
      }

      // 3. Cargar Ranking (Vista SQL que ya tienes)
      const { data, error } = await supabase
        .from("v_user_points") // Asegúrate de tener esta vista o tabla
        .select("user_id, full_name, points, role")
        .order("points", { ascending: false })
        .limit(50);

      if (!error) setUsers(data);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p style={{textAlign:"center", marginTop: 40}}>Cargando tabla de líderes...</p>;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 40 }}>
      <h2 style={{ color: "#2a2f58", textAlign: "center", marginBottom: 30 }}>🏆 Ranking Trasciende</h2>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {users.map((u, index) => {
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
              border: isMe ? "none" : "1px solid #eee"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
                <div style={{ fontWeight: 900, fontSize: "1.2rem", width: 40 }}>{medal}</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "bold", fontSize: "1rem" }}>{u.full_name}</span>
                    <span style={{ fontSize: "0.8rem", opacity: 0.8 }}>{u.role === 'staff' || u.role === 'admin' ? '(Staff)' : ''}</span>
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                {u.points} <span style={{ fontSize: "0.7em", opacity: 0.8 }}>pts</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}