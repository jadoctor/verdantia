const fs = require('fs');
const code = fs.readFileSync('src/app/dashboard/perfil/page.tsx', 'utf8');
const lines = code.split('\n');

console.log('=== FINDING Tab References ===');
lines.forEach((line, idx) => {
  if (line.includes('activeTab') || line.includes('setActiveTab') || line.includes('TabButton') || line.includes('className="profile-tab')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
