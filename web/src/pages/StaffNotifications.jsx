import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function StaffNotifications() {
  const [mode, setMode] = useState("all"); // all | one
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [title, setTitle] = useState("Aviso Trasciende");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setStatus("");
  }, [mode]);

  async function resolveUser() {
    setStatus("Buscando usuario…");
    const clean = email.trim().toLowerCase();
    if (!clean) return setStatus("Pon un email.");

    const { data, error } = await supabase
      .from("profiles")
      .select("id,email,full_name")
      .ilike("email", clean)
      .maybeSingle();

    if (error) return setStatus("Error: " + error.message);
    if (!data?.id) return setStatus("No encontré ese email en profiles.");

    setUserId(data.id);
    setStatus(`OK: ${data.full_name ?? data.email}`);
  }

  async function send() {
    setStatus("");
    if (!title.trim()) return setStatus("Pon un título.");
    if (!body.trim()) return setStatus("Escribe el mensaje.");

    let targetUserId = null;

    if (mode === "one") {
      if (!userId) return setStatus("Primero resuelve el email (Buscar).");
      targetUserId = userId;
    }

    setStatus("Enviando…");

    const { error } = await supabase.from("notifications").insert({
      user_id: targetUserId, // null = a todos
      title: title.trim(),
      body: body.trim(),
    });

    if (error) return setStatus("Error: " + error.message);

    setBody("");
    setStatus("✅ Notificación enviada.");
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2>Staff · Notificaciones</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <button onClick={() => setMode("all")} style={{ fontWeight: mode === "all" ? 900 : 600 }}>
          A todos
        </button>
        <button onClick={() => setMode("one")} style={{ fontWeight: mode === "one" ? 900 : 600 }}>
          A 1 usuario
        </button>
      </div>

      {mode === "one" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@tec.mx"
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
          <button onClick={resolveUser}>Buscar</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mensaje…"
          rows={4}
          style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
        />

        <button onClick={send} style={{ padding: 12, borderRadius: 12, fontWeight: 900 }}>
          Enviar
        </button>

        {status && <div style={{ marginTop: 6 }}>{status}</div>}
      </div>

      <p style={{ marginTop: 14, opacity: 0.8, fontSize: 12 }}>
        Nota: “A todos” inserta notifications con user_id = NULL.
      </p>
    </div>
  );
}

