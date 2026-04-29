<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# LA BIBLIA - Verdantia (Normas Inquebrantables)

## Reglas de Oro
- **NUNCA** poner el proyecto en OneDrive, Google Drive, Dropbox, etc.
- **SIEMPRE** usar Git + GitHub para sincronizar entre dispositivos.

## Flujo de Trabajo y Despliegue Obligatorio
Una vez que el usuario te dé una instrucción para desplegar o indique "adelante" tras un cambio, **DEBES ejecutar el flujo completo de forma autónoma sin detenerte a pedir confirmación**, en este orden estricto:

1. **Test de Fuego Local:** `npm run build`
   (Debe compilar sin errores antes de subir nada a la nube).
2. **Commit y Push:**
   `git add .`
   `git commit -m "descripción del cambio"`
   `git push`
3. **Despliegue a Producción:** `firebase deploy`

Mientras estos comandos se ejecutan, mantén al usuario informado de que están corriendo en segundo plano. **Nunca te detengas para preguntar si quieres subir a producción si ya has recibido luz verde.**
