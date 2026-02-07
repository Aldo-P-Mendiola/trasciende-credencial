import { useEffect, useState, useRef } from "react"; 
import { Routes, Route, Link, Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import "./App.css";

// Importación de Páginas
import Login from "./pages/Login";
import Credencial from "./pages/Credencial";
import Events from "./pages/Events";
import Ranking from "./pages/Ranking";
import AdminHistory from "./pages/AdminHistory"; 
import StaffScan from "./pages/StaffScan";
import StaffNotifications from "./pages/StaffNotifications";
import NotificationsBell from "./components/NotificationsBell";
import OneSignal from 'react-onesignal'; 

export default function App() {
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("student");
  const [isSubscribed, setIsSubscribed] = useState(false); // <--- NUEVO: Estado de suscripción
  const location = useLocation();

  // CANDADO PARA ONESIGNAL (Para que no se inicie 2 veces)
  const oneSignalInitialized = useRef(false);

  // 1. Efecto para controlar la Sesión de Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  
  // 2. Efecto para iniciar OneSignal (Solo una vez)
  useEffect(() => {
    async function runOneSignal() {
      if (oneSignalInitialized.current) return; 
      oneSignalInitialized.current = true; 

      try {
        await OneSignal.init({
          appId: "cf0f90d1-9497-4367-b520-fc3976d2f7cb", 
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: true, // Esto habilita la campanita nativa de OneSignal también
          },
        });

        // --- LÓGICA DEL BOTÓN ROJO ---
        // Verificamos si ya está suscrito al cargar
        setIsSubscribed(OneSignal.Notifications.permission);
        
        // Escuchamos si el usuario cambia de opinión en tiempo real
        OneSignal.Notifications.addEventListener("change", (permission) => {
          setIsSubscribed(permission);
        });

      } catch (error) {
        console.error("Error al iniciar OneSignal:", error);
      }
    }
    runOneSignal();
  }, []);

  // 3. Efecto para gestionar Roles y Etiquetas
  useEffect(() => {
    (async () => {
      if (!session?.user?.id) return;

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      const userRole = data?.role ?? "student"; 
      setRole(userRole);

      try {
        if (OneSignal.User) {
            OneSignal.User.addTag("tipo_usuario", userRole);
            console.log(`🏷️ [OneSignal] Usuario etiquetado como: ${userRole}`);
        }
      } catch (error) {
        console.error("Error al etiquetar en OneSignal:", error);
      }

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
          <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#2a2f58" }}>TRASCIENDE</span>
        </div>

        <nav className="main-nav">
          {/* === MENÚ COMÚN === */}
          <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>Credencial</Link>
          <Link to="/events" className={location.pathname === "/events" ? "nav-link active" : "nav-link"}>Eventos</Link>
          <Link to="/ranking" className={location.pathname === "/ranking" ? "nav-link active" : "nav-link"}>Ranking</Link>

          {/* === MENÚ STAFF === */}
          {isStaff && (
            <>
              <div className="divider-vertical"></div>
              <Link to="/admin-history" className={location.pathname === "/admin-history" ? "nav-link active" : "nav-link"}>Historial</Link>
              <Link to="/staff" className={location.pathname === "/staff" ? "nav-link active" : "nav-link"}>Scanner</Link>
              <Link to="/staff-notifs" className={location.pathname === "/staff-notifs" ? "nav-link active" : "nav-link"}>Notifs</Link>
            </>
          )}

          {/* 👇 AQUÍ ESTÁ EL CAMBIO: Solo mostramos si NO está suscrito (!isSubscribed) */}
          {!isSubscribed && (
            <button 
              onClick={() => OneSignal.Slidedown.promptPush()}
              style={{
                padding: "10px 15px", 
                backgroundColor: "#e02424", 
                color: "white", 
                borderRadius: "8px", 
                marginLeft: "15px",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: "0.9rem"
              }}
            >
              🔔 ACTIVAR AVISOS
            </button>
          )}

          {/* Iconos finales */}
          <NotificationsBell />
          <button onClick={logout} className="btn-logout">Salir</button>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Credencial />} />
          <Route path="/events" element={<Events />} />
          <Route path="/ranking" element={<Ranking />} />

          {/* Rutas Protegidas */}
          <Route path="/admin-history" element={isStaff ? <AdminHistory /> : <Navigate to="/" />} />
          <Route path="/staff" element={isStaff ? <StaffScan /> : <Navigate to="/" />} />
          <Route path="/staff-notifs" element={isStaff ? <StaffNotifications /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}