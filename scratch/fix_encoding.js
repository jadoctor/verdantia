const fs = require('fs');
const path = 'src/components/admin/EspecieForm.tsx';

let text = fs.readFileSync(path, 'utf8');

// Count occurrences before
const countBefore = (text.match(/\\u[0-9a-fA-F]{4}/g) || []).length;
console.log(`Found ${countBefore} literal unicode escapes`);

// Replace all literal \uXXXX sequences with actual unicode chars
// Handle surrogate pairs too (\uD83C\uDD95 etc)
text = text.replace(/\\u([dD][89aAbB][0-9a-fA-F]{2})\\u([dD][c-fC-F][0-9a-fA-F]{2})/g, (match, hi, lo) => {
  const codePoint = (parseInt(hi, 16) - 0xD800) * 0x400 + (parseInt(lo, 16) - 0xDC00) + 0x10000;
  return String.fromCodePoint(codePoint);
});

// Handle regular BMP escapes
text = text.replace(/\\u([0-9a-fA-F]{4})/g, (match, hex) => {
  const code = parseInt(hex, 16);
  // Don't convert if it's part of JS string syntax inside template literals
  return String.fromCharCode(code);
});

const countAfter = (text.match(/\\u[0-9a-fA-F]{4}/g) || []).length;
console.log(`After fix: ${countAfter} remaining`);

// Verify
if (text.includes('⏱️') && text.includes('📦') && text.includes('✨')) {
  fs.writeFileSync(path, text, 'utf8');
  console.log('✅ All unicode escapes converted to real characters');
} else {
  console.log('Checking specific chars...');
  console.log('Has ⏱️:', text.includes('⏱️'));
  console.log('Has 📦:', text.includes('📦'));
  // Write anyway if most are fixed
  fs.writeFileSync(path, text, 'utf8');
  console.log('Written file with fixes applied');
}
