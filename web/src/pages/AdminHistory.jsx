import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      setErrorMsg("");

      // INTENTO 1: Sintaxis Explícita (Forzando la relación por nombre de columna)
      // "profiles:user_id" significa: La tabla profiles está conectada via user_id
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          scanned_at,
          user_id, 
          event_id,
          profiles:user_id ( full_name, student_id, email ),
          events:event_id ( title, points )
        `)
        .order("scanned_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error detallado:", error);
        throw error;
      }

      console.log("Datos recibidos:", data); // Para ver en consola (F12) si llega algo
      setLogs(data || []);

    } catch (e) {
      setErrorMsg(e.message || "Error desconocido al cargar historial.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>📋 Bitácora Global</h2>
        <button 
          onClick={fetchLogs} 
          style={{ padding: "8px 16px", background: "#2a2f58", color: "white", border: "none", borderRadius: 5, cursor: "pointer" }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Si hay error, lo mostramos en rojo para saber qué es */}
      {errorMsg && (
        <div style={{ background: "#fee", color: "red", padding: 10, borderRadius: 8, marginBottom: 20, border: "1px solid red" }}>
          ⚠️ <b>Error de Sistema:</b> {errorMsg}
          <br/>
          <small>Revisa la consola (F12) para más detalles.</small>
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>Cargando registros...</p>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", background: "white" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead style={{ background: "#f4f4f4", textAlign: "left", borderBottom: "2px solid #ddd" }}>
              <tr>
                <th style={{ padding: 15, color: "#444" }}>Alumno</th>
                <th style={{ padding: 15, color: "#444" }}>Evento</th>
                <th style={{ padding: 15, color: "#444" }}>Pts</th>
                <th style={{ padding: 15, color: "#444" }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: 30, textAlign: "center", color: "#888", fontStyle: "italic" }}>
                    La tabla de 'attendance' está vacía o no se pudieron cargar los datos.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => {
                  // Manejo seguro por si profiles viene null (usuario borrado, etc)
                  const pName = log.profiles?.full_name || log.profiles?.email || "Usuario Eliminado";
                  const pId = log.profiles?.student_id || log.user_id?.slice(0, 8) + "...";
                  const eTitle = log.events?.title || "Evento Eliminado";
                  const ePoints = log.events?.points || 0;

                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                      <td style={{ padding: 15 }}>
                        <div style={{ fontWeight: "bold", color: "#2a2f58" }}>{pName}</div>
                        <div style={{ fontSize: "0.85rem", color: "#888" }}>{pId}</div>
                      </td>
                      <td style={{ padding: 15 }}>{eTitle}</td>
                      <td style={{ padding: 15, color: "green", fontWeight: "bold" }}>+{ePoints}</td>
                      <td style={{ padding: 15, fontSize: "0.9rem", color: "#666" }}>
                        {new Date(log.scanned_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}