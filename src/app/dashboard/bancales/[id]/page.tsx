'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ArrowLeft, Search, Plus, Minus, Move, RefreshCw, 
  Trash2, Layers, Check, AlertTriangle, ShieldAlert, Sparkles, Sprout, Ruler, Grid,
  ChevronLeft, ChevronRight
} from 'lucide-react';

const ACCESSORIES_LIBRARY = [
  { id: 'arbol_frutal', nombre: 'Árbol Frutal', icono: '🌳', desc: 'Añade sombra y frutos a tu huerto.', tamaño: 'Grande (1.5m)' },
  { id: 'naranjo_frutal', nombre: 'Árbol Naranjo', icono: '🍊', desc: 'Árbol frutal cítrico de naranjas aromáticas.', tamaño: 'Grande (1.5m)' },
  { id: 'pino_decorativo', nombre: 'Pino Decorativo', icono: '🌲', desc: 'Barrera visual o cortavientos.', tamaño: 'Mediano (1m)' },
  { id: 'valla_madera', nombre: 'Valla de Madera', icono: '🪵', desc: 'Delimita y protege tu bancal.', tamaño: 'Largo ajustable' },
  { id: 'camino_piedra', nombre: 'Camino de Piedra', icono: '🪨', desc: 'Sendero transitable entre cultivos.', tamaño: 'Fácil colocación' },
  { id: 'espantapajaros', nombre: 'Espantapájaros', icono: '🤠', desc: 'Protege tus brotes de aves.', tamaño: 'Punto fijo' },
  { id: 'estanque_agua', nombre: 'Estanque / Pozo', icono: '⛲', desc: 'Reserva de agua y biodiversidad.', tamaño: 'Circular (1.2m)' },
  { id: 'aspersor_riego', nombre: 'Aspersor Riego', icono: '💧', desc: 'Microaspersión automática.', tamaño: 'Radio 2m' }
];

const getAccessoryPhysicalRadius = (type: string) => {
  switch (type) {
    case 'arbol_frutal': return 0.75; // 1.5m diameter
    case 'naranjo_frutal': return 0.75; // 1.5m diameter
    case 'pino_decorativo': return 0.5; // 1.0m diameter
    case 'valla_madera': return 0.3; // 0.6m diameter
    case 'camino_piedra': return 0.25; // 0.5m diameter
    case 'espantapajaros': return 0.3; // 0.6m diameter
    case 'estanque_agua': return 0.6; // 1.2m diameter
    case 'aspersor_riego': return 0.4; // 0.8m diameter
    default: return 0.4;
  }
};


// Helper: Renders species icon as inline mini-SVG or emoji for HTML contexts
const renderSpeciesIcon = (icon: string, size: string = '1.8rem') => {
  if (!icon || !icon.startsWith('/')) {
    return <span style={{ fontSize: size, lineHeight: '1.2' }}>{icon || '🌱'}</span>;
  }
  const name = icon.split('/').pop();
  const s = parseFloat(size) * 16; // approximate rem to px

  if (name === 'tomate') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block' }}>
        <circle cx={16} cy={17} r={12} fill="#e53e3e" />
        <circle cx={13} cy={14} r={10} fill="#f56565" opacity={0.5} />
        <line x1={16} y1={8} x2={16} y2={3} stroke="#276749" strokeWidth={2.5} strokeLinecap="round" />
        <ellipse cx={20} cy={4} rx={5} ry={2.2} fill="#38a169" transform="rotate(-30 20 4)" />
      </svg>
    );
  }

  if (name === 'calabacin') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: 'block' }}>
        <g transform="rotate(-25 16 16)">
          <ellipse cx={16} cy={16} rx={14} ry={5.5} fill="#48bb78" />
          <ellipse cx={25} cy={16} rx={4} ry={5.5} fill="#2f855a" />
          <ellipse cx={14} cy={14} rx={7} ry={2} fill="#68d391" opacity={0.5} />
          <line x1={2} y1={16} x2={-2} y2={13} stroke="#276749" strokeWidth={1.8} strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // Fallback
  return <span style={{ fontSize: size, lineHeight: '1.2' }}>🌱</span>;
};

