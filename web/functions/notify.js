export async function onRequestPost(context) {
  try {
    const { request } = context;
    const body = await request.json();

    // TU CLAVE MAESTRA ESTÁ AQUÍ 👇
    // Fíjate que dice "Basic " seguido de tu clave k7gby...
    const ONESIGNAL_REST_API_KEY = "Basic os_v2_app_z4hzbumus5bwpnja7q4xnuxxzox25reyqnyuejegwyakymgz42saj2hh2ob3qbggurtqldxnphoe2bxc5mx4vjng72younindglp6ca";

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ONESIGNAL_REST_API_KEY // <--- Aquí se envía la credencial
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    // Devolvemos la respuesta de OneSignal a tu página
    return new Response(JSON.stringify(data), { 
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}