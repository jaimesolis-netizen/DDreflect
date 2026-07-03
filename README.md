# Constructor de Dispositivos de Reflexión

Aplicativo web (HTML/CSS/JS puro, sin build) para el taller **"Diseño de Dispositivos para la Reflexión en las Prácticas Profesionales"** — Dirección de Desarrollo Docente, PUCV.

Guía a la persona docente paso a paso por los 5 componentes de un dispositivo de reflexión (Sujeto, Estímulo, Modelo, Preguntas, Nivel), compila la ficha en vivo a medida que avanza, ofrece un acompañante de IA (vía **Groq API**) en cada etapa, y permite descargar el resultado final en PDF. Responsivo para celular, tablet y computador.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (o usa uno existente) y sube estos 3 archivos tal cual: `index.html`, `style.css`, `app.js` (y este `README.md` si quieres).
2. En el repositorio: **Settings → Pages**.
3. En "Build and deployment" elige **Source: Deploy from a branch**, rama `main` y carpeta `/ (root)`.
4. Guarda. En 1–2 minutos GitHub te dará una URL del tipo `https://<tu-usuario>.github.io/<repo>/`.
5. Comparte esa URL con las y los participantes del taller.

No necesitas backend, base de datos ni build step: son archivos estáticos.

## Cómo activar el acompañante IA (clave de Groq)

Tienes tres formas. **A quedó descartada** — si llegaste aquí porque a ti te pasó, sigue leyendo.

### ~~Opción A — Clave pegada directo en app.js~~ (no usar)

Pegar la clave real dentro de `app.js` en un repositorio público **no funciona de forma sostenida**: GitHub escanea automáticamente los repos públicos en busca de patrones de claves conocidas (Groq es uno de los proveedores que participan en ese programa) y, apenas la detecta, se la reporta a Groq — que la revoca en minutos. No importa qué tan bien la "escondas" en el código (base64, partirla en pedazos, etc.): en cuanto la app hace una llamada real, la clave viaja en texto plano en la petición HTTP y cualquiera puede verla con las herramientas de desarrollador del navegador. Ofuscarla solo le quita a GitHub la posibilidad de avisarte — no te protege de nada.

### Opción B — Proxy propio con Cloudflare Workers (recomendada: pública, gratis, cero configuración para participantes)

La clave vive en Cloudflare, nunca en el repositorio ni en el navegador de quien usa la app. Así el repo puede ser 100% público sin riesgo.

1. Crea una cuenta gratuita en [dash.cloudflare.com](https://dash.cloudflare.com) (no pide tarjeta).
2. **Workers & Pages → Create → Create Worker**. Ponle un nombre (ej. `dd-groq-proxy`) → **Deploy**.
3. **Edit code** → borra el ejemplo → pega todo el contenido de [`worker/worker.js`](worker/worker.js) de este repo → **Deploy**.
4. **Settings → Variables and Secrets → Add variable**:
   - Name: `GROQ_API_KEY`
   - Value: tu clave `gsk_...` (marca la opción **Encrypt**)
   - Guarda y vuelve a desplegar si te lo pide.
5. Copia la URL que te dio Cloudflare (algo como `https://dd-groq-proxy.tu-usuario.workers.dev`).
6. Abre `app.js`, busca `const PROXY_ENDPOINT = '';` (cerca de la línea 20) y pega esa URL:
   ```js
   const PROXY_ENDPOINT = 'https://dd-groq-proxy.tu-usuario.workers.dev';
   ```
7. Sube el cambio al repo. Este archivo **sí puede ser público sin problema** — no contiene ningún secreto, solo la dirección del proxy.
8. (Recomendado) En `worker/worker.js`, dentro de `ALLOWED_ORIGINS`, agrega la URL exacta de tu GitHub Pages (ej. `'https://tu-usuario.github.io'`) para que solo tu app pueda usar el proxy, y no cualquiera que descubra la URL del Worker. Vuelve a pegar el código actualizado en Cloudflare y haz Deploy.

El plan gratuito de Cloudflare Workers alcanza sin problema para un taller (100.000 peticiones al día).

### Opción C — Cada participante usa su propia clave

Deja `PROXY_ENDPOINT` y `DEFAULT_API_KEY` vacíos. Cada persona entra a [console.groq.com/keys](https://console.groq.com/keys), genera su propia clave gratuita y la pega en el panel ⚙️ la primera vez que abre la app — queda guardada solo en su navegador. Es la opción con menos configuración de tu parte y sin ningún secreto que cuidar, pero le agrega un paso a cada participante.

> Si ya te bloquearon una clave: entra a [console.groq.com/keys](https://console.groq.com/keys) y revísala — probablemente ya aparece revocada. Genera una nueva y, esta vez, úsala solo con la Opción B o C, nunca pegada directo en un archivo del repo.


## Modelos de Groq

Por defecto el aplicativo usa `openai/gpt-oss-120b`. Groq deprecia y reemplaza modelos con cierta frecuencia; si un modelo empieza a fallar, cualquier persona puede cambiarlo desde el mismo panel de configuración (hay un selector con varias alternativas). La lista vigente siempre está en [console.groq.com/docs/models](https://console.groq.com/docs/models).

## Personalizar contenido

- **Colores institucionales**: están centralizados como variables CSS al inicio de `style.css` (`--navy`, `--red`, `--yellow`, `--cyan`, `--purple`, `--teal`).
- **Preguntas y opciones de cada paso**: se editan directamente en `index.html` (busca `STEP 1`, `STEP 2`, etc.).
- **Instrucciones del acompañante IA**: variable `SYSTEM_PROMPT` al inicio de `app.js`.
- **Ficha final / PDF**: función `renderFichaFinal()` en `app.js`.

## Estructura de archivos

```
index.html   → estructura de las 5 etapas + pantalla de bienvenida y ficha final
style.css    → sistema de diseño (paleta PUCV DD100 años) y responsividad
app.js       → estado del wizard, compilación en vivo, llamadas a Groq/proxy, export a PDF
worker/
  worker.js  → proxy opcional de Cloudflare Workers (Opción B) — sin secretos, seguro de subir
```

## Privacidad de los datos del dispositivo

Todo lo que cada persona escribe (sujeto, estímulo, preguntas, etc.) se guarda solo en su propio navegador (`localStorage`), igual que la clave de Groq. Si borra datos de navegación o cambia de dispositivo, pierde el avance — puede usar "Descargar PDF" para guardar una copia definitiva.
