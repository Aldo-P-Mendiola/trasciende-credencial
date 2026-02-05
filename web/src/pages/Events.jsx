import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estado para el formulario
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    start_time: "",
    location: "Auditorio Principal",
    points: 50,
  });

  // 1. Cargar eventos y verificar ROL del usuario
  useEffect(() => {
    fetchEvents();
    checkRole();
  }, []);

  async function checkRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    
    // Si es staff o admin, le damos permiso de ver el formulario
    if (data?.role === "staff" || data?.role === "admin") {
      setIsAdmin(true);
    }
  }

  async function fetchEvents() {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select("*")
      .eq("active", true)
      .order("start_time", { ascending: true });
    
    setEvents(data ?? []);
    setLoading(false);
  }

  async function createEvent(e) {
    e.preventDefault();
    if (!newEvent.title || !newEvent.start_time) return alert("Faltan datos");

    const { error } = await supabase.from("events").insert({
      title: newEvent.title,
      start_time: newEvent.start_time, // Supabase acepta formato ISO directo del input datetime-local
      location: newEvent.location,
      points: newEvent.points,
      active: true
    });

    if (error) {
      alert("Error al crear: " + error.message);
    } else {
      alert("✅ Evento creado con éxito");
      setShowForm(false);
      setNewEvent({ title: "", start_time: "", location: "Auditorio Principal", points: 50 });
      fetchEvents(); // Recargar la lista
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      
      {/* HEADER CON BOTÓN DE ADMIN */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "var(--navy)" }}>Agenda de Eventos</h2>
        
        {isAdmin && (
          <button 
            className="btn-primary" 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancelar" : "+ Nuevo Evento"}
          </button>
        )}
      </div>

      {/* FORMULARIO DE CREACIÓN (SOLO STAFF) */}
      {showForm && (
        <div style={{ 
          background: "white", 
          padding: 20, 
          borderRadius: 16, 
          boxShadow: "var(--shadow)",
          marginBottom: 30,
          border: "1px solid #eee"
        }}>
          <h3 style={{ marginTop: 0 }}>Crear Nuevo Evento</h3>
          <form onSubmit={createEvent} style={{ display: "grid", gap: 15 }}>
            <div>
              <label style={{ display: "block", marginBottom: 5, fontSize: "0.9rem", fontWeight: 600 }}>Título del Evento</label>
              <input 
                type="text" 
                placeholder="Ej. Conferencia de IA" 
                value={newEvent.title}
                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 15 }}>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: "0.9rem", fontWeight: 600 }}>Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  value={newEvent.start_time}
                  onChange={e => setNewEvent({...newEvent, start_time: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 5, fontSize: "0.9rem", fontWeight: 600 }}>Puntos</label>
                <input 
                  type="number" 
                  value={newEvent.points}
                  onChange={e => setNewEvent({...newEvent, points: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 5, fontSize: "0.9rem", fontWeight: 600 }}>Ubicación</label>
              <input 
                type="text" 
                placeholder="Lugar..." 
                value={newEvent.location}
                onChange={e => setNewEvent({...newEvent, location: e.target.value})}
              />
            </div>

            <button type="submit" className="btn-action" style={{ marginTop: 10 }}>
              Guardar Evento
            </button>
          </form>
        </div>
      )}

      {/* LISTA DE EVENTOS */}
      <div style={{ display: "grid", gap: 16 }}>
        {loading && <p>Cargando eventos...</p>}
        
        {!loading && events.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, opacity: 0.6 }}>
            No hay eventos activos por ahora.
          </div>
        )}

        {events.map((ev) => (
          <div key={ev.id} style={{ 
            background: "white", 
            padding: 20, 
            borderRadius: 16, 
            boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
            borderLeft: "5px solid var(--red)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--navy)" }}>
                {ev.title}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666", marginTop: 4 }}>
                📅 {new Date(ev.start_time).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#888", marginTop: 2 }}>
                📍 {ev.location}
              </div>
            </div>
            
            <div style={{ 
              background: "var(--gray-light)", 
              padding: "8px 16px", 
              borderRadius: 12, 
              fontWeight: 800, 
              color: "var(--navy)",
              textAlign: "center",
              minWidth: 80
            }}>
              {ev.points} <span style={{ fontSize: "0.8em" }}>pts</span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}