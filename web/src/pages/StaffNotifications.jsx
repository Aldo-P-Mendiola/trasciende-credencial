import { useState } from "react";
import { supabase } from "../lib/supabase"; 
import "../App.css";

export default function StaffNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // Tu App ID (este sí se puede quedar aquí, es público)
  const ONESIGNAL_APP_ID = "cf0f90d1-9497-4367-b520-fc3976d2f7cb"; 

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Enviar PUSH usando tu TÚNEL (functions/notify.js)
      // Nota el cambio en la URL: '/notify'
      const response = await fetch("/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // YA NO ponemos la Key aquí, la pone Cloudflare automáticamente
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          included_segments: ["Subscribed Users"], // Cambié "All" por "Subscribed Users" que es más seguro, pero "All" funciona igual
          headings: { en: title },
          contents: { en: message },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del servidor:", errorData);
        throw new Error("Falló el envío a OneSignal");
      }

      const data = await response.json();
      console.log("Éxito OneSignal:", data);

      // 2. Guardar en SUPABASE (Historial)
      const { error: dbError } = await supabase
        .from("notifications")
        .insert([{ title, message, target_role: "all" }]);

      if (dbError) throw dbError;

      // Éxito total
      setStatus("success");
      setTitle("");
      setMessage("");

    } catch (error) {
      console.error("Error general:", error);
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-container">
      <h2>📢 Nueva Notificación</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Se enviará al celular y se guardará en la campanita.
      </p>

      <form onSubmit={handleSendNotification} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="text"
          placeholder="Título (Ej: Aviso Urgente)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <textarea
          placeholder="Mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows="3"
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            backgroundColor: loading ? "#ccc" : "#2a2f58", 
            color: "white", padding: "12px", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Enviando..." : "Enviar a Todos"}
        </button>
      </form>

      {status === "success" && <div style={{ marginTop: "15px", color: "green", fontWeight: "bold" }}>✅ ¡Enviado y Guardado!</div>}
      {status === "error" && <div style={{ marginTop: "15px", color: "red", fontWeight: "bold" }}>❌ Error al enviar. (Checa consola)</div>}
    </div>
  );
}