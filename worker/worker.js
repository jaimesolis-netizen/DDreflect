/**
 * Proxy de Groq para el Constructor de Dispositivos de Reflexión (DD PUCV)
 * ---------------------------------------------------------------------
 * Este Worker recibe las peticiones del aplicativo (index.html/app.js),
 * les agrega la clave de Groq (guardada como secreto de Cloudflare,
 * NUNCA en este archivo ni en el repositorio) y las reenvía a Groq.
 *
 * La clave jamás llega al navegador de quien usa la app: solo viaja
 * entre Cloudflare y Groq. Por eso este archivo SÍ puede vivir en un
 * repositorio público sin riesgo — no contiene ningún secreto.
 *
 * Despliegue (sin instalar nada, todo desde el navegador):
 * 1. Crea una cuenta gratuita en https://dash.cloudflare.com
 * 2. Workers & Pages -> Create -> Create Worker -> ponle un nombre
 *    (ej: "dd-groq-proxy") -> Deploy.
 * 3. Edit code -> borra el contenido de ejemplo -> pega TODO este
 *    archivo -> Deploy.
 * 4. Ve a Settings -> Variables and Secrets -> Add ->:
 *      Name: GROQ_API_KEY
 *      Value: tu clave gsk_...  (marca "Encrypt")
 *    Guarda y vuelve a hacer Deploy si te lo pide.
 * 5. Copia la URL que te da Cloudflare (algo como
 *    https://dd-groq-proxy.tu-usuario.workers.dev) y pégala en
 *    app.js, en la constante PROXY_ENDPOINT.
 * 6. (Opcional pero recomendado) En Settings -> Domains & Routes
 *    no es necesario nada más — el *.workers.dev ya sirve.
 *
 * Para limitar quién puede usar el proxy (evitar que alguien afuera
 * del taller lo use para gastar tu cuota), edita ALLOWED_ORIGINS
 * más abajo con el dominio exacto donde publicarás la app
 * (ej: "https://tu-usuario.github.io").
 */

const ALLOWED_ORIGINS = [
  // 'https://tu-usuario.github.io',
  // Deja vacío el arreglo (todos permitidos) mientras pruebas,
  // y complétalo antes de compartir el link ampliamente.
];

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? (origin || '*') : 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    if (ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(JSON.stringify({ error: { message: 'Origen no autorizado.' } }), {
        status: 403, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: { message: 'Método no permitido.' } }), {
        status: 405, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    if (!env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: { message: 'El proxy no tiene configurada GROQ_API_KEY.' } }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    let body;
    try {
      body = await request.text();
    } catch (e) {
      return new Response(JSON.stringify({ error: { message: 'Cuerpo de la petición inválido.' } }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    const groqRes = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.GROQ_API_KEY,
      },
      body: body,
    });

    const responseBody = await groqRes.text();
    return new Response(responseBody, {
      status: groqRes.status,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  },
};
