import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function authenticateSuperadmin(request: Request) {
  const email = request.headers.get('x-user-email');
  if (!email) return null;
  const user = await getUserByEmail(email);
  if (!user || !user.roles?.includes('superadministrador')) return null;
  return user;
}

function analyzePremium(content: string, relPath: string) {
  const diagnostics: string[] = [];
  let score = 100;

  // 1. Descubrimiento dinámico de componentes Premium
  const premiumDir = path.join(process.cwd(), 'src', 'components', 'ui');
  let premiumComponents: string[] = [];
  try {
    premiumComponents = fs.readdirSync(premiumDir)
      .filter(f => f.startsWith('Premium') && f.endsWith('.tsx'))
      .map(f => f.replace('.tsx', ''));
  } catch { /* no-op */ }

  const usedPremium = premiumComponents.filter(c => content.includes(c));
  const missingPremium = premiumComponents.filter(c => !content.includes(c));

  // 2. Determinar tipo de página
  const isEditPage = relPath.includes('[id]') || relPath.includes('nueva') || relPath.includes('nuevo');

  // 3. Reglas obligatorias del Encabezado Premium (Regla 7)
  if (!content.includes('PremiumSubheader')) {
    diagnostics.push('🏗️ Falta `PremiumSubheader`: El dashboard no utiliza el componente de Encabezado Premium obligatorio (Regla 7). Se debe reemplazar cualquier header inline por `<PremiumSubheader>`.');
    score -= 20;
  }

  if (!content.includes('PremiumBackButton')) {
    const hasRawNav = /['"]🏠 Volver|['"]🔙 Volver|Volver al Inicio/.test(content);
    if (hasRawNav) {
      diagnostics.push('🔙 Botones de navegación raw: Se detectaron botones "Volver" sin usar `PremiumBackButton`. Reemplazarlos por el componente Premium.');
    } else {
      diagnostics.push('🔙 Falta `PremiumBackButton`: No se encontró navegación de retorno. Añadir al menos "🏠 Volver al Inicio".');
    }
    score -= 10;
  }

  if (!content.includes('PremiumDevInsights')) {
    diagnostics.push('📊 Falta `PremiumDevInsights`: El analizador de código es obligatorio bajo la línea divisoria del Encabezado Premium (Regla 7).');
    score -= 15;
  }

  // 4. Reglas específicas de LISTADO
  if (!isEditPage) {
    if (!content.includes('PremiumAddButton')) {
      const hasRawAdd = /[➕+]\s*Nuev[oa]|Crear\s+/.test(content);
      if (hasRawAdd) {
        diagnostics.push('➕ Botón "Añadir" raw: Se detectó un botón de creación sin usar `PremiumAddButton`. Reemplazarlo por el componente Premium (Regla 25).');
        score -= 10;
      }
    }
    if (!content.includes('PremiumFilterTabs')) {
      const hasFilters = /setFilter|activeFilter|setActiveFilter|filterTipo/.test(content);
      if (hasFilters) {
        diagnostics.push('🏷️ Filtros sin `PremiumFilterTabs`: Se detectaron filtros implementados con botones raw. Usar `PremiumFilterTabs` para consistencia visual.');
        score -= 10;
      }
    }
    if (content.includes('PremiumSubheader') && content.includes('subtitle=')) {
      diagnostics.push('🚫 Subtítulo prohibido en listado: Los dashboards de listado NO deben tener subtítulos descriptivos (Regla 7).');
      score -= 10;
    }
  }

  // 5. Reglas específicas de EDICIÓN (Regla 8)
  if (isEditPage) {
    if (!content.includes('PremiumDeleteButton')) {
      diagnostics.push('🗑️ Falta `PremiumDeleteButton`: Las páginas de edición deben incluir el botón de eliminación Premium (Regla 8).');
      score -= 10;
    }
    if (content.includes('PremiumSubheader') && !content.includes('subtitle=')) {
      diagnostics.push('📝 Falta `subtitle` en PremiumSubheader: Las páginas de edición requieren subtítulo contextual (ej. "✏️ Editar ... · ID del Registro: ...") según Regla 8.');
      score -= 10;
    }
    if (content.includes('saveStatus') && !content.includes('Guardando') && !content.includes('⏳')) {
      diagnostics.push('💾 Falta indicador de autoguardado: Las páginas de edición deben mostrar "⏳ Guardando..." / "✅ Guardado" en el bloque de acciones (Regla 8).');
      score -= 10;
    }
  }

  // 6. Reglas de estilo comunes
  if (content.includes('PremiumSubheader') && !content.includes('gradient=')) {
    diagnostics.push('🎨 Falta `gradient` explícito: El PremiumSubheader debe tener un degradado pertinente al módulo (Regla 7).');
    score -= 5;
  }

  // 7. Patrones prohibidos en el header
  const hasBadgeInJSX = />\s*🛡️\s*Superadministrador\s*</.test(content) || /badge.*[Ss]uperadmin|[Ss]uperadmin.*badge/.test(content);
  if (hasBadgeInJSX) {
    diagnostics.push('🚫 Badge de rol prohibido: Se detectó una etiqueta visual de "Superadministrador" en el encabezado. Prohibido por Regla 7.');
    score -= 10;
  }

  score = Math.max(0, score);

  // 8. Generar prompt para el agente
  let improvementsForAgent = '';
  if (diagnostics.length > 0 && score < 100) {
    improvementsForAgent = `Antigravity, aplica los criterios del Encabezado Premium (Reglas 7/8/23 de la Biblia) al dashboard en 'src/app/dashboard/${relPath}'. Corrige los siguientes hallazgos:\n`;
    diagnostics.forEach((diag, i) => {
      improvementsForAgent += `${i + 1}. ${diag.replace(/^[^\w\s]*\s*/, '')}\n`;
    });
    improvementsForAgent += `\nComponentes Premium disponibles: ${premiumComponents.join(', ')}.\nYa usados: ${usedPremium.length > 0 ? usedPremium.join(', ') : 'Ninguno'}.\nNo usados: ${missingPremium.length > 0 ? missingPremium.join(', ') : 'Todos en uso'}.`;
  } else {
    improvementsForAgent = `Antigravity, el dashboard en 'src/app/dashboard/${relPath}' cumple con todos los criterios Premium de la Biblia (Reglas 7/8/23). Score: ${score}%.`;
  }

  return {
    score,
    usedPremium,
    missingPremium,
    availablePremium: premiumComponents,
    diagnostics: diagnostics.length > 0 ? diagnostics : ['✅ El dashboard cumple con todos los criterios del Encabezado Premium.'],
    improvementsForAgent
  };
}

function analyzeResponsiveness(content: string, relPath: string) {
  const diagnostics: string[] = [];
  let score = 100;

  // 1. Fixed pixel widths/minWidths/maxWidths >= 400px
  const fixedWidthRegex = /(?:width|minWidth|maxWidth)\s*:\s*(?:['"](\d+)px['"]|(\d+))/g;
  let match;
  const largeWidths: number[] = [];
  while ((match = fixedWidthRegex.exec(content)) !== null) {
    const valStr = match[1] || match[2];
    const val = parseInt(valStr, 10);
    if (val >= 400) {
      largeWidths.push(val);
    }
  }

  if (largeWidths.length > 0) {
    const uniqueWidths = Array.from(new Set(largeWidths));
    diagnostics.push(`📏 Dimensiones fijas: Se encontraron anchos fijos de ${uniqueWidths.map(w => `${w}px`).join(', ')} en estilos en línea, lo que restringe la adaptación en pantallas móviles (típicamente de 320px a 480px).`);
    score -= Math.min(35, largeWidths.length * 10);
  }

  // 2. Table check: is there a <table element without overflow container?
  if (content.includes('<table')) {
    const hasOverflow = content.includes('overflowX') || content.includes("overflow: 'auto'") || content.includes('overflow: "auto"') || content.includes('overflowX: "auto"');
    if (!hasOverflow) {
      diagnostics.push(`📊 Tablas sin contenedor adaptable: Se detectaron etiquetas \`<table\` pero no se encontró un contenedor con desbordamiento horizontal (\`overflowX: 'auto'\`), lo que puede provocar que las columnas se desborden de la pantalla.`);
      score -= 20;
    }
  }

  // 3. CSS Grid hardcoded column layouts:
  const gridRegex = /gridTemplateColumns\s*:\s*['"]([^'"]+)['"]/g;
  let gridMatch;
  let hasFixedGrid = false;
  let hasRigidMinMax = false;
  while ((gridMatch = gridRegex.exec(content)) !== null) {
    const gridVal = gridMatch[1];
    if ((gridVal.includes('repeat') && /\d+/.test(gridVal) && !gridVal.includes('auto-fit') && !gridVal.includes('auto-fill')) ||
        (gridVal.split(/\s+/).length > 2 && !gridVal.includes('auto-fit') && !gridVal.includes('auto-fill'))) {
      hasFixedGrid = true;
    }
    // Detección de minmax() rígido sin min(100%, ...)
    if (gridVal.match(/minmax\(\s*\d+px/)) {
      hasRigidMinMax = true;
    }
  }
  if (hasFixedGrid) {
    diagnostics.push(`🧩 Rejillas rígidas (Grid): Se detectaron columnas de Grid fijas en estilos en línea. Se recomienda usar la sintaxis responsiva \`repeat(auto-fit, minmax(min(100%, 280px), 1fr))\` o definir comportamientos según el tamaño de la pantalla.`);
    score -= 15;
  }
  if (hasRigidMinMax) {
    diagnostics.push(`⚠️ Rejillas Grid desbordantes (minmax): Se detectó el uso de \`minmax(Xpx, 1fr)\` puro. En pantallas de móviles estrechas, esto forzará un ancho mínimo fijo y provocará scroll horizontal incontrolado. Se debe reemplazar OBLIGATORIAMENTE por \`minmax(min(100%, Xpx), 1fr)\` para garantizar que la tarjeta se encoja si la pantalla es más pequeña.`);
    score -= 15;
  }

  // 4. Flex container wrapping:
  if (content.includes("display: 'flex'") || content.includes('display: "flex"')) {
    const hasWrap = content.includes('flexWrap') || content.includes('flexDirection') || content.includes('flex-wrap');
    if (!hasWrap) {
      diagnostics.push(`🔄 Flexbox sin envoltura: Se detectó \`display: 'flex'\` sin especificación de \`flexWrap\` ni de dirección dinámica, lo que puede causar desbordamientos horizontales en dispositivos pequeños.`);
      score -= 15;
    }
  }

  // 5. Absence of responsiveness helpers:
  const hasMediaQueries = content.includes('@media');
  const hasResponsiveHooks = content.includes('useWindowSize') || content.includes('innerWidth') || content.includes('useMediaQuery') || content.includes('isMobile');
  if (!hasMediaQueries && !hasResponsiveHooks) {
    diagnostics.push(`📱 Sin lógica responsiva: No se encontraron consultas de medios (@media) ni hooks/variables de visualización responsivos (\`useWindowSize\`, \`innerWidth\`, etc.).`);
    score -= 15;
  }

  score = Math.max(0, score);
  const isResponsive = score >= 85;

  let improvementsForAgent = '';
  if (diagnostics.length > 0 && score < 100) {
    improvementsForAgent = `Antigravity, optimiza la responsividad móvil del dashboard en 'src/app/dashboard/${relPath}' respetando la Regla 16 de la Biblia. Corrige los siguientes hallazgos:
`;
    diagnostics.forEach((diag, index) => {
      improvementsForAgent += `${index + 1}. ${diag.replace(/^[^\w\s]*\s*/, '')}\n`;
    });
    improvementsForAgent += `
Instrucciones adicionales:
- Envuelve las tablas en contenedores scrollable (ej. \`<div style={{ overflowX: 'auto', width: '100%' }}>\`).
- Convierte anchos fijos de píxeles grandes en valores porcentuales (\`100%\`) o auto-ajustables.
- Aplica \`flexWrap: 'wrap'\` en contenedores Flexbox.
- Modifica rejillas Grid para usar \`repeat(auto-fit, minmax(min(100%, 280px), 1fr))\`.
- Si es necesario, implementa lógica dinámica usando un hook de tamaño de ventana.`;
  } else {
    improvementsForAgent = `Antigravity, el análisis estático no detectó problemas mayores de responsividad en 'src/app/dashboard/${relPath}'. Realiza una inspección general del dashboard en busca de micro-interacciones, márgenes o paddings que se puedan optimizar para teléfonos móviles.`;
  }

  return {
    isResponsive,
    score,
    diagnostics: diagnostics.length > 0 ? diagnostics : ['✅ No se detectaron problemas evidentes de responsividad en el análisis estático.'],
    improvementsForAgent
  };
}

export async function GET(request: Request) {
  const user = await authenticateSuperadmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const relPath = searchParams.get('path'); // e.g. "perfil/page.tsx"

  if (!relPath) {
    return NextResponse.json({ error: 'Parámetro path requerido' }, { status: 400 });
  }

  // Safety: only allow files inside src/app/dashboard
  const safePath = relPath.replace(/\.\./g, '').replace(/\\/g, '/');
  const fullPath = path.join(process.cwd(), 'src', 'app', 'dashboard', safePath);

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');
    const totalLines = lines.length;

    // Count metrics
    const useStateCount   = (content.match(/useState\s*[<(]/g) || []).length;
    const useEffectCount  = (content.match(/useEffect\s*\(/g) || []).length;
    const useMemoCount    = (content.match(/useMemo\s*\(/g) || []).length;
    const useCallbackCount= (content.match(/useCallback\s*\(/g) || []).length;
    const fetchCallCount  = (content.match(/fetch\s*\(/g) || []).length;
    const functionCount   = (content.match(/(?:const|function)\s+\w+\s*=?\s*(?:async\s*)?\(/g) || []).length;
    const jsxBlockCount   = (content.match(/return\s*\(\s*\n?\s*</g) || []).length;
    const componentLike   = (content.match(/<[A-Z][A-Za-z]+/g) || []).length;
    const commentedLines  = lines.filter(l => l.trim().startsWith('//')).length;
    const todoCount       = (content.match(/TODO|FIXME|HACK/g) || []).length;

    // Build refactor plan based on metrics
    const plan: string[] = [];

    if (useStateCount > 8) {
      plan.push(`🪝 Extraer ${useStateCount} useState (y sus handlers relacionados) a un Custom Hook personalizado (ej. \`use${path.basename(relPath, '/page.tsx').replace(/\b\w/g, c => c.toUpperCase())}State.ts\`).`);
    }
    if (useEffectCount > 3) {
      plan.push(`⚙️ Dividir ${useEffectCount} useEffect en hooks especializados por responsabilidad (carga de datos, listeners, sincronización).`);
    }
    if (fetchCallCount > 4) {
      plan.push(`🌐 Extraer las ${fetchCallCount} llamadas a la API a un módulo de servicios en \`src/lib/api/\` para centralizar la lógica de red.`);
    }
    if ((jsxBlockCount > 1 && totalLines > 150) || totalLines > 800) {
      plan.push(`🧩 Identificar bloques JSX autocontenidos (+50 líneas) y extraerlos como componentes en \`src/components/\`.`);
    }
    if (componentLike > 15) {
      plan.push(`📦 Revisar los ${componentLike} componentes React usados: agrupar los relacionados en un barrel index para simplificar imports.`);
    }
    if (todoCount > 0) {
      plan.push(`📝 Hay ${todoCount} marcadores TODO/FIXME en el código. Revisarlos y resolverlos o convertirlos en tareas del panel de Asuntos Pendientes.`);
    }
    if (useMemoCount === 0 && totalLines > 1000) {
      plan.push(`⚡ Considerar añadir useMemo/useCallback en cálculos costosos para evitar re-renders innecesarios dado el tamaño del componente.`);
    }
    if (plan.length === 0) {
      plan.push('✅ El archivo está en buen estado relativo. No se detectan refactorizaciones urgentes.');
    }

    let expandedContent = content;
    const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"](\.\/[^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      try {
        const compPath = path.join(path.dirname(fullPath), match[1] + '.tsx');
        if (fs.existsSync(compPath)) {
          expandedContent += '\n' + fs.readFileSync(compPath, 'utf8');
        }
      } catch (e) {}
    }

    const responsiveness = analyzeResponsiveness(expandedContent, relPath);
    const premium = analyzePremium(expandedContent, relPath);

    return NextResponse.json({
      file: relPath,
      totalLines,
      metrics: {
        useState: useStateCount,
        useEffect: useEffectCount,
        useMemo: useMemoCount,
        useCallback: useCallbackCount,
        fetchCalls: fetchCallCount,
        functions: functionCount,
        jsxBlocks: jsxBlockCount,
        componentRefs: componentLike,
        commentedLines,
        todos: todoCount,
      },
      plan,
      responsiveness,
      premium
    });
  } catch (error: any) {
    console.error('Error al analizar archivo:', error);
    return NextResponse.json({ error: 'Error al analizar el archivo' }, { status: 500 });
  }
}
