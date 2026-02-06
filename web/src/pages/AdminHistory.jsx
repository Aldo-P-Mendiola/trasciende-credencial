import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AdminHistory() {
  // Estados para manejar la lógica
  const [events, setEvents] = useState([]);        // Lista de eventos para el dropdown
  const [selectedEventId, setSelectedEventId] = useState(""); // Evento seleccionado
  const [attendanceList, setAttendanceList] = useState([]);   // Lista de alumnos de ese evento
  const [loading, setLoading] = useState(false);

  // 1. Al cargar la página, traemos la lista de eventos disponibles
  useEffect(() => {
    async function loadEvents() {
      const { data } = await supabase
        .from("events")
        .select("id, title")
        .order("created_at", { ascending: false }); // Los más nuevos primero
      
      if (data && data.length > 0) {
        setEvents(data);
        // Opcional: Seleccionar el primero automáticamente
        // setSelectedEventId(data[0].id);
      }
    }
    loadEvents();
  }, []);

  // 2. Cada vez que cambia el evento seleccionado, traemos su asistencia
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
      // Traemos la asistencia FILTRADA por el ID del evento
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          scanned_at,
          profiles ( full_name, email, student_id )
        `)
        .eq("event_id", eventId) // <--- EL FILTRO CLAVE
        .order("scanned_at", { ascending: true }); // Orden por hora de llegada

      if (error) throw error;
      setAttendanceList(data || []);
    } catch (e) {
      console.error("Error cargando lista:", e);
      alert("Error cargando lista: " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // 3. Función para descargar Excel (CSV)
  function downloadExcel() {
    if (attendanceList.length === 0) return;

    // Encontramos el nombre del evento para el nombre del archivo
    const eventName = events.find(e => e.id === selectedEventId)?.title || "Evento";
    
    // Encabezados del CSV
    let csvContent = "Nombre,Email,Matricula,Hora de Registro\n";

    // Filas del CSV
    attendanceList.forEach(row => {
      const name = row.profiles?.full_name || "Desconocido";
      const email = row.profiles?.email || "-";
      const matricula = row.profiles?.student_id || "-"; // Si no tienes la columna, saldrá "-"
      const time = new Date(row.scanned_at).toLocaleString();

      // Evitar errores con comas en los nombres (poniéndolos entre comillas)
      csvContent += `"${name}","${email}","${matricula}","${time}"\n`;
    });

    // Crear el archivo blob y descargarlo
    // \uFEFF es para que Excel reconozca acentos y caracteres latinos
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

      {/* Controles Superiores */}
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
        
        {/* Dropdown de Eventos */}
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
              background: attendanceList.length > 0 ? "#1D6F42" : "#ccc", // Verde Excel
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

      {/* Resumen de conteo */}
      {selectedEventId && (
        <div style={{ marginBottom: 15, fontWeight: "bold", color: "#555" }}>
          Total asistentes: {attendanceList.length}
        </div>
      )}

      {/* Tabla de Resultados */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#888" }}>Cargando asistentes...</p>
      ) : (
        <div style={{ overflowX: "auto", background: "white", borderRadius: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead style={{ background: "#2a2f58", color: "white", textAlign: "left" }}>
              <tr>
                <th style={{ padding: 12 }}>Alumno</th>
                <th style={{ padding: 12 }}>Email / Matrícula</th>
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
                    <td style={{ padding: 12 }}>
                      <div style={{ fontSize: "0.9rem" }}>{log.profiles?.email}</div>
                      <div style={{ fontSize: "0.8rem", color: "#888" }}>{log.profiles?.student_id || "—"}</div>
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