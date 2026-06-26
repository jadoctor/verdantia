const fs = require('fs');
const path = './src/app/dashboard/layout.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replace routes object
content = content.replace(/'\/dashboard\/admin\/plagas': { label: 'Plagas y Enf\. Globales', icon: '🐛' },/g, `'/dashboard/admin/afecciones': { label: 'Afecciones Globales', icon: '🦠' },\n    '/dashboard/admin/tratamientos': { label: 'Tratamientos Globales', icon: '🧪' },`);

// Replace hover condition
content = content.replace(/\|\| pathname\.includes\('\/admin\/plagas'\)/g, `|| pathname.includes('/admin/afecciones') || pathname.includes('/admin/tratamientos')`);

// Replace link
content = content.replace(/<a href="\/dashboard\/admin\/plagas" className={`nav-item \${isActive\('\/dashboard\/admin\/plagas'\)}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🐛 Plagas y Enf\. Globales<\/a>/g, `<a href="/dashboard/admin/afecciones" className={\`nav-item \${isActive('/dashboard/admin/afecciones')}\`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🦠 Afecciones Globales</a>\n                      <a href="/dashboard/admin/tratamientos" className={\`nav-item \${isActive('/dashboard/admin/tratamientos')}\`} style={{ fontSize: '0.85rem', padding: '6px 12px' }} onClick={handleNavClick}>🧪 Tratamientos Globales</a>`);

fs.writeFileSync(path, content, 'utf8');
console.log('Layout replaced successfully!');
