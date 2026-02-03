import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { supabase } from "../lib/supabase";

export default function StaffScan() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState("");
  const [status, setStatus] = useState("Listo.");
  const [isScanning, setIsScanning] = useState(false);

  const qrRegionId = "qr-reader-region";
  const scannerRef = useRef(null);
  const cooldownRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        setStatus("Cargando eventos…");
        const { data, error } = await supabase
          .from("events")
          .select("id, title, start_time")
          .eq("active", true)
          .order("start_time", { ascending: true });

        if (error) throw error;

        setEvents(data ?? []);
        if (data?.[0]?.id) setEventId(data[0].id);

        setStatus("Selecciona un evento y presiona Iniciar.");
      } catch (e) {
        console.log("LOAD EVENTS ERROR:", e);
        setStatus("Error cargando eventos: " + (e?.message ?? String(e)));
      }
    })();

    return () => stopScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScan() {
    try {
      if (isScanning) return;
      if (!eventId) return setStatus("Selecciona un evento primero.");

      setStatus("Iniciando cámara… (si te pide permiso, acepta)");
      setIsScanning(true);

      const html5QrCode = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (cooldownRef.current) return;
          cooldownRef.current = true;
          setTimeout(() => (cooldownRef.current = false), 1200);

          await registerCheckin(decodedText);
        }
      );

      setStatus("Escaneando… apunta al QR del estudiante.");
    } catch (e) {
      console.log("CAMERA ERROR:", e);
      setStatus("No pude abrir la cámara: " + (e?.message ?? String(e)));
      setIsScanning(false);
    }
  }

  async function stopScan() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (e) {
      console.log("STOP ERROR:", e);
    } finally {
      setIsScanning(false);
    }
  }

  async function registerCheckin(payloadStr) {
    try {
      setStatus("Procesando…");

      let parsed;
      try {
        parsed = JSON.parse(payloadStr);
      } catch {
        throw new Error("QR inválido (no es JSON).");
      }

      const userId = parsed?.userId;
      if (!userId) throw new Error("QR inválido (sin userId).");

      const { data, error } = await supabase.rpc("register_checkin", {
        p_event_id: eventId,
        p_user_id: userId,
      });

      if (error) {
        setStatus("❌ " + error.message);
        return;
      }

      // Notificación in-app (campana)
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: userId,
        title: "Asistencia registrada",
        body: "Tu asistencia fue registrada. Revisa tus puntos en la credencial.",
      });
      if (notifErr) console.log("NOTIF ERROR:", notifErr.message);

      const newPoints = data?.[0]?.new_points;
      setStatus(`✅ Check-in OK. Nuevos puntos: ${newPoints ?? "?"}`);
    } catch (e) {
      console.log("REGISTER ERROR:", e);
      setStatus("Error: " + (e?.message ?? String(e)));
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2>Staff · Escanear</h2>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <label>
          Evento:&nbsp;
          <select value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({new Date(ev.start_time).toLocaleString()})
              </option>
            ))}
          </select>
        </label>

        {!isScanning ? (
          <button onClick={startScan}>Iniciar escaneo</button>
        ) : (
          <button onClick={stopScan}>Detener</button>
        )}
      </div>

      <div style={{ marginTop: 12, padding: 10, border: "1px solid #ddd", borderRadius: 12 }}>
        <div id={qrRegionId} />
      </div>

      <div style={{ marginTop: 10 }}>{status}</div>

      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        Tip: en iPhone/Android el escaneo solo funciona bien si la página está en <b>HTTPS</b> (Pages ya lo es).
      </div>
    </div>
  );
}
