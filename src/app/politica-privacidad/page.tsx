'use client';

import React from 'react';
import Link from 'next/link';
import './politica.css';

export default function PoliticaPrivacidadPage() {
  return (
    <div className="politica-page">
      {/* Navigation */}
      <nav className="top-nav">
        <div className="top-nav-inner">
          <Link href="/" className="top-nav-brand">
            <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>🌱</span> Verdantia
          </Link>
          <Link href="/dashboard/perfil" className="top-nav-link">
            Volver
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <h1>Política de Privacidad</h1>
        <p className="subtitle">Transparencia total sobre cómo tratamos tus datos, tus derechos como usuario y nuestro compromiso con tu privacidad.</p>
        <span className="update-date">Última actualización: {new Date().toLocaleDateString('es-ES')}</span>
      </div>

      {/* Content */}
      <div className="content">
        {/* Table of Contents */}
        <div className="toc">
          <h3>Índice</h3>
          <ol>
            <li><a href="#responsable">Responsable del Tratamiento</a></li>
            <li><a href="#datos-recogidos">Datos que Recogemos</a></li>
            <li><a href="#finalidad">Finalidad del Tratamiento</a></li>
            <li><a href="#suscripciones">Modelos de Suscripción</a></li>
            <li><a href="#pagos">Datos de Pago</a></li>
            <li><a href="#derechos">Tus Derechos (ARCO+)</a></li>
            <li><a href="#borrado">Borrado y Cancelación de Cuenta</a></li>
            <li><a href="#anonimizacion">Anonimización de Contenidos</a></li>
            <li><a href="#periodo-prueba">Periodo de Prueba</a></li>
            <li><a href="#intercambio">Intercambio de Semillas</a></li>
            <li><a href="#gamificacion">Sistemas de Gamificación y Rangos</a></li>
            <li><a href="#normas-comunidad">Normas de la Comunidad y Denuncias</a></li>
            <li><a href="#cookies">Cookies y Almacenamiento</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ol>
        </div>

        {/* 1. Responsable */}
        <div className="legal-section" id="responsable">
          <div className="card-storm" style={{ padding: '25px', marginBottom: '30px', borderLeft: '5px solid var(--storm-primary)', backgroundColor: 'var(--bg-card)' }}>
            <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>1. Responsable del Tratamiento</h3>
            <p>El responsable del tratamiento de sus datos personales en esta plataforma (en adelante, "Verdantia") es:</p>
            <ul style={{ listStyle: 'none', paddingLeft: '10px', lineHeight: 1.8 }}>
              <li><strong>Titular:</strong> Juan Alberto Illueca Sanchos</li>
              <li><strong>NIF/DNI:</strong> 22559367R</li>
              <li><strong>Domicilio Fiscal:</strong> Calle Alicante número 5. Bajo. 07720. Benissa (Alicante).</li>
              <li><strong>Email de contacto:</strong> <a href="mailto:superadministrador@verdantia.life" style={{ color: 'var(--accent-blue)' }}>superadministrador@verdantia.life</a></li>
              <li><strong>Teléfono:</strong> 654529381</li>
            </ul>
            <p style={{ marginTop: '15px', fontSize: '0.9rem' }}>
              <strong>Alojamiento Web y Datos (Hosting):</strong> La infraestructura principal de Verdantia (base de datos y autenticación de usuarios) se encuentra alojada en los servidores de <strong>Google Cloud Platform</strong> y <strong>Firebase</strong>. Todos los datos se almacenan físicamente en centros de datos ubicados dentro del territorio de la Unión Europea (región europe-west), garantizando así el pleno cumplimiento de los estrictos estándares europeos de protección de datos (RGPD).
            </p>
          </div>
          <p>Este responsable se compromete a cumplir con el <strong>Reglamento General de Protección de Datos (RGPD) — Reglamento (UE) 2016/679</strong> y la <strong>Ley Orgánica 3/2018 de Protección de Datos Personales y Garantía de los Derechos Digitales (LOPDGDD)</strong>.</p>
        </div>

        {/* 2. Datos recogidos */}
        <div className="legal-section" id="datos-recogidos">
          <h2><span className="section-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>💾</span> 2. Datos que Recogemos</h2>
          <p>Recogemos exclusivamente los datos necesarios para el funcionamiento de la plataforma:</p>
          <ul>
            <li><strong>Datos de identificación:</strong> nombre, apellidos, nombre de usuario, fecha de nacimiento, email y contraseña (cifrada).</li>
            <li><strong>Datos de localización aproximada:</strong> país, código postal y población (para funcionalidades climáticas).</li>
            <li><strong>Datos técnicos:</strong> dirección IP de acceso, cookies de sesión.</li>
            <li><strong>Contenido generado:</strong> fotografías de plantas/huertos, registros de cultivo, mensajes en chat, datos de intercambio de semillas.</li>
            <li><strong>Datos de facturación:</strong> método de pago preferido e identificadores de pasarela (Stripe / PayPal). <strong>Nunca almacenamos números de tarjeta bancaria.</strong></li>
          </ul>
          <div className="highlight-box highlight-green">
            <span style={{ fontSize: '1.3rem' }}>🛡️</span>
            <span>Las contraseñas se almacenan cifradas con algoritmo bcrypt. Nunca se guardan en texto plano ni son accesibles por el personal de la plataforma.</span>
          </div>
        </div>

        {/* 3. Finalidad */}
        <div className="legal-section" id="finalidad">
          <h2><span className="section-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}>🎯</span> 3. Finalidad del Tratamiento</h2>
          <p>Tus datos se tratan para:</p>
          <ul>
            <li>Gestionar tu cuenta de usuario y autenticación segura.</li>
            <li>Ofrecerte las funcionalidades de gestión de huerto, seguimiento de cultivos y alertas climáticas.</li>
            <li>Facilitar la comunicación entre usuarios (chat directo y grupos).</li>
            <li>Gestionar los intercambios de semillas entre la comunidad.</li>
            <li>Procesar los pagos de suscripción a través de pasarelas externas seguras.</li>
            <li>Enviarte notificaciones sobre el estado de tu cuenta (vencimientos, alertas de borrado).</li>
          </ul>
        </div>

        {/* 4. Suscripciones */}
        <div className="legal-section" id="suscripciones">
          <h2><span className="section-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>⭐</span> 4. Modelos de Suscripción y Niveles de Acceso</h2>
          
          <h3 style={{ color: 'var(--accent-green)', fontSize: '1rem', margin: '20px 0 10px' }}>🌰 Nivel Visitante / Gratuito (Free)</h3>
          <p>Al registrarte en Verdantia, comienzas como <strong>Visitante</strong>. Este nivel es completamente gratuito, sin límite de tiempo y sin compromiso. Incluye:</p>
          <ul>
            <li>Hasta <strong>10 plantas activas</strong> en tu huerto virtual.</li>
            <li><strong>1 foto de perfil</strong>.</li>
            <li><strong>1 oferta de intercambio</strong> de semillas activa.</li>
            <li>Acceso al chat público de la comunidad.</li>
          </ul>
          <p>Para el nivel Gratuito solo recogemos los <strong>datos mínimos</strong> de identificación: nombre, email, fecha de nacimiento, ubicación aproximada (país, código postal) y contraseña cifrada. No se requieren datos de pago.</p>

          <h3 style={{ color: 'var(--accent-amber)', fontSize: '1rem', margin: '20px 0 10px' }}>🌳 Política de Degradación Progresiva Universal</h3>
          <p>En Verdantia no existen las bajadas abruptas al plan Gratuito. Aplicamos una <strong>degradación progresiva universal</strong> para todos los usuarios:</p>
          <ul>
            <li><strong>Periodo de Prueba (3 meses):</strong> Al verificar tu correo, recibes 1 mes de Premium. Al finalizar, pasas a Avanzado (1 mes), luego a Esencial (1 mes), y finalmente al Gratuito.</li>
            <li><strong>Suscripciones de Pago:</strong> Si cancelas o no renuevas un plan de pago (ej. Premium), tu cuenta no caerá a Gratuito inmediatamente. Descenderás un nivel cada 30 días (Avanzado → Esencial → Gratuito).</li>
          </ul>
          <p>En cualquier momento del proceso puedes contratar un plan de pago para mantener o subir de nivel.</p>

          <p style={{ marginTop: '20px' }}>La plataforma ofrece cuatro niveles de acceso:</p>

          <div style={{ overflowX: 'auto' }}>
            <table className="plan-table">
              <thead>
                <tr>
                  <th>Funcionalidad</th>
                  <th><span className="plan-free">🌰 Gratuito</span><br /><small>Gratis</small></th>
                  <th><span style={{ color: '#059669' }}>🌱 Esencial</span><br /><small>4,99 €/mes</small></th>
                  <th><span className="plan-normal">🌿 Avanzado</span><br /><small>9,99 €/mes</small></th>
                  <th><span className="plan-premium">🌳 Premium</span><br /><small>14,99 €/mes</small></th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Plantas activas</td><td>10</td><td>25</td><td>50</td><td className="check">Ilimitadas</td></tr>
                <tr><td>Fotos de perfil máximas</td><td>1</td><td>2</td><td>3</td><td className="check">5</td></tr>
                <tr><td>Ofertas intercambio</td><td>1</td><td>3</td><td>10</td><td className="check">Ilimitadas</td></tr>
                <tr><td>Calendario Agrícola</td><td>Normal</td><td className="check">Lunar</td><td className="check">Biodinámico</td><td className="check">Biodinámico</td></tr>
                <tr><td>Generador IA imágenes</td><td className="cross">✗</td><td className="cross">✗</td><td>5/mes</td><td className="check">Ilimitado</td></tr>
                <tr><td>Sin publicidad</td><td className="cross">✗</td><td className="check">✓</td><td className="check">✓</td><td className="check">✓</td></tr>
                <tr><td>Soporte prioritario</td><td className="cross">✗</td><td className="cross">✗</td><td className="check">✓</td><td className="check">✓</td></tr>
              </tbody>
            </table>
          </div>
          <div className="highlight-box highlight-blue" style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
            <span><strong>Degradación de plan y límite de fotos:</strong> Si tu plan se degrada (automáticamente al final del trial o al cancelar un plan de pago) y excedes el límite de fotos de tu nuevo plan, <strong>no perderás tus fotos</strong>. Quedarán bloqueadas (no podrás editarlas ni marcarlas como principales) hasta que elimines las sobrantes para ajustarte al nuevo límite.</span>
          </div>
        </div>

        {/* 5. Datos de pago */}
        <div className="legal-section" id="pagos">
          <h2><span className="section-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)' }}>💳</span> 5. Datos de Pago y Seguridad</h2>
          <p>Los pagos se procesan a través de pasarelas externas certificadas:</p>
          <ul>
            <li><strong>Stripe:</strong> gestiona pagos con tarjeta de crédito/débito y Google Pay.</li>
            <li><strong>PayPal:</strong> gestiona pagos desde cuentas PayPal.</li>
          </ul>
          <div className="highlight-box highlight-amber">
            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
            <span><strong>Nunca almacenamos datos de tu tarjeta bancaria</strong> en nuestros servidores. Solamente guardamos un identificador de cliente (<em>customer_id</em>) proporcionado por la pasarela para gestionar renovaciones automáticas. Los datos sensibles de pago los custodia Stripe/PayPal en su bóveda segura.</span>
          </div>
        </div>

        {/* 6. Derechos */}
        <div className="legal-section" id="derechos">
          <h2><span className="section-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>👤</span> 6. Tus Derechos (ARCO+)</h2>
          <p>En virtud del RGPD y la LOPDGDD, tienes derecho a:</p>
          <ul>
            <li><strong>Acceso:</strong> consultar en todo momento tus datos personales desde tu perfil.</li>
            <li><strong>Rectificación:</strong> modificar cualquier dato personal desde la sección «Mi Perfil».</li>
            <li><strong>Cancelación / Supresión:</strong> solicitar la eliminación de tu cuenta.</li>
            <li><strong>Oposición:</strong> oponerte al tratamiento de datos para determinados fines.</li>
            <li><strong>Portabilidad:</strong> descargar tus datos en un formato estándar.</li>
            <li><strong>Limitación:</strong> solicitar la restricción del tratamiento de tus datos.</li>
          </ul>
          <div className="highlight-box highlight-green">
            <span style={{ fontSize: '1.3rem' }}>✅</span>
            <span>Nunca bloquearemos tu acceso a tus propios datos. Siempre podrás ver, editar, descargar o eliminar tu información personal.</span>
          </div>
        </div>

        {/* 7. Borrado */}
        <div className="legal-section" id="borrado">
          <h2><span className="section-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>🗑️</span> 7. Borrado y Cancelación de Cuenta</h2>
          <p>Puedes solicitar la eliminación de tu cuenta en cualquier momento desde la sección «Mi Perfil». El proceso es el siguiente:</p>

          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-label">Día 0 — Solicitud de borrado</div>
              <div className="timeline-text">Tu cuenta pasa inmediatamente a estado <strong>«borrado pendiente»</strong>. Tu perfil, fotos e interacciones se ocultan para el resto de la comunidad. Recibes confirmación por email.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-label">Días 1 a 29 — Periodo de gracia</div>
              <div className="timeline-text">Puedes reactivar tu cuenta en cualquier momento simplemente iniciando sesión. Recuperarás todos tus datos y privilegios inmediatamente. El contador de borrado se reinicia.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-label">Día 20 — Primer aviso</div>
              <div className="timeline-text">Te enviamos un email recordatorio: <em>«En 10 días tu cuenta será eliminada definitivamente»</em>.</div>
            </div>
            <div className="timeline-item danger">
              <div className="timeline-label">Día 30 — Aviso final</div>
              <div className="timeline-text">Te enviamos un último email: <em>«Hoy a medianoche tu cuenta será eliminada»</em>.</div>
            </div>
            <div className="timeline-item danger">
              <div className="timeline-label">Día 30 (medianoche) — Eliminación</div>
              <div className="timeline-text">Se procede a la destrucción irreversible de tus datos personales y a la anonimización de tus contenidos públicos.</div>
            </div>
          </div>

          <div className="highlight-box highlight-red">
            <span style={{ fontSize: '1.3rem' }}>⛔</span>
            <span><strong>Límite anti-abuso:</strong> si solicitas la cancelación y reactivación de tu cuenta 3 veces en un periodo de 30 días, la cuenta pasará a estado de <strong>revisión manual</strong> y necesitarás contactar con el equipo de soporte para reactivarla.</span>
          </div>
        </div>

        {/* 8. Anonimización */}
        <div className="legal-section" id="anonimizacion">
          <h2><span className="section-icon" style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-purple)' }}>🕵️</span> 8. Anonimización de Contenidos</h2>
          <p>Cuando tu cuenta es eliminada definitivamente (tras los 30 días de gracia), diferenciamos claramente entre dos categorías de información:</p>

          <h3 style={{ color: 'var(--accent-red)', fontSize: '0.95rem', margin: '18px 0 8px' }}>❌ Se elimina para siempre:</h3>
          <ul>
            <li>Nombre, apellidos, nombre de usuario y email.</li>
            <li>Contraseña y credenciales de acceso.</li>
            <li>Fecha de nacimiento, dirección IP y datos de localización.</li>
            <li>Identificadores de pasarelas de pago (Stripe / PayPal customer ID).</li>
            <li>Número de teléfono (si existiera).</li>
            <li><strong>Todas tus fotografías de perfil personales.</strong></li>
          </ul>

          <h3 style={{ color: 'var(--accent-green)', fontSize: '0.95rem', margin: '18px 0 8px' }}>👁️‍🗨️ Se anonimiza y se conserva:</h3>
          <ul>
            <li><strong>Fotografías de plantas, huertos y cultivos.</strong></li>
            <li>Registros de cultivo, observaciones y datos agronómicos.</li>
            <li>Mensajes en grupos públicos e intercambios de semillas completados.</li>
          </ul>
          <p>Todo este contenido queda vinculado al seudónimo <strong>«Usuario Anónimo»</strong>, sin ningún vínculo que permita identificar a la persona original. Se rompe por completo la relación entre el contenido y la identidad.</p>

          <div className="highlight-box highlight-blue">
            <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
            <span>Esta práctica protege tu privacidad al 100% mientras preserva el <strong>conocimiento colectivo</strong> de la comunidad. Al registrarte y aceptar esta política, consientes esta cesión anónima de contenidos de carácter público.</span>
          </div>
        </div>

        {/* 9. Degradacion progresiva */}
        <div className="legal-section" id="periodo-prueba">
          <h2><span className="section-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>🎁</span> 9. Política de Degradación Progresiva</h2>
          <p>Ya sea durante tu <strong>periodo de prueba inicial</strong> o tras la <strong>cancelación/no renovación de un plan de pago</strong>, Verdantia disminuye tus privilegios de forma escalonada (un nivel cada 30 días):</p>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-label">Paso 1 — Plan Premium</div>
              <div className="timeline-text">Punto de partida (mes de prueba inicial o suscripción de pago activa).</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-label">Paso 2 — Plan Avanzado (1 mes de gracia)</div>
              <div className="timeline-text">Al caducar el Premium, desciendes a Avanzado. Conservas parte de las ventajas.</div>
            </div>
            <div className="timeline-item">
              <div className="timeline-label">Paso 3 — Plan Esencial (1 mes de gracia)</div>
              <div className="timeline-text">Al caducar el Avanzado, desciendes a Esencial. Última etapa antes de pasar al plan sin coste.</div>
            </div>
            <div className="timeline-item danger">
              <div className="timeline-label">Destino final — Plan Gratuito (permanente)</div>
              <div className="timeline-text">La cuenta se estabiliza en el plan Gratuito, conservando tus plantas y límite de fotos asociado.</div>
            </div>
          </div>
          <div className="highlight-box highlight-amber" style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '1.3rem' }}>⏳</span>
            <span><strong>Importante:</strong> la cuenta atrás de la degradación <strong>no se detiene</strong> si solicitas el borrado de tu cuenta. Si reactivas tu cuenta durante los 30 días de gracia, conservarás solo los días restantes del plan en curso.</span>
          </div>
        </div>

        {/* 10. Intercambio */}
        <div className="legal-section" id="intercambio">
          <h2><span className="section-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)' }}>🔄</span> 10. Intercambio de Semillas</h2>
          <p>La plataforma facilita el contacto entre usuarios para el intercambio de semillas, pero <strong>no actúa como intermediaria</strong> en la transacción física. Esto significa que:</p>
          <ul>
            <li>La plataforma no es responsable de la calidad, estado o autenticidad de las semillas intercambiadas.</li>
            <li>Las condiciones del intercambio (envío, costes, etc.) las acuerdan los usuarios entre sí.</li>
            <li>La plataforma solo proporciona las herramientas de comunicación y publicación de ofertas.</li>
          </ul>
        </div>

        {/* 11. Gamificación */}
        <div className="legal-section" id="gamificacion">
          <h2><span className="section-icon" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>🏆</span> 11. Sistemas de Gamificación y Logros</h2>
          <p>Para fomentar un entorno didáctico y motivador, Verdantia cuenta con un sistema de Logros y Reputación. Al respecto, debes saber que:</p>
          <ul>
            <li><strong>Desbloqueo de Nivel Básico:</strong> Todos los usuarios de nueva creación comienzan con el rango de "Visitante". Para desbloquear las funcionalidades de la plataforma (como registrar siembras) y ascender al rango de "Campesino Aprendiz", es requisito imprescindible proporcionar un Nombre y una Fecha de Nacimiento válidos en el perfil. Si el usuario elimina posteriormente estos datos, el sistema lo degradará automáticamente a "Visitante".</li>
            <li><strong>Perfilado de uso:</strong> Utilizamos métricas básicas de tu actividad en la plataforma (como el número de siembras registradas, semillas guardadas o mensajes enviados en los foros) exclusivamente para gestionar el desbloqueo de insignias superiores y niveles de usuario.</li>
            <li><strong>Visibilidad Pública:</strong> Al participar en espacios comunitarios (como el Chat de la Comunidad), los logros obtenidos (por ejemplo, "Sabio de la Comunidad") y tu rango asociado se mostrarán públicamente junto a tu nombre para informar a otros usuarios sobre tu nivel de experiencia o participación.</li>
          </ul>
          <div className="highlight-box highlight-amber" style={{ marginTop: '16px' }}>
            <span style={{ fontSize: '1.3rem' }}>ℹ️</span>
            <span>Este tratamiento tiene como única finalidad mejorar tu experiencia de usuario (gamificación). Tus estadísticas no se utilizan para crear perfiles publicitarios ni se comparten con terceros.</span>
          </div>
        </div>

        {/* 11b. Alertas Agrícolas */}
        <div className="legal-section" id="alertas-agricolas">
          <h2><span className="section-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)' }}>🌾</span> 11b. Personalización de Alertas Agrícolas</h2>
          <p>Ofrecemos tres tipos de calendarios (Normal, Lunar y Biodinámico) para personalizar tus notificaciones de siembra y cosecha. Debes saber que:</p>
          <ul>
            <li><strong>Uso de la Ubicación:</strong> El sistema cruza tu elección de calendario con tu Zona Climática, Latitud y Longitud (obtenidos de tu código postal) para ofrecer fechas precisas y localizadas.</li>
            <li><strong>Suscripciones Premium:</strong> Las opciones avanzadas (Lunar y Biodinámico) requieren planes de pago. La elección de estos calendarios no supone una toma de decisiones automatizada que produzca efectos jurídicos, es puramente informativa para mejorar tu cultivo.</li>
          </ul>
        </div>

        {/* 12. Normas de Comunidad */}
        <div className="legal-section" id="normas-comunidad">
          <h2><span className="section-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>⚖️</span> 12. Normas de la Comunidad y Denuncias</h2>
          
          <h3 style={{ color: 'var(--accent-red)', fontSize: '1rem', margin: '20px 0 10px' }}>A. Normas del Sistema</h3>
          <p>Para garantizar un entorno seguro, queda terminantemente prohibido:</p>
          <ul>
            <li>El uso de lenguaje ofensivo, insultos, amenazas o acoso hacia otros usuarios.</li>
            <li>El envío de correo basura (Spam), publicidad no solicitada o enlaces maliciosos.</li>
            <li>La suplantación de identidad o la difusión de información privada de terceros.</li>
            <li><strong>La subida, difusión o enlace a material pornográfico, contenido de carácter sexual explícito, o contenido relacionado con menores de edad. Estas infracciones implicarán el bloqueo inmediato y serán puestas en conocimiento de las autoridades.</strong></li>
          </ul>

          <h3 style={{ color: 'var(--accent-blue)', fontSize: '1rem', margin: '25px 0 10px' }}>B. Sistema de Denuncias</h3>
          <p>Las denuncias son confidenciales. Por seguridad, y solo ante una denuncia activa, los administradores tendrán acceso de solo lectura al historial implicado para auditar la infracción.</p>

          <h3 style={{ color: 'var(--accent-amber)', fontSize: '1rem', margin: '25px 0 10px' }}>C. Restricciones Disciplinarias</h3>
          <p>La administración aplicará medidas desde amonestación verbal hasta expulsión definitiva, sin derecho a devolución del dinero pagado. Dispones de 15 días naturales para apelar cualquier decisión.</p>
        </div>

        {/* 13. Restricciones de Edad */}
        <div className="legal-section" id="edad">
          <h2><span className="section-icon" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)' }}>🔞</span> 13. Restricciones de Edad</h2>
          <p>Para garantizar el cumplimiento normativo en materia de protección de datos y contratación electrónica, Verdantia establece las siguientes limitaciones:</p>
          <ul>
            <li><strong>Edad Mínima de Uso (16 años):</strong> Es estrictamente necesario tener al menos 16 años cumplidos para registrarse, completar el perfil y participar en la comunidad de Verdantia. Si se detecta que un usuario es menor de esta edad, la cuenta y sus datos serán eliminados de inmediato.</li>
            <li><strong>Contratación de Suscripciones (18 años):</strong> Para adquirir cualquiera de los planes de pago (Esencial, Avanzado o Premium), el usuario debe ser mayor de edad (18 años) y disponer de plena capacidad jurídica y de obrar. Al procesar un pago, el usuario declara bajo su responsabilidad que cumple con este requisito.</li>
          </ul>
        </div>

        {/* 14. Cookies */}
        <div className="legal-section" id="cookies">
          <h2><span className="section-icon" style={{ background: 'rgba(59,130,246,0.15)', color: 'var(--accent-blue)' }}>🍪</span> 14. Cookies y Almacenamiento Local</h2>
          <p>Utilizamos exclusivamente:</p>
          <ul>
            <li><strong>Cookies de sesión:</strong> necesarias para mantener tu autenticación activa. Se eliminan al cerrar el navegador.</li>
            <li><strong>LocalStorage / SessionStorage:</strong> para preferencias de interfaz. No contienen datos personales.</li>
          </ul>
          <p><strong>No utilizamos</strong> cookies de terceros, cookies publicitarias, ni herramientas de rastreo o analítica de comportamiento.</p>
        </div>

        {/* 15. Contacto */}
        <div className="legal-section" id="contacto">
          <h2><span className="section-icon" style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)' }}>📧</span> 15. Contacto</h2>
          <p>Para ejercer cualquiera de tus derechos o realizar consultas sobre esta política, puedes escribirnos a:</p>
          <div className="highlight-box highlight-green">
            <span style={{ fontSize: '1.3rem' }}>✉️</span>
            <span><strong>superadministrador@verdantia.life</strong> — Respuesta garantizada en un plazo máximo de 30 días hábiles.</span>
          </div>
          <p>Para ejercer estos derechos, puede enviar una comunicación por escrito al domicilio fiscal indicado en el apartado 1 o un correo electrónico a <strong>superadministrador@verdantia.life</strong>, adjuntando una copia de su DNI para verificar su identidad.</p>
          <p>También puedes presentar una reclamación ante la <strong>Agencia Española de Protección de Datos (AEPD)</strong> si consideras que tus derechos no han sido atendidos.</p>
        </div>

      </div>

      {/* Footer */}
      <div className="legal-footer">
        <p>&copy; {new Date().getFullYear()} Verdantia — Banco de Semillas. Todos los derechos reservados.</p>
        <p style={{ marginTop: '6px' }}>Documento elaborado conforme al RGPD (UE 2016/679) y la LOPDGDD (LO 3/2018).</p>
      </div>

    </div>
  );
}
