import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      setLoading(true);
      // Traemos asistencia + nombre del alumno + titulo del evento
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          scanned_at,
          profiles(full_name, student_id),
          events(title, points)
        `)
        .order("scanned_at", { ascending: false })
        .limit(50); // Traemos los últimos 50 movimientos

      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      console.error("Error history:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>📋 Bitácora de Asistencia</h2>
        <button onClick={fetchLogs} style={{ padding: "5px 10px", cursor: "pointer" }}>🔄 Actualizar</button>
      </div>

      {loading ? (
        <p>Cargando registros...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
          <thead style={{ background: "#f4f4f4", textAlign: "left" }}>
            <tr>
              <th style={{ padding: 12 }}>Alumno</th>
              <th style={{ padding: 12 }}>Evento</th>
              <th style={{ padding: 12 }}>Puntos</th>
              <th style={{ padding: 12 }}>Fecha/Hora</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12 }}>
                  <strong>{log.profiles?.full_name || "Desconocido"}</strong>
                  <br/>
                  <small style={{ color: "#888" }}>{log.profiles?.student_id}</small>
                </td>
                <td style={{ padding: 12 }}>{log.events?.title}</td>
                <td style={{ padding: 12, color: "green", fontWeight: "bold" }}>+{log.events?.points}</td>
                <td style={{ padding: 12, fontSize: "0.9rem", color: "#666" }}>
                  {new Date(log.scanned_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
