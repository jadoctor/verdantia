const fs = require('fs');

let code = fs.readFileSync('src/components/admin/SharedMediaUploader.tsx', 'utf8');

// Replace API endpoints
code = code.split("fetch(`/api/admin/especies/${especieId}").join("fetch(`/api/admin/${entityType}/${entityId}");
code = code.split("fetch(`/api/admin/especies/${especieId}/").join("fetch(`/api/admin/${entityType}/${entityId}/");
code = code.split("fetch(`/api/admin/especies/").join("fetch(`/api/admin/${entityType}/");
code = code.split("fetch('/api/admin/especies'").join("fetch(`/api/admin/${entityType}`");
code = code.split("'/api/admin/especies/'").join("`/api/admin/${entityType}/`");

// Replace especieId -> entityId globally
code = code.split('especieId').join('entityId');

fs.writeFileSync('src/components/admin/SharedMediaUploader.tsx', code);
console.log('Replaced entities safely.');
