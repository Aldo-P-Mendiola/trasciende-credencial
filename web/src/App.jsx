import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./App.css"; // Importamos los estilos nuevos

import AdminHistory from "./pages/AdminHistory";
import StaffNotifications from "./pages/StaffNotifications";
import NotificationsBell from "./components/NotificationsBell";
import Login from "./pages/Login";
import Events from "./pages/Events";
import Credencial from "./pages/Credencial";
import Ranking from "./pages/Ranking";
import StaffScan from "./pages/StaffScan";

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("student");
  const location = useLocation(); // Para saber en qué pagina estamos

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
          {/* Aquí puedes poner tu logo real más tarde: <img src="/logo.png" /> */}
          <img src="/logo.png" alt="Logo Trasciende" style={{ height: 40, marginRight: 10 }} />
          <span>TRASCIENDE</span>
        </div>

        <nav className="main-nav">
          <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>Credencial</Link>
          <Link to="/events" className={location.pathname === "/events" ? "nav-link active" : "nav-link"}>Eventos</Link>
          <Link to="/ranking" className={location.pathname === "/ranking" ? "nav-link active" : "nav-link"}>Ranking</Link>
          <Link to="/admin-history" className={`nav-link ${location.pathname === "/admin-history" ? "active" : ""}`}>Historial</Link>
          {isStaff && (
            <>
              <Link to="/staff" className={location.pathname === "/staff" ? "nav-link active" : "nav-link"}>Scanner</Link>
              <Link to="/staff-notifs" className={location.pathname === "/staff-notifs" ? "nav-link active" : "nav-link"}>Notifs</Link>
            </>
          )}

          <NotificationsBell />
          
          <button onClick={logout} className="btn-logout">Salir</button>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Credencial />} />
          <Route path="/events" element={<Events />} />
          <Route path="/ranking" element={<Ranking />} />
          <Route path="/staff" element={isStaff ? <StaffScan /> : <Navigate to="/" />} />
          <Route path="/staff-notifs" element={isStaff ? <StaffNotifications /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
          <Route path="/admin-history" element={<AdminHistory />} />
        </Routes>
      </main>
    </div>
  );
}