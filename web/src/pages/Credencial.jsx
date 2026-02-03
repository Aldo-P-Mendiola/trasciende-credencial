import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import QRCode from "qrcode";
import { toPng } from "html-to-image";

export default function Credencial() {
  const [profile, setProfile] = useState(null);
  const [qr, setQr] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  const c = useMemo(
    () => ({
      navy: "#2a2f58",
      gray: "#cacbd3",
      red: "#bc3f4a",
    }),
    []
  );

  // Carga inicial: perfil + QR + puntos
  useEffect(() => {
    (async () => {
      setLoading(true);

      const { data: u } = await supabase.auth.getUser();
      const me = u?.user;
      if (!me) {
        setLoading(false);
        return;
      }

      // 1) QR (para que staff escanee al estudiante)
      try {
        const payload = JSON.stringify({ userId: me.id });
        const url = await QRCode.toDataURL(payload, { margin: 1, scale: 8 });
        setQr(url);
      } catch (e) {
        console.log("QR ERROR:", e);
      }

      // 2) Perfil base
      const { data: p, error: pErr } = await supabase
        .from("profiles")
        .select("full_name, email, role")
        .eq("id", me.id)
        .single();

      if (pErr) console.log("profiles error:", pErr.message);

      // 3) Puntos desde view calculada
      const { data: pts, error: ptsErr } = await supabase
        .from("v_user_points")
        .select("points")
        .eq("user_id", me.id)
        .maybeSingle();

      if (ptsErr) console.log("points error:", ptsErr.message);

      setProfile({
        full_name: p?.full_name ?? "—",
        email: p?.email ?? me.email ?? "—",
        role: p?.role ?? "student",
        points: pts?.points ?? 0,
      });

      setLoading(false);
    })();
  }, []);

  // Refresco de puntos: realtime por NOTIFICATIONS + fallback cada 10s
  useEffect(() => {
    let channel = null;
    let t = null;

    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const me = u?.user;
      if (!me) return;

      async function loadPoints() {
        const { data: pts, error } = await supabase
          .from("v_user_points")
          .select("points")
          .eq("user_id", me.id)
          .maybeSingle();

        if (error) console.log("POINTS ERROR:", error.message);

        setProfile((prev) =>
          prev ? { ...prev, points: pts?.points ?? prev.points } : prev
        );
      }

      // cuando llegue notif personal -> refresca puntos
      channel = supabase
        .channel("cred-points-" + me.id)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${me.id}`,
          },
          async () => {
            await loadPoints();
          }
        )
        .subscribe();

      // fallback
      t = setInterval(loadPoints, 10000);
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
      if (t) clearInterval(t);
    };
  }, []);

  async function downloadCredencial() {
    try {
      setDownloading(true);

      const node = document.getElementById("credencial");
      if (!node) throw new Error("No encontré el contenedor de la credencial.");

      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = "credencial-trasciende.png";
      link.href = dataUrl;
      link.click();
    } catch (e) {
      alert("No pude descargar la credencial: " + (e?.message ?? String(e)));
    } finally {
      setDownloading(false);
    }
  }

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
          {downloading ? "Generando…" : "⬇️ Descargar PNG"}
        </button>
      </div>

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
              {loading ? "Cargando…" : profile?.full_name ?? "—"}
            </div>

            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 4 }}>
              {loading ? "…" : profile?.email ?? "—"}
            </div>

            <div style={{ marginTop: 10, fontSize: 13 }}>
              Rol: <b style={{ color: "white" }}>{loading ? "…" : profile?.role ?? "—"}</b>
            </div>

            <div style={{ marginTop: 6, fontSize: 13 }}>
              Puntos: <b style={{ color: "white" }}>{loading ? "…" : profile?.points ?? 0}</b>
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
    </div>
  );
}
