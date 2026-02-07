import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  
  // Referencia para detectar clicks fuera y cerrar
  const menuRef = useRef(null);

  async function load() {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, created_at") 
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) setItems(data ?? []);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("public-notifs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => setItems((prev) => [payload.new, ...prev].slice(0, 20))
      )
      .subscribe();

    // Cerrar menú si das click fuera
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div style={{ position: "relative" }} ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          border: "1px solid #cacbd3",
          background: "transparent",
          color: "#cacbd3",
          borderRadius: "50%",
          width: "42px",
          height: "42px",
          cursor: "pointer",
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          fontSize: "20px",
          position: "relative"
        }}
        title="Notificaciones"
      >
        🔔
        {items.length > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: "14px",
              height: "14px",
              background: "#e02424",
              borderRadius: "50%",
              border: "2px solid #fff"
            }}
          />
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: -10, // Un poco más a la derecha para no cortarse en pantallas pequeñas
            top: "130%",
            // RESPONSIVIDAD: 
            // Ancho fijo de 300px, PERO si la pantalla es más chica, usa el 90% del ancho
            width: "300px", 
            maxWidth: "85vw", 
            background: "#2a2f58",
            borderRadius: 16,
            padding: 0, // Quitamos padding general para controlar mejor
            color: "white",
            boxShadow: "0 15px 50px rgba(0,0,0,0.6)", // Sombra fuerte para resaltar
            zIndex: 9999, // Super encima de todo
            border: "1px solid rgba(255,255,255,0.15)",
            overflow: "hidden"
          }}
        >
          {/* Header de la cajita */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "15px",
            background: "rgba(0,0,0,0.2)",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <b style={{fontSize: "15px"}}>📢 Avisos Recientes</b>
            <button 
                onClick={() => setOpen(false)} 
                style={{background:"none", border:"none", color:"#ccc", fontSize: "18px", cursor:"pointer"}}>
                ✕
            </button>
          </div>

          {/* Lista scrolleable */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            maxHeight: "60vh", // Máximo 60% de la altura del cel
            overflowY: "auto" 
          }}>
            {items.length === 0 && (
              <div style={{color: "#aaa", textAlign: "center", padding: "30px"}}>
                Todo tranquilo por aquí. 😴
              </div>
            )}
            
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "15px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: "transparent"
                }}
              >
                <div style={{ 
                  fontWeight: "bold", 
                  fontSize: "15px", 
                  marginBottom: "5px",
                  color: "#fff"
                }}>
                  {n.title}
                </div>
                <div style={{ 
                  fontSize: "13px", 
                  color: "#ddd", 
                  lineHeight: "1.5", // Espacio entre renglones para que no se encime
                  whiteSpace: "pre-wrap" // Respeta los saltos de línea
                }}>
                  {n.message}
                </div>
                <div style={{ 
                  fontSize: "11px", 
                  color: "#aaa", 
                  marginTop: "8px", 
                  textAlign: "right" 
                }}>
                  {new Date(n.created_at).toLocaleDateString("es-MX", {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}