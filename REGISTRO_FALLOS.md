# 🐛 Registro de Fallos y Correcciones de Verdantia

Este documento sirve como "memoria persistente" para evitar que los fallos reaparezcan o se ignoren durante el desarrollo a causa de los recortes de contexto de la IA.

## Estado de los Errores

- 🔴 **Pendiente:** El error está documentado pero no se ha aplicado el código.
- 🟡 **En Proceso:** Se está escribiendo el código o está pendiente de validación.
- 🟢 **Resuelto:** El código se ha aplicado y validado.

## 8. Registro Persistente de Fallos y Correcciones

### 8.1. Fallos Activos / Pendientes de Resolución

#### 🔴 8.1.1. Imágenes no cargan en Producción (Cloud)
- **Fallo:** Las fotografías e imágenes (portadas de PDFs, avatares, fotos de especies) que sí se ven en el entorno local (localhost), devuelven un error o aparecen rotas en la web subida a Google Cloud / Firebase Hosting.

#### [29/04/2026 - 15:45]
- **Falso análisis:** Creímos que Next.js bloqueaba orígenes.
- **Solución aplicada:** Se editó `next.config.ts`.
- **Resultado:** 🔴 FRACASO.

#### [29/04/2026 - 16:10]
- **Análisis real:** El endpoint `/api/media` falla en Cloud al hacer `readFile` de fotos antiguas porque la carpeta `public` no se despliega en el entorno Node.js del backend.
- **Solución aplicada:** Modificado `api/media/route.ts` para que lance un Redirect 302 hacia `/uploads/...` delegando la descarga a Firebase Hosting.
- **Resultado:** 🔴 FRACASO CONFIRMADO EN PRODUCCIÓN (validado 30/04/2026).

#### [01/05/2026 - 11:00] — ANÁLISIS SERIO Y DEFINITIVO
- **Diagnóstico Arquitectónico:** Actualmente se sirven las imágenes locales y de Firebase a través de un endpoint intermediario `/api/media`. En el entorno local, funciona correctamente leyendo de la caché o del bucket de desarrollo. Sin embargo, en **Producción (Firebase Cloud Functions)**, ocurren dos problemas graves:
  1. **Los archivos subidos localmente no están en el bucket:** Cuando se desarrollan especies o blogs en localhost, la API guarda los archivos de forma estática o en un bucket distinto que Firebase Production no reconoce. Al hacer el despliegue, el servidor devuelve un `false` al comprobar la existencia del archivo.
  2. **Anti-patrón de memoria:** Cuando la imagen existe en el bucket, el endpoint la descarga íntegramente a la memoria RAM de la Cloud Function (`new Uint8Array(contents)`) para servirla. Esto en producción excede los límites de tamaño (10MB) o tiempo de ejecución, provocando que no cargue.
- **Propuesta de solución (El Plan Definitivo):** Reemplazar el uso de `/api/media` por **URLs Públicas y Directas de Firebase Storage**. Al configurar el bucket `verdantia-494121.firebasestorage.app` con acceso de lectura público, las imágenes y PDFs cargarán instantáneamente como cualquier CDN sin saturar las funciones SSR de Next.js. Las rutas antiguas deben migrarse a esta CDN.
- **Estado:** 🔴 PENDIENTE DE APLICAR. Se debe desarrollar un script para migrar y reestructurar `getMediaUrl`.

### 8.2. Fallos Resueltos (Historial)

#### 🟢 8.2.1. Desplegable Superadministrador truncado en Móvil
- **Fallo:** Al navegar en un teléfono móvil, el menú de Superadministrador en el panel lateral (Sidebar) no muestra todas sus opciones y se corta. Los otros dashboards laterales tampoco dejan hacer scroll.

#### [29/04/2026 - 15:45]
- **Falso análisis:** Creímos que faltaba espacio físico abajo.
- **Solución aplicada:** Se añadió `padding-bottom` en CSS.
- **Resultado:** 🔴 FRACASO.

#### [29/04/2026 - 16:10]
- **Análisis real:** El CSS del Sidebar usaba `height: 100vh`, el cual en iOS/Android ignora la barra de direcciones y dibuja por fuera de los límites físicos de la pantalla.
- **Solución aplicada:** Cambiado el CSS móvil a `height: 100dvh` (Dynamic Viewport Height) e inyectado `overflow-y: auto` y `-webkit-overflow-scrolling: touch`.
- **Resultado:** 🔴 FRACASO CONFIRMADO EN PRODUCCIÓN (validado 30/04/2026).

#### [30/04/2026 - 15:44] — DIAGNÓSTICO Y NUEVA PROPUESTA
- **Diagnóstico del fracaso anterior:** El usuario ha identificado que el problema NO es de los desplegables individuales, sino del **contenedor lateral izquierdo completo (`.sidebar`)** que no permite scroll.
- **Propuesta de solución:** Reestructurar el sidebar para que la zona de navegación sea un contenedor independiente con `overflow-y: auto`.
- **Resultado:** 🟢 RESUELTO.

