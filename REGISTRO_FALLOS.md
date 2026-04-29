# 🐛 Registro de Fallos y Correcciones de Verdantia

Este documento sirve como "memoria persistente" para evitar que los fallos reaparezcan o se ignoren durante el desarrollo a causa de los recortes de contexto de la IA.

## Estado de los Errores

- 🔴 **Pendiente:** El error está documentado pero no se ha aplicado el código.
- 🟡 **En Proceso:** Se está escribiendo el código o está pendiente de validación.
- 🟢 **Resuelto:** El código se ha aplicado y validado.

---

### 8.1. 🟡 PENDIENTE DE VALIDACIÓN - Imágenes no cargan en Producción (Cloud)
- **Fallo:** Las fotografías e imágenes (portadas de PDFs, avatares, fotos de especies) que sí se ven en el entorno local (localhost), devuelven un error o aparecen rotas en la web subida a Google Cloud / Firebase Hosting.

#### [29/04/2026 - 15:45]
- **Falso análisis:** Creímos que Next.js bloqueaba orígenes.
- **Solución aplicada:** Se editó `next.config.ts`.
- **Resultado:** 🔴 FRACASO.

#### [29/04/2026 - 16:10]
- **Análisis real:** El endpoint `/api/media` falla en Cloud al hacer `readFile` de fotos antiguas porque la carpeta `public` no se despliega en el entorno Node.js del backend.
- **Solución aplicada:** Modificado `api/media/route.ts` para que lance un Redirect 302 hacia `/uploads/...` delegando la descarga a Firebase Hosting.
- **Resultado:** 🟡 PENDIENTE DE VALIDACIÓN.

---

### 8.2. 🟡 PENDIENTE DE VALIDACIÓN - Desplegable Superadministrador truncado en Móvil
- **Fallo:** Al navegar en un teléfono móvil, el menú de Superadministrador en el panel lateral (Sidebar) no muestra todas sus opciones y se corta. Los otros dashboards laterales tampoco dejan hacer scroll.

#### [29/04/2026 - 15:45]
- **Falso análisis:** Creímos que faltaba espacio físico abajo.
- **Solución aplicada:** Se añadió `padding-bottom` en CSS.
- **Resultado:** 🔴 FRACASO.

#### [29/04/2026 - 16:10]
- **Análisis real:** El CSS del Sidebar usaba `height: 100vh`, el cual en iOS/Android ignora la barra de direcciones y dibuja por fuera de los límites físicos de la pantalla.
- **Solución aplicada:** Cambiado el CSS móvil a `height: 100dvh` (Dynamic Viewport Height) e inyectado `overflow-y: auto` y `-webkit-overflow-scrolling: touch`.
- **Resultado:** 🟡 PENDIENTE DE VALIDACIÓN.

---

### 8.3. 🟡 PENDIENTE DE VALIDACIÓN - Bug Destructivo en PDFs IA y Error "Column count doesn't match"
- **Fallo 1 (Textos borrados):** Al generar la portada del PDF, se borraban el título y los apuntes de la base de datos, dejando la ficha vacía.
- **Causa 1:** La petición PUT del frontend (`EspecieForm.tsx`) solo enviaba la foto generada y el servidor sobrescribía "ciegamente" los campos no recibidos con strings vacíos.
- **Fallo 2 (Error SQL):** Al intentar "Añadir" un documento desde el buscador IA, saltaba el error `Column count doesn't match value count`.
- **Causa 2:** La IA generaba listas (Arrays) de apuntes en lugar de bloques de texto. Al inyectar el Array en `mysql2`, el driver lo expandía creando múltiples parámetros e invalidando la estructura de la tabla.
- **Solución Aplicada:** Se reescribió `route.ts` del PUT para hacer "actualizaciones parciales dinámicas". En `pdfs/link/route.ts`, se forzó la conversión de Arrays a Strings (`.join('\n')`) antes de enviar la petición SQL.
