'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import '@/app/dashboard/dashboard.css';

export default function GuiaUsuarioPage() {
  const router = useRouter();

  return (
    <div className="dashboard-content" style={{ padding: '30px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          🏠 Volver al Inicio
        </button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ margin: 0, color: '#1e293b', fontSize: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>📖</span> Guía de Usuario (La Biblia)
        </h1>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        
        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>
          1. Visión General de Verdantia
        </h2>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          <strong>Verdantia</strong> es una plataforma SaaS integral (Software as a Service) orientada al sector agrícola, biodinámico y de gestión de huertos. La plataforma permite a los usuarios gestionar sus cultivos, llevar un control meteorológico, y registrar actividades bajo un modelo de suscripción escalonada (Básica, Normal, Premium). Todo el ecosistema está soportado por Inteligencia Artificial (Google Imagen 4.0 y modelos de texto avanzados) para automatizar la creación de contenido y recursos visuales.
        </p>

        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: '40px' }}>
          2. Los 5 Dashboards del Superadministrador
        </h2>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          El Panel de Administración es el núcleo operativo de Verdantia, segmentado en cinco áreas principales, diseñadas como aplicaciones independientes (Single Page Applications) de pantalla completa:
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '12px' }}><strong>🌳 Catálogo de Especies:</strong> La enciclopedia viva de Verdantia. Aquí el administrador gestiona la taxonomía global (plantas, frutas, hortalizas), asocia reglas biodinámicas (días de raíz, hoja, flor, fruto) y gestiona la galería multimedia (con IA).</li>
          <li style={{ marginBottom: '12px' }}><strong>🚜 Catálogo de Labores:</strong> Gestión del diccionario de tareas agrícolas (riego, poda, cosecha). Cada labor actúa como una plantilla maestra que los usuarios aplicarán a sus propios huertos, incluyendo iconos dinámicos y colorimetría.</li>
          <li style={{ marginBottom: '12px' }}><strong>✍️ Gestor de Blogs IA:</strong> Un motor de publicación totalmente autónomo. Permite planificar, generar y publicar artículos SEO-optimizados sobre agricultura. La IA redacta el contenido y genera las fotografías fotorrealistas contextuales sin intervención humana.</li>
          <li style={{ marginBottom: '12px' }}><strong>👥 Usuarios y Suscripciones:</strong> El CRM interno para gestionar la base de clientes. Permite visualizar perfiles, historiales de acceso, y lo más importante: establecer amonestaciones y controlar los ciclos de vida de los pagos y límites de cuota (planes y membresías).</li>
          <li style={{ marginBottom: '12px' }}><strong>📖 La Biblia (Guía de Usuario):</strong> Este mismo documento, diseñado para documentar los estándares técnicos, el UX y la arquitectura subyacente para los administradores y desarrolladores de Verdantia.</li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>2.1. Foco Detallado: Catálogo de Especies</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          El <strong>Catálogo de Especies</strong> es una de las piezas arquitectónicas más complejas y completas de la plataforma. Ha sido diseñado para ir más allá de una simple lista de plantas, actuando como un motor de conocimiento botánico y visual:
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Ficha a Pantalla Completa:</strong> Cada especie se edita en un entorno aislado y sin distracciones, utilizando el patrón "Smart Save" (Guardado Inteligente) que detecta cambios en tiempo real y evita sobrescrituras accidentales.</li>
          <li style={{ marginBottom: '8px' }}><strong>Gestión de Variedades:</strong> Permite anidar infinitas variedades bajo una especie maestra (ej. Tomate {'->'} Tomate Cherry, Tomate Kumato), heredando propiedades pero manteniendo autonomía visual.</li>
          <li style={{ marginBottom: '8px' }}><strong>Sincronización Biodinámica:</strong> Las especies se categorizan por su ciclo lunar óptimo (Días de Raíz, Hoja, Flor o Fruto), permitiendo que la plataforma genere calendarios de siembra automáticos para los usuarios.</li>
          <li style={{ marginBottom: '8px' }}><strong>IA Integrada (Generador Imagen 4.0):</strong> Si una especie carece de fotografía, el administrador puede usar el generador integrado que formula un *prompt* contextualizado automáticamente para crear una imagen fotorrealista de la planta.</li>
          <li style={{ marginBottom: '8px' }}><strong>Carrusel Visual (Drag & Drop):</strong> Las fotografías asociadas a la especie se organizan mediante una interfaz táctil/arrastrable donde la primera imagen asume el rol de "Hero Image" (Foto Principal), aplicando filtros de desenfoque y ajuste de encuadre.</li>
        </ul>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '30px' }}>
        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>
          3. Gestión Multimedia y Fotografías (Engine Gráfico)
        </h2>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          El módulo de procesamiento de imágenes de Verdantia no es un simple sistema de subida de archivos (upload), sino un <strong>Motor de Procesamiento Multimedia (Pipeline) de grado corporativo</strong>. Está diseñado para minimizar el coste de servidores, maximizar las métricas SEO (Core Web Vitals) y ofrecer una experiencia de usuario (UX) inmersiva y sin interrupciones.
        </p>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          A continuación se detalla el ciclo de vida completo de una fotografía desde que el usuario la selecciona hasta que se renderiza en la pantalla de un visitante.
        </p>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>3.1. Fase de Cliente (Navegador Front-End)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>Antes de que la imagen toque la red de internet, el navegador del administrador realiza tareas críticas:</p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Interceptación Anti-iPhone (HEIC):</strong> Si un administrador intenta subir una foto directa desde un dispositivo Apple (formato propietario <code>.HEIC</code>), la plataforma inyecta un WebWorker que utiliza WebAssembly (<code>heic2any</code>) para traducir matemáticamente la foto a formato estándar JPEG de forma invisible. El usuario nunca sufre un error de incompatibilidad.</li>
          <li style={{ marginBottom: '8px' }}><strong>Compresión Ultrasónica Pre-Subida:</strong> Para proteger el ancho de banda y garantizar subidas instantáneas incluso en 3G, la imagen original se exprime en el navegador usando <code>browser-image-compression</code>. Las fotos de 15MB se reducen a un máximo de 1MB (resolución tope 2048px) usando el propio procesador del usuario (Edge Computing).</li>
          <li style={{ marginBottom: '8px' }}><strong>Pegado Mágico (Clipboard Listener):</strong> Un "escuchador de eventos" global (<code>window.addEventListener('paste')</code>) permite al administrador copiar cualquier imagen de internet y simplemente pulsar <strong>Ctrl+V</strong> en el teclado estando en la página del editor. La imagen inicia automáticamente su flujo de subida.</li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>3.2. Fase de Servidor (Backend Processing API)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>Una vez el archivo llega al servidor Next.js, entra en la fábrica de procesamiento impulsada por la librería de ultra-bajo nivel C++ <code>sharp</code>:</p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Generación de SEO Dinámico (Gemini AI):</strong> El archivo crudo es convertido a Base64 y enviado a la IA de Gemini Vision, la cual analiza visualmente la foto para redactar un atributo SEO <code>alt</code> descriptivo. Además, se genera un "slug" limpio para el nombre de archivo físico (ej: <code>tomate-rojo-maduro-1234.webp</code>).</li>
          <li style={{ marginBottom: '8px' }}><strong>Extracción de Metadatos (EXIF):</strong> La librería <code>exifr</code> analiza la cabecera binaria del archivo para rescatar información de la captura (Marca de cámara, Modelo y Fecha de toma original). Estos datos se guardan en la BBDD para enriquecer la ficha técnica pública.</li>
          <li style={{ marginBottom: '8px' }}><strong>Conversión a Formato de Próxima Generación:</strong> Independientemente del formato de entrada, las imágenes se codifican a formato <strong>WebP</strong> con una calidad de compresión del 80%, ofreciendo calidades superiores al JPG pesando la mitad.</li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>3.3. Bifurcación Visual (Generación de Múltiples Assets)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>El servidor no guarda una foto, guarda un ecosistema visual por cada subida:</p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Versión HD + Propiedad Intelectual:</strong> La foto principal se redimensiona a un máximo de 1920x1080px y se le inyecta un código SVG dinámico con la palabra "VERDANTIA" semitransparente incrustada en la esquina inferior derecha para proteger los derechos de autor contra scrapers.</li>
          <li style={{ marginBottom: '8px' }}><strong>Miniatura + Smart Crop AI:</strong> Se clona el flujo en memoria para generar una miniatura súper ligera (<code>thumb-*.webp</code>) de 400x400px usando un algoritmo de atención y entropía matemática (<code>sharp.strategy.attention</code>) que detecta dónde está el "sujeto u objeto" de la foto para recortar de forma perfecta.</li>
          <li style={{ marginBottom: '8px' }}><strong>Cálculo de Efecto BlurHash:</strong> El servidor decodifica la imagen a sus píxeles puros RGBA, la encoge a 32x32 y la pasa por el algoritmo <code>blurhash</code>, obteniendo una cadena de unos 20 caracteres que representa un "fantasma matemático" de la imagen.</li>
          <li style={{ marginBottom: '8px' }}><strong>Inteligencia de Color (node-vibrant):</strong> Se escanea la fotografía para extraer su paleta armónica y encontrar su "Color Vibrante" predominante.</li>
        </ul>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>Todos estos datos se empaquetan en un objeto JSON y se insertan en la columna <code>resumen</code> de la base de datos <code>datosadjuntos</code>.</p>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>3.4. Fase de Renderizado (UI/UX)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>Cuando un usuario visita el catálogo, el sistema orquesta la carga para que se sienta instantánea y fluida:</p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Renderizado BlurHash:</strong> Antes de pedir la foto a internet, un <code>Canvas</code> de React intercepta el código de 20 caracteres y dibuja una imagen abstracta difuminada de la foto. No hay saltos visuales ni huecos blancos.</li>
          <li style={{ marginBottom: '8px' }}><strong>Tematización Inmersiva (Dominant Color):</strong> El color "Vibrante" extraído de la foto designada como 'Principal' tiñe sutilmente el fondo y los bordes de la cabecera de toda la pantalla de la especie.</li>
          <li style={{ marginBottom: '8px' }}><strong>Reordenación Drag & Drop en Vivo:</strong> Los administradores pueden reorganizar la galería arrastrando miniaturas con el ratón, disparando actualizaciones asíncronas instantáneas sin recargar la página.</li>
        </ul>

        <div style={{ margin: '50px 0', borderTop: '2px dashed #e2e8f0' }}></div>

        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>
          4. Estándar UX/UI del Sistema Fotográfico y Generación IA
        </h2>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Este documento define la norma general arquitectónica y de interfaz de usuario para la gestión de imágenes en cualquier módulo de Verdantia (Especies, Labores, Usuarios, etc). Todo nuevo módulo que requiera fotos debe adherirse a estas especificaciones.
        </p>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>4.1. El Encabezado (Hero Carousel)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Si un formulario o modal gestiona imágenes, la parte superior debe contar con un <strong>Hero Carousel</strong>.
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Comportamiento Fijo (Sticky):</strong> El contenedor del carrusel debe mantenerse en la parte superior al hacer scroll para garantizar que la foto principal permanezca visible.</li>
          <li style={{ marginBottom: '8px' }}><strong>Distribución Visual:</strong>
            <ul>
              <li><strong>Izquierda:</strong> La foto principal (Hero Photo) en gran formato.</li>
              <li><strong>Derecha:</strong> Una tira vertical con las miniaturas de las fotos restantes.</li>
            </ul>
          </li>
          <li><strong>Arrastre y Ordenamiento (Drag & Drop):</strong>
            <ul>
              <li>Las miniaturas de la derecha son arrastrables entre sí para reordenarlas en la galería.</li>
              <li>Si una miniatura se arrastra <strong>sobre la foto grande (Hero)</strong>, se convierte instantáneamente en la nueva foto principal, mandando la anterior a la tira de miniaturas.</li>
            </ul>
          </li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>4.2. La Galería y Editor (Pestaña "Adjuntos")</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Toda gestión fotográfica pesada se oculta tras una pestaña designada.
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Dropzone:</strong> Zona amplia que acepta arrastrar y soltar múltiples archivos (o hacer clic).</li>
          <li style={{ marginBottom: '8px' }}><strong>Límite Estricto:</strong> Máximo de 4 fotos por entidad (excepto foto de perfil que es 1).</li>
          <li style={{ marginBottom: '8px' }}><strong>Botones de Acción:</strong> Estrella (marcar principal), Lápiz (abrir editor visual) y Aspa (eliminar).</li>
          <li><strong>Editor Visual:</strong> Permite alterar de forma no destructiva (guardado en base de datos):
            <ul>
              <li>Paneo del enfoque y Zoom.</li>
              <li>Ajustes de Brillo y Contraste.</li>
              <li>Filtros CSS predefinidos (Vintage, Comic, Cinematic, etc.).</li>
            </ul>
          </li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>4.3. Generador Inteligente (IA - Imagen 4.0)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Integración del generador de imágenes impulsado por Google Imagen 4.0 para ilustrar especies y entidades sin depender de bancos de imágenes.
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Modal de Generación:</strong> Accesible desde la zona Dropzone con el botón morado "✨ Generar IA".</li>
          <li style={{ marginBottom: '8px' }}><strong>Sugerencias Rápidas:</strong> Botones pre-establecidos (ej. "En la planta con fruto maduro") que sobrescriben automáticamente el concepto.</li>
          <li style={{ marginBottom: '8px' }}><strong>Prompt Reforzado (Anti-Alucinaciones):</strong> El endpoint (<code>/api/ai/generate-image</code>) NUNCA envía el prompt crudo. Se envuelve con el Nombre Común, Nombre Científico y Familia de la especie. Se exige a la IA centrarse exclusivamente en la botánica y omitir animales u otros elementos confusos.</li>
          <li><strong>Flujo Transparente:</strong> La imagen se genera en Base64, y al guardarla se inyecta como un archivo estándar (File Blob), pasando por los procesos habituales (compresión, Blurhash, metadatos SEO).</li>
        </ul>

      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '30px' }}>
        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>
          5. Interfaz de Formularios (Smart Save)
        </h2>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Con el objetivo de maximizar la claridad visual y evitar que los usuarios guarden datos de forma compulsiva o accidental, Verdantia implementa un patrón de "Guardado Inteligente" (Smart Save) en todos sus formularios y modales de edición.
        </p>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>5.1. Detector de Cambios (isDirty State)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Todo formulario que permita editar una entidad existente (Especies, Labores, Usuarios, etc.) debe llevar un control estricto del estado original de los datos al momento de cargarlos.
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Estado Inicial:</strong> Al cargar los datos de la base de datos o abrir el modal, se guarda una copia exacta en memoria (ej. <code>initialData</code>).</li>
          <li style={{ marginBottom: '8px' }}><strong>Comparación en Tiempo Real:</strong> Cada vez que el usuario teclea, marca un checkbox o usa un deslizador, el sistema compara el estado actual del formulario (<code>formData</code>) con el estado inicial. Si existe alguna discrepancia, el formulario se considera "Sucio" (<code>isDirty = true</code>).</li>
          <li style={{ marginBottom: '8px' }}><strong>Visibilidad del Botón de Guardado:</strong> El botón principal de acción (ej. "Guardar Labor") <strong>sólo debe ser visible (o estar habilitado) si <code>isDirty</code> es verdadero</strong>. Si el usuario deshace sus cambios volviendo al estado original, el botón volverá a ocultarse o deshabilitarse automáticamente.</li>
        </ul>
        
        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>5.2. Estándar de Navegación en Dashboards (Gold Standard)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Para garantizar una experiencia de usuario consistente y evitar la duplicidad de componentes, todos los paneles administrativos (Especies, Labores, Usuarios, etc.) siguen un estricto patrón de navegación superior:
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Ubicación:</strong> Los botones de "Volver" deben colocarse <strong>por encima del título principal de la página</strong> (fuera del <code>&lt;header&gt;</code> global y por encima de galerías de fotos o formularios), alineados a la izquierda.</li>
          <li style={{ marginBottom: '8px' }}><strong>Vistas de Listado (Ej: Todas las Especies):</strong> Se incluirá un único botón: <br/><code>🏠 Volver al Inicio</code> (que redirige al Dashboard principal).</li>
          <li style={{ marginBottom: '8px' }}><strong>Vistas de Detalle/Edición (Ej: Editar una Especie):</strong> Se incluirá una botonera doble para ofrecer un contexto jerárquico claro:<br/>
            1. <code>🏠 Volver al Inicio</code><br/>
            2. <code>🌍 Volver a [Nombre de la Sección Global]</code> (ej. Volver a Especies Globales).
          </li>
          <li style={{ marginBottom: '8px' }}><strong>Eliminación de Redundancias:</strong> Queda estrictamente prohibido colocar botones de "Volver" al final de los formularios o debajo de los carruseles de fotos. Tampoco se utilizarán breadcrumbs dinámicos en el header superior global para evitar recargar la interfaz.</li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>5.3. Patrón de Subheader Integrado</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Como evolución del estándar de navegación, todas las vistas principales deben implementar un <strong>Subheader Integrado</strong> con diseño fluido y degradado para centralizar el título y la información clave. Se divide en dos variantes:
        </p>

        <h4 style={{ color: '#475569', marginTop: '20px', fontSize: '1.1rem' }}>5.3.1. Variantes para Listados (Dashboards Globales)</h4>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Fondo Degradado:</strong> El bloque utiliza un `linear-gradient` distintivo por módulo (Ej. Verde para Especies, Naranja para Labores).</li>
          <li style={{ marginBottom: '8px' }}><strong>Título y Contexto:</strong> A la izquierda se coloca el título con su icono y una descripción contextual.</li>
          <li style={{ marginBottom: '8px' }}><strong>Integración de Filtros y Acciones:</strong> A la derecha se integran filtros (selectores) y botones de acción primaria (ej. ➕ Nueva Entidad), ahorrando espacio vertical.</li>
        </ul>

        <h4 style={{ color: '#475569', marginTop: '20px', fontSize: '1.1rem' }}>5.3.2. Variante para Editores e Individualidades (Formularios)</h4>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><strong>Ubicación:</strong> Se coloca <strong>justo debajo de la botonera doble de navegación</strong> (`Inicio` y `Volver a Globales`).</li>
          <li style={{ marginBottom: '8px' }}><strong>Jerarquía de Título:</strong> Muestra el nombre de la entidad que se está editando en grande (ej. "Editar Especie: Tomate") y debajo el subtítulo o nombre científico.</li>
          <li style={{ marginBottom: '8px' }}><strong>Indicador de Cambios (isDirty):</strong> A la derecha del título, dentro del propio subheader, aparece la etiqueta dinámica amarilla de <code>"Cambios sin guardar"</code> cuando <code>isDirty === true</code>.</li>
        </ul>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '30px' }}>
        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>
          6. Protocolo de Despliegue (Deploy) a Producción
        </h2>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          El paso del entorno de desarrollo local al entorno real de producción es un proceso delicado que debe seguir una estricta secuencia.
        </p>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>6.1. Fase 0: Estampado de Versión (Timestamp)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          <strong>Verificación Visual:</strong> Antes de iniciar la compilación, el asistente debe modificar obligatoriamente la pantalla de inicio (<code>src/app/page.tsx</code>) para estampar la fecha y hora exacta del despliegue. Esto permite confirmar a simple vista que la subida a producción ha surtido efecto.
        </p>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>6.2. Fase 1: La Prueba de Fuego (Build Local)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          <strong>Regla de Oro:</strong> Nunca se sube código sin antes ejecutar el comando <code>npm run build</code> en la terminal local.
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Este comando realiza una compilación completa y ultra-estricta de todo el código TypeScript y Next.js.</li>
          <li style={{ marginBottom: '8px' }}>Si existe el más mínimo error de tipos, una variable no utilizada, o un fallo en el diseño estructural, el <strong>Build fallará localmente</strong> alertando al desarrollador.</li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>6.3. Fase 2: Salvaguarda del Código (Control de Versiones)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Una vez que el <code>build</code> es exitoso, se guarda un punto de control en la nube.
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}><code>git add .</code> (Prepara todos los archivos modificados).</li>
          <li style={{ marginBottom: '8px' }}><code>git commit -m "Descripción clara del cambio"</code> (Empaqueta los cambios con una etiqueta explicativa).</li>
          <li style={{ marginBottom: '8px' }}><code>git push</code> (Sube el paquete de forma segura a GitHub).</li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>6.4. Fase 3: El Despliegue Final (Google Cloud / Firebase)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          Para que los cambios se reflejen en la app en vivo, el código debe subirse a la infraestructura de Google Cloud usando Firebase Hosting.
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Se ejecuta el comando <code>firebase deploy</code> en la terminal.</li>
          <li style={{ marginBottom: '8px' }}><strong>Aviso importante (Windows):</strong> Si experimentas el error <code>EPERM: operation not permitted, symlink</code> durante el despliegue en Windows, debes ejecutar el comando de despliegue desde una terminal Linux (WSL) o asegurar que tu terminal tiene permisos de administrador.</li>
          <li style={{ marginBottom: '8px' }}>Una vez terminado, la consola proporcionará el enlace de Firebase (Hosting URL) confirmando que Verdantia ya está operativa en la nube.</li>
        </ul>

        <div style={{ background: '#f0f9ff', borderLeft: '4px solid #0ea5e9', padding: '16px', marginTop: '24px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#0369a1', marginTop: 0, marginBottom: '8px', fontSize: '1.1rem' }}>6.5. Rol del Asistente IA (Mandato Estricto)</h4>
          <p style={{ color: '#0c4a6e', margin: 0, lineHeight: 1.5 }}>
            El asistente de inteligencia artificial (Antigravity) tiene prohibido subir código a producción por iniciativa propia. <strong>El proceso completo de despliegue a Firebase se realizará SIEMPRE y ÚNICAMENTE a petición expresa del usuario.</strong> 
            <br/><br/>
            <strong>REGLA DE HIERRO PARA EL ASISTENTE:</strong> Una vez que el usuario ordene subir a producción, el asistente lanzará los comandos pertinentes (Build, Commit, Deploy) y <strong>ESPERARÁ OBLIGATORIAMENTE</strong> a que los comandos finalicen mediante comprobaciones de estado. <strong>BAJO NINGÚN CONCEPTO</strong> el asistente le preguntará al usuario si desea "esperar al resultado". El asistente actúa como un confidente diligente: procesa la tarea en segundo plano e informa <strong>exclusivamente cuando el despliegue haya concluido exitosamente o fallado</strong>.
            <br/><br/>
            <strong>SINCRONIZACIÓN CON AGENTS.MD:</strong> Para garantizar que el comportamiento automático y sin interrupciones se mantenga a lo largo del tiempo, cualquier cambio, adición o modificación en esta guía de usuario ("La Biblia") deberá ser reflejado y sincronizado de inmediato como una regla obligatoria en el archivo <code>AGENTS.md</code> de la raíz del proyecto, el cual actúa como memoria inquebrantable y permanente del asistente.
          </p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '30px' }}>
        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>
          7. Motor de Suscripciones y Degradación Progresiva
        </h2>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          El sistema de monetización y membresías de Verdantia no utiliza un modelo binario (Premium vs Gratis). Hemos implementado un <strong>Motor de Degradación Progresiva Universal</strong> diseñado para evitar el "abismo" (churn cliff) cuando un usuario deja de pagar o finaliza su periodo de prueba.
        </p>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>7.1. Estructura de Niveles (4 Tiers)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>La plataforma clasifica a los usuarios en cuatro escalones, cada uno con ventajas, límites y privilegios específicos de monetización y funcionalidades (Chat, Fotos, Calendarios):</p>
        
        <div style={{ overflowX: 'auto', marginTop: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ padding: '16px', color: '#0f172a' }}>Plan</th>
                <th style={{ padding: '16px', color: '#0f172a' }}>Precio Aprox.</th>
                <th style={{ padding: '16px', color: '#0f172a' }}>Gestión de Semillas/Especies</th>
                <th style={{ padding: '16px', color: '#0f172a' }}>Galerías y Fotos</th>
                <th style={{ padding: '16px', color: '#0f172a' }}>Privilegios de IA (Chat y Generación)</th>
                <th style={{ padding: '16px', color: '#0f172a' }}>Calendarios</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px', fontWeight: 'bold', color: '#15803d' }}>🌳 Premium</td>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>9.99€ / mes</td>
                <td style={{ padding: '16px' }}><strong>Ilimitadas.</strong> Múltiples huertos y control total.</td>
                <td style={{ padding: '16px' }}>5 fotos de perfil. <strong>Fotos ilimitadas</strong> por galería/labor.</td>
                <td style={{ padding: '16px' }}>Acceso ilimitado al Chat IA y generación de posts.</td>
                <td style={{ padding: '16px' }}>Completos (Agrícola, Biodinámico Avanzado e IA).</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <td style={{ padding: '16px', fontWeight: 'bold', color: '#65a30d' }}>🌿 Avanzado</td>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>5.99€ / mes</td>
                <td style={{ padding: '16px' }}>Hasta <strong>50 semillas/especies</strong> activas.</td>
                <td style={{ padding: '16px' }}>3 fotos de perfil. Hasta 4 fotos por galería.</td>
                <td style={{ padding: '16px' }}>Chat Básico IA (Consultas limitadas diarias).</td>
                <td style={{ padding: '16px' }}>Lunar y Biodinámico Básico.</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px', fontWeight: 'bold', color: '#0f766e' }}>🌱 Esencial</td>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>2.99€ / mes</td>
                <td style={{ padding: '16px' }}>Hasta <strong>20 semillas/especies</strong> activas.</td>
                <td style={{ padding: '16px' }}>2 fotos de perfil. Hasta 2 fotos por galería.</td>
                <td style={{ padding: '16px' }}>Sin acceso al Chat IA ni generación.</td>
                <td style={{ padding: '16px' }}>Calendario Lunar Simple.</td>
              </tr>
              <tr>
                <td style={{ padding: '16px', fontWeight: 'bold', color: '#78350f' }}>🌰 Gratuito</td>
                <td style={{ padding: '16px', fontWeight: 'bold' }}>0.00€</td>
                <td style={{ padding: '16px' }}>Hasta <strong>5 semillas/especies</strong> (huerto básico).</td>
                <td style={{ padding: '16px' }}>1 foto de perfil. 1 foto por galería.</td>
                <td style={{ padding: '16px' }}>Sin acceso a IA.</td>
                <td style={{ padding: '16px' }}>Sin calendarios (+ Publicidad en app).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>7.2. La Cascada de Degradación</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          La regla de negocio principal es que <strong>una bajada de plan siempre ocurre escalón a escalón, con periodos de gracia de 30 días</strong>. Esto aplica a dos escenarios principales:
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '12px' }}><strong>Periodo de Prueba (Onboarding):</strong> Al verificar el correo, el usuario no recibe "un trial normal". Recibe 1 mes de Premium. Cuando acaba, no pasa a Gratuito, sino a Avanzado (1 mes extra). Cuando acaba, pasa a Esencial (1 mes extra). Al final de los 3 meses (90 días), aterriza en el plan Gratuito. Esto fomenta el enganche con las funcionalidades premium de forma prolongada.</li>
          <li style={{ marginBottom: '12px' }}><strong>Cancelación de Pago (Churn Mitigation):</strong> Si un usuario lleva meses pagando Premium y cancela su tarjeta, Verdantia le "regala" un mes de Avanzado y luego un mes de Esencial antes de quitarle todos los privilegios. Es un periodo de retención natural donde el usuario sigue recibiendo valor y tiene 60 días de avisos suaves para volver a suscribirse.</li>
        </ul>

        <h3 style={{ color: '#334155', marginTop: '30px', fontSize: '1.4rem' }}>7.3. Implementación Técnica (El Endpoint Orquestador)</h3>
        <p style={{ color: '#475569', lineHeight: 1.6 }}>
          En lugar de correr tareas <em>Cron</em> pesadas a medianoche, Verdantia usa un enfoque <strong>Lazy Evaluation</strong> (Evaluación Perezosa).
        </p>
        <ul style={{ color: '#475569', lineHeight: 1.6, paddingLeft: '20px' }}>
          <li style={{ marginBottom: '8px' }}>Cada vez que un usuario abre la pantalla de su Perfil (<code>/dashboard/perfil</code>), el cliente invoca el endpoint <code>/api/auth/check-plan-degradation</code>.</li>
          <li style={{ marginBottom: '8px' }}>El endpoint comprueba la fecha de caducidad actual (<code>usuariossuscripcionesfechafin</code>).</li>
          <li style={{ marginBottom: '8px' }}>Si la fecha ya ha pasado, la base de datos se actualiza instantáneamente en cascada al siguiente nivel inferior, asignando otros +30 días (pero calculados basándose en milisegundos para evitar bugs de cambios de hora DST).</li>
          <li style={{ marginBottom: '8px' }}>Si el límite de fotos excede el del nuevo plan (ej. pasa de 5 a 3 fotos al bajar de Premium a Avanzado), <strong>ninguna foto se borra</strong>. El sistema bloquea temporalmente la edición visual del perfil hasta que el usuario elimine voluntariamente el exceso para cuadrar con el nuevo plan.</li>
        </ul>
      </div>
      
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginTop: '30px', marginBottom: '30px' }}>
        <h2 style={{ color: '#0f172a', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px', marginTop: 0 }}>
          8. Registro Persistente de Fallos y Correcciones
        </h2>
        <p style={{ color: '#475569', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Esta sección actúa como un <strong>disco duro externo para el Asistente de IA</strong>, evitando el "olvido" de fallos críticos debido a las limitaciones de memoria de contexto. Antes de resolver nuevos problemas, la IA debe consultar y vaciar esta lista.
        </p>

        <div style={{ background: '#eff6ff', borderLeft: '4px solid #3b82f6', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px', marginBottom: '24px' }}>
          <h4 style={{ color: '#1d4ed8', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>ℹ️ Mecánica del Registro (Obligatorio para la IA)</h4>
          <ul style={{ color: '#1e3a8a', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Registro Cronológico:</strong> Cada nuevo intento, hipótesis o análisis de un bug debe añadirse al hilo del fallo con su sello de tiempo estricto (Timestamp).</li>
            <li style={{ marginBottom: '4px' }}><strong>Estados Claros:</strong> Toda propuesta nace como 🟡 PENDIENTE/EN CURSO. Si la ejecución falla, se marca explícitamente el bloque como 🔴 FRACASO para no repetir la misma ruta en el futuro. Si tiene éxito, se marca como 🟢 RESUELTO.</li>
            <li><strong>Transición:</strong> Una vez que un fallo en la sección "8.1. Fallos Activos" se consolida como 🟢 RESUELTO, el bloque entero debe ser movido a la sección "8.2. Fallos Resueltos" como parte del historial.</li>
          </ul>
        </div>

        <h3 style={{ color: '#0f172a', marginTop: '30px', fontSize: '1.4rem' }}>
          8.1. Fallos Activos / Pendientes de Resolución
        </h3>

        <h4 style={{ color: '#dc2626', marginTop: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔴 8.1.1. Imágenes no cargan en Producción (Cloud)
        </h4>
        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
          <strong>Fallo:</strong> Las fotografías e imágenes (portadas de PDFs, avatares, fotos de especies) que sí se ven en el entorno local devuelven un error en Google Cloud.
        </p>
        
        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginBottom: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 15:45]</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Mi falso análisis:</strong> Pensé que Next.js bloqueaba orígenes por seguridad.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Modifiqué `next.config.ts` para autorizar dominios.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO.</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginBottom: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 16:10]</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> La función Node.js falla al intentar leer el disco duro (`public/uploads`) porque en Cloud esa carpeta no existe.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Modificado `api/media/route.ts` para redirigir al estático en Firebase Hosting.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO CONFIRMADO EN PRODUCCIÓN (validado 30/04/2026). Las fotos siguen rotas.</li>
          </ul>
        </div>

        <div style={{ background: '#fff7ed', borderLeft: '4px solid #f97316', padding: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#9a3412', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[30/04/2026 - 15:44] — DIAGNÓSTICO Y NUEVA PROPUESTA</h4>
          <ul style={{ color: '#7c2d12', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Diagnóstico del fracaso anterior:</strong> El Redirect 302 a <code>/{'{'}mediaPath{'}'}</code> falla porque Firebase Hosting NO tiene las fotos en su raíz estática. Las imágenes están en <strong>Firebase Storage</strong> (bucket), no servidas como assets estáticos de Hosting.</li>
            <li style={{ marginBottom: '4px' }}><strong>Plan A (Paliativo):</strong> Si la foto no existe en Storage, devolver un placeholder SVG en vez de un redirect roto.</li>
            <li style={{ marginBottom: '4px' }}><strong>Plan B (Raíz del problema):</strong> Verificar que las rutas en la BBDD apunten a Firebase Storage válidas. Migrar rutas legacy <code>uploads/...</code> o subir fotos al bucket.</li>
            <li><strong>Resultado:</strong> 🔴 FALLO. El plan A y B no resolvieron la sobrecarga de RAM en la Cloud Function al servir las fotos.</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[01/05/2026 - 16:35] — PLAN DE SOLUCIÓN PROPUESTO</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Diagnóstico Definitivo:</strong> Al usar <code>/api/media</code> en producción, Firebase levanta una Cloud Function que descarga cada imagen entera en la memoria RAM antes de servirla. Esto colapsa el servidor (OOM) y hace que las fotos no se vean.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada en local:</strong> Se ha modificado <code>getMediaUrl</code> para saltarse la API por completo y cargar las imágenes directamente a través de las URLs públicas del CDN de Google Cloud Storage. El bucket se ha abierto a nivel de lectura.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO. (Se pensó que era colapso de RAM, pero el error seguía).</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 12:35] — DIAGNÓSTICO DE LA CAUSA RAÍZ</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Fallo anterior:</strong> La corrección del paquete mysql2 resolvió el fallo de la base de datos, pero el listado de adjuntos seguía sin cargar porque la petición devolvía un error 500 en formato HTML en vez de JSON.</li>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> El servidor de producción (Firebase Functions) está colapsando al cargar el módulo del endpoint de adjuntos. La API importa la librería <code>sharp</code> para preprocesar imágenes para la IA de Gemini, pero <strong><code>sharp</code> no está listada en el <code>package.json</code></strong>. En desarrollo local funciona por magia negra de Next.js, pero en Serverless (producción), causa un <code>ModuleNotFoundError</code> masivo que tira abajo las rutas <code>/photos</code>, <code>/pdfs</code> y <code>/blogs</code>.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución propuesta:</strong> Instalar explícitamente la librería mediante <code>npm install sharp</code> y lanzar el ciclo completo de validación y despliegue a producción.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO. (La librería se instaló pero Firebase continuó fallando al encontrar problemas con los binarios de sharp en el entorno Serverless).</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 13:10] — DIAGNÓSTICO ERRÓNEO (Sharp Lazy-Load)</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> Firebase Functions requiere una estrategia de empaquetado muy estricta para binarios nativos como los de <code>sharp</code>. La mera importación global (<code>import sharp from 'sharp'</code>) fuerza su carga durante la inicialización de la Cloud Function.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Modificar el backend para cargar <code>sharp</code> de forma perezosa/dinámica y añadirlo a <code>serverExternalPackages</code>.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO. El endpoint seguía devolviendo un error 500 y las imágenes de los dashboards de edición seguían sin cargar.</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 13:30] — DIAGNÓSTICO DE LA VERDADERA CAUSA RAÍZ</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Diagnóstico Definitivo (Real):</strong> Al consultar los logs en vivo de Google Cloud, el error causante del 500 es: <code>Cannot find module 'firebase-admin-a14c8a5423a75469'</code>. ¡Es el mismo bug destructivo de Turbopack que tuvimos con la base de datos (<code>mysql2</code>)! Al tener <code>firebase-admin</code> o <code>sharp</code> en <code>serverExternalPackages</code> dentro del <code>next.config.ts</code>, Turbopack ofusca los nombres de los módulos requeridos (añadiéndoles un hash), lo que provoca que la Cloud Function de Firebase no encuentre las carpetas y el servidor entero colapse al arrancar.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> 1) Eliminar <code>serverExternalPackages</code> del <code>next.config.ts</code>. 2) Aplicar un Bypass Dinámico usando <code>require('firebase-' + 'admin')</code> en los archivos <code>admin.ts</code> y <code>storage.ts</code>.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO. El bypass con concatenación de strings provocó que el servidor de desarrollo local (Turbopack) entrara en un bucle infinito y se colgara, impidiendo el trabajo local.</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 13:55] — NUEVA PROPUESTA (Bypass Absoluto con Eval y Limpieza de Caché)</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> El servidor local se cuelga porque Turbopack intenta resolver de forma estática la concatenación. Para evitar que Turbopack rompa el módulo en producción pero mantener la compatibilidad local, necesitamos una función que el compilador ignore completamente pero Node ejecute en runtime.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> 1) Usar <code>eval("require('firebase-admin')")</code> en <code>admin.ts</code> y <code>storage.ts</code>. 2) Eliminar la carpeta <code>.next</code> y subir a producción.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO CRÍTICO. El uso de <code>eval</code> rompe el modelo Singleton de instanciación en el entorno Serverless de Next.js, provocando que la base de datos de Firebase no se inicialice a tiempo (<code>The default Firebase app does not exist</code>). Esto hizo que toda la aplicación en producción (incluyendo la propia guía de usuario) colapsara devolviendo un Error 500 total.</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 14:15] — PROPUESTA DEFINITIVA (Bypass de Entorno Condicional en Turbopack)</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Diagnóstico Definitivo (Real):</strong> Todos los intentos de engañar a Turbopack manipulando los archivos <code>.ts</code> rompen algo. Necesitamos <code>serverExternalPackages: ['firebase-admin']</code> OBLIGATORIAMENTE para que el entorno local no colapse. Pero si lo dejamos al subir a Producción, Turbopack genera el hash maldito <code>firebase-admin-a14c8...</code> que provoca el Error 500 en Firebase Functions.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución propuesta:</strong> Dejar el código fuente intacto (usar los imports normales) y aplicar un condicional dinámico en <code>next.config.ts</code> usando <code>process.env.NODE_ENV</code>. Así, en desarrollo local (<code>development</code>) el array incluirá los paquetes y no se colgará, pero al compilar para Firebase (<code>production</code>), el array estará vacío, evitando que Turbopack genere el hash y permitiendo a la Cloud Function encontrar la librería.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO. El endpoint de fotos de la especie sigue colapsando en local.</li>
          </ul>
        </div>

        <div style={{ background: '#ecfdf5', borderLeft: '4px solid #10b981', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#065f46', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 15:00] — RESOLUCIÓN PARCIAL (Lazy Loading de Firebase Storage)</h4>
          <ul style={{ color: '#064e3b', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Estado:</strong> Las peticiones GET de las especies ya no colapsan en Producción y las galerías se ven perfectamente.</li>
            <li style={{ marginBottom: '4px' }}><strong>Nuevo Fallo 1 (Dashboard Usuarios):</strong> Las fotos de los usuarios no cargaban, pero se debió a un error SQL. Se estaba consultando la tabla inexistente <code>usuarios_fotos</code> en lugar de <code>datosadjuntos</code>. (Corregido localmente).</li>
            <li style={{ marginBottom: '4px' }}><strong>Nuevo Fallo 2 (Cargas POST):</strong> Subir fotos desde archivo/cámara/IA falla en Producción. Al ejecutar el POST, se vuelve a cargar <code>firebase-admin</code>, y Turbopack lo destruye o renombra (bug del hash de Next.js 15).</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 20:50] — PROPUESTA TÉCNICA (Bypass de Análisis Estático para Firebase Admin)</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Objetivo:</strong> Restaurar la subida de fotos (POST) que actualmente colapsa en producción al cargar <code>firebase-admin</code> dinámicamente.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Bypass de Análisis Estático en <code>src/lib/firebase/admin.ts</code> usando <code>const libName = 'firebase-admin'; const admin = require(libName);</code> + condicional <code>NODE_ENV</code> en <code>next.config.ts</code> para <code>serverExternalPackages</code>.</li>
            <li style={{ marginBottom: '4px' }}><strong>Justificación:</strong> Turbopack analiza estáticamente los <code>require('string')</code> para empaquetarlos, pero no puede resolver variables dinámicas.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO PARCIAL. El dashboard de Especies Globales sí carga las fotos correctamente en producción (GET funciona), pero el dashboard de Perfil de Usuario NO carga sus fotos. Los logs de Google Cloud siguen mostrando <code>Cannot find module 'firebase-admin-a14c8...'</code> en las rutas que importan <code>firebase-admin</code> de forma estática. La diferencia clave: la API de especies usa <code>await import()</code> (lazy/dinámico) y la de perfil usa <code>import</code> estático al inicio del archivo.</li>
          </ul>
        </div>

        <div style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#166534', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[03/05/2026 - 07:50] — RESOLUCIÓN PARCIAL (Importación Dinámica en Rutas API)</h4>
          <ul style={{ color: '#14532d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Diagnóstico:</strong> La API de especies funcionaba en producción porque usaba <code>await import()</code>. En cambio, las otras APIs importaban <code>uploadToStorage</code> de forma estática, forzando el empaquetado de <code>firebase-admin</code>.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Cambiamos todas las rutas API a importaciones dinámicas.</li>
            <li><strong>Resultado:</strong> 🟡 ÉXITO PARCIAL. El paquete bajó de tamaño y los GET funcionaban, pero los POST (subida de fotos) seguían fallando en producción por el hash corrupto.</li>
          </ul>
        </div>

        <div style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#166534', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>🟢 [04/05/2026 - 10:40] — SOLUCIÓN DEFINITIVA (Erradicación del Import Estático Transitivo)</h4>
          <ul style={{ color: '#14532d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> El archivo <code>src/lib/firebase/storage.ts</code> todavía conservaba la importación estática <code>import {'{'} bucket {'}'} from './admin'</code> en su cabecera. Aunque las rutas API hacían <code>await import('storage')</code>, la mera presencia de este import estático transitivo provocaba que Turbopack generase el hash maldito para <code>firebase-admin</code> al compilar las utilidades. Además, <code>next.config.ts</code> forzaba el external de firebase-admin en producción, provocando la discrepancia.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> 1) Se revirtió <code>next.config.ts</code> para que externalice <code>firebase-admin</code> SÓLO en development. 2) Se eliminó el import estático en <code>storage.ts</code>, moviendo <code>const {'{'} bucket {'}'} = await import('./admin')</code> dentro de las funciones <code>uploadToStorage</code> y <code>deleteFromStorage</code>.</li>
            <li><strong>Resultado:</strong> 🟢 RESUELTO. Ninguna ruta de Next.js carga firebase-admin de forma estática transitiva, esquivando el bug del empaquetador definitivamente.</li>
          </ul>
        </div>

        <div style={{ background: '#f0f9ff', borderLeft: '4px solid #0ea5e9', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#0369a1', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 21:15] — MEJORA UX Y CORRECCIÓN DE BUGS (Blog IA y Asimilación)</h4>
          <ul style={{ color: '#0c4a6e', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Fix Asimilación Plagas:</strong> Corregido el mapeo de variables (<code>xrelacionesplagasideplaga</code>) que provocaba el rollback silencioso de la transacción en la API al guardar plagas sugeridas por IA.</li>
            <li style={{ marginBottom: '4px' }}><strong>Fix Gemini JSON:</strong> Se implementó un limpiador de formato Markdown (<code>```json</code>) antes del <code>JSON.parse()</code> para prevenir errores de validación desde la respuesta de Gemini.</li>
            <li style={{ marginBottom: '4px' }}><strong>Fix SQL Blogs (Error 500):</strong> Corregida la consulta a la base de datos que fallaba por buscar <code>u.nombre</code> en lugar de <code>u.usuariosnombre</code>, lo que impedía que los blogs cargasen en el frontend.</li>
            <li style={{ marginBottom: '4px' }}><strong>Fix Parseo Type-Coercion:</strong> Relajada la igualdad estricta a <code>==</code> para enlazar el ID del PDF y evitado un doble parseo del campo JSON <code>blogcontenido</code> (causado por <code>mysql2</code>).</li>
            <li style={{ marginBottom: '4px' }}><strong>Mejora UI/UX:</strong> Transformado el enlace simple del blog (bajo el PDF) en una <strong>Mini-Tarjeta Enriquecida</strong> con miniatura (<code>getMediaUrl</code> para resolver el Error 404), badges de estado, título completo no truncado, efectos hover y un botón integrado para eliminar el blog directamente de la base de datos.</li>
          </ul>
        </div>

        <h4 style={{ color: '#dc2626', marginTop: '40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔴 8.1.2. Desincronización del Asistente IA de Especies con el Dashboard
        </h4>
        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
          <strong>Fallo:</strong> El asistente de IA para autocompletar la ficha de especies devuelve datos que no son compatibles con las nuevas opciones (select-options) del formulario en el frontend, como el tipo de siembra, requerimientos de luz y dificultad.
        </p>

        <div style={{ background: '#fefce8', borderLeft: '4px solid #eab308', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#854d0e', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[02/05/2026 - 13:08] — PROPUESTA EN CURSO</h4>
          <ul style={{ color: '#713f12', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> El prompt actual de la IA no está restringido a devolver valores exactos que coincidan con los nuevos enumerados del formulario. Además, la lógica de asimilación en el frontend (<code>EspecieForm.tsx</code>) necesita expandirse para mapear y aplicar correctamente estos nuevos atributos.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución propuesta:</strong> 1) Actualizar el prompt en el backend para forzar compatibilidad con los selectores de la interfaz. 2) Ampliar la lógica de comparación y asimilación en el frontend para incluir los nuevos campos. 3) Mantener los cambios en entorno local hasta confirmar estabilidad.</li>
            <li><strong>Resultado:</strong> 🟡 EN DESARROLLO. Trabajando en la implementación local.</li>
          </ul>
        </div>

        <h3 style={{ color: '#0f172a', marginTop: '40px', fontSize: '1.4rem' }}>
          8.2. Fallos Resueltos (Historial)
        </h3>

        <h4 style={{ color: '#16a34a', marginTop: '20px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🟢 8.2.1. Desplegable Superadministrador truncado en Móvil
        </h4>
        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
          <strong>Fallo:</strong> El menú en móviles corta las entradas y los dashboards laterales no dejan hacer scroll hacia abajo.
        </p>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginBottom: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 15:45]</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Mi falso análisis:</strong> Pensé que faltaba espacio físico abajo.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Añadido un `padding-bottom` extra en CSS.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO.</li>
          </ul>
        </div>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginBottom: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 16:10]</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> Se estaba usando `100vh`, que en iOS ignora las barras de navegación. Faltaban las reglas nativas de Apple para scroll.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Cambiado a `100dvh` (dinámico) y añadido `-webkit-overflow-scrolling`.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO CONFIRMADO EN PRODUCCIÓN (validado 30/04/2026). El sidebar sigue sin scrollear.</li>
          </ul>
        </div>

        <div style={{ background: '#fff7ed', borderLeft: '4px solid #f97316', padding: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#9a3412', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[30/04/2026 - 15:44] — DIAGNÓSTICO Y NUEVA PROPUESTA</h4>
          <ul style={{ color: '#7c2d12', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Diagnóstico del fracaso anterior:</strong> El problema NO es de los desplegables individuales ni del viewport height. El <strong>contenedor lateral completo (<code>.sidebar</code>)</strong> no permite scroll. La causa raíz: el layout padre (<code>.dashboard-layout</code>) usa <code>overflow: hidden</code> y el <code>.sidebar-footer</code> con <code>margin-top: auto</code> empuja el contenido fuera de los límites sin permitir scroll independiente de la zona de navegación.</li>
            <li style={{ marginBottom: '4px' }}><strong>Hipótesis del usuario:</strong> {`"El lateral no tiene scroll; el problema no está en los desplegables, es el layout izquierdo que no tiene scroll."`}</li>
            <li style={{ marginBottom: '4px' }}><strong>Propuesta de solución:</strong> Reestructurar el sidebar en 3 zonas: Logo (fijo arriba), Navegación (zona scrollable con <code>overflow-y: auto</code> y <code>flex: 1</code>) y Footer (fijo abajo). Solo la zona central hará scroll. Esto resuelve en TODOS los dispositivos.</li>
            <li><strong>Resultado:</strong> 🟢 RESUELTO. El sidebar ahora permite un scroll perfecto sin romper el layout.</li>
          </ul>
        </div>

        <h4 style={{ color: '#16a34a', marginTop: '40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🟢 8.2.2. Bug Destructivo en PDFs IA y Error SQL
        </h4>
        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
          <strong>Fallo:</strong> Al generar la portada del PDF, se borraban el título y apuntes. Además, al intentar "Añadir" un documento desde el buscador, saltaba un error SQL por discrepancia de columnas.
        </p>

        <div style={{ background: '#fefce8', borderLeft: '4px solid #eab308', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '16px' }}>
          <h4 style={{ color: '#854d0e', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 16:02]</h4>
          <ul style={{ color: '#713f12', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> El PUT sobrescribía ciegamente campos con strings vacíos. Por otro lado, la IA generaba Arrays en lugar de strings, lo que rompía el driver de MySQL al intentar guardarlo.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Se reescribió `route.ts` para hacer actualizaciones parciales dinámicas. Además, se forzó la conversión de Arrays a Strings (`.join('\n')`) antes de tocar la base de datos.</li>
            <li><strong>Resultado:</strong> 🟢 RESUELTO.</li>
          </ul>
        </div>

        <h4 style={{ color: '#16a34a', marginTop: '40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🟢 8.2.3. El Asistente de Búsqueda Falla
        </h4>
        <p style={{ color: '#475569', lineHeight: 1.6, marginBottom: '16px' }}>
          <strong>Fallo:</strong> El asistente de búsqueda IA se queda colgado infinitamente o devuelve resultados vacíos, sin mostrar ningún error claro al usuario en la interfaz. <em>(Nota: Este fallo se produjo como efecto secundario al aplicar la corrección del Punto 8.3).</em>
        </p>

        <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', padding: '16px', marginBottom: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#991b1b', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 16:22]</h4>
          <ul style={{ color: '#7f1d1d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Mi falso análisis:</strong> Creímos que la API del modelo de lenguaje estaba caída o que había un problema de red.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Se aumentó el timeout de las peticiones a la API de la IA.</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO.</li>
          </ul>
        </div>

        <div style={{ background: '#fefce8', borderLeft: '4px solid #eab308', padding: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#854d0e', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 16:25]</h4>
          <ul style={{ color: '#713f12', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> El componente frontend de búsqueda no está gestionando los estados de error ni el parseo cuando la IA devuelve un JSON truncado por el límite de tokens o con un formato inesperado.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución propuesta:</strong> Modificar el prompt para forzar una salida JSON estricta y más concisa. Además, implementar un bloque <code>try/catch</code> en el cliente para interceptar errores de parseo y mostrar una alerta amigable en la UI.</li>
            <li><strong>Resultado:</strong> 🟡 ÉXITO PARCIAL. El buscador IA no se cuelga y permite añadir PDFs, pero los textos de resumen son demasiado escasos y la generación de portada con Imagen 4.0 falla por falta de contexto.</li>
          </ul>
        </div>

        <div style={{ background: '#fefce8', borderLeft: '4px solid #eab308', padding: '16px', borderRadius: '0 8px 8px 0' }}>
          <h4 style={{ color: '#854d0e', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 16:35]</h4>
          <ul style={{ color: '#713f12', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> Al forzar en el prompt de la IA una respuesta de "máximo 50 palabras", la descripción resultaba tan corta que el generador de imágenes posterior (Imagen 4.0) fallaba silenciosamente por falta de descripción semántica para componer la portada.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Se ha modificado de nuevo el prompt de <code>pdf-search/route.ts</code> para pedir resúmenes técnicos de al menos 4 líneas y apuntes con viñetas reales, proporcionando más "carne" para la generación de la foto.</li>
            <li><strong>Resultado:</strong> 🟡 ÉXITO PARCIAL. El resumen ya genera más texto y se guarda, pero la foto sigue sin aparecer por un fallo silencioso de Imagen 4.0.</li>
          </ul>
        </div>

        <div style={{ background: '#fefce8', borderLeft: '4px solid #eab308', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#854d0e', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>[29/04/2026 - 16:38]</h4>
          <ul style={{ color: '#713f12', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> Al enviar la petición a Imagen 4.0, se enviaba <code>tipoEntidad: 'especie'</code>. Esto forzaba a la IA a rechazar cualquier texto y exigir una foto hiperrealista botánica, lo que entraba en conflicto directo con el concepto de "Portada de documento".</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Se creó una directiva en <code>api/ai/generate-image/route.ts</code> para <code>tipoEntidad: 'documento'</code> y se actualizó <code>EspecieForm.tsx</code> para enviarla, pidiendo una "Ilustración digital de estilo editorial y académico".</li>
            <li><strong>Resultado:</strong> 🔴 FRACASO. La imagen se generaba pero no se mostraba.</li>
          </ul>
        </div>

        <div style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e', padding: '16px', borderRadius: '0 8px 8px 0', marginTop: '16px' }}>
          <h4 style={{ color: '#166534', marginTop: 0, marginBottom: '8px', fontSize: '1rem' }}>🟢 [30/04/2026 - 15:52] — CAUSA RAÍZ ENCONTRADA Y RESUELTA</h4>
          <ul style={{ color: '#14532d', margin: 0, paddingLeft: '20px', lineHeight: 1.5 }}>
            <li style={{ marginBottom: '4px' }}><strong>Análisis real:</strong> La imagen SÍ se generaba con Imagen 4.0 y SÍ se subía correctamente a Firebase Storage. El PUT devolvía 200. <strong>PERO</strong> la ruta donde se guardaba (<code>uploads/especies_pdfs_covers/...</code>) no estaba en la lista blanca (<code>ALLOWED_PREFIXES</code>) de <code>api/media/route.ts</code>. El endpoint devolvía <strong>400 Bad Request</strong> silenciosamente en cada petición GET.</li>
            <li style={{ marginBottom: '4px' }}><strong>Solución aplicada:</strong> Se añadió <code>'uploads/especies_pdfs_covers/'</code> a la constante <code>ALLOWED_PREFIXES</code> en <code>api/media/route.ts</code>.</li>
            <li><strong>Resultado:</strong> 🟢 RESUELTO.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
