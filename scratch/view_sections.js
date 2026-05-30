const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const lines = code.split('\n');

console.log('=== SECTIONS IN DASHBOARD HOME ===');
lines.forEach((line, idx) => {
  if (idx >= 800 && idx < 2000) {
    if (line.includes('<h3') || line.includes('className="card-') || line.includes('className="dashboard-') || line.includes('className="welcome-card"') || line.includes('grid') || line.includes('Flex')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
