<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LA BIBLIA - Verdantia (Normas Inquebrantables)

## Reglas de Oro
- **NUNCA** poner el proyecto en OneDrive, Google Drive, Dropbox, etc.
- **SIEMPRE** usar Git + GitHub para sincronizar entre dispositivos.

## Flujo de Trabajo y Despliegue Obligatorio

### MANDATO ESTRICTO
El asistente tiene **TOTALMENTE PROHIBIDO** lanzar comandos de despliegue (Build, Commit, Deploy) de forma autónoma, **A MENOS** que el usuario pronuncie exactamente las palabras mágicas: **"SUBE A PRODUCCION"**. Si el usuario no dice esta frase literal, el asistente no subirá nada bajo ninguna circunstancia. Cualquier otra variante ("súbelo", "haz deploy", "adelante") **NO es suficiente**.

### Protocolo de Despliegue (Orden Estricto)
Antes de ejecutar los comandos, el asistente debe documentar **obligatoriamente** la subida creando un nuevo bloque en el apartado **6.2. Despliegues** de la Guía de Usuario (`src/app/dashboard/admin/guia-usuario/page.tsx`). Cada entrada debe tener:
- **Encabezado:** Fecha, hora y título descriptivo.
- **A. Problemas detectados:** Causa raíz del fallo original.
- **B. Modificaciones realizadas:** Lista técnica de archivos tocados y lógicas refactorizadas.
- **C. Problemas resueltos:** Confirmación del estado final.

Una vez documentado y con las palabras mágicas recibidas, ejecutar en este orden estricto:

1. **Fase 0 - Estampado de Versión:** Modificar `src/app/page.tsx` con fecha y hora exacta del despliegue.
2. **Fase 1 - Test de Fuego Local:** `npm run build` (Debe compilar sin errores).
3. **Fase 2 - Control de Versiones:**
   `git add .`
   `git commit -m "descripción del cambio"`
   `git push`
4. **Fase 3 - Despliegue Final:** `firebase deploy`

### Referencia Técnica Obligatoria
El asistente **DEBE leer** la sección 6 completa de la Guía de Usuario (`src/app/dashboard/admin/guia-usuario/page.tsx`) antes de cualquier despliegue, para verificar que cumple con todos los estándares documentados.
