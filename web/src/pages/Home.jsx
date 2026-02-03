import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import { toPng } from "html-to-image";

export default function Home() {
  const [qr, setQr] = useState("");
  const [profile, setProfile] = useState(null);
  const [downloading, setDownloading] = useState(false);

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

  async function downloadCredencial() {
    try {
      setDownloading(true);

      const node = document.getElementById("credencial");
      if (!node) throw new Error("No encontré el contenedor de la credencial.");

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2, // más nitidez
      });

      const link = document.createElement("a");
      link.download = "credencial-trasciende.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert("No pude descargar la credencial: " + e.message);
    } finally {
      setDownloading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  const c = {
    navy: "#2a2f58",
    gray: "#cacbd3",
    red: "#bc3f4a",
  };

  return (
    <div style={{ maxWidth: 560, margin: "40px auto", padding: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, color: c.navy }}>Mi credencial</h2>

        <button
          onClick={downloadCredencial}
          disabled={downloading}
          style={{
            background: c.red,
            color: "white",
            border: "none",
            borderRadius: 12,
            padding: "10px 12px",
            cursor: downloading ? "not-allowed" : "pointer",
            fontWeight: 800,
            opacity: downloading ? 0.7 : 1,
          }}
        >
          {downloading ? "Generando…" : "⬇️ Descargar"}
        </button>
      </div>

      {/* ✅ Esto es lo que se convierte a imagen */}
      <div
        id="credencial"
        style={{
          marginTop: 16,
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid rgba(42,47,88,.25)`,
          boxShadow: "0 18px 40px rgba(0,0,0,.18)",
          background: c.navy,
          color: c.gray,
        }}
      >
        {/* Header */}
        <div style={{ padding: 16, background: "rgba(255,255,255,.06)" }}>
          <div style={{ fontSize: 12, opacity: 0.9 }}>Tecnológico de Monterrey</div>
          <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 0.2 }}>Programa Trasciende</div>
          <div style={{ marginTop: 8, height: 3, width: 80, background: c.red, borderRadius: 99 }} />
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "white" }}>
              {profile?.full_name ?? "—"}
            </div>

            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
              {profile?.email ?? "—"}
            </div>

            <div style={{ marginTop: 10, fontSize: 13 }}>
              Rol: <b style={{ color: "white" }}>{profile?.role ?? "—"}</b>
            </div>

            <div style={{ marginTop: 6, fontSize: 13 }}>
              Puntos: <b style={{ color: "white" }}>{profile?.points ?? 0}</b>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(202,203,211,.18)",
                fontSize: 12,
                lineHeight: 1.35,
              }}
            >
              Presenta esta credencial en eventos del semestre. Tu asistencia se registra escaneando el QR.
            </div>
          </div>

          <div
            style={{
              borderRadius: 16,
              background: "white",
              padding: 10,
              display: "grid",
              placeItems: "center",
            }}
          >
            {qr ? (
              <img src={qr} alt="QR" style={{ width: 240, height: 240 }} />
            ) : (
              <div style={{ color: c.navy }}>Generando QR…</div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: 14,
            background: "rgba(255,255,255,.04)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <div style={{ opacity: 0.9 }}>CCM 2025</div>
          <div style={{ opacity: 0.9 }}>trasciende</div>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={logout}
          style={{
            background: "transparent",
            border: `1px solid ${c.navy}`,
            color: c.navy,
            borderRadius: 12,
            padding: "10px 12px",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          Salir
        </button>
      </div>
    </div>
  );
}
