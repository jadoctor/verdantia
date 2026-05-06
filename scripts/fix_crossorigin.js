const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  const newContent = content.replace(/<img([^>]+)>/gi, (match, p1) => {
    if (p1.includes('getMediaUrl(') && !p1.includes('crossOrigin')) {
      changed = true;
      if (p1.trim().endsWith('/')) {
        return `<img${p1.substring(0, p1.lastIndexOf('/'))} crossOrigin="anonymous" />`;
      } else {
        return `<img${p1} crossOrigin="anonymous">`;
      }
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated:', file);
  }
});