export default function BancalWorkspace() {
  const router = useRouter();
  const params = useParams();
  const bedId = params.id as string;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bancal, setBancal] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<any | null>(null);
  const [showMeasures, setShowMeasures] = useState(true);
  const [showPlantingFrames, setShowPlantingFrames] = useState(true);
  const [showBedGuides, setShowBedGuides] = useState(true);
  const [bedAlignment, setBedAlignment] = useState<'vertical' | 'horizontal'>('vertical');

  const [allActiveCrops, setAllActiveCrops] = useState<any[]>([]);
  const [placingCrop, setPlacingCrop] = useState<any | null>(null);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [hoveredCropToPreview, setHoveredCropToPreview] = useState<any | null>(null);

  // Accessories State
  const [placedAccessories, setPlacedAccessories] = useState<any[]>([]);
  const [placingAccessory, setPlacingAccessory] = useState<any | null>(null);
  const [draggingAccessory, setDraggingAccessory] = useState<any | null>(null);
  const [selectedAccessory, setSelectedAccessory] = useState<any | null>(null);
  
  // Custom Crops visual scales (ID to physical radius in meters)
  const [cropScales, setCropScales] = useState<Record<number, number>>({});

  // Continuous Paths states
  const [placedPaths, setPlacedPaths] = useState<any[]>([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [drawnPathPoints, setDrawnPathPoints] = useState<{ x: number; y: number }[]>([]);
  const [pathWidthMeters, setPathWidthMeters] = useState(0.4);
  const [selectedPath, setSelectedPath] = useState<any | null>(null);
  const [mouseSvgPos, setMouseSvgPos] = useState<{ x: number; y: number } | null>(null);
  const [draggingPath, setDraggingPath] = useState<any | null>(null);
  const [dragPathStartCoords, setDragPathStartCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragPathStartPoints, setDragPathStartPoints] = useState<{ x: number; y: number }[]>([]);
  
  // ── NANO BANANA AI RENDER ASSISTANT STATES ──
  const [showNanoBananaModal, setShowNanoBananaModal] = useState(false);
  const [nanoBananaLoading, setNanoBananaLoading] = useState(false);
  const [nanoBananaLogs, setNanoBananaLogs] = useState<string[]>([]);

  // Zoom & Pan for realistic canvas
  const [realisticZoom, setRealisticZoom] = useState(1);
  const [realisticPan, setRealisticPan] = useState({ x: 0, y: 0 });
  const [isDraggingRealistic, setIsDraggingRealistic] = useState(false);
  const [dragStartRealistic, setDragStartRealistic] = useState({ x: 0, y: 0 });

  const flattenedCrops = React.useMemo(() => {
    const flat: any[] = [];
    crops.forEach(crop => {
      if (crop.ubicaciones && crop.ubicaciones.length > 0) {
        crop.ubicaciones.forEach((ub: any, index: number) => {
          if (String(ub.xcultivosubicacionesidbancales) === String(bedId)) {
            flat.push({
              ...crop,
              idcultivos: `${crop.idcultivos}_${ub.idcultivosubicaciones}`,
              originalIdCultivos: crop.idcultivos,
              cultivosposicionx: ub.cultivosubicacionesposicionx,
              cultivosposiciony: ub.cultivosubicacionesposiciony,
              idUbicacion: ub.idcultivosubicaciones,
              cultivoscantidad: 1,
              _globalUbicacionIndex: index + 1
            });
          }
        });
      } else if (String(crop.xcultivosidbancales) === String(bedId) && crop.cultivosposicionx != null && crop.cultivosposiciony != null) {
        flat.push(crop);
      }
    });
    return flat;
  }, [crops, bedId]);

  const handleRealisticMouseDown = (e: React.MouseEvent) => {
    if (realisticZoom <= 1) return;
    setIsDraggingRealistic(true);
    setDragStartRealistic({ x: e.clientX - realisticPan.x, y: e.clientY - realisticPan.y });
  };

  const handleRealisticMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRealistic) return;
    const newX = e.clientX - dragStartRealistic.x;
    const newY = e.clientY - dragStartRealistic.y;
    // max pan offset relative to zoom level to avoid dragging out of bounds
    const maxPan = (realisticZoom - 1) * 480;
    setRealisticPan({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY))
    });
  };

  const handleRealisticWheel = (e: React.WheelEvent) => {
    // Zoom in on scroll up, zoom out on scroll down
    const zoomFactor = e.deltaY < 0 ? 0.15 : -0.15;
    setRealisticZoom(z => {
      const nextZ = Math.max(1, Math.min(5, z + zoomFactor));
      if (nextZ === 1) {
        setRealisticPan({ x: 0, y: 0 });
      }
      return nextZ;
    });
  };

  const triggerNanoBanana = () => {
    setShowNanoBananaModal(true);
    setNanoBananaLoading(true);
    setNanoBananaLogs([]);
    setRealisticZoom(1);
    setRealisticPan({ x: 0, y: 0 });

    const numCaminos = placedPaths.length;
    const numPasillos = bancal?.bancalesforma === 'circular' ? 0 : getBedSegments().filter((s: any) => s.type === 'pasillo').length;
    
    const logs = [
      "🍌 [0.0s] Conectando con el motor gráfico de IA local Nano Banana...",
      "🔬 [0.2s] Inicializando sensores de suelo y compost orgánico...",
      `📐 [0.5s] Escaneando cotas físicas del bancal: "${bancal?.bancalesnombre || 'Bancal'}" (${bedW}x${bedL}m)...`,
      `🛣️ [0.8s] Clasificando accesos: Detectados ${numCaminos} caminos de piedra (trazados) y ${numPasillos} pasillos de servicio (de diseño)...`,
      `🔎 [1.1s] Identificando especies botánicas y variedades activas en el diseño...`,
      `🌱 [1.4s] Analizando estado de germinación y fenología de los cultivos...`,
      "✍️ [1.7s] Trazando bosquejo artístico e imperfecto a mano alzada en papel de jardín...",
      "🎨 [2.0s] Aplicando acuarela, rayado de lápiz y estacas de tutoría (no germinados)...",
      "✨ [2.3s] Síntesis fotorrealista completada con éxito."
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setNanoBananaLogs(prev => [...prev, log]);
        if (index === logs.length - 1) {
          setNanoBananaLoading(false);
        }
      }, (index + 1) * 280);
    });
  };

  const drawRealisticBancal = (canvas: HTMLCanvasElement) => {
    if (!canvas || !bancal) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset canvas dimensions to higher resolution for crisp drawing
    canvas.width = 1000;
    canvas.height = 1000;

    // Clear canvas
    ctx.clearRect(0, 0, 1000, 1000);

    // 1. Draw a gorgeous, vibrant sun-kissed garden grass lawn background!
    ctx.fillStyle = '#34d399'; // base fresh vibrant green
    ctx.fillRect(0, 0, 1000, 1000);

    // Add rich warm glowing sunlit lime spots to give the lawn premium volumetric light depth
    for (let i = 0; i < 22; i++) {
      const gx = Math.random() * 1000;
      const gy = Math.random() * 1000;
      const gr = 140 + Math.random() * 180;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
      grad.addColorStop(0, 'rgba(163, 230, 53, 0.55)'); // bright glowing lime green
      grad.addColorStop(1, 'rgba(52, 211, 153, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }

    // Paint thousands of fine hand-drawn artistic blades of grass to wow the user!
    ctx.strokeStyle = '#059669'; // rich emerald green for shadow grass
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 500; i++) {
      const sx = Math.random() * 1000;
      const sy = Math.random() * 1000;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(sx + (Math.random()-0.5)*6, sy - 3 - Math.random()*5, sx + (Math.random()-0.5)*10, sy - 6 - Math.random()*7);
      ctx.stroke();
    }

    // 2. Determine scale and center offset for flat top-down view
    const w = parseFloat(bancal.bancalesancho) || 2;
    const wSup = bancal.bancalesforma === 'trapezoidal' ? (parseFloat(bancal.bancalesanchosuperior) || 1.5) : w;
    const l = parseFloat(bancal.bancaleslargo) || 1.2;
    const maxMeters = Math.max(w, wSup, l);
    
    // Scale factor to fit bed beautifully with cotas
    const scale = 680 / maxMeters; 
    
    // Center alignment
    const offsetX = (1000 - w * scale) / 2;
    const offsetY = (1000 - l * scale) / 2;

    // The direct 2D top-down projection helper!
    const getProjectedCoord = (xMeters: number, yMeters: number, zMeters = 0) => {
      let currentW = w;
      let startX = 0;
      if (bancal.bancalesforma === 'trapezoidal') {
        const ratio = yMeters / l;
        currentW = wSup + ratio * (w - wSup);
        startX = ratio * ((wSup - w) / 2);
      }
      
      const rx = offsetX + (startX + xMeters) * scale;
      const ry = offsetY + yMeters * scale - zMeters * scale * 0.03; // slight offset for tutor heights
      return { x: rx, y: ry };
    };

    // Helper to draw sketchy/wobbly lines if needed for tags
    const drawWobblyLine = (x1: number, y1: number, x2: number, y2: number, roughness = 1.0) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) return;
      const segments = Math.max(3, Math.floor(dist / 14));
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (let i = 1; i < segments; i++) {
        const t = i / segments;
        const lx = x1 + dx * t;
        const ly = y1 + dy * t;
        const wobble = (Math.random() - 0.5) * roughness;
        const px = -dy / dist;
        const py = dx / dist;
        ctx.lineTo(lx + px * wobble, ly + py * wobble);
      }
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    // Helper to draw filled wobbly polygon for tags
    const drawWobblyPolygon = (points: {x: number, y: number}[], fillStyle?: string, strokeStyle?: string, lineWidth = 1, roughness = 1.0) => {
      if (points.length < 3) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          drawWobblyLine(p1.x, p1.y, p2.x, p2.y, roughness);
        }
      }
      ctx.restore();
    };

    // Helper to draw sketchy wobbly circles directly in 2D canvas pixels (e.g. foliage layers)
    const drawWobblyCircle = (cxVal: number, cyVal: number, r: number, fillStyle?: string, strokeStyle?: string, lineWidth = 1, roughness = 1.0) => {
      ctx.save();
      const segments = 16;
      const points = [];
      for (let i = 0; i < segments; i++) {
        const angle = (i * Math.PI * 2) / segments;
        const dx = Math.cos(angle) * r;
        const dy = Math.sin(angle) * r;
        const wobble = (Math.random() - 0.5) * roughness * 0.8;
        points.push({ x: cxVal + dx + wobble, y: cyVal + dy + wobble });
      }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        for (let i = 0; i < points.length; i++) {
          const p1 = points[i];
          const p2 = points[(i + 1) % points.length];
          drawWobblyLine(p1.x, p1.y, p2.x, p2.y, roughness * 0.5);
        }
      }
      ctx.restore();
    };

    // Helper to draw isometric ellipses (circles in top-down)
    const drawIsometricCircle = (centerXVal: number, centerYVal: number, zMeters: number, radiusMeters: number, fillStyle?: string, strokeStyle?: string, lineWidth = 2, roughness = 2.0) => {
      ctx.save();
      const pC = getProjectedCoord(centerXVal, centerYVal, zMeters);
      const rPixels = radiusMeters * scale;
      
      ctx.beginPath();
      ctx.arc(pC.x, pC.y, rPixels, 0, Math.PI*2);
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
      }
      ctx.restore();
    };

    // Helper to draw a gorgeous, shaded 3D river pebble (procedural top-down pebble)
    const drawPebble = (cxVal: number, cyVal: number, r: number) => {
      ctx.save();
      // Organic color palette of river pebbles: limestone grey, basalt dark carbon, sand beige, clay terracotta
      const colors = ['#94a3b8', '#64748b', '#cbd5e1', '#cbd5e0', '#475569', '#cbd5c5', '#78716c', '#a8a29e'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      // Pebble drop shadow for 3D depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.16)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 0.8;
      ctx.shadowOffsetY = 1.5;
      
      // Wobbled ellipse outline and fill
      ctx.fillStyle = color;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.0;
      
      const wobbleX = 1.0 + (Math.random() - 0.5) * 0.22;
      const wobbleY = 1.0 + (Math.random() - 0.5) * 0.22;
      const angle = Math.random() * Math.PI;
      
      ctx.beginPath();
      ctx.ellipse(cxVal, cyVal, r * wobbleX, r * wobbleY, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowColor = 'transparent'; // Reset shadow for outline and highlight
      ctx.stroke();
      
      // Inner smooth highlight (sun reflection)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cxVal - r * 0.25, cyVal - r * 0.25, r * 0.45, Math.PI * 1.0, Math.PI * 1.5);
      ctx.stroke();
      
      ctx.restore();
    };

    // Helper to draw realistic pine wood chips / bark mulch
    const drawWoodChip = (cxVal: number, cyVal: number, r: number) => {
      ctx.save();
      // Bright glowing golden pine wood shavings and chips!
      const colors = ['#fef08a', '#fde68a', '#eab308', '#facc15', '#fbbf24', '#fcd34d', '#fef9c3'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.shadowColor = 'rgba(120, 53, 4, 0.12)';
      ctx.shadowBlur = 1.8;
      ctx.shadowOffsetX = 0.5;
      ctx.shadowOffsetY = 1.0;
      
      ctx.fillStyle = color;
      ctx.strokeStyle = '#b45309'; // warm golden-brown outlines
      ctx.lineWidth = 0.6;
      
      const angle = Math.random() * Math.PI * 2;
      const length = r * (1.6 + Math.random() * 0.9);
      const width = r * (0.6 + Math.random() * 0.4);
      
      ctx.translate(cxVal, cyVal);
      ctx.rotate(angle);
      
      ctx.beginPath();
      // Organic wobbly rectangular wood splinter shape
      ctx.moveTo(-length/2, -width/2 + (Math.random()-0.5)*1.8);
      ctx.lineTo(length/2, -width/3 + (Math.random()-0.5)*1.8);
      ctx.lineTo(length/2 - (Math.random()*1.5), width/2);
      ctx.lineTo(-length/2, width/3);
      ctx.closePath();
      
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.stroke();
      
      // Fine wood fiber grain reflection
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(-length/3.5, 0);
      ctx.lineTo(length/3.5, 0);
      ctx.stroke();
      
      ctx.restore();
    };

    // Helper to draw realistic irregular flagstone slabs (stepping stones)
    const drawFlagstone = (cxVal: number, cyVal: number, r: number) => {
      ctx.save();
      // Premium sparkling white marble and sunlit light-grey granite slabs
      const colors = ['#ffffff', '#f8fafc', '#f1f5f9', '#fdfdfd', '#f1f5f9', '#ffffff', '#e2e8f0'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      // 3D flagstone depth drop shadow
      ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
      ctx.shadowBlur = 4.5;
      ctx.shadowOffsetX = 1.2;
      ctx.shadowOffsetY = 2.0;

      ctx.fillStyle = color;
      ctx.strokeStyle = '#475569'; // clean slate grey borders
      ctx.lineWidth = 1.4;

      // Create an irregular polygonal stepping stone slab (5 to 7 sides)
      const sides = 5 + Math.floor(Math.random() * 3);
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i * Math.PI * 2) / sides;
        const vr = r * (0.85 + Math.random() * 0.35);
        const sx = cxVal + Math.cos(angle) * vr;
        const sy = cyVal + Math.sin(angle) * vr;
        if (i === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.stroke();

      // Sun reflection highlight on top-left edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i < Math.floor(sides / 2) + 1; i++) {
        const angle = (i * Math.PI * 2) / sides;
        const vr = r * (0.85 + Math.random() * 0.35);
        const sx = cxVal + Math.cos(angle) * vr;
        const sy = cyVal + Math.sin(angle) * vr;
        if (i === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      ctx.stroke();

      // Soft mineral grain specks on stone surface
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      for (let g = 0; g < 3; g++) {
        const gx = cxVal + (Math.random() - 0.5) * r * 0.6;
        const gy = cyVal + (Math.random() - 0.5) * r * 0.6;
        ctx.beginPath();
        ctx.arc(gx, gy, Math.random() * 1.6 + 0.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // Helper to draw a beautiful rounded cobblestone for the premium empedrado pavement
    const drawCobblestone = (cxVal: number, cyVal: number, r: number) => {
      ctx.save();
      // Premium volcanic basalt, dark grey slate, charcoal, and warm granite stone colors
      const colors = ['#57534e', '#44403c', '#78716c', '#64748b', '#475569', '#334155', '#7f8c8d', '#95a5a6'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      // 3D shadow for small cobblestone
      ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
      ctx.shadowBlur = 2.0;
      ctx.shadowOffsetX = 0.6;
      ctx.shadowOffsetY = 1.2;

      ctx.fillStyle = color;
      ctx.strokeStyle = '#1c1917'; // extremely dark stone border
      ctx.lineWidth = 0.8;

      // Rounded irregular stone polygon
      const sides = 5 + Math.floor(Math.random() * 3);
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i * Math.PI * 2) / sides;
        const vr = r * (0.82 + Math.random() * 0.3);
        const sx = cxVal + Math.cos(angle) * vr;
        const sy = cyVal + Math.sin(angle) * vr;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.stroke();

      // Top sunlit reflection highlight line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let i = 0; i < Math.floor(sides / 2) + 1; i++) {
        const angle = (i * Math.PI * 2) / sides;
        const vr = r * (0.82 + Math.random() * 0.3);
        const sx = cxVal + Math.cos(angle) * vr;
        const sy = cyVal + Math.sin(angle) * vr;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      ctx.restore();
    };

    // Bed physical heights and colors
    const wallHeight = 0.25; 
    const soilZ = -0.21; // Pathway base level
    const camaZ = -0.02; // Elevated beds top level (~19cm elevated)

    const getZForCoords = (xMeters: number, yMeters: number) => {
      if (bancal.bancalesforma === 'circular') {
        return camaZ;
      }
      const segments = getBedSegments();
      for (const s of segments) {
        if (xMeters >= s.xStart && xMeters <= s.xStart + s.width &&
            yMeters >= s.yStart && yMeters <= s.yStart + s.height) {
          return s.type !== 'pasillo' ? camaZ : soilZ;
        }
      }
      return soilZ;
    };

    const strokeBorder = '#334155'; // deep slate container frame
    
    // Corners of the raised bed
    const corners = [
      getProjectedCoord(0, 0),
      getProjectedCoord(bancal.bancalesforma === 'trapezoidal' ? wSup : w, 0),
      getProjectedCoord(w, l),
      getProjectedCoord(0, l)
    ];

    // ── STAGE 1 & 2: RECESSED PLANTER CONTAINER FRAME & DARK SOIL BASE ──
    ctx.save();
    // Beautiful deep inner drop shadow inside the planter container
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;

    // Fill soil base area with beautiful warm compost sustrato loam
    ctx.fillStyle = '#452212';
    ctx.beginPath();
    if (bancal.bancalesforma === 'circular') {
      const pC = getProjectedCoord(w/2, w/2);
      ctx.arc(pC.x, pC.y, (w/2)*scale, 0, Math.PI*2);
    } else {
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
    }
    ctx.fill();
    ctx.restore();

    // Draw the thick planter container frame borders (Vibrant warm Cedar Wood beam)
    ctx.save();
    ctx.strokeStyle = '#c2410c'; // rich cedar orange-red
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    if (bancal.bancalesforma === 'circular') {
      const pC = getProjectedCoord(w/2, w/2);
      ctx.arc(pC.x, pC.y, (w/2)*scale, 0, Math.PI*2);
    } else {
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
    }
    ctx.stroke();
    
    // Highlight inner core of the wood frame for a 3D varnished wood effect!
    ctx.strokeStyle = '#f97316'; // glowing sunlit amber core
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Draw hundreds of organic micro soil specks to give the compost real granular volume texture
    ctx.save();
    ctx.beginPath();
    if (bancal.bancalesforma === 'circular') {
      const pC = getProjectedCoord(w/2, w/2);
      ctx.arc(pC.x, pC.y, (w/2)*scale, 0, Math.PI*2);
    } else {
      ctx.moveTo(corners[0].x, corners[0].y);
      ctx.lineTo(corners[1].x, corners[1].y);
      ctx.lineTo(corners[2].x, corners[2].y);
      ctx.lineTo(corners[3].x, corners[3].y);
      ctx.closePath();
    }
    ctx.clip();

    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = Math.random() > 0.6 ? '#f59e0b' : (Math.random() > 0.3 ? '#854d0e' : '#1c1008'); // gold, warm brown, dark brown
      const sx = corners[0].x + Math.random() * (w * scale + 60) - 30;
      const sy = corners[0].y + Math.random() * (l * scale + 60) - 30;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.random() * 2 + 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ── STAGE 3: PROCEDURE WOOD CHIP PATHWAYS (PASILLOS) ──
    if (bancal.bancalesforma !== 'circular') {
      const segments = getBedSegments();
      segments.forEach(s => {
        if (s.type === 'pasillo') {
          ctx.save();
          // Clip to the exact pathway segment limits
          const p00 = getProjectedCoord(s.xStart, s.yStart);
          const p10 = getProjectedCoord(s.xStart + s.width, s.yStart);
          const p11 = getProjectedCoord(s.xStart + s.width, s.yStart + s.height);
          const p01 = getProjectedCoord(s.xStart, s.yStart + s.height);
          
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.clip();
          
          // Light toasted tan background for the pasillo pathway (lighter than the bed's #8c4f2b clay loam)
          ctx.fillStyle = '#bfa181';
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.fill();
          
          // Generate pine wood mulch chips filling the pathway segment beautifully!
          const segW = s.width * scale;
          const segH = s.height * scale;
          const mulchArea = segW * segH;
          const mulchCount = Math.min(380, Math.ceil(mulchArea / 140));
          for (let pIdx = 0; pIdx < mulchCount; pIdx++) {
            const px = s.xStart + Math.random() * s.width;
            const py = s.yStart + Math.random() * s.height;
            const p = getProjectedCoord(px, py);
            const r = Math.random() * 2.8 + 4.2; // organic splinter sizes
            drawWoodChip(p.x, p.y, r);
          }
          
          // Draw elegant, semi-transparent PASILLO label
          ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('PASILLO (ACOLCHADO)', (p00.x + p11.x) / 2, (p00.y + p11.y) / 2);
          ctx.restore();
        }
      });
    }

    // ── STAGE 5: ELEVATED CROP BEDS (CAMAS) WITH RELIEF DROP SHADOWS ──
    if (bancal.bancalesforma !== 'circular') {
      const segments = getBedSegments();
      segments.forEach(s => {
        if (s.type !== 'pasillo') {
          ctx.save();
          const p00 = getProjectedCoord(s.xStart, s.yStart);
          const p10 = getProjectedCoord(s.xStart + s.width, s.yStart);
          const p11 = getProjectedCoord(s.xStart + s.width, s.yStart + s.height);
          const p01 = getProjectedCoord(s.xStart, s.yStart + s.height);

          // Soft relief drop shadow to represent 30cm physical elevation from the gravel pasillos!
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetX = 3;
          ctx.shadowOffsetY = 4;

          // Rich warm terracotta agricultural soil / clay loam!
          ctx.fillStyle = '#8c4f2b'; // beautiful warm colorful reddish clay loam!
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.fill();
          
          // Draw hundreds of rich nutrient-dense gold compost speckles on camas!
          ctx.fillStyle = 'rgba(251, 191, 36, 0.22)'; // glowing golden compost particles
          const bedWSeg = s.width * scale;
          const bedHSeg = s.height * scale;
          for (let sp = 0; sp < 120; sp++) {
            const sx = p00.x + Math.random() * bedWSeg;
            const sy = p00.y + Math.random() * bedHSeg;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.random() * 1.5 + 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();

          // Draw the beautiful thin wobbly boundaries separating soil from gravel
          ctx.save();
          ctx.strokeStyle = '#2d1a10';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();

          // Overlay clean white dashed outlines to match the expected blueprint graphic!
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(p00.x, p00.y);
          ctx.lineTo(p10.x, p10.y);
          ctx.lineTo(p11.x, p11.y);
          ctx.lineTo(p01.x, p01.y);
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // ── STAGE 4: WINDING CONTINUOUS FLAGSTONE PATHS (placedPaths) ──
    placedPaths.forEach(path => {
      if (!path.points || path.points.length < 2) return;
      ctx.save();
      // Clip to the planter interior
      ctx.beginPath();
      if (bancal.bancalesforma === 'circular') {
        const pC = getProjectedCoord(w/2, w/2);
        ctx.arc(pC.x, pC.y, (w/2)*scale, 0, Math.PI*2);
      } else {
        ctx.moveTo(corners[0].x, corners[0].y);
        ctx.lineTo(corners[1].x, corners[1].y);
        ctx.lineTo(corners[2].x, corners[2].y);
        ctx.lineTo(corners[3].x, corners[3].y);
        ctx.closePath();
      }
      ctx.clip();

      const strokeW = path.widthMeters * scale;

      // 1. Draw a beautiful bright, sunny gold sand base track (sub-base)
      ctx.save();
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'; // glowing golden-yellow sand sub-base
      ctx.lineWidth = strokeW + 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      path.points.forEach((pt: any, idx: number) => {
        const px = (pt.x / 100) * w;
        const py = (pt.y / 100) * l;
        const p = getProjectedCoord(px, py);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      ctx.restore();

      // 2. Draw fine golden sand and small gravel grains on top of sub-base
      for (let sIdx = 0; sIdx < path.points.length - 1; sIdx++) {
        const pt1 = path.points[sIdx];
        const pt2 = path.points[sIdx + 1];
        const px1 = (pt1.x / 100) * w;
        const py1 = (pt1.y / 100) * l;
        const px2 = (pt2.x / 100) * w;
        const py2 = (pt2.y / 100) * l;
        
        const p1 = getProjectedCoord(px1, py1);
        const p2 = getProjectedCoord(px2, py2);
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        const steps = Math.ceil(dist / 4);
        
        for (let step = 0; step <= steps; step++) {
          const t = step / steps;
          const scx = p1.x + dx * t;
          const scy = p1.y + dy * t;
          
          const pCount = Math.ceil(strokeW / 8);
          for (let pc = 0; pc < pCount; pc++) {
            const offsetPct = (pc / (pCount - 1 || 1)) - 0.5;
            const perpX = -dy / dist;
            const perpY = dx / dist;
            const offsetPixels = offsetPct * strokeW * 0.85 + (Math.random() - 0.5) * 3;
            
            ctx.fillStyle = Math.random() > 0.5 ? '#fcd34d' : '#f59e0b'; // bright yellow & amber sand grains
            ctx.beginPath();
            ctx.arc(scx + perpX * offsetPixels, scy + perpY * offsetPixels, Math.random() * 1.5 + 1.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 3. Draw a gorgeous continuous cobblestone pavement (empedrado) along the path!
      for (let sIdx = 0; sIdx < path.points.length - 1; sIdx++) {
        const pt1 = path.points[sIdx];
        const pt2 = path.points[sIdx + 1];
        const px1 = (pt1.x / 100) * w;
        const py1 = (pt1.y / 100) * l;
        const px2 = (pt2.x / 100) * w;
        const py2 = (pt2.y / 100) * l;
        
        const p1 = getProjectedCoord(px1, py1);
        const p2 = getProjectedCoord(px2, py2);
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) continue;
        
        // Small interval between stones for tight cobblestone packaging
        const stepSize = strokeW * 0.28;
        const numStones = Math.ceil(dist / stepSize);
        
        for (let k = 0; k <= numStones; k++) {
          const t = k / numStones;
          const perpX = -dy / dist;
          const perpY = dx / dist;
          
          // Draw 3 staggered rows of cobblestones across the width of the path
          const rows = 3;
          for (let rIdx = 0; rIdx < rows; rIdx++) {
            const offsetPct = (rIdx / (rows - 1 || 1)) - 0.5; // -0.5, 0, 0.5
            
            // Add high-end organic noise to lateral and longitudinal coordinates
            const lateralOffset = offsetPct * strokeW * 0.72 + (Math.random() - 0.5) * 3.5;
            const longitudinalOffset = (Math.random() - 0.5) * (stepSize * 0.45);
            
            const cxStone = p1.x + dx * t + perpX * lateralOffset + (dx / dist) * longitudinalOffset;
            const cyStone = p1.y + dy * t + perpY * lateralOffset + (dy / dist) * longitudinalOffset;
            
            const stoneRadius = strokeW * 0.22 + Math.random() * 2.2; // beautiful rounded stone sizes
            drawCobblestone(cxStone, cyStone, stoneRadius);
          }
        }
      }

      // Draw elegant, semi-transparent CAMINO label along the path
      if (path.points && path.points.length >= 2) {
        const midIdx = Math.floor(path.points.length / 2);
        const ptMid = path.points[midIdx];
        const mx = (ptMid.x / 100) * w;
        const my = (ptMid.y / 100) * l;
        const pMid = getProjectedCoord(mx, my);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)'; // dark contrasting text on sand/granite base
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CAMINO EMPEDRADO 🪨', pMid.x, pMid.y);
      }

      ctx.restore();
    });

    // ── STAGE 6: DRIP IRRIGATION HOSE LINES (GOTEO) ──
    if (bancal.bancalesforma !== 'circular') {
      const segments = getBedSegments();
      segments.forEach(s => {
        if (s.type !== 'pasillo') {
          ctx.save();
          ctx.strokeStyle = '#1a1412'; // dark irrigation tube
          ctx.lineWidth = 2.0;

          // Render one or two hoses per crop bed depending on width/height threshold (narrow vs wide beds)
          if (bedAlignment === 'horizontal') {
            const isWide = s.type === 'cama_bilateral' || s.height >= 1.0;
            const yVals = isWide 
              ? [s.yStart + s.height * 0.3, s.yStart + s.height * 0.7] 
              : [s.yStart + s.height * 0.5];

            yVals.forEach(yVal => {
              const start = getProjectedCoord(s.xStart + 0.05, yVal);
              const end = getProjectedCoord(s.xStart + s.width - 0.05, yVal);
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();

              // Draw drip wet circles and grey emitter spots
              for (let dx = s.xStart + 0.15; dx < s.xStart + s.width - 0.1; dx += 0.35) {
                const dp = getProjectedCoord(dx, yVal);
                // Wet compost circle
                ctx.fillStyle = 'rgba(10, 7, 5, 0.35)';
                ctx.beginPath();
                ctx.arc(dp.x, dp.y, 6.5, 0, Math.PI * 2);
                ctx.fill();
                // Emitter dot
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.arc(dp.x, dp.y, 1.2, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          } else {
            const isWide = s.type === 'cama_bilateral' || s.width >= 1.0;
            const xVals = isWide 
              ? [s.xStart + s.width * 0.3, s.xStart + s.width * 0.7] 
              : [s.xStart + s.width * 0.5];

            xVals.forEach(xVal => {
              const start = getProjectedCoord(xVal, s.yStart + 0.05);
              const end = getProjectedCoord(xVal, s.yStart + s.height - 0.05);
              ctx.beginPath();
              ctx.moveTo(start.x, start.y);
              ctx.lineTo(end.x, end.y);
              ctx.stroke();

              // Draw drip wet circles and grey emitter spots
              for (let dy = s.yStart + 0.15; dy < s.yStart + s.height - 0.1; dy += 0.35) {
                const dp = getProjectedCoord(xVal, dy);
                // Wet circle
                ctx.fillStyle = 'rgba(10, 7, 5, 0.35)';
                ctx.beginPath();
                ctx.arc(dp.x, dp.y, 6.5, 0, Math.PI * 2);
                ctx.fill();
                // Emitter dot
                ctx.fillStyle = '#475569';
                ctx.beginPath();
                ctx.arc(dp.x, dp.y, 1.2, 0, Math.PI * 2);
                ctx.fill();
              }
            });
          }
          ctx.restore();
        }
      });
    }

    // ── STAGE 7: CROPS AND ACCESSORIES RENDER QUEUE (Y-SORTED PAINTER'S ALGORITHM) ──
    const renderQueue: any[] = [];

    crops.forEach(crop => {
      const px = parseFloat(crop.cultivosposicionx) || 50;
      const py = parseFloat(crop.cultivosposiciony) || 50;
      const N = parseInt(crop.cultivoscantidad) || 1;

      const spacingXCm = parseFloat(crop.especiesmarcoplantas) || 30;
      const spacingYCm = parseFloat(crop.especiesmarcofilas) || 30;
      const spacingXMeters = spacingXCm / 100;
      const spacingYMeters = spacingYCm / 100;
      const deltaPctX = (spacingXMeters / w) * 100;
      const deltaPctY = (spacingYMeters / l) * 100;

      // 1. Get all beds/strips using exact layout rules
      const camaBilateral = profile?.camaCultivoBilateral ?? 1.20;
      const camaUnilateral = profile?.camaCultivoUnilateral ?? 0.75;
      const pasilloVal = profile?.pasillo ?? 0.50;

      let strips: { start: number; size: number; type: string }[] = [];

      if (bancal?.bancalesforma !== 'circular') {
        if (bedAlignment === 'horizontal') {
          // Filter horizontal paths
          const horizontalPaths = placedPaths.filter(p => {
            if (!p.points || p.points.length < 2) return false;
            const first = p.points[0];
            const last = p.points[p.points.length - 1];
            return Math.abs(last.x - first.x) > Math.abs(last.y - first.y);
          });

          const pathYPositions = horizontalPaths.map(p => {
            const avgYPct = p.points.reduce((sum: number, pt: any) => sum + pt.y, 0) / p.points.length;
            const avgYMeters = (avgYPct / 100) * l;
            return { y: avgYMeters, height: p.widthMeters ?? 0.4 };
          }).sort((a, b) => a.y - b.y);

          const intervals: { start: number; end: number; topIsPath: boolean; bottomIsPath: boolean }[] = [];
          let currentStart = 0;

          pathYPositions.forEach(p => {
            const pathTop = Math.max(0, p.y - p.height / 2);
            const pathBottom = Math.min(l, p.y + p.height / 2);
            if (pathTop > currentStart + 0.05) {
              intervals.push({ start: currentStart, end: pathTop, topIsPath: currentStart > 0, bottomIsPath: true });
            }
            currentStart = pathBottom;
          });

          if (l > currentStart + 0.05) {
            intervals.push({ start: currentStart, end: l, topIsPath: currentStart > 0, bottomIsPath: false });
          }

          intervals.forEach(inv => {
            const intervalH = inv.end - inv.start;
            if (intervalH <= 0.05) return;

            if (intervalH <= camaUnilateral) {
              strips.push({ start: inv.start, size: intervalH, type: 'cama_unilateral' });
            } else {
              let curY = inv.start;
              strips.push({ start: curY, size: camaUnilateral, type: 'cama_unilateral' });
              curY += camaUnilateral;

              while (curY < inv.end) {
                if (curY + pasilloVal >= inv.end) {
                  if (inv.bottomIsPath) {
                    const lastStrip = strips[strips.length - 1];
                    if (lastStrip && lastStrip.type !== 'pasillo') {
                      lastStrip.size += (inv.end - curY);
                    }
                  } else {
                    strips.push({ start: curY, size: inv.end - curY, type: 'pasillo' });
                  }
                  break;
                }
                strips.push({ start: curY, size: pasilloVal, type: 'pasillo' });
                curY += pasilloVal;

                if (curY + camaBilateral <= inv.end) {
                  strips.push({ start: curY, size: camaBilateral, type: 'cama_bilateral' });
                  curY += camaBilateral;
                } else if (curY + camaUnilateral <= inv.end) {
                  strips.push({ start: curY, size: camaUnilateral, type: 'cama_unilateral' });
                  curY += camaUnilateral;
                } else {
                  if (inv.bottomIsPath) {
                    const lastStrip = strips[strips.length - 1];
                    if (lastStrip && lastStrip.type === 'pasillo') {
                      strips.push({ start: curY, size: inv.end - curY, type: 'cama_unilateral' });
                    } else if (lastStrip) {
                      lastStrip.size += (inv.end - curY);
                    }
                  } else {
                    const remaining = inv.end - curY;
                    if (remaining > 0) {
                      strips.push({ start: curY, size: remaining, type: 'cama_unilateral' });
                    }
                  }
                  break;
                }
              }
            }
          });

        } else {
          // Filter vertical paths
          const verticalPaths = placedPaths.filter(p => {
            if (!p.points || p.points.length < 2) return false;
            const first = p.points[0];
            const last = p.points[p.points.length - 1];
            return Math.abs(last.x - first.x) < Math.abs(last.y - first.y);
          });

          const pathXPositions = verticalPaths.map(p => {
            const avgXPct = p.points.reduce((sum: number, pt: any) => sum + pt.x, 0) / p.points.length;
            const avgXMeters = (avgXPct / 100) * w;
            return { x: avgXMeters, width: p.widthMeters ?? 0.4 };
          }).sort((a, b) => a.x - b.x);

          const intervals: { start: number; end: number; leftIsPath: boolean; rightIsPath: boolean }[] = [];
          let currentStart = 0;

          pathXPositions.forEach(p => {
            const pathLeft = Math.max(0, p.x - p.width / 2);
            const pathRight = Math.min(w, p.x + p.width / 2);
            if (pathLeft > currentStart + 0.05) {
              intervals.push({ start: currentStart, end: pathLeft, leftIsPath: currentStart > 0, rightIsPath: true });
            }
            currentStart = pathRight;
          });

          if (w > currentStart + 0.05) {
            intervals.push({ start: currentStart, end: w, leftIsPath: currentStart > 0, rightIsPath: false });
          }

          intervals.forEach(inv => {
            const intervalW = inv.end - inv.start;
            if (intervalW <= 0.05) return;

            if (intervalW <= camaUnilateral) {
              strips.push({ start: inv.start, size: intervalW, type: 'cama_unilateral' });
            } else {
              let curX = inv.start;
              strips.push({ start: curX, size: camaUnilateral, type: 'cama_unilateral' });
              curX += camaUnilateral;

              while (curX < inv.end) {
                if (curX + pasilloVal >= inv.end) {
                  if (inv.rightIsPath) {
                    const lastStrip = strips[strips.length - 1];
                    if (lastStrip && lastStrip.type !== 'pasillo') {
                      lastStrip.size += (inv.end - curX);
                    }
                  } else {
                    strips.push({ start: curX, size: inv.end - curX, type: 'pasillo' });
                  }
                  break;
                }
                strips.push({ start: curX, size: pasilloVal, type: 'pasillo' });
                curX += pasilloVal;

                if (curX + camaBilateral <= inv.end) {
                  strips.push({ start: curX, size: camaBilateral, type: 'cama_bilateral' });
                  curX += camaBilateral;
                } else if (curX + camaUnilateral <= inv.end) {
                  strips.push({ start: curX, size: camaUnilateral, type: 'cama_unilateral' });
                  curX += camaUnilateral;
                } else {
                  if (inv.rightIsPath) {
                    const lastStrip = strips[strips.length - 1];
                    if (lastStrip && lastStrip.type === 'pasillo') {
                      strips.push({ start: curX, size: inv.end - curX, type: 'cama_unilateral' });
                    } else if (lastStrip) {
                      lastStrip.size += (inv.end - curX);
                    }
                  } else {
                    const remaining = inv.end - curX;
                    if (remaining > 0) {
                      strips.push({ start: curX, size: remaining, type: 'cama_unilateral' });
                    }
                  }
                  break;
                }
              }
            }
          });
        }
      }

      const bedStrips = strips.filter(s => s.type !== 'pasillo');

      // 2. Find which bed the crop belongs to (the closest to px/py)
      let myBed = bedStrips[0];
      if (bedStrips.length > 0) {
        const coordVal = bedAlignment === 'horizontal' ? (py / 100) * l : (px / 100) * w;
        let minDist = Infinity;
        bedStrips.forEach(s => {
          const center = s.start + s.size / 2;
          const dist = Math.abs(coordVal - center);
          if (dist < minDist) {
            minDist = dist;
            myBed = s;
          }
        });
      }

      // 3. Decide columns and rows distribution according to alignment & bed size
      let numCols = 1;
      let numRows = N;
      
      if (bancal?.bancalesforma !== 'circular' && myBed) {
        if (bedAlignment === 'horizontal') {
          if (myBed.type === 'cama_bilateral' || myBed.size >= 1.0) {
            numRows = 2;
          } else {
            numRows = 1;
          }
          numCols = Math.ceil(N / numRows);
        } else {
          if (myBed.type === 'cama_bilateral' || myBed.size >= 1.0) {
            numCols = 2;
          } else {
            numCols = 1;
          }
          numRows = Math.ceil(N / numCols);
        }
      } else {
        numCols = Math.ceil(Math.sqrt(N));
        numRows = Math.ceil(N / numCols);
      }

      const cols_fallback = Math.ceil(Math.sqrt(N));
      const rows_fallback = Math.ceil(N / cols_fallback);
      const gridWidthPct = (cols_fallback - 1) * deltaPctX;
      const gridHeightPct = (rows_fallback - 1) * deltaPctY;

      for (let idx = 0; idx < N; idx++) {
        let cxPct = px;
        let cyPct = py;

        if (bancal?.bancalesforma !== 'circular' && myBed) {
          if (bedAlignment === 'horizontal') {
            const r = idx % numRows;
            const c = Math.floor(idx / numRows);

            const offsetPctX = -((numCols - 1) * deltaPctX) / 2 + c * deltaPctX;
            const offsetPctY = numRows === 2 ? (-deltaPctY / 2 + r * deltaPctY) : 0;

            cxPct = px + offsetPctX;
            cyPct = py + offsetPctY;
          } else {
            const c = idx % numCols;
            const r = Math.floor(idx / numCols);

            const offsetPctX = numCols === 2 ? (-deltaPctX / 2 + c * deltaPctX) : 0;
            const offsetPctY = -((numRows - 1) * deltaPctY) / 2 + r * deltaPctY;

            cxPct = px + offsetPctX;
            cyPct = py + offsetPctY;
          }
        } else {
          const col = idx % cols_fallback;
          const row = Math.floor(idx / cols_fallback);
          cxPct = px - gridWidthPct / 2 + col * deltaPctX;
          cyPct = py - gridHeightPct / 2 + row * deltaPctY;
        }

        const cxPlant = (cxPct / 100) * w;
        const cyPlant = (cyPct / 100) * l;

        renderQueue.push({
          type: 'crop',
          xMeters: cxPlant,
          yMeters: cyPlant,
          cropObj: crop,
          idx: idx
        });
      }
    });

    placedAccessories.forEach(acc => {
      const px = parseFloat(acc.posicionx) || 50;
      const py = parseFloat(acc.posiciony) || 50;
      renderQueue.push({
        type: 'accessory',
        xMeters: (px / 100) * w,
        yMeters: (py / 100) * l,
        accObj: acc
      });
    });

    // Sort renderQueue by Y coordinate
    renderQueue.sort((a, b) => a.yMeters - b.yMeters);

    renderQueue.forEach(item => {
      ctx.save();
      const pBase = getProjectedCoord(item.xMeters, item.yMeters);
      const itemZ = getZForCoords(item.xMeters, item.yMeters);

      if (item.type === 'crop') {
        const crop = item.cropObj;
        const status = crop.cultivosestado || 'germinacion';

        if (status === 'crecimiento') {
          // ── VEGETATIVE GROWTH: fresh young leafy sprout growing upwards ──
          const leaves = [
            { dx: -4, dy: -4, r: 6 },
            { dx: 4, dy: -2, r: 5 },
            { dx: -2, dy: 4, r: 7 },
            { dx: 3, dy: 3, r: 6 },
            { dx: 0, dy: 0, r: 8 }
          ];
          leaves.forEach(l => {
            ctx.fillStyle = '#34d399';
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.ellipse(pBase.x + l.dx, pBase.y + l.dy, l.r, l.r * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          });

        } else {
          // ── FRUITING/HARVEST STAGE: GORGEOUS DETAILED BOTANICAL BUSH WITH HANGING VEGETABLES ──
          const cropName = (crop.especiesvegetalesnombre || '').toLowerCase();
          const varietyName = (crop.variedad_nombre || '').toLowerCase();

          if (cropName.includes('tomate') || varietyName.includes('cherry')) {
            // Layered leafy tomato mass (extremely rich and lush greens)
            const leafCount = 14;
            for (let i = 0; i < leafCount; i++) {
              const angle = (i * Math.PI * 2) / leafCount;
              const dist = Math.random() * 8 + 14;
              const lx = pBase.x + Math.cos(angle) * dist;
              const ly = pBase.y + Math.sin(angle) * dist;
              const r = Math.random() * 4 + 9;

              ctx.fillStyle = i % 2 === 0 ? '#15803d' : '#16a34a';
              ctx.strokeStyle = '#14532d';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.ellipse(lx, ly, r, r * 0.6, angle + Math.PI/2, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // Glossy crimson cherry tomatoes with specular light spots!
            const tomatoes = [
              { dx: -8, dy: -6 },
              { dx: 8, dy: -8 },
              { dx: -10, dy: 6 },
              { dx: 10, dy: 8 },
              { dx: -2, dy: -12 },
              { dx: 2, dy: 10 },
              { dx: 0, dy: 0 }
            ];

            tomatoes.forEach(t => {
              ctx.save();
              const tx = pBase.x + t.dx;
              const ty = pBase.y + t.dy;

              ctx.fillStyle = '#ef4444';
              ctx.strokeStyle = '#b91c1c';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(tx, ty, 5, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();

              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(tx - 1.5, ty - 1.5, 1.2, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            });

          } else if (cropName.includes('zanahoria')) {
            // Orange Peeking Crown emerging from dark compost hole
            ctx.fillStyle = '#f97316';
            ctx.strokeStyle = '#c2410c';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(pBase.x, pBase.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.arc(pBase.x, pBase.y, 4, 0, Math.PI * 2);
            ctx.stroke();

            // Fluffy carrot top foliage leaves
            const leafCount = 8;
            for (let i = 0; i < leafCount; i++) {
              const angle = (i * Math.PI * 2) / leafCount;
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 2.0;
              ctx.beginPath();
              ctx.moveTo(pBase.x, pBase.y);
              const leafLen = Math.random() * 8 + 16;
              ctx.lineTo(pBase.x + Math.cos(angle)*leafLen, pBase.y + Math.sin(angle)*leafLen);
              ctx.stroke();
            }

          } else if (cropName.includes('lechuga')) {
            // rosette concentric ruffled circles of green leaves
            const layers = [16, 12, 8, 4];
            const leafColors = ['#15803d', '#16a34a', '#22c55e', '#4ade80'];

            layers.forEach((r, lIdx) => {
              ctx.fillStyle = leafColors[lIdx];
              ctx.strokeStyle = '#14532d';
              ctx.lineWidth = 1.0;

              const petalCount = 8;
              for (let i = 0; i < petalCount; i++) {
                const angle = (i * Math.PI * 2) / petalCount;
                const lx = pBase.x + Math.cos(angle) * (r * 0.45);
                const ly = pBase.y + Math.sin(angle) * (r * 0.45);
                ctx.beginPath();
                ctx.ellipse(lx, ly, r * 0.7, r * 0.5, angle, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(lx, ly);
                ctx.lineTo(lx + Math.cos(angle)*r*0.5, ly + Math.sin(angle)*r*0.5);
                ctx.stroke();
              }
            });
          } else {
            // Generic leafy greens
            ctx.fillStyle = '#16a34a';
            ctx.strokeStyle = '#14532d';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pBase.x, pBase.y, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          }
        }
      } else if (item.type === 'accessory') {
        const acc = item.accObj;
        ctx.font = '40px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(acc.icono || '🪵', pBase.x, pBase.y);
      }
      ctx.restore();
    });

    if (showMeasures) {
      // Helper to draw a CAD-style measurement line (cota) between two physical points (xM1, yM1) and (xM2, yM2)
      const drawMeasurementLine = (xM1: number, yM1: number, xM2: number, yM2: number, label: string) => {
        const p1 = getProjectedCoord(xM1, yM1);
        const p2 = getProjectedCoord(xM2, yM2);

        // Draw line
        ctx.save();
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        // Draw CAD 45-degree ticks at both ends
        [p1, p2].forEach(p => {
          ctx.beginPath();
          ctx.moveTo(p.x - 4, p.y + 4);
          ctx.lineTo(p.x + 4, p.y - 4);
          ctx.stroke();
        });

        // Draw text label centered in a small capsule
        const mx = (p1.x + p2.x) / 2;
        const my = (p1.y + p2.y) / 2;
        const txtW = ctx.measureText(label).width + 6;

        ctx.setLineDash([]); // solid line for text capsule
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(mx - txtW / 2, my - 7, txtW, 14, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0369a1';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, mx, my + 0.5);
        ctx.restore();
      };

      // ── STAGE 8: PROFESSIONAL CAD COTAS (MEASUREMENTS) ──
      ctx.save();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = '#475569';
      ctx.font = '500 13px system-ui';

    // A. Left Vertical Cota (representing Bed Length / Height)
    const cotLStart = getProjectedCoord(-0.35, 0);
    const cotLEnd = getProjectedCoord(-0.35, l);
    
    // Draw cota line
    ctx.beginPath();
    ctx.moveTo(cotLStart.x, cotLStart.y);
    ctx.lineTo(cotLEnd.x, cotLEnd.y);
    ctx.stroke();

    // Draw extension ticks and 45° CAD ticks
    [cotLStart, cotLEnd].forEach(p => {
      // extensions
      ctx.beginPath();
      ctx.moveTo(p.x - 10, p.y);
      ctx.lineTo(p.x + 10, p.y);
      ctx.stroke();
      
      // 45 deg slash tick
      ctx.beginPath();
      ctx.moveTo(p.x - 6, p.y + 6);
      ctx.lineTo(p.x + 6, p.y - 6);
      ctx.stroke();
    });

    // Vertical text label (rotated 90 deg counter-clockwise)
    ctx.save();
    ctx.translate(cotLStart.x - 12, (cotLStart.y + cotLEnd.y) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${l.toFixed(2).replace('.', ',')}m`, 0, 0);
    ctx.restore();

    // B. Bottom Horizontal Cota (representing Bed Width)
    const cotWStart = getProjectedCoord(0, l + 0.35);
    const cotWEnd = getProjectedCoord(w, l + 0.35);

    // Draw cota line
    ctx.beginPath();
    ctx.moveTo(cotWStart.x, cotWStart.y);
    ctx.lineTo(cotWEnd.x, cotWEnd.y);
    ctx.stroke();

    // Extension lines and 45° ticks
    [cotWStart, cotWEnd].forEach(p => {
      // extensions
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - 10);
      ctx.lineTo(p.x, p.y + 10);
      ctx.stroke();
      
      // 45 deg slash tick
      ctx.beginPath();
      ctx.moveTo(p.x - 6, p.y + 6);
      ctx.lineTo(p.x + 6, p.y - 6);
      ctx.stroke();
    });

    // Horizontal text label
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${w.toFixed(2).replace('.', ',')}m`, (cotWStart.x + cotWEnd.x) / 2, cotWStart.y + 6);
    ctx.restore();

    // ── STAGE 8.5: INTERACTIVE CROP SPACING COTAS (FOR ALL CROPS) ──
    crops.forEach(crop => {
      const px = parseFloat(crop.cultivosposicionx) || 50;
      const py = parseFloat(crop.cultivosposiciony) || 50;
      const N = parseInt(crop.cultivoscantidad) || 1;

      const spacingXCm = parseFloat(crop.especiesmarcoplantas) || 30;
      const spacingYCm = parseFloat(crop.especiesmarcofilas) || 30;
      const spacingXMeters = spacingXCm / 100;
      const spacingYMeters = spacingYCm / 100;
      let deltaPctX = (spacingXMeters / w) * 100;
      let deltaPctY = (spacingYMeters / l) * 100;

      // 1. Get all beds/strips directly from the validated getBedSegments() helper
      const allSegments = getBedSegments();
      const bedStrips = allSegments.filter(s => s.type !== 'pasillo');

      // 2. Find which bed the crop belongs to (the closest to px/py center)
      let myBed = bedStrips[0];
      if (bedStrips.length > 0) {
        const cxM = (px / 100) * w;
        const cyM = (py / 100) * l;
        let minDist = Infinity;
        bedStrips.forEach(s => {
          const centerX = s.xStart + s.width / 2;
          const centerY = s.yStart + s.height / 2;
          const dist = Math.sqrt(Math.pow(cxM - centerX, 2) + Math.pow(cyM - centerY, 2));
          if (dist < minDist) {
            minDist = dist;
            myBed = s;
          }
        });
      }

      // 3. Decide columns and rows distribution
      let numCols = 1;
      let numRows = N;
      let effSpaceX = spacingXMeters;
      let effSpaceY = spacingYMeters;
      
      if (bancal?.bancalesforma !== 'circular' && myBed) {
        const optimal = getOptimalGrid(N, myBed.width, myBed.height, spacingXMeters, spacingYMeters);
        numCols = optimal.numCols;
        numRows = optimal.numRows;
        if (optimal.rotated) {
          effSpaceX = spacingYMeters;
          effSpaceY = spacingXMeters;
        }
      } else {
        numCols = Math.ceil(Math.sqrt(N));
        numRows = Math.ceil(N / numCols);
      }

      deltaPctX = (effSpaceX / w) * 100;
      deltaPctY = (effSpaceY / l) * 100;

      const cols_fallback = Math.ceil(Math.sqrt(N));
      const rows_fallback = Math.ceil(N / cols_fallback);
      const gridWidthPct = (cols_fallback - 1) * deltaPctX;
      const gridHeightPct = (rows_fallback - 1) * deltaPctY;

      // Calculate all physical coordinates of plants in this crop
      const plantsCoords: { x: number; y: number; r: number; c: number }[] = [];
      for (let idx = 0; idx < N; idx++) {
        let cxPct = px;
        let cyPct = py;
        let r = 0;
        let c = 0;

        if (bancal?.bancalesforma !== 'circular' && myBed) {
          if (bedAlignment === 'horizontal') {
            r = idx % numRows;
            c = Math.floor(idx / numRows);
            const offsetPctX = -((numCols - 1) * deltaPctX) / 2 + c * deltaPctX;
            const offsetPctY = -((numRows - 1) * deltaPctY) / 2 + r * deltaPctY;
            cxPct = px + offsetPctX;
            cyPct = py + offsetPctY;
          } else {
            c = idx % numCols;
            r = Math.floor(idx / numCols);
            const offsetPctX = -((numCols - 1) * deltaPctX) / 2 + c * deltaPctX;
            const offsetPctY = -((numRows - 1) * deltaPctY) / 2 + r * deltaPctY;
            cxPct = px + offsetPctX;
            cyPct = py + offsetPctY;
          }
        } else {
          const col = idx % cols_fallback;
          const row = Math.floor(idx / cols_fallback);
          r = row;
          c = col;
          cxPct = px - gridWidthPct / 2 + col * deltaPctX;
          cyPct = py - gridHeightPct / 2 + row * deltaPctY;
        }

        plantsCoords.push({
          x: (cxPct / 100) * w,
          y: (cyPct / 100) * l,
          r,
          c
        });
      }

      // Draw all cotas (measurements) on the canvas
      ctx.save();
      ctx.strokeStyle = '#0284c7'; // clean cyan CAD color
      ctx.lineWidth = 1.2;
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 10px monospace';
      ctx.setLineDash([3, 3]);

      // A. Distancia entre plantas/tomateras en el bancal (horizontal/vertical según rejilla)
      const pBasePlant = plantsCoords.find(p => p.c === 0 && p.r === 0);
      if (pBasePlant) {
        const labelHoriz = bedAlignment === 'horizontal' ? `${spacingXCm}cm` : `${spacingYCm}cm`;
        const labelVert = bedAlignment === 'horizontal' ? `${spacingYCm}cm` : `${spacingXCm}cm`;

        // Horizontal spacing (col 1, row 0)
        const pHoriz = plantsCoords.find(p => p.c === 1 && p.r === 0);
        if (pHoriz) {
          drawMeasurementLine(pBasePlant.x, pBasePlant.y, pHoriz.x, pHoriz.y, labelHoriz);
        }
        
        // Vertical spacing (col 0, row 1)
        const pVert = plantsCoords.find(p => p.c === 0 && p.r === 1);
        if (pVert) {
          drawMeasurementLine(pBasePlant.x, pBasePlant.y, pVert.x, pVert.y, labelVert);
        }
      }

      // C. Distancia de la tomatera/cultivo al borde de la cama
      if (plantsCoords.length > 0 && myBed) {
        // Find crop bounding box in physical meters
        const cropXCoords = plantsCoords.map(p => p.x);
        const cropYCoords = plantsCoords.map(p => p.y);
        const minX = Math.min(...cropXCoords);
        const maxX = Math.max(...cropXCoords);
        const minY = Math.min(...cropYCoords);
        const maxY = Math.max(...cropYCoords);

        // Bed physical boundaries
        const leftEdge = myBed.xStart;
        const rightEdge = myBed.xStart + myBed.width;
        const topEdge = myBed.yStart;
        const bottomEdge = myBed.yStart + myBed.height;

        // Distances in cm
        const dLeftCm = Math.round((minX - leftEdge) * 100);
        const dRightCm = Math.round((rightEdge - maxX) * 100);
        const dTopCm = Math.round((minY - topEdge) * 100);
        const dBottomCm = Math.round((bottomEdge - maxY) * 100);

        const midX = (minX + maxX) / 2;
        const midY = (minY + maxY) / 2;

        // 1. Left Edge spacing (drawn horizontally from crop midY to leftEdge)
        if (dLeftCm > 2) {
          drawMeasurementLine(minX, midY, leftEdge, midY, `${dLeftCm}cm`);
        }
        // 2. Right Edge spacing (drawn horizontally from crop midY to rightEdge)
        if (dRightCm > 2) {
          drawMeasurementLine(maxX, midY, rightEdge, midY, `${dRightCm}cm`);
        }
        // 3. Top Edge spacing (drawn vertically from crop midX to topEdge)
        if (dTopCm > 2) {
          drawMeasurementLine(midX, minY, midX, topEdge, `${dTopCm}cm`);
        }
        // 4. Bottom Edge spacing (drawn vertically from crop midX to bottomEdge)
        if (dBottomCm > 2) {
          drawMeasurementLine(midX, maxY, midX, bottomEdge, `${dBottomCm}cm`);
        }
      }

        ctx.restore();
      });

      // D. Distancia entre diferentes líneas de cultivos independientes colocados en la misma cama/bancal
      const bedSegments = getBedSegments().filter(s => s.type !== 'pasillo');
      bedSegments.forEach(s => {
        const bedCrops = crops.filter(crop => {
          const px = parseFloat(crop.cultivosposicionx) || 50;
          const py = parseFloat(crop.cultivosposiciony) || 50;
          const cxM = (px / 100) * w;
          const cyM = (py / 100) * l;
          
          let closestBed = bedSegments[0];
          let minDist = Infinity;
          bedSegments.forEach(b => {
            const centerX = b.xStart + b.width / 2;
            const centerY = b.yStart + b.height / 2;
            const dist = Math.sqrt(Math.pow(cxM - centerX, 2) + Math.pow(cyM - centerY, 2));
            if (dist < minDist) {
              minDist = dist;
              closestBed = b;
            }
          });
          return closestBed.xStart === s.xStart && closestBed.yStart === s.yStart;
        });

        if (bedCrops.length >= 2) {
          for (let i = 0; i < bedCrops.length; i++) {
            for (let j = i + 1; j < bedCrops.length; j++) {
              const cA = bedCrops[i];
              const cB = bedCrops[j];
              
              const ax = (parseFloat(cA.cultivosposicionx) / 100) * w;
              const ay = (parseFloat(cA.cultivosposiciony) / 100) * l;
              const bx = (parseFloat(cB.cultivosposicionx) / 100) * w;
              const by = (parseFloat(cB.cultivosposiciony) / 100) * l;

              const distCm = Math.round(Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2)) * 100);
              if (distCm > 5) {
                // Draw measurement line between parallel lines of different crops
                drawMeasurementLine(ax, ay, bx, by, `${distCm}cm`);
              }
            }
          }
        }
      });
    }

    // ── STAGE 9: WHITE CIRCULAR CAD GRIP CORNER HANDLES ──
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.0;

    corners.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    // ── STAGE 10: ARCHITECT DRAWING INFO TAG ──
    ctx.save();
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 11px serif';
    ctx.textAlign = 'right';
    ctx.fillText('✍ ... Asistente Nano Banana 🍌 (Plano Fotorrealista CAD) ...', 960, 945);
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`Bancal: ${bancal.bancalesnombre} | Forma: ${bancal.bancalesforma.toUpperCase()} | Escala: Aérea Ortográfica`, 960, 965);
    ctx.restore();
  };

  // Library search and tabs
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryTab, setLibraryTab] = useState<'semillas' | 'catalogo' | 'accesorios'>('semillas');
  const [catalog, setCatalog] = useState<any[]>([]);

  // Workspace Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Drag and drop states for placing/moving plants
  const [draggingCrop, setDraggingCrop] = useState<any | null>(null);
  const [activeBedHighlightSegment, setActiveBedHighlightSegment] = useState<{ xStart: number; yStart: number } | null>(null);
  const [placingPlant, setPlacingPlant] = useState<any | null>(null); // "Modo Siembra" variety/seed template

  // Collision state
  const [collisions, setCollisions] = useState<Record<number, boolean>>({});

  // Canvas ref for coordinate translations
  const svgRef = useRef<SVGSVGElement | null>(null);
  const hasDraggedRef = useRef(false);
  const wasAlreadySelectedRef = useRef(false);
  const dragStartCoordsRef = useRef({ x: 0, y: 0 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Raised Bed Interactive Boundary Resizing States
  const [isResizingBed, setIsResizingBed] = useState<'width' | 'length' | 'both' | 'topWidth' | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);
  const [resizeStartDims, setResizeStartDims] = useState({ w: 2, l: 1.2, wSup: 1.5, baseScale: 100 });
  const [resizeStartCoords, setResizeStartCoords] = useState({ x: 0, y: 0 });

  // Stable scale tracking to prevent infinite feedback loops during real-time dragging
  const [stableScale, setStableScale] = useState<number>(120);

  useEffect(() => {
    if (bancal && !isResizingBed) {
      const w = parseFloat(bancal.bancalesancho) || 2;
      const wSup = bancal.bancalesforma === 'trapezoidal' ? (parseFloat(bancal.bancalesanchosuperior) || 1.5) : w;
      const l = parseFloat(bancal.bancaleslargo) || 1.2;
      const maxD = Math.max(w, wSup, l);
      setStableScale(240 / maxD);
    }
  }, [bancal, isResizingBed]);



  // Load user auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        router.push('/login');
      }
    });
    return () => unsub();
  }, [router]);
  const hasLoadedOnce = React.useRef(false);

  // Load all Workspace Data
  const loadWorkspaceData = async () => {
    if (!userEmail || !bedId) return;
    try {
      // 1. Fetch raised bed details and maximum subscription limits
      const bedRes = await fetch('/api/user/bancales', {
        headers: { 'x-user-email': userEmail }
      });
      if (bedRes.ok) {
        const bedData = await bedRes.json();
        const foundBed = (bedData.bancales || []).find((b: any) => String(b.idbancales) === String(bedId));
        if (!foundBed) {
          router.push('/dashboard/perfil?tab=bancales');
          return;
        }
        setBancal(foundBed);
      }

      // Fetch user profile preferences for beds and paths
      const profileRes = await fetch(`/api/auth/profile?email=${encodeURIComponent(userEmail)}`);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.profile);
      }

      // 2. Fetch active crops for this user
      const cropsRes = await fetch('/api/user/cultivos', {
        headers: { 'x-user-email': userEmail }
      });
      if (cropsRes.ok) {
        const cropsData = await cropsRes.json();
        const activeList = (cropsData.cultivos || []).filter(
          (c: any) => c.cultivosestado !== 'finalizado' && c.cultivosestado !== 'perdido'
        );
        setAllActiveCrops(activeList);

        // Filter active crops mapped to this specific raised bed
        // Include crops that have xcultivosidbancales OR have ubicaciones in this bed
        const bedCrops = activeList.filter(
          (c: any) => {
            if (String(c.xcultivosidbancales) === String(bedId)) return true;
            if (c.ubicaciones && c.ubicaciones.length > 0) {
              return c.ubicaciones.some((ub: any) => String(ub.xcultivosubicacionesidbancales) === String(bedId));
            }
            return false;
          }
        );
        setCrops(bedCrops);
      }

      // 3. Fetch generic botanical catalog
      const catRes = await fetch('/api/user/catalogo', {
        headers: { 'x-user-email': userEmail }
      });
      if (catRes.ok) {
        const catData = await catRes.json();
        setCatalog(catData.especies || []);
      }

    } catch (err) {
      console.error('Error loading workspace data:', err);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  };

  useEffect(() => {
    if (userEmail && bedId) {
      loadWorkspaceData();
    }
  }, [userEmail, bedId]);

  // Load accessories from localStorage
  useEffect(() => {
    if (bedId) {
      const stored = localStorage.getItem(`verdantia_accessories_${bedId}`);
      if (stored) {
        try {
          setPlacedAccessories(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored accessories", e);
        }
      } else {
        setPlacedAccessories([]);
      }
    }
  }, [bedId]);

  // Load crop scales from localStorage
  useEffect(() => {
    if (bedId) {
      const stored = localStorage.getItem(`verdantia_crop_scales_${bedId}`);
      if (stored) {
        try {
          setCropScales(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored crop scales", e);
        }
      } else {
        setCropScales({});
      }
    }
  }, [bedId]);

  // Load paths from localStorage
  useEffect(() => {
    if (bedId) {
      const stored = localStorage.getItem(`verdantia_paths_${bedId}`);
      if (stored) {
        try {
          setPlacedPaths(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing stored paths", e);
        }
      } else {
        setPlacedPaths([]);
      }
    }
  }, [bedId]);

  // Load showPlantingFrames preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('verdantia_show_planting_frames');
    if (stored !== null) {
      setShowPlantingFrames(stored === 'true');
    }
  }, []);

  // Load showBedGuides preference from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('verdantia_show_bed_guides');
    if (stored !== null) {
      setShowBedGuides(stored === 'true');
    }
  }, []);

  // Load bedAlignment preference from localStorage
  useEffect(() => {
    if (bedId) {
      const stored = localStorage.getItem(`verdantia_bed_alignment_${bedId}`);
      if (stored === 'horizontal') {
        setBedAlignment('horizontal');
      } else {
        setBedAlignment('vertical');
      }
    }
  }, [bedId]);

  const handleAiOptimizeBeds = () => {
    // Si las guías están desactivadas, las activamos automáticamente para que el usuario pueda ver el resultado
    if (!showBedGuides) {
      setShowBedGuides(true);
      localStorage.setItem('verdantia_show_bed_guides', 'true');
    }

    if (bancal?.bancalesforma === 'circular') {
      alert("🤖 [IA Verdantia - Optimización de Trazado]\n\nEste bancal tiene una forma circular. Los bancales circulares se gestionan como espacios de cultivo biointensivos de distribución radial/espiral, por lo que no disponen de un trazado de rejilla lineal estándar para camas y pasillos paralelos.");
      return;
    }

    // 1. Analizar senderos fijos colocados para guiar la optimización
    let pathInfoMsg = '';
    let recommended: 'vertical' | 'horizontal' = bedW >= bedL ? 'horizontal' : 'vertical';
    
    if (placedPaths.length > 0) {
      let horizWeight = 0;
      let vertWeight = 0;
      
      placedPaths.forEach(p => {
        if (p.points && p.points.length >= 2) {
          const first = p.points[0];
          const last = p.points[p.points.length - 1];
          const dx = Math.abs(last.x - first.x);
          const dy = Math.abs(last.y - first.y);
          const pathLen = Math.sqrt(dx * dx + dy * dy);
          
          if (dx > dy) {
            horizWeight += pathLen;
          } else {
            vertWeight += pathLen;
          }
        }
      });
      
      if (horizWeight > 0 || vertWeight > 0) {
        if (horizWeight > vertWeight) {
          // Si el camino es horizontal, las camas deben ser VERTICALES para cruzarse perpendicularmente
          recommended = 'vertical';
          pathInfoMsg = `\n• 🛣️ Análisis de senderos: Camino principal HORIZONTAL detectado.\n  La IA alinea las camas en PERPENDICULAR (vertical) para que el camino principal actúe como avenida central y las guías se conecten como calles secundarias, garantizando acceso directo sin pisar los cultivos.`;
        } else {
          // Si el camino es vertical, las camas deben ser HORIZONTALES para cruzarse perpendicularmente
          recommended = 'horizontal';
          pathInfoMsg = `\n• 🛣️ Análisis de senderos: Camino principal VERTICAL detectado.\n  La IA alinea las camas en PERPENDICULAR (horizontal) para que el camino principal actúe como avenida central y las guías se conecten como calles secundarias, garantizando acceso directo sin pisar los cultivos.`;
        }
      }
    }
    
    // Si no hay caminos, o el peso es simétrico, cae en la recomendación por proporción del bancal
    if (!pathInfoMsg) {
      pathInfoMsg = `\n• Proporción física: Bancal de ${formatDec(bedW, 1)}m × ${formatDec(bedL, 1)}m. Orientación recomendada según dimensiones: ${recommended.toUpperCase()}.`;
    }

    setBedAlignment(recommended);
    localStorage.setItem(`verdantia_bed_alignment_${bedId}`, recommended);

    const msg = `🤖 [IA Verdantia - Optimización de Trazado]\n` +
                `Análisis de dimensiones: ${formatDec(bedW, 1)}m × ${formatDec(bedL, 1)}m.\n` + 
                `${pathInfoMsg}\n\n` +
                `• Orientación óptima aplicada: ${recommended.toUpperCase()}.\n\n` +
                `Camas y pasillos del huerto reubicados en el plano técnico con acceso 100% transitable.`;
    alert(msg);
  };

  const handleToggleBedGuides = () => {
    const nextVal = !showBedGuides;
    setShowBedGuides(nextVal);
    localStorage.setItem('verdantia_show_bed_guides', String(nextVal));
  };

  const savePaths = (list: any[]) => {

    setPlacedPaths(list);
    localStorage.setItem(`verdantia_paths_${bedId}`, JSON.stringify(list));
  };

  const saveAccessories = (list: any[]) => {
    setPlacedAccessories(list);
    localStorage.setItem(`verdantia_accessories_${bedId}`, JSON.stringify(list));
  };

  // Keyboard shortcuts (Suprimir / Backspace to delete selected elements)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is writing in any input or form element
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'SELECT' ||
         activeEl.tagName === 'TEXTAREA' ||
         (activeEl as any).isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Escape') {
        if (placingCrop) setPlacingCrop(null);
        if (placingPlant) setPlacingPlant(null);
        if (isDrawingPath) { setIsDrawingPath(false); setDrawnPathPoints([]); }
        if (selectedCrop) setSelectedCrop(null);
        if (selectedAccessory) setSelectedAccessory(null);
        if (selectedPath) setSelectedPath(null);
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Del') {
        if (selectedCrop) {
          e.preventDefault();
          handleRemoveCrop(selectedCrop.idcultivos);
        } else if (selectedAccessory) {
          e.preventDefault();
          const filtered = placedAccessories.filter(a => a.id !== selectedAccessory.id);
          saveAccessories(filtered);
          setSelectedAccessory(null);
        } else if (selectedPath) {
          e.preventDefault();
          if (confirm('¿Seguro que quieres eliminar este sendero continuo?')) {
            const filtered = placedPaths.filter(p => p.id !== selectedPath.id);
            savePaths(filtered);
            setSelectedPath(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCrop, selectedAccessory, selectedPath, placedAccessories, placedPaths]);

  const saveCropScale = (cropId: number, scaleMeters: number | null) => {
    setCropScales(prev => {
      const updated = { ...prev };
      if (scaleMeters === null) {
         delete updated[cropId];
      } else {
         updated[cropId] = scaleMeters;
      }
      localStorage.setItem(`verdantia_crop_scales_${bedId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const saveAccessoryScale = (accId: number, scaleMeters: number | null) => {
    setPlacedAccessories(prev => {
      const updated = prev.map(acc => {
        if (acc.id === accId) {
          return {
            ...acc,
            escalaMetros: scaleMeters === null ? undefined : scaleMeters
          };
        }
        return acc;
      });

      // Sync local selectedAccessory reference if active
      if (selectedAccessory && selectedAccessory.id === accId) {
        setSelectedAccessory((prev: any) => ({
          ...prev,
          escalaMetros: scaleMeters === null ? undefined : scaleMeters
        }));
      }

      localStorage.setItem(`verdantia_accessories_${bedId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectAccessory = (acc: any) => {
    setPlacingPlant(null);
    setPlacingCrop(null);
    setPlacingAccessory(acc);
  };

  // Compute collisions on active crops
  useEffect(() => {
    if (!bancal || crops.length === 0) {
      setCollisions({});
      return;
    }

    const newCollisions: Record<number, boolean> = {};
    const w = parseFloat(bancal.bancalesancho) || 0;
    const l = parseFloat(bancal.bancaleslargo) || 0;

    for (let i = 0; i < crops.length; i++) {
      const cA = crops[i];
      const ax = parseFloat(cA.cultivosposicionx) || 50;
      const ay = parseFloat(cA.cultivosposiciony) || 50;
      const spacingA = Math.max(parseFloat(cA.especiesmarcoplantas) || 30, 20);
      const radiusAMeters = (spacingA / 2) / 100; // cm to radial occupancy meters

      for (let j = i + 1; j < crops.length; j++) {
        const cB = crops[j];
        const bx = parseFloat(cB.cultivosposicionx) || 50;
        const by = parseFloat(cB.cultivosposiciony) || 50;
        const spacingB = Math.max(parseFloat(cB.especiesmarcoplantas) || 30, 20);
        const radiusBMeters = (spacingB / 2) / 100;

        // Distances in physical meters
        const dx = (Math.abs(ax - bx) / 100) * w;
        const dy = (Math.abs(ay - by) / 100) * l;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Radial collision limit
        if (dist < (radiusAMeters + radiusBMeters)) {
          newCollisions[cA.idcultivos] = true;
          newCollisions[cB.idcultivos] = true;
        }
      }
    }
    setCollisions(newCollisions);
  }, [crops, bancal]);

  if (loading || !bancal) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
        justifyContent: 'center', alignItems: 'center', background: '#0f172a', color: 'white'
      }}>
        <div style={{ width: '32px', height: '32px', border: '3px solid #cbd5e1', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
        <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Cargando entorno de diseño de huerto...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Dimension helpers with Spanish comma format
  const formatDec = (val: number | string, decimals: number = 2) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '0';
    return num.toLocaleString('es-ES', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const bedW = parseFloat(bancal.bancalesancho) || 2;
  const bedWSup = bancal.bancalesforma === 'trapezoidal' ? (parseFloat(bancal.bancalesanchosuperior) || 1.5) : bedW;
  const bedL = parseFloat(bancal.bancaleslargo) || 1.2;

  const getCalculatedArea = () => {
    if (bancal.bancalesforma === 'trapezoidal') {
      return ((bedW + bedWSup) / 2) * bedL;
    } else if (bancal.bancalesforma === 'circular') {
      return Math.PI * (bedW / 2) * (bedL / 2);
    }
    return bedW * bedL;
  };

  // Grid Canvas Scales - Using stableScale to prevent infinite zoom feedback loops during resizing
  const baseScale = stableScale;

  const svgW = bedW * baseScale;
  const svgWSup = bedWSup * baseScale;
  const svgH = bedL * baseScale;

  const ox = (400 - svgW) / 2;
  const oxSup = (400 - svgWSup) / 2;
  const oy = (400 - svgH) / 2;
  const minX = Math.min(ox, oxSup);

  // SVG Pan & Zoom handlers
  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (!svgRef.current) return;
    
    // Prevent default to avoid scrolling the whole page if the user scrolls over the canvas
    e.preventDefault();

    const rect = svgRef.current.getBoundingClientRect();
    // Get mouse position relative to the SVG 500x500 viewport coordinate space
    const mx = ((e.clientX - rect.left) / rect.width) * 500;
    const my = ((e.clientY - rect.top) / rect.height) * 500;

    const zoomFactor = 1.08;
    const oldZoom = zoom;
    let newZoom = oldZoom;

    if (e.deltaY < 0) {
      newZoom = Math.min(oldZoom * zoomFactor, 4);
    } else {
      newZoom = Math.max(oldZoom / zoomFactor, 0.5);
    }

    if (newZoom !== oldZoom) {
      // Calculate new pan coordinates so the point under the cursor remains stable.
      // Scaling origin is defined at (250, 250).
      const newPanX = mx - 250 - ((mx - 250 - pan.x) * newZoom) / oldZoom;
      const newPanY = my - 250 - ((my - 250 - pan.y) * newZoom) / oldZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    }
  };

  // Convert screen coordinates to standard 500x500 SVG coordinates, compensating for camera translation and zoom
  const getUnpannedSvgCoords = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 250, y: 250 };
    
    const point = svgRef.current.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return { x: 250, y: 250 };
    
    // Map screen mouse position accurately to the 500x500 viewBox space, ignoring letterboxing
    const svgPoint = point.matrixTransform(ctm.inverse());

    // Compensate for internal camera `<g>` translation (pan) and zoom centered at (250, 250)
    const cx = 250 + (svgPoint.x - 250 - pan.x) / zoom;
    const cy = 250 + (svgPoint.y - 250 - pan.y) / zoom;

    return { x: cx, y: cy };
  };

  const startResizeBed = (e: React.MouseEvent, type: 'width' | 'length' | 'both' | 'topWidth') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingBed(type);
    setResizeStartCoords(getUnpannedSvgCoords(e.clientX, e.clientY));
    setResizeStartDims({
      w: parseFloat(bancal.bancalesancho) || 2,
      l: parseFloat(bancal.bancaleslargo) || 1.2,
      wSup: parseFloat(bancal.bancalesanchosuperior || bancal.bancalesancho) || 1.5,
      baseScale: baseScale
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (draggingCrop || placingPlant || isResizingBed) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isDrawingPath) {
      const coords = getCoordsFromMouse(e);
      setMouseSvgPos(coords);
    }
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (draggingCrop || draggingAccessory) {
      updateDragCoords(e);
    } else if (isResizingBed) {
      const currentCoords = getUnpannedSvgCoords(e.clientX, e.clientY);
      const dxSvg = currentCoords.x - resizeStartCoords.x;
      const dySvg = currentCoords.y - resizeStartCoords.y;
      
      // Symmetrical scaling requires a 2x multiplier because the bed expands evenly on both sides from its center
      const deltaMetersX = (dxSvg / resizeStartDims.baseScale) * 2;
      const deltaMetersY = (dySvg / resizeStartDims.baseScale) * 2;

      if (bancal.bancalesforma === 'circular') {
        const delta = Math.abs(deltaMetersX) > Math.abs(deltaMetersY) ? deltaMetersX : deltaMetersY;
        const newD = Math.max(0.5, Math.min(500.0, resizeStartDims.w + delta));
        setBancal((prev: any) => prev ? { 
          ...prev, 
          bancalesancho: newD.toFixed(2), 
          bancaleslargo: newD.toFixed(2) 
        } : null);
      } else {
        if (isResizingBed === 'width' || isResizingBed === 'both') {
          const newW = Math.max(0.5, Math.min(500.0, resizeStartDims.w + deltaMetersX));
          setBancal((prev: any) => prev ? { ...prev, bancalesancho: newW.toFixed(2) } : null);
        }
        if (isResizingBed === 'topWidth') {
          const newWSup = Math.max(0.5, Math.min(500.0, resizeStartDims.wSup + deltaMetersX));
          setBancal((prev: any) => prev ? { ...prev, bancalesanchosuperior: newWSup.toFixed(2) } : null);
        }
        if (isResizingBed === 'length' || isResizingBed === 'both') {
          const newL = Math.max(0.5, Math.min(500.0, resizeStartDims.l + deltaMetersY));
          setBancal((prev: any) => prev ? { ...prev, bancaleslargo: newL.toFixed(2) } : null);
        }
      }
    } else {
      if (activeBedHighlightSegment) {
        setActiveBedHighlightSegment(null);
      }
    }
  };

  const handleCanvasMouseUp = async () => {
    setIsPanning(false);
    
    if (draggingCrop || draggingAccessory || draggingPath) {
      if (hasDraggedRef.current) {
        persistDragCoords();
      } else {
        // It was a pure click without dragging
        if (wasAlreadySelectedRef.current) {
          setSelectedCrop(null);
          setSelectedAccessory(null);
          setSelectedPath(null);
        }
        setDraggingCrop(null);
        setDraggingAccessory(null);
        setDraggingPath(null);
        setActiveBedHighlightSegment(null);
      }
    } else if (isResizingBed) {
      const finalW = parseFloat(bancal.bancalesancho);
      const finalL = parseFloat(bancal.bancaleslargo);
      const finalWSup = bancal.bancalesforma === 'trapezoidal' ? parseFloat(bancal.bancalesanchosuperior || bancal.bancalesancho) : null;
      
      setIsResizingBed(null);

      try {
        const res = await fetch('/api/user/bancales', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': userEmail || ''
          },
          body: JSON.stringify({
            idbancales: bedId,
            bancalesnombre: bancal.bancalesnombre,
            bancalesancho: finalW,
            bancalesanchosuperior: finalWSup,
            bancaleslargo: finalL,
            bancalesforma: bancal.bancalesforma,
            bancalessigpacprovincia: bancal.bancalessigpacprovincia,
            bancalessigpacmunicipio: bancal.bancalessigpacmunicipio,
            bancalessigpacpoligono: bancal.bancalessigpacpoligono,
            bancalessigpacparcela: bancal.bancalessigpacparcela,
            bancalessigpacrecinto: bancal.bancalessigpacrecinto,
            bancalessigpacsuperficie: bancal.bancalessigpacsuperficie
          })
        });
        if (res.ok) {
          console.log("Bancal redimensionado guardado con éxito.");
        }
      } catch (err) {
        console.error("Error saving bed dimensions:", err);
      }
    }
  };


  // Convert client cursor coords to percentage of the bed frame
  const getCoordsFromMouse = (e: React.MouseEvent) => {
    const unpanned = getUnpannedSvgCoords(e.clientX, e.clientY);

    // Relative percentage inside the bed bounding frame
    let pctX = ((unpanned.x - ox) / svgW) * 100;
    let pctY = ((unpanned.y - oy) / svgH) * 100;

    // Constraints check
    pctX = Math.max(0, Math.min(100, pctX));
    pctY = Math.max(0, Math.min(100, pctY));

    return { x: pctX, y: pctY };
  };

  // Drag existing crop mechanics
  const startDragCrop = (e: React.MouseEvent, crop: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!showBedGuides) {
      alert("⚠️ Para poder colocar o recolocar hortalizas en el diseño es necesario activar y trazar previamente las camas de plantación (haz clic en 'Ver Guías' en el panel izquierdo).");
      return;
    }
    hasDraggedRef.current = false;
    wasAlreadySelectedRef.current = selectedCrop?.idcultivos === crop.idcultivos;
    dragStartCoordsRef.current = { x: e.clientX, y: e.clientY };
    const mousePct = getCoordsFromMouse(e);
    dragOffsetRef.current = {
      x: mousePct.x - (parseFloat(crop.cultivosposicionx) || 50),
      y: mousePct.y - (parseFloat(crop.cultivosposiciony) || 50)
    };
    setDraggingCrop(crop);
    setSelectedCrop(crop);
    setSelectedAccessory(null);
    setSelectedPath(null);
  };

  const startDragAccessory = (e: React.MouseEvent, acc: any) => {
    e.preventDefault();
    e.stopPropagation();
    hasDraggedRef.current = false;
    setDraggingAccessory(acc);
    setSelectedAccessory(acc);
    setSelectedCrop(null);
    setSelectedPath(null);
  };

  const startDragPath = (e: React.MouseEvent, path: any) => {
    e.preventDefault();
    e.stopPropagation();
    hasDraggedRef.current = false;
    setDraggingPath(path);
    setSelectedPath(path);
    setSelectedCrop(null);
    setSelectedAccessory(null);

    const coords = getCoordsFromMouse(e);
    setDragPathStartCoords(coords);
    setDragPathStartPoints([...path.points]);
  };

  const updateDragCoords = (e: React.MouseEvent) => {
    if (!hasDraggedRef.current) {
      const dx = e.clientX - dragStartCoordsRef.current.x;
      const dy = e.clientY - dragStartCoordsRef.current.y;
      // Require at least 5 pixels of movement to count as a drag, preventing click-jump bugs
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      hasDraggedRef.current = true;
    }

    if (draggingCrop) {
      let mousePct = getCoordsFromMouse(e);
      let x = mousePct.x - dragOffsetRef.current.x;
      let y = mousePct.y - dragOffsetRef.current.y;
      
      // GRID SNAPPING LOGIC
      if (showBedGuides && bancal?.bancalesforma !== 'circular') {
        const spacingX = parseFloat(draggingCrop.especiesmarcoplantas) || 30;
        const spacingY = parseFloat(draggingCrop.especiesmarcofilas) || 30;
        const margin = parseFloat(draggingCrop.especiesmarcomargen) || 0;
        const spacingXMeters = spacingX / 100;
        const spacingYMeters = spacingY / 100;
        const marginMeters = margin / 100;
        
        const bedSegments = getBedSegments().filter(s => s.type !== 'pasillo');
        let closestSlot: { x: number, y: number } | null = null;
        let minSqDist = Infinity;
        
        for (const s of bedSegments) {
          const { slots } = getBedLattice(s, spacingXMeters, spacingYMeters, marginMeters);
          for (const slot of slots) {
            const slotPctX = (slot.x / bedW) * 100;
            const slotPctY = (slot.y / bedL) * 100;
            const sqDist = Math.pow(x - slotPctX, 2) + Math.pow(y - slotPctY, 2);
            // 25 squared distance is roughly 5% radius snapping threshold
            if (sqDist < minSqDist && sqDist < 25) { 
              minSqDist = sqDist;
              closestSlot = { x: slotPctX, y: slotPctY };
            }
          }
        }
        
        if (closestSlot) {
          x = closestSlot.x;
          y = closestSlot.y;
        }
      }

      updateBedHighlight(x, y);
      
      // Update locally for visual instant feedback
      setCrops(prev => prev.map(c => {
        if (c.idcultivos === draggingCrop.idcultivos) {
          return { ...c, cultivosposicionx: x, cultivosposiciony: y };
        }
        if (c.idcultivos === draggingCrop.originalIdCultivos) {
          return {
            ...c,
            ubicaciones: c.ubicaciones?.map((ub: any) => 
              ub.idcultivosubicaciones === draggingCrop.idUbicacion
                ? { ...ub, cultivosubicacionesposicionx: x, cultivosubicacionesposiciony: y }
                : ub
            )
          };
        }
        return c;
      }));

      setDraggingCrop((prev: any) => ({ ...prev, cultivosposicionx: x, cultivosposiciony: y }));

      if (selectedCrop && selectedCrop.idcultivos === draggingCrop.idcultivos) {
        setSelectedCrop((prev: any) => ({ ...prev, cultivosposicionx: x, cultivosposiciony: y }));
      }
    } else if (draggingAccessory) {
      const { x, y } = getCoordsFromMouse(e);
      setPlacedAccessories(prev => prev.map(a => 
        a.id === draggingAccessory.id 
          ? { ...a, posicionx: x, posiciony: y }
          : a
      ));
      if (selectedAccessory && selectedAccessory.id === draggingAccessory.id) {
        setSelectedAccessory((prev: any) => ({ ...prev, posicionx: x, posiciony: y }));
      }
    } else if (draggingPath) {
      const currentCoords = getCoordsFromMouse(e);
      const dx = currentCoords.x - dragPathStartCoords.x;
      const dy = currentCoords.y - dragPathStartCoords.y;

      const translatedPoints = dragPathStartPoints.map(pt => {
        let newX = pt.x + dx;
        let newY = pt.y + dy;

        // Clamp to bed bounds (0 to 100)
        newX = Math.max(0, Math.min(100, newX));
        newY = Math.max(0, Math.min(100, newY));

        return { x: newX, y: newY };
      });

      setPlacedPaths(prev => prev.map(p => 
        p.id === draggingPath.id 
          ? { ...p, points: translatedPoints }
          : p
      ));

      if (selectedPath && selectedPath.id === draggingPath.id) {
        setSelectedPath((prev: any) => ({ ...prev, points: translatedPoints }));
      }
    }
  };

  function getBedSegments() {
    if (!bancal) return [];

    const camaBilateral = profile?.camaCultivoBilateral ?? 1.20;
    const camaUnilateral = profile?.camaCultivoUnilateral ?? 0.75;
    const pasilloVal = profile?.pasillo ?? 0.50;

    // Filter paths
    const horizontalPaths = placedPaths.filter(p => {
      if (!p.points || p.points.length < 2) return false;
      const first = p.points[0];
      const last = p.points[p.points.length - 1];
      return Math.abs(last.x - first.x) > Math.abs(last.y - first.y);
    });

    const verticalPaths = placedPaths.filter(p => {
      if (!p.points || p.points.length < 2) return false;
      const first = p.points[0];
      const last = p.points[p.points.length - 1];
      return Math.abs(last.x - first.x) < Math.abs(last.y - first.y);
    });

    const segments: { xStart: number; width: number; yStart: number; height: number; type: string; label: string }[] = [];

    if (bedAlignment === 'horizontal') {
      // 1. Get avg Y positions of horizontal paths
      const pathYPositions = horizontalPaths.map(p => {
        const avgYPct = p.points.reduce((sum: number, pt: any) => sum + pt.y, 0) / p.points.length;
        const avgYMeters = (avgYPct / 100) * bedL;
        return { y: avgYMeters, height: p.widthMeters ?? 0.4 };
      }).sort((a, b) => a.y - b.y);

      // 2. Divide Y into intervals
      const yIntervals: { start: number; end: number; topIsPath: boolean; bottomIsPath: boolean }[] = [];
      let currentStart = 0;
      pathYPositions.forEach(p => {
        const pathTop = Math.max(0, p.y - p.height / 2);
        const pathBottom = Math.min(bedL, p.y + p.height / 2);
        if (pathTop > currentStart + 0.05) {
          yIntervals.push({ start: currentStart, end: pathTop, topIsPath: currentStart > 0, bottomIsPath: true });
        }
        currentStart = pathBottom;
      });
      if (bedL > currentStart + 0.05) {
        yIntervals.push({ start: currentStart, end: bedL, topIsPath: currentStart > 0, bottomIsPath: false });
      }

      // 3. Divide each Y interval into horizontal strips (camas / pasillos)
      const stripsY: { yStart: number; height: number; type: string; label: string }[] = [];
      yIntervals.forEach(inv => {
        const intervalH = inv.end - inv.start;
        if (intervalH <= 0.05) return;

        if (intervalH <= camaUnilateral) {
          stripsY.push({ yStart: inv.start, height: intervalH, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(intervalH, 1)}m)` });
        } else {
          let curY = inv.start;
          stripsY.push({ yStart: curY, height: camaUnilateral, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(camaUnilateral, 1)}m)` });
          curY += camaUnilateral;

          while (curY < inv.end) {
            if (curY + pasilloVal >= inv.end) {
              if (inv.bottomIsPath) {
                const lastStrip = stripsY[stripsY.length - 1];
                if (lastStrip && lastStrip.type !== 'pasillo') {
                  lastStrip.height += (inv.end - curY);
                  lastStrip.label = `${lastStrip.type === 'cama_bilateral' ? 'Cama Bilateral' : 'Cama Unilateral'} (${formatDec(lastStrip.height, 1)}m)`;
                }
              } else {
                stripsY.push({ yStart: curY, height: inv.end - curY, type: 'pasillo', label: `Pasillo (${formatDec(inv.end - curY, 1)}m)` });
              }
              break;
            }
            stripsY.push({ yStart: curY, height: pasilloVal, type: 'pasillo', label: `Pasillo (${formatDec(pasilloVal, 1)}m)` });
            curY += pasilloVal;

            if (curY + camaBilateral <= inv.end) {
              stripsY.push({ yStart: curY, height: camaBilateral, type: 'cama_bilateral', label: `Cama Bilateral (${formatDec(camaBilateral, 1)}m)` });
              curY += camaBilateral;
            } else if (curY + camaUnilateral <= inv.end) {
              stripsY.push({ yStart: curY, height: camaUnilateral, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(camaUnilateral, 1)}m)` });
              curY += camaUnilateral;
            } else {
              if (inv.bottomIsPath) {
                const lastStrip = stripsY[stripsY.length - 1];
                if (lastStrip && lastStrip.type === 'pasillo') {
                  stripsY.push({ yStart: curY, height: inv.end - curY, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(inv.end - curY, 1)}m)` });
                } else if (lastStrip) {
                  lastStrip.height += (inv.end - curY);
                  lastStrip.label = `${lastStrip.type === 'cama_bilateral' ? 'Cama Bilateral' : 'Cama Unilateral'} (${formatDec(lastStrip.height, 1)}m)`;
                }
              } else {
                const remaining = inv.end - curY;
                if (remaining > 0) {
                  stripsY.push({ yStart: curY, height: remaining, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(remaining, 1)}m)` });
                }
              }
              break;
            }
          }
        }
      });

      // 4. Divide X into intervals by vertical paths
      const pathXPositions = verticalPaths.map(p => {
        const avgXPct = p.points.reduce((sum: number, pt: any) => sum + pt.x, 0) / p.points.length;
        const avgXMeters = (avgXPct / 100) * bedW;
        return { x: avgXMeters, width: p.widthMeters ?? 0.4 };
      }).sort((a, b) => a.x - b.x);

      const xIntervals: { start: number; end: number }[] = [];
      currentStart = 0;
      pathXPositions.forEach(p => {
        const pathLeft = Math.max(0, p.x - p.width / 2);
        const pathRight = Math.min(bedW, p.x + p.width / 2);
        if (pathLeft > currentStart + 0.05) {
          xIntervals.push({ start: currentStart, end: pathLeft });
        }
        currentStart = pathRight;
      });
      if (bedW > currentStart + 0.05) {
        xIntervals.push({ start: currentStart, end: bedW });
      }

      // 5. For each strip, split by xIntervals
      stripsY.forEach(s => {
        if (s.type === 'pasillo') {
          segments.push({ xStart: 0, width: bedW, yStart: s.yStart, height: s.height, type: 'pasillo', label: s.label });
        } else {
          // Add the camas
          xIntervals.forEach(xInv => {
            const w = xInv.end - xInv.start;
            if (w > 0.05) {
              segments.push({
                xStart: xInv.start,
                width: w,
                yStart: s.yStart,
                height: s.height,
                type: s.type,
                label: s.label
              });
            }
          });

          // Add the gaps between camas as pasillos inside the container!
          for (let i = 0; i < xIntervals.length - 1; i++) {
            const gapStart = xIntervals[i].end;
            const gapEnd = xIntervals[i+1].start;
            const gapW = gapEnd - gapStart;
            if (gapW > 0.05) {
              segments.push({
                xStart: gapStart,
                width: gapW,
                yStart: s.yStart,
                height: s.height,
                type: 'pasillo',
                label: `Pasillo Intermedio (${formatDec(gapW, 1)}m)`
              });
            }
          }
        }
      });

    } else {
      // bedAlignment === 'vertical'
      // 1. Get avg X positions of vertical paths
      const pathXPositions = verticalPaths.map(p => {
        const avgXPct = p.points.reduce((sum: number, pt: any) => sum + pt.x, 0) / p.points.length;
        const avgXMeters = (avgXPct / 100) * bedW;
        return { x: avgXMeters, width: p.widthMeters ?? 0.4 };
      }).sort((a, b) => a.x - b.x);

      // 2. Divide X into intervals
      const xIntervals: { start: number; end: number; leftIsPath: boolean; rightIsPath: boolean }[] = [];
      let currentStart = 0;
      pathXPositions.forEach(p => {
        const pathLeft = Math.max(0, p.x - p.width / 2);
        const pathRight = Math.min(bedW, p.x + p.width / 2);
        if (pathLeft > currentStart + 0.05) {
          xIntervals.push({ start: currentStart, end: pathLeft, leftIsPath: currentStart > 0, rightIsPath: true });
        }
        currentStart = pathRight;
      });
      if (bedW > currentStart + 0.05) {
        xIntervals.push({ start: currentStart, end: bedW, leftIsPath: currentStart > 0, rightIsPath: false });
      }

      // 3. Divide each X interval into vertical strips (camas / pasillos)
      const stripsX: { xStart: number; width: number; type: string; label: string }[] = [];
      xIntervals.forEach(inv => {
        const intervalW = inv.end - inv.start;
        if (intervalW <= 0.05) return;

        if (intervalW <= camaUnilateral) {
          stripsX.push({ xStart: inv.start, width: intervalW, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(intervalW, 1)}m)` });
        } else {
          let curX = inv.start;
          stripsX.push({ xStart: curX, width: camaUnilateral, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(camaUnilateral, 1)}m)` });
          curX += camaUnilateral;

          while (curX < inv.end) {
            if (curX + pasilloVal >= inv.end) {
              if (inv.rightIsPath) {
                const lastStrip = stripsX[stripsX.length - 1];
                if (lastStrip && lastStrip.type !== 'pasillo') {
                  lastStrip.width += (inv.end - curX);
                  lastStrip.label = `${lastStrip.type === 'cama_bilateral' ? 'Cama Bilateral' : 'Cama Unilateral'} (${formatDec(lastStrip.width, 1)}m)`;
                }
              } else {
                stripsX.push({ xStart: curX, width: inv.end - curX, type: 'pasillo', label: `Pasillo (${formatDec(inv.end - curX, 1)}m)` });
              }
              break;
            }
            stripsX.push({ xStart: curX, width: pasilloVal, type: 'pasillo', label: `Pasillo (${formatDec(pasilloVal, 1)}m)` });
            curX += pasilloVal;

            if (curX + camaBilateral <= inv.end) {
              stripsX.push({ xStart: curX, width: camaBilateral, type: 'cama_bilateral', label: `Cama Bilateral (${formatDec(camaBilateral, 1)}m)` });
              curX += camaBilateral;
            } else if (curX + camaUnilateral <= inv.end) {
              stripsX.push({ xStart: curX, width: camaUnilateral, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(camaUnilateral, 1)}m)` });
              curX += camaUnilateral;
            } else {
              if (inv.rightIsPath) {
                const lastStrip = stripsX[stripsX.length - 1];
                if (lastStrip && lastStrip.type === 'pasillo') {
                  stripsX.push({ xStart: curX, width: inv.end - curX, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(inv.end - curX, 1)}m)` });
                } else if (lastStrip) {
                  lastStrip.width += (inv.end - curX);
                  lastStrip.label = `${lastStrip.type === 'cama_bilateral' ? 'Cama Bilateral' : 'Cama Unilateral'} (${formatDec(lastStrip.width, 1)}m)`;
                }
              } else {
                const remaining = inv.end - curX;
                if (remaining > 0) {
                  stripsX.push({ xStart: curX, width: remaining, type: 'cama_unilateral', label: `Cama Unilateral (${formatDec(remaining, 1)}m)` });
                }
              }
              break;
            }
          }
        }
      });

      // 4. Divide Y into intervals by horizontal paths
      const pathYPositions = horizontalPaths.map(p => {
        const avgYPct = p.points.reduce((sum: number, pt: any) => sum + pt.y, 0) / p.points.length;
        const avgYMeters = (avgYPct / 100) * bedL;
        return { y: avgYMeters, height: p.widthMeters ?? 0.4 };
      }).sort((a, b) => a.y - b.y);

      const yIntervals: { start: number; end: number }[] = [];
      currentStart = 0;
      pathYPositions.forEach(p => {
        const pathTop = Math.max(0, p.y - p.height / 2);
        const pathBottom = Math.min(bedL, p.y + p.height / 2);
        if (pathTop > currentStart + 0.05) {
          yIntervals.push({ start: currentStart, end: pathTop });
        }
        currentStart = pathBottom;
      });
      if (bedL > currentStart + 0.05) {
        yIntervals.push({ start: currentStart, end: bedL });
      }

      // 5. For each strip, split by yIntervals
      stripsX.forEach(s => {
        if (s.type === 'pasillo') {
          segments.push({ xStart: s.xStart, width: s.width, yStart: 0, height: bedL, type: 'pasillo', label: s.label });
        } else {
          // Add the camas
          yIntervals.forEach(yInv => {
            const h = yInv.end - yInv.start;
            if (h > 0.05) {
              segments.push({
                xStart: s.xStart,
                width: s.width,
                yStart: yInv.start,
                height: h,
                type: s.type,
                label: s.label
              });
            }
          });

          // Add the gaps between camas as pasillos inside the container!
          for (let i = 0; i < yIntervals.length - 1; i++) {
            const gapStart = yIntervals[i].end;
            const gapEnd = yIntervals[i+1].start;
            const gapH = gapEnd - gapStart;
            if (gapH > 0.05) {
              segments.push({
                xStart: s.xStart,
                width: s.width,
                yStart: gapStart,
                height: gapH,
                type: 'pasillo',
                label: `Pasillo Intermedio (${formatDec(gapH, 1)}m)`
              });
            }
          }
        }
      });
    }

    return segments;
  };

  function updateBedHighlight(xVal: any, yVal: any) {
    if (!showBedGuides || !bancal || bancal.bancalesforma === 'circular') {
      setActiveBedHighlightSegment(null);
      return;
    }

    const xPct = parseFloat(xVal) || 50;
    const yPct = parseFloat(yVal) || 50;

    const xMeters = (xPct / 100) * bedW;
    const yMeters = (yPct / 100) * bedL;

    const allSegments = getBedSegments();
    const bedSegments = allSegments.filter(s => s.type !== 'pasillo');

    if (bedSegments.length === 0) {
      setActiveBedHighlightSegment(null);
      return;
    }

    let closestSeg = bedSegments[0];
    let minDist = Infinity;

    bedSegments.forEach(s => {
      const centerX = s.xStart + s.width / 2;
      const centerY = s.yStart + s.height / 2;
      
      const dist = Math.sqrt(Math.pow(xMeters - centerX, 2) + Math.pow(yMeters - centerY, 2));
      if (dist < minDist) {
        minDist = dist;
        closestSeg = s;
      }
    });

    setActiveBedHighlightSegment({ xStart: closestSeg.xStart, yStart: closestSeg.yStart });
  };

  const getSnappedCoords = (xVal: any, yVal: any, quantity?: any, spacingXVal?: any, spacingYVal?: any, marginVal?: any) => {
    const xPct = parseFloat(xVal) || 50;
    const yPct = parseFloat(yVal) || 50;
    const N = parseInt(quantity) || 1;
    const spacingX = parseFloat(spacingXVal) || 30;
    const spacingY = parseFloat(spacingYVal) || 30;
    const margin = parseFloat(marginVal) || 0;

    const spacingXMeters = spacingX / 100;
    const spacingYMeters = spacingY / 100;
    const marginMeters = margin / 100;

    if (bancal?.bancalesforma === 'circular') {
      return { x: xPct, y: yPct };
    }

    const allSegments = getBedSegments();
    const bedSegments = allSegments.filter(s => s.type !== 'pasillo');

    if (bedSegments.length === 0) {
      return { x: xPct, y: yPct };
    }

    const xMeters = (xPct / 100) * bedW;
    const yMeters = (yPct / 100) * bedL;

    let closestSeg = bedSegments[0];
    let minDist = Infinity;

    bedSegments.forEach(s => {
      const centerX = s.xStart + s.width / 2;
      const centerY = s.yStart + s.height / 2;
      const dist = Math.sqrt(Math.pow(xMeters - centerX, 2) + Math.pow(yMeters - centerY, 2));
      if (dist < minDist) {
        minDist = dist;
        closestSeg = s;
      }
    });

    // For single plant, snap to nearest grid point from the lattice
    if (N <= 1) {
      const { slots } = getBedLattice(closestSeg, spacingXMeters, spacingYMeters, marginMeters);
      if (slots.length > 0) {
        let nearestSlot = slots[0];
        let nearestDist = Infinity;
        for (const slot of slots) {
          const dist = Math.sqrt(Math.pow(xMeters - slot.x, 2) + Math.pow(yMeters - slot.y, 2));
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestSlot = slot;
          }
        }
        return { x: (nearestSlot.x / bedW) * 100, y: (nearestSlot.y / bedL) * 100 };
      }
      // Fallback: clamp to bed center
      return { x: (closestSeg.xStart + closestSeg.width / 2) / bedW * 100, y: (closestSeg.yStart + closestSeg.height / 2) / bedL * 100 };
    }

    if (bedAlignment === 'horizontal') {
      const snappedYMeters = closestSeg.yStart + closestSeg.height / 2;
      const snappedYPct = (snappedYMeters / bedL) * 100;

      let numRows = 1;
      if (closestSeg.type === 'cama_bilateral' || closestSeg.height >= 1.0) {
        numRows = 2;
      }
      const numCols = Math.ceil(N / numRows);
      const gridW = (numCols - 1) * spacingXMeters;
      const halfGridW = gridW / 2;

      const minXMeters = closestSeg.xStart + halfGridW + marginMeters;
      const maxXMeters = closestSeg.xStart + closestSeg.width - (halfGridW + marginMeters);

      let clampedXMeters = xMeters;
      if (maxXMeters >= minXMeters) {
        clampedXMeters = Math.max(minXMeters, Math.min(maxXMeters, xMeters));
      } else {
        clampedXMeters = closestSeg.xStart + closestSeg.width / 2;
      }
      const clampedXPct = (clampedXMeters / bedW) * 100;

      return { x: clampedXPct, y: snappedYPct };
    } else {
      const snappedXMeters = closestSeg.xStart + closestSeg.width / 2;
      const snappedXPct = (snappedXMeters / bedW) * 100;

      let numCols = 1;
      if (closestSeg.type === 'cama_bilateral' || closestSeg.width >= 1.0) {
        numCols = 2;
      }
      const numRows = Math.ceil(N / numCols);
      const gridH = (numRows - 1) * spacingYMeters;
      const halfGridH = gridH / 2;

      const minYMeters = closestSeg.yStart + halfGridH + marginMeters;
      const maxYMeters = closestSeg.yStart + closestSeg.height - (halfGridH + marginMeters);

      let clampedYMeters = yMeters;
      if (maxYMeters >= minYMeters) {
        clampedYMeters = Math.max(minYMeters, Math.min(maxYMeters, yMeters));
      } else {
        clampedYMeters = closestSeg.yStart + closestSeg.height / 2;
      }
      const clampedYPct = (clampedYMeters / bedL) * 100;

      return { x: snappedXPct, y: clampedYPct };
    }
  };

  const persistDragCoords = async () => {
    setActiveBedHighlightSegment(null);
    if (draggingCrop) {
      const targetCrop = draggingCrop;
      setDraggingCrop(null);

      if (targetCrop) {
        const snapped = getSnappedCoords(
          targetCrop.cultivosposicionx, 
          targetCrop.cultivosposiciony,
          1,
          targetCrop.especiesmarcoplantas,
          targetCrop.especiesmarcofilas,
          targetCrop.especiesmarcomargen
        );

        try {
          if (targetCrop.idUbicacion) {
            await fetch(`/api/user/cultivos/${targetCrop.originalIdCultivos}/ubicaciones/${targetCrop.idUbicacion}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
              body: JSON.stringify({
                cultivosubicacionesposicionx: snapped.x,
                cultivosubicacionesposiciony: snapped.y
              })
            });
          } else {
            await fetch(`/api/user/cultivos/${targetCrop.originalIdCultivos || targetCrop.idcultivos}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
              body: JSON.stringify({
                cultivosposicionx: snapped.x,
                cultivosposiciony: snapped.y
              })
            });
          }
          loadWorkspaceData();
        } catch (err) {
          console.error('Error saving new plant coordinates:', err);
        }
      }
    } else if (draggingAccessory) {
      const targetAcc = placedAccessories.find(a => a.id === draggingAccessory.id);
      setDraggingAccessory(null);
      if (targetAcc) {
        saveAccessories(placedAccessories);
      }
    } else if (draggingPath) {
      const targetPath = placedPaths.find(p => p.id === draggingPath.id);
      setDraggingPath(null);
      if (targetPath) {
        savePaths(placedPaths);
      }
    }
  };

  // Placing a new plant from the library (Modo Siembra)
  const handleSelectToPlant = (plant: any) => {
    if (!showBedGuides) {
      alert("⚠️ Para poder colocar hortalizas en el diseño es necesario activar y trazar previamente las camas de plantación (haz clic en 'Ver Guías' en el panel izquierdo).");
      return;
    }
    setPlacingPlant(plant);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const { x, y } = getCoordsFromMouse(e as any);
    updateBedHighlight(x, y);
  };

  const handleDragLeave = () => {
    setActiveBedHighlightSegment(null);
  };

  const handleCanvasDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setActiveBedHighlightSegment(null);
    const { x, y } = getCoordsFromMouse(e as any);
    
    try {
      const rawData = e.dataTransfer.getData('text/plain');
      if (!rawData) return;
      
      const { item, source } = JSON.parse(rawData);

      // Si se intenta colocar un cultivo y no están trazadas las guías de camas, lo bloqueamos
      if (source === 'catalogo' || source === 'semillas') {
        if (!showBedGuides) {
          alert("⚠️ Para poder colocar hortalizas en el diseño es necesario activar y trazar previamente las camas de plantación (haz clic en 'Ver Guías' en el panel izquierdo).");
          return;
        }
      }
      
      if (source === 'accesorios') {
        const newAcc = {
          id: Date.now(),
          type: item.id,
          nombre: item.nombre,
          icono: item.icono,
          posicionx: x,
          posiciony: y
        };
        // Use existing state to append the new accessory
        setPlacedAccessories(prev => {
          const updated = [...prev, newAcc];
          localStorage.setItem(`verdantia_accessories_${bedId}`, JSON.stringify(updated));
          return updated;
        });
        setSelectedAccessory(newAcc);
        setSelectedCrop(null);
      } else if (source === 'catalogo') {
        const snapped = getSnappedCoords(x, y, 1, item.especiesmarcoplantas, item.especiesmarcofilas);
        const res = await fetch('/api/user/cultivos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
          body: JSON.stringify({
            xcultivosidvariedadesvegetales: item.idespeciesvegetales,
            xcultivosidsemillas: null,
            xcultivosidbancales: bedId,
            cultivoscantidad: 1,
            cultivosposicionx: snapped.x,
            cultivosposiciony: snapped.y,
            cultivosorigen: 'plantel_comprado',
            cultivosmetodo: 'trasplante_directo',
            cultivosestado: 'crecimiento'
          })
        });

        if (res.ok) {
          loadWorkspaceData();
        } else {
          const data = await res.json();
          alert(`Error al plantar: ${data.error || 'Espacio excedido en el bancal.'}`);
        }
      } else if (source === 'semillas') {
        // Arrastrar desde el panel izquierdo a una nueva ubicación
        const snapped = getSnappedCoords(x, y, 1, item.especiesmarcoplantas, item.especiesmarcofilas);
        const res = await fetch(`/api/user/cultivos/${item.idcultivos}/ubicaciones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
          body: JSON.stringify({
            xcultivosubicacionesidbancales: bedId,
            posicionx: snapped.x,
            posiciony: snapped.y
          })
        });

        if (res.ok) {
          loadWorkspaceData();
        } else {
          alert('Error al ubicar la planta en la cama.');
        }

        if (res.ok) {
          loadWorkspaceData();
        } else {
          const data = await res.json();
          alert(`Error al ubicar cultivo: ${data.error || 'No se pudo actualizar la ubicación.'}`);
        }
      } else if (source === 'semillas_group') {
        // Arrastrar la tarjeta completa: usar IA priorizando la cama donde el usuario soltó
        const allCultivos = item._groupedCultivos || [item];
        const totalPlants = allCultivos.reduce((sum: number, gc: any) => sum + (parseInt(gc.cultivoscantidad) || 1), 0);
        
        let virtualCrops = [...crops];
        
        for (const gc of allCultivos) {
          const enrichedCrop = {
            ...gc,
            especiesmarcoplantas: gc.especiesmarcoplantas || item.especiesmarcoplantas,
            especiesmarcofilas: gc.especiesmarcofilas || item.especiesmarcofilas,
            especiesmarcomargen: gc.especiesmarcomargen || item.especiesmarcomargen,
            especiesvegetalesicono: gc.especiesvegetalesicono || item.especiesvegetalesicono,
            especiesvegetalesnombre: gc.especiesvegetalesnombre || item.especiesvegetalesnombre
          };
          
          // Pasar x e y como targetX, targetY para priorizar la cama, y virtualCrops para la secuencia
          await handleAutoPlaceCrop(enrichedCrop, true, x, y, virtualCrops);
        }
        
        loadWorkspaceData();
        alert(`🤖 [IA Verdantia] ¡Grupo ubicado! ${allCultivos.length} cultivos (${totalPlants} plantas) distribuidos inteligentemente empezando por la cama seleccionada.`);
      }
    } catch (err) {
      console.error('Error handling canvas drop:', err);
    }
  };

  const handleCanvasClick = async (e: React.MouseEvent) => {
    const { x, y } = getCoordsFromMouse(e);

    if (isDrawingPath) {
      setDrawnPathPoints(prev => [...prev, { x, y }]);
      return;
    }

    if (placingAccessory) {
      const tempAcc = placingAccessory;
      setPlacingAccessory(null);
      const newAcc = {
        id: Date.now(),
        type: tempAcc.id,
        nombre: tempAcc.nombre,
        icono: tempAcc.icono,
        posicionx: x,
        posiciony: y
      };
      saveAccessories([...placedAccessories, newAcc]);
      setSelectedAccessory(newAcc);
      setSelectedCrop(null);
      return;
    }

    if (placingCrop) {
      // Crops can only be placed by clicking on green grid dots, not on canvas
      return;
    }

    if (placingPlant) {
      if (!showBedGuides) {
        alert("⚠️ Para poder colocar hortalizas en el diseño es necesario activar y trazar previamente las camas de plantación (haz clic en 'Ver Guías' en el panel izquierdo).");
        return;
      }
      
      const targetPlant = placingPlant;
      // DO NOT clear placingPlant here, so they can keep stamping!
      // They can press ESC to cancel.
      
      const virtualCrop = {
        ...targetPlant,
        cultivoscantidad: 1, // Por defecto plantamos 1
        idespeciesvegetales: targetPlant.idespeciesvegetales || targetPlant.xsemillasidvariedadesvegetales,
        xcultivosidsemillas: targetPlant.idsemillas || null,
        cultivosorigen: targetPlant.idsemillas ? 'semilla_inventario' : 'plantel_comprado',
        cultivosmetodo: targetPlant.idsemillas ? 'siembra_directa' : 'trasplante_directo',
        especiesmarcoplantas: targetPlant.especiesmarcoplantas,
        especiesmarcofilas: targetPlant.especiesmarcofilas,
        especiesmarcomargen: targetPlant.especiesmarcomargen,
        especiesvegetalesicono: targetPlant.especiesvegetalesicono,
        especiesvegetalesnombre: targetPlant.especiesvegetalesnombre
      };
      await handleAutoPlaceCrop(virtualCrop, true, x, y); // silent
      return;
    }
    // If we reach here, it's a pure click on the empty SVG canvas background
    setSelectedCrop(null);
    setSelectedAccessory(null);
    setSelectedPath(null);
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent) => {
    if (!isDrawingPath) return;
    e.preventDefault();
    e.stopPropagation();

    if (drawnPathPoints.length < 2) {
      alert("Debes dibujar al menos dos puntos haciendo clic antes de hacer doble clic para terminar.");
      return;
    }

    const newPath = {
      id: Date.now(),
      points: [...drawnPathPoints],
      widthMeters: pathWidthMeters
    };

    savePaths([...placedPaths, newPath]);
    setDrawnPathPoints([]);
    setIsDrawingPath(false);
    setSelectedPath(newPath);
    setSelectedCrop(null);
    setSelectedAccessory(null);
  };

  // Remove/Delete crop action (Desasignar del bancal - Supports unlinking single or all in group)
  const handleRemoveCrop = async (cropId: string | number, varietyId?: number) => {
    try {
      let cropsToRemove: any[] = [];
      if (varietyId) {
        cropsToRemove = flattenedCrops.filter(c => c.xcultivosidvariedadesvegetales === varietyId && String(c.xcultivosidbancales || c.xcultivosubicacionesidbancales) === String(bancal.idbancales));
      } else {
        const myCrop = flattenedCrops.find(c => c.idcultivos === cropId) || allActiveCrops.find(c => c.idcultivos === cropId);
        if (myCrop) cropsToRemove = [myCrop];
      }

      if (cropsToRemove.length === 0) return;

      const promises = cropsToRemove.map(c => {
        if (c.idUbicacion) {
          return fetch(`/api/user/cultivos/${c.originalIdCultivos}/ubicaciones/${c.idUbicacion}`, {
            method: 'DELETE',
            headers: { 'x-user-email': userEmail! }
          });
        } else {
          return fetch(`/api/user/cultivos/${c.idcultivos}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
            body: JSON.stringify({
              xcultivosidbancales: null,
              cultivosposicionx: null,
              cultivosposiciony: null
            })
          });
        }
      });

      const responses = await Promise.all(promises);
      const allOk = responses.every(res => res.ok);

      if (allOk) {
        setSelectedCrop(null);
        loadWorkspaceData();
      } else {
        alert("Ocurrió un error al intentar desasignar el cultivo del bancal.");
        loadWorkspaceData();
      }
    } catch (err) {
      console.error('Error removing crop:', err);
    }
  };

  // Unlink all crops placed in this bed
  const handleRemoveAllCrops = async () => {
    try {
      const cropsToRemove = flattenedCrops;
      if (cropsToRemove.length === 0) {
        alert("No hay cultivos ubicados en este bancal para desvincular.");
        return;
      }

      if (!confirm(`⚠️ ¿Seguro que quieres desvincular los ${cropsToRemove.length} cultivos de este bancal? Volverán al inventario.`)) {
        return;
      }

      const promises = cropsToRemove.map(c => {
        if (c.idUbicacion) {
          return fetch(`/api/user/cultivos/${c.originalIdCultivos}/ubicaciones/${c.idUbicacion}`, {
            method: 'DELETE',
            headers: { 'x-user-email': userEmail! }
          });
        } else {
          return fetch(`/api/user/cultivos/${c.idcultivos}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
            body: JSON.stringify({
              xcultivosidbancales: null,
              cultivosposicionx: null,
              cultivosposiciony: null
            })
          });
        }
      });

      const responses = await Promise.all(promises);
      const allOk = responses.every(res => res.ok);

      if (allOk) {
        setSelectedCrop(null);
        loadWorkspaceData();
      } else {
        alert("Ocurrió un error al desvincular todos los cultivos.");
        loadWorkspaceData();
      }
    } catch (err) {
      console.error('Error removing all crops:', err);
    }
  };

  // Permanent physical delete crop action (Eliminar del repertorio/huerto - Only targets the clicked segment)
  const handleDeleteCrop = async (cropId: string | number) => {
    try {
      const myCrop = flattenedCrops.find(c => c.idcultivos === cropId) || allActiveCrops.find(c => c.idcultivos === cropId);
      if (!myCrop) return;

      const realId = myCrop.originalIdCultivos || myCrop.idcultivos;

      const res = await fetch(`/api/user/cultivos/${realId}`, {
        method: 'DELETE',
        headers: { 'x-user-email': userEmail! }
      });

      if (res.ok) {
        setSelectedCrop(null);
        loadWorkspaceData();
      } else {
        alert("Ocurrió un error al intentar eliminar el cultivo.");
      }
    } catch (err) {
      console.error('Error deleting crop:', err);
    }
  };

  // Update crop state directly
  const handleUpdateCropState = async (newState: string) => {
    if (!selectedCrop) return;
    try {
      // Direct update of selected crop state
      await fetch(`/api/user/cultivos/${selectedCrop.idcultivos}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
        body: JSON.stringify({
          cultivosestado: newState
        })
      });
      setSelectedCrop((prev: any) => ({ ...prev, cultivosestado: newState }));
      loadWorkspaceData();
    } catch (err) {
      console.error('Error updating crop state:', err);
    }
  };

  const getOptimalGrid = (N: number, bedW: number, bedH: number, spacingX: number, spacingY: number) => {
    let bestCols = 1;
    let bestRows = N;
    let bestScore = Infinity;
    let bestRotated = false;

    const orientations = [
      { sx: spacingX, sy: spacingY, rotated: false },
      { sx: spacingY, sy: spacingX, rotated: true }
    ];

    orientations.forEach(ori => {
      for (let c = 1; c <= N; c++) {
        const r = Math.ceil(N / c);
        const neededW = (c - 1) * ori.sx;
        const neededH = (r - 1) * ori.sy;
        
        const penaltyW = Math.max(0, neededW - bedW);
        const penaltyH = Math.max(0, neededH - bedH);
        
        const overhangPenalty = (penaltyW + penaltyH) * 1000;
        
        const bedRatio = bedW / (bedH || 1);
        const gridRatio = neededH > 0 ? neededW / neededH : 1;
        const ratioPenalty = Math.abs(bedRatio - gridRatio);
        
        const score = overhangPenalty + ratioPenalty;
        
        if (score < bestScore) {
          bestScore = score;
          bestCols = c;
          bestRows = r;
          bestRotated = ori.rotated;
        }
      }
    });

    return { numCols: bestCols, numRows: bestRows, rotated: bestRotated };
  };

  function getBedLattice(bed: any, spacingX: number, spacingY: number, margin: number) {
    // bedAlignment decides orientation. 
    // vertical: rows go along Y, so distance between plants in row (X) is spacingY (marcofilas), distance in Y is spacingX (marcoplantas)
    // horizontal: rows go along X, distance in X is spacingX, distance in Y is spacingY
    const effSpaceX = bedAlignment === 'horizontal' ? spacingX : spacingY;
    const effSpaceY = bedAlignment === 'horizontal' ? spacingY : spacingX;
    
    // Physical bounds of the bed
    const availW = Math.max(0, bed.width - 2 * margin);
    const availH = Math.max(0, bed.height - 2 * margin);
    
    // Number of slots
    const numCols = Math.floor(availW / effSpaceX) + 1;
    const numRows = Math.floor(availH / effSpaceY) + 1;
    
    if (numCols < 1 || numRows < 1) return { slots: [], effSpaceX, effSpaceY };

    const gridW = (numCols - 1) * effSpaceX;
    const gridH = (numRows - 1) * effSpaceY;
    
    // Center the grid in the bed
    const startX = bed.xStart + bed.width / 2 - gridW / 2;
    const startY = bed.yStart + bed.height / 2 - gridH / 2;
    
    const slots = [];
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        slots.push({
          x: startX + c * effSpaceX,
          y: startY + r * effSpaceY
        });
      }
    }
    return { slots, effSpaceX, effSpaceY };
  };

  const checkGridCollision = (candX: number, candY: number, thisHalfW: number, thisHalfH: number, cropsToCheck: any[], accsToCheck: any[]) => {
    const allSegments = getBedSegments();
    for (let other of cropsToCheck) {
      const oxPct = parseFloat(other.cultivosposicionx);
      const oyPct = parseFloat(other.cultivosposiciony);
      if (isNaN(oxPct) || isNaN(oyPct)) continue;

      const oxM = (oxPct / 100) * bedW;
      const oyM = (oyPct / 100) * bedL;

      const otherN = parseInt(other.cultivoscantidad) || 1;
      const otherSpX = (parseFloat(other.especiesmarcoplantas) || 30) / 100;
      const otherSpY = (parseFloat(other.especiesmarcofilas) || 30) / 100;
      const otherBed = allSegments.find(b => 
        oxM >= b.xStart && oxM <= b.xStart + b.width && 
        oyM >= b.yStart && oyM <= b.yStart + b.height
      );
      
      let otherHalfW = otherSpX / 2;
      let otherHalfH = otherSpX / 2;

      if (otherBed) {
         const otherOptimal = getOptimalGrid(otherN, otherBed.width, otherBed.height, otherSpX, otherSpY);
         const otherEffX = otherOptimal.rotated ? otherSpY : otherSpX;
         const otherEffY = otherOptimal.rotated ? otherSpX : otherSpY;
         const otherGridW = (otherOptimal.numCols - 1) * otherEffX;
         const otherGridH = (otherOptimal.numRows - 1) * otherEffY;
         otherHalfW = (otherGridW / 2) + (otherSpX / 2);
         otherHalfH = (otherGridH / 2) + (otherSpX / 2);
      }

      const dx = Math.abs(candX - oxM);
      const dy = Math.abs(candY - oyM);
      if (dx < (thisHalfW + otherHalfW - 0.01) && dy < (thisHalfH + otherHalfH - 0.01)) {
        return true;
      }
    }

    for (let acc of accsToCheck) {
      const axPct = parseFloat(acc.posicionx);
      const ayPct = parseFloat(acc.posiciony);
      const axM = (axPct / 100) * bedW;
      const ayM = (ayPct / 100) * bedL;

      const accR = acc.escalaMetros !== undefined ? acc.escalaMetros : getAccessoryPhysicalRadius(acc.type);
      const dxAcc = Math.abs(candX - axM);
      const dyAcc = Math.abs(candY - ayM);
      
      if (dxAcc < (thisHalfW + accR - 0.01) && dyAcc < (thisHalfH + accR - 0.01)) {
        return true;
      }
    }

    return false;
  };

  const handleAutoPlaceCrop = async (cropToPlace: any, silent = false, targetX?: number, targetY?: number, virtualExistingCrops?: any[]) => {
    if (!bancal || !showBedGuides || bancal.bancalesforma === 'circular') {
      if (!silent) alert("⚠️ Para poder auto-ubicar con IA es necesario que las guías de camas estén activadas y que el bancal no sea circular.");
      return;
    }

    const N = parseInt(cropToPlace.cultivoscantidad) || 1;
    const spacingX = parseFloat(cropToPlace.especiesvegetalesmarcoplantas) || 30;
    const spacingY = parseFloat(cropToPlace.especiesvegetalesmarcofilas) || 30;
    const margin = parseFloat(cropToPlace.especiesvegetalesmarcomargen) || 0;

    const spacingXMeters = spacingX / 100;
    const spacingYMeters = spacingY / 100;
    const marginMeters = margin / 100;

    const allSegments = getBedSegments();
    let bedSegments = allSegments.filter(s => s.type !== 'pasillo');

    if (bedSegments.length === 0) {
      if (!silent) alert("⚠️ No se encontraron camas cultivables definidas en este bancal.");
      return;
    }

    // Ordenar camas por distancia al punto objetivo si se proporciona
    if (targetX !== undefined && targetY !== undefined) {
      const targetXMeters = (targetX / 100) * bedW;
      const targetYMeters = (targetY / 100) * bedL;
      bedSegments.sort((a, b) => {
        const cxA = a.xStart + a.width / 2;
        const cyA = a.yStart + a.height / 2;
        const cxB = b.xStart + b.width / 2;
        const cyB = b.yStart + b.height / 2;
        const distA = Math.sqrt(Math.pow(cxA - targetXMeters, 2) + Math.pow(cyA - targetYMeters, 2));
        const distB = Math.sqrt(Math.pow(cxB - targetXMeters, 2) + Math.pow(cyB - targetYMeters, 2));
        return distA - distB;
      });
    }

    // Filter other crops (excluding current crop)
    const baseCrops = virtualExistingCrops || flattenedCrops;
    const otherCrops = baseCrops.filter(c => c.idcultivos !== cropToPlace.idcultivos);

    let optimalX = -1;
    let optimalY = -1;
    let found = false;
    let globalBestDist = Infinity;

    // Scan segments
    for (let s of bedSegments) {
      if (found && targetX === undefined) break;

      const optimal = getOptimalGrid(N, s.width, s.height, spacingXMeters, spacingYMeters);
      const numCols = optimal.numCols;
      const numRows = optimal.numRows;
      const effSpaceX = optimal.rotated ? spacingYMeters : spacingXMeters;
      const effSpaceY = optimal.rotated ? spacingXMeters : spacingYMeters;
      const gridW = (numCols - 1) * effSpaceX;
      const halfGridW = gridW / 2;
      const gridH = (numRows - 1) * effSpaceY;
      const halfGridH = gridH / 2;

      // Calculate lattice alignment to perfectly match the visual preview
      const { slots } = getBedLattice(s, spacingXMeters, spacingYMeters, marginMeters);
      if (slots.length === 0) continue;

      // The valid centers for the bounding box must align with the lattice
      // The leftmost plant is at centerX - halfGridW. It must land on a slot X.
      // So centerX = slotX + halfGridW.
      const xCandidates = Array.from(new Set(slots.map(slot => slot.x + halfGridW)));
      const yCandidates = Array.from(new Set(slots.map(slot => slot.y + halfGridH)));

      const thisBoxHalfW = halfGridW + (effSpaceX / 2);
      const thisBoxHalfH = halfGridH + (effSpaceY / 2);

      // Filter candidates that fit inside the bed
      const validX = xCandidates.filter(x => (x - thisBoxHalfW) >= s.xStart && (x + thisBoxHalfW) <= s.xStart + s.width);
      const validY = yCandidates.filter(y => (y - thisBoxHalfH) >= s.yStart && (y + thisBoxHalfH) <= s.yStart + s.height);

      // Removed local bestDist
      for (let xCandidate of validX) {
        for (let yCandidate of validY) {
          const collides = checkGridCollision(xCandidate, yCandidate, thisBoxHalfW, thisBoxHalfH, otherCrops, placedAccessories);
          if (!collides) {
            const candidateXPct = (xCandidate / bedW) * 100;
            const candidateYPct = (yCandidate / bedL) * 100;
            if (targetX !== undefined && targetY !== undefined) {
              const dist = Math.sqrt(Math.pow(candidateXPct - targetX, 2) + Math.pow(candidateYPct - targetY, 2));
              if (dist < globalBestDist) {
                globalBestDist = dist;
                optimalX = candidateXPct;
                optimalY = candidateYPct;
                found = true;
              }
            } else {
              optimalX = candidateXPct;
              optimalY = candidateYPct;
              found = true;
              break;
            }
          }
        }
        if (found && targetX === undefined) break;
      }
    }

    if (found) {
      try {
        if (cropToPlace.idcultivos) {
          await fetch(`/api/user/cultivos/${cropToPlace.idcultivos}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
            body: JSON.stringify({
              xcultivosidbancales: bedId,
              cultivosposicionx: optimalX,
              cultivosposiciony: optimalY
            })
          });

          // Update local state reactively
          setSelectedCrop((prev: any) => {
            if (prev && prev.idcultivos === cropToPlace.idcultivos) {
              return {
                ...prev,
                xcultivosidbancales: bedId,
                cultivosposicionx: optimalX,
                cultivosposiciony: optimalY
              };
            }
            return prev;
          });
        } else {
          await fetch('/api/user/cultivos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
            body: JSON.stringify({
              xcultivosidvariedadesvegetales: cropToPlace.idespeciesvegetales || cropToPlace.xcultivosidvariedadesvegetales,
              xcultivosidsemillas: null,
              xcultivosidbancales: bedId,
              cultivoscantidad: N,
              cultivosposicionx: optimalX,
              cultivosposiciony: optimalY,
              cultivosorigen: 'plantel_comprado',
              cultivosmetodo: 'trasplante_directo',
              cultivosestado: 'crecimiento',
              cultivosfechainicio: new Date().toISOString().split('T')[0]
            })
          });
        }

        // Add to virtual existing crops so sequential placements see it
        if (virtualExistingCrops) {
          virtualExistingCrops.push({
            ...cropToPlace,
            xcultivosidbancales: bedId,
            cultivosposicionx: optimalX,
            cultivosposiciony: optimalY
          });
        }

        if (!silent) loadWorkspaceData();
        if (!silent) alert("🤖 [IA Verdantia] ¡Ubicación optimizada con éxito! El cultivo ha sido posicionado de forma agrupada y óptima en una cama de cultivo libre.");
      } catch (err) {
        console.error("Error auto-placing crop:", err);
      }
    } else {
      // ── ALGORITMO MULTI-CAMA ARMÓNICO DE DISTRIBUCIÓN GREEDY ──
      // Si el lote completo no cabe en una única cama, buscamos distribuirlo de forma armónica 
      // ocupando las camas que sean necesarias.
      let remaining = N;
      const placements = [];
      let virtualCrops = [...otherCrops];

      while (remaining > 0) {
        let placedThisRound = false;

        for (let k = remaining; k >= 1; k--) {
          let globalBestDistForK = Infinity;
          let bestBedId = null;
          let globalOptX = -1;
          let globalOptY = -1;

          for (let s of bedSegments) {
            let foundForK = false;
            let optX = -1;
            let optY = -1;

            const optimal = getOptimalGrid(k, s.width, s.height, spacingXMeters, spacingYMeters);
            const numCols = optimal.numCols;
            const numRows = optimal.numRows;
            const effSpaceX = optimal.rotated ? spacingYMeters : spacingXMeters;
            const effSpaceY = optimal.rotated ? spacingXMeters : spacingYMeters;
            const gridW = (numCols - 1) * effSpaceX;
            const halfGridW = gridW / 2;
            const gridH = (numRows - 1) * effSpaceY;
            const halfGridH = gridH / 2;

            const { slots } = getBedLattice(s, spacingXMeters, spacingYMeters, marginMeters);
            if (slots.length === 0) continue;

            const xCandidates = Array.from(new Set(slots.map(slot => slot.x + halfGridW)));
            const yCandidates = Array.from(new Set(slots.map(slot => slot.y + halfGridH)));

            const thisBoxHalfW = halfGridW + (effSpaceX / 2);
            const thisBoxHalfH = halfGridH + (effSpaceY / 2);

            const validX = xCandidates.filter(x => (x - thisBoxHalfW) >= s.xStart && (x + thisBoxHalfW) <= s.xStart + s.width);
            const validY = yCandidates.filter(y => (y - thisBoxHalfH) >= s.yStart && (y + thisBoxHalfH) <= s.yStart + s.height);

            // Removed local bestDistForK
            for (let xCandidate of validX) {
              for (let yCandidate of validY) {
                const collides = checkGridCollision(xCandidate, yCandidate, thisBoxHalfW, thisBoxHalfH, virtualCrops, placedAccessories);
                if (!collides) {
                  const candidateXPct = (xCandidate / bedW) * 100;
                  const candidateYPct = (yCandidate / bedL) * 100;
                  if (targetX !== undefined && targetY !== undefined) {
                    const dist = Math.sqrt(Math.pow(candidateXPct - targetX, 2) + Math.pow(candidateYPct - targetY, 2));
                    if (dist < globalBestDistForK) {
                      globalBestDistForK = dist;
                      globalOptX = candidateXPct;
                      globalOptY = candidateYPct;
                      bestBedId = null;
                      foundForK = true;
                    }
                  } else {
                    optX = candidateXPct;
                    optY = candidateYPct;
                    foundForK = true;
                    break;
                  }
                }
              }
              if (foundForK && targetX === undefined) break;
            }

            if (foundForK && targetX === undefined) {
              placements.push({ qty: k, x: optX, y: optY, bedId: null });
              remaining -= k;
              virtualCrops.push({
                idcultivos: Date.now() + Math.random(),
                cultivosposicionx: optX,
                cultivosposiciony: optY,
                especiesmarcoplantas: spacingX,
                especiesmarcofilas: spacingY,
                cultivoscantidad: k,
                idbancalescamas: null
              });
              placedThisRound = true;
              break; // Break the beds loop!
            }
          }

          if (globalBestDistForK !== Infinity) {
             // We found the absolute best position across all beds for targetX!
             placements.push({ qty: k, x: globalOptX, y: globalOptY, bedId: bestBedId });
             remaining -= k;
             virtualCrops.push({
               idcultivos: Date.now() + Math.random(),
               cultivosposicionx: globalOptX,
               cultivosposiciony: globalOptY,
               especiesmarcoplantas: spacingX,
               especiesmarcofilas: spacingY,
               cultivoscantidad: k,
               idbancalescamas: bestBedId
             });
             placedThisRound = true;
          }
          if (placedThisRound) break; // Break the k loop!
        }

        if (!placedThisRound) {
          if (!silent) alert(`⚠️ No hay espacio suficiente en el bancal para alojar las ${remaining} plantas restantes.`);
          break;
        }
      }

      if (remaining < N && placements.length > 0) {
        try {
          let startIndex = 1;
          
          if (cropToPlace.idcultivos) {
            // 1. Modificar el cultivo original con la cantidad y coordenadas de la primera cama
            const firstP = placements[0];
            await fetch(`/api/user/cultivos/${cropToPlace.idcultivos}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
              body: JSON.stringify({
                xcultivosidbancales: firstP.bedId,
                cultivosposicionx: firstP.x,
                cultivosposiciony: firstP.y,
                cultivoscantidad: firstP.qty
              })
            });
          } else {
            startIndex = 0; // Si es nuevo, todos son POST
          }

          // 2. Insertar nuevos registros para el resto de distribuciones
          for (let i = startIndex; i < placements.length; i++) {
            const p = placements[i];
            await fetch('/api/user/cultivos', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail! },
              body: JSON.stringify({
                xcultivosidvariedadesvegetales: cropToPlace.xcultivosidvariedadesvegetales,
                xcultivosidsemillas: cropToPlace.xcultivosidsemillas || null,
                xcultivosidbancales: p.bedId,
                cultivosposicionx: p.x,
                cultivosposiciony: p.y,
                cultivoscantidad: p.qty,
                cultivosnumerocoleccion: cropToPlace.cultivosnumerocoleccion,
                cultivosorigen: cropToPlace.cultivosorigen || 'plantel_comprado',
                cultivosmetodo: cropToPlace.cultivosmetodo || 'trasplante_directo',
                cultivosestado: cropToPlace.cultivosestado || 'crecimiento',
                cultivosfechainicio: cropToPlace.cultivosfechainicio || new Date().toISOString().split('T')[0],
                cultivosubicacion: cropToPlace.cultivosubicacion || null,
                cultivosobservaciones: cropToPlace.cultivosobservaciones || null
              })
            });
            
            // Add piece to virtual existing crops
            if (virtualExistingCrops) {
              virtualExistingCrops.push({
                ...cropToPlace,
                xcultivosidbancales: bedId,
                cultivosposicionx: p.x,
                cultivosposiciony: p.y,
                cultivoscantidad: p.qty
              });
            }
          }

          setSelectedCrop(null);
          if (!silent) loadWorkspaceData();
          if (!silent) alert(`🤖 [IA Verdantia] Distribución Multi-Cama exitosa. El lote de ${N} plantas no cabía completo en una cama, por lo que la IA lo ha repartido armónicamente en ${placements.length} camas ocupando lo justo necesario.`);
        } catch (err) {
          console.error("Error distributing crops across beds:", err);
          if (!silent) alert("⚠️ Ocurrió un error al intentar distribuir los cultivos en las camas.");
        }
      } else {
        if (!silent) alert("⚠️ No se encontró suficiente espacio libre para distribuir el lote de plantas de manera armoniosa en las camas de este bancal, incluso repartiéndolo entre múltiples camas.");
      }
    }
  };

  const filteredCatalog = catalog.filter(item => 
    item.especiesvegetalesnombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredActiveCrops = (() => {
    // 1. Filter active crops first by search query
    const filtered = allActiveCrops.filter(crop => {
      const unassignedQty = parseInt(crop.cultivoscantidad) - (crop.ubicaciones?.length || 0);
      return unassignedQty > 0 &&
        ((crop.especiesvegetalesnombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (crop.variedad_nombre || '').toLowerCase().includes(searchQuery.toLowerCase()));
    });

    // 2. Group them by xcultivosidvariedadesvegetales (variety ID)
    const groups: Record<number, any[]> = {};

    filtered.forEach(crop => {
      const varId = crop.xcultivosidvariedadesvegetales;
      if (varId) {
        if (!groups[varId]) groups[varId] = [];
        groups[varId].push(crop);
      }
    });

    // 3. For each group, collapse into a single representative crop object displaying the sum of quantities
    const collapsedGroups = Object.keys(groups).map(varIdStr => {
      const varId = parseInt(varIdStr);
      const list = groups[varId];
      
      // Sort list to prefer crop records placed in the current bancal
      list.sort((a, b) => {
        const aIsHere = String(a.xcultivosidbancales) === String(bedId);
        const bIsHere = String(b.xcultivosidbancales) === String(bedId);
        if (aIsHere && !bIsHere) return -1;
        if (!aIsHere && bIsHere) return 1;
        return 0;
      });

      const representative = { ...list[0] };
      const totalQty = list.reduce((sum, item) => sum + (parseInt(item.cultivoscantidad) || 0), 0);
      const asignadosQty = list.reduce((sum, item) => {
        if (item.ubicaciones) {
          return sum + item.ubicaciones.length;
        } else if (item.cultivosposicionx != null) {
          return sum + (parseInt(item.cultivoscantidad) || 1);
        }
        return sum;
      }, 0);
      
      representative.cultivoscantidad = totalQty;
      representative.asignados = asignadosQty;
      representative.pendientes = totalQty - asignadosQty;
      
      // Store the full list of individual cultivo IDs for navigation
      representative._groupedCultivos = list.map((c: any) => ({ idcultivos: c.idcultivos, cultivoscantidad: c.cultivoscantidad, cultivosnumerocoleccion: c.cultivosnumerocoleccion }));

      // Determine placement status coalesced for the grouped card
      const hasHere = list.some(item => String(item.xcultivosidbancales) === String(bedId));
      const hasOther = list.some(item => item.xcultivosidbancales && String(item.xcultivosidbancales) !== String(bedId));

      if (hasHere) {
        representative.xcultivosidbancales = parseInt(bedId);
      } else if (hasOther) {
        representative.xcultivosidbancales = -999;
      } else {
        representative.xcultivosidbancales = null;
      }

      return representative;
    });

    // Sort final collapsed list
    return collapsedGroups.sort((a, b) => {
      const aIsHere = String(a.xcultivosidbancales) === String(bedId);
      const bIsHere = String(b.xcultivosidbancales) === String(bedId);
      if (aIsHere && !bIsHere) return -1;
      if (!aIsHere && bIsHere) return 1;
      return 0;
    });
  })();

  // --- Legend Calculations ---
  const bedAreaCalculated = bancal?.bancalesforma === 'trapezoidal'
    ? ((bedW + bedWSup) / 2) * bedL
    : bancal?.bancalesforma === 'circular'
      ? Math.PI * Math.pow(bedW / 2, 2)
      : bedW * bedL;
  
  const usedAreaMeters = flattenedCrops.reduce((acc, c) => {
    const pW = (parseFloat(c.especiesmarcoplantas) || 0) / 100;
    const pL = (parseFloat(c.especiesmarcofilas) || 0) / 100;
    return acc + (pW * pL);
  }, 0);
  
  const pctUsedCalculated = bedAreaCalculated > 0 ? Math.min(100, (usedAreaMeters / bedAreaCalculated) * 100).toFixed(1) : '0.0';

  const legendCropsList = Object.values(flattenedCrops.reduce((acc: any, c) => {
    const id = c.originalIdCultivos || c.idcultivos;
    if (!acc[id]) {
      acc[id] = { ...c, count: 0 };
    }
    acc[id].count += 1;
    return acc;
  }, {})).sort((a: any, b: any) => (a.cultivosnumerocoleccion || 0) - (b.cultivosnumerocoleccion || 0));

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw',
      background: '#0f172a', color: '#f8fafc', overflow: 'hidden', fontFamily: 'system-ui, sans-serif'
    }}>
      {/* ── Botonera de Navegación ── */}
      <div style={{
        padding: '12px 24px',
        display: 'flex',
        gap: '12px',
        background: '#111827',
        borderBottom: '1px solid #1f2937'
      }}>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            background: '#1f2937', color: '#f8fafc', border: '1px solid #374151',
            padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center',
            gap: '6px', transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#374151';
            e.currentTarget.style.borderColor = '#4b5563';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#1f2937';
            e.currentTarget.style.borderColor = '#374151';
          }}
        >
          🏠 Volver al Inicio
        </button>
      </div>

      {/* ── Subheader Integrado (Variante de Editor con Fondo Degradado Emerald/Teal) ── */}
      <div style={{
        background: 'linear-gradient(to right, #047857, #0f766e)',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #10b981',
        flexShrink: 0
      }}>
        {/* Left Side: Title & Dimensions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🚜 Diseñador: {bancal.bancalesnombre}
            </h1>
            <span style={{
              background: '#064e3b', color: '#34d399', fontSize: '0.65rem',
              fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
              textTransform: 'uppercase', border: '1px solid #059669',
              marginRight: '6px'
            }}>{bancal.bancalesforma}</span>

            {/* Asistente Nano Banana 🍌 placed right next to shape badge */}
            <button 
              onClick={triggerNanoBanana}
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', 
                border: '1px solid #f59e0b', 
                color: '#1e293b',
                padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                fontWeight: 700, fontSize: '0.72rem', display: 'flex',
                alignItems: 'center', gap: '4px', transition: 'all 0.2s',
                boxShadow: '0 0 10px rgba(251, 191, 36, 0.25)',
                flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(251, 191, 36, 0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(251, 191, 36, 0.25)';
              }}
            >
              <Sparkles size={12} /> Asistente Nano Banana 🍌
            </button>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#a7f3d0' }}>
            Dimensiones: {bancal.bancalesforma === 'trapezoidal' ? `${formatDec(bedWSup,1)}m/${formatDec(bedW,1)}m` : `${formatDec(bedW,1)}m`} × {formatDec(bedL,1)}m = <strong style={{ color: '#34d399' }}>{formatDec(getCalculatedArea(), 2)} m²</strong>
          </p>
        </div>

        {/* Center Side: Zoom, Reset, Ruler, and % Controls Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '4px'
        }}>
          <button 
            onClick={handleZoomIn} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: 'white', 
              width: '26px', 
              height: '26px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s'
            }} 
            title="Acercar"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <Plus size={13} />
          </button>
          <button 
            onClick={handleZoomOut} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: 'white', 
              width: '26px', 
              height: '26px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s'
            }} 
            title="Alejar"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <Minus size={13} />
          </button>
          <button 
            onClick={handleResetView} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: 'white', 
              width: '26px', 
              height: '26px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s'
            }} 
            title="Restablecer Vista"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            <RefreshCw size={11} />
          </button>
          <button 
            onClick={() => setShowMeasures(!showMeasures)} 
            style={{ 
              background: showMeasures ? '#10b981' : 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: showMeasures ? '#111827' : 'white', 
              width: '26px', 
              height: '26px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s'
            }} 
            title={showMeasures ? "Ocultar Cotas y Medidas" : "Mostrar Cotas y Medidas"}
            onMouseEnter={e => {
              if (!showMeasures) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              if (!showMeasures) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Ruler size={13} />
          </button>
          <button 
            onClick={() => {
              const nextVal = !showPlantingFrames;
              setShowPlantingFrames(nextVal);
              localStorage.setItem('verdantia_show_planting_frames', String(nextVal));
            }} 
            style={{ 
              background: showPlantingFrames ? '#10b981' : 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: showPlantingFrames ? '#111827' : 'white', 
              width: '26px', 
              height: '26px', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              transition: 'all 0.2s'
            }} 
            title={showPlantingFrames ? "Ocultar Marcos de Plantación" : "Mostrar Marcos de Plantación"}
            onMouseEnter={e => {
              if (!showPlantingFrames) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={e => {
              if (!showPlantingFrames) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <Grid size={13} />
          </button>
          <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.15)', height: '14px', margin: '0 2px' }} />

          <div style={{ padding: '0 6px', fontSize: '0.7rem', color: '#a7f3d0', fontWeight: 'bold' }}>
            {Math.round(zoom * 100)}%
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isDrawingPath && (
            <div style={{
              background: '#047857', border: '1px solid #34d399', color: '#ecfdf5',
              padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '1.1rem' }}>🛣️</span> Trazar Sendero: Haz clics en el lienzo para crear curvas. **Doble Clic para Terminar**.
              <button 
                onClick={() => {
                  setIsDrawingPath(false);
                  setDrawnPathPoints([]);
                }}
                style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontWeight: 'bold', marginLeft: '6px' }}
              >
                Cancelar
              </button>
            </div>
          )}
          {placingPlant && (
            <div style={{
              background: '#78350f', border: '1px solid #d97706', color: '#fef3c7',
              padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '1.1rem' }}>📍</span> Modo Siembra: Haz click en el lienzo para plantar {placingPlant.especiesvegetalesnombre || placingPlant.variedadesvegetalesnombre}
              <button 
                onClick={() => setPlacingPlant(null)}
                style={{ background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontWeight: 'bold', marginLeft: '6px' }}
              >
                Cancelar
              </button>
            </div>
          )}
          {placingCrop && (
            <div style={{
              background: '#047857', border: '1px solid #34d399', color: '#ecfdf5',
              padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '1.1rem' }}>📍</span> Ubicar Cultivo: Haz click en el lienzo para situar {placingCrop.especiesvegetalesnombre} ({placingCrop.variedad_nombre || 'Común'})
              <button 
                onClick={() => setPlacingCrop(null)}
                style={{ background: 'none', border: 'none', color: '#a7f3d0', cursor: 'pointer', fontWeight: 'bold', marginLeft: '6px' }}
              >
                Cancelar
              </button>
            </div>
          )}
          {placingAccessory && (
            <div style={{
              background: '#1e3a8a', border: '1px solid #3b82f6', color: '#eff6ff',
              padding: '6px 14px', borderRadius: '10px', fontSize: '0.8rem',
              fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '1.1rem' }}>📍</span> Colocar Accesorio: Haz click en el lienzo para situar {placingAccessory.nombre}
              <button 
                onClick={() => setPlacingAccessory(null)}
                style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontWeight: 'bold', marginLeft: '6px' }}
              >
                Cancelar
              </button>
            </div>
          )}
          <button 
            onClick={loadWorkspaceData}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#f8fafc',
              padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.8rem', display: 'flex',
              alignItems: 'center', gap: '6px', transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <RefreshCw size={14} /> Sincronizar
          </button>
        </div>
      </div>

      {/* Main layout frame */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
        
         {/* COLUMN 1: LEFT PALETTE / BOTANICAL LIBRARY */}
        <aside style={{
          width: showLeftSidebar ? '320px' : '0px',
          background: '#111827',
          borderRight: showLeftSidebar ? '1px solid #1f2937' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Box de dimensiones de camas y pasillos personalizadas */}
          {profile && (
            <div style={{
              margin: '16px 16px 0',
              padding: '12px 14px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(15, 118, 110, 0.08))',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '0.75rem', fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  📏 Camas y Pasillos del Usuario
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.7rem', color: '#cbd5e1', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#9ca3af', display: 'block', fontSize: '0.6rem', marginBottom: '2px' }}>↕️ Bilateral</span>
                    <strong>{formatDec(profile.camaCultivoBilateral ?? 1.20, 2)}m</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#9ca3af', display: 'block', fontSize: '0.6rem', marginBottom: '2px' }}>🧱 Unilateral</span>
                    <strong>{formatDec(profile.camaCultivoUnilateral ?? 0.75, 2)}m</strong>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px 4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <span style={{ color: '#9ca3af', display: 'block', fontSize: '0.6rem', marginBottom: '2px' }}>🚶 Pasillo</span>
                    <strong>{formatDec(profile.pasillo ?? 0.50, 2)}m</strong>
                  </div>
                </div>
              </div>

              {/* Botones de acción de trazado y guías */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {/* Botón premium IA de optimización */}
                <button
                  onClick={handleAiOptimizeBeds}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #059669, #0d9488)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 8px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(13, 148, 136, 0.4)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #047857, #0f766e)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(13, 148, 136, 0.2)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #0d9488)';
                  }}
                  title="Optimizar Trazado IA"
                >
                  <Sparkles size={12} /> Trazado IA
                </button>

                {/* Botón de Quitar/Eliminar Directrices de Camas y Pasillos */}
                <button
                  onClick={handleToggleBedGuides}
                  style={{
                    flex: 1,
                    background: showBedGuides ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    color: showBedGuides ? '#f87171' : '#34d399',
                    border: showBedGuides ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 8px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = showBedGuides ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = showBedGuides ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
                  }}
                  title={showBedGuides ? "Ocultar Directrices de Camas y Pasillos" : "Mostrar Directrices de Camas y Pasillos"}
                >
                  {showBedGuides ? '🗑️ Quitar Guías' : '👁️ Ver Guías'}
                </button>
              </div>

              {crops.length > 0 && (
                <button
                  onClick={handleRemoveAllCrops}
                  style={{
                    width: '100%',
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '10px 8px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    marginTop: '8px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                  }}
                  title="Desvincular todas las semillas de este bancal"
                >
                  🔗 Desvincular Todo ({crops.length})
                </button>
              )}
            </div>
          )}

          {/* Search bar */}
          <div style={{ padding: '16px', borderBottom: '1px solid #1f2937' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: '#6b7280' }} />
              <input 
                type="text"
                placeholder="Buscar semillas o plantas..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', background: '#1f2937', border: '1px solid #374151',
                  borderRadius: '10px', padding: '8px 12px 8px 36px', fontSize: '0.85rem',
                  color: 'white', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Tab selectors */}
          <div style={{
            display: 'flex', borderBottom: '1px solid #1f2937', background: '#111827',
            padding: '4px'
          }}>
            <button 
              onClick={() => setLibraryTab('semillas')}
              style={{
                flex: 1, background: libraryTab === 'semillas' ? '#1f2937' : 'transparent',
                border: 'none', color: libraryTab === 'semillas' ? '#f8fafc' : '#9ca3af',
                padding: '8px 0', fontSize: '0.75rem', fontWeight: 700,
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🌱 Cultivos
            </button>
            <button 
              onClick={() => setLibraryTab('catalogo')}
              style={{
                flex: 1, background: libraryTab === 'catalogo' ? '#1f2937' : 'transparent',
                border: 'none', color: libraryTab === 'catalogo' ? '#f8fafc' : '#9ca3af',
                padding: '8px 0', fontSize: '0.75rem', fontWeight: 700,
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              📖 Catálogo
            </button>
            <button 
              onClick={() => setLibraryTab('accesorios')}
              style={{
                flex: 1, background: libraryTab === 'accesorios' ? '#1f2937' : 'transparent',
                border: 'none', color: libraryTab === 'accesorios' ? '#f8fafc' : '#9ca3af',
                padding: '8px 0', fontSize: '0.75rem', fontWeight: 700,
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🪵 Accesorios
            </button>
          </div>

          {/* Cards List container */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {libraryTab === 'semillas' ? (
              filteredActiveCrops.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#6b7280', fontSize: '0.8rem' }}>
                  No tienes cultivos activos de esta búsqueda en tu huerto.
                </div>
              ) : (
                filteredActiveCrops.map(item => (
                  <div 
                    key={item.idcultivos}
                    draggable
                    onDragStart={(e) => {
                      if (!showBedGuides) {
                        e.preventDefault();
                        alert("⚠️ Para poder colocar hortalizas en el diseño es necesario activar y trazar previamente las camas de plantación (haz clic en 'Ver Guías' en el panel izquierdo).");
                        return;
                      }
                      // Desde la tarjeta: enviar TODOS los cultivos del grupo
                      e.dataTransfer.setData('text/plain', JSON.stringify({ item, source: 'semillas_group' }));
                    }}
                    onClick={() => {
                      if (!showBedGuides) {
                        alert("⚠️ Para poder colocar hortalizas en el diseño es necesario activar y trazar previamente las camas de plantación (haz clic en 'Ver Guías' en el panel izquierdo).");
                        return;
                      }
                      setPlacingPlant(null);
                      setPlacingCrop(item);
                      setSelectedCrop(item);
                      setSelectedAccessory(null);
                      setSelectedPath(null);
                    }}
                    style={{
                      background: '#1f2937', border: '1px solid #374151', borderRadius: '12px',
                      padding: '12px', cursor: 'grab', transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative',
                      borderColor: placingCrop?.idcultivos === item.idcultivos ? '#10b981' : '#374151'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#10b981';
                      setHoveredCropToPreview(item);
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = placingCrop?.idcultivos === item.idcultivos ? '#10b981' : '#374151';
                      setHoveredCropToPreview(null);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        {renderSpeciesIcon(item.especiesvegetalesicono)}
                        {(item._groupedCultivos || []).length <= 1 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const group = item._groupedCultivos || [];
                              router.push(`/dashboard/cultivos/${group[0]?.idcultivos || item.idcultivos}?from=bancal&bancalId=${bedId}`);
                            }}
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#60a5fa',
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              padding: '3px 6px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.55rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px',
                              transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                            }}
                            title="Editar ficha y tareas de este cultivo"
                          >
                            ✏️ Editar
                          </button>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {(item._groupedCultivos || []).map((gc: any) => (
                              <button
                                key={gc.idcultivos}
                                draggable
                                onDragStart={(e) => {
                                  e.stopPropagation();
                                  if (!showBedGuides) {
                                    e.preventDefault();
                                    return;
                                  }
                                  // Desde botón individual: enviar SOLO este cultivo
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    item: { ...gc, especiesmarcoplantas: item.especiesmarcoplantas, especiesmarcofilas: item.especiesmarcofilas, especiesmarcomargen: item.especiesmarcomargen, especiesvegetalesicono: item.especiesvegetalesicono, especiesvegetalesnombre: item.especiesvegetalesnombre },
                                    source: 'semillas'
                                  }));
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/cultivos/${gc.idcultivos}?from=bancal&bancalId=${bedId}`);
                                }}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#60a5fa',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  cursor: 'grab',
                                  fontWeight: 700,
                                  fontSize: '0.5rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  transition: 'all 0.2s',
                                  whiteSpace: 'nowrap'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                                  setHoveredCropToPreview({ ...gc, especiesmarcoplantas: item.especiesmarcoplantas, especiesmarcofilas: item.especiesmarcofilas, especiesmarcomargen: item.especiesmarcomargen, especiesvegetalesicono: item.especiesvegetalesicono, especiesvegetalesnombre: item.especiesvegetalesnombre });
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                                  setHoveredCropToPreview(null);
                                }}
                                title={`Arrastrar solo cultivo #${gc.cultivosnumerocoleccion || gc.idcultivos} (${gc.cultivoscantidad} uds) · Click para editar`}
                              >
                                {`✏️ #${gc.cultivosnumerocoleccion || gc.idcultivos} (${gc.cultivoscantidad})`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', background: '#374151', color: '#9ca3af', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                            #{item.cultivosnumerocoleccion || item.idcultivos}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              fontSize: '0.65rem', 
                              background: item.xcultivosidbancales === bancal.idbancales 
                                ? '#064e3b' 
                                : item.xcultivosidbancales 
                                  ? '#1e2937' 
                                  : '#78350f', 
                              color: item.xcultivosidbancales === bancal.idbancales 
                                ? '#34d399' 
                                : item.xcultivosidbancales 
                                  ? '#9ca3af' 
                                  : '#fbbf24', 
                              padding: '1px 6px', 
                              borderRadius: '4px', 
                              fontWeight: 700 
                            }}>
                              {item.xcultivosidbancales === bancal.idbancales 
                                ? '📍 Ubicado aquí' 
                                : item.xcultivosidbancales 
                                  ? '🚜 En otro bancal' 
                                  : '⏳ Sin Ubicar'}
                            </span>
                            
                            {item.xcultivosidbancales === bancal.idbancales && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`¿Desvincular todos los cultivos de ${item.especiesvegetalesnombre} de este bancal?`)) {
                                    handleRemoveCrop(item.idcultivos, item.xcultivosidvariedadesvegetales);
                                  }
                                }}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.2)',
                                  color: '#fca5a5',
                                  border: '1px solid rgba(239, 68, 68, 0.4)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: 700,
                                  fontSize: '0.6rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '2px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                }}
                                title="Desvincular todos los cultivos de esta variedad de este bancal"
                              >
                                🔗 desvincular
                              </button>
                            )}
                          </div>
                        </div>
                        <h4 style={{ margin: '4px 0 2px', fontSize: '0.85rem', color: 'white', fontWeight: 700 }}>
                          {item.especiesvegetalesnombre}{item.variedad_nombre ? <span style={{ fontWeight: 400, color: '#9ca3af' }}> ({item.variedad_nombre})</span> : null}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>
                          Total: {item.cultivoscantidad || 1} <span style={{ color: '#34d399' }}>(Asignados: {item.asignados || 0})</span> <span style={{ color: '#fbbf24' }}>(Pendientes: {item.pendientes || 0})</span>
                          <br />
                          Marco: {item.especiesmarcoplantas}x{item.especiesmarcofilas}cm{item.especiesmarcomargen !== null && item.especiesmarcomargen !== undefined ? ` • Margen: ${item.especiesmarcomargen}cm` : ''}
                        </p>
                        <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 800 }}>
                          Estado: <span style={{ color: '#fbbf24' }}>{item.cultivosestado}</span>
                        </p>

                        {/* Botón IA de Ubicación Rápida en Tarjeta */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Evitar disparar la selección/placing manual de la tarjeta
                              handleAutoPlaceCrop(item);
                            }}
                            style={{
                              flex: 2,
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                              transition: 'transform 0.15s, box-shadow 0.15s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scale(1.02)';
                              e.currentTarget.style.boxShadow = '0 4px 10px rgba(16, 185, 129, 0.35)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.boxShadow = '0 2px 6px rgba(16, 185, 129, 0.2)';
                            }}
                          >
                            <Sparkles size={12} style={{ flexShrink: 0 }} /> Ubicar con IA
                          </button>

                          {item.xcultivosidbancales === bancal.idbancales && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`¿Desvincular todos los cultivos de ${item.especiesvegetalesnombre} de este bancal?`)) {
                                  handleRemoveCrop(item.idcultivos, item.xcultivosidvariedadesvegetales);
                                }
                              }}
                              style={{
                                flex: 1,
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.25)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                              }}
                              title="Desvincular todos los cultivos de esta variedad de este bancal"
                            >
                              🔗 Quitar
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : libraryTab === 'catalogo' ? (
              filteredCatalog.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: '#6b7280', fontSize: '0.8rem' }}>
                  No se encontraron especies en el catálogo.
                </div>
              ) : (
                filteredCatalog.map(item => (
                  <div 
                    key={item.idespeciesvegetales}
                    draggable
                    onDragStart={(e) => {
                      if (!showBedGuides) {
                        e.preventDefault();
                        alert("⚠️ Para poder colocar hortalizas en el diseño es necesario activar y trazar previamente las camas de plantación (haz clic en 'Ver Guías' en el panel izquierdo).");
                        return;
                      }
                      e.dataTransfer.setData('text/plain', JSON.stringify({ item, source: 'catalogo' }));
                    }}
                    onClick={() => handleSelectToPlant(item)}
                    style={{
                      background: '#1f2937', border: '1px solid #374151', borderRadius: '12px',
                      padding: '12px', cursor: 'grab', transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      borderColor: placingPlant?.idespeciesvegetales === item.idespeciesvegetales ? '#fbbf24' : '#374151'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = '#10b981';
                      setHoveredCropToPreview({ ...item, cultivoscantidad: 1 });
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = placingPlant?.idespeciesvegetales === item.idespeciesvegetales ? '#fbbf24' : '#374151';
                      setHoveredCropToPreview(null);
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {renderSpeciesIcon(item.especiesvegetalesicono)}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 2px', fontSize: '0.85rem', color: 'white', fontWeight: 700 }}>
                          {item.especiesvegetalesnombre}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>
                          Marco: {item.especiesmarcoplantas}x{item.especiesmarcofilas}cm{item.especiesmarcomargen !== null && item.especiesmarcomargen !== undefined ? ` • Margen: ${item.especiesmarcomargen}cm` : ''} • Ciclo: {item.especiesciclodevida || 'anual'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              <>
                {/* Botón de Trazar Sendero Continuo */}
                <button
                  onClick={() => {
                    setIsDrawingPath(true);
                    setDrawnPathPoints([]);
                    setPlacingPlant(null);
                    setPlacingCrop(null);
                    setPlacingAccessory(null);
                    setSelectedCrop(null);
                    setSelectedAccessory(null);
                    setSelectedPath(null);
                  }}
                  style={{
                    background: isDrawingPath ? '#047857' : '#1e3a8a',
                    color: 'white',
                    border: isDrawingPath ? '1px solid #34d399' : '1px solid #3b82f6',
                    padding: '12px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '10px',
                    width: '100%',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = isDrawingPath ? '#065f46' : '#1d4ed8';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = isDrawingPath ? '#047857' : '#1e3a8a';
                  }}
                >
                  🛣️ Trazar Sendero Continuo
                </button>

                {ACCESSORIES_LIBRARY.map(item => (
                <div 
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', JSON.stringify({ item, source: 'accesorios' }));
                  }}
                  onClick={() => handleSelectAccessory(item)}
                  style={{
                    background: '#1f2937', border: '1px solid #374151', borderRadius: '12px',
                    padding: '12px', cursor: 'grab', transition: 'all 0.2s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    borderColor: placingAccessory?.id === item.id ? '#3b82f6' : '#374151'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = placingAccessory?.id === item.id ? '#3b82f6' : '#374151'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.8rem' }}>{item.icono}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 2px', fontSize: '0.85rem', color: 'white', fontWeight: 700 }}>
                        {item.nombre}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#9ca3af' }}>
                        {item.tamaño} • {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))
              }
              </>
            )}
          </div>
        </aside>

        {/* COLUMN 2: CENTER WORKSPACE CANVAS (SVG) */}
        <main style={{
          flex: 1, background: '#090d16', display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden', userSelect: 'none'
        }}>
          {/* Collapsible Sidebar Handles */}
          {/* Left Handle */}
          <button
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 40,
              width: '24px',
              height: '56px',
              background: 'rgba(17, 24, 39, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#10b981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title={showLeftSidebar ? "Colapsar panel izquierdo" : "Expandir panel izquierdo"}
            onMouseEnter={e => {
              e.currentTarget.style.border = '1px solid #10b981';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(16,185,129,0.4)';
              e.currentTarget.style.color = '#34d399';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.color = '#10b981';
            }}
          >
            {showLeftSidebar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {/* Right Handle */}
          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 40,
              width: '24px',
              height: '56px',
              background: 'rgba(17, 24, 39, 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              color: '#10b981',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title={showRightSidebar ? "Colapsar panel derecho" : "Expandir panel derecho"}
            onMouseEnter={e => {
              e.currentTarget.style.border = '1px solid #10b981';
              e.currentTarget.style.boxShadow = '0 0 10px rgba(16,185,129,0.4)';
              e.currentTarget.style.color = '#34d399';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.3)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
              e.currentTarget.style.color = '#10b981';
            }}
          >
            {showRightSidebar ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {/* Immersive Interactive Grid Drawing Area */}
          <div 
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleCanvasDrop}
            onWheel={handleCanvasWheel}
            style={{
              flex: 1, width: '100%', height: '100%', cursor: placingPlant || isDrawingPath ? 'crosshair' : isPanning ? 'grabbing' : 'grab',
              display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative'
            }}
          >
            {/* Legend Overlay */}
            <div style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10,
              background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)',
              border: '1px solid #334155', borderRadius: '8px', padding: '12px',
              color: '#f8fafc', fontSize: '0.75rem', minWidth: '220px', pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#34d399', fontWeight: 'bold' }}>Leyenda del Bancal</h4>
              <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #334155' }}>
                <span style={{ color: '#9ca3af' }}>Ocupación: </span>
                <strong style={{ color: parseFloat(pctUsedCalculated) > 90 ? '#ef4444' : '#fbbf24' }}>{pctUsedCalculated}%</strong>
              </div>
              {legendCropsList.length === 0 ? (
                <span style={{ color: '#64748b', fontStyle: 'italic' }}>Bancal vacío</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {legendCropsList.map((c: any) => (
                    <div key={c.originalIdCultivos || c.idcultivos} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        <span style={{ color: '#9ca3af', marginRight: '4px' }}>#{c.cultivosnumerocoleccion || String(c.originalIdCultivos || c.idcultivos).substring(0, 3)}</span>
                        {c.especiesvegetalesnombre} <span style={{ color: '#64748b' }}>({c.variedad_nombre || 'S/V'})</span>
                      </span>
                      <strong style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px' }}>{c.count} uds</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* The SVG Canvas viewport */}
            <svg 
              ref={svgRef}
              width="100%" height="100%" viewBox="0 0 500 500"
              style={{
                background: '#f4f9f4',
                backgroundImage: `
                  linear-gradient(to right, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(16, 185, 129, 0.1) 1px, transparent 1px),
                  linear-gradient(to right, rgba(16, 185, 129, 0.04) 0.5px, transparent 0.5px),
                  linear-gradient(to bottom, rgba(16, 185, 129, 0.04) 0.5px, transparent 0.5px)
                `,
                backgroundSize: '30px 30px, 30px 30px, 15px 15px, 15px 15px',
                border: 'none', overflow: 'hidden', display: 'block'
              }}
            >

              <defs>
                {/* Real-world drop shadow filter for 3D depth */}
                <filter id="bed-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.25" />
                </filter>

                {/* Hand-drawn wobbly sketch filter to make vector lines look organic and imperfect */}
                <filter id="sketch-filter" x="-10%" y="-10%" width="120%" height="120%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" />
                </filter>

                {/* Combined hand-drawn sketch wobbly filter with a wobbly drop shadow */}
                <filter id="sketch-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
                  <feDropShadow in="displaced" dx="0" dy="5" stdDeviation="5" floodColor="#000000" floodOpacity="0.22" />
                </filter>

                {/* Artistic pencil parallel hatching pattern to overlay on soil */}
                <pattern id="hatch-pattern" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="12" stroke="rgba(89, 60, 39, 0.12)" strokeWidth="1" />
                </pattern>
                
                {/* Organic fertile soil gradient - Warm, rich and bright sunlit humus soil */}
                <linearGradient id="soil-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8c674f" />
                  <stop offset="50%" stopColor="#75533c" />
                  <stop offset="100%" stopColor="#593c27" />
                </linearGradient>

                {/* Premium wood plank texture gradient - Vibrant sun-drenched glowing oak wood */}
                <linearGradient id="wood-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a16207" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#a16207" />
                </linearGradient>

                {/* Galvanized metal steel bracket texture */}
                <linearGradient id="metal-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
              </defs>

              {/* Viewport translation group for pan & zoom support */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} style={{ transformOrigin: '250px 250px', transition: isPanning ? 'none' : 'transform 0.15s ease-out' }}>
                
                {/* 1. SVG BED SHAPE OUTLINE - REALISTIC WOODEN RAISED BED DESIGN */}
                {bancal.bancalesforma === 'rectangular' && (
                  <g>
                    {/* Wooden thick outer frame with drop shadow */}
                    <rect
                      x={ox - 6} y={oy - 6}
                      width={svgW + 12} height={svgH + 12}
                      rx="12"
                      fill="url(#wood-gradient)"
                      stroke="#2d1505"
                      strokeWidth="1.5"
                      filter="url(#sketch-shadow)"
                    />
                    {/* Inner soil area */}
                    <rect
                      x={ox} y={oy}
                      width={svgW} height={svgH}
                      rx="6"
                      fill="url(#soil-gradient)"
                      stroke="#271408"
                      strokeWidth="1"
                      filter="url(#sketch-filter)"
                    />
                    {/* Artistic pencil hatching overlay */}
                    <rect
                      x={ox} y={oy}
                      width={svgW} height={svgH}
                      rx="6"
                      fill="url(#hatch-pattern)"
                      style={{ pointerEvents: 'none' }}
                      filter="url(#sketch-filter)"
                    />
                    {/* Galvanized metal corner brackets with tiny brass rivets */}
                    {/* Top Left */}
                    <rect x={ox - 8} y={oy - 8} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                    <circle cx={ox - 4} cy={oy - 4} r="1" fill="#f59e0b" />
                    <circle cx={ox} cy={oy} r="1" fill="#f59e0b" />
                    {/* Top Right */}
                    <rect x={ox + svgW - 4} y={oy - 8} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                    <circle cx={ox + svgW} cy={oy - 4} r="1" fill="#f59e0b" />
                    <circle cx={ox + svgW + 4} cy={oy} r="1" fill="#f59e0b" />
                    {/* Bottom Left */}
                    <rect x={ox - 8} y={oy + svgH - 4} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                    <circle cx={ox - 4} cy={oy + svgH} r="1" fill="#f59e0b" />
                    <circle cx={ox} cy={oy + svgH + 4} r="1" fill="#f59e0b" />
                    {/* Bottom Right */}
                    <rect x={ox + svgW - 4} y={oy + svgH - 4} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                    <circle cx={ox + svgW} cy={oy + svgH + 4} r="1" fill="#f59e0b" />
                    <circle cx={ox + svgW + 4} cy={oy + svgH} r="1" fill="#f59e0b" />
                  </g>
                )}

                {bancal.bancalesforma === 'circular' && (
                  <g>
                    {/* Wooden thick outer circle tub */}
                    <circle
                      cx="200" cy="200"
                      r={svgW / 2 + 6}
                      fill="url(#wood-gradient)"
                      stroke="#2d1505"
                      strokeWidth="1.5"
                      filter="url(#sketch-shadow)"
                    />
                    {/* Inner soil area */}
                    <circle
                      cx="200" cy="200"
                      r={svgW / 2}
                      fill="url(#soil-gradient)"
                      stroke="#271408"
                      strokeWidth="1"
                      filter="url(#sketch-filter)"
                    />
                    {/* Artistic pencil hatching overlay */}
                    <circle
                      cx="200" cy="200"
                      r={svgW / 2}
                      fill="url(#hatch-pattern)"
                      style={{ pointerEvents: 'none' }}
                      filter="url(#sketch-filter)"
                    />
                    {/* Metallic circular band highlights (Rivet points around the wooden tub) */}
                    {Array.from({ length: 8 }).map((_, i) => {
                      const angle = (i * Math.PI) / 4;
                      const rx = 200 + (svgW / 2 + 3) * Math.cos(angle);
                      const ry = 200 + (svgW / 2 + 3) * Math.sin(angle);
                      return <circle key={i} cx={rx} cy={ry} r="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />;
                    })}
                  </g>
                )}

                {bancal.bancalesforma === 'trapezoidal' && (
                  <g>
                    {/* Thick wooden frame underlay using double-stroke overlay trick */}
                    <polygon
                      points={`
                        ${oxSup},${oy} 
                        ${oxSup + svgWSup},${oy} 
                        ${ox + svgW},${oy + svgH} 
                        ${ox},${oy + svgH}
                      `}
                      fill="url(#wood-gradient)"
                      stroke="url(#wood-gradient)"
                      strokeWidth="12"
                      strokeLinejoin="round"
                      filter="url(#sketch-shadow)"
                    />
                    <polygon
                      points={`
                        ${oxSup},${oy} 
                        ${oxSup + svgWSup},${oy} 
                        ${ox + svgW},${oy + svgH} 
                        ${ox},${oy + svgH}
                      `}
                      stroke="#2d1505"
                      strokeWidth="14"
                      strokeLinejoin="round"
                      style={{ fill: 'none' }}
                      filter="url(#sketch-filter)"
                    />
                    {/* Inner soil area */}
                    <polygon
                      points={`
                        ${oxSup},${oy} 
                        ${oxSup + svgWSup},${oy} 
                        ${ox + svgW},${oy + svgH} 
                        ${ox},${oy + svgH}
                      `}
                      fill="url(#soil-gradient)"
                      stroke="#271408"
                      strokeWidth="1"
                      strokeLinejoin="round"
                      filter="url(#sketch-filter)"
                    />
                    {/* Artistic pencil hatching overlay */}
                    <polygon
                      points={`
                        ${oxSup},${oy} 
                        ${oxSup + svgWSup},${oy} 
                        ${ox + svgW},${oy + svgH} 
                        ${ox},${oy + svgH}
                      `}
                      fill="url(#hatch-pattern)"
                      style={{ pointerEvents: 'none' }}
                      strokeLinejoin="round"
                      filter="url(#sketch-filter)"
                    />
                    {/* Steel brackets on the four corners of the trapezoid */}
                    <rect x={oxSup - 6} y={oy - 6} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                    <rect x={oxSup + svgWSup - 6} y={oy - 6} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                    <rect x={ox + svgW - 6} y={oy + svgH - 6} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                    <rect x={ox - 6} y={oy + svgH - 6} width="12" height="12" rx="2" fill="url(#metal-gradient)" stroke="#1e293b" strokeWidth="0.5" filter="url(#sketch-filter)" />
                  </g>
                )}

                {/* 1.1. USER-ASSOCIATED PLANTING BEDS & PATHWAYS OVERLAY GUIDES */}
                {showBedGuides && bancal.bancalesforma !== 'circular' && (() => {
                  const segments = getBedSegments();
                  return (
                    <g style={{ pointerEvents: 'none' }}>
                      {segments.map((s, idx) => {
                        const cyStart = oy + (s.yStart / bedL) * svgH;
                        const cHeight = (s.height / bedL) * svgH;
                        const cxStart = ox + (s.xStart / bedW) * svgW;
                        const cWidth = (s.width / bedW) * svgW;
                        const isCama = s.type !== 'pasillo';
                        const isHighlighted = isCama && activeBedHighlightSegment && 
                          Math.abs(activeBedHighlightSegment.xStart - s.xStart) < 0.01 && 
                          Math.abs(activeBedHighlightSegment.yStart - s.yStart) < 0.01;

                        const isOccupied = isCama && flattenedCrops.some(c => {
                          const oxPct = parseFloat(c.cultivosposicionx);
                          const oyPct = parseFloat(c.cultivosposiciony);
                          if (isNaN(oxPct) || isNaN(oyPct)) return false;
                          const oxM = (oxPct / 100) * bedW;
                          const oyM = (oyPct / 100) * bedL;
                          return oxM >= s.xStart - 0.01 && 
                                 oxM <= s.xStart + s.width + 0.01 && 
                                 oyM >= s.yStart - 0.01 && 
                                 oyM <= s.yStart + s.height + 0.01;
                        });

                        return (
                          <g key={idx}>
                            {bancal.bancalesforma === 'rectangular' ? (
                              <rect
                                x={cxStart}
                                y={cyStart}
                                width={cWidth}
                                height={cHeight}
                                fill={isHighlighted ? 'rgba(16, 185, 129, 0.45)' : (isCama ? (isOccupied ? 'rgba(16, 185, 129, 0.38)' : 'rgba(52, 211, 153, 0.16)') : 'rgba(245, 158, 11, 0.14)')}
                                stroke={isHighlighted ? '#10b981' : (isCama ? (isOccupied ? '#10b981' : 'rgba(16, 185, 129, 0.45)') : 'rgba(217, 119, 6, 0.42)')}
                                strokeWidth={isHighlighted ? 2.5 / zoom : (isOccupied ? 2 / zoom : 1 / zoom)}
                                strokeDasharray={isHighlighted ? undefined : (isCama ? (isOccupied ? undefined : '4 4') : '2 4')}
                                filter="url(#sketch-filter)"
                              />
                            ) : (
                              (() => {
                                const getTrapezoidPoint = (xMeters: number, yMeters: number) => {
                                  const ratio = yMeters / bedL;
                                  const leftEdge = oxSup + ratio * (ox - oxSup);
                                  const rightEdge = (oxSup + svgWSup) + ratio * ((ox + svgW) - (oxSup + svgWSup));
                                  const currentWidth = rightEdge - leftEdge;
                                  return leftEdge + (xMeters / bedW) * currentWidth;
                                };

                                const xTopLeft = getTrapezoidPoint(s.xStart, s.yStart);
                                const xTopRight = getTrapezoidPoint(s.xStart + s.width, s.yStart);
                                const xBottomLeft = getTrapezoidPoint(s.xStart, s.yStart + s.height);
                                const xBottomRight = getTrapezoidPoint(s.xStart + s.width, s.yStart + s.height);

                                return (
                                  <polygon
                                    points={`
                                      ${xTopLeft},${cyStart}
                                      ${xTopRight},${cyStart}
                                      ${xBottomRight},${cyStart + cHeight}
                                      ${xBottomLeft},${cyStart + cHeight}
                                    `}
                                    fill={isHighlighted ? 'rgba(16, 185, 129, 0.45)' : (isCama ? (isOccupied ? 'rgba(16, 185, 129, 0.38)' : 'rgba(52, 211, 153, 0.16)') : 'rgba(245, 158, 11, 0.14)')}
                                    stroke={isHighlighted ? '#10b981' : (isCama ? (isOccupied ? '#10b981' : 'rgba(16, 185, 129, 0.45)') : 'rgba(217, 119, 6, 0.42)')}
                                    strokeWidth={isHighlighted ? 2.5 / zoom : (isOccupied ? 2 / zoom : 1 / zoom)}
                                    strokeDasharray={isHighlighted ? undefined : (isCama ? (isOccupied ? undefined : '4 4') : '2 4')}
                                    filter="url(#sketch-filter)"
                                  />
                                );
                              })()
                            )}

                            {!isCama && cHeight >= 16 && cWidth >= 16 && (
                              <g transform={`translate(${cxStart + cWidth / 2}, ${cyStart + cHeight / 2})`}>
                                <text
                                  x="0"
                                  y="3"
                                  textAnchor="middle"
                                  fill="#d97706"
                                  fillOpacity="0.65"
                                  fontSize={6.5}
                                  fontWeight="bold"
                                  style={{ userSelect: 'none' }}
                                >
                                  🚶 PASILLO
                                </text>
                              </g>
                            )}
                            
                            {isCama && showMeasures && cHeight >= 16 && cWidth >= 30 && (
                              <g transform={`translate(${cxStart + 17}, ${cyStart + 7})`}>
                                <rect x="-16" y="-5" width="32" height="7" rx="1.5" fill="#1e293b" fillOpacity="0.85" />
                                <text
                                  x="0"
                                  y="1"
                                  textAnchor="middle"
                                  fill="#34d399"
                                  fontSize="4.5"
                                  fontWeight="bold"
                                  style={{ userSelect: 'none', letterSpacing: '0.2px' }}
                                >
                                  {formatDec(s.width, 2)} x {formatDec(s.height, 2)}m
                                </text>
                              </g>
                            )}
                            
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}

                {/* 1.5. PLACED CONTINUOUS PATHS */}
                {placedPaths.map(path => {
                  if (!path.points || path.points.length < 2) return null;
                  
                  // Construct the SVG path string 'M cx0 cy0 L cx1 cy1 ...'
                  const pathD = path.points.map((pt: any, index: number) => {
                    const cx = ox + (pt.x / 100) * svgW;
                    const cy = oy + (pt.y / 100) * svgH;
                    return `${index === 0 ? 'M' : 'L'} ${cx} ${cy}`;
                  }).join(' ');

                  const strokeW = (path.widthMeters / bedW) * svgW;
                  const isSelected = selectedPath?.id === path.id;

                  return (
                    <g key={path.id}>
                      {/* Selection highlight (slightly wider glowing background when selected) */}
                      {isSelected && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#34d399"
                          strokeWidth={strokeW + 6}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeOpacity="0.3"
                          style={{ pointerEvents: 'none' }}
                          filter="url(#sketch-filter)"
                        />
                      )}

                      {/* Main gravel path background */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#4b5563"
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#sketch-filter)"
                      />

                      {/* Stepping stones / slab inner detail */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth={strokeW * 0.7}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="6,9"
                        filter="url(#sketch-filter)"
                      />

                      {/* Invisible wide interactive overlay for clicking/selecting the path */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={Math.max(16, strokeW)}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ cursor: draggingPath?.id === path.id ? 'grabbing' : 'grab' }}
                        onMouseDown={(e) => startDragPath(e, path)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPath(path);
                          setSelectedCrop(null);
                          setSelectedAccessory(null);
                        }}
                      />
                    </g>
                  );
                })}

                {/* 1.6. DYNAMIC ACTIVE DRAWING PATH PREVIEW */}
                {isDrawingPath && drawnPathPoints.length > 0 && (
                  <g>
                    {/* Points placed so far */}
                    {drawnPathPoints.map((pt, idx) => {
                      const cx = ox + (pt.x / 100) * svgW;
                      const cy = oy + (pt.y / 100) * svgH;
                      return (
                        <circle
                          key={idx}
                          cx={cx} cy={cy}
                          r={4 / zoom}
                          fill="#10b981"
                          stroke="white"
                          strokeWidth={1 / zoom}
                        />
                      );
                    })}

                    {/* Pre-drawn line segments */}
                    {(() => {
                      const points = [...drawnPathPoints];
                      if (mouseSvgPos) {
                        points.push(mouseSvgPos);
                      }
                      
                      const previewD = points.map((pt, idx) => {
                        const cx = ox + (pt.x / 100) * svgW;
                        const cy = oy + (pt.y / 100) * svgH;
                        return `${idx === 0 ? 'M' : 'L'} ${cx} ${cy}`;
                      }).join(' ');

                      const previewStrokeW = (pathWidthMeters / bedW) * svgW;

                      return (
                        <>
                          {/* Elastic path preview background */}
                          <path
                            d={previewD}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth={previewStrokeW}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeOpacity="0.4"
                            style={{ pointerEvents: 'none' }}
                          />
                          {/* Elastic dashed inner line */}
                          <path
                            d={previewD}
                            fill="none"
                            stroke="white"
                            strokeWidth={previewStrokeW * 0.7}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="4,6"
                            strokeOpacity="0.6"
                            style={{ pointerEvents: 'none' }}
                          />
                        </>
                      );
                    })()}
                  </g>
                )}

                {/* CAD RULERS & MEASUREMENT LABELS */}
                {showMeasures && (
                  <g style={{ pointerEvents: 'none' }}>
                    {/* 1. Base / Ancho Inferior / Diámetro Horizontal */}
                    {bancal.bancalesforma !== 'circular' ? (
                      <g>
                        <g filter="url(#sketch-filter)">
                          <line x1={ox} y1={oy + svgH + 16} x2={ox + svgW} y2={oy + svgH + 16} stroke="#64748b" strokeWidth="1" />
                          <line x1={ox} y1={oy + svgH + 4} x2={ox} y2={oy + svgH + 24} stroke="#475569" strokeWidth="1" />
                          <line x1={ox + svgW} y1={oy + svgH + 4} x2={ox + svgW} y2={oy + svgH + 24} stroke="#475569" strokeWidth="1" />
                          <line x1={ox - 4} y1={oy + svgH + 20} x2={ox + 4} y2={oy + svgH + 12} stroke="#475569" strokeWidth="1.5" />
                          <line x1={ox + svgW - 4} y1={oy + svgH + 20} x2={ox + svgW + 4} y2={oy + svgH + 12} stroke="#475569" strokeWidth="1.5" />
                        </g>
                        <text x={ox + svgW / 2} y={oy + svgH + 28} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
                          {formatDec(bedW, 2)}m
                        </text>
                      </g>
                    ) : (
                      <g>
                        <g filter="url(#sketch-filter)">
                          <line x1={200 - svgW / 2} y1={200 + svgW / 2 + 16} x2={200 + svgW / 2} y2={200 + svgW / 2 + 16} stroke="#64748b" strokeWidth="1" />
                          <line x1={200 - svgW / 2} y1={200 + svgW / 2 + 4} x2={200 - svgW / 2} y2={200 + svgW / 2 + 24} stroke="#475569" strokeWidth="1" />
                          <line x1={200 + svgW / 2} y1={200 + svgW / 2 + 4} x2={200 + svgW / 2} y2={200 + svgW / 2 + 24} stroke="#475569" strokeWidth="1" />
                          <line x1={200 - svgW / 2 - 4} y1={200 + svgW / 2 + 20} x2={200 - svgW / 2 + 4} y2={200 + svgW / 2 + 12} stroke="#475569" strokeWidth="1.5" />
                          <line x1={200 + svgW / 2 - 4} y1={200 + svgW / 2 + 20} x2={200 + svgW / 2 + 4} y2={200 + svgW / 2 + 12} stroke="#475569" strokeWidth="1.5" />
                        </g>
                        <text x={200} y={200 + svgW / 2 + 28} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
                          Ø {formatDec(bedW, 2)}m
                        </text>
                      </g>
                    )}

                    {/* 2. Ancho Superior (Base Menor - Solo Trapecios) */}
                    {bancal.bancalesforma === 'trapezoidal' && (
                      <g>
                        <g filter="url(#sketch-filter)">
                          <line x1={oxSup} y1={oy - 16} x2={oxSup} y2={oy - 16} stroke="#64748b" strokeWidth="1" />
                          <line x1={oxSup} y1={oy - 4} x2={oxSup} y2={oy - 24} stroke="#475569" strokeWidth="1" />
                          <line x1={oxSup + svgWSup} y1={oy - 4} x2={oxSup + svgWSup} y2={oy - 24} stroke="#475569" strokeWidth="1" />
                          <line x1={oxSup - 4} y1={oy - 12} x2={oxSup + 4} y2={oy - 20} stroke="#475569" strokeWidth="1.5" />
                          <line x1={oxSup + svgWSup - 4} y1={oy - 12} x2={oxSup + svgWSup + 4} y2={oy - 20} stroke="#475569" strokeWidth="1.5" />
                        </g>
                        <text x={oxSup + svgWSup / 2} y={oy - 24} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">
                          Sup: {formatDec(bedWSup, 2)}m
                        </text>
                      </g>
                    )}

                    {/* 3. Largo (Vertical) */}
                    {bancal.bancalesforma !== 'circular' && (
                      <g>
                        <g filter="url(#sketch-filter)">
                          <line x1={minX - 16} y1={oy} x2={minX - 16} y2={oy + svgH} stroke="#64748b" strokeWidth="1" />
                          <line x1={ox - 4} y1={oy} x2={minX - 24} y2={oy} stroke="#475569" strokeWidth="1" />
                          <line x1={ox - 4} y1={oy + svgH} x2={minX - 24} y2={oy + svgH} stroke="#475569" strokeWidth="1" />
                          <line x1={minX - 20} y1={oy - 4} x2={minX - 12} y2={oy + 4} stroke="#475569" strokeWidth="1.5" />
                          <line x1={minX - 20} y1={oy + svgH - 4} x2={minX - 12} y2={oy + svgH + 4} stroke="#475569" strokeWidth="1.5" />
                        </g>
                        <text x={minX - 26} y={oy + svgH / 2} textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold" transform={`rotate(-90 ${minX - 26} ${oy + svgH / 2})`}>
                          {formatDec(bedL, 2)}m
                        </text>
                      </g>
                    )}
                  </g>
                )}

                {/* 1.5 PREVIEW GRID FOR HOVERED CROP */}
                {(() => {
                  const activePreviewCrop = hoveredCropToPreview || placingCrop || placingPlant || selectedCrop;
                  if (!activePreviewCrop || !showBedGuides || bancal?.bancalesforma === 'circular') return null;

                  const cropToPlace = activePreviewCrop;
                  const N = parseInt(cropToPlace.cultivoscantidad) || 1;
                  const spacingX = parseFloat(cropToPlace.especiesvegetalesmarcoplantas) || 30;
                  const spacingY = parseFloat(cropToPlace.especiesvegetalesmarcofilas) || 30;
                  const margin = parseFloat(cropToPlace.especiesvegetalesmarcomargen) || 0;
                  const spacingXMeters = spacingX / 100;
                  const spacingYMeters = spacingY / 100;
                  const marginMeters = margin / 100;

                  const allSegments = getBedSegments();
                  let bedSegments = allSegments.filter(s => s.type !== 'pasillo');
                  
                  if (bedSegments.length === 0) return null;

                  const baseCrops = flattenedCrops.filter(c => c.idcultivos !== cropToPlace.idcultivos);

                  return (
                <g id="preview-grid">
                      {bedSegments.map((s, idx) => {
                        const { slots, effSpaceX, effSpaceY } = getBedLattice(s, spacingXMeters, spacingYMeters, marginMeters);
                        const thisBoxHalfW = effSpaceX / 2;
                        const thisBoxHalfH = effSpaceY / 2;

                        const dots = slots.map((slot, slotIdx) => {
                          const collides = checkGridCollision(slot.x, slot.y, thisBoxHalfW, thisBoxHalfH, baseCrops, placedAccessories);
                          
                          if (collides) return null;

                          const cxSvg = ox + (slot.x / bedW) * svgW;
                          const cySvg = oy + (slot.y / bedL) * svgH;
                          const slotPctX = (slot.x / bedW) * 100;
                          const slotPctY = (slot.y / bedL) * 100;
                          const isPlacingActive = !!placingCrop;

                          return (
                            <g key={`preview-dot-${idx}-${slotIdx}`}>
                              <circle 
                                cx={cxSvg}
                                cy={cySvg}
                                r={3 / zoom}
                                fill="#10b981"
                                fillOpacity={0.6}
                              />
                              {isPlacingActive && (
                                <circle
                                  cx={cxSvg}
                                  cy={cySvg}
                                  r={Math.max(10, 14 / zoom)}
                                  fill="transparent"
                                  style={{ cursor: 'copy' }}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (!placingCrop || !userEmail) return;
                                    
                                    const currentQty = parseInt(placingCrop.cultivoscantidad) || 1;
                                    const unassignedQty = currentQty - (placingCrop.ubicaciones?.length || 0);

                                    await fetch(`/api/user/cultivos/${placingCrop.idcultivos}/ubicaciones`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json', 'x-user-email': userEmail },
                                      body: JSON.stringify({
                                        xcultivosubicacionesidbancales: bedId,
                                        posicionx: slotPctX,
                                        posiciony: slotPctY
                                      })
                                    });

                                    if (unassignedQty > 1) {
                                      setPlacingCrop((prev: any) => {
                                        if (!prev) return null;
                                        return {
                                          ...prev,
                                          ubicaciones: [...(prev.ubicaciones || []), { idcultivosubicaciones: Date.now() }]
                                        };
                                      });
                                    } else {
                                      setPlacingCrop(null);
                                    }
                                    loadWorkspaceData();
                                  }}
                                />
                              )}
                            </g>
                          );
                        });

                        return <g key={`preview-bed-${idx}`}>{dots}</g>;
                      })}
                    </g>
                  );
                })()}

                {/* 2. PLACED PLANTS COLLISION RINGS & BADGES */}
                {[...flattenedCrops].sort((a, b) => (a.idcultivos === selectedCrop?.idcultivos ? 1 : b.idcultivos === selectedCrop?.idcultivos ? -1 : 0)).map(crop => {
                  const px = parseFloat(crop.cultivosposicionx) || 50;
                  const py = parseFloat(crop.cultivosposiciony) || 50;

                  // Botanical spacing occupancy radius (unclamped physical scale!)
                  const spacing = Math.max(parseFloat(crop.especiesmarcoplantas) || 30, 20);
                  const r = ((spacing / 2) / bedW) * svgW; // Exact physical radius relative to bed bounds

                  // Physically scale foliage badge (foliage is ~75% of botanical spacing footprint or custom user scaling)
                  const customRadius = cropScales[crop.idcultivos];
                  const physFoliageRadius = customRadius !== undefined ? customRadius : (spacing * 0.75 / 2) / 100;
                  const badgeR = (physFoliageRadius / bedW) * svgW;

                  const hasCollision = collisions[crop.idcultivos] || false;
                  const isSelected = selectedCrop?.idcultivos === crop.idcultivos;

                  // ── AI ROW DISTRIBUTION SYSTEM FOR BATCHES ──
                  const N = parseInt(crop.cultivoscantidad) || 1;
                  
                  const spacingXCm = parseFloat(crop.especiesmarcoplantas) || 30;
                  const spacingYCm = parseFloat(crop.especiesmarcofilas) || 30;
                  // 1. Get all beds/strips directly from the validated getBedSegments() helper
                  const allSegments = getBedSegments();
                  const bedStrips = allSegments.filter(s => s.type !== 'pasillo');

                  // 2. Find which bed the crop belongs to (the closest to px/py center)
                  let myBed = bedStrips[0];
                  if (bedStrips.length > 0) {
                    const cxM = (px / 100) * bedW;
                    const cyM = (py / 100) * bedL;
                    let minDist = Infinity;
                    bedStrips.forEach(s => {
                      const centerX = s.xStart + s.width / 2;
                      const centerY = s.yStart + s.height / 2;
                      const dist = Math.sqrt(Math.pow(cxM - centerX, 2) + Math.pow(cyM - centerY, 2));
                      if (dist < minDist) {
                        minDist = dist;
                        myBed = s;
                      }
                    });
                  }

                  const spacingXMeters = spacingXCm / 100;
                  const spacingYMeters = spacingYCm / 100;

                  let optimal = null;
                  if (bancal?.bancalesforma !== 'circular' && myBed) {
                    optimal = getOptimalGrid(N, myBed.width, myBed.height, spacingXMeters, spacingYMeters);
                  }

                  const effSpaceX = optimal?.rotated ? spacingYMeters : spacingXMeters;
                  const effSpaceY = optimal?.rotated ? spacingXMeters : spacingYMeters;
                  const deltaPctX = (effSpaceX / bedW) * 100;
                  const deltaPctY = (effSpaceY / bedL) * 100;

                  // 3. Decidir número de filas/columnas en base a getOptimalGrid
                  let numCols = optimal?.numCols || Math.ceil(Math.sqrt(N));
                  let numRows = optimal?.numRows || Math.ceil(N / numCols);

                  const plants = [];
                  for (let idx = 0; idx < N; idx++) {
                    let cxPct = px;
                    let cyPct = py;
                    let r = 0;
                    let c = 0;

                    if (bancal?.bancalesforma !== 'circular' && myBed) {
                      if (bedAlignment === 'horizontal') {
                        r = idx % numRows;
                        c = Math.floor(idx / numRows);
                      } else {
                        c = idx % numCols;
                        r = Math.floor(idx / numCols);
                      }
                      
                      const offsetPctX = -((numCols - 1) * deltaPctX) / 2 + c * deltaPctX;
                      const offsetPctY = -((numRows - 1) * deltaPctY) / 2 + r * deltaPctY;

                      cxPct = px + offsetPctX;
                      cyPct = py + offsetPctY;
                    } else {
                      c = idx % numCols;
                      r = Math.floor(idx / numCols);
                      const gridWidthPct = (numCols - 1) * deltaPctX;
                      const gridHeightPct = (numRows - 1) * deltaPctY;
                      cxPct = px - gridWidthPct / 2 + c * deltaPctX;
                      cyPct = py - gridHeightPct / 2 + r * deltaPctY;
                    }

                    const cx = ox + (cxPct / 100) * svgW;
                    const cy = oy + (cyPct / 100) * svgH;
                    const xMeters = (cxPct / 100) * bedW;
                    const yMeters = (cyPct / 100) * bedL;

                    plants.push({ cx, cy, idx, r, c, xMeters, yMeters });
                  }

                  return (
                    <g key={crop.idcultivos}>


                      {plants.map(p => {
                        const frameW = (spacingXCm / 100) * baseScale;
                        const frameH = (spacingYCm / 100) * baseScale;

                        return (
                          <g key={p.idx}>
                            {/* Visual Planting Frame Guide (Marco de Plantación) */}
                            {showPlantingFrames && (isSelected || hasCollision) && (
                              <rect
                                x={p.cx - frameW / 2}
                                y={p.cy - frameH / 2}
                                width={frameW}
                                height={frameH}
                                rx={4 / zoom}
                                fill={hasCollision ? "rgba(239, 68, 68, 0.06)" : "rgba(16, 185, 129, 0.05)"}
                                stroke={hasCollision ? "#ef4444" : "#34d399"}
                                strokeOpacity={0.75}
                                strokeWidth={0.75 / zoom}
                                style={{ pointerEvents: 'none', transition: 'all 0.15s ease' }}
                              />
                            )}

                            {/* Measurement Capsule Label (Datos del marco) */}
                            {showPlantingFrames && isSelected && (
                              <g style={{ pointerEvents: 'none' }}>
                                <rect
                                  x={p.cx - 38}
                                  y={p.cy - frameH / 2 - 24}
                                  width="76"
                                  height="20"
                                  rx="4"
                                  fill="#111827"
                                  fillOpacity="0.85"
                                  stroke="#34d399"
                                  strokeWidth={0.5 / zoom}
                                />
                                <text
                                  x={p.cx}
                                  y={p.cy - frameH / 2 - 14}
                                  textAnchor="middle"
                                  fill="white"
                                  fontSize={6.5}
                                  fontWeight="bold"
                                  style={{ userSelect: 'none' }}
                                >
                                  Cultivo Nº {crop.cultivosnumerocoleccion || String(crop.originalIdCultivos || crop.idcultivos).substring(0, 3)} ({(crop._globalUbicacionIndex || 1) + p.idx})
                                </text>
                                <text
                                  x={p.cx}
                                  y={p.cy - frameH / 2 - 6}
                                  textAnchor="middle"
                                  fill="#34d399"
                                  fontSize={5.5}
                                  fontWeight="bold"
                                  style={{ userSelect: 'none' }}
                                >
                                  Marco: {spacingXCm}x{spacingYCm} cm
                                </text>
                              </g>
                            )}

                            {/* Collision / Spacing Ring (Only visible on collision) */}
                            {showMeasures && hasCollision && (
                              <circle
                                cx={p.cx} cy={p.cy} r={r}
                                fill="#ef4444"
                                fillOpacity={0.15}
                                stroke="#ef4444"
                                strokeWidth={0.75 / zoom}
                                style={{ pointerEvents: 'none' }}
                              />
                            )}

                            {/* Selection Highlight (Clean, elegant glow behind the plant) */}
                            {isSelected && (
                              <circle
                                cx={p.cx} cy={p.cy} r={Math.max(14, badgeR * 1.5)}
                                fill="#fbbf24"
                                fillOpacity={0.2}
                                stroke="#f59e0b"
                                strokeWidth={2 / zoom}
                                style={{ pointerEvents: 'none' }}
                              />
                            )}


                            {/* Plant Icon (Supports emoji or inline SVG icons) */}
                            {(() => {
                              const emojiSize = Math.max(10, badgeR * 1.1);
                              const icon = crop.especiesvegetalesicono || '🌱';
                              
                              if (icon.startsWith('/')) {
                                const iconSize = Math.max(10, emojiSize * 0.9);
                                const r = iconSize / 2;
                                const iconName = icon.split('/').pop();

                                if (iconName === 'tomate') {
                                  return (
                                    <g style={{ pointerEvents: 'none' }}>
                                      <circle cx={p.cx} cy={p.cy + r * 0.1} r={r} fill="#e53e3e" />
                                      <circle cx={p.cx - r * 0.25} cy={p.cy - r * 0.15} r={r * 0.85} fill="#f56565" opacity={0.5} />
                                      <line x1={p.cx} y1={p.cy - r * 0.65} x2={p.cx} y2={p.cy - r * 1.15} stroke="#276749" strokeWidth={r * 0.18} strokeLinecap="round" />
                                      <ellipse cx={p.cx + r * 0.35} cy={p.cy - r * 1.0} rx={r * 0.45} ry={r * 0.2} fill="#38a169" transform={`rotate(-30 ${p.cx + r * 0.35} ${p.cy - r * 1.0})`} />
                                    </g>
                                  );
                                }

                                if (iconName === 'calabacin') {
                                  const w = r * 2.2;
                                  const h = r * 0.9;
                                  return (
                                    <g style={{ pointerEvents: 'none' }} transform={`rotate(-25 ${p.cx} ${p.cy})`}>
                                      {/* Body */}
                                      <ellipse cx={p.cx} cy={p.cy} rx={w / 2} ry={h / 2} fill="#48bb78" />
                                      {/* Darker end */}
                                      <ellipse cx={p.cx + w * 0.32} cy={p.cy} rx={w * 0.18} ry={h / 2} fill="#2f855a" />
                                      {/* Light stripe */}
                                      <ellipse cx={p.cx - w * 0.05} cy={p.cy - h * 0.12} rx={w * 0.3} ry={h * 0.15} fill="#68d391" opacity={0.5} />
                                      {/* Stem */}
                                      <line x1={p.cx - w / 2} y1={p.cy} x2={p.cx - w / 2 - r * 0.4} y2={p.cy - r * 0.3} stroke="#276749" strokeWidth={r * 0.15} strokeLinecap="round" />
                                    </g>
                                  );
                                }

                                // Fallback for unknown custom icons
                                return (
                                  <circle cx={p.cx} cy={p.cy} r={r} fill="#a0aec0" style={{ pointerEvents: 'none' }} />
                                );
                              }
                              
                              return (
                                <text
                                  x={p.cx} y={p.cy + emojiSize * 0.35}
                                  textAnchor="middle" 
                                  fontSize={emojiSize}
                                  style={{ userSelect: 'none', pointerEvents: 'none', transition: 'font-size 0.2s ease, y 0.2s ease' }}
                                >
                                  {icon}
                                </text>
                              );
                            })()}



                            {/* INVISIBLE ACTIVE INTERACTIVE HITBOX CIRCLE (Ensures comfortable clicking/dragging ergonomics on tiny physical scales!) */}
                            <circle
                              cx={p.cx} cy={p.cy} r={Math.max(18, badgeR)}
                              fill="transparent"
                              onMouseDown={(e) => startDragCrop(e, crop)}
                              style={{ cursor: draggingCrop?.idcultivos === crop.idcultivos ? 'grabbing' : 'grab' }}
                            />
                          </g>
                        );
                      })}
                    </g>
                  );
                })}

                {/* 3. PLACED ACCESSORIES */}
                {placedAccessories.map(acc => {
                  const px = parseFloat(acc.posicionx) || 50;
                  const py = parseFloat(acc.posiciony) || 50;

                  // Map percentage back to SVG bed outline coordinates
                  const cx = ox + (px / 100) * svgW;
                  const cy = oy + (py / 100) * svgH;

                  const physR = acc.escalaMetros !== undefined ? acc.escalaMetros : getAccessoryPhysicalRadius(acc.type);
                  const accR = (physR / bedW) * svgW; // Exact physical radius relative to bed bounds

                  const isSelected = selectedAccessory?.id === acc.id;

                  return (
                    <g key={acc.id}>
                      {/* Selection Ring (Dotted organic highlight when selected!) */}
                      {isSelected && (
                        <circle
                          cx={cx} cy={cy} r={accR + 5}
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth={1.5 / zoom}
                          strokeDasharray="3 3"
                          style={{ pointerEvents: 'none' }}
                        />
                      )}

                      {/* Placed Accessory Emoji Icon (Rendered directly, scaled proportionally with readable safety clamp!) */}
                      {acc.type === 'naranjo_frutal' ? (
                        <g style={{ pointerEvents: 'none' }}>
                          {/* Base green tree foliage */}
                          <text
                            x={cx} y={cy + Math.max(12, accR * 2) * 0.35}
                            textAnchor="middle" 
                            fontSize={Math.max(12, accR * 2)}
                            style={{ userSelect: 'none', pointerEvents: 'none' }}
                          >
                            🌳
                          </text>
                          {/* Mini oranges overlayed around the tree foliage */}
                          {accR >= 8 && (
                            <>
                              <circle cx={cx - accR * 0.3} cy={cy - accR * 0.25} r={accR * 0.16} fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
                              <circle cx={cx + accR * 0.35} cy={cy - accR * 0.32} r={accR * 0.16} fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
                              <circle cx={cx - accR * 0.42} cy={cy + accR * 0.08} r={accR * 0.16} fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
                              <circle cx={cx + accR * 0.45} cy={cy + accR * 0.12} r={accR * 0.16} fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
                              <circle cx={cx} cy={cy - accR * 0.05} r={accR * 0.16} fill="#f97316" stroke="#ea580c" strokeWidth="0.5" />
                            </>
                          )}
                        </g>
                      ) : (
                        <text
                          x={cx} y={cy + Math.max(12, accR * 2) * 0.35}
                          textAnchor="middle" 
                          fontSize={Math.max(12, accR * 2)}
                          style={{ userSelect: 'none', pointerEvents: 'none', transition: 'font-size 0.2s ease, y 0.2s ease' }}
                        >
                          {acc.icono}
                        </text>
                      )}

                      {/* INVISIBLE ACTIVE INTERACTIVE HITBOX CIRCLE (Ensures perfect clicking/dragging ergonomics on tiny physical scales!) */}
                      <circle
                        cx={cx} cy={cy} r={Math.max(18, accR)}
                        fill="transparent"
                        onMouseDown={(e) => startDragAccessory(e, acc)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCrop(null);
                          setSelectedAccessory(acc);
                          setSelectedPath(null);
                        }}
                        style={{ cursor: draggingAccessory?.id === acc.id ? 'grabbing' : 'grab' }}
                      />
                    </g>
                  );
                })}

                {/* 4. BED RESIZE DRAG HANDLES */}
                {!placingPlant && !placingAccessory && !draggingCrop && !draggingAccessory && (
                  <g>
                    {/* Rectangular Bed Handles */}
                    {bancal.bancalesforma === 'rectangular' && (
                      <>
                        {/* East Handle (Resizes Width) */}
                        <circle
                          cx={ox + svgW}
                          cy={oy + svgH / 2}
                          r={(hoveredHandle === 'width' || isResizingBed === 'width' ? 9 : 6) / zoom}
                          fill={hoveredHandle === 'width' || isResizingBed === 'width' ? '#10b981' : '#ffffff'}
                          stroke="#059669"
                          strokeWidth={2 / zoom}
                          style={{ cursor: 'ew-resize', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'r 0.15s ease, fill 0.15s ease' }}
                          onMouseEnter={() => setHoveredHandle('width')}
                          onMouseLeave={() => setHoveredHandle(null)}
                          onMouseDown={(e) => startResizeBed(e, 'width')}
                        />
                        {/* South Handle (Resizes Length) */}
                        <circle
                          cx={ox + svgW / 2}
                          cy={oy + svgH}
                          r={(hoveredHandle === 'length' || isResizingBed === 'length' ? 9 : 6) / zoom}
                          fill={hoveredHandle === 'length' || isResizingBed === 'length' ? '#10b981' : '#ffffff'}
                          stroke="#059669"
                          strokeWidth={2 / zoom}
                          style={{ cursor: 'ns-resize', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'r 0.15s ease, fill 0.15s ease' }}
                          onMouseEnter={() => setHoveredHandle('length')}
                          onMouseLeave={() => setHoveredHandle(null)}
                          onMouseDown={(e) => startResizeBed(e, 'length')}
                        />
                        {/* Southeast Handle (Resizes Both) */}
                        <circle
                          cx={ox + svgW}
                          cy={oy + svgH}
                          r={(hoveredHandle === 'both' || isResizingBed === 'both' ? 10 : 7) / zoom}
                          fill={hoveredHandle === 'both' || isResizingBed === 'both' ? '#10b981' : '#ffffff'}
                          stroke="#059669"
                          strokeWidth={2.5 / zoom}
                          style={{ cursor: 'nwse-resize', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', transition: 'r 0.15s ease, fill 0.15s ease' }}
                          onMouseEnter={() => setHoveredHandle('both')}
                          onMouseLeave={() => setHoveredHandle(null)}
                          onMouseDown={(e) => startResizeBed(e, 'both')}
                        />
                      </>
                    )}

                    {/* Circular Bed Handle */}
                    {bancal.bancalesforma === 'circular' && (
                      <circle
                        cx={200 + svgW / 2}
                        cy={200}
                        r={(hoveredHandle === 'width' || isResizingBed === 'width' ? 9 : 6) / zoom}
                        fill={hoveredHandle === 'width' || isResizingBed === 'width' ? '#10b981' : '#ffffff'}
                        stroke="#059669"
                        strokeWidth={2 / zoom}
                        style={{ cursor: 'ew-resize', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'r 0.15s ease, fill 0.15s ease' }}
                        onMouseEnter={() => setHoveredHandle('width')}
                        onMouseLeave={() => setHoveredHandle(null)}
                        onMouseDown={(e) => startResizeBed(e, 'width')}
                      />
                    )}

                    {/* Trapezoidal Bed Handles */}
                    {bancal.bancalesforma === 'trapezoidal' && (
                      <>
                        {/* East Handle / Bottom Width (Resizes bottom-right corner) */}
                        <circle
                          cx={ox + svgW}
                          cy={oy + svgH}
                          r={(hoveredHandle === 'width' || isResizingBed === 'width' ? 9 : 6) / zoom}
                          fill={hoveredHandle === 'width' || isResizingBed === 'width' ? '#10b981' : '#ffffff'}
                          stroke="#059669"
                          strokeWidth={2 / zoom}
                          style={{ cursor: 'ew-resize', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'r 0.15s ease, fill 0.15s ease' }}
                          onMouseEnter={() => setHoveredHandle('width')}
                          onMouseLeave={() => setHoveredHandle(null)}
                          onMouseDown={(e) => startResizeBed(e, 'width')}
                        />
                        {/* Top Width Handle (Resizes top-right corner) */}
                        <circle
                          cx={oxSup + svgWSup}
                          cy={oy}
                          r={(hoveredHandle === 'topWidth' || isResizingBed === 'topWidth' ? 9 : 6) / zoom}
                          fill={hoveredHandle === 'topWidth' || isResizingBed === 'topWidth' ? '#10b981' : '#ffffff'}
                          stroke="#059669"
                          strokeWidth={2 / zoom}
                          style={{ cursor: 'ew-resize', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'r 0.15s ease, fill 0.15s ease' }}
                          onMouseEnter={() => setHoveredHandle('topWidth')}
                          onMouseLeave={() => setHoveredHandle(null)}
                          onMouseDown={(e) => startResizeBed(e, 'topWidth')}
                        />
                        {/* South Handle (Resizes Length/Height) */}
                        <circle
                          cx={ox + svgW / 2}
                          cy={oy + svgH}
                          r={(hoveredHandle === 'length' || isResizingBed === 'length' ? 9 : 6) / zoom}
                          fill={hoveredHandle === 'length' || isResizingBed === 'length' ? '#10b981' : '#ffffff'}
                          stroke="#059669"
                          strokeWidth={2 / zoom}
                          style={{ cursor: 'ns-resize', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', transition: 'r 0.15s ease, fill 0.15s ease' }}
                          onMouseEnter={() => setHoveredHandle('length')}
                          onMouseLeave={() => setHoveredHandle(null)}
                          onMouseDown={(e) => startResizeBed(e, 'length')}
                        />
                      </>
                    )}
                  </g>
                )}
              </g>
            </svg>

          </div>
        </main>

        {/* COLUMN 3: RIGHT PANEL - PROPERTIES INSPECTOR */}
        <aside style={{
          width: showRightSidebar ? '320px' : '0px',
          background: '#111827',
          borderLeft: showRightSidebar ? '1px solid #1f2937' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #1f2937', flexShrink: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} style={{ color: '#10b981' }} /> Inspector de Propiedades
            </h3>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {selectedPath ? (
              <>
                {/* Path General header info */}
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #475569', textAlign: 'center' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>🛣️</span>
                  <span style={{
                    background: '#10b981', color: '#ffffff', fontSize: '0.65rem',
                    fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    display: 'inline-block', marginBottom: '6px'
                  }}>Sendero Continuo</span>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 800 }}>
                    Sendero de Piedra
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                    Camino transitable de piedra y gravilla diseñado a medida.
                  </p>
                </div>

                {/* Path stats */}
                <div style={{
                  background: '#1f2937', borderRadius: '12px', padding: '14px',
                  display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem',
                  color: '#9ca3af', border: '1px solid #374151'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tramos del Sendero:</span>
                    <strong style={{ color: 'white' }}>{(selectedPath.points || []).length - 1} segmentos</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Puntos de Curva:</span>
                    <strong style={{ color: 'white' }}>{(selectedPath.points || []).length} nodos</strong>
                  </div>
                </div>

                {/* Width Adjust Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1f2937', padding: '14px', borderRadius: '12px', border: '1px solid #374151' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Ancho del Sendero</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {formatDec(selectedPath.widthMeters, 2)} m
                    </span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="2.0" 
                    step="0.05" 
                    value={selectedPath.widthMeters}
                    onChange={(e) => {
                      const width = parseFloat(e.target.value);
                      setPlacedPaths(prev => {
                        const updated = prev.map(p => p.id === selectedPath.id ? { ...p, widthMeters: width } : p);
                        localStorage.setItem(`verdantia_paths_${bedId}`, JSON.stringify(updated));
                        return updated;
                      });
                      setSelectedPath((prev: any) => ({ ...prev, widthMeters: width }));
                    }}
                    style={{
                      width: '100%',
                      accentColor: '#10b981',
                      cursor: 'pointer',
                      background: '#374151',
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Spacer */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                  <button 
                    onClick={() => {
                      if (confirm('¿Seguro que quieres eliminar este sendero continuo?')) {
                        const filtered = placedPaths.filter(p => p.id !== selectedPath.id);
                        savePaths(filtered);
                        setSelectedPath(null);
                      }
                    }}
                    style={{
                      background: '#7f1d1d', color: '#fca5a5', border: '1px solid #b91c1c',
                      padding: '12px', borderRadius: '12px', cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.85rem', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#991b1b'}
                    onMouseLeave={e => e.currentTarget.style.background = '#7f1d1d'}
                  >
                    <Trash2 size={16} /> Eliminar Sendero
                  </button>
                </div>
              </>
            ) : selectedAccessory ? (
              <>
                {/* Accessory General header info */}
                <div style={{ background: '#1e293b', padding: '16px', borderRadius: '16px', border: '1px solid #475569', textAlign: 'center' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>{selectedAccessory.icono}</span>
                  <span style={{
                    background: '#3b82f6', color: '#ffffff', fontSize: '0.65rem',
                    fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    display: 'inline-block', marginBottom: '6px'
                  }}>Accesorios / Decoración</span>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 800 }}>
                    {selectedAccessory.nombre}
                  </h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#9ca3af' }}>
                    {ACCESSORIES_LIBRARY.find(a => a.id === selectedAccessory.type)?.desc || 'Accesorio decorativo y funcional del huerto.'}
                  </p>
                </div>

                {/* Coords */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700 }}>Ubicación en el Bancal</label>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#1f2937', padding: '10px', borderRadius: '10px', border: '1px solid #374151' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Eje X (Ancho)</span>
                      <strong style={{ fontSize: '0.85rem', color: 'white' }}>
                        {formatDec((parseFloat(selectedAccessory.posicionx) / 100) * bedW, 2)} m
                      </strong>
                      <span style={{ fontSize: '0.6rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                        ({Math.round(selectedAccessory.posicionx)}%)
                      </span>
                    </div>

                    <div style={{ background: '#1f2937', padding: '10px', borderRadius: '10px', border: '1px solid #374151' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Eje Y (Largo)</span>
                      <strong style={{ fontSize: '0.85rem', color: 'white' }}>
                        {formatDec((parseFloat(selectedAccessory.posiciony) / 100) * bedL, 2)} m
                      </strong>
                      <span style={{ fontSize: '0.6rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                        ({Math.round(selectedAccessory.posiciony)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div style={{
                  background: '#1f2937', borderRadius: '12px', padding: '14px',
                  display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem',
                  color: '#9ca3af', border: '1px solid #374151'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Categoría:</span>
                    <strong style={{ color: 'white' }}>Estructura Exterior</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Dimensión Sugerida:</span>
                    <strong style={{ color: 'white' }}>
                      {ACCESSORIES_LIBRARY.find(a => a.id === selectedAccessory.type)?.tamaño || 'Proporcional'}
                    </strong>
                  </div>
                </div>

                {/* Control de Tamaño de Accesorio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1f2937', padding: '14px', borderRadius: '12px', border: '1px solid #374151' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Tamaño del Elemento</span>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {formatDec((selectedAccessory.escalaMetros !== undefined ? selectedAccessory.escalaMetros : getAccessoryPhysicalRadius(selectedAccessory.type)) * 2, 2)} m (Ø)
                    </span>
                  </label>
                  <input 
                    type="range" 
                    min="0.2" 
                    max="10.0" 
                    step="0.1" 
                    value={(selectedAccessory.escalaMetros !== undefined ? selectedAccessory.escalaMetros : getAccessoryPhysicalRadius(selectedAccessory.type)) * 2}
                    onChange={(e) => {
                      const diameter = parseFloat(e.target.value);
                      saveAccessoryScale(selectedAccessory.id, diameter / 2);
                    }}
                    style={{
                      width: '100%',
                      accentColor: '#3b82f6',
                      cursor: 'pointer',
                      background: '#374151',
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                  />
                  {selectedAccessory.escalaMetros !== undefined && (
                    <button
                      onClick={() => saveAccessoryScale(selectedAccessory.id, null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#60a5fa',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: '4px 0 0',
                        fontWeight: 700,
                        textDecoration: 'underline'
                      }}
                    >
                      Restablecer al tamaño original
                    </button>
                  )}
                </div>

                {/* Spacer */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                  <button 
                    onClick={() => {
                      const filtered = placedAccessories.filter(a => a.id !== selectedAccessory.id);
                      saveAccessories(filtered);
                      setSelectedAccessory(null);
                    }}
                    style={{
                      background: '#7f1d1d', color: '#fca5a5', border: '1px solid #b91c1c',
                      padding: '12px', borderRadius: '12px', cursor: 'pointer',
                      fontWeight: 700, fontSize: '0.85rem', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', gap: '8px',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#991b1b'}
                    onMouseLeave={e => e.currentTarget.style.background = '#7f1d1d'}
                  >
                    <Trash2 size={16} /> Eliminar Accesorio
                  </button>
                </div>
              </>
            ) : selectedCrop ? (
              <>
                {/* Crop General header info */}
                <div style={{ background: '#1f2937', padding: '16px', borderRadius: '16px', border: '1px solid #374151', textAlign: 'center' }}>
                  {renderSpeciesIcon(selectedCrop.especiesvegetalesicono, '3rem')}
                  <span style={{
                    background: '#374151', color: '#9ca3af', fontSize: '0.65rem',
                    fontWeight: 700, padding: '2px 8px', borderRadius: '6px',
                    display: 'inline-block', marginBottom: '6px'
                  }}>Colección #{selectedCrop.cultivosnumerocoleccion}</span>
                  <h4 style={{ margin: 0, fontSize: '1rem', color: 'white', fontWeight: 800 }}>
                    {selectedCrop.variedad_nombre || 'Variedad Común'}
                  </h4>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
                    {selectedCrop.especiesvegetalesnombre}
                  </p>

                  {/* Status badge & Desvincular button next to it */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                    <span style={{
                      fontSize: '0.65rem',
                      background: selectedCrop.xcultivosidbancales === bancal.idbancales
                        ? '#064e3b'
                        : selectedCrop.xcultivosidbancales
                          ? '#1e2937'
                          : '#78350f',
                      color: selectedCrop.xcultivosidbancales === bancal.idbancales
                        ? '#34d399'
                        : selectedCrop.xcultivosidbancales
                          ? '#9ca3af'
                          : '#fbbf24',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontWeight: 700
                    }}>
                      {selectedCrop.xcultivosidbancales === bancal.idbancales
                        ? '📍 Ubicado aquí'
                        : selectedCrop.xcultivosidbancales
                          ? '🚜 En otro bancal'
                          : '⏳ Sin Ubicar'}
                    </span>

                    {selectedCrop.xcultivosidbancales === bancal.idbancales && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Desvincular este cultivo del bancal actual?')) {
                            handleRemoveCrop(selectedCrop.idcultivos);
                          }
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#fca5a5',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          padding: '2px 6px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 700,
                          fontSize: '0.65rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.4)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                        title="Desvincular este cultivo del bancal"
                      >
                        🔗 Desvincular
                      </button>
                    )}
                  </div>

                  {/* Access to crop editor */}
                  <button
                    onClick={() => router.push(`/dashboard/cultivos/${selectedCrop.idcultivos}?from=bancal&bancalId=${bedId}`)}
                    style={{
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      margin: '10px auto 0',
                      width: '100%',
                      transition: 'all 0.2s',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    title="Ver la ficha de tareas, riegos, abonos y bitácora de este cultivo"
                  >
                    ✏️ Abrir Editor del Cultivo
                  </button>
                </div>

                {/* Spacing limit feedback banner */}
                {collisions[selectedCrop.idcultivos] && (
                  <div style={{
                    background: '#7f1d1d', border: '1px solid #f87171', borderRadius: '12px',
                    padding: '12px', color: '#fca5a5', fontSize: '0.75rem', display: 'flex',
                    alignItems: 'flex-start', gap: '8px'
                  }}>
                    <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>¡Alerta de Apiñamiento!</strong><br />
                      Esta planta está demasiado cerca de un cultivo colindante en base a su densidad recomendada ({selectedCrop.especiesmarcoplantas} cm). Por favor, arrástrala a un espacio más despejado.
                    </div>
                  </div>
                )}

                {/* State selector */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700 }}>Fase o Estado del Cultivo</label>
                  <select 
                    value={selectedCrop.cultivosestado}
                    onChange={e => handleUpdateCropState(e.target.value)}
                    style={{
                      width: '100%', background: '#1f2937', border: '1px solid #374151',
                      borderRadius: '10px', padding: '10px', fontSize: '0.85rem', color: 'white',
                      outline: 'none', cursor: 'pointer'
                    }}
                  >
                    <option value="germinacion">🌱 Germinación / Semillero</option>
                    <option value="en_espera">⏳ En Espera</option>
                    <option value="crecimiento">🌿 Crecimiento</option>
                    <option value="floracion">🌸 Floración</option>
                    <option value="recoleccion">🍇 Recolección / Cosecha</option>
                  </select>
                </div>

                {/* Fine adjustments positioning coordinates */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700 }}>Ajuste Preciso de Ubicación</label>
                  
                  {/* Coords display in meters */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div style={{ background: '#1f2937', padding: '10px', borderRadius: '10px', border: '1px solid #374151' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Eje X (Ancho)</span>
                      <strong style={{ fontSize: '0.85rem', color: 'white' }}>
                        {formatDec((parseFloat(selectedCrop.cultivosposicionx) / 100) * bedW, 2)} m
                      </strong>
                      <span style={{ fontSize: '0.6rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                        ({Math.round(selectedCrop.cultivosposicionx)}%)
                      </span>
                    </div>

                    <div style={{ background: '#1f2937', padding: '10px', borderRadius: '10px', border: '1px solid #374151' }}>
                      <span style={{ fontSize: '0.65rem', color: '#9ca3af', display: 'block' }}>Eje Y (Largo)</span>
                      <strong style={{ fontSize: '0.85rem', color: 'white' }}>
                        {formatDec((parseFloat(selectedCrop.cultivosposiciony) / 100) * bedL, 2)} m
                      </strong>
                      <span style={{ fontSize: '0.6rem', color: '#6b7280', display: 'block', marginTop: '2px' }}>
                        ({Math.round(selectedCrop.cultivosposiciony)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botanical specs */}
                <div style={{
                  background: '#1f2937', borderRadius: '12px', padding: '14px',
                  display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem',
                  color: '#9ca3af', border: '1px solid #374151'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Marco Botánico:</span>
                    <strong style={{ color: 'white' }}>{selectedCrop.especiesmarcoplantas}x{selectedCrop.especiesmarcofilas} cm</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Margen al Borde:</span>
                    <strong style={{ color: 'white' }}>{selectedCrop.especiesmarcomargen !== null && selectedCrop.especiesmarcomargen !== undefined ? `${selectedCrop.especiesmarcomargen} cm` : '0 cm'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Espacio Ocupado:</span>
                    <strong style={{ color: 'white' }}>
                      {formatDec((selectedCrop.cultivoscantidad * (selectedCrop.especiesmarcoplantas || 30) * (selectedCrop.especiesmarcofilas || 30)) / 10000, 2)} m²
                    </strong>
                  </div>
                </div>

                {/* Control de Diámetro de Follaje de Cultivo */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#1f2937', padding: '14px', borderRadius: '12px', border: '1px solid #374151' }}>
                  <label style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Diámetro de Follaje</span>
                    <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '0.8rem' }}>
                      {formatDec((cropScales[selectedCrop.idcultivos] !== undefined ? cropScales[selectedCrop.idcultivos] : (Math.max(parseFloat(selectedCrop.especiesmarcoplantas) || 30, 20) * 0.75 / 2) / 100) * 2, 2)} m
                    </span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="4.0" 
                    step="0.05" 
                    value={(cropScales[selectedCrop.idcultivos] !== undefined ? cropScales[selectedCrop.idcultivos] : (Math.max(parseFloat(selectedCrop.especiesmarcoplantas) || 30, 20) * 0.75 / 2) / 100) * 2}
                    onChange={(e) => {
                      const diameter = parseFloat(e.target.value);
                      saveCropScale(selectedCrop.idcultivos, diameter / 2);
                    }}
                    style={{
                      width: '100%',
                      accentColor: '#10b981',
                      cursor: 'pointer',
                      background: '#374151',
                      height: '6px',
                      borderRadius: '3px',
                      outline: 'none'
                    }}
                  />
                  {cropScales[selectedCrop.idcultivos] !== undefined && (
                    <button
                      onClick={() => saveCropScale(selectedCrop.idcultivos, null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#34d399',
                        fontSize: '0.65rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        padding: '4px 0 0',
                        fontWeight: 700,
                        textDecoration: 'underline'
                      }}
                    >
                      Restablecer al tamaño botánico
                    </button>
                  )}
                </div>

                {/* Spacer */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 }}>
                  <button 
                    onClick={() => handleAutoPlaceCrop(selectedCrop)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.45)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                    }}
                  >
                    <Sparkles size={16} /> Auto-ubicar con IA
                  </button>

                  {/* Actions: Desvincular o Eliminar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button 
                      onClick={() => handleRemoveCrop(selectedCrop.idcultivos)}
                      style={{
                        background: '#7c2d12', 
                        color: '#ffedd5', 
                        border: '1px solid #c2410c',
                        padding: '10px 8px', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        fontWeight: 700, 
                        fontSize: '0.75rem', 
                        display: 'flex',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#9a3412'}
                      onMouseLeave={e => e.currentTarget.style.background = '#7c2d12'}
                      title="Quitar este cultivo del bancal actual y devolverlo al inventario"
                    >
                      🔗 Desvincular
                    </button>

                    <button 
                      onClick={() => {
                        if (confirm('¿Seguro que quieres eliminar este cultivo por completo del repertorio?')) {
                          handleDeleteCrop(selectedCrop.idcultivos);
                        }
                      }}
                      style={{
                        background: '#7f1d1d', 
                        color: '#fca5a5', 
                        border: '1px solid #b91c1c',
                        padding: '10px 8px', 
                        borderRadius: '10px', 
                        cursor: 'pointer',
                        fontWeight: 700, 
                        fontSize: '0.75rem', 
                        display: 'flex',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '6px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#991b1b'}
                      onMouseLeave={e => e.currentTarget.style.background = '#7f1d1d'}
                      title="Eliminar este cultivo definitivamente de la base de datos"
                    >
                      <Trash2 size={12} fill="currentColor" style={{ opacity: 0.8 }} /> Eliminar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center', padding: '60px 20px', color: '#6b7280',
                border: '2px dashed #1f2937', borderRadius: '16px', fontSize: '0.8rem'
              }}>
                <Sprout size={32} style={{ margin: '0 auto 12px', color: '#374151' }} />
                <span>Selecciona una planta en el bancal o añade una nueva de la paleta izquierda para empezar.</span>
              </div>
            )}
          </div>
        </aside>

      {/* ── NANO BANANA AI RENDER ASSISTANT MODAL ── */}
      {showNanoBananaModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 999, padding: '24px'
        }}>
          <div style={{
            background: '#1e293b', border: '2px solid #fbbf24', // banana gold frame!
            borderRadius: '16px', width: '100%', maxWidth: '1050px',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 30px rgba(251, 191, 36, 0.25)'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              borderBottom: '1px solid #334155',
              padding: '16px 24px', display: 'flex', justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.5rem' }}>🍌</span>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '1.05rem', fontWeight: 800 }}>
                    Verdantia AI - Nano Banana Engine v1.2
                  </h3>
                  <span style={{ fontSize: '0.62rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginTop: '2px' }}>
                    Render Fotorrealista de Campo & Botánica
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowNanoBananaModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.06)', border: 'none',
                  color: '#94a3b8', width: '28px', height: '28px',
                  borderRadius: '50%', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', overflowY: 'auto' }}>
              
              {/* If Loading: High-tech terminal scanner log */}
              {nanoBananaLoading ? (
                <div style={{
                  width: '100%', display: 'flex', flexDirection: 'column', gap: '16px',
                  background: '#0f172a', padding: '24px', borderRadius: '12px',
                  border: '1px solid #334155', fontFamily: 'monospace', textAlign: 'left'
                }}>
                  {/* Glowing scanner wheel */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '24px', height: '24px', border: '3px solid #fbbf24',
                      borderTopColor: 'transparent', borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    <div style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: '0.85rem' }}>
                      [Nano Banana 🍌] Sintetizando matriz fotorrealista...
                    </div>
                  </div>
                  
                  {/* Scanning Log List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {nanoBananaLogs.map((log, lIdx) => (
                      <div key={lIdx} style={{ color: log.includes('completada') ? '#34d399' : '#94a3b8' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Canvas Output Display */}
                  <div 
                    style={{
                      background: '#f8fafc', border: '1px solid #cbd5e1',
                      borderRadius: '12px', overflow: 'hidden', width: '100%',
                      maxWidth: '960px', aspectRatio: '1/1', display: 'flex',
                      justifyContent: 'center', alignItems: 'center',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)',
                      position: 'relative',
                      cursor: realisticZoom > 1 ? (isDraggingRealistic ? 'grabbing' : 'grab') : 'default'
                    }}
                    onMouseDown={handleRealisticMouseDown}
                    onMouseMove={handleRealisticMouseMove}
                    onMouseUp={() => setIsDraggingRealistic(false)}
                    onMouseLeave={() => setIsDraggingRealistic(false)}
                    onWheel={handleRealisticWheel}
                  >
                    <canvas
                      ref={(el) => {
                        if (el) drawRealisticBancal(el);
                      }}
                      style={{ 
                        width: '100%', height: '100%', display: 'block',
                        transform: `scale(${realisticZoom}) translate(${realisticPan.x / (realisticZoom || 1)}px, ${realisticPan.y / (realisticZoom || 1)}px)`,
                        transformOrigin: 'center center',
                        transition: isDraggingRealistic ? 'none' : 'transform 0.15s ease-out'
                      }}
                    />

                    {/* Floating Zoom Controls Bar */}
                    <div style={{
                      position: 'absolute', bottom: '16px', right: '16px',
                      display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)', padding: '6px', borderRadius: '10px',
                      border: '1px solid rgba(255,255,255,0.15)', zIndex: 10,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRealisticZoom(z => Math.min(5, z + 0.25));
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#fbbf24',
                          width: '28px', height: '28px', borderRadius: '6px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        title="Acercar (+)"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRealisticZoom(z => {
                            const nextZ = Math.max(1, z - 0.25);
                            if (nextZ === 1) setRealisticPan({ x: 0, y: 0 });
                            return nextZ;
                          });
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#fbbf24',
                          width: '28px', height: '28px', borderRadius: '6px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        title="Alejar (-)"
                      >
                        <Minus size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRealisticZoom(1);
                          setRealisticPan({ x: 0, y: 0 });
                        }}
                        style={{
                          background: 'none', border: 'none', color: '#fbbf24',
                          width: '28px', height: '28px', borderRadius: '6px',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        title="Restablecer vista"
                      >
                        <RefreshCw size={12} />
                      </button>
                    </div>

                    {/* Floating Zoom Indicator Badge */}
                    <div style={{
                      position: 'absolute', top: '16px', right: '16px',
                      background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                      padding: '4px 10px', borderRadius: '20px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fbbf24', fontSize: '0.7rem', fontWeight: 'bold',
                      pointerEvents: 'none', userSelect: 'none', zIndex: 10
                    }}>
                      Zoom: {Math.round(realisticZoom * 100)}%
                    </div>
                  </div>

                  {/* Summary / Controls */}
                  <div style={{
                    width: '100%', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #334155', borderRadius: '12px',
                    padding: '16px 20px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '12px'
                  }}>
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ color: '#fbbf24', fontSize: '0.82rem', display: 'block', marginBottom: '4px' }}>
                        ✨ Render Completo Exitosamente
                      </strong>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', lineHeight: '1.3' }}>
                        Trazados realistas, estacas de tutoría (no germinados) y follaje según etapa agronómica.
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const canvas = document.querySelector('canvas');
                        if (canvas) {
                          const link = document.createElement('a');
                          link.download = `render_realista_${bancal?.bancalesnombre || 'bancal'}.png`;
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        }
                      }}
                      style={{
                        background: '#fbbf24', color: '#1e293b', border: 'none',
                        padding: '10px 18px', borderRadius: '10px', fontWeight: 'bold',
                        fontSize: '0.8rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '8px', transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#fcd34d';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(251, 191, 36, 0.4)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#fbbf24';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      💾 Guardar Imagen
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
