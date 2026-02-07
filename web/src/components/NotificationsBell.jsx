import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabase";

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  
  // Referencia para detectar clicks fuera y cerrar el menú
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
          position: "relative",
          zIndex: 1001 // Asegura que el botón flote sobre lo demás
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
            // TRUCO PARA ANDROID:
            // Movemos la caja a la derecha (-70px) para que no se corte a la izquierda.
            right: "-70px", 
            top: "55px",
            
            // ANCHO RESPONSIVO:
            // Usa 320px si cabe, si no, usa el 90% de la pantalla del cel.
            width: "min(320px, 90vw)", 
            
            background: "#2a2f58",
            borderRadius: 16,
            padding: 0, 
            color: "white",
            boxShadow: "0 15px 50px rgba(0,0,0,0.6)", // Sombra fuerte para que resalte
            zIndex: 9999,
            border: "1px solid rgba(255,255,255,0.15)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Header de la cajita */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "12px 15px",
            background: "rgba(0,0,0,0.2)",
            borderBottom: "1px solid rgba(255,255,255,0.1)"
          }}>
            <b style={{fontSize: "14px"}}>📢 Avisos</b>
            <button 
                onClick={() => setOpen(false)} 
                style={{background:"none", border:"none", color:"#ccc", fontSize: "16px", cursor:"pointer"}}>
                ✕
            </button>
          </div>

          {/* Lista scrolleable */}
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            maxHeight: "50vh", // Que no ocupe más de la mitad de la pantalla de alto
            overflowY: "auto" 
          }}>
            {items.length === 0 && (
              <div style={{color: "#aaa", textAlign: "center", padding: "30px"}}>
                Sin novedades.
              </div>
            )}
            
            {items.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "15px",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  background: "transparent",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                <div style={{ 
                  fontWeight: "bold", 
                  fontSize: "14px", 
                  color: "#fff",
                  lineHeight: "1.3"
                }}>
                  {n.title}
                </div>
                
                {/* Texto del mensaje: word-break evita que se salga del contenedor */}
                <div style={{ 
                  fontSize: "13px", 
                  color: "#ddd", 
                  lineHeight: "1.5", 
                  wordBreak: "break-word", 
                  whiteSpace: "pre-wrap" 
                }}>
                  {n.message}
                </div>
                
                {/* Fecha y Hora (Formato 24h) */}
                <div style={{ 
                  fontSize: "11px", 
                  color: "#aaa", 
                  marginTop: "5px", 
                  textAlign: "right" 
                }}>
                  {new Date(n.created_at).toLocaleDateString("es-MX", {
                    day: 'numeric', month: 'short', 
                    hour: '2-digit', minute: '2-digit', 
                    hour12: false 
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