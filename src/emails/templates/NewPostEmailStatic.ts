export const NewPostEmail_Free_HTML = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="es">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  </head>
  <body style="background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Oxygen-Sans,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,sans-serif;padding:40px 0">
    <div style="margin:0 auto;padding:24px 32px 48px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);max-width:600px">
      <div style="text-align:center;margin-bottom:16px">
        <img alt="Verdantia" src="https://verdantia.life/logo-verdantia.jpg" style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto;border-radius:50%" width="80" height="80" />
      </div>
      <h1 style="color:#0f766e;font-size:24px;font-weight:bold;padding:0;margin:0 0 24px;text-align:center">🌱 Nuevo en Verdantia</h1>
      <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px">Hola, <strong>{{nombre}}</strong>:</p>
      <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px">Acabamos de publicar un nuevo artículo que creemos que te encantará:</p>
      <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:24px 0">
        {{#if blogImagenUrl}}
        <img alt="Blog cover" src="{{blogImagenUrl}}" style="display:block;outline:none;border:none;text-decoration:none;width:100%;max-height:300px;object-fit:cover" width="100%" />
        {{/if}}
        <div style="padding:24px;background-color:#ffffff">
          <h2 style="color:#1e293b;font-size:20px;font-weight:bold;margin:0 0 12px">{{blogTitulo}}</h2>
          <p style="color:#475569;font-size:15px;line-height:22px;margin:0 0 24px">{{blogResumen}}</p>
          <div style="text-align:center">
            <a href="{{blogUrl}}" style="background-color:#10b981;border-radius:8px;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;text-align:center;display:inline-block;padding:14px 28px" target="_blank">Leer Artículo Completo</a>
          </div>
        </div>
      </div>
      <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e2e8f0;margin:32px 0 24px" />
      <p style="color:#94a3b8;font-size:13px;line-height:20px;text-align:center">
        Como usuario del <strong>Plan Gratuito</strong>, recibir el Boletín Agrícola es necesario para mantener tu cuenta activa.
        <br /><br />
        <a href="{{unsubscribeUrl}}" style="color:#ef4444;text-decoration:underline;font-weight:bold;font-size:14px" target="_blank">Deseo dejar de recibir correos (Pausar mi cuenta en 1 clic)</a>
        <br /><br />
        <span style="font-size:12px;color:#94a3b8">Si cambias de opinión o quieres controlar qué correos recibes manteniendo el acceso a tu huerto, <a href="{{loginUrl}}" style="color:#10b981;text-decoration:underline" target="_blank">mejora a un Plan Premium aquí</a>.</span>
      </p>
    </div>
  </body>
</html>
`;

export const NewPostEmail_Premium_HTML = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="es">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  </head>
  <body style="background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,&quot;Segoe UI&quot;,Roboto,Oxygen-Sans,Ubuntu,Cantarell,&quot;Helvetica Neue&quot;,sans-serif;padding:40px 0">
    <div style="margin:0 auto;padding:24px 32px 48px;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 6px -1px rgba(0, 0, 0, 0.1);max-width:600px">
      <div style="text-align:center;margin-bottom:16px">
        <img alt="Verdantia" src="https://verdantia.life/logo-verdantia.jpg" style="display:block;outline:none;border:none;text-decoration:none;margin:0 auto;border-radius:50%" width="80" height="80" />
      </div>
      <h1 style="color:#0f766e;font-size:24px;font-weight:bold;padding:0;margin:0 0 24px;text-align:center">🌱 Nuevo en Verdantia</h1>
      <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px">Hola, <strong>{{nombre}}</strong>:</p>
      <p style="color:#334155;font-size:16px;line-height:24px;margin:0 0 16px">Acabamos de publicar un nuevo artículo que creemos que te encantará:</p>
      <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:24px 0">
        {{#if blogImagenUrl}}
        <img alt="Blog cover" src="{{blogImagenUrl}}" style="display:block;outline:none;border:none;text-decoration:none;width:100%;max-height:300px;object-fit:cover" width="100%" />
        {{/if}}
        <div style="padding:24px;background-color:#ffffff">
          <h2 style="color:#1e293b;font-size:20px;font-weight:bold;margin:0 0 12px">{{blogTitulo}}</h2>
          <p style="color:#475569;font-size:15px;line-height:22px;margin:0 0 24px">{{blogResumen}}</p>
          <div style="text-align:center">
            <a href="{{blogUrl}}" style="background-color:#10b981;border-radius:8px;color:#fff;font-size:16px;font-weight:bold;text-decoration:none;text-align:center;display:inline-block;padding:14px 28px" target="_blank">Leer Artículo Completo</a>
          </div>
        </div>
      </div>
      <hr style="width:100%;border:none;border-top:1px solid #eaeaea;border-color:#e2e8f0;margin:32px 0 24px" />
      <p style="color:#94a3b8;font-size:13px;line-height:20px;text-align:center">
        Recibes este correo porque estás suscrito al Boletín Agrícola de Verdantia.
        <br /><br />
        <a href="{{unsubscribeUrl}}" style="color:#ef4444;text-decoration:underline;font-weight:bold;font-size:14px" target="_blank">👉 Darme de baja de este boletín en 1 clic</a>
        <br /><br />
        <span style="font-size:12px;color:#94a3b8">Para cambiar otras opciones o preferencias, <a href="{{profileUrl}}" style="color:#10b981;text-decoration:underline" target="_blank">inicia sesión en tu perfil</a>.</span>
      </p>
    </div>
  </body>
</html>
`;
