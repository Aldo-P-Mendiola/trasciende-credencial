import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  
  // Estado para Crear Evento
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", start_time: "", location: "Auditorio Principal", points: 50 });

  // === NUEVO: ESTADO PARA AGREGAR USUARIOS MANUALMENTE ===
  const [allUsers, setAllUsers] = useState([]); // Lista de alumnos para el dropdown
  const [showAddModal, setShowAddModal] = useState(false); // Abrir/Cerrar modal
  const [selectedEventId, setSelectedEventId] = useState(null); // A qué evento vamos a agregar
  const [selectedUserId, setSelectedUserId] = useState(""); // A quién vamos a agregar

  useEffect(() => {
    checkRoleAndFetch();
  }, []);

  async function checkRoleAndFetch() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const userRole = data?.role ?? "student";
      setRole(userRole);

      if (userRole === 'admin' || userRole === 'partner') {
          fetchEvents();
          // SI ES ADMIN, TAMBIÉN CARGAMOS LA LISTA DE USUARIOS
          if (userRole === 'admin') {
            fetchAllUsers();
          }
      } else {
          setLoading(false);
      }
    }
  }

  async function fetchEvents() {
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("active", true)
      .order("start_time", { ascending: true });
    setEvents(data ?? []);
    setLoading(false);
  }

  // Carga lista de nombres para el dropdown
  async function fetchAllUsers() {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name", { ascending: true });
    setAllUsers(data ?? []);
  }

  // === FUNCIÓN PARA AGREGAR MANUALMENTE ===
  async function handleManualAdd() {
    if (!selectedUserId || !selectedEventId) return alert("Selecciona un usuario.");

    const confirmacion = window.confirm("¿Seguro que quieres agregar asistencia manualmente?");
    if (!confirmacion) return;

    // Insertar en attendance
    const { error } = await supabase
      .from("attendance")
      .insert({
        user_id: selectedUserId,
        event_id: selectedEventId,
        scanned_at: new Date().toISOString() // Hora actual
      });

    if (error) {
      // Error típico: Ya estaba registrado (violación de llave única)
      if (error.code === '23505') { 
        alert("⚠️ Este usuario YA tiene asistencia en este evento.");
      } else {
        alert("Error al agregar: " + error.message);
      }
    } else {
      alert("✅ Usuario agregado con éxito.");
      setShowAddModal(false); // Cerrar modal
      setSelectedUserId("");  // Limpiar selección
    }
  }

  // Función Crear Evento (la original)
  async function createEvent(e) {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start_time) return alert("Faltan datos");

    const { error: eventError } = await supabase
      .from("events")
      .insert({
        title: newEvent.title,
        start_time: newEvent.start_time,
        location: newEvent.location,
        points: newEvent.points,
        active: true
      });

    if (eventError) {
      alert("Error: " + eventError.message);
    } else {
      // Aquí iría tu código de Notificación Push (lo omití para no hacer largo el código, pero déjalo si lo tenías)
      alert("✅ Evento creado.");
      setShowForm(false);
      setNewEvent({ title: "", start_time: "", location: "Auditorio Principal", points: 50 });
      fetchEvents();
    }
  }

  const isAdmin = role === 'admin';

  if (role === 'student' || role === 'staff') {
      return <div style={{padding: 40, textAlign: "center"}}>No tienes permiso para ver la agenda.</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "var(--navy)" }}>Agenda de Eventos</h2>
        
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nuevo Evento"}
          </button>
        )}
      </div>

      {/* FORMULARIO DE CREAR (Solo Admin) */}
      {showForm && (
        <div style={{ background: "white", padding: 20, borderRadius: 16, marginBottom: 30, border: "1px solid #eee" }}>
          <h3>Crear Nuevo Evento</h3>
          <form onSubmit={createEvent} style={{ display: "grid", gap: 15 }}>
            <input type="text" placeholder="Título" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
              <input type="datetime-local" value={newEvent.start_time} onChange={e => setNewEvent({...newEvent, start_time: e.target.value})} />
              <input type="number" value={newEvent.points} onChange={e => setNewEvent({...newEvent, points: e.target.value})} />
            </div>
            <input type="text" placeholder="Lugar" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} />
            <button type="submit" className="btn-action">Guardar</button>
          </form>
        </div>
      )}

      {/* LISTA DE EVENTOS */}
      <div style={{ display: "grid", gap: 16 }}>
        {loading && <p>Cargando eventos...</p>}
        {events.map((ev) => (
          <div key={ev.id} style={{ 
            background: "white", padding: 20, borderRadius: 16, boxShadow: "0 4px 10px rgba(0,0,0,0.05)", borderLeft: "5px solid var(--red)",
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>{ev.title}</div>
              <div style={{ fontSize: "0.9rem", color: "#666", marginTop: 4 }}>
                📅 {new Date(ev.start_time).toLocaleString("es-MX", { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#888", marginTop: 2 }}>📍 {ev.location}</div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* PUNTOS */}
                <div style={{ background: "var(--gray-light)", padding: "8px 12px", borderRadius: 12, fontWeight: 800, color: "var(--navy)", textAlign: "center" }}>
                  {ev.points} pts
                </div>

                {/* BOTÓN AGREGAR MANUAL (Solo Admin) */}
                {isAdmin && (
                  <button 
                    onClick={() => {
                        setSelectedEventId(ev.id);
                        setShowAddModal(true);
                    }}
                    style={{
                        background: "#2a2f58", color: "white", border: "none", borderRadius: "8px", 
                        padding: "8px 12px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold"
                    }}
                    title="Agregar usuario manualmente"
                  >
                    👤+
                  </button>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* === MODAL FLOTANTE PARA AGREGAR USUARIO === */}
      {showAddModal && (
        <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999
        }}>
            <div style={{ background: "white", padding: 25, borderRadius: 16, width: "90%", maxWidth: "400px" }}>
                <h3 style={{ marginTop: 0, color: "#2a2f58" }}>Agregar Asistencia Manual</h3>
                <p style={{ fontSize: "0.9rem", color: "#666" }}>Selecciona al usuario que asistió:</p>

                <select 
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", marginBottom: 20, fontSize: "1rem" }}
                >
                    <option value="">-- Seleccionar Alumno --</option>
                    {allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.full_name} ({u.email})
                        </option>
                    ))}
                </select>

                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button onClick={() => setShowAddModal(false)} style={{ background: "#eee", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer" }}>Cancelar</button>
                    <button onClick={handleManualAdd} className="btn-action">Guardar Asistencia</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}