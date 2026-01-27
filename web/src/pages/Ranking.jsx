import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Ranking() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      setErr("");
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, points")
        .order("points", { ascending: false })
        .limit(50);

      if (error) setErr(error.message);
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div>
      <h2>Ranking</h2>
      {err && <div style={{ color: "crimson" }}>{err}</div>}

      <ol>
        {rows.map((r, idx) => (
          <li key={idx}>
            {r.full_name} — <b>{r.points}</b>
          </li>
        ))}
      </ol>
    </div>
  );
}
