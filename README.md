# Weather App

Aplicación del clima construida con HTML, CSS y JavaScript vanilla, como parte de una entrevista técnica. Consulta la API de [OpenWeatherMap](https://openweathermap.org/api) para mostrar el clima actual y el pronóstico de 5 días de cualquier ciudad, o de tu ubicación actual.

## Funcionalidades

- Búsqueda de clima por ciudad, con historial de las últimas 5 búsquedas guardado en `localStorage`.
- Detección de ubicación por geolocalización del navegador.
- Pronóstico de 5 días con detalle por hora al hacer clic en cada día (modal).
- Cambio de unidad entre Celsius y Fahrenheit, persistido en `localStorage`.
- Modo claro/oscuro automático según la preferencia del sistema.
- Indicador de carga mientras se consulta la API.
- Mensajes de error en pantalla (sin `alert()`), cubriendo ciudad no encontrada, límite de solicitudes, errores del servidor y problemas de conexión.
- PWA: instalable, con `manifest.json` y service worker (`sw.js`) que cachea el app shell sin cachear las respuestas de la API.

## Stack

HTML5, CSS3 (variables CSS, `prefers-color-scheme`), JavaScript (ES modules), Service Worker API, OpenWeatherMap API.

## Desarrollo local

1. Cloná el repo y copiá `config.example.js` a `config.js`:
   ```bash
   cp config.example.js config.js
   ```
2. Editá `config.js` y poné tu propia API key de [OpenWeatherMap](https://home.openweathermap.org/api_keys) (`config.js` está en `.gitignore`, nunca se commitea).
3. Serví la carpeta con cualquier servidor estático, por ejemplo:
   ```bash
   npx serve .
   ```
4. Abrí la URL que te indique en el navegador.

## Deploy en Netlify

El proyecto no tiene build ni bundler, así que `config.js` (que contiene la key real) nunca viaja en el repo. El deploy genera ese archivo en el momento del build, a partir de una variable de entorno:

1. Conectá el repo en Netlify.
2. En **Site settings → Environment variables**, agregá `OPENWEATHER_API_KEY` con tu key real.
3. El `netlify.toml` del repo ya define el build command que crea `config.js` a partir de esa variable, y el `publish` apunta a la raíz del proyecto.
4. Deployá. La key nunca queda expuesta en el código fuente ni en el historial de git.

## Licencia

Proyecto personal con fines de portfolio / entrevista técnica.
