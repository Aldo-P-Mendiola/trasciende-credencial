import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import { supabase } from "./lib/supabase";

import NotificationsBell from "./components/NotificationsBell";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Credencial from "./pages/Credencial";
import Ranking from "./pages/Ranking";
import StaffScan from "./pages/StaffScan";

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("student");

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

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
<header
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    background: "#2a2f58",
    color: "#cacbd3",
    padding: "12px 14px",
    borderRadius: 16,
  }}
>
  <div style={{ fontWeight: 900, letterSpacing: 0.3 }}>Trasciende</div>

  <nav style={{ display: "flex", gap: 12, alignItems: "center" }}>
    <Link style={{ color: "#cacbd3", textDecoration: "none" }} to="/">Credencial</Link>
    <Link style={{ color: "#cacbd3", textDecoration: "none" }} to="/events">Eventos</Link>
    <Link style={{ color: "#cacbd3", textDecoration: "none" }} to="/ranking">Ranking</Link>
    {(role === "staff" || role === "admin") && (
      <Link style={{ color: "#cacbd3", textDecoration: "none" }} to="/staff">Staff</Link>
    )}

    <NotificationsBell />

    <button
      onClick={logout}
      style={{
        background: "#bc3f4a",
        color: "white",
        border: "none",
        borderRadius: 12,
        padding: "8px 10px",
        cursor: "pointer",
        fontWeight: 900,
      }}
    >
      Salir
    </button>
  </nav>
</header>


      <hr style={{ margin: "16px 0" }} />

      <Routes>
  <Route path="/" element={<Credencial />} />
  <Route path="/events" element={<Events />} />
  <Route path="/ranking" element={<Ranking />} />
  <Route
    path="/staff"
    element={role === "staff" || role === "admin" ? <StaffScan /> : <Navigate to="/" />}
  />
  <Route path="*" element={<Navigate to="/" />} />
</Routes>

    </div>
  );
}
