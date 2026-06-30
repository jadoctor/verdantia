const fs = require('fs');
let content = fs.readFileSync('to-inject.tsx', 'utf8');

// remove lines that define loading, isFormDirty, isDirty
content = content.replace(/const isFormDirty =.*\n/g, '');
content = content.replace(/const isDirty =.*\n/g, '');
content = content.replace(/const \[loading, setLoading\].*\n/g, '');

fs.writeFileSync('to-inject.tsx', content);
console.log("Cleaned to-inject.tsx");
