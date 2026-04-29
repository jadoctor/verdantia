# 🐛 Registro de Fallos y Correcciones de Verdantia

Este documento sirve como "memoria persistente" para evitar que los fallos reaparezcan o se ignoren durante el desarrollo a causa de los recortes de contexto de la IA.

## Estado de los Errores

- 🔴 **Pendiente:** El error está documentado pero no se ha aplicado el código.
- 🟡 **En Proceso:** Se está escribiendo el código o está pendiente de validación.
- 🟢 **Resuelto:** El código se ha aplicado y validado.

---

### [29/04/2026 - 15:45] 🟡 PENDIENTE DE VALIDACIÓN - Imágenes no cargan en Producción (Cloud)
- **Descripción:** Las fotografías e imágenes (portadas de PDFs, avatares, fotos de especies) que sí se ven en el entorno local (localhost), devuelven un error o aparecen rotas en la web subida a Google Cloud / Firebase Hosting.
- **Causa Analizada:** El motor estricto de Next.js (`next.config.ts`) bloquea las imágenes de orígenes externos por seguridad. Los dominios `firebasestorage.app` y `storage.googleapis.com` no están en la lista blanca (`remotePatterns`).
- **Solución Aplicada (Falta Comprobar):** Añadidos `firebasestorage.googleapis.com` y `storage.googleapis.com` en `images.remotePatterns` del archivo `next.config.ts`.

### [29/04/2026 - 15:45] 🟡 PENDIENTE DE VALIDACIÓN - Desplegable Superadministrador truncado en Móvil
- **Descripción:** Al navegar en un teléfono móvil, el menú de Superadministrador en el panel lateral (Sidebar) no muestra todas sus opciones y se corta. Solo se ven 3 entradas y no se puede hacer scroll hacia abajo.
- **Causa Analizada:** CSS Incompatible y superposición del navegador. Al usar la barra de navegación del móvil, corta el final del sidebar `100vh`.
- **Solución Aplicada (Falta Comprobar):** Añadido un `padding-bottom: 100px` extra al `.sidebar` en su versión móvil dentro de `dashboard.css` para permitir el scroll completo de las opciones del acordeón.
