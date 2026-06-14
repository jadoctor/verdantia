export interface DashboardItem {
  lines: number;
  path: string;
  file: string;
  refactoredAt: string | null;
  responsiveAt: string | null;
}

export const FRIENDLY_NAMES: Record<string, string> = {
  '/dashboard/perfil': '👤 Perfil: Detalle',
  '/dashboard': '🏠 Panel Principal',
  '/dashboard/admin/guia-usuario': '📖 Guía del Usuario',
  '/dashboard/admin/mantenimiento': '📁 Mantenimiento: Copias de Seguridad',
  '/dashboard/admin/mantenimiento/analisis': '📊 Mantenimiento: Análisis de Dashboards',
  '/dashboard/admin/mantenimiento/biblia': '📜 Mantenimiento: La Biblia (Normas)',
  '/dashboard/mis-plantas': '🪴 Mis Plantas: Listado',
  '/dashboard/cultivos': '🚜 Cultivos: Listado',
  '/dashboard/onboarding': '🚀 Onboarding: Bienvenida',
  '/dashboard/semillas': '🫘 Semillas: Listado',
  '/dashboard/comunidad': '👥 Comunidad: Foro',
  '/dashboard/admin/usuarios': '👥 Usuarios: Listado',
  '/dashboard/admin/ajustes/avisos': '🔔 Avisos: Listado/Gestión',
  '/dashboard/admin/ajustes/logros': '🏆 Logros: Listado/Gestión',
  '/dashboard/admin/plagas': '🐛 Plagas: Listado/Gestión',
  '/dashboard/admin/asuntos-realizados': '✅ Asuntos Realizados: Listado',
  '/dashboard/meteo': '🌦️ Meteorología: Información',
  '/dashboard/admin/tareas/contenedores': '📦 Contenedores: Listado/Gestión',
  '/dashboard/admin/labores': '🧹 Labores: Listado',
  '/dashboard/admin/fases': '🌱 Fases de cultivo: Listado',
  '/dashboard/admin/asuntos-pendientes': '📝 Asuntos Pendientes: Listado',
  '/dashboard/admin/variedades': '🍇 Variedades: Listado',
  '/dashboard/admin/ajustes/idiomas': '🌐 Idiomas: Ajustes',
  '/dashboard/admin/ajustes/paises': '🗺️ Países: Ajustes',
  '/dashboard/admin/blog': '📰 Blog: Listado',
  '/dashboard/demo-rangos': '📊 Demo: Rangos',
  '/dashboard/admin/especies': '🌍 Especies globales: Listado',
  '/dashboard/admin/especies/[id]': '🌍 Especies globales: Edición',
  '/dashboard/admin/familias': '🧬 Familias botánicas: Listado',
  '/dashboard/admin/familias/[id]': '🧬 Familias botánicas: Edición',
  '/dashboard/admin/labores/nueva': '🧹 Labores: Creación',
  '/dashboard/admin/especies/nueva': '🌍 Especies globales: Creación',
  '/dashboard/admin/meteo': '🌦️ Meteorología: Ajustes',
  '/dashboard/admin/chat': '💬 Chat: Gestión',
  '/dashboard/tareas': '📋 Tareas: Listado',
  '/dashboard/admin/ajustes': '⚙️ Ajustes: Generales',
  '/dashboard/bancales/[id]': '🧱 Bancales: Detalle/Edición',
  '/dashboard/semillas/[id]': '🫘 Semillas: Detalle/Edición',
  '/dashboard/mis-plantas/[id]': '🪴 Mis Plantas: Detalle/Edición',
  '/dashboard/cultivos/[id]': '🚜 Cultivos: Detalle/Edición',
  '/dashboard/admin/variedades/[id]': '🍇 Variedades: Edición',
  '/dashboard/admin/usuarios/[id]': '👥 Usuarios: Detalle/Edición',
  '/dashboard/admin/tareas/contenedores/[id]': '📦 Contenedores: Detalle/Edición',
  '/dashboard/admin/labores/[id]': '🧹 Labores: Edición',
  '/dashboard/admin/blog/[id]': '📰 Blog: Edición',
  '/dashboard/admin/fases/[id]': '🌱 Fases de cultivo: Edición'
};