#### 🟢 8.2.2. Scroll Lateral y Pestañas
- **Fallo:** El sistema presentaba layout roto a 4 columnas causando scroll lateral en móviles, y las pestañas fallaban.
- **Estado actual:** 🟢 RESUELTO. Se implementó grid responsivo y persistencia de estado para pestañas.

#### 🟢 8.2.3. Bug Destructivo en PDFs IA y Error SQL
- **Fallo:** Al generar la portada del PDF, se borraban el título y apuntes. Además, al intentar "Añadir" un documento desde el buscador, saltaba un error SQL por discrepancia de columnas.

#### [29/04/2026 - 16:02]
- **Análisis real:** El PUT sobrescribía ciegamente campos con strings vacíos. Por otro lado, la IA generaba Arrays en lugar de strings, lo que rompía el driver de MySQL al intentar guardarlo.
- **Solución aplicada:** Se reescribió `route.ts` para hacer actualizaciones parciales dinámicas. Además, se forzó la conversión de Arrays a Strings (`.join('\n')`) antes de tocar la base de datos.
- **Resultado:** 🟢 RESUELTO.

---

#### 🟢 8.2.4. El Asistente de Búsqueda Falla
- **Fallo:** El asistente de búsqueda IA se queda colgado infinitamente o devuelve resultados vacíos, sin mostrar ningún error claro al usuario en la interfaz. *(Nota: Este fallo se produjo como efecto secundario al aplicar la corrección del Punto 8.2.3).*

#### [29/04/2026 - 16:22]
- **Falso análisis:** Creímos que la API del modelo de lenguaje estaba caída o que había un problema de red.
- **Solución aplicada:** Se aumentó el timeout de las peticiones a la API.
- **Resultado:** 🔴 FRACASO.

#### [29/04/2026 - 16:25]
- **Análisis real:** El componente frontend de búsqueda no está gestionando correctamente los estados de error ni el parseo cuando la IA devuelve un JSON truncado por el límite de tokens, o cuando el formato de la respuesta es inesperado debido a demasiado contexto enviado en el prompt.
- **Solución propuesta:** Modificar el prompt para forzar una salida JSON estricta y más concisa. Además, implementar un bloque `try/catch` en el cliente para interceptar errores de parseo e inyectar un estado de error visible y manejable en la UI en lugar de fallar silenciosamente.
- **Resultado:** 🟡 ÉXITO PARCIAL. El buscador IA no se cuelga y permite añadir PDFs, pero los textos de resumen son demasiado escasos y la generación de portada con Imagen 4.0 falla por falta de contexto.

#### [29/04/2026 - 16:35]
- **Análisis real:** Al forzar en el prompt de la IA una respuesta de "máximo 50 palabras", la descripción resultaba tan corta que el generador de imágenes posterior (Imagen 4.0) fallaba silenciosamente por falta de descripción semántica para componer la portada.
- **Solución aplicada:** Se ha modificado de nuevo el prompt de `pdf-search/route.ts` para pedir resúmenes técnicos de al menos 4 líneas y apuntes con viñetas reales, proporcionando más "carne" para la generación de la foto.
- **Resultado:** 🟡 ÉXITO PARCIAL. El resumen ya genera más texto y se guarda, pero la foto sigue sin aparecer por un fallo silencioso de Imagen 4.0.

#### [29/04/2026 - 16:38]
- **Análisis real:** Al enviar la petición a Imagen 4.0, se enviaba `tipoEntidad: 'especie'`. Esto forzaba a la IA a rechazar cualquier texto y exigir una foto hiperrealista botánica, lo que entraba en conflicto directo con el concepto de "Portada de documento" y causaba el fallo silencioso.
- **Solución aplicada:** Se creó una directiva en `api/ai/generate-image/route.ts` para `tipoEntidad: 'documento'` y se actualizó `EspecieForm.tsx` para enviarla, pidiendo una "Ilustración digital de estilo editorial y académico".
- **Resultado:** 🟡 PENDIENTE DE VALIDACIÓN.

#### [30/04/2026 - 15:52] — CAUSA RAÍZ ENCONTRADA
- **Análisis real:** La imagen SÍ se generaba correctamente con Imagen 4.0 y SÍ se subía a Firebase Storage. El PUT devolvía 200. **PERO** la ruta donde se guardaba (`uploads/especies_pdfs_covers/...`) no estaba en la lista blanca (`ALLOWED_PREFIXES`) de `api/media/route.ts`. Por eso, cada petición GET a la portada devolvía **400 Bad Request** silenciosamente.
- **Solución aplicada:** Se añadió `'uploads/especies_pdfs_covers/'` a `ALLOWED_PREFIXES` en `api/media/route.ts`.
- **Resultado:** 🟢 RESUELTO.
