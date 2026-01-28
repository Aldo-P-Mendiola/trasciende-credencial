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
      // Si ya estaba registrado, el RPC igual devuelve puntos actuales.
      // Dependiendo de cómo lo hayas implementado, puede lanzar error o no.
      setStatus("❌ " + error.message);
      return;
    }

    const newPoints = data?.[0]?.new_points;
    setStatus(`✅ Check-in OK. Nuevos puntos: ${newPoints ?? "?"}`);
  } catch (e) {
    setStatus("Error: " + e.message);
  }
}

