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

      // Consulta simple: Trae asistencia, y "popula" los datos de profiles y events
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          scanned_at,
          profiles ( full_name, student_id ),
          events ( title, points )
        `)
        .order("scanned_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      console.log("LOGS:", data);
      setLogs(data || []);

    } catch (e) {
      console.error("Error fetching history:", e);
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>📋 Bitácora Global</h2>
        <button className="btn-primary" onClick={fetchLogs}>🔄 Actualizar</button>
      </div>

      {errorMsg && (
        <div style={{ background: "#fee", color: "red", padding: 10, borderRadius: 8, marginBottom: 20 }}>
          Error: {errorMsg}
        </div>
      )}

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ overflowX: "auto", background: "white", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead style={{ background: "#2a2f58", color: "white", textAlign: "left" }}>
              <tr>
                <th style={{ padding: 12 }}>Alumno</th>
                <th style={{ padding: 12 }}>Evento</th>
                <th style={{ padding: 12 }}>Pts</th>
                <th style={{ padding: 12 }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: 20, textAlign: "center" }}>No hay registros.</td></tr>
              ) : (
                logs.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>
                      <strong>{log.profiles?.full_name || "—"}</strong>
                      <br/><small style={{color:"#888"}}>{log.profiles?.student_id}</small>
                    </td>
                    <td style={{ padding: 12 }}>{log.events?.title || "—"}</td>
                    <td style={{ padding: 12, color: "green", fontWeight:"bold" }}>+{log.events?.points}</td>
                    <td style={{ padding: 12, fontSize:"0.85rem" }}>{new Date(log.scanned_at).toLocaleString()}</td>
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