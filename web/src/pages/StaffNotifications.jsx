import { useState } from "react";
import { supabase } from "../lib/supabase"; 
import "../App.css";

export default function StaffNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [debugLog, setDebugLog] = useState(""); // Para ver errores en pantalla

  const ONESIGNAL_APP_ID = "cf0f90d1-9497-4367-b520-fc3976d2f7cb"; 

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setDebugLog("Iniciando proceso...");

    try {
      // --- PASO 1: Guardar en Supabase (Primero aseguramos el historial) ---
      const { error: dbError } = await supabase
        .from("notifications")
        .insert([{ title, message, target_role: "all" }]);

      if (dbError) {
        setDebugLog(prev => prev + "\n❌ Error Supabase: " + dbError.message);
        throw dbError; // Si falla la base de datos, detenemos todo.
      } else {
        setDebugLog(prev => prev + "\n✅ Guardado en Base de Datos.");
      }

      // --- PASO 2: Enviar a OneSignal (Intento independiente) ---
      try {
        const response = await fetch("/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            app_id: ONESIGNAL_APP_ID,
            included_segments: ["All"], // Intentamos enviar a TODOS para probar
            headings: { en: title },
            contents: { en: message },
          }),
        });

        const data = await response.json();
        
        if (data.errors) {
            setDebugLog(prev => prev + "\n⚠️ OneSignal respondió con error: " + JSON.stringify(data.errors));
        } else {
            setDebugLog(prev => prev + "\n✅ Enviado a celulares con éxito.");
        }

      } catch (osError) {
        console.error(osError);
        setDebugLog(prev => prev + "\n⚠️ Error de conexión con OneSignal (pero sí se guardó en BD).");
      }

      // Finalizar
      setStatus("success");
      setTitle("");
      setMessage("");

    } catch (error) {
      console.error("Error fatal:", error);
      setStatus("error");
      setDebugLog(prev => prev + "\n❌ Error Fatal: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-container">
      <h2>📢 Nueva Notificación</h2>
      <form onSubmit={handleSendNotification} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: "10px" }}
        />
        <textarea
          placeholder="Mensaje..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          style={{ padding: "10px" }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            backgroundColor: "#2a2f58", color: "white", padding: "12px", border: "none", borderRadius: "5px"
          }}
        >
          {loading ? "Procesando..." : "Enviar Notificación"}
        </button>
      </form>

      {/* ZONA DE DEBUG EN PANTALLA */}
      <div style={{ marginTop: "20px", padding: "10px", background: "#f0f0f0", borderRadius: "5px", fontSize: "12px", whiteSpace: "pre-wrap" }}>
        <strong>Log del sistema:</strong>
        {debugLog}
      </div>
    </div>
  );
}