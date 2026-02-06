import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminHistory() {
  const [events, setEvents] = useState([]);        
  const [selectedEventId, setSelectedEventId] = useState(""); 
  const [attendanceList, setAttendanceList] = useState([]);   
  const [loading, setLoading] = useState(false);

  // 1. Cargar lista de eventos
  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .order("created_at", { ascending: false }); 
      
      if (data && data.length > 0) {
        setEvents(data);
      }
    }
    loadEvents();
  }, []);

  // 2. Cargar asistencia del evento seleccionado
  useEffect(() => {
    if (!selectedEventId) {
      setAttendanceList([]);
      return;
    }
    fetchAttendance(selectedEventId);
  }, [selectedEventId]);

  async function fetchAttendance(eventId) {
    setLoading(true);
    try {
      // CORRECCIÓN: Quitamos student_id para que no falle
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          scanned_at,
          profiles ( full_name, email )
        `)
        .eq("event_id", eventId)
        .order("scanned_at", { ascending: true });

      if (error) throw error;
      setAttendanceList(data || []);
    } catch (e) {
      console.error("Error cargando lista:", e);
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // 3. Descargar Excel
  function downloadExcel() {
    if (attendanceList.length === 0) return;

    const eventName = events.find(e => e.id === selectedEventId)?.title || "Evento";
    
    // Encabezados del CSV
    let csvContent = "Nombre,Email,Hora de Registro\n";

    attendanceList.forEach(row => {
      const name = row.profiles?.full_name || "Desconocido";
      const email = row.profiles?.email || "-";
      const time = new Date(row.scanned_at).toLocaleString();

      // Formato CSV seguro
      csvContent += `"${name}","${email}","${time}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Asistencia_${eventName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2>📊 Reporte de Asistencia por Evento</h2>

      {/* Controles */}
      <div style={{ 
        display: "flex", 
        gap: 10, 
        flexWrap: "wrap", 
        background: "white", 
        padding: 20, 
        borderRadius: 12,
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        marginBottom: 20,
        alignItems: "end"
      }}>
        
        {/* Dropdown */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: "block", marginBottom: 5, fontWeight: "bold", fontSize: "0.9rem" }}>
            Selecciona el Evento:
          </label>
          <select 
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          >
            <option value="">-- Elige un evento --</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.title}</option>
            ))}
          </select>
        </div>

        {/* Botón Excel */}
        <div>
          <button 
            onClick={downloadExcel}
            disabled={attendanceList.length === 0}
            style={{ 
              background: attendanceList.length > 0 ? "#1D6F42" : "#ccc", 
              color: "white", 
              padding: "10px 20px", 
              borderRadius: 8, 
              border: "none", 
              cursor: attendanceList.length > 0 ? "pointer" : "not-allowed",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >
            📥 Descargar Excel
          </button>
        </div>
      </div>

      {selectedEventId && (
        <div style={{ marginBottom: 15, fontWeight: "bold", color: "#555" }}>
          Total asistentes: {attendanceList.length}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#888" }}>Cargando asistentes...</p>
      ) : (
        <div style={{ overflowX: "auto", background: "white", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead style={{ background: "#2a2f58", color: "white", textAlign: "left" }}>
              <tr>
                <th style={{ padding: 12 }}>Alumno</th>
                <th style={{ padding: 12 }}>Email</th>
                <th style={{ padding: 12 }}>Hora de llegada</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: 30, textAlign: "center", color: "#888" }}>
                    {selectedEventId ? "Nadie ha asistido a este evento aún." : "Selecciona un evento arriba para ver la lista."}
                  </td>
                </tr>
              ) : (
                attendanceList.map((log, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                    <td style={{ padding: 12, fontWeight: "bold", color: "#2a2f58" }}>
                      {log.profiles?.full_name || "Desconocido"}
                    </td>
                    <td style={{ padding: 12, fontSize: "0.9rem", color: "#555" }}>
                      {log.profiles?.email}
                    </td>
                    <td style={{ padding: 12, fontSize: "0.9rem", color: "#555" }}>
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