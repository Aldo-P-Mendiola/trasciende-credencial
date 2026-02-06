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
        .limit(100); // Límite de 100 para no saturar

      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      console.error("Error history:", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>📋 Bitácora Global de Asistencias</h2>
        <button onClick={fetchLogs} className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.9rem" }}>
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center" }}>Cargando registros...</p>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "white", minWidth: 600 }}>
            <thead style={{ background: "#2a2f58", color: "white", textAlign: "left" }}>
              <tr>
                <th style={{ padding: 15 }}>Alumno</th>
                <th style={{ padding: 15 }}>Evento</th>
                <th style={{ padding: 15 }}>Pts</th>
                <th style={{ padding: 15 }}>Hora</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: 20, textAlign: "center", color: "#888" }}>
                    No hay registros aún.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 15 }}>
                      <div style={{ fontWeight: "bold" }}>{log.profiles?.full_name || "Desconocido"}</div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>{log.profiles?.student_id}</div>
                    </td>
                    <td style={{ padding: 15 }}>{log.events?.title}</td>
                    <td style={{ padding: 15, color: "green", fontWeight: "bold" }}>+{log.events?.points}</td>
                    <td style={{ padding: 15, fontSize: "0.9rem", color: "#666" }}>
                      {new Date(log.scanned_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}