export const DASHBOARD_GROUPS = [
  { id: 'all', label: '📂 Todos los grupos' },
  { id: 'inicio', label: '🏠 Inicio' },
  { id: 'mantenimiento', label: '🛠️ Mantenimiento' },
  { id: 'especies', label: '🌍 Especies globales' },
  { id: 'familias', label: '🧬 Familias botánicas' },
  { id: 'labores', label: '🧹 Labores' },
  { id: 'fases', label: '🌱 Fases de cultivo' },
  { id: 'blog', label: '📰 Blog' },
  { id: 'semillas', label: '🫘 Semillas' },
  { id: 'plantas', label: '🪴 Mis Plantas' },
  { id: 'cultivos', label: '🚜 Cultivos' },
  { id: 'bancales', label: '🧱 Bancales' },
  { id: 'usuarios', label: '👥 Usuarios' },
  { id: 'contenedores', label: '📦 Contenedores' },
  { id: 'variedades', label: '🍇 Variedades' },
  { id: 'ajustes', label: '⚙️ Ajustes y Configuración' },
  { id: 'otros', label: '🧩 Otros' }
];

export const getDashboardGroup = (path: string): string => {
  if (path === '/dashboard') return 'inicio';
  if (path.includes('/mantenimiento')) return 'mantenimiento';
  if (path.includes('/especies')) return 'especies';
  if (path.includes('/familias')) return 'familias';
  if (path.includes('/labores')) return 'labores';
  if (path.includes('/fases')) return 'fases';
  if (path.includes('/blog')) return 'blog';
  if (path.includes('/semillas')) return 'semillas';
  if (path.includes('/mis-plantas')) return 'plantas';
  if (path.includes('/cultivos')) return 'cultivos';
  if (path.includes('/bancales')) return 'bancales';
  if (path.includes('/usuarios')) return 'usuarios';
  if (path.includes('/contenedores')) return 'contenedores';
  if (path.includes('/variedades')) return 'variedades';
  if (
    path.includes('/ajustes') || 
    path.includes('/idiomas') || 
    path.includes('/paises') || 
    path.includes('/meteo') || 
    path.includes('/chat') ||
    path.includes('/perfil')
  ) {
    return 'ajustes';
  }
  return 'otros';
};

export const getCategory = (lines: number): { label: string; emoji: string; bg: string; color: string } => {
  if (lines > 1000) return { label: 'Monolito',  emoji: '🔴', bg: '#fef2f2', color: '#b91c1c' };
  if (lines > 500)  return { label: 'Complejo',  emoji: '🟠', bg: '#fff7ed', color: '#c2410c' };
  if (lines > 200)  return { label: 'Estándar',  emoji: '🟡', bg: '#fefce8', color: '#92400e' };
  if (lines > 50)   return { label: 'Ligero',    emoji: '🟢', bg: '#f0fdf4', color: '#15803d' };
  return               { label: 'Stub',       emoji: '⚪', bg: '#f8fafc', color: '#64748b' };
};

