const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src'));
let changedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match minmax(Xpx, 1fr) or similar.
  // Avoid already minmax(min(100%, Xpx), 1fr) by restricting the first arg.
  const regex = /minmax\(\s*([0-9]+[a-zA-Z%]+)\s*,\s*1fr\s*\)/g;
  
  if (regex.test(content)) {
    const newContent = content.replace(regex, 'minmax(min(100%, $1), 1fr)');
    if (newContent !== content) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated ${file}`);
      changedCount++;
    }
  }
});

console.log(`Total files updated: ${changedCount}`);
