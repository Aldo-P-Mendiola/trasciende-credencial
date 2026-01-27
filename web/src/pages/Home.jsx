import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";

export default function Home() {
  const [qr, setQr] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u?.user;
      if (!user) return;

      // QR
      const payload = JSON.stringify({ userId: user.id });
      const url = await QRCode.toDataURL(payload, { margin: 1, scale: 8 });
      setQr(url);

      // Profile
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, role, points")
        .eq("id", user.id)
        .single();

      if (!error) setProfile(data);
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <div style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h2>Mi credencial</h2>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{profile?.full_name ?? "—"}</div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>{profile?.email ?? "—"}</div>
        <div style={{ fontSize: 12 }}>
          Rol: <b>{profile?.role ?? "—"}</b> · Puntos: <b>{profile?.points ?? 0}</b>
        </div>
      </div>

      {qr ? <img src={qr} alt="QR" style={{ width: 260, height: 260 }} /> : <div>Generando QR…</div>}

      <div style={{ marginTop: 16 }}>
        <button onClick={logout}>Salir</button>
      </div>
    </div>
  );
}
