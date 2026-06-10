export const PLAN_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  premium:  { color: '#d97706', bg: '#fffbeb', icon: '👑', label: 'Premium' },
  avanzado: { color: '#2563eb', bg: '#eff6ff', icon: '💎', label: 'Avanzado' },
  esencial: { color: '#059669', bg: '#f0fdf4', icon: '🚀', label: 'Esencial' },
  gratuito: { color: '#64748b', bg: '#f8fafc', icon: '🆓', label: 'Gratuito' }
};

export const ROL_CONFIG: Record<string, { color: string; bg: string }> = {
  superadministrador: { color: '#9f1239', bg: '#fff1f2' },
  administrador:      { color: '#0f766e', bg: '#f0fdfa' },
  usuario:            { color: '#1d4ed8', bg: '#eff6ff' },
  visitante:          { color: '#64748b', bg: '#f8fafc' },
};

export function getPlanConfig(plan?: string) {
  return PLAN_CONFIG[(plan || '').toLowerCase()] || PLAN_CONFIG['gratuito'];
}

export function getRolConfig(rol?: string) {
  const r = (rol || '').toLowerCase().split(',')[0].trim();
  return ROL_CONFIG[r] || ROL_CONFIG['visitante'];
}
