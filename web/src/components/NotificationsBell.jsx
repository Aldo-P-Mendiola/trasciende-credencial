import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  
  // Cargamos las notificaciones
  async function load() {
    // Seleccionamos las columnas correctas de la nueva tabla
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, created_at") 
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.log("Error cargando notifs:", error.message);
      return;
    }

    setItems(data ?? []);
  }

  useEffect(() => {
    load();

    // Suscripción en tiempo real para que aparezca el puntito rojo al instante
    const channel = supabase
      .channel("public-notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setItems((prev) => [payload.new, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          border: "1px solid #cacbd3",
          background: "transparent",
          color: "#cacbd3",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          fontSize: "20px"
        }}
        title="Notificaciones"
      >
        🔔
        {/* Si hay items, mostramos un puntito rojo simple */}
        {items.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "12px",
              height: "12px",
              background: "#bc3f4a",
              borderRadius: "50%",
              border: "2px solid white"
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "120%",
            width: 320,
            background: "#2a2f58",
            borderRadius: 14,
            padding: 15,
            color: "white",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
            zIndex: 100,
            border: "1px solid rgba(255,255,255,0.1)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <b style={{fontSize: "16px"}}>📢 Últimos avisos</b>
            <button 
                onClick={() => setOpen(false)} 
                style={{background:"none", border:"none", color:"#aaa", cursor:"pointer"}}>
                ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: "300px", overflowY: "auto" }}>
            {items.length === 0 && <div style={{color: "#aaa", textAlign: "center", padding: "20px"}}>No hay notificaciones recientes.</div>}
            
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.1)",
                  borderLeft: "4px solid #4CAF50"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "14px", marginBottom: "4px" }}>{n.title}</div>
                {/* Aquí usamos n.message en vez de n.body */}
                <div style={{ fontSize: "13px", color: "#ddd", lineHeight: "1.4" }}>{n.message}</div>
                <div style={{ fontSize: "10px", color: "#aaa", marginTop: "5px", textAlign: "right" }}>
                    {new Date(n.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}