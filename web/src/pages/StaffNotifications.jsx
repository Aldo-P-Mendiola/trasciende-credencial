import { useState } from "react";
import { supabase } from "../lib/supabase"; // <--- Importamos Supabase
import "../App.css";

export default function StaffNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  // TUS CLAVES
  const ONESIGNAL_APP_ID = "cf0f90d1-9497-4367-b520-fc3976d2f7cb"; 
  const ONESIGNAL_REST_API_KEY = "AQUI_PEGA_TU_REST_API_KEY_NUEVA"; // <--- ¡OJO! Pega tu Key aquí de nuevo

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Enviar PUSH a OneSignal (Para que suene el celular)
      const options = {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
        },
        body: JSON.stringify({
          app_id: ONESIGNAL_APP_ID,
          included_segments: ["All"],
          headings: { en: title },
          contents: { en: message },
        }),
      };

      const response = await fetch("https://onesignal.com/api/v1/notifications", options);
      const data = await response.json();

      if (!data.id) throw new Error("Error en OneSignal");

      // 2. Guardar en SUPABASE (Para que se quede en la campanita)
      const { error: dbError } = await supabase
        .from("notifications")
        .insert([{ title, message, target_role: "all" }]);

      if (dbError) throw dbError;

      // Éxito total
      setStatus("success");
      setTitle("");
      setMessage("");

    } catch (error) {
      console.error("Error:", error);
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
            color: "white", padding: "12px", border: "none", borderRadius: "5px", fontWeight: "bold"
          }}
        >
          {loading ? "Enviando..." : "Enviar a Todos"}
        </button>
      </form>

      {status === "success" && <div style={{ marginTop: "15px", color: "green" }}>✅ ¡Enviado y Guardado!</div>}
      {status === "error" && <div style={{ marginTop: "15px", color: "red" }}>❌ Error al enviar.</div>}
    </div>
  );
}