export const dashboards: DashboardItem[] = [
  { lines: 7109, path: '/dashboard/bancales/[id]', file: 'bancales/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 150, path: '/dashboard/perfil', file: 'perfil/page.tsx', refactoredAt: '13/06/2026', responsiveAt: '13/06/2026' },
  { lines: 2009, path: '/dashboard/admin/usuarios/[id]', file: 'admin/usuarios/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 1295, path: '/dashboard/mis-plantas/[id]', file: 'mis-plantas/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 1261, path: '/dashboard/admin/tareas/contenedores/[id]', file: 'admin/tareas/contenedores/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 1215, path: '/dashboard/semillas/[id]', file: 'semillas/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 1066, path: '/dashboard/admin/blog', file: 'admin/blog/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 1035, path: '/dashboard/mis-plantas', file: 'mis-plantas/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 996, path: '/dashboard/admin/blog/[id]', file: 'admin/blog/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 913, path: '/dashboard/admin/familias/[id]', file: 'admin/familias/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 128, path: '/dashboard/admin/mantenimiento/analisis', file: 'admin/mantenimiento/analisis/page.tsx', refactoredAt: '13/06/2026', responsiveAt: '13/06/2026' },
  { lines: 134, path: '/dashboard/admin/mantenimiento', file: 'admin/mantenimiento/page.tsx', refactoredAt: '13/06/2026', responsiveAt: '13/06/2026' },
  { lines: 560, path: '/dashboard/cultivos', file: 'cultivos/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 130, path: '/dashboard/admin/mantenimiento/biblia', file: 'admin/mantenimiento/biblia/page.tsx', refactoredAt: '13/06/2026', responsiveAt: '13/06/2026' },
  { lines: 486, path: '/dashboard/onboarding', file: 'onboarding/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 91, path: '/dashboard/admin/fases/[id]', file: 'admin/fases/[id]/page.tsx', refactoredAt: '13/06/2026', responsiveAt: null },
  { lines: 447, path: '/dashboard/semillas', file: 'semillas/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 439, path: '/dashboard/comunidad', file: 'comunidad/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 422, path: '/dashboard/admin/familias', file: 'admin/familias/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 383, path: '/dashboard/cultivos/[id]', file: 'cultivos/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 327, path: '/dashboard/admin/usuarios', file: 'admin/usuarios/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 286, path: '/dashboard/admin/ajustes/avisos', file: 'admin/ajustes/avisos/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 280, path: '/dashboard/admin/ajustes/logros', file: 'admin/ajustes/logros/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 273, path: '/dashboard/admin/plagas', file: 'admin/plagas/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 279, path: '/dashboard/admin/fases', file: 'admin/fases/page.tsx', refactoredAt: null, responsiveAt: '13/06/2026' },
  { lines: 260, path: '/dashboard/admin/asuntos-realizados', file: 'admin/asuntos-realizados/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 257, path: '/dashboard/meteo', file: 'meteo/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 213, path: '/dashboard/admin/tareas/contenedores', file: 'admin/tareas/contenedores/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 208, path: '/dashboard/admin/labores', file: 'admin/labores/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 169, path: '/dashboard/admin/asuntos-pendientes', file: 'admin/asuntos-pendientes/page.tsx', refactoredAt: '11/06/2026', responsiveAt: null },
  { lines: 156, path: '/dashboard/admin/variedades', file: 'admin/variedades/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 149, path: '/dashboard/admin/ajustes/idiomas', file: 'admin/ajustes/idiomas/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 136, path: '/dashboard', file: 'page.tsx', refactoredAt: '13/06/2026', responsiveAt: '13/06/2026' },
  { lines: 135, path: '/dashboard/admin/ajustes/paises', file: 'admin/ajustes/paises/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 60, path: '/dashboard/demo-rangos', file: 'demo-rangos/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 47, path: '/dashboard/admin/especies', file: 'admin/especies/page.tsx', refactoredAt: '13/06/2026', responsiveAt: '13/06/2026' },
  { lines: 32, path: '/dashboard/admin/labores/[id]', file: 'admin/labores/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 28, path: '/dashboard/admin/especies/[id]', file: 'admin/especies/[id]/page.tsx', refactoredAt: '13/06/2026', responsiveAt: '13/06/2026' },
  { lines: 28, path: '/dashboard/admin/especies/nueva', file: 'admin/especies/nueva/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 27, path: '/dashboard/admin/labores/nueva', file: 'admin/labores/nueva/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 25, path: '/dashboard/admin/meteo', file: 'admin/meteo/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 25, path: '/dashboard/admin/chat', file: 'admin/chat/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 13, path: '/dashboard/tareas', file: 'tareas/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 12, path: '/dashboard/admin/variedades/[id]', file: 'admin/variedades/[id]/page.tsx', refactoredAt: null, responsiveAt: null },
  { lines: 6, path: '/dashboard/admin/ajustes', file: 'admin/ajustes/page.tsx', refactoredAt: null, responsiveAt: null }
];

export const analisisApi = {
  async getChangesPreview(email: string) {
    const res = await fetch(`/api/admin/mantenimiento/backup?t=${Date.now()}`, {
      headers: { 'x-user-email': email }
    });
    if (!res.ok) throw new Error('Error fetching changes preview');
    return res.json();
  },

  async runAnalysis(file: string, email: string) {
    const res = await fetch(`/api/admin/mantenimiento/analizar?path=${encodeURIComponent(file)}&t=${Date.now()}`, {
      headers: { 'x-user-email': email }
    });
    if (!res.ok) throw new Error('Error performing analysis');
    return res.json();
  }
};
