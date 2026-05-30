const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/page.tsx', 'utf8');
const lines = code.split('\n');

console.log('=== FINDING Home JSX References (above 1000) ===');
lines.forEach((line, idx) => {
  if (idx >= 1000) {
    if (line.includes('activeCrops') || line.includes('misCultivos') || line.includes('dashboard-grid') || line.includes('<h3>🌱') || line.includes('className="dashboard-content"') || line.includes('className="welcome-card"')) {
      console.log(`Line ${idx + 1}: ${line.trim()}`);
    }
  }
});
