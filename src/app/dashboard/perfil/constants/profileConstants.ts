export const getMaxPhotos = (plan: string = 'Gratuito') => {
  const p = (plan || '').toLowerCase();
  if (p === 'premium') return 4;
  if (p === 'avanzado' || p === 'pro') return 3;
  if (p === 'esencial' || p === 'plus') return 2;
  return 1; // Gratuito / Free / visitante / sin plan
};

export const AVATAR_ICONS = [
  '🌱','🌿','🍀','🍃','🌾','🌻','🌷','🌹','🌵','🌴','🍄','🪴',
  '🐝','🦋','🐞','🐛','🐌','🐇','🦉','🐦','🦆','🐓','🐢','🦔',
  '🐸','🐟','🐑','🐐','🐄','🐎','🐕','🐈','🦜','🦚','🦢'
];

export const MOTIVOS_BAJA = [
  'No encuentro lo que busco',
  'Dudas sobre la privacidad',
  'Faltan funcionalidades',
  'He encontrado otra solución',
  'El precio de los planes es elevado',
  'Recibo demasiadas notificaciones',
  'Solo quería probar la aplicación',
  'Voy a crear una cuenta nueva',
  'Problemas técnicos constantes',
  'Otro'
];

export const PAISES = [
  'España', 'Andorra', 'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia',
  'Costa Rica', 'Cuba', 'Ecuador', 'El Salvador', 'Estados Unidos', 'Guatemala',
  'Honduras', 'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Portugal',
  'Puerto Rico', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otro...'
];

export const STYLE_FILTERS: Record<string, string> = {
  '': 'none',
  comic: 'contrast(1.45) saturate(1.55) brightness(1.08)',
  manga: 'grayscale(1) contrast(1.85) brightness(1.1)',
  watercolor: 'saturate(1.35) contrast(0.88) brightness(1.14)',
  sketch: 'grayscale(1) contrast(2.2) brightness(1.18)',
  pop: 'saturate(1.95) contrast(1.3) brightness(1.06)',
  vintage: 'sepia(0.65) contrast(1.08) saturate(0.78) brightness(1.03)',
  cinematic: 'contrast(1.22) saturate(0.72) hue-rotate(338deg) brightness(0.98)',
  hdr: 'contrast(1.35) saturate(1.3) brightness(1.07)'
};
