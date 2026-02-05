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

  // anti-spam / dedupe
  const processingRef = useRef(false);
  const lastRef = useRef({ key: "", ts: 0 });

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
          if (processingRef.current) return;

          // intenta extraer userId; si no, usa texto crudo como fallback
          let userId = "";
          try {
            userId = JSON.parse(decodedText)?.userId ?? "";
          } catch {
            userId = "";
          }

          // clave de dedupe robusta
          const key = `${eventId}::${userId || decodedText}`;

          const now = Date.now();
          const within = now - lastRef.current.ts < 8000; // 8s antispam fuerte
          const same = lastRef.current.key === key;

          if (same && within) return;

          lastRef.current = { key, ts: now };

          processingRef.current = true;
          try {
            await registerCheckin(decodedText);
          } finally {
            // suelta el lock después (para que no se dispare en ráfaga)
            setTimeout(() => {
              processingRef.current = false;
            }, 1200);
          }
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
        const msg = String(error.message || "").toLowerCase();
        if (msg.includes("duplicate") || msg.includes("conflict") || msg.includes("already")) {
          setStatus("⚠️ Ya estaba registrado en este evento.");
          return;
        }
        setStatus("❌ " + error.message);
        return;
      }

// 1. LLAMADA AL SQL (RPC)
      // OJO: "data" aquí recibe directamente el número de puntos (int), no un array.
      const { data: totalPoints, error: rpcError } = await supabase.rpc("register_checkin", {
        event_id: eventId,
        user_id: scannedUserId // Asegúrate de usar la variable donde guardaste el ID del QR
      });

      if (rpcError) throw rpcError;

      // 2. MANDAR NOTIFICACIÓN
      // Como el SQL maneja los duplicados internamente, aquí asumimos éxito.
      // Le avisamos al alumno cuántos puntos tiene ahora.
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: scannedUserId, // El ID del alumno
        title: "Asistencia registrada",
        body: `¡Asistencia tomada! Tu nuevo total es de ${totalPoints} puntos.`,
      });

      if (notifErr) console.log("NOTIF ERROR:", notifErr.message);

      // 3. ACTUALIZAR TEXTO EN PANTALLA
      setStatus(`✅ Check-in OK. Total puntos: ${totalPoints}`);

      // pausa dura 8s aunque el QR siga en cámara (anti spam)
      processingRef.current = true;
      setTimeout(() => {
        processingRef.current = false;
      }, 8000);
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
    </div>
  );
}
