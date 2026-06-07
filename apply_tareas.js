const fs = require('fs');
const path = 'src/app/dashboard/page.tsx';
let content = fs.readFileSync(path, 'utf8');
let changes = 0;

// --- 1. Import WheatSeedIcon if missing ---
if (!content.includes("WheatSeedIcon")) {
  content = content.replace(
    /import RangoBadge from '@\/components\/ui\/RangoBadge';/,
    "import RangoBadge from '@/components/ui/RangoBadge';\nimport WheatSeedIcon from '@/components/ui/WheatSeedIcon';"
  );
  console.log('✅ Import WheatSeedIcon añadido');
  changes++;
}

// --- 2. Replace seed bank icon (📦 → WheatSeedIcon) ---
const oldSeedIcon = /<div className="card-icon">&#128230;<\/div>/;
const newSeedIcon = `<div className="card-icon"><WheatSeedIcon size="2rem" /></div>`;
if (oldSeedIcon.test(content)) {
  content = content.replace(oldSeedIcon, newSeedIcon);
  console.log('✅ Icono Semillas en Banco → WheatSeedIcon');
  changes++;
}

// --- 3. Replace static "Tareas Pendientes" card ---
const tareaRegex = /<div className="stat-card">\s*<div className="card-icon">&#128203;<\/div>\s*<div className="card-info"><h3>Tareas Pendientes<\/h3><div className="value">&mdash;<\/div><\/div>\s*<\/div>/;

const newTareas = `{(() => {
              const semillasProblema = misSemillas.filter((s: any) => {
                const esActiva = s.semillasactivosino !== 0 && s.semillasactivosino !== false;
                if (!esActiva) return false;
                const caducada = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
                const sinStock = s.semillasstockactual !== null && s.semillasstockactual !== undefined && s.semillasstockactual <= 0;
                return caducada || sinStock;
              });
              return (
                <div className="stat-card" style={{ border: semillasProblema.length > 0 ? '2px solid #f59e0b' : undefined, background: semillasProblema.length > 0 ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : undefined }}>
                  <div className="card-icon">{semillasProblema.length > 0 ? '⚠️' : '✅'}</div>
                  <div className="card-info">
                    <h3>Tareas Pendientes</h3>
                    {semillasProblema.length === 0 ? (
                      <div className="value" style={{ color: '#10b981', fontSize: '0.85rem' }}>Todo al día</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                        <div style={{ fontSize: '0.72rem', color: '#92400e', fontWeight: 700 }}>{semillasProblema.length} semilla{semillasProblema.length !== 1 ? 's' : ''} a revisar:</div>
                        {semillasProblema.slice(0, 3).map((s: any, i: number) => {
                          const caducada = s.semillasfechacaducidad && new Date(s.semillasfechacaducidad) < new Date();
                          const sinStock = s.semillasstockactual !== null && s.semillasstockactual !== undefined && s.semillasstockactual <= 0;
                          let motivo = '';
                          if (caducada && sinStock) motivo = '📅 Caducada y sin stock';
                          else if (caducada) motivo = '📅 Fecha caducada';
                          else motivo = '📦 Stock agotado';
                          return (
                            <a key={i} href={\`/dashboard/semillas/\${s.idsemillas}\`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '0.75rem', padding: '6px 10px', background: 'rgba(245,158,11,0.1)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.25)', textDecoration: 'none', transition: 'all 0.2s' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 700, color: '#92400e' }}>Lote #{s.semillasnumerocoleccion || s.idsemillas}</span>
                                <span style={{ fontSize: '0.65rem', color: '#b45309' }}>{motivo}</span>
                              </div>
                              <span style={{ fontSize: '0.68rem', background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, whiteSpace: 'nowrap' }}>Revisar →</span>
                            </a>
                          );
                        })}
                        {semillasProblema.length > 3 && (
                          <span style={{ fontSize: '0.68rem', color: '#b45309', fontWeight: 600, paddingLeft: '4px' }}>+ {semillasProblema.length - 3} más...</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}`;

if (tareaRegex.test(content)) {
  content = content.replace(tareaRegex, newTareas);
  console.log('✅ Tareas Pendientes → detección de semillas caducadas/sin stock');
  changes++;
} else {
  console.log('❌ No encontré Tareas Pendientes estática');
}

if (changes > 0) {
  fs.writeFileSync(path, content);
  console.log(`\n✅ ${changes} cambios aplicados`);
} else {
  console.log('\n⚠️ Sin cambios');
}
