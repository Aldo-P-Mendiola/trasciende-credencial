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

  // Referencias para evitar lecturas dobles (Anti-spam)
  const processingRef = useRef(false);
  const lastRef = useRef({ key: "", ts: 0 });

  // 1. Cargar eventos activos al entrar
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

  // 2. Iniciar Cámara
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
          // Si ya estamos procesando uno, ignoramos
          if (processingRef.current) return;

          // Extraer userId del JSON del QR
          let userId = "";
          try {
            userId = JSON.parse(decodedText)?.userId ?? "";
          } catch {
            // Si falla el parseo, userId se queda vacío
          }

          // Clave única para evitar spam de la misma persona en el mismo evento en menos de 8s
          const key = `${eventId}::${userId || decodedText}`;
          const now = Date.now();
          const withinTime = now - lastRef.current.ts < 8000; 
          const sameKey = lastRef.current.key === key;

          if (sameKey && withinTime) return;

          // Si pasa el filtro, registramos
          lastRef.current = { key, ts: now };
          processingRef.current = true;

          try {
            await registerCheckin(decodedText);
          } finally {
            // Liberamos el bloqueo después de un ratito
            setTimeout(() => {
              processingRef.current = false;
            }, 1500);
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

  // 3. Detener Cámara
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

  // 4. Lógica de Registro (Conexión con Supabase)
  async function registerCheckin(payloadStr) {
    try {
      setStatus("Procesando QR...");

      // A) Parsear el QR
      let parsed;
      try {
        parsed = JSON.parse(payloadStr);
      } catch {
        throw new Error("QR inválido (no es JSON).");
      }

      const userId = parsed?.userId;
      if (!userId) throw new Error("QR inválido (sin userId).");

      // B) Llamar a la Base de Datos (RPC)
      // Usamos 'event_id' y 'user_id' tal cual lo definimos en el SQL
      const { data: totalPoints, error: rpcError } = await supabase.rpc("register_checkin", {
        event_id: eventId,
        user_id: userId,
      });

      if (rpcError) {
        console.error("RPC Error:", rpcError);
        throw new Error(rpcError.message);
      }

      // C) Enviar Notificación al Alumno
      const { error: notifErr } = await supabase.from("notifications").insert({
        user_id: userId,
        title: "Asistencia registrada",
        body: `¡Asistencia tomada! Tu nuevo total es de ${totalPoints} puntos.`,
      });

      if (notifErr) console.log("NOTIF ERROR:", notifErr.message);

      // D) Éxito en pantalla
      setStatus(`✅ Check-in OK. Total puntos: ${totalPoints}`);

    } catch (e) {
      console.log("REGISTER ERROR:", e);
      const msg = String(e?.message ?? e).toLowerCase();
      
      // Mensajes amigables
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setStatus("⚠️ El alumno ya estaba registrado en este evento.");
      } else {
        setStatus("❌ Error: " + (e?.message ?? "Desconocido"));
      }
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <h2>Staff · Escanear</h2>

      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 20 }}>
        <label>
          <b>Evento:</b>&nbsp;
          <select 
            value={eventId} 
            onChange={(e) => setEventId(e.target.value)}
            style={{ padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </label>

        {!isScanning ? (
          <button className="btn-primary" onClick={startScan}>Iniciar Cámara</button>
        ) : (
          <button className="btn-action" onClick={stopScan}>Detener</button>
        )}
      </div>

      <div style={{ 
        marginTop: 12, 
        padding: 10, 
        border: "2px dashed #ccc", 
        borderRadius: 12, 
        background: "#f9f9f9",
        minHeight: 300 
      }}>
        <div id={qrRegionId} />
      </div>

      <div style={{ 
        marginTop: 20, 
        padding: 15, 
        background: status.includes("✅") ? "#eeffee" : (status.includes("❌") ? "#ffeeee" : "white"),
        borderRadius: 12,
        textAlign: "center",
        fontWeight: "bold",
        fontSize: "1.1rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
      }}>
        {status}
      </div>
    </div>
  );
}