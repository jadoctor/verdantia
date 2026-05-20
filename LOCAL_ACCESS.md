# Acceso Local a Verdantia

## Requisitos previos
- **Node.js** (v18 o superior) y **npm** instalados.
- **Git** para mantener el repositorio actualizado.
- Opcional: **ngrok** o **localtunnel** si deseas exponer el localhost a dispositivos móviles.

## Pasos rápidos
1. **Abrir una terminal** y navegar al directorio del proyecto:
   ```bat
   cd "C:\Users\jaill\Documents\SEMILLAS_15_04_2026\verdantia-nextjs"
   ```
2. **Instalar dependencias** (solo la primera vez o tras actualizar `package.json`):
   ```bat
   npm install
   ```
3. **Ejecutar el servidor de desarrollo** usando el script creado:
   ```bat
   .\start-dev.bat
   ```
   - El script instala dependencias si faltan y lanza `npm run dev`.
   - La aplicación estará disponible en `http://localhost:3000` (o en el puerto que `next dev` indique).

## Acceso desde dispositivos móviles (opcional)
- Instala **ngrok** (`npm i -g ngrok`) o **localtunnel** (`npm i -g localtunnel`).
- En una nueva terminal, ejecuta por ejemplo:
  ```bash
  ngrok http 3000
  ```
  o
  ```bash
  lt --port 3000
  ```
- Copia la URL pública que se muestra y accede desde el móvil.

## Notas de desarrollo
- Los cambios en los archivos **tsx/ts** se recargan automáticamente.
- Para depurar APIs, abre `http://localhost:3000/api/...`.
- Si deseas detener el servidor, presiona `Ctrl + C` en la terminal.

---
*Este documento forma parte del flujo de trabajo local descrito en la Guía de Desarrollo (`dev-workflow/workflow.md`).*
