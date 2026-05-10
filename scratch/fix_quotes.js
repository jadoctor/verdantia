const fs = require('fs');
let code = fs.readFileSync('src/components/admin/SharedMediaUploader.tsx', 'utf8');

// The issue was:
// code = code.replace(/'\/api\/admin\/\$\{entityType\}/g, '`/api/admin/${entityType}');
// It resulted in things like: fetch(`/api/admin/${entityType}/.../photos') with mixed quotes!
// Let's just fix mixed quotes globally!
code = code.replace(/`(\/api\/admin\/\$\{entityType\}[^']*)'/g, "`$1`");

// Some lines had `fetch('/api/admin/especies')` which became `fetch(`/api/admin/${entityType}')`
code = code.replace(/`(\/api\/admin\/\$\{entityType\})'/g, "`$1`");

// Let's also remove any unresolved `{/* BLOGS */}` or syntax fragments.
// And missing `<div>`s!
// In `gen_media_absolute.js` I extracted `modales1`, `modales2`, `modales3`.
// Let's check if the file compiles after fixing quotes.

fs.writeFileSync('src/components/admin/SharedMediaUploader.tsx', code);
