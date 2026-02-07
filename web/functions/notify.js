export async function onRequestPost(context) {
  try {
    // 1. Recibimos los datos que manda tu página
    const { request } = context;
    const body = await request.json();

    // 2. Cloudflare se los envía a OneSignal (Aquí sí funciona)
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic k7gby5rchedmfbvo5ey2zyao4' 
      },
      body: JSON.stringify(body)
    });

    // 3. Devolvemos la respuesta a tu página
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
