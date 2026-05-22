const fs = require('fs');
const pagePath = 'src/app/dashboard/cultivos/[id]/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add expandedPhases state
const expandedStateTarget = `  const [expandedPautas, setExpandedPautas] = useState<number[]>([]);`;
const expandedStateReplacement = `  const [expandedPautas, setExpandedPautas] = useState<number[]>([]);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);`;

if (content.includes(expandedStateTarget) && !content.includes('expandedPhases')) {
    content = content.replace(expandedStateTarget, expandedStateReplacement);
}

// 2. Fix the phase expansion logic
content = content.replace(/expandedPautas\.includes\(phase\.hashCode\?\.\(\) \|\| phase\.length\)/g, "expandedPhases.includes(phase)");
content = content.replace(/setExpandedPautas\(prev => prev\.includes\(phase\.hashCode\?\.\(\) \|\| phase\.length\) \? prev\.filter\(id => id !== \(phase\.hashCode\?\.\(\) \|\| phase\.length\)\) : \[\.\.\.prev, phase\.hashCode\?\.\(\) \|\| phase\.length\]\)/g, 
  "setExpandedPhases(prev => prev.includes(phase) ? prev.filter(p => p !== phase) : [...prev, phase])");

fs.writeFileSync(pagePath, content);
console.log('TypeScript error fixed!');
