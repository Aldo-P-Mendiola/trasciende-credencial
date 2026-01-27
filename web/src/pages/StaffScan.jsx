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
    async function loadEvents() {
      const { data } = await supabase
        .from("events")
        .select("id, title, start_time")
        .eq("active", true)
        .order("start_time", { ascending: true });

      setEvents(data ?? []);
      if (data?.[0]?.id) setEventId(data[0].id);
    }
    loadEvents();

    return () => stopScan(); // cleanup al salir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScan() {
    if (isScanning) return;
    if (!eventId) return setStatus("Selecciona un evento primero.");

    setStatus("Iniciando cámara…");
    setIsScanning(true);

    const html5QrCode = new Html5Qrcode(qrRegionId);
    scannerRef.current = html5QrCode;

    try {
      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // evita doble lectura del mismo QR en caliente
          if (cooldownRef.current) return;
          cooldownRef.current = true;
          setTimeout(() => (cooldownRef.current = false), 1200);

          await registerCheckin(decodedText);
        },
        () => {}
      );
      setStatus("Escaneando… apunta la cámara al QR.");
    } catch (e) {
      setStatus("No pude abrir la cámara: " + e.message);
      setIsScanning(false);
    }
  }

  async function stopScan() {
    try {
      if (scannerRef.current) {
        const state = scannerRef.current.getState?.();
        // si está corriendo, deténlo
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {
      // ignore
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

      const { data: userData } = await supabase.auth.getUser();
      const staffId = userData?.user?.id;

      const { error } = await supabase.from("checkins").insert({
        event_id: eventId,
        user_id: userId,
        staff_id: staffId ?? null,
      });

      if (error) {
        if (String(error.message).toLowerCase().includes("duplicate")) {
          setStatus("⚠️ Ya estaba registrado en este evento.");
        } else {
          setStatus("Error: " + error.message);
        }
      } else {
        setStatus("✅ Check-in registrado.");
      }
    } catch (e) {
      setStatus("Error: " + e.message);
    }
  }

  return (
    <div>
      <h2>Staff · Escanear</h2>

      <label>
        Evento:
        <select value={eventId} onChange={(e) => setEventId(e.target.value)} style={{ marginLeft: 8 }}>
          {events.map((e) => (
            <option key={e.id} value={e.id}>
              {e.title} ({new Date(e.start_time).toLocaleString()})
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
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

