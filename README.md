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

## Cómo obtiene cada persona su clave de Groq

1. Cada usuario entra a [console.groq.com/keys](https://console.groq.com/keys), crea una cuenta gratuita y genera una API key (empieza con `gsk_...`).
2. Al abrir el aplicativo, se le pedirá pegar esa clave en el panel de configuración (ícono de engranaje, arriba a la derecha).
3. La clave se guarda **solo en el navegador de esa persona** (`localStorage`). El aplicativo no tiene servidor propio: las llamadas van directo del navegador a `api.groq.com`. Nadie más ve esa clave, pero por lo mismo cada participante necesita la suya.

> Nota de seguridad: como es una app 100% estática (sin backend), la clave vive en el navegador de quien la ingresa. Es el mismo modelo que usan la mayoría de las apps "trae tu propia clave". No la compartas en capturas de pantalla ni la subas a un repositorio.

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
app.js       → estado del wizard, compilación en vivo, llamadas a Groq, export a PDF
```

## Privacidad de los datos del dispositivo

Todo lo que cada persona escribe (sujeto, estímulo, preguntas, etc.) se guarda solo en su propio navegador (`localStorage`), igual que la clave de Groq. Si borra datos de navegación o cambia de dispositivo, pierde el avance — puede usar "Descargar PDF" para guardar una copia definitiva.
