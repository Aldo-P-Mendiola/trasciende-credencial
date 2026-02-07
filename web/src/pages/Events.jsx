import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null); // Guardamos el rol aquí también

  // Estado para el formulario (Crear Evento)
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", start_time: "", location: "Auditorio Principal", points: 50 });

  useEffect(() => {
    checkRoleAndFetch();
  }, []);

  async function checkRoleAndFetch() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Checamos rol
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      const userRole = data?.role ?? "student";
      setRole(userRole);

      // SI ES STUDENT O STAFF (que no debe ver agenda según tu regla), no cargamos nada
      // (Aunque en App.jsx ya los bloqueamos, doble seguridad no mata a nadie)
      if (userRole === 'admin' || userRole === 'partner') {
          fetchEvents();
      } else {
          setLoading(false); // No carga eventos
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

  // ... (Función createEvent IGUAL QUE ANTES) ...
  async function createEvent(e) {
    e.preventDefault();
    // ... tu lógica de crear evento y notificación (copiala del anterior) ...
    // Solo recuerda al final llamar a fetchEvents();
  }

  const isAdmin = role === 'admin';

  if (role === 'student' || role === 'staff') {
      return <div style={{padding: 40, textAlign: "center"}}>No tienes permiso para ver la agenda.</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, color: "var(--navy)" }}>Agenda de Eventos</h2>
        
        {/* SOLO EL ADMIN VE EL BOTÓN DE CREAR */}
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancelar" : "+ Nuevo Evento"}
          </button>
        )}
      </div>

      {/* ... (Formulario y Lista de eventos IGUAL QUE ANTES) ... */}
      {/* Solo asegúrate de copiar el return del formulario y el map de eventos que ya tenías */}
      
      {/* COPIA AQUÍ EL RESTO DE TU JSX (Formulario y .map de eventos) */}
      
    </div>
  );
}