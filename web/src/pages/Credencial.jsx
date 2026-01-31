import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Credencial() {
  const [name, setName] = useState("—");
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: userRes } = await supabase.auth.getUser();
      const me = userRes?.user;
      if (!me) {
        setLoading(false);
        return;
      }

      // nombre (de profiles)
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", me.id)
        .maybeSingle();

      setName(profile?.full_name ?? me.email ?? "—");

      // puntos (de la view calculada)
      const { data: p } = await supabase
        .from("v_user_points")
        .select("points")
        .eq("user_id", me.id)
        .maybeSingle();

      setPoints(p?.points ?? 0);
      setLoading(false);
    }

    load();
  }, []);

  const cardStyle = {
    background: "#2a2f58",
    color: "#cacbd3",
    borderRadius: 18,
    padding: 18,
    maxWidth: 420,
    margin: "18px auto",
    boxShadow: "0 10px 30px rgba(0,0,0,.18)",
  };

  const pillStyle = {
    display: "inline-block",
    background: "#bc3f4a",
    color: "white",
    padding: "6px 10px",
    borderRadius: 999,
    fontWeight: 700,
    marginTop: 10,
  };

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ textAlign: "center", margin: "8px 0 14px" }}>Mi credencial</h2>

      <div style={cardStyle} id="credencial-card">
        <div style={{ fontSize: 12, opacity: 0.9 }}>Trasciende · TEC</div>

        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 8 }}>
          {loading ? "Cargando…" : name}
        </div>

        <div style={pillStyle}>
          {loading ? "Puntos: …" : `Puntos: ${points}`}
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.9 }}>
          *Los puntos se calculan automáticamente por tus asistencias.
        </div>
      </div>
    </div>
  );
}

