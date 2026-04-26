# 📖 La Biblia Técnica de Verdantia (Borrador)

> Este documento es la referencia arquitectónica y funcional de Verdantia. Detalla cómo están construidos los sistemas a nivel interno, los flujos de datos y las optimizaciones de vanguardia implementadas en la plataforma.

---

## Módulo 1: Gestión Multimedia y Fotografías (Engine Gráfico)

El módulo de procesamiento de imágenes de Verdantia no es un simple sistema de subida de archivos (upload), sino un **Motor de Procesamiento Multimedia (Pipeline) de grado corporativo**. Está diseñado para minimizar el coste de servidores, maximizar las métricas SEO (Core Web Vitals) y ofrecer una experiencia de usuario (UX) inmersiva y sin interrupciones.

A continuación se detalla el ciclo de vida completo de una fotografía desde que el usuario la selecciona hasta que se renderiza en la pantalla de un visitante.

### 1.1. Fase de Cliente (Navegador Front-End)
Antes de que la imagen toque la red de internet, el navegador del administrador realiza tareas críticas:

*   **Interceptación Anti-iPhone (HEIC):** Si un administrador intenta subir una foto directa desde un dispositivo Apple (formato propietario `.HEIC`), la plataforma inyecta un WebWorker que utiliza WebAssembly (`heic2any`) para traducir matemáticamente la foto a formato estándar JPEG de forma invisible. El usuario nunca sufre un error de incompatibilidad.
*   **Compresión Ultrasónica Pre-Subida:** Para proteger el ancho de banda y garantizar subidas instantáneas incluso en 3G, la imagen original se exprime en el navegador usando `browser-image-compression`. Las fotos de 15MB se reducen a un máximo de 1MB (resolución tope 2048px) usando el propio procesador del usuario (Edge Computing).
*   **Pegado Mágico (Clipboard Listener):** Un "escuchador de eventos" global (`window.addEventListener('paste')`) permite al administrador copiar cualquier imagen de internet y simplemente pulsar **Ctrl+V** en el teclado estando en la página del editor. La imagen inicia automáticamente su flujo de subida.

### 1.2. Fase de Servidor (Backend Processing API)
Una vez el archivo llega al servidor Next.js (`route.ts`), entra en la fábrica de procesamiento impulsada por la librería de ultra-bajo nivel C++ `sharp`:

*   **Generación de SEO Dinámico (Gemini AI):** El archivo crudo es convertido a Base64 y enviado a la IA de Gemini Vision, la cual analiza visualmente la foto para redactar un atributo SEO `alt` descriptivo. Además, se genera un "slug" limpio para el nombre de archivo físico (ej: `tomate-rojo-maduro-1234.webp`).
*   **Extracción de Metadatos (EXIF):** La librería `exifr` analiza la cabecera binaria del archivo para rescatar información de la captura (Marca de cámara, Modelo y Fecha de toma original). Estos datos se guardan en la BBDD para enriquecer la ficha técnica pública.
*   **Conversión a Formato de Próxima Generación:** Independientemente del formato de entrada, las imágenes se codifican a formato **WebP** (`.webp`) con una calidad de compresión del 80%, ofreciendo calidades superiores al JPG pesando la mitad.

### 1.3. Bifurcación Visual (Generación de Múltiples Assets)
El servidor no guarda una foto, guarda un ecosistema visual por cada subida:

*   **Versión HD + Propiedad Intelectual:** La foto principal se redimensiona a un máximo de 1920x1080px (Full HD) y se le inyecta un código SVG dinámico con la palabra "VERDANTIA" semitransparente incrustada en la esquina inferior derecha para proteger los derechos de autor contra scrapers.
*   **Miniatura + Smart Crop AI:** Se clona el flujo en memoria para generar una miniatura súper ligera (`thumb-*.webp`) de 400x400px. No se usa un recorte central aburrido, sino un algoritmo de atención y entropía matemática (`sharp.strategy.attention`) que detecta dónde está el "sujeto u objeto" de la foto para recortar de forma perfecta.
*   **Cálculo de Efecto BlurHash:** El servidor decodifica la imagen a sus píxeles puros RGBA, la encoge a 32x32 y la pasa por el algoritmo `blurhash`. Se obtiene una cadena de unos 20 caracteres (ej: `LEHV6nWB2yk8pyo0adR*`) que representa un "fantasma matemático" de la imagen.
*   **Inteligencia de Color (node-vibrant):** Se escanea la fotografía para extraer su paleta armónica y encontrar su "Color Vibrante" predominante.

Todos estos datos (`exif_data`, `blurhash`, `vibrant_color`, `seo_alt`) se empaquetan en un objeto JSON y se insertan en la columna `resumen` de la base de datos `datosadjuntos`.

### 1.4. Fase de Renderizado (UI/UX)
Cuando un usuario visita el catálogo, el sistema orquesta la carga para que se sienta instantánea y fluida:

*   **Renderizado BlurHash:** Antes de pedir la foto a internet, un `Canvas` de React intercepta el código de 20 caracteres y dibuja una imagen abstracta difuminada de la foto. No hay saltos visuales ni huecos blancos.
*   **Tematización Inmersiva (Dominant Color):** El color "Vibrante" extraído de la foto designada como 'Principal' tiñe sutilmente el fondo y los bordes de la cabecera de toda la pantalla de la especie, generando un efecto elegante similar al de Apple Music o Spotify.
*   **Reordenación Drag & Drop en Vivo:** Los administradores pueden reorganizar la galería arrastrando miniaturas con el ratón. Esto dispara actualizaciones de base de datos asíncronas e instantáneas (`PUT /photos/reorder`) sin recargar la página.

*(Fin de Especificación del Módulo Fotos)*
