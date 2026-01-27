import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      const { data, error } = await supabase
        .from("events")
        .select("id, title, start_time, location, points, active")
        .eq("active", true)
        .order("start_time", { ascending: true });

      if (error) setErr(error.message);
      setEvents(data ?? []);
    })();
  }, []);

  return (
    <div>
      <h2>Eventos activos</h2>
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {events.map((e) => (
          <div key={e.id} style={{ padding: 12, border: "1px solid #ddd", borderRadius: 12 }}>
            <div style={{ fontWeight: 800 }}>{e.title}</div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>
              {new Date(e.start_time).toLocaleString()} · {e.location ?? "—"} · {e.points} pts
            </div>
          </div>
        ))}
        {events.length === 0 && <div>No hay eventos activos.</div>}
      </div>
    </div>
  );
}
