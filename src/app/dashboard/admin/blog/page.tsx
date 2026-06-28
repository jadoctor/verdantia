'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

export default function BlogAdminDashboard() {
  const [articulos, setArticulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // -- Control de Filtros y Búsqueda (Regla 11) --
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // -- Estados del Wizard Asistente IA (Regla 10) --
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [entityType, setEntityType] = useState<'especie' | 'variedad' | 'labor' | null>(null);
  
  // Paso 2: Listas y selección
  const [entities, setEntities] = useState<any[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [entitySearch, setEntitySearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  
  // PDFs correspondientes
  const [pdfsList, setPdfsList] = useState<any[]>([]);
  const [loadingPdfs, setLoadingPdfs] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<any>(null);

  // Paso 3: Instrucciones y Prompt
  const [instructions, setInstructions] = useState('Escribe un post de blog para agricultores principiantes, con un tono motivador, consejos prácticos, emojis y una buena estructura de Markdown.');
  
  // Paso 4: Generación y Éxito
  const [generatingBlog, setGeneratingBlog] = useState(false);
  const [blogProgressMsg, setBlogProgressMsg] = useState('Iniciando motor de IA...');
  const [generationSuccess, setGenerationSuccess] = useState(false);

  const router = useRouter();

  // Escuchar cambio de Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
    });
    return () => unsubscribe();
  }, []);

  // Cargar Artículos de Blog
  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/blog');
      const data = await res.json();
      if (data.success) {
        setArticulos(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar artículos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar artículos e iniciar estado persistido (Regla 11)
  useEffect(() => {
    loadArticles();
    const savedFilter = sessionStorage.getItem('admin_blog_filter');
    if (savedFilter) {
      setFiltroEstado(savedFilter);
    }
  }, []);

  // Guardar estado de filtro (Regla 11)
  const handleFiltroChange = (nuevoFiltro: string) => {
    setFiltroEstado(nuevoFiltro);
    sessionStorage.setItem('admin_blog_filter', nuevoFiltro);
  };

  // Cambiar estado del artículo (Publicar / Pasar a Borrador)
  const handleToggleEstado = async (id: number, currentEstado: string) => {
    setUpdatingId(id);
    try {
      // 1. Obtener datos completos del artículo para no pisar campos
      const getRes = await fetch(`/api/admin/blog/${id}`);
      const getData = await getRes.json();
      if (!getData.success) throw new Error(getData.error || 'No se pudo obtener el artículo');
      
      const article = getData.data;
      const nuevoEstado = currentEstado === 'publicado' ? 'borrador' : 'publicado';

      // 2. Guardar actualización
      const putRes = await fetch(`/api/admin/blog/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogtitulo: article.blogtitulo,
          blogslug: article.blogslug,
          blogresumen: article.blogresumen,
          blogcontenido: article.blogcontenido,
          blogestado: nuevoEstado,
          blogimagen: article.blogimagen
        })
      });
      const putData = await putRes.json();
      if (putData.success) {
        await loadArticles();
      } else {
        alert('Error al actualizar el estado: ' + (putData.error || 'Desconocido'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Error: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Eliminar Artículo
  const handleDeleteArticle = async (id: number) => {
    if (!confirm('¿Seguro que quieres eliminar este artículo definitivamente de la base de datos?')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadArticles();
      } else {
        alert('Error al eliminar el artículo: ' + (data.error || 'Desconocido'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Error de red al eliminar el artículo');
    } finally {
      setUpdatingId(null);
    }
  };

  // Inactivar Artículo
  const handleInactivateArticle = async (id: number) => {
    if (!confirm('¿Quieres cambiar el estado de este artículo a INACTIVO? Dejará de ser visible pero se conservará en el sistema.')) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blogestado: 'inactivo' })
      });
      const data = await res.json();
      if (data.success) {
        await loadArticles();
      } else {
        alert('Error al inactivar el artículo: ' + (data.error || 'Desconocido'));
      }
    } catch (err: any) {
      console.error(err);
      alert('Error de red al inactivar el artículo');
    } finally {
      setUpdatingId(null);
    }
  };

  // Cargar listado de entidades según tipo (Especie, Variedad, Labor)
  const fetchEntities = async (type: 'especie' | 'variedad' | 'labor') => {
    setLoadingEntities(true);
    setEntities([]);
    setSelectedEntity(null);
    setSelectedPdf(null);
    setPdfsList([]);
    
    try {
      const endpoint = type === 'especie' 
        ? '/api/admin/especiesvegetales' 
        : type === 'variedad' 
          ? '/api/admin/variedadesvegetales' 
          : '/api/admin/labores';

      const res = await fetch(endpoint, {
        headers: { 'x-user-email': userEmail || '' }
      });
      const data = await res.json();
      
      if (type === 'especie') setEntities(data.especies || []);
      else if (type === 'variedad') setEntities(data.variedades || []);
      else if (type === 'labor') setEntities(data.labores || []);
    } catch (err) {
      console.error('Error al cargar entidades:', err);
    } finally {
      setLoadingEntities(false);
    }
  };

  // Cargar PDFs para la entidad seleccionada
  const fetchPdfsForEntity = async (entityId: number, type: 'especie' | 'variedad' | 'labor') => {
    setLoadingPdfs(true);
    setSelectedPdf(null);
    setPdfsList([]);
    try {
      const endpoint = type === 'especie'
        ? `/api/admin/especiesvegetales/${entityId}/pdfs`
        : type === 'variedad'
          ? `/api/admin/variedadesvegetales/${entityId}/pdfs`
          : `/api/admin/labores/${entityId}/pdfs`;

      const res = await fetch(endpoint, {
        headers: { 'x-user-email': userEmail || '' }
      });
      const data = await res.json();
      setPdfsList(data.pdfs || []);
    } catch (err) {
      console.error('Error al cargar PDFs:', err);
    } finally {
      setLoadingPdfs(false);
    }
  };

  // Iniciar wizard
  const handleOpenWizard = () => {
    setWizardStep(1);
    setEntityType(null);
    setSelectedEntity(null);
    setSelectedPdf(null);
    setEntities([]);
    setPdfsList([]);
    setEntitySearch('');
    setInstructions('Escribe un post de blog para agricultores principiantes, con un tono motivador, consejos prácticos, emojis y una buena estructura de Markdown.');
    setGeneratingBlog(false);
    setGenerationSuccess(false);
    setShowWizard(true);
  };

  // Generar prompt dinámico para previsualización
  const buildPromptPreviewText = () => {
    if (!entityType || !selectedEntity) return 'Selecciona un elemento en los pasos anteriores para ver la estructura del prompt.';
    
    const nombreEntidad = selectedEntity.especiesvegetalesnombre || selectedEntity.variedadesvegetalesnombre || selectedEntity.laboresnombre || 'agronómico';
    const contextoTexto = entityType === 'labor' 
      ? `la labor agrícola "${nombreEntidad}"` 
      : entityType === 'variedad' 
        ? `la variedad "${nombreEntidad}"` 
        : `la especie "${nombreEntidad}"`;

    const fichaRapidaEjemplo = entityType === 'labor'
      ? `    {"icono": "📅", "label": "Época", "valor": "Mes-Mes"},
    {"icono": "⏱️", "label": "Duración", "valor": "X horas"}`
      : `    {"icono": "🌡️", "label": "Temp. Óptima", "valor": "XX-XX°C"},
    {"icono": "🗓️", "label": "Siembra", "valor": "Mes-Mes"}`;

    return `Actúa como un experto redactor de blogs agronómicos y de jardinería moderna. Vas a leer el documento adjunto sobre ${contextoTexto} y vas a escribir un artículo de blog profesional, SEO-optimizado y visualmente estructurado.

CONTEXTO: Este blog trata sobre ${entityType === 'labor' ? 'una LABOR AGRÍCOLA' : entityType === 'variedad' ? 'una VARIEDAD específica' : 'una ESPECIE vegetal'}.

INDICACIONES DEL USUARIO: "${instructions}"

REGLAS DE ESTRUCTURA OBLIGATORIAS (Blog Verdantia):
1. SIN PAJA: Párrafos de máximo 3 líneas. Ve directo al grano.
2. NEGRITAS en conceptos clave. DATOS CONCRETOS: cifras, temperaturas, riego.
3. TONO: Profesional pero cercano, de un agrónomo en el huerto.
4. TÍTULO: Título INTERROGATIVO (ej: "¿Cómo cultivar...?", "¿Cuándo podar...?").

Devuelve ÚNICAMENTE un JSON válido con esta estructura EXACTA:
{
  "titulo": "Título SEO interrogativo",
  "slug": "url-amigable",
  "resumen": "Resumen corto",
  "tags": ["#tag1", "#tag2"],
  "ficha_rapida": [
${fichaRapidaEjemplo}
  ],
  "secciones": [...],
  "consejos": {...},
  "cta": {...},
  "imagenes": [...]
}`;
  };

  // Disparar la generación del artículo mediante IA
  const handleGenerateBlog = async () => {
    if (!selectedPdf || !userEmail || !selectedEntity || !entityType) return;
    
    setGeneratingBlog(true);
    setBlogProgressMsg('Conectando con el servidor de Verdantia...');

    // Simulador de pasos para feedback interactivo del usuario
    const progressSteps = [
      'Descargando documento PDF de referencia del storage...',
      'Analizando texto técnico con Gemini 2.5 Flash...',
      'Escribiendo secciones optimizadas para SEO y posicionamiento orgánico...',
      'Generando imágenes realistas de 3:4 con Imagen 4.0...',
      'Insertando marca de agua de VERDANTIA en las imágenes...',
      'Guardando el nuevo borrador de artículo en la base de datos...'
    ];

    let currentMsgIdx = 0;
    const interval = setInterval(() => {
      if (currentMsgIdx < progressSteps.length) {
        setBlogProgressMsg(progressSteps[currentMsgIdx]);
        currentMsgIdx++;
      }
    }, 3200);

    try {
      const nombreEntidad = selectedEntity.especiesvegetalesnombre || selectedEntity.variedadesvegetalesnombre || selectedEntity.laboresnombre || 'agronómico';
      
      const payload = {
        pdfUrl: selectedPdf.ruta.startsWith('http') ? selectedPdf.ruta : `${window.location.origin}${selectedPdf.ruta.startsWith('/') ? '' : '/'}${selectedPdf.ruta}`,
        instructions: instructions,
        especieId: entityType === 'especie' ? selectedEntity.idespeciesvegetales : null,
        variedadId: entityType === 'variedad' ? selectedEntity.idvariedadesvegetales : null,
        laborId: entityType === 'labor' ? selectedEntity.idlabores : null,
        autorEmail: userEmail,
        especieNombre: nombreEntidad,
        contexto: {
          tipo: entityType,
          nombre: nombreEntidad
        },
        pdfSourceId: selectedPdf.id
      };

      const res = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      clearInterval(interval);

      if (data.success) {
        setBlogProgressMsg('🎉 ¡Todo listo!');
        setGenerationSuccess(true);
        setWizardStep(5);
        
        // Cierre automático y recarga de artículos (Regla 4 y 10)
        setTimeout(() => {
          setShowWizard(false);
          loadArticles();
        }, 2500);
      } else {
        alert('Error al generar el blog: ' + (data.error || 'Desconocido'));
        setGeneratingBlog(false);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      alert('Error de red al generar blog');
      setGeneratingBlog(false);
    }
  };

  // Filtrado final de artículos en tabla
  const articulosFiltrados = articulos.filter(art => {
    const cumpleFiltro = filtroEstado === 'todos' || art.blogestado === filtroEstado;
    const cumpleBusqueda = !searchQuery || 
      art.blogtitulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.especiesvegetalesnombre && art.especiesvegetalesnombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.variedadesvegetalesnombre && art.variedadesvegetalesnombre.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (art.autor && art.autor.toLowerCase().includes(searchQuery.toLowerCase()));
    return cumpleFiltro && cumpleBusqueda;
  });

  return (
    <div style={{ padding: '24px', width: '100%', boxSizing: 'border-box', fontFamily: 'system-ui, -apple-system, sans-serif', background: '#f8fafc', minHeight: '100vh' }}>
      
      {/* Estilos dinámicos inyectados para efectos interactivos */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-icon {
          animation: spin 1s linear infinite;
        }
        .wizard-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid #e2e8f0;
          cursor: pointer;
        }
        .wizard-card:hover {
          transform: translateY(-2px);
          border-color: #10b981 !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }
        .wizard-card.active {
          border-color: #10b981 !important;
          background-color: #f0fdf4 !important;
        }
        .tag-pill {
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .tag-pill:hover {
          background-color: #e2e8f0;
        }
        .tag-pill.active {
          background-color: #10b981 !important;
          color: white !important;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }
        .table-row {
          transition: background-color 0.15s ease;
        }
        .table-row:hover {
          background-color: #f1f5f9 !important;
        }
        .entity-badge-item {
          transition: all 0.15s ease;
          border: 1px solid #e2e8f0;
          cursor: pointer;
        }
        .entity-badge-item:hover {
          background-color: #f1f5f9;
          border-color: #cbd5e1;
        }
        .entity-badge-item.selected {
          background-color: #e0f2fe;
          border-color: #0284c7;
          color: #0369a1;
        }
      `}} />

      {/* Navegación jerárquica superior */}
      <div style={{ marginBottom: '16px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ── Subheader Global Degradado (Regla 7) ── */}
      <div style={{ background: 'linear-gradient(135deg, #10b981, #047857)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: 'white', boxShadow: '0 4px 15px rgba(4, 120, 87, 0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.025em' }}>📝 Gestión del Blog Agronómico</h1>
            <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              Redacta y publica artículos optimizados para SEO y embudos de conversión
            </p>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleOpenWizard} style={{ padding: '10px 18px', borderRadius: '10px', background: 'white', color: '#047857', border: 'none', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', transition: 'transform 0.15s ease' }}>
              ✨ Crear con IA
            </button>
            <Link href="/dashboard/admin/blog/nuevo" style={{ padding: '10px 18px', borderRadius: '10px', background: '#065f46', color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              ➕ Nuevo Manual
            </Link>
          </div>
        </div>

        {/* Filtros Rápidos Integrados en la Base del Subheader */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
          <button onClick={() => handleFiltroChange('todos')} className={`tag-pill ${filtroEstado === 'todos' ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            🔍 Todos
          </button>
          <button onClick={() => handleFiltroChange('borrador')} className={`tag-pill ${filtroEstado === 'borrador' ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            ✏️ Borradores
          </button>
          <button onClick={() => handleFiltroChange('publicado')} className={`tag-pill ${filtroEstado === 'publicado' ? 'active' : ''}`} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', border: 'none', background: 'rgba(255,255,255,0.15)', color: 'white' }}>
            🌐 Publicados
          </button>
        </div>
      </div>

      {/* Buscador de texto del dashboard */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Buscar artículo por título, especie, variedad o autor..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
        />
      </div>

      {/* Contenedor de la Tabla con Carga sin Flickering (Regla 7) */}
      <div style={{ position: 'relative', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        
        {/* Loading Overlay */}
        {(loading || updatingId !== null) && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Actualizando panel...</span>
            </div>
          </div>
        )}

        <div style={{ opacity: (loading || updatingId !== null) ? 0.6 : 1, transition: 'opacity 0.2s ease', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', position: 'sticky', left: 0, zIndex: 2, background: '#f8fafc' }}>Artículo</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Ficha Vinculada</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Estado</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Autor</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase' }}>Fecha Creación</th>
                <th style={{ padding: '16px 20px', color: '#475569', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {articulosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b' }}>
                    {loading ? 'Cargando listado...' : 'No se encontraron artículos que coincidan con la búsqueda.'}
                  </td>
                </tr>
              ) : (
                articulosFiltrados.map((art, idx) => {
                  const isZebra = idx % 2 === 1;
                  return (
                    <tr key={art.idblog} className="table-row" style={{ background: isZebra ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                      
                      {/* Titulo */}
                      <td style={{ padding: '16px 20px', position: 'sticky', left: 0, zIndex: 1, background: 'inherit', cursor: 'pointer' }} onClick={() => router.push(`/dashboard/admin/blog/${art.idblog}`)} title="Editar Artículo">
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', marginBottom: '4px' }}>
                          {art.blogtitulo}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                          slug: /{art.blogslug}
                        </span>
                      </td>

                      {/* Vinculado a */}
                      <td style={{ padding: '16px 20px' }}>
                        {art.especiesvegetalesnombre ? (
                          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>
                            🌱 {art.especiesvegetalesnombre}
                          </span>
                        ) : art.variedadesvegetalesnombre ? (
                          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', fontWeight: 600 }}>
                            🍇 {art.variedadesvegetalesnombre}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontWeight: 600 }}>
                            🔧 Labor / General
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          background: art.blogestado === 'publicado' ? '#e0f2fe' : '#fef3c7',
                          color: art.blogestado === 'publicado' ? '#0369a1' : '#92400e'
                        }}>
                          {art.blogestado === 'publicado' ? '🌐 PUBLICADO' : '✏️ BORRADOR'}
                        </span>
                      </td>

                      {/* Autor */}
                      <td style={{ padding: '16px 20px', color: '#334155', fontSize: '0.9rem' }}>
                        {art.autor || 'Sistema Verdantia'}
                      </td>

                      {/* Fecha */}
                      <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.9rem' }}>
                        {new Date(art.blogfechacreacion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Botonera Estandarizada (Regla 7) */}
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          
                          {/* Editar (Gris/Blanco) */}
                          <button 
                            onClick={() => router.push(`/dashboard/admin/blog/${art.idblog}`)}
                            title="Editar diseño y SEO"
                            style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#334155', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                          >
                            ✏️ Editar
                          </button>

                          {/* Alternador de Estado (Amarillo / Verde) */}
                          {art.blogestado === 'publicado' ? (
                            <button 
                              onClick={() => handleToggleEstado(art.idblog, 'publicado')}
                              title="Despublicar y pasar a borrador"
                              style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                              ⚠️ Despublicar
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleToggleEstado(art.idblog, 'borrador')}
                              title="Publicar en el sitio público"
                              style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                              🚀 Publicar
                            </button>
                          )}

                          {/* Inactivar (Naranja) */}
                          {art.blogestado !== 'inactivo' && (
                            <button 
                              onClick={() => handleInactivateArticle(art.idblog)}
                              title="Inactivar artículo sin borrarlo"
                              style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                            >
                              ⏸️ Inactivar
                            </button>
                          )}

                          {/* Eliminar (Rojo) */}
                          <button 
                            onClick={() => handleDeleteArticle(art.idblog)}
                            title="Eliminar artículo"
                            style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                          >
                            ✕ Eliminar
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────── */}
      {/* ── WIZARD ASISTENTE IA MODAL (Regla 10: Wizard Estándar) ── */}
      {/* ──────────────────────────────────────────────────────── */}
      {showWizard && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }}>
          
          <div style={{ width: '850px', maxWidth: '100%', maxHeight: '90vh', background: 'white', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ✨ Asistente de Blogs con IA
                </h2>
                {!generationSuccess && (
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px', display: 'block' }}>
                    Paso {wizardStep} de 4
                  </span>
                )}
              </div>
              <button 
                onClick={() => { if (!generatingBlog) setShowWizard(false); }}
                style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', color: '#94a3b8', cursor: 'pointer', outline: 'none' }}
                title="Cerrar"
                disabled={generatingBlog}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

              {/* PANTALLA DE ÉXITO EN GENERACIÓN (Regla 10: Success Screen) */}
              {generationSuccess ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '5rem', display: 'block', marginBottom: '20px', animation: 'bounce 1s infinite' }}>🎉</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#166534', margin: '0 0 10px 0' }}>
                    ¡Artículo Generado con Éxito!
                  </h3>
                  <p style={{ color: '#475569', margin: '0 0 24px 0', fontSize: '0.95rem', maxWidth: '450px' }}>
                    El borrador del artículo ha sido creado en tu panel junto con las fotos generadas por IA y la marca de agua Verdantia.
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 'bold' }}>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #e2e8f0', borderTop: '2px solid #10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Cerrando asistente y refrescando...
                  </div>
                </div>
              ) : (
                <div>
                  
                  {/* ========================================================= */}
                  {/* PASO 1: TIPO DE ENTIDAD */}
                  {/* ========================================================= */}
                  <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                    {wizardStep > 1 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>✅</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Paso 1: Tipo de contenido seleccionado</div>
                            <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                              {entityType === 'especie' ? '🌱 Especie o Hortaliza' : entityType === 'variedad' ? '🍇 Variedad Vegetal Específica' : '🔧 Labor Agrícola o Tarea'}
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setWizardStep(1)} 
                          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#10b981', color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>1</span>
                          ¿Sobre qué tipo de tema agrario deseas escribir hoy?
                        </h3>
                        <div style={{ marginLeft: '34px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                          
                          <div 
                            onClick={() => { setEntityType('especie'); fetchEntities('especie'); setWizardStep(2); }}
                            className={`wizard-card ${entityType === 'especie' ? 'active' : ''}`}
                            style={{ padding: '20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e2e8f0', background: 'white' }}
                          >
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🌱</span>
                            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem' }}>Especie / Hortaliza</strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Ej: Tomate, Lechuga, Calabacín</span>
                          </div>

                          <div 
                            onClick={() => { setEntityType('variedad'); fetchEntities('variedad'); setWizardStep(2); }}
                            className={`wizard-card ${entityType === 'variedad' ? 'active' : ''}`}
                            style={{ padding: '20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e2e8f0', background: 'white' }}
                          >
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🍇</span>
                            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem' }}>Variedad Específica</strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Ej: Tomate Raf, Pimiento de Padrón</span>
                          </div>

                          <div 
                            onClick={() => { setEntityType('labor'); fetchEntities('labor'); setWizardStep(2); }}
                            className={`wizard-card ${entityType === 'labor' ? 'active' : ''}`}
                            style={{ padding: '20px', borderRadius: '12px', textAlign: 'center', border: '2px solid #e2e8f0', background: 'white' }}
                          >
                            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🔧</span>
                            <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.95rem' }}>Labor Agrícola</strong>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>Ej: Poda de tomate, Abonado verde</span>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  {/* ========================================================= */}
                  {/* PASO 2: TEMA Y PDF DE REFERENCIA */}
                  {/* ========================================================= */}
                  <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                    {wizardStep > 2 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>✅</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Paso 2: Tema y PDF de origen</div>
                            <div style={{ fontSize: '0.82rem', color: '#15803d' }}>
                              Tema: <strong>{selectedEntity?.especiesvegetalesnombre || selectedEntity?.variedadesvegetalesnombre || selectedEntity?.laboresnombre}</strong> | PDF: <strong>{selectedPdf?.titulo || selectedPdf?.nombreOriginal}</strong>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setWizardStep(2)} 
                          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : wizardStep === 2 ? (
                      <div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#10b981', color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>2</span>
                          Selecciona el elemento y su PDF de referencia
                        </h3>
                        
                        <div style={{ marginLeft: '34px' }}>
                          
                          {/* Buscador de elemento */}
                          <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                              Buscar {entityType === 'especie' ? 'especie' : entityType === 'variedad' ? 'variedad' : 'labor'}
                            </label>
                            <input 
                              type="text" 
                              placeholder="Filtrar por nombre..."
                              value={entitySearch}
                              onChange={(e) => setEntitySearch(e.target.value)}
                              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                            />
                          </div>

                          {/* Listado de elementos en rejilla */}
                          {loadingEntities ? (
                            <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '10px 0' }}>Cargando elementos...</div>
                          ) : (
                            <div style={{ maxHeight: '160px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px', display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', background: '#f8fafc' }}>
                              {entities
                                .filter(e => {
                                  const n = e.especiesvegetalesnombre || e.variedadesvegetalesnombre || e.laboresnombre || '';
                                  return n.toLowerCase().includes(entitySearch.toLowerCase());
                                })
                                .map(e => {
                                  const id = e.idespeciesvegetales || e.idvariedadesvegetales || e.idlabores;
                                  const name = e.especiesvegetalesnombre || e.variedadesvegetalesnombre || e.laboresnombre;
                                  const isSelected = selectedEntity && (selectedEntity.idespeciesvegetales === id || selectedEntity.idvariedadesvegetales === id || selectedEntity.idlabores === id);
                                  
                                  return (
                                    <div 
                                      key={id}
                                      onClick={() => {
                                        setSelectedEntity(e);
                                        setSelectedPdf(null);
                                        fetchPdfsForEntity(id, entityType!);
                                      }}
                                      className={`entity-badge-item ${isSelected ? 'selected' : ''}`}
                                      style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600, background: 'white' }}
                                    >
                                      {entityType === 'especie' ? '🌱' : entityType === 'variedad' ? '🍇' : '🔧'} {name}
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* Selección de PDF */}
                          {selectedEntity && (
                            <div style={{ marginTop: '16px' }}>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>
                                Documento PDF de Referencia
                              </label>

                              {loadingPdfs ? (
                                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Buscando PDFs vinculados...</div>
                              ) : pdfsList.length === 0 ? (
                                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '16px', color: '#92400e' }}>
                                  <div style={{ fontSize: '0.88rem', fontWeight: 'bold', marginBottom: '6px' }}>
                                    ⚠️ No se encontraron PDFs de referencia cargados
                                  </div>
                                  <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', lineHeight: 1.4 }}>
                                    Para generar un artículo sobre <strong>{selectedEntity.especiesvegetalesnombre || selectedEntity.variedadesvegetalesnombre || selectedEntity.laboresnombre}</strong> mediante IA, necesitas subir antes al menos un PDF técnico de referencia.
                                  </p>
                                  <button
                                    onClick={() => {
                                      setShowWizard(false);
                                      router.push(`/dashboard/admin/${entityType === 'especie' ? 'especies' : entityType === 'variedad' ? 'variedades' : 'labores'}`);
                                    }}
                                    style={{ background: '#d97706', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.78rem', cursor: 'pointer' }}
                                  >
                                    Ir a cargar PDF ahora
                                  </button>
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                  {pdfsList.map(pdf => {
                                    const isSelected = selectedPdf && selectedPdf.id === pdf.id;
                                    return (
                                      <div 
                                        key={pdf.id}
                                        onClick={() => setSelectedPdf(pdf)}
                                        className={`wizard-card ${isSelected ? 'active' : ''}`}
                                        style={{ padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', border: '2px solid #e2e8f0', background: 'white' }}
                                      >
                                        <span style={{ fontSize: '1.6rem' }}>📄</span>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          <strong style={{ display: 'block', fontSize: '0.85rem', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {pdf.titulo || pdf.nombreOriginal}
                                          </strong>
                                          <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {pdf.resumen || 'Sin resumen'}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Botones de acción */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <button
                              disabled={!selectedPdf}
                              onClick={() => setWizardStep(3)}
                              style={{ 
                                padding: '8px 20px', 
                                background: selectedPdf ? '#10b981' : '#cbd5e1', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '8px', 
                                cursor: selectedPdf ? 'pointer' : 'not-allowed', 
                                fontWeight: 'bold', 
                                fontSize: '0.88rem' 
                              }}
                            >
                              Continuar →
                            </button>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.4 }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#cbd5e1', color: '#64748b', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>2</span>
                          Selección del elemento y PDF (Pendiente)
                        </h3>
                      </div>
                    )}
                  </div>

                  {/* ========================================================= */}
                  {/* PASO 3: INSTRUCCIONES Y PROMPT */}
                  {/* ========================================================= */}
                  <div style={{ marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
                    {wizardStep > 3 ? (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '12px 16px', borderRadius: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.25rem' }}>✅</span>
                          <div>
                            <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Paso 3: Instrucciones de redacción</div>
                            <div style={{ fontSize: '0.82rem', color: '#15803d', maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              "{instructions}"
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setWizardStep(3)} 
                          style={{ background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : wizardStep === 3 ? (
                      <div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#10b981', color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>3</span>
                          Instrucciones personalizadas y visualización del Prompt
                        </h3>

                        <div style={{ marginLeft: '34px' }}>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                            
                            {/* Inputs e Instrucciones */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                                Instrucciones adicionales para el redactor IA
                              </label>
                              <textarea 
                                rows={5}
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Indica detalles de tono, extensión, enfoques específicos, palabras clave primarias, etc..."
                                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit', resize: 'vertical' }}
                              />
                              <p style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px', lineHeight: 1.3 }}>
                                💡 Puedes pedirle a la IA que se centre en ciertos tipos de suelo, plagas locales, calendario lunar o especificaciones climáticas para una mayor relevancia SEO.
                              </p>
                            </div>

                            {/* Prompt Real Inyectado */}
                            <div>
                              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', marginBottom: '6px' }}>
                                ⚙️ Prompt que ejecutará el Asistente IA
                              </label>
                              <div style={{ height: '180px', overflowY: 'auto', background: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.7rem', lineHeight: 1.4, whiteSpace: 'pre-wrap', border: '1px solid #1e293b' }}>
                                {buildPromptPreviewText()}
                              </div>
                            </div>

                          </div>

                          {/* Botones de acción */}
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                            <button
                              onClick={() => setWizardStep(4)}
                              style={{ padding: '8px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88rem' }}
                            >
                              Continuar →
                            </button>
                          </div>

                        </div>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.4 }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#cbd5e1', color: '#64748b', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>3</span>
                          Instrucciones personalizadas y Prompt (Pendiente)
                        </h3>
                      </div>
                    )}
                  </div>

                  {/* ========================================================= */}
                  {/* PASO 4: CONFIRMACIÓN Y GENERACIÓN */}
                  {/* ========================================================= */}
                  <div>
                    {wizardStep === 4 ? (
                      <div>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#10b981', color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 800 }}>4</span>
                          Confirmar y Generar Artículo de Blog
                        </h3>

                        <div style={{ marginLeft: '34px' }}>
                          
                          {generatingBlog ? (
                            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                              <div style={{ width: '45px', height: '45px', border: '4px solid #f3f3f3', borderTop: '4px solid #8b5cf6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                              <div>
                                <h4 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '0.95rem', fontWeight: 750 }}>
                                  El Asistente de IA está redactando el blog
                                </h4>
                                <span style={{ fontSize: '0.82rem', color: '#6d28d9', fontWeight: 700, transition: 'all 0.3s ease' }}>
                                  {blogProgressMsg}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', maxWidth: '350px', lineHeight: 1.3 }}>
                                Esto puede tardar unos 15-30 segundos ya que la IA leerá el PDF completo, redactará el contenido estructurado y generará 3 imágenes fotorrealistas de 3:4 con marcas de agua.
                              </p>
                            </div>
                          ) : (
                            <div>
                              
                              {/* Caja de Resumen */}
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>
                                  Resumen de la Orden de Redacción
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: '0.85rem' }}>
                                  
                                  <span style={{ color: '#64748b', fontWeight: 500 }}>Tipo de Tema:</span>
                                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                    {entityType === 'especie' ? '🌱 Especie / Hortaliza' : entityType === 'variedad' ? '🍇 Variedad Vegetal' : '🔧 Labor Agrícola'}
                                  </span>

                                  <span style={{ color: '#64748b', fontWeight: 500 }}>Tema Principal:</span>
                                  <span style={{ color: '#0f172a', fontWeight: 700 }}>
                                    {selectedEntity?.especiesvegetalesnombre || selectedEntity?.variedadesvegetalesnombre || selectedEntity?.laboresnombre}
                                  </span>

                                  <span style={{ color: '#64748b', fontWeight: 500 }}>PDF de Referencia:</span>
                                  <span style={{ color: '#0f172a', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                    {selectedPdf?.titulo || selectedPdf?.nombreOriginal}
                                  </span>

                                  <span style={{ color: '#64748b', fontWeight: 500 }}>Instrucciones:</span>
                                  <span style={{ color: '#334155', fontStyle: 'italic' }}>
                                    "{instructions}"
                                  </span>

                                </div>
                              </div>

                              {/* Botones de acción final */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                                <button
                                  onClick={() => setWizardStep(3)}
                                  style={{ padding: '8px 16px', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                                >
                                  ← Atrás
                                </button>
                                <button
                                  onClick={handleGenerateBlog}
                                  style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(139, 92, 246, 0.2)' }}
                                >
                                  🚀 Generar Artículo con IA
                                </button>
                              </div>

                            </div>
                          )}

                        </div>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.4 }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: '#cbd5e1', color: '#64748b', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>4</span>
                          Confirmar y Generar Artículo (Pendiente)
                        </h3>
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

