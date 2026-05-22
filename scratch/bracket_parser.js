const fs = require('fs');
const content = fs.readFileSync('scratch/snippets.txt', 'utf8');

// Find the start of the interface
const startIndex = content.lastIndexOf('interface GestorProps {');
if (startIndex === -1) {
    console.error('Could not find GestorProps');
    process.exit(1);
}

// We need to parse from startIndex forward. We have to be careful with JSON escaping.
// First, since snippets.txt is a dump of the raw args.ReplacementContent, it might be heavily escaped.
// Let's just find the start, and extract until the matching closing brace of GestorFotosLaborModal.

let code = content.substring(startIndex);
// The code might end with quotes or other JSON artifacts, but let's try to unescape it first if it's escaped.
// We'll replace \n with newline, \" with "
code = code.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');

// Now, let's find 'function GestorFotosLaborModal'
const funcStart = code.indexOf('function GestorFotosLaborModal');
const firstBrace = code.indexOf('{', funcStart);

let depth = 0;
let endIndex = -1;
let inString = false;
let stringChar = '';

for (let i = firstBrace; i < code.length; i++) {
    const char = code[i];
    
    // Naive string matching to avoid counting braces inside strings
    if ((char === '"' || char === "'" || char === '`') && code[i-1] !== '\\') {
        if (!inString) {
            inString = true;
            stringChar = char;
        } else if (char === stringChar) {
            inString = false;
        }
    }
    
    if (!inString) {
        if (char === '{') depth++;
        if (char === '}') {
            depth--;
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
    }
}

if (endIndex !== -1) {
    const extracted = code.substring(0, endIndex + 1);
    fs.writeFileSync('scratch/final_modal.tsx', extracted);
    console.log('Successfully extracted ' + extracted.length + ' bytes!');
} else {
    console.error('Could not find matching brace.');
}
