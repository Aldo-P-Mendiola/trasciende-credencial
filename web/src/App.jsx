import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./App.css";

// Importación de Páginas
import Login from "./pages/Login";
import Credencial from "./pages/Credencial";
import Events from "./pages/Events";
import Ranking from "./pages/Ranking";
import AdminHistory from "./pages/AdminHistory"; // La bitácora global
import StaffScan from "./pages/StaffScan";
import StaffNotifications from "./pages/StaffNotifications";
import NotificationsBell from "./components/NotificationsBell";

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("student");
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    (async () => {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      setRole(data?.role ?? "student");
    })();
  }, [session]);

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!session) return <Login />;

  const isStaff = role === "staff" || role === "admin";

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="brand">
           {/* Cambia esto por tu logo si quieres */}
          <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#2a2f58" }}>TRASCIENDE</span>
        </div>

        <nav className="main-nav">
          {/* === MENÚ COMÚN (Todos lo ven) === */}
          <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>Credencial</Link>
          <Link to="/events" className={location.pathname === "/events" ? "nav-link active" : "nav-link"}>Eventos</Link>
          <Link to="/ranking" className={location.pathname === "/ranking" ? "nav-link active" : "nav-link"}>Ranking</Link>

          {/* === MENÚ STAFF (Solo Staff lo ve) === */}
          {isStaff && (
            <>
              <div className="divider-vertical"></div> {/* Opcional: separador visual */}
              <Link to="/admin-history" className={location.pathname === "/admin-history" ? "nav-link active" : "nav-link"}>Historial</Link>
              <Link to="/staff" className={location.pathname === "/staff" ? "nav-link active" : "nav-link"}>Scanner</Link>
              <Link to="/staff-notifs" className={location.pathname === "/staff-notifs" ? "nav-link active" : "nav-link"}>Notifs</Link>
            </>
          )}

          {/* Iconos finales */}
          <NotificationsBell />
          <button onClick={logout} className="btn-logout">Salir</button>
        </nav>
      </header>

      <main>
        <Routes>
          {/* Rutas Comunes */}
          <Route path="/" element={<Credencial />} />
          <Route path="/events" element={<Events />} />
          <Route path="/ranking" element={<Ranking />} />

          {/* Rutas Protegidas de Staff */}
          <Route path="/admin-history" element={isStaff ? <AdminHistory /> : <Navigate to="/" />} />
          <Route path="/staff" element={isStaff ? <StaffScan /> : <Navigate to="/" />} />
          <Route path="/staff-notifs" element={isStaff ? <StaffNotifications /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}