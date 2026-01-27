import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [msg, setMsg] = useState("");

  async function login(e) {
    e.preventDefault();
    setMsg("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMsg(error.message);
  }

  async function signup() {
    setMsg("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || "Sin nombre" },
      },
    });

    if (error) setMsg(error.message);
    else setMsg("Cuenta creada. Si pide confirmación, revisa tu correo.");
  }

  return (
    <div style={{ maxWidth: 420, margin: "64px auto", padding: 16 }}>
      <h2>Login Trasciende</h2>

      <div style={{ display: "grid", gap: 10 }}>
        <input
          placeholder="Nombre completo (para credencial)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Entrar</button>
        <button onClick={signup}>Crear cuenta</button>

        {msg && <p style={{ fontSize: 12, opacity: 0.9 }}>{msg}</p>}
      </div>
    </div>
  );
}
