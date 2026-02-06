import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import { toPng } from "html-to-image";

export default function Credencial() {
  const [profile, setProfile] = useState(null);
  const [qr, setQr] = useState("");
  const [history, setHistory] = useState([]); // <--- NUEVO: Estado para el historial
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lógica de carga
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      const me = u?.user;
      
      if (!me) { 
        setLoading(false); 
        return; 
      }

      // 1. Generar QR
      try {
        const payload = JSON.stringify({ userId: me.id });
        const url = await QRCode.toDataURL(payload, { margin: 1, scale: 8, color: { dark: "#2a2f58", light: "#ffffff" } });
        setQr(url);
      } catch (e) { console.log("QR ERROR:", e); }

      // 2. Datos del Perfil y Puntos
      const { data: p } = await supabase.from("profiles").select("full_name, email, role").eq("id", me.id).single();
      const { data: pts } = await supabase.from("v_user_points").select("points").eq("user_id", me.id).maybeSingle();

      setProfile({
        full_name: p?.full_name ?? "—",
        email: p?.email ?? me.email ?? "—",
        role: p?.role ?? "student",
        points: pts?.points ?? 0,
      });

      // 3. NUEVO: Cargar Historial de Asistencias
      try {
        const { data: historyData } = await supabase
          .from("attendance")
          .select("scanned_at, events(title, points)")
          .eq("user_id", me.id)
          .order("scanned_at", { ascending: false }); // Ordenar del más reciente al más antiguo
        
        setHistory(historyData || []);
      } catch (error) {
        console.error("Error cargando historial", error);
      }

      setLoading(false);
    })();
  }, []);

  // Lógica de realtime (para actualizar puntos si escanean en ese momento)
  useEffect(() => {
    let channel = null;
    (async () => {
       const { data: { user } } = await supabase.auth.getUser();
       if(!user) return;
       
       channel = supabase.channel("cred-points-" + user.id)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, 
        async () => {
           // Actualizar puntos
           const { data } = await supabase.from("v_user_points").select("points").eq("user_id", user.id).maybeSingle();
           setProfile(prev => prev ? {...prev, points: data?.points ?? prev.points} : prev);
           
           // Actualizar historial también en tiempo real
           const { data: newHistory } = await supabase
             .from("attendance")
             .select("scanned_at, events(title, points)")
             .eq("user_id", user.id)
             .order("scanned_at", { ascending: false });
            if(newHistory) setHistory(newHistory);
        })
        .subscribe();
    })();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  async function downloadCredencial() {
    try {
      setDownloading(true);
      const node = document.getElementById("credencial-card");
      if (!node) return;
      const dataUrl = await toPng(node, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = "credencial-trasciende.png";
      link.href = dataUrl;
      link.click();
    } catch (e) { alert("Error al descargar"); } 
    finally { setDownloading(false); }
  }

  // Estilos
  const cardStyle = {
    background: "linear-gradient(135deg, #2a2f58 0%, #181b36 100%)",
    color: "white",
    borderRadius: "20px",
    padding: "24px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    maxWidth: "600px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "24px",
    border: "1px solid rgba(255,255,255,0.1)",
    position: "relative",
    overflow: "hidden"
  };

  return (
    <div style={{ maxWidth: 600, margin: "20px auto", paddingBottom: 40 }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "#2a2f58" }}>Mi Credencial</h2>
        <button className="btn-action" onClick={downloadCredencial} disabled={downloading}>
          {downloading ? "Guardando..." : "Descargar Imagen"}
        </button>
      </div>

      {/* TARJETA (Lo que se descarga) */}
      <div id="credencial-card" style={cardStyle}>
        {/* Decoración fondo */}
        <div style={{
          position: "absolute", top: -50, right: -50, width: 200, height: 200, 
          background: "rgba(188, 63, 74, 0.4)", filter: "blur(60px)", borderRadius: "50%" 
        }} />

        {/* Datos Alumno */}
        <div style={{ zIndex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.75rem", opacity: 0.7, marginBottom: 4 }}>
              Programa Trasciende
            </div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, lineHeight: 1.2 }}>
              {loading ? "Cargando..." : profile?.full_name}
            </div>
            <div style={{ fontSize: "0.9rem", opacity: 0.8, marginTop: 4 }}>
              {loading ? "..." : profile?.email}
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
             <div style={{ display: "inline-block", padding: "6px 12px", background: "rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "0.85rem", marginRight: 10 }}>
                Rol: <b>{profile?.role}</b>
             </div>
             <div style={{ display: "inline-block", padding: "6px 12px", background: "#bc3f4a", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "bold" }}>
                Puntos: {profile?.points ?? 0} 🏆
             </div>
          </div>

          <div style={{ marginTop: 24, fontSize: "0.75rem", opacity: 0.6 }}>
            Tecnológico de Monterrey • Campus Ciudad de México
          </div>
        </div>

        {/* QR */}
        <div style={{ zIndex: 1, background: "white", padding: "12px", borderRadius: "16px", height: "fit-content", display: "grid", placeItems: "center" }}>
          {qr && <img src={qr} alt="QR" style={{ width: 140, height: 140, display: "block" }} />}
        </div>
      </div>

      <p style={{ textAlign: "center", marginTop: 20, color: "#888", fontSize: "0.9rem", marginBottom: 40 }}>
        Muestra este código al Staff en la entrada de los eventos para registrar tu asistencia.
      </p>

      {/* === NUEVA SECCIÓN: HISTORIAL DE EVENTOS === */}
      <div style={{ marginTop: 30 }}>
        <h3 style={{ color: "#2a2f58", marginBottom: 15 }}>Mis Eventos Asistidos</h3>
        
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, background: "#f9f9f9", borderRadius: 12, color: "#888" }}>
            Aún no has registrado asistencia en ningún evento.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((item, index) => (
              <div key={index} style={{
                background: "white",
                padding: "16px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                border: "1px solid #f0f0f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <strong style={{ display: "block", fontSize: "1rem", color: "#333" }}>
                    {item.events?.title || "Evento"}
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#888" }}>
                    {new Date(item.scanned_at).toLocaleDateString()} • {new Date(item.scanned_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
                <div style={{ 
                  color: "#166534", 
                  background: "#dcfce7", 
                  padding: "4px 10px", 
                  borderRadius: "20px", 
                  fontSize: "0.85rem", 
                  fontWeight: "bold" 
                }}>
                  +{item.events?.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}