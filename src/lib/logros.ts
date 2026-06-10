import pool from '@/lib/db';

const COMUNIDAD_CODIGO = 'grupo:comunidad:general';

async function getOrCreateBotUser(): Promise<number> {
  const [rows]: any = await pool.query('SELECT idusuarios FROM usuarios WHERE usuariosemail = ? LIMIT 1', ['bot@verdantia.app']);
  if (rows.length > 0) return rows[0].idusuarios;

  const [res]: any = await pool.query(
    `INSERT INTO usuarios (usuariosnombre, usuariosapellidos, usuariosemail, usuariosroles, usuariosicono, usuariosestadocuenta) 
     VALUES ('Verdantia Bot', '', 'bot@verdantia.app', '[\"user\"]', '🤖', 'activo')`
  );
  return res.insertId;
}

export interface TriggerContext {
  type: 'cultivo' | 'semilla' | 'chat';
  data?: any;
}

export async function checkAndUpgradeRank(userId: number, triggerContext?: TriggerContext) {
  try {
    // 1. Get User Profile and Current Logro
    const [userRows]: any = await pool.query(
      `SELECT u.usuariosnombre as nombre, l.logrosnivel as actual_nivel, l.logrosnombre as actual_nombre
       FROM usuarios u
       LEFT JOIN usuarioslogros ul ON u.idusuarios = ul.xusuarioslogrosidusuarios AND ul.usuarioslogrosfechafin IS NULL
       LEFT JOIN logros l ON ul.xusuarioslogrosidlogros = l.idlogros
       WHERE u.idusuarios = ? LIMIT 1`,
      [userId]
    );

    if (!userRows || userRows.length === 0) return;
    const user = userRows[0];
    const actualNivel = user.actual_nivel || 0;

    // 2. Get All Ranks
    const [logros]: any = await pool.query('SELECT * FROM logros ORDER BY logrosnivel ASC');
    
    // Find Next Rank
    const nextRank = logros.find((l: any) => l.logrosnivel > actualNivel);
    if (!nextRank) return; // Ya tiene el rango máximo

    // 3. Evaluate Requirements
    let hasAllRequirements = true;

    if (nextRank.req_semillas > 0) {
      const [semillas]: any = await pool.query(
        'SELECT COUNT(*) as count FROM semillas WHERE xsemillasidusuarios = ?', 
        [userId]
      );
      if (semillas[0].count < nextRank.req_semillas) hasAllRequirements = false;
    }

    if (hasAllRequirements && nextRank.req_siembras > 0) {
      const [cultivos]: any = await pool.query(
        `SELECT COUNT(*) as count FROM cultivos c 
         WHERE c.xcultivosidusuarios = ? 
           AND c.cultivosestado = 'finalizado' 
           AND c.cultivosfecharecoleccion IS NOT NULL
           AND EXISTS (
             SELECT 1 FROM datosadjuntos d 
             WHERE d.xdatosadjuntosidcultivos = c.idcultivos 
               AND d.datosadjuntostipo = 'imagen' 
               AND d.datosadjuntosactivo = 1
           )`,
        [userId]
      );
      if (cultivos[0].count < nextRank.req_siembras) hasAllRequirements = false;
    }

    if (hasAllRequirements && nextRank.req_mensajes > 0) {
      const [chatRows]: any = await pool.query(
        'SELECT idchatconversaciones FROM chatconversaciones WHERE chatconversacionesclaveunica = ? LIMIT 1',
        [COMUNIDAD_CODIGO]
      );
      if (chatRows.length > 0) {
        const idchat = chatRows[0].idchatconversaciones;
        const [mensajes]: any = await pool.query(
          'SELECT COUNT(*) as count FROM chatmensajes WHERE xchatmensajesidchatconversaciones = ? AND xchatmensajesidusuarios = ?',
          [idchat, userId]
        );
        if (mensajes[0].count < nextRank.req_mensajes) hasAllRequirements = false;
      } else {
        hasAllRequirements = false;
      }
    }

    // 4. Upgrade!
    if (hasAllRequirements) {
      // Close previous rank
      await pool.query(
        'UPDATE usuarioslogros SET usuarioslogrosfechafin = NOW() WHERE xusuarioslogrosidusuarios = ? AND usuarioslogrosfechafin IS NULL',
        [userId]
      );

      // Insert new rank
      await pool.query(
        'INSERT INTO usuarioslogros (xusuarioslogrosidusuarios, xusuarioslogrosidlogros, usuarioslogrosfechainicio) VALUES (?, ?, NOW())',
        [userId, nextRank.idlogros]
      );

      // 5. Post Announcement Message in Chat
      const [chatIdRows]: any = await pool.query(
        'SELECT idchatconversaciones FROM chatconversaciones WHERE chatconversacionesclaveunica = ? LIMIT 1',
        [COMUNIDAD_CODIGO]
      );
      
      if (chatIdRows.length > 0) {
        const idchat = chatIdRows[0].idchatconversaciones;
        const botId = await getOrCreateBotUser(); // Obtenemos el Verdantia Bot
        
        let contextualText = 'tras completar sus méritos agrícolas.';
        
        if (triggerContext?.type === 'cultivo' && triggerContext.data) {
          const cData = triggerContext.data;
          const name = cData.variedad || cData.especie || 'su cosecha';
          contextualText = `tras finalizar con éxito su cultivo de **${name}**.`;
        } else if (triggerContext?.type === 'semilla' && triggerContext.data) {
          const sData = triggerContext.data;
          const name = sData.variedad || sData.especie || 'sus semillas';
          const compartir = sData.compartir === 1 
            ? 'y las ha puesto a disposición de la comunidad para intercambiar' 
            : 'y las ha guardado en su inventario privado';
          contextualText = `tras registrar **${name}** ${compartir}.`;
        }

        const msgText = `🎉 **¡Felicidades!**\\n\\n**${user.nombre || 'Un usuario'}** acaba de alcanzar el rango de **${nextRank.logrosicono || '🏆'} ${nextRank.logrosnombre}** ${contextualText}\\n\\n¡A seguir cultivando la comunidad Verdantia! 🌱`;

        await pool.query(
          'INSERT INTO chatmensajes (xchatmensajesidchatconversaciones, xchatmensajesidusuarios, chatmensajestexto, chatmensajesfechacreacion) VALUES (?, ?, ?, NOW())',
          [idchat, botId, msgText]
        );
      }
    }

  } catch (error) {
    console.error('[checkAndUpgradeRank] Error:', error);
  }
}
