import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Ranking() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const { data, error } = await supabase
    .from("v_leaderboard_public").select("user_id, full_name, points")
      .select("user_id, full_name, points")
      .order("points", { ascending: false })
      .limit(50);

    if (error) setErr(error.message);
    setRows(data ?? []);
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <h2>Ranking</h2>
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      <ol>
        {rows.map((r) => (
          <li key={r.user_id}>
            {r.full_name} — <b>{r.points}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
