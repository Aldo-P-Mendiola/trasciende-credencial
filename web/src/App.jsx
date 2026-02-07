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
  const [role, setRole] = useState(null); // Empezamos en null para no parpadear
  const [loadingRole, setLoadingRole] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const location = useLocation();

  const oneSignalInitialized = useRef(false);

  // 1. Sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setLoadingRole(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s);
      if (!s) setLoadingRole(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  
  // 2. Roles y Etiquetas
  useEffect(() => {
    (async () => {
      if (!session?.user?.id) return;
      
      // Leemos el rol de la base de datos
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
      
      // Si no tiene rol, asumimos "student" (el más básico)
      const userRole = data?.role ?? "student"; 
      setRole(userRole);
      setLoadingRole(false);

      // Etiquetar en OneSignal
      try {
        if (OneSignal.User) {
          OneSignal.User.addTag("tipo_usuario", userRole);
        }
      } catch (e) { console.error(e); }

    })();
  }, [session]);

  // 3. OneSignal (Igual que antes)
  useEffect(() => {
    async function runOneSignal() {
      if (oneSignalInitialized.current) return; 
      oneSignalInitialized.current = true; 
      try {
        await OneSignal.init({
          appId: "cf0f90d1-9497-4367-b520-fc3976d2f7cb", 
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: true },
        });
        setIsSubscribed(OneSignal.Notifications.permission);
        OneSignal.Notifications.addEventListener("change", (p) => setIsSubscribed(p));
      } catch (error) { console.error(error); }
    }
    runOneSignal();
  }, []);

  async function logout() { await supabase.auth.signOut(); }

  if (!session) return <Login />;
  if (loadingRole) return <div className="loading-screen">Cargando permisos...</div>;

  // === DEFINICIÓN DE PERMISOS ===
  const isAdmin = role === "admin";
  const isStaff = role === "staff";
  const isPartner = role === "partner";
  const isStudent = role === "student";

  // Grupos de acceso
  // ¿Quién puede ver Eventos? Admin y Partners.
  const canViewEvents = isAdmin || isPartner; 
  
  // ¿Quién puede ver Ranking? Admin, Staff y Partners.
  const canViewRanking = isAdmin || isStaff || isPartner; 

  // ¿Quién puede Escanear? Admin y Staff.
  const canScan = isAdmin || isStaff;

  // ¿Quién puede mandar Notificaciones/Ver Historial? SOLO EL REY (Admin)
  // (Si quieres que el Staff también pueda, agrega "|| isStaff" aquí)
  const canManage = isAdmin; 

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="brand">
          <span style={{ fontWeight: 900, fontSize: "1.2rem", color: "#2a2f58" }}>TRASCIENDE</span>
        </div>

        <nav className="main-nav">
          {/* 1. CREDENCIAL: Todos la ven */}
          <Link to="/" className={location.pathname === "/" ? "nav-link active" : "nav-link"}>Credencial</Link>
          
          {/* 2. EVENTOS: Solo Admin y Partners */}
          {canViewEvents && (
            <Link to="/events" className={location.pathname === "/events" ? "nav-link active" : "nav-link"}>Eventos</Link>
          )}

          {/* 3. RANKING: Admin, Staff y Partners */}
          {canViewRanking && (
            <Link to="/ranking" className={location.pathname === "/ranking" ? "nav-link active" : "nav-link"}>Ranking</Link>
          )}

          {/* === ZONA DE STAFF/ADMIN === */}
          {(canScan || canManage) && <div className="divider-vertical"></div>}

          {/* 4. ESCÁNER: Admin y Staff */}
          {canScan && (
            <Link to="/staff" className={location.pathname === "/staff" ? "nav-link active" : "nav-link"}>Scanner</Link>
          )}

          {/* 5. GESTIÓN (Historial/Notifs): Solo Admin */}
          {canManage && (
            <>
              <Link to="/admin-history" className={location.pathname === "/admin-history" ? "nav-link active" : "nav-link"}>Historial</Link>
              <Link to="/staff-notifs" className={location.pathname === "/staff-notifs" ? "nav-link active" : "nav-link"}>Notifs</Link>
            </>
          )}

          {/* Botón Rojo OneSignal */}
          {!isSubscribed && (
            <button onClick={() => OneSignal.Slidedown.promptPush()} className="btn-subs">🔔 ACTIVAR</button>
          )}

          <NotificationsBell />
          <button onClick={logout} className="btn-logout">Salir</button>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Credencial />} />
          
          {/* Rutas Protegidas */}
          <Route path="/events" element={canViewEvents ? <Events /> : <Navigate to="/" />} />
          <Route path="/ranking" element={canViewRanking ? <Ranking /> : <Navigate to="/" />} />
          
          <Route path="/staff" element={canScan ? <StaffScan /> : <Navigate to="/" />} />
          <Route path="/admin-history" element={canManage ? <AdminHistory /> : <Navigate to="/" />} />
          <Route path="/staff-notifs" element={canManage ? <StaffNotifications /> : <Navigate to="/" />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}