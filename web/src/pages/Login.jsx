import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false); // Para alternar entre Entrar y Registrarse
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleAuth(e) {
    e.preventDefault();
    setMsg("");
    setLoading(true);

    if (isSignUp) {
      // REGISTRO
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName || "Sin nombre" } },
      });
      if (error) setMsg("Error: " + error.message);
      else setMsg("✅ ¡Cuenta creada! Revisa tu correo para confirmar.");
    } else {
      // LOGIN
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg("Error: " + error.message);
    }
    setLoading(false);
  }

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(135deg, var(--navy) 0%, #1a1d3a 100%)",
      padding: 20
    }}>
      
      <div style={{ 
        background: "white", 
        padding: "40px 30px", 
        borderRadius: "24px", 
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        width: "100%", 
        maxWidth: "400px",
        textAlign: "center"
      }}>
        
        {/* Aquí puedes poner tu logo también si quieres */}
        <div style={{ marginBottom: 20 }}>
            {/* Si ya arreglaste el logo, descomenta la siguiente línea: */}
            {/* <img src="/logo.png" style={{ height: 60 }} alt="Logo" /> */}
            <h1 style={{ margin: "10px 0", color: "var(--navy)", fontSize: "1.8rem" }}>Trasciende</h1>
            <p style={{ color: "#888", fontSize: "0.9rem" }}>
              {isSignUp ? "Crea tu cuenta para iniciar" : "Ingresa para ver tu credencial"}
            </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: "grid", gap: 15, textAlign: "left" }}>
          
          {isSignUp && (
            <div>
              <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={isSignUp}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>Correo Institucional</label>
            <input 
              type="email" 
              placeholder="A00123456@tec.mx" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required
            />
          </div>
          
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--navy)" }}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {msg && (
            <div style={{ 
              padding: 10, 
              background: msg.includes("Error") ? "#fee" : "#eef", 
              color: msg.includes("Error") ? "crimson" : "green", 
              borderRadius: 8,
              fontSize: "0.9rem",
              textAlign: "center"
            }}>
              {msg}
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ marginTop: 10, width: "100%", padding: 14, fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? "Cargando..." : (isSignUp ? "Crear Cuenta" : "Iniciar Sesión")}
          </button>
        </form>

        <div style={{ marginTop: 20, fontSize: "0.9rem", color: "#666" }}>
          {isSignUp ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"}{" "}
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setMsg(""); }}
            style={{ background: "none", border: "none", color: "var(--red)", textDecoration: "underline", padding: 0 }}
          >
            {isSignUp ? "Ingresa aquí" : "Regístrate"}
          </button>
        </div>

      </div>
    </div>
  );